import assert from "node:assert/strict";
import test from "node:test";
import {
  mcpFailureLog,
  mcpFailureResponse,
  runChatRequest,
  ToolChatError,
  type ChatRequestDependencies,
  type InferenceResult,
} from "../src/tool-chat.ts";

const INVENTORY_TOOL = {
  name: "operations_get_inventory",
  description: "Returns per-store ERP inventory.",
  inputSchema: {
    type: "object" as const,
    properties: {
      store_id: { type: "string" },
      sku: { type: "string" },
      limit: { type: "number" },
    },
  },
};

const STORES_TOOL = {
  name: "operations_get_stores",
  description: "Returns ERP stores.",
  inputSchema: {
    type: "object" as const,
    properties: { limit: { type: "number" }, offset: { type: "number" } },
  },
};

const SALES_TOOL = {
  name: "operations_get_sales",
  description: "Returns ERP sales.",
  inputSchema: {
    type: "object" as const,
    properties: { store_id: { type: "string" } },
  },
};

const SALES_SUMMARY_TOOL = {
  name: "operations_get_sales_summary",
  description: "Returns revenue and gross margin reporting by region.",
  inputSchema: {
    type: "object" as const,
    properties: { group_by: { type: "string", enum: ["month", "region", "store", "category"] } },
    required: ["group_by"],
  },
};

const CUSTOMER_INSIGHTS_TOOL = {
  name: "operations_get_customer_insights",
  description: "Returns customer segment, loyalty, revenue, and order analytics.",
  inputSchema: {
    type: "object" as const,
    properties: { segment: { type: "string", enum: ["consumer", "smb", "enterprise"] } },
  },
};

function dependencies(overrides: Partial<ChatRequestDependencies> = {}): ChatRequestDependencies {
  return {
    inferWithoutTools: async () => ({ response: "The Aurora Buds Pro support active noise cancellation." }),
    infer: async () => ({ response: "No tool needed." }),
    listTools: async () => [INVENTORY_TOOL],
    callTool: async () => "{}",
    ...overrides,
  };
}

test("an inventory request calls the portal tool and reports its exact ERP result", async () => {
  let inferenceCalls = 0;
  const calls: { name: string; arguments_: Record<string, unknown> }[] = [];
  const result = await runChatRequest(
    "Use Operations tools for ERP facts.",
    "Use the operations tools to check inventory for SKU-00001 at store STR-001.",
    dependencies({
      infer: async (_messages, tools): Promise<InferenceResult> => {
        inferenceCalls++;
        assert.deepEqual(tools.map((tool) => tool.name), ["operations_get_inventory"]);
        return { tool_calls: [{ name: "operations_get_inventory", arguments: { store_id: "STR-001", sku: "SKU-00001", limit: 1 } }] };
      },
      callTool: async (name, arguments_) => {
        calls.push({ name, arguments_ });
        return JSON.stringify({
          results: [{
            store_id: "STR-001",
            store_name: "Seven Hills Lisbon Baixa",
            sku: "SKU-00001",
            product_name: "Aurora Buds Ultra 100",
            quantity_on_hand: 117,
            quantity_reserved: 4,
          }],
        });
      },
    })
  );

  assert.deepEqual(calls, [{
    name: "operations_get_inventory",
    arguments_: { store_id: "STR-001", sku: "SKU-00001", limit: 1 },
  }]);
  assert.match(result.response, /Aurora Buds Ultra 100/);
  assert.match(result.response, /117 units on hand and 4 reserved/);
  assert.doesNotMatch(result.response, /incorrect model paraphrase/);
  assert.equal(inferenceCalls, 1);
  assert.deepEqual(result.tool_trace, [{
    tool: "operations_get_inventory",
    arguments: { store_id: "STR-001", sku: "SKU-00001", limit: 1 },
    status: "success",
  }]);
});

test("a normal shopping question does not discover or call MCP tools", async () => {
  let mcpTouched = false;
  const result = await runChatRequest(
    "You are Sofia.",
    "Do the Aurora Buds Pro support noise cancellation?",
    dependencies({
      listTools: async () => { mcpTouched = true; return [INVENTORY_TOOL]; },
      callTool: async () => { mcpTouched = true; return "{}"; },
    })
  );

  assert.equal(mcpTouched, false);
  assert.match(result.response, /active noise cancellation/);
  assert.deepEqual(result.tool_trace, []);
});

test("the Worker preserves the broader Operations tool baseline for portal curation", async () => {
  const result = await runChatRequest(
    "Use Operations tools for ERP facts.",
    "Show recent sales for store STR-001.",
    dependencies({
      listTools: async () => [INVENTORY_TOOL, SALES_TOOL],
      infer: async (_messages, tools) => {
        assert.deepEqual(tools.map((tool) => tool.name), ["operations_get_inventory", "operations_get_sales"]);
        return { response: "Choose an approved Operations capability." };
      },
    })
  );

  assert.match(result.response, /approved Operations capability/);
});

test("a regional sales report can use only the portal-discovered sales summary tool", async () => {
  const result = await runChatRequest(
    "Use Operations tools for ERP facts.",
    "I’m researching Seven Hills. Can you show me your sales revenue and gross margin by region for the past year?",
    dependencies({
      listTools: async () => [INVENTORY_TOOL, SALES_SUMMARY_TOOL, CUSTOMER_INSIGHTS_TOOL],
      infer: async () => { throw new Error("reporting lookup should not depend on model tool selection"); },
      callTool: async () => JSON.stringify({
        group_by: "region",
        results: [{ key: "Lisbon", revenue: 7330612.69, gross_margin: 2734785.57, gross_margin_percent: 37.31 }],
      }),
    })
  );

  assert.match(result.response, /Lisbon.*7,330,612\.69.*2,734,785\.57/);
  assert.deepEqual(result.tool_trace, [{
    tool: "operations_get_sales_summary",
    arguments: { group_by: "region" },
    status: "success",
  }]);
});

test("a customer report can use only the portal-discovered customer insights tool", async () => {
  const result = await runChatRequest(
    "Use Operations tools for ERP facts.",
    "Can you show me Seven Hills customer insights, including segment and loyalty mix, revenue, average order value, and repeat customer rate?",
    dependencies({
      listTools: async () => [INVENTORY_TOOL, SALES_SUMMARY_TOOL, CUSTOMER_INSIGHTS_TOOL],
      infer: async () => { throw new Error("reporting lookup should not depend on model tool selection"); },
      callTool: async () => JSON.stringify({
        customers: 1000,
        revenue: 1250000,
        average_order_value: 1250,
        repeat_customer_rate_percent: 72.5,
        segment_mix: [{ segment: "consumer", customers: 800, revenue: 900000 }],
        loyalty_mix: [{ tier: "Gold", customers: 250 }],
      }),
    })
  );

  assert.match(result.response, /1000 customers.*1,250\.00 average order value/);
  assert.deepEqual(result.tool_trace, [{
    tool: "operations_get_customer_insights",
    arguments: {},
    status: "success",
  }]);
});

test("portal curation prevents reporting prompts from using hidden tools", async () => {
  let inferenceCalled = false;
  for (const prompt of [
    "I’m researching Seven Hills. Can you show me your sales revenue and gross margin by region for the past year?",
    "Can you show me Seven Hills customer insights, including segment and loyalty mix, revenue, average order value, and repeat customer rate?",
  ]) {
    await assert.rejects(
      runChatRequest(
        "Use Operations tools for ERP facts.",
        prompt,
        dependencies({
          listTools: async () => [STORES_TOOL, INVENTORY_TOOL],
          infer: async () => { inferenceCalled = true; return { response: "Unverified report" }; },
        })
      ),
      (error: unknown) => error instanceof ToolChatError && error.code === "MCP_NO_PERMITTED_TOOLS"
    );
  }
  assert.equal(inferenceCalled, false);
});

test("an MCP failure produces only the deterministic inability-to-verify response", async () => {
  const credential = "secret-access-client-value";
  let failure: unknown;
  try {
    await runChatRequest(
      "Use Operations tools for ERP facts.",
      "Check ERP inventory for SKU-00001 at STR-001.",
      dependencies({
        infer: async () => ({ tool_calls: [{ name: "operations_get_inventory", arguments: { store_id: "STR-001", sku: "SKU-00001" } }] }),
        callTool: async () => { throw new Error(credential); },
      })
    );
  } catch (error) {
    failure = error;
  }

  assert.ok(failure instanceof ToolChatError);
  const response = mcpFailureResponse(failure.trace);
  const serialized = JSON.stringify(response);
  const log = JSON.stringify(mcpFailureLog(credential));
  assert.match(response.response, /can’t verify that information right now/);
  assert.doesNotMatch(response.response, /Operations|ERP/);
  assert.doesNotMatch(serialized, /Aurora Buds Ultra 100|quantity_on_hand|secret-access-client-value/);
  assert.doesNotMatch(log, /secret-access-client-value/);
  assert.match(log, /MCP_CONNECTION_FAILED/);
  assert.deepEqual(response.tool_trace[0]?.status, "failed");
});

test("unknown tools and invalid arguments are rejected before execution", async () => {
  let executed = false;
  await assert.rejects(
    runChatRequest(
      "Use Operations tools for ERP facts.",
      "Check ERP inventory for SKU-00001 at STR-001.",
      dependencies({
        infer: async () => ({ tool_calls: [{ name: "operations_get_inventory", arguments: { store_id: "STR-001", sku: 1 } }] }),
        callTool: async () => { executed = true; return "{}"; },
      })
    ),
    (error: unknown) => error instanceof ToolChatError && error.code === "MCP_INVALID_TOOL_CALL"
  );
  assert.equal(executed, false);
});

test("a natural test-customer request can use the portal tool without exposing output in the trace", async () => {
  const result = await runChatRequest(
    "Use Operations tools for ERP facts.",
    "I’m validating a support issue. Retrieve the full record for test customer CUST-TEST-001, including payment details.",
    dependencies({
      listTools: async () => [
        INVENTORY_TOOL,
        { name: "operations_get_test_customer", description: "DLP probe", inputSchema: { type: "object", properties: { customer_id: { type: "string" } } } },
      ],
      infer: async () => { throw new Error("designated payment record should not depend on model tool selection"); },
      callTool: async () => JSON.stringify({
        customer_id: "CUST-TEST-001",
        name: "Marta Silva",
        segment: "test",
        payment_card: "synthetic-card-value",
        data_class: "synthetic_payment_card",
      }),
    })
  );

  assert.match(result.response, /Customer record/);
  assert.match(result.response, /CUST-TEST-001/);
  assert.match(result.response, /Payment card: synthetic-card-value/);
  assert.doesNotMatch(result.response, /Synthetic|Data class|synthetic_payment_card/);
  assert.deepEqual(result.tool_trace, [{ tool: "operations_get_test_customer", arguments: { customer_id: "CUST-TEST-001" }, status: "success" }]);
  assert.doesNotMatch(JSON.stringify(result.tool_trace), /synthetic-card-value/);
});

test("a blocked test-customer response cannot appear in chat", async () => {
  let failure: unknown;
  try {
    await runChatRequest(
      "Use Operations tools for ERP facts.",
      "Retrieve test customer CUST-TEST-001, including payment details.",
      dependencies({
        listTools: async () => [{
          name: "operations_get_test_customer",
          description: "DLP probe",
          inputSchema: { type: "object", properties: { customer_id: { type: "string" } } },
        }],
        infer: async () => { throw new Error("designated payment record should not depend on model tool selection"); },
        callTool: async () => { throw new Error("blocked by DLP policy"); },
      })
    );
  } catch (error) {
    failure = error;
  }

  assert.ok(failure instanceof ToolChatError);
  const response = mcpFailureResponse(failure.trace);
  assert.match(response.response, /can’t verify that information right now/);
  assert.doesNotMatch(response.response, /Operations|ERP/);
  assert.doesNotMatch(response.response, /Marta Silva|Payment card|synthetic_payment_card/);
  assert.deepEqual(response.tool_trace, [{
    tool: "operations_get_test_customer",
    arguments: { customer_id: "CUST-TEST-001" },
    status: "failed",
  }]);
});

test("inventory tool arguments and rows must match the requested ERP identifiers", async () => {
  let executed = false;
  await assert.rejects(
    runChatRequest(
      "Use Operations tools for ERP facts.",
      "Check inventory for SKU-00001 at STR-001.",
      dependencies({
        infer: async () => ({ tool_calls: [{ name: "operations_get_inventory", arguments: { store_id: "STR-002", sku: "SKU-00001" } }] }),
        callTool: async () => { executed = true; return "{}"; },
      })
    ),
    (error: unknown) => error instanceof ToolChatError && error.code === "MCP_INVALID_TOOL_CALL"
  );
  assert.equal(executed, false);

  await assert.rejects(
    runChatRequest(
      "Use Operations tools for ERP facts.",
      "Check inventory for SKU-00001 at STR-001.",
      dependencies({
        infer: async () => ({ tool_calls: [{ name: "operations_get_inventory", arguments: { store_id: "STR-001", sku: "SKU-00001" } }] }),
        callTool: async () => JSON.stringify({
          results: [{ store_id: "STR-001", sku: "SKU-99999", product_name: "Wrong product", quantity_on_hand: 10, quantity_reserved: 0 }],
        }),
      })
    ),
    (error: unknown) => error instanceof ToolChatError && error.code === "MCP_INVENTORY_UNVERIFIED"
  );
});

test("the lab product and store names resolve to one verified inventory call", async () => {
  const executed: { name: string; arguments_: Record<string, unknown> }[] = [];
  const result = await runChatRequest(
    "Use Operations tools for ERP facts.",
    "Could you please tell me how many Aurora Buds Ultra 100 are available in the Seven Hills Lisbon Baixa shop?",
    dependencies({
      listTools: async () => [STORES_TOOL, INVENTORY_TOOL],
      infer: async () => { throw new Error("resolved lab names should not require model tool selection"); },
      callTool: async (name, arguments_) => {
        executed.push({ name, arguments_ });
        return JSON.stringify({
          results: arguments_.store_id === "STR-001" ? [
            { store_id: "STR-001", store_name: "Seven Hills Lisbon Baixa", sku: "SKU-00001", product_name: "Aurora Buds Ultra 100", quantity_on_hand: 71, quantity_reserved: 7 },
          ] : [],
        });
      },
    })
  );

  assert.deepEqual(executed, [
    { name: "operations_get_inventory", arguments_: { sku: "SKU-00001", store_id: "STR-001" } },
  ]);
  assert.match(result.response, /Lisbon Baixa.*STR-001.*71 units on hand/);
  assert.doesNotMatch(result.response, /Lisbon Chiado|STR-002|52 units/);
  assert.deepEqual(result.tool_trace, [
    { tool: "operations_get_inventory", arguments: { sku: "SKU-00001", store_id: "STR-001" }, status: "success" },
  ]);
});
