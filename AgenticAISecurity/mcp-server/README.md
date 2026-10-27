# Seven Hills Operations MCP

Shared MCP upstream for the Seven Hills lab. It preserves the lab's `SevenHillsOperationsMCP` Worker identity, health route, and Cloudflare Agents SDK Streamable HTTP architecture.

- Health: `https://<mcp-worker-host>/health`
- MCP: `https://<mcp-worker-host>/mcp`
- ERP tools: `get_stores`, `get_products`, `get_inventory`, `get_sales`, `get_suppliers`, `get_purchase_orders`, `get_promotions`, `get_employees`, `get_customers`, `get_sales_summary`, `get_top_products`, `get_inventory_valuation`, `get_customer_insights`
- Lab validation tool: `get_test_customer`

The upstream is intentionally unauthenticated so attendees can place an Access-protected MCP portal in front of it. All ERP records are deterministic, synthetic European lab data denominated in EUR. `get_test_customer` returns a published non-chargeable test card number for the DLP exercise.

The 13 ERP tools, seeded dataset generators, filters, pagination, and reporting helpers were ported from the partner lab's `mcp-server/src/index.ts` in `ai-security-labs-partners-master`, then localized to Seven Hills operations in Lisbon and across Europe. That project remains a read-only source reference; this Worker keeps the Seven Hills class, export, routing, and custom health endpoint conventions.

## Deploy

The Worker deploys to `workers.dev` in whichever account Wrangler is authenticated to. Use `scripts/deploy.sh` at the repository root to deploy all lab components together, or run it alone:

```bash
npm ci
npm run check
CLOUDFLARE_ACCOUNT_ID=<services account id> npx wrangler deploy
```

Deploying provisions the Durable Object namespace. The `workers.dev` URL printed by Wrangler, with `/mcp` appended, is the **MCP server URL** attendees enter in the lab guide. A custom domain is optional; add a `routes` entry to `wrangler.jsonc` if you want one.
