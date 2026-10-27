import assert from "node:assert/strict";
import test from "node:test";
import { expectedPortalHostFor, getMcpStatus, normalizeMcpError } from "../src/mcp.ts";

const PORTAL_HOST = "mcp.lab.example.com";

test("portal host is derived from the application hostname", () => {
  assert.equal(expectedPortalHostFor("lab.example.com"), PORTAL_HOST);
  assert.equal(expectedPortalHostFor("shop.acme.dev"), "mcp.shop.acme.dev");
});

test("status is not configured when MCP_SERVER_URL is absent", async () => {
  const status = await getMcpStatus({} as Env, PORTAL_HOST);
  assert.deepEqual(status, { configured: false, connected: false, code: "MCP_NOT_CONFIGURED" });
});

test("credentials are refused for a portal that does not belong to this deployment", async () => {
  const env = {
    MCP_SERVER_URL: "https://mcp.other-lab.example.com/mcp",
    MCP_CLIENT_ID: "client-id",
    MCP_CLIENT_SECRET: "client-secret",
  } as unknown as Env;

  const status = await getMcpStatus(env, PORTAL_HOST);
  assert.deepEqual(status, { configured: true, connected: false, code: "MCP_CONFIGURATION_INVALID" });
});

test("credentials must be configured together", async () => {
  const env = {
    MCP_SERVER_URL: `https://${PORTAL_HOST}/mcp`,
    MCP_CLIENT_ID: "client-id",
  } as unknown as Env;

  const status = await getMcpStatus(env, PORTAL_HOST);
  assert.deepEqual(status, { configured: true, connected: false, code: "MCP_CONFIGURATION_INVALID" });
});

test("configuration errors map to a 500 without leaking the failure detail", () => {
  assert.deepEqual(normalizeMcpError(new Error("anything")), { code: "MCP_CONNECTION_FAILED", status: 502 });
});
