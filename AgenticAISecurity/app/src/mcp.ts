import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import {
  StreamableHTTPClientTransport,
  StreamableHTTPError,
} from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { CallToolResultSchema, type CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { runToolConversation, type ChatMessage, type ModelTool } from "./tool-chat.ts";

const MCP_CLIENT_INFO = {
  name: "seven-hills-agent",
  version: "1.0.0",
} as const;

function optionalBinding(env: Env, name: string): string | undefined {
  const value: unknown = Reflect.get(env, name);
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

type McpProbeCase = "tools" | "public-inventory" | "sensitive-customer";

type McpStatus =
  | { configured: false; connected: false; code: "MCP_NOT_CONFIGURED" }
  | { configured: true; connected: false; code: "MCP_CONFIGURATION_INVALID" | "MCP_AUTH_REQUIRED" | "MCP_CONNECTION_FAILED" }
  | { configured: true; connected: true; code: "MCP_CONNECTED" };

type McpProbeResult =
  | { ok: true; path: "portal"; tool: string }
  | { ok: true; path: "portal"; tool: string; result: { store_id: "STR-001"; sku: "SKU-00001"; in_stock: true } }
  | { ok: true; path: "portal"; tool: string; sensitive_payload_received: true; data_class: "synthetic_payment_card" }
  | { ok: false; path: "portal"; code: "MCP_RESPONSE_BLOCKED_BY_DLP"; sensitive_payload_received: false };

type McpErrorCode =
  | "MCP_NOT_CONFIGURED"
  | "MCP_CONFIGURATION_INVALID"
  | "MCP_AUTH_REQUIRED"
  | "MCP_CONNECTION_FAILED"
  | "MCP_PORTAL_REQUIRED"
  | "MCP_TOOL_NOT_FOUND"
  | "MCP_TOOL_CALL_FAILED"
  | "MCP_UNEXPECTED_RESPONSE";

class McpOperationError extends Error {
  readonly code: McpErrorCode;

  constructor(code: McpErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

function connectionError(error: unknown): McpOperationError {
  if (error instanceof McpOperationError) return error;
  if (error instanceof StreamableHTTPError && (error.code === 401 || error.code === 403)) {
    return new McpOperationError("MCP_AUTH_REQUIRED", "MCP authentication failed");
  }
  return new McpOperationError("MCP_CONNECTION_FAILED", "MCP connection failed");
}

function resolvePortalTool(toolNames: string[], originalName: string): string {
  const portalName = `operations_${originalName}`;
  if (toolNames.includes(portalName)) return portalName;
  if (toolNames.includes(originalName)) {
    throw new McpOperationError("MCP_PORTAL_REQUIRED", "The MCP server must be reached through the Operations portal");
  }
  throw new McpOperationError("MCP_TOOL_NOT_FOUND", `Required MCP tool ${portalName} was not found`);
}

// Access credentials are only sent to the MCP portal that belongs to this
// deployment. The portal hostname is derived from the request hostname the same
// way the AI Gateway hostname is (`ai.<app host>`), so the lab works on any zone.
export function expectedPortalHostFor(appHostname: string): string {
  return `mcp.${appHostname}`;
}

function configuredServerUrl(env: Env, hasCredentials: boolean, expectedPortalHost: string): URL {
  const value = optionalBinding(env, "MCP_SERVER_URL");
  if (!value) throw new McpOperationError("MCP_NOT_CONFIGURED", "MCP_SERVER_URL is not configured");

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new McpOperationError("MCP_CONFIGURATION_INVALID", "MCP_SERVER_URL is invalid");
  }
  if (url.protocol !== "https:" || url.pathname !== "/mcp" || url.username || url.password || url.search || url.hash) {
    throw new McpOperationError("MCP_CONFIGURATION_INVALID", "MCP_SERVER_URL must be an HTTPS /mcp endpoint");
  }
  if (hasCredentials && url.hostname !== expectedPortalHost) {
    throw new McpOperationError("MCP_CONFIGURATION_INVALID", `Access credentials may only be sent to the lab portal at ${expectedPortalHost}`);
  }
  return url;
}

function textFromToolResult(result: CallToolResult): string {
  const text = result.content.find((item) => item.type === "text");
  if (!text || text.type !== "text") {
    throw new McpOperationError("MCP_UNEXPECTED_RESPONSE", "MCP tool did not return text content");
  }
  return text.text;
}

function parseToolJson(result: CallToolResult): Record<string, unknown> {
  let value: unknown;
  try {
    value = JSON.parse(textFromToolResult(result));
  } catch (error) {
    if (error instanceof McpOperationError) throw error;
    throw new McpOperationError("MCP_UNEXPECTED_RESPONSE", "MCP tool returned invalid JSON");
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new McpOperationError("MCP_UNEXPECTED_RESPONSE", "MCP tool returned an invalid object");
  }
  return value as Record<string, unknown>;
}

function isDlpBlock(result: CallToolResult): boolean {
  if (!result.isError) return false;
  const message = result.content
    .filter((item) => item.type === "text")
    .map((item) => item.type === "text" ? item.text : "")
    .join(" ");
  return /\bdlp\b|data loss prevention|gateway.*block|blocked by.*policy/i.test(message);
}

export async function withMcpClient<T>(
  env: Env,
  expectedPortalHost: string,
  operation: (client: Client) => Promise<T>
): Promise<T> {
  const clientId = optionalBinding(env, "MCP_CLIENT_ID");
  const clientSecret = optionalBinding(env, "MCP_CLIENT_SECRET");
  if (Boolean(clientId) !== Boolean(clientSecret)) {
    throw new McpOperationError("MCP_CONFIGURATION_INVALID", "MCP_CLIENT_ID and MCP_CLIENT_SECRET must be configured together");
  }
  const serverUrl = configuredServerUrl(env, Boolean(clientId), expectedPortalHost);

  const headers = new Headers();
  if (clientId && clientSecret) {
    headers.set("CF-Access-Client-Id", clientId);
    headers.set("CF-Access-Client-Secret", clientSecret);
  }

  const client = new Client(MCP_CLIENT_INFO, { capabilities: {} });
  const transport = new StreamableHTTPClientTransport(serverUrl, {
    requestInit: { headers },
  });

  try {
    await client.connect(transport);
    return await operation(client);
  } finally {
    await client.close();
  }
}

export async function getMcpStatus(env: Env, expectedPortalHost: string): Promise<McpStatus> {
  if (!optionalBinding(env, "MCP_SERVER_URL")) {
    return { configured: false, connected: false, code: "MCP_NOT_CONFIGURED" };
  }

  try {
    await withMcpClient(env, expectedPortalHost, (client) => client.listTools());
    return { configured: true, connected: true, code: "MCP_CONNECTED" };
  } catch (error) {
    const failure = connectionError(error);
    if (failure.code === "MCP_CONFIGURATION_INVALID") {
      return { configured: true, connected: false, code: failure.code };
    }
    if (failure.code === "MCP_AUTH_REQUIRED") {
      return { configured: true, connected: false, code: failure.code };
    }
    return { configured: true, connected: false, code: "MCP_CONNECTION_FAILED" };
  }
}

export async function runMcpProbe(env: Env, expectedPortalHost: string, probeCase: McpProbeCase): Promise<McpProbeResult> {
  return withMcpClient(env, expectedPortalHost, async (client) => {
    const { tools } = await client.listTools();
    const toolNames = tools.map((tool) => tool.name);

    if (probeCase === "tools") {
      const tool = resolvePortalTool(toolNames, "get_inventory");
      return { ok: true, path: "portal", tool };
    }

    const originalName = probeCase === "public-inventory" ? "get_inventory" : "get_test_customer";
    const tool = resolvePortalTool(toolNames, originalName);
    const arguments_ = probeCase === "public-inventory"
      ? { store_id: "STR-001", sku: "SKU-00001", limit: 1 }
      : {};
    const rawResult = await client.callTool({ name: tool, arguments: arguments_ });
    const parsedResult = CallToolResultSchema.safeParse(rawResult);
    if (!parsedResult.success) {
      throw new McpOperationError("MCP_UNEXPECTED_RESPONSE", "MCP tool returned an unsupported result");
    }
    const result = parsedResult.data;

    if (probeCase === "sensitive-customer" && isDlpBlock(result)) {
      return {
        ok: false,
        path: "portal",
        code: "MCP_RESPONSE_BLOCKED_BY_DLP",
        sensitive_payload_received: false,
      };
    }
    if (result.isError) {
      throw new McpOperationError("MCP_TOOL_CALL_FAILED", `MCP tool ${tool} returned an error`);
    }

    const data = parseToolJson(result);
    if (probeCase === "public-inventory") {
      const results = Array.isArray(data.results) ? data.results : [];
      const inventory = results[0];
      if (!inventory || typeof inventory !== "object" || Array.isArray(inventory)) {
        throw new McpOperationError("MCP_UNEXPECTED_RESPONSE", "Inventory probe returned unexpected data");
      }
      const row = inventory as Record<string, unknown>;
      if (row.store_id !== "STR-001" || row.sku !== "SKU-00001" || typeof row.quantity_on_hand !== "number" || row.quantity_on_hand <= 0) {
        throw new McpOperationError("MCP_UNEXPECTED_RESPONSE", "Inventory probe returned unexpected data");
      }
      return {
        ok: true,
        path: "portal",
        tool,
        result: { store_id: "STR-001", sku: "SKU-00001", in_stock: true },
      };
    }

    if (data.payment_card !== "4111111111111111" || data.data_class !== "synthetic_payment_card") {
      throw new McpOperationError("MCP_UNEXPECTED_RESPONSE", "Sensitive customer probe returned unexpected data");
    }
    return {
      ok: true,
      path: "portal",
      tool,
      sensitive_payload_received: true,
      data_class: "synthetic_payment_card",
    };
  });
}

export async function runMcpToolChat(
  env: Env,
  expectedPortalHost: string,
  systemPrompt: string,
  userMessage: string,
  infer: (messages: ChatMessage[], tools: ModelTool[]) => Promise<{ response?: string; tool_calls?: unknown }>
) {
  return withMcpClient(env, expectedPortalHost, async (client) => runToolConversation(systemPrompt, userMessage, {
    infer,
    listTools: async () => {
      const { tools } = await client.listTools();
      return tools.map((tool) => {
        const properties: Record<string, Record<string, unknown>> = {};
        for (const [name, schema] of Object.entries(tool.inputSchema.properties ?? {})) {
          properties[name] = { ...schema };
        }
        return {
          name: tool.name,
          ...(tool.description ? { description: tool.description } : {}),
          inputSchema: {
            type: "object" as const,
            properties,
            ...(tool.inputSchema.required ? { required: tool.inputSchema.required } : {}),
          },
        };
      });
    },
    callTool: async (name, arguments_) => {
      const rawResult = await client.callTool({ name, arguments: arguments_ });
      const parsedResult = CallToolResultSchema.safeParse(rawResult);
      if (!parsedResult.success || parsedResult.data.isError) {
        throw new McpOperationError("MCP_TOOL_CALL_FAILED", `MCP tool ${name} failed`);
      }
      return textFromToolResult(parsedResult.data);
    },
  }));
}

export function normalizeMcpError(error: unknown): { code: string; status: number } {
  const failure = connectionError(error);
  const status = failure.code === "MCP_NOT_CONFIGURED" ? 503
    : failure.code === "MCP_CONFIGURATION_INVALID" ? 500
    : failure.code === "MCP_AUTH_REQUIRED" ? 401
    : failure.code === "MCP_PORTAL_REQUIRED" ? 409
    : 502;
  return { code: failure.code, status };
}

export function isMcpProbeCase(value: unknown): value is McpProbeCase {
  return value === "tools" || value === "public-inventory" || value === "sensitive-customer";
}
