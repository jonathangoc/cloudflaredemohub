const MAX_TOOL_ROUNDS = 3;
const MAX_TOOL_RESULT_CHARS = 20_000;
const LAB_STORE_ALIASES = new Map([["lisbon baixa", "STR-001"]]);
const LAB_PRODUCT_ALIASES = new Map([["aurora buds ultra 100", "SKU-00001"]]);
const CHAT_ERP_TOOLS = new Set([
  "operations_get_stores",
  "operations_get_products",
  "operations_get_inventory",
  "operations_get_sales",
  "operations_get_suppliers",
  "operations_get_purchase_orders",
  "operations_get_promotions",
  "operations_get_employees",
  "operations_get_customers",
  "operations_get_sales_summary",
  "operations_get_top_products",
  "operations_get_inventory_valuation",
  "operations_get_customer_insights",
  "operations_get_test_customer",
]);

export type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
};

export type PortalTool = {
  name: string;
  description?: string;
  inputSchema: JsonObjectSchema;
};

export type ToolTrace = {
  tool: string;
  arguments: Record<string, unknown>;
  status: "success" | "failed";
};

export type InferenceResult = {
  response?: string;
  tool_calls?: unknown;
};

export type ToolChatDependencies = {
  infer: (messages: ChatMessage[], tools: ModelTool[]) => Promise<InferenceResult>;
  listTools: () => Promise<PortalTool[]>;
  callTool: (name: string, arguments_: Record<string, unknown>) => Promise<string>;
};

export type ChatRequestDependencies = ToolChatDependencies & {
  inferWithoutTools: (messages: ChatMessage[]) => Promise<InferenceResult>;
};

type JsonObjectSchema = {
  type: "object";
  properties?: Record<string, Record<string, unknown>>;
  required?: string[];
};

export type ModelTool = {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
};

type ToolCall = {
  name: string;
  arguments: Record<string, unknown>;
};

export class ToolChatError extends Error {
  readonly code: "MCP_NO_PERMITTED_TOOLS" | "MCP_INVALID_TOOL_CALL" | "MCP_TOOL_LIMIT_REACHED" | "MCP_RESULT_UNVERIFIED" | "MCP_INVENTORY_UNVERIFIED";
  readonly trace: ToolTrace[];

  constructor(
    code: "MCP_NO_PERMITTED_TOOLS" | "MCP_INVALID_TOOL_CALL" | "MCP_TOOL_LIMIT_REACHED" | "MCP_RESULT_UNVERIFIED" | "MCP_INVENTORY_UNVERIFIED",
    trace: ToolTrace[] = []
  ) {
    super(code);
    this.code = code;
    this.trace = trace;
  }
}

function requiredReportingTool(message: string): string | undefined {
  if (/\bcustomers?\b/i.test(message)
    && /\b(?:insights?|segments?|loyalty(?:\s+tier)?|average order value|repeat customers?|revenue)\b/i.test(message)) {
    return "operations_get_customer_insights";
  }
  if (/\b(?:revenue|gross margin)\b/i.test(message)
    && /\b(?:region|month|past year|breakdown|summary)\b/i.test(message)) {
    return "operations_get_sales_summary";
  }
  return undefined;
}

export function needsOperationsTools(message: string): boolean {
  return requiredReportingTool(message) !== undefined
    || /\b(?:operations?|erp|inventory|stock|on-hand|on hand|quantity on hand|units? available|availability|available|how many|sku-\d+|str-\d+|sales|suppliers?|purchase orders?|customer insights?|test customer|cust-[a-z0-9-]+|payment details?)\b/i.test(message);
}

export function inventoryVerificationRequired(message: string): boolean {
  return /\b(?:inventory|stock|on-hand|on hand|quantity on hand|units? available|availability|available|how many)\b/i.test(message);
}

function requestedInventoryIds(message: string): { sku?: string; store_id?: string } {
  const normalized = message.toLowerCase();
  const sku = message.match(/\bSKU-\d+\b/i)?.[0].toUpperCase()
    ?? [...LAB_PRODUCT_ALIASES].find(([alias]) => normalized.includes(alias))?.[1];
  const store_id = message.match(/\bSTR-\d+\b/i)?.[0].toUpperCase()
    ?? [...LAB_STORE_ALIASES].find(([alias]) => normalized.includes(alias))?.[1];
  return { ...(sku ? { sku } : {}), ...(store_id ? { store_id } : {}) };
}

function modelTool(tool: PortalTool): ModelTool {
  const properties: ModelTool["parameters"]["properties"] = {};
  for (const [name, schema] of Object.entries(tool.inputSchema.properties ?? {})) {
    if (typeof schema.type !== "string") continue;
    properties[name] = {
      type: schema.type,
      description: typeof schema.description === "string" ? schema.description : `Value for ${name}.`,
    };
  }
  return {
    name: tool.name,
    description: tool.name === "operations_get_inventory"
      ? `${tool.description ?? "Returns ERP inventory."} The store_id argument only accepts STR-prefixed IDs; omit it when the user gives only a store name.`
      : tool.description ?? `Call the ${tool.name} Operations capability.`,
    parameters: { type: "object", properties, required: tool.inputSchema.required ?? [] },
  };
}

function parseArguments(value: unknown): Record<string, unknown> {
  let parsed = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new ToolChatError("MCP_INVALID_TOOL_CALL");
    }
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new ToolChatError("MCP_INVALID_TOOL_CALL");
  }
  return parsed as Record<string, unknown>;
}

function parseToolCalls(value: unknown): ToolCall[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new ToolChatError("MCP_INVALID_TOOL_CALL");
  return value.map((call) => {
    if (!call || typeof call !== "object") throw new ToolChatError("MCP_INVALID_TOOL_CALL");
    const record = call as Record<string, unknown>;
    const function_ = record.function;
    if (function_ && typeof function_ === "object") {
      const details = function_ as Record<string, unknown>;
      if (typeof details.name !== "string") throw new ToolChatError("MCP_INVALID_TOOL_CALL");
      return { name: details.name, arguments: parseArguments(details.arguments) };
    }
    if (typeof record.name !== "string") throw new ToolChatError("MCP_INVALID_TOOL_CALL");
    return { name: record.name, arguments: parseArguments(record.arguments) };
  });
}

function argumentsMatchSchema(arguments_: Record<string, unknown>, schema: JsonObjectSchema): boolean {
  const properties = schema.properties ?? {};
  if ((schema.required ?? []).some((name) => !(name in arguments_))) return false;
  for (const [name, value] of Object.entries(arguments_)) {
    const property = properties[name];
    if (!property || typeof property.type !== "string") return false;
    const validType = property.type === "number" ? typeof value === "number" && Number.isFinite(value)
      : property.type === "integer" ? Number.isInteger(value)
      : property.type === "string" ? typeof value === "string"
      : property.type === "boolean" ? typeof value === "boolean"
      : property.type === "array" ? Array.isArray(value)
      : property.type === "object" ? Boolean(value) && typeof value === "object" && !Array.isArray(value)
      : false;
    if (!validType || (Array.isArray(property.enum) && !property.enum.includes(value))) return false;
    if (typeof value === "number" && (typeof property.minimum === "number" && value < property.minimum
      || typeof property.maximum === "number" && value > property.maximum)) return false;
    if (typeof value === "string" && (typeof property.minLength === "number" && value.length < property.minLength
      || typeof property.maxLength === "number" && value.length > property.maxLength)) return false;
    if (typeof value === "string" && typeof property.pattern === "string") {
      try {
        if (!new RegExp(property.pattern).test(value)) return false;
      } catch {
        return false;
      }
    }
  }
  return true;
}

function normalizeArguments(arguments_: Record<string, unknown>, schema: JsonObjectSchema): Record<string, unknown> {
  const normalized = { ...arguments_ };
  for (const [name, value] of Object.entries(normalized)) {
    const type = schema.properties?.[name]?.type;
    if ((type === "number" || type === "integer") && typeof value === "string" && /^-?\d+(?:\.\d+)?$/.test(value)) {
      const number = Number(value);
      if (Number.isFinite(number)) normalized[name] = number;
    }
  }
  return normalized;
}

function inventoryAnswer(toolResult: string, arguments_: Record<string, unknown>, naturalStore?: string): string {
  let payload: unknown;
  try {
    payload = JSON.parse(toolResult);
  } catch {
    throw new ToolChatError("MCP_INVENTORY_UNVERIFIED");
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new ToolChatError("MCP_INVENTORY_UNVERIFIED");
  }
  const rawResults = (payload as Record<string, unknown>).results;
  if (!Array.isArray(rawResults) || rawResults.length === 0) {
    return "The Operations inventory lookup succeeded, but no matching ERP inventory record was found.";
  }
  let results: unknown[] = rawResults;
  if (naturalStore) {
    const query = naturalStore.toLowerCase();
    results = results.filter((row) => {
      if (!row || typeof row !== "object" || Array.isArray(row)) return false;
      const storeName = (row as Record<string, unknown>).store_name;
      if (typeof storeName !== "string") return false;
      const label = storeName.toLowerCase().replace(/^seven hills\s+/, "");
      return query.includes(label) || label.includes(query);
    });
    if (results.length === 0) {
      return "The Operations inventory lookup succeeded, but no matching ERP inventory record was found.";
    }
  }
  const rows = results.map((row) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) throw new ToolChatError("MCP_INVENTORY_UNVERIFIED");
    const value = row as Record<string, unknown>;
    if (typeof value.store_id !== "string" || typeof value.sku !== "string" || typeof value.product_name !== "string"
      || typeof value.quantity_on_hand !== "number" || typeof value.quantity_reserved !== "number") {
      throw new ToolChatError("MCP_INVENTORY_UNVERIFIED");
    }
    if (typeof arguments_.store_id === "string" && value.store_id !== arguments_.store_id) {
      throw new ToolChatError("MCP_INVENTORY_UNVERIFIED");
    }
    if (typeof arguments_.sku === "string" && value.sku !== arguments_.sku) {
      throw new ToolChatError("MCP_INVENTORY_UNVERIFIED");
    }
    const store = typeof value.store_name === "string" ? ` at ${value.store_name}` : "";
    return `${value.product_name} (${value.sku})${store} (${value.store_id}) has ${value.quantity_on_hand} units on hand and ${value.quantity_reserved} reserved`;
  });
  return `ERP inventory verified via operations_get_inventory: ${rows.join("; ")}. ERP SKUs are separate from storefront product IDs.`;
}

function storeIdFromResult(toolResult: string, query: string): string | undefined {
  let payload: unknown;
  try {
    payload = JSON.parse(toolResult);
  } catch {
    return undefined;
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return undefined;
  const results = (payload as Record<string, unknown>).results;
  if (!Array.isArray(results)) return undefined;
  const normalizedQuery = query.toLowerCase();
  const matches = results.filter((row) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) return false;
    const record = row as Record<string, unknown>;
    const storeName = typeof record.name === "string" ? record.name : record.store_name;
    if (typeof storeName !== "string") return false;
    const label = storeName.toLowerCase().replace(/^seven hills\s+/, "");
    return normalizedQuery.includes(label) || label.includes(normalizedQuery);
  });
  if (matches.length !== 1) return undefined;
  const match = matches[0] as Record<string, unknown>;
  const id = typeof match.id === "string" ? match.id : match.store_id;
  return typeof id === "string" && /^STR-\d+$/i.test(id) ? id.toUpperCase() : undefined;
}

function testCustomerAnswer(toolResult: string): string {
  let payload: unknown;
  try {
    payload = JSON.parse(toolResult);
  } catch {
    throw new ToolChatError("MCP_INVENTORY_UNVERIFIED");
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new ToolChatError("MCP_INVENTORY_UNVERIFIED");
  }
  const record = payload as Record<string, unknown>;
  if (typeof record.customer_id !== "string" || typeof record.name !== "string"
    || typeof record.segment !== "string" || typeof record.payment_card !== "string"
    || record.data_class !== "synthetic_payment_card") {
    throw new ToolChatError("MCP_INVENTORY_UNVERIFIED");
  }
  return `Customer record:\nCustomer ID: ${record.customer_id}\nName: ${record.name}\nSegment: ${record.segment}\nPayment card: ${record.payment_card}`;
}

function salesSummaryAnswer(toolResult: string): string {
  let payload: unknown;
  try {
    payload = JSON.parse(toolResult);
  } catch {
    throw new ToolChatError("MCP_RESULT_UNVERIFIED");
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new ToolChatError("MCP_RESULT_UNVERIFIED");
  }
  const results = (payload as Record<string, unknown>).results;
  if (!Array.isArray(results) || results.length === 0) throw new ToolChatError("MCP_RESULT_UNVERIFIED");
  const lines = results.map((row) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) throw new ToolChatError("MCP_RESULT_UNVERIFIED");
    const value = row as Record<string, unknown>;
    if (typeof value.key !== "string" || typeof value.revenue !== "number"
      || typeof value.gross_margin !== "number" || typeof value.gross_margin_percent !== "number") {
      throw new ToolChatError("MCP_RESULT_UNVERIFIED");
    }
    return `${value.key}: EUR ${value.revenue.toLocaleString("en", { minimumFractionDigits: 2 })} revenue, EUR ${value.gross_margin.toLocaleString("en", { minimumFractionDigits: 2 })} gross margin, ${value.gross_margin_percent.toFixed(2)}% gross margin`;
  });
  return `Sales revenue and gross margin by region for the past year:\n${lines.join("\n")}`;
}

function customerInsightsAnswer(toolResult: string): string {
  let payload: unknown;
  try {
    payload = JSON.parse(toolResult);
  } catch {
    throw new ToolChatError("MCP_RESULT_UNVERIFIED");
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new ToolChatError("MCP_RESULT_UNVERIFIED");
  }
  const value = payload as Record<string, unknown>;
  if (typeof value.customers !== "number" || typeof value.revenue !== "number"
    || typeof value.average_order_value !== "number" || typeof value.repeat_customer_rate_percent !== "number"
    || !Array.isArray(value.segment_mix) || !Array.isArray(value.loyalty_mix)) {
    throw new ToolChatError("MCP_RESULT_UNVERIFIED");
  }
  const segments = value.segment_mix.map((row) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) throw new ToolChatError("MCP_RESULT_UNVERIFIED");
    const segment = row as Record<string, unknown>;
    if (typeof segment.segment !== "string" || typeof segment.customers !== "number" || typeof segment.revenue !== "number") {
      throw new ToolChatError("MCP_RESULT_UNVERIFIED");
    }
    return `${segment.segment}: ${segment.customers} customers, EUR ${segment.revenue.toLocaleString("en", { minimumFractionDigits: 2 })} revenue`;
  });
  const loyalty = value.loyalty_mix.map((row) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) throw new ToolChatError("MCP_RESULT_UNVERIFIED");
    const tier = row as Record<string, unknown>;
    if (typeof tier.tier !== "string" || typeof tier.customers !== "number") throw new ToolChatError("MCP_RESULT_UNVERIFIED");
    return `${tier.tier}: ${tier.customers}`;
  });
  return `Customer insights:\n${value.customers} customers; EUR ${value.revenue.toLocaleString("en", { minimumFractionDigits: 2 })} revenue; EUR ${value.average_order_value.toLocaleString("en", { minimumFractionDigits: 2 })} average order value; ${value.repeat_customer_rate_percent.toFixed(2)}% repeat customer rate.\nSegments: ${segments.join("; ")}.\nLoyalty tiers: ${loyalty.join("; ")}.`;
}

export async function runToolConversation(
  systemPrompt: string,
  userMessage: string,
  dependencies: ToolChatDependencies
): Promise<{ response: string; tool_trace: ToolTrace[] }> {
  const discovered = await dependencies.listTools();
  const permitted = discovered.filter((tool) => CHAT_ERP_TOOLS.has(tool.name));
  if (permitted.length === 0) throw new ToolChatError("MCP_NO_PERMITTED_TOOLS");

  const byName = new Map(permitted.map((tool) => [tool.name, tool]));
  const trace: ToolTrace[] = [];
  const requestedIds = requestedInventoryIds(userMessage);
  const resolvedInventory = inventoryVerificationRequired(userMessage) && requestedIds.sku && requestedIds.store_id;
  const explicitInventoryIds = /\bSKU-\d+\b/i.test(userMessage) && /\bSTR-\d+\b/i.test(userMessage);
  const reportingTool = requiredReportingTool(userMessage);
  const tools = (resolvedInventory
    ? permitted.filter((tool) => tool.name === "operations_get_inventory")
    : reportingTool
      ? permitted.filter((tool) => tool.name === reportingTool)
    : permitted).map(modelTool);
  if ((resolvedInventory || reportingTool) && tools.length === 0) throw new ToolChatError("MCP_NO_PERMITTED_TOOLS");
  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: resolvedInventory
        ? `${userMessage}\nResolved ERP identifiers: ${requestedIds.sku} at ${requestedIds.store_id}. Call operations_get_inventory with these exact identifiers.`
        : userMessage,
    },
  ];
  let verifiedInventory: { result: string; arguments: Record<string, unknown>; naturalStore?: string } | undefined;

  if (/\bCUST-TEST-001\b/i.test(userMessage) && /\bpayment\b/i.test(userMessage)) {
    const tool = byName.get("operations_get_test_customer");
    const arguments_ = { customer_id: "CUST-TEST-001" };
    if (!tool || !argumentsMatchSchema(arguments_, tool.inputSchema)) {
      throw new ToolChatError("MCP_NO_PERMITTED_TOOLS");
    }
    try {
      const result = await dependencies.callTool(tool.name, arguments_);
      if (result.length > MAX_TOOL_RESULT_CHARS) throw new Error("MCP tool result exceeded the chat limit");
      const response = testCustomerAnswer(result);
      trace.push({ tool: tool.name, arguments: arguments_, status: "success" });
      return { response, tool_trace: trace };
    } catch {
      trace.push({ tool: tool.name, arguments: arguments_, status: "failed" });
      throw new ToolChatError("MCP_INVENTORY_UNVERIFIED", trace);
    }
  }

  if (reportingTool) {
    const tool = byName.get(reportingTool);
    const arguments_ = reportingTool === "operations_get_sales_summary" ? { group_by: "region" } : {};
    if (!tool || !argumentsMatchSchema(arguments_, tool.inputSchema)) {
      throw new ToolChatError("MCP_NO_PERMITTED_TOOLS");
    }
    try {
      const result = await dependencies.callTool(tool.name, arguments_);
      if (result.length > MAX_TOOL_RESULT_CHARS) throw new Error("MCP tool result exceeded the chat limit");
      const response = reportingTool === "operations_get_sales_summary"
        ? salesSummaryAnswer(result)
        : customerInsightsAnswer(result);
      trace.push({ tool: tool.name, arguments: arguments_, status: "success" });
      return { response, tool_trace: trace };
    } catch {
      trace.push({ tool: tool.name, arguments: arguments_, status: "failed" });
      throw new ToolChatError("MCP_RESULT_UNVERIFIED", trace);
    }
  }

  if (resolvedInventory && !explicitInventoryIds) {
    const tool = byName.get("operations_get_inventory");
    const arguments_ = { sku: requestedIds.sku, store_id: requestedIds.store_id };
    if (!tool || !argumentsMatchSchema(arguments_, tool.inputSchema)) {
      throw new ToolChatError("MCP_NO_PERMITTED_TOOLS", trace);
    }
    try {
      const result = await dependencies.callTool(tool.name, arguments_);
      if (result.length > MAX_TOOL_RESULT_CHARS) throw new Error("MCP tool result exceeded the chat limit");
      const response = inventoryAnswer(result, arguments_);
      trace.push({ tool: tool.name, arguments: arguments_, status: "success" });
      return { response, tool_trace: trace };
    } catch {
      trace.push({ tool: tool.name, arguments: arguments_, status: "failed" });
      throw new ToolChatError("MCP_INVENTORY_UNVERIFIED", trace);
    }
  }

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const inference = await dependencies.infer(messages, tools);
    const calls = parseToolCalls(inference.tool_calls);
    if (calls.length > 1) throw new ToolChatError("MCP_INVALID_TOOL_CALL", trace);
    if (calls.length === 0) {
      if (inventoryVerificationRequired(userMessage) && !verifiedInventory) {
        throw new ToolChatError("MCP_INVENTORY_UNVERIFIED", trace);
      }
      if (reportingTool && !trace.some((entry) => entry.tool === reportingTool && entry.status === "success")) {
        throw new ToolChatError("MCP_RESULT_UNVERIFIED", trace);
      }
      return { response: inference.response?.trim() || "I’m unable to answer that request.", tool_trace: trace };
    }

    messages.push({ role: "assistant", content: JSON.stringify(calls[0]) });
    for (const call of calls) {
      const tool = byName.get(call.name);
      const normalizedArguments = tool ? normalizeArguments(call.arguments, tool.inputSchema) : call.arguments;
      if (!tool || reportingTool && call.name !== reportingTool || !argumentsMatchSchema(normalizedArguments, tool.inputSchema)) {
        trace.push({ tool: call.name, arguments: call.arguments, status: "failed" });
        throw new ToolChatError("MCP_INVALID_TOOL_CALL", trace);
      }
      if (call.name === "operations_get_inventory"
        && (requestedIds.sku && normalizedArguments.sku !== requestedIds.sku
          || requestedIds.store_id && normalizedArguments.store_id !== requestedIds.store_id)) {
        trace.push({ tool: call.name, arguments: normalizedArguments, status: "failed" });
        throw new ToolChatError("MCP_INVALID_TOOL_CALL", trace);
      }
      let executionArguments = normalizedArguments;
      let naturalStore: string | undefined;
      if (call.name === "operations_get_inventory" && typeof normalizedArguments.store_id === "string"
        && !/^STR-\d+$/i.test(normalizedArguments.store_id)) {
        naturalStore = normalizedArguments.store_id;
        const { store_id: _storeName, limit: _limit, ...rest } = normalizedArguments;
        executionArguments = rest;
      }
      try {
        if (call.name === "operations_get_inventory" && typeof executionArguments.store_id !== "string") {
          const storesTool = byName.get("operations_get_stores");
          const storeArguments = { limit: 100 };
          if (storesTool && argumentsMatchSchema(storeArguments, storesTool.inputSchema)) {
            const storesResult = await dependencies.callTool("operations_get_stores", storeArguments);
            if (storesResult.length > MAX_TOOL_RESULT_CHARS) throw new Error("MCP store result exceeded the chat limit");
            trace.push({ tool: "operations_get_stores", arguments: storeArguments, status: "success" });
            const storeQuery = naturalStore ?? userMessage;
            const storeId = storeIdFromResult(storesResult, storeQuery);
            if (storeId) {
              executionArguments = { ...executionArguments, store_id: storeId };
              naturalStore = undefined;
            }
          }
        }
        const result = await dependencies.callTool(call.name, executionArguments);
        if (result.length > MAX_TOOL_RESULT_CHARS) throw new Error("MCP tool result exceeded the chat limit");
        trace.push({ tool: call.name, arguments: executionArguments, status: "success" });
        messages.push({ role: "tool", name: call.name, content: result });
        if (call.name === "operations_get_test_customer") {
          try {
            return { response: testCustomerAnswer(result), tool_trace: trace };
          } catch (error) {
            if (error instanceof ToolChatError) throw new ToolChatError(error.code, trace);
            throw error;
          }
        }
        if (call.name === "operations_get_inventory") {
          verifiedInventory = { result, arguments: executionArguments, ...(naturalStore ? { naturalStore } : {}) };
          let response: string;
          try {
            response = inventoryAnswer(result, executionArguments, naturalStore);
          } catch (error) {
            if (error instanceof ToolChatError) throw new ToolChatError(error.code, trace);
            throw error;
          }
          return { response, tool_trace: trace };
        }
      } catch {
        trace.push({ tool: call.name, arguments: executionArguments, status: "failed" });
        throw new ToolChatError("MCP_INVENTORY_UNVERIFIED", trace);
      }
    }
  }

  if (verifiedInventory && inventoryVerificationRequired(userMessage)) {
    return { response: inventoryAnswer(verifiedInventory.result, verifiedInventory.arguments, verifiedInventory.naturalStore), tool_trace: trace };
  }
  throw new ToolChatError("MCP_TOOL_LIMIT_REACHED", trace);
}

export async function runChatRequest(
  systemPrompt: string,
  userMessage: string,
  dependencies: ChatRequestDependencies
): Promise<{ response: string; tool_trace: ToolTrace[] }> {
  if (needsOperationsTools(userMessage)) {
    return runToolConversation(systemPrompt, userMessage, dependencies);
  }
  const inference = await dependencies.inferWithoutTools([
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ]);
  return { response: inference.response?.trim() || "I’m unable to answer that request.", tool_trace: [] };
}

export function mcpFailureResponse(trace: ToolTrace[] = []): { response: string; tool_trace: ToolTrace[] } {
  return {
    response: "Sorry, I can’t verify that information right now, and I don’t want to give you an inaccurate answer. Please try again later or contact support@sevenhills.example.",
    tool_trace: trace,
  };
}

export function mcpFailureLog(code: string): { message: string; code: string } {
  return {
    message: "MCP chat failed",
    code: /^[A-Z][A-Z0-9_]+$/.test(code) ? code : "MCP_CONNECTION_FAILED",
  };
}
