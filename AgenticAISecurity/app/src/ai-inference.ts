import type { ChatMessage, InferenceResult, ModelTool } from "./tool-chat";

export const BASELINE_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
export const GATEWAY_ROUTE = "dynamic/seven-hills-route";

export type ModelRequestType = "standard_chat" | "concierge";
export type AiGatewayProbeCase = "cache" | "burst" | "spend";

type GatewayConfig = {
  endpoint: URL;
  clientId: string;
  clientSecret: string;
};

type InferenceOptions = {
  expectedGatewayHost?: string;
  fetcher?: typeof fetch;
};

export function isAiGatewayProbeCase(value: unknown): value is AiGatewayProbeCase {
  return value === "cache" || value === "burst" || value === "spend";
}

type AiGatewayFailure = {
  status: number;
  code: string;
  message: string;
};

class AiGatewayRequestError extends Error {
  readonly status: number;
  readonly gatewayCode: string;

  constructor(status: number, gatewayCode: string) {
    super("AI_GATEWAY_REQUEST_FAILED");
    this.status = status;
    this.gatewayCode = gatewayCode;
  }
}

type GatewayMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: Array<{ id: string; type: "function"; function: { name: string; arguments: string } }> }
  | { role: "tool"; content: string; name?: string; tool_call_id: string };

function optionalBinding(env: Env, name: string): string | undefined {
  const value: unknown = Reflect.get(env, name);
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function gatewayConfig(env: Env, expectedGatewayHost?: string): GatewayConfig | undefined {
  const configuredUrl = optionalBinding(env, "AI_GATEWAY_URL");
  if (!configuredUrl) return undefined;

  let endpoint: URL;
  try {
    endpoint = new URL(configuredUrl);
  } catch {
    throw new Error("AI_GATEWAY_CONFIGURATION_INVALID");
  }
  if (endpoint.protocol !== "https:" || endpoint.pathname !== "/compat/chat/completions"
    || endpoint.username || endpoint.password || endpoint.search || endpoint.hash
    || !expectedGatewayHost || endpoint.hostname !== expectedGatewayHost) {
    throw new Error("AI_GATEWAY_CONFIGURATION_INVALID");
  }

  const clientId = optionalBinding(env, "MCP_CLIENT_ID");
  const clientSecret = optionalBinding(env, "MCP_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("AI_GATEWAY_CREDENTIALS_MISSING");
  return { endpoint, clientId, clientSecret };
}

function gatewayMessages(messages: ChatMessage[]): GatewayMessage[] {
  let pendingToolCallId: string | undefined;
  return messages.map((message, index) => {
    if (message.role === "assistant") {
      try {
        const call = JSON.parse(message.content) as { name?: unknown; arguments?: unknown };
        if (typeof call.name === "string" && call.arguments && typeof call.arguments === "object" && !Array.isArray(call.arguments)) {
          pendingToolCallId = `call_${index}`;
          return {
            role: "assistant",
            content: null,
            tool_calls: [{
              id: pendingToolCallId,
              type: "function",
              function: { name: call.name, arguments: JSON.stringify(call.arguments) },
            }],
          };
        }
      } catch {
        // A normal assistant response is not a serialized tool call.
      }
      return { role: "assistant", content: message.content };
    }
    if (message.role === "tool") {
      if (!pendingToolCallId) throw new Error("AI_GATEWAY_TOOL_SEQUENCE_INVALID");
      const toolMessage: GatewayMessage = {
        role: "tool",
        content: message.content,
        tool_call_id: pendingToolCallId,
        ...(message.name ? { name: message.name } : {}),
      };
      pendingToolCallId = undefined;
      return toolMessage;
    }
    return { role: message.role, content: message.content };
  });
}

async function readJsonResponse(response: Response): Promise<unknown> {
  const maxBytes = 1_048_576;
  const declaredLength = response.headers.get("content-length");
  if (declaredLength !== null && Number(declaredLength) > maxBytes) {
    throw new Error("AI_GATEWAY_RESPONSE_TOO_LARGE");
  }
  if (!response.body) throw new Error("AI_GATEWAY_RESPONSE_INVALID");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let body = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel();
      throw new Error("AI_GATEWAY_RESPONSE_TOO_LARGE");
    }
    body += decoder.decode(value, { stream: true });
  }
  try {
    return JSON.parse(body + decoder.decode());
  } catch {
    throw new Error("AI_GATEWAY_RESPONSE_INVALID");
  }
}

function gatewayErrorCode(payload: unknown): string {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return "AI_GATEWAY_REQUEST_FAILED";
  const record = payload as { error?: unknown; errors?: unknown };
  if (typeof record.error === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(record.error)) return record.error;
  if (Array.isArray(record.errors) && record.errors[0] && typeof record.errors[0] === "object") {
    const code = (record.errors[0] as { code?: unknown }).code;
    if ((typeof code === "string" || typeof code === "number") && /^[A-Za-z0-9_-]{1,64}$/.test(String(code))) return String(code);
  }
  return "AI_GATEWAY_REQUEST_FAILED";
}

export function normalizeAiGatewayError(error: unknown): AiGatewayFailure | undefined {
  if (error instanceof AiGatewayRequestError) {
    const blocked = ["2016", "2017", "2029"].includes(error.gatewayCode);
    return {
      status: error.status,
      code: error.gatewayCode,
      message: blocked ? "Request blocked by model security policy" : "AI Gateway request failed",
    };
  }
  if (error instanceof Error && /^AI_GATEWAY_[A-Z_]+$/.test(error.message)) {
    return {
      status: error.message.includes("CONFIGURATION") || error.message.includes("CREDENTIALS") ? 500 : 502,
      code: error.message,
      message: "AI Gateway request failed",
    };
  }
  return undefined;
}

export function getAiGatewayStatus(env: Env, expectedGatewayHost: string): object {
  try {
    const config = gatewayConfig(env, expectedGatewayHost);
    if (!config) {
      return {
        mode: "direct",
        provider: "workers-ai",
        model: BASELINE_MODEL,
        request_types: ["standard_chat", "concierge"],
      };
    }
    return {
      mode: "gateway",
      gateway_host: config.endpoint.hostname,
      model: GATEWAY_ROUTE,
      request_types: ["standard_chat", "concierge"],
    };
  } catch (error) {
    return {
      mode: "invalid",
      code: error instanceof Error ? error.message : "AI_GATEWAY_CONFIGURATION_INVALID",
    };
  }
}

export async function runAiGatewayProbe(
  env: Env,
  expectedGatewayHost: string,
  probeCase: AiGatewayProbeCase,
  options: InferenceOptions = {}
): Promise<object> {
  const config = gatewayConfig(env, expectedGatewayHost);
  if (!config) throw new Error("AI_GATEWAY_CONFIGURATION_MISSING");

  const send = async (message: string, headers: Record<string, string> = {}) => {
    let response: Response;
    try {
      response = await (options.fetcher ?? fetch)(config.endpoint, {
        method: "POST",
        redirect: "manual",
        headers: {
          "Content-Type": "application/json",
          "CF-Access-Client-Id": config.clientId,
          "CF-Access-Client-Secret": config.clientSecret,
          "cf-aig-metadata": JSON.stringify({ agent_id: "seven-hills", request_type: "standard_chat" }),
          ...headers,
        },
        body: JSON.stringify({
          model: GATEWAY_ROUTE,
          messages: [
            { role: "system", content: "Return only the requested probe marker." },
            { role: "user", content: message },
          ],
          max_tokens: 8,
        }),
      });
    } catch {
      throw new Error("AI_GATEWAY_CONNECTION_FAILED");
    }
    if (response.status >= 300 && response.status < 400) {
      throw new Error("AI_GATEWAY_REDIRECT_REJECTED");
    }
    const payload = await readJsonResponse(response);
    return {
      status: response.status,
      cache: response.headers.get("cf-aig-cache-status") ?? "NONE",
      ...(!response.ok ? { code: gatewayErrorCode(payload) } : {}),
    };
  };

  if (probeCase === "cache") {
    const first = await send("Reply CACHE_OK.");
    const second = await send("Reply CACHE_OK.");
    return { case: probeCase, requests: [first, second] };
  }
  if (probeCase === "burst") {
    const requests = await Promise.all(Array.from({ length: 6 }, (_, index) =>
      send(`Reply BURST_OK_${index + 1}.`, { "cf-aig-skip-cache": "true" })
    ));
    return { case: probeCase, requests };
  }
  const request = await send("Reply SPEND_OK.", {
    "cf-aig-skip-cache": "true",
    "cf-aig-custom-cost": JSON.stringify({ per_token_in: 1, per_token_out: 1 }),
  });
  return { case: probeCase, request };
}

export async function runModelInference(
  env: Env,
  requestType: ModelRequestType,
  messages: ChatMessage[],
  tools: ModelTool[] = [],
  options: InferenceOptions = {}
): Promise<InferenceResult> {
  const config = gatewayConfig(env, options.expectedGatewayHost);
  if (!config) {
    const directResult: unknown = await env.AI.run(BASELINE_MODEL, {
      messages,
      ...(tools.length > 0 ? { tools } : {}),
    });
    if (typeof directResult === "string") return { response: directResult };
    if (!directResult || typeof directResult !== "object" || Array.isArray(directResult)) {
      throw new Error("WORKERS_AI_RESPONSE_INVALID");
    }
    const result = directResult as { response?: unknown; tool_calls?: unknown };
    if (result.response !== undefined && typeof result.response !== "string") {
      throw new Error("WORKERS_AI_RESPONSE_INVALID");
    }
    if (result.response === undefined && result.tool_calls === undefined) {
      throw new Error("WORKERS_AI_RESPONSE_INVALID");
    }
    return {
      ...(typeof result.response === "string" ? { response: result.response } : {}),
      ...(result.tool_calls !== undefined ? { tool_calls: result.tool_calls } : {}),
    };
  }

  let response: Response;
  try {
    response = await (options.fetcher ?? fetch)(config.endpoint, {
      method: "POST",
      redirect: "manual",
      headers: {
        "Content-Type": "application/json",
        "CF-Access-Client-Id": config.clientId,
        "CF-Access-Client-Secret": config.clientSecret,
        "cf-aig-metadata": JSON.stringify({ agent_id: "seven-hills", request_type: requestType }),
      },
      body: JSON.stringify({
        model: GATEWAY_ROUTE,
        messages: gatewayMessages(messages),
        ...(tools.length > 0 ? {
          tools: tools.map((tool) => ({ type: "function", function: tool })),
        } : {}),
      }),
    });
  } catch {
    throw new Error("AI_GATEWAY_CONNECTION_FAILED");
  }
  if (response.status >= 300 && response.status < 400) {
    throw new Error("AI_GATEWAY_REDIRECT_REJECTED");
  }
  const payload = await readJsonResponse(response);
  if (!response.ok) throw new AiGatewayRequestError(response.status, gatewayErrorCode(payload));
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("AI_GATEWAY_RESPONSE_INVALID");
  }
  const choices = (payload as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || !choices[0] || typeof choices[0] !== "object") {
    throw new Error("AI_GATEWAY_RESPONSE_INVALID");
  }
  const message = (choices[0] as { message?: unknown }).message;
  if (!message || typeof message !== "object" || Array.isArray(message)) {
    throw new Error("AI_GATEWAY_RESPONSE_INVALID");
  }
  const result = message as { content?: unknown; tool_calls?: unknown };
  if (result.content !== undefined && result.content !== null && typeof result.content !== "string") {
    throw new Error("AI_GATEWAY_RESPONSE_INVALID");
  }
  if ((result.content === undefined || result.content === null) && result.tool_calls === undefined) {
    throw new Error("AI_GATEWAY_RESPONSE_INVALID");
  }
  return {
    ...(typeof result.content === "string" ? { response: result.content } : {}),
    ...(result.tool_calls !== undefined ? { tool_calls: result.tool_calls } : {}),
  };
}
