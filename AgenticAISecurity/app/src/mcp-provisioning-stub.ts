type McpProbeCase = "tools" | "public-inventory" | "sensitive-customer";

export async function getMcpStatus() {
  return { configured: false, connected: false, code: "MCP_NOT_CONFIGURED" } as const;
}

export function isMcpProbeCase(value: unknown): value is McpProbeCase {
  return value === "tools" || value === "public-inventory" || value === "sensitive-customer";
}

export async function runMcpProbe(): Promise<never> {
  throw new Error("MCP_NOT_CONFIGURED");
}

export function normalizeMcpError(): { code: string; status: number } {
  return { code: "MCP_NOT_CONFIGURED", status: 503 };
}
