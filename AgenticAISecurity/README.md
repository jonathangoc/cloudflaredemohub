# Seven Hills agentic AI security lab

A 90-minute hands-on Cloudflare lab. Attendees follow one AI agent, Seven
Hills, across its MCP, model, and public ingress paths and secure each one with
Access, MCP server portals, Gateway, DLP, AI Gateway, and AI Security for Apps.

This repository deploys the starting environment into Cloudflare accounts you
choose. Attendees then do every lab step themselves in the dashboard.

Step-by-step setup guide (Google Doc):
[Seven Hills agentic AI security lab: run it in your own account](https://docs.google.com/document/d/1wtHqX5eX5hjLIYlzfCGbQXXMGdysHYOwYjaMM0nNq8g/edit)

## What gets deployed

| Component | Directory | Worker | Account |
| --- | --- | --- | --- |
| Seven Hills app (storefront + agent) | `app/` | `seven-hills-agent` | Lab account |
| Shared Operations MCP server | `mcp-server/` | `seven-hills-operations-mcp` | Services account |
| Lab guide (Docusaurus) | `guide/` | `agentic-ai-lab-portal` | Services account |

The services account can be the same as the lab account.

## Prerequisites

> [!IMPORTANT]
> **Bring your own domain.** The lab needs a domain (zone) that you own,
> added to the lab account and **active** on Cloudflare. This repository does
> not provide one.
>
> - Module 04 (AI Security for Apps) only inspects traffic that reaches the app
>   through a proxied hostname on a Cloudflare zone. `workers.dev` URLs are not
>   enough.
> - The app runs on the zone **apex** (for example `sevenhills-lab.com`). The
>   lab then adds `mcp.<domain>` (MCP portal) and `ai.<domain>` (AI Gateway).
>   Use a zone with nothing else on those three hostnames.
> - Use one zone per attendee. Attendees change WAF and security settings on it.
> - The zone must be on an **Enterprise** plan with AI Security for Apps
>   enabled. Newly added zones start on Free, so upgrade it before Module 04.
> - No spare domain? Delegate a subdomain of one you already own (for example
>   `ai-lab.example.com`) to the lab account as its own zone. This is a
>   [subdomain setup](https://developers.cloudflare.com/dns/zone-setups/subdomain-setup/)
>   (Enterprise only): add the subdomain as a new zone in the lab account,
>   then add its two `NS` records in the parent zone.

> [!IMPORTANT]
> **The MCP server must be public.** If an Access application in the services
> account covers your `workers.dev` hostnames (for example a wildcard on
> `*.<subdomain>.workers.dev`), the MCP server sits behind a login and Module 02
> fails. Attendees put Access in front of it themselves. `scripts/deploy.sh`
> checks this after deploying and prints a red warning with the fix.

> [!IMPORTANT]
> **workers.dev subdomain.** The services account must have a `workers.dev`
> subdomain (**Workers & Pages** > **Settings** in the dashboard). The MCP server
> and guide are published on it. `scripts/deploy.sh` stops if it is missing.

Also required:

- Node.js 22 or later, npm, git, bash
- In the lab account:
  - a Zero Trust organization
  - AI Security for Apps detections enabled (Enterprise add-on), for Module 04.
    Enable the entitlement on the account before the lab.
- Permission to deploy Workers in both accounts

> [!WARNING]
> **Redeploying overwrites.** If Workers named `seven-hills-agent`,
> `seven-hills-operations-mcp`, or `agentic-ai-lab-portal` already exist in the
> target accounts, `scripts/deploy.sh` lists them in red and asks for explicit
> confirmation before replacing them. Don't redeploy while attendees are
> mid-lab.

## Quickstart

```bash
git clone <this repository> && cd agentic-ai-security-lab
npx --yes wrangler login          # or export CLOUDFLARE_API_TOKEN
scripts/deploy.sh                 # prompts for the lab and services account IDs
```

The script prints the guide URL and the **MCP server host**. Give attendees the
guide URL, access to the lab account, the lab domain, and the MCP server host.

To try the build without touching any account: `scripts/deploy.sh --dry-run`.

To remove the three Workers: `scripts/destroy.sh`. Configuration that
attendees created in the dashboard is left in place.

Settings can also come from a `.env` file; see [`.env.example`](.env.example).

## Repository layout

- `app/`: Seven Hills application Worker
- `mcp-server/`: Shared Operations MCP Worker
- `guide/`: Docusaurus lab guide
- `facilitator/`: troubleshooting assistant prompt for facilitators
- `scripts/`: deploy and destroy scripts
- `docs/distribution.md`: distribution design and known limitations

## Development checks

```bash
npm --prefix app run check
npm --prefix mcp-server run check
npm --prefix guide run check
```

These commands do not deploy anything.

## Handling sensitive data

Never commit API tokens, Access service-token secrets, DLP private keys,
attendee data, or local Wrangler state. Use `.env` (git-ignored) or your shell
environment for credentials.
