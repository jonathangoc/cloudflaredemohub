# Distribution design

## Goal

Let a Cloudflare colleague deploy the complete lab starting environment into
accounts they choose, run the lab, and remove it afterward.

The GitLab repository is the source of truth. Colleagues deploy a tagged
release. Any wiki page or Google Doc should only describe the lab and link to
a release; detailed instructions stay beside the code.

## v1 deployment model

`scripts/deploy.sh` uses Wrangler only. There is no Terraform and no R2
artifact step: the script builds and deploys each Worker from the checkout.

| Component | Worker | Account |
| --- | --- | --- |
| Shared Operations MCP server | `seven-hills-operations-mcp` | Services |
| Lab guide | `agentic-ai-lab-portal` | Services |
| Seven Hills app | `seven-hills-agent` | Lab |

Inputs are `LAB_ACCOUNT_ID` and `SERVICES_ACCOUNT_ID`. The services account
defaults to the lab account. Authentication is the `wrangler login` session,
`CLOUDFLARE_API_TOKEN`, or per-account `LAB_API_TOKEN` / `SERVICES_API_TOKEN`.

The MCP server and guide deploy to `workers.dev`. The app has no public URL
until the attendee adds its custom domain in Module 01.

### Hostname model

- Lab domain: an active zone apex in the lab account. The app is served there.
- MCP portal: `mcp.<lab domain>`. The app only sends Access credentials to
  this host (`app/src/mcp.ts`).
- AI Gateway: `ai.<lab domain>`. The app only accepts this gateway host
  (`app/src/ai-inference.ts`).
- MCP upstream: the MCP server's `workers.dev` hostname.

Attendees enter the lab domain and MCP server host on the guide's Getting
Started page. The guide substitutes `<your-lab-domain>` and `<your-mcp-host>`
in code snippets.

## Deployment boundary

The script deploys only the starting environment. It never preconfigures lab
outcomes, which remain attendee exercises:

- Access service tokens and policies
- MCP server registration, MCP portal, or tool curation
- Gateway routing or DLP policies
- AI Gateway, routes, caching, rate limits, budgets, Guardrails, or DLP
- AI Security for Apps labels, topics, or WAF rules
- App secrets and variables (`MCP_SERVER_URL`, `MCP_CLIENT_ID`,
  `MCP_CLIENT_SECRET`, `AI_GATEWAY_URL`)

`scripts/destroy.sh` removes only the three Workers and leaves
attendee-created configuration for review.

## Topology status

- Split accounts: the topology used at the original event. The v1 scripts
  must still pass a clean end-to-end run.
- Single account: untested. Account boundaries, Gateway routing to a
  same-account `workers.dev` upstream, and Access policy scope need a full
  module run before this is marked supported.

## Known limitations

- No preflight for entitlements (Zero Trust, AI Security for Apps). Missing
  entitlements surface during the relevant module.
- No automated validation or per-module reset commands.
- The lab domain must be a zone apex so `mcp.` and `ai.` hostnames stay
  one level below it.

## Deferred

A Terraform-based installer for the labs.cloudflare.com (CML) model is
deferred while those discussions continue. Historical CML templates are kept
outside this repository.

## Releases

Tag each release. Record the source revision, Wrangler version, compatibility
dates, supported topology, prerequisites, and known limitations in the tag
message or release notes.
