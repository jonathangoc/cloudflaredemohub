import assert from "node:assert/strict";
import test from "node:test";
import {
  BASELINE_MODEL,
  GATEWAY_ROUTE,
  getAiGatewayStatus,
  runAiGatewayProbe,
  normalizeAiGatewayError,
  runModelInference,
} from "../src/ai-inference.ts";

const MESSAGES = [
  { role: "system" as const, content: "You are Sofia." },
  { role: "user" as const, content: "Which headphones are best for travel?" },
];

const TOOL = {
  name: "operations_get_inventory",
  description: "Get ERP inventory.",
  parameters: {
    type: "object" as const,
    properties: { sku: { type: "string", description: "ERP SKU." } },
    required: ["sku"],
  },
};

test("direct inference uses the 70B baseline and omits tools from standard chat", async () => {
  const calls: Array<{ model: string; input: Record<string, unknown> }> = [];
  const env = {
    AI: {
      run: async (model: string, input: Record<string, unknown>) => {
        calls.push({ model, input });
        return { response: "Travel answer" };
      },
    },
  };

  const result = await runModelInference(env, "standard_chat", MESSAGES);

  assert.equal(result.response, "Travel answer");
  assert.equal(calls[0]?.model, BASELINE_MODEL);
  assert.equal("tools" in calls[0].input, false);
  assert.deepEqual(getAiGatewayStatus(env, "ai.lab.example.com"), {
    mode: "direct",
    provider: "workers-ai",
    model: BASELINE_MODEL,
    request_types: ["standard_chat", "concierge"],
  });
});

test("direct standard chat can use the same 70B baseline with tools", async () => {
  let input: Record<string, unknown> | undefined;
  let selectedModel: string | undefined;
  const env = {
    AI: {
      run: async (model: string, value: Record<string, unknown>) => {
        selectedModel = model;
        input = value;
        return { tool_calls: [{ name: TOOL.name, arguments: { sku: "SKU-00001" } }] };
      },
    },
  };

  await runModelInference(env, "standard_chat", MESSAGES, [TOOL]);

  assert.equal(selectedModel, BASELINE_MODEL);
  assert.deepEqual(input?.tools, [TOOL]);
});

test("direct Concierge uses 70B without tool definitions", async () => {
  let call: { model: string; input: Record<string, unknown> } | undefined;
  const env = {
    AI: {
      run: async (model: string, input: Record<string, unknown>) => {
        call = { model, input };
        return { response: "Concierge answer" };
      },
    },
  };

  await runModelInference(env, "concierge", MESSAGES);

  assert.equal(call?.model, BASELINE_MODEL);
  assert.equal("tools" in call.input, false);
});

test("gateway inference authenticates the workload and sends server-assigned routing metadata", async () => {
  const env = {
    AI_GATEWAY_URL: "https://ai.lab.example.com/compat/chat/completions",
    MCP_CLIENT_ID: "client-id",
    MCP_CLIENT_SECRET: "client-secret",
  };
  let request: Request | undefined;
  const fetcher = async (input: RequestInfo | URL, init?: RequestInit) => {
    request = new Request(input, init);
    return Response.json({ choices: [{ message: { content: "Gateway answer" } }] });
  };

  const result = await runModelInference(env, "standard_chat", MESSAGES, [], {
    expectedGatewayHost: "ai.lab.example.com",
    fetcher,
  });
  const body = await request?.json() as Record<string, unknown>;

  assert.equal(result.response, "Gateway answer");
  assert.equal(request?.redirect, "manual");
  assert.equal(request?.headers.get("CF-Access-Client-Id"), "client-id");
  assert.equal(request?.headers.get("CF-Access-Client-Secret"), "client-secret");
  assert.deepEqual(JSON.parse(request?.headers.get("cf-aig-metadata") ?? ""), {
    agent_id: "seven-hills",
    request_type: "standard_chat",
  });
  assert.equal(body.model, GATEWAY_ROUTE);
  assert.equal("tools" in body, false);
  assert.deepEqual(getAiGatewayStatus(env, "ai.lab.example.com"), {
    mode: "gateway",
    gateway_host: "ai.lab.example.com",
    model: GATEWAY_ROUTE,
    request_types: ["standard_chat", "concierge"],
  });
});

test("gateway inference converts tool definitions and prior tool results", async () => {
  const env = {
    AI_GATEWAY_URL: "https://ai.lab.example.com/compat/chat/completions",
    MCP_CLIENT_ID: "client-id",
    MCP_CLIENT_SECRET: "client-secret",
  };
  let body: Record<string, unknown> | undefined;
  const fetcher = async (_input: RequestInfo | URL, init?: RequestInit) => {
    body = JSON.parse(String(init?.body));
    return Response.json({ choices: [{ message: { content: "Grounded answer" } }] });
  };
  const messages = [
    ...MESSAGES,
    { role: "assistant" as const, content: JSON.stringify({ name: TOOL.name, arguments: { sku: "SKU-00001" } }) },
    { role: "tool" as const, name: TOOL.name, content: "{\"quantity_on_hand\":117}" },
  ];

  await runModelInference(env, "standard_chat", messages, [TOOL], {
    expectedGatewayHost: "ai.lab.example.com",
    fetcher,
  });

  const outgoingMessages = body?.messages as Array<Record<string, unknown>>;
  const assistant = outgoingMessages[2];
  const toolMessage = outgoingMessages[3];
  const toolCalls = assistant.tool_calls as Array<Record<string, unknown>>;
  assert.equal((body?.tools as Array<Record<string, unknown>>)[0]?.type, "function");
  assert.equal((toolCalls[0]?.function as Record<string, unknown>).name, TOOL.name);
  assert.equal(toolMessage.tool_call_id, toolCalls[0]?.id);
});

test("gateway mode rejects unsafe endpoints and missing service credentials", async () => {
  assert.deepEqual(getAiGatewayStatus({ AI_GATEWAY_URL: "https://example.com/compat/chat/completions" }, "ai.lab.example.com"), {
    mode: "invalid",
    code: "AI_GATEWAY_CONFIGURATION_INVALID",
  });
  assert.deepEqual(getAiGatewayStatus({ AI_GATEWAY_URL: "https://ai.lab.example.com/compat/chat/completions" }, "ai.lab.example.com"), {
    mode: "invalid",
    code: "AI_GATEWAY_CREDENTIALS_MISSING",
  });
  assert.deepEqual(getAiGatewayStatus({
    AI_GATEWAY_URL: "https://ai.other-lab.example.com/compat/chat/completions",
    MCP_CLIENT_ID: "client-id",
    MCP_CLIENT_SECRET: "client-secret",
  }, "ai.lab.example.com"), {
    mode: "invalid",
    code: "AI_GATEWAY_CONFIGURATION_INVALID",
  });
});

test("gateway failures preserve only safe status and code details", async () => {
  const env = {
    AI_GATEWAY_URL: "https://ai.lab.example.com/compat/chat/completions",
    MCP_CLIENT_ID: "client-id",
    MCP_CLIENT_SECRET: "client-secret",
  };
  let failure: unknown;
  try {
    await runModelInference(env, "standard_chat", MESSAGES, [], {
      expectedGatewayHost: "ai.lab.example.com",
      fetcher: async () => Response.json({ errors: [{ code: 2016, message: "sensitive upstream detail" }] }, { status: 400 }),
    });
  } catch (error) {
    failure = error;
  }

  assert.deepEqual(normalizeAiGatewayError(failure), {
    status: 400,
    code: "2016",
    message: "Request blocked by model security policy",
  });
});

test("spend probe assigns fixed standard-chat metadata and custom cost", async () => {
  const env = {
    AI_GATEWAY_URL: "https://ai.lab.example.com/compat/chat/completions",
    MCP_CLIENT_ID: "client-id",
    MCP_CLIENT_SECRET: "client-secret",
  };
  let request: Request | undefined;
  const result = await runAiGatewayProbe(env, "ai.lab.example.com", "spend", {
    fetcher: async (input, init) => {
      request = new Request(input, init);
      return Response.json({ choices: [{ message: { content: "SPEND_OK" } }] });
    },
  });

  assert.deepEqual(result, { case: "spend", request: { status: 200, cache: "NONE" } });
  assert.deepEqual(JSON.parse(request?.headers.get("cf-aig-metadata") ?? ""), {
    agent_id: "seven-hills",
    request_type: "standard_chat",
  });
  assert.deepEqual(JSON.parse(request?.headers.get("cf-aig-custom-cost") ?? ""), {
    per_token_in: 1,
    per_token_out: 1,
  });
});
