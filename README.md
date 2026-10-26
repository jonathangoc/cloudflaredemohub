# Cloudflare Demo Hub

A modular, microservices-based interactive demo website showcasing the Cloudflare Developer Platform. Live at **[demo.jonathangoc.com](https://demo.jonathangoc.com)**.

## Architecture

```
cloudflaredemohub/
├── frontend/                    # React 19 + TypeScript + Tailwind CSS + Vite
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.tsx           # Main hub
│   │   │   ├── AIChatPage.tsx         # AI Chat demo (23 models)
│   │   │   ├── AIAgentPage.tsx        # AI Agent with tool calls
│   │   │   ├── AIGatewayPage.tsx      # AI Gateway dynamic routing demo
│   │   │   ├── CredentialStuffingPage.tsx
│   │   │   ├── AccountAbusePage.tsx
│   │   │   ├── WAFPage.tsx
│   │   │   └── AboutPage.tsx
│   │   ├── App.tsx                    # React Router routes
│   │   ├── worker.ts                  # Cloudflare Worker (SPA + API proxy + R2)
│   │   └── index.css
│   ├── wrangler.toml                  # → demo.jonathangoc.com
│   └── package.json
│
├── AiChatBot/                   # Hono.js + Workers AI (23 text-gen models)
│   ├── src/index.ts             # POST /api/chat, GET /api/models, GET /api/health
│   └── wrangler.toml            # → demoaichatbot.jonathangoc.com
│
├── agent-backend/               # Cloudflare Agents SDK + Durable Objects
│   ├── src/server.ts            # ChatAgent (DO), WebSocket, tool execution
│   └── wrangler.toml            # → demoaiagent.jonathangoc.com
│
├── AIGatewayBackend/            # Hono.js — AI Gateway config/metadata
│   ├── src/index.ts
│   └── wrangler.toml            # → demoaigateway.jonathangoc.com
│
├── CredentialStuffingBackend/   # Hono.js + KV + JWT auth
│   ├── src/index.ts             # POST /api/auth/login|logout, GET /api/health
│   └── wrangler.toml            # → democredentialstuffing.jonathangoc.com
│
├── WafDemoBackend/              # Hono.js — WAF target endpoints
│   ├── src/index.ts
│   └── wrangler.toml            # → demowaf.jonathangoc.com
│
└── AccountAbuseBackend/         # Hono.js + KV — account abuse simulation
    ├── src/index.ts
    └── wrangler.toml            # → demoaccountabuse.jonathangoc.com
```

## Live Demos

| Demo | Route | Backend | Cloudflare Products |
|------|-------|---------|---------------------|
| AI Chat | `/demo/ai-chat` | AiChatBot | Workers AI (23 models) |
| AI Agent | `/demo/ai-agent` | agent-backend | Workers AI, Durable Objects, Agents SDK |
| AI Gateway | `/demo/ai-gateway` | frontend Worker + AI Gateway | AI Gateway, Workers AI, Rate Limiting |
| Credential Stuffing | `/demo/credential-stuffing` | CredentialStuffingBackend | Workers, KV, Bot Management |
| Account Abuse | `/demo/account-abuse` | AccountAbuseBackend | Workers, KV |
| WAF | `/demo/waf` | WafDemoBackend | WAF, Workers |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Tailwind CSS v3, Vite 5 |
| AI SDK | `ai` (Vercel AI SDK v4), `@ai-sdk/react` |
| Backends | Hono 4, Cloudflare Workers, TypeScript |
| AI | Cloudflare Workers AI, AI Gateway, Agents SDK |
| Storage | Cloudflare KV, R2 |
| Compute | Durable Objects (AI Agent state) |
| Deployment | Wrangler 3, global Cloudflare edge |

## Frontend Worker Routes

The frontend Cloudflare Worker (`src/worker.ts`) handles:

| Path | Method | Description |
|------|--------|-------------|
| `/api/aig` | POST | Proxy to AI Gateway (injects `CF_AIG_TOKEN`) |
| `/r2/upload` | POST | Upload file to R2 bucket `demoassets` |
| `/r2/*` | GET | Serve object from R2 bucket |
| `*` | GET | Serve React SPA from KV static assets |

## Prerequisites

- Node.js 18+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) — `npm i -g wrangler`
- Cloudflare account with Workers AI and AI Gateway enabled
- DNS zone `jonathangoc.com` configured in Cloudflare

## Local Development

### Frontend

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

### Any backend service

```bash
cd <service-directory>      # e.g. AiChatBot, agent-backend
npm install
wrangler dev --remote       # remote Workers AI bindings required
```

## Deployment

Deploy each service independently. The frontend should be deployed last if it depends on backend URLs.

### Backends

```bash
cd AiChatBot && wrangler deploy --env production
cd agent-backend && wrangler deploy --env production
cd AIGatewayBackend && wrangler deploy --env production
cd CredentialStuffingBackend && wrangler deploy --env production
cd WafDemoBackend && wrangler deploy --env production
cd AccountAbuseBackend && wrangler deploy --env production
```

### Frontend

```bash
cd frontend
npm run build && wrangler deploy --env production
```

## Worker Secrets

Set the following secrets via `wrangler secret put` before deploying:

| Service | Secret | Description |
|---------|--------|-------------|
| `frontend` | `CF_AIG_TOKEN` | AI Gateway bearer token |
| `CredentialStuffingBackend` | `AUTH_VALID_PASSWORD` | Valid account password |
| `CredentialStuffingBackend` | `AUTH_LEAKED_PASSWORD` | Leaked account password |
| `CredentialStuffingBackend` | `JWT_SECRET` | HS256 signing secret |

## AI Gateway Demo Flow

The AI Gateway page demonstrates dynamic routing with:

- **Left branch** (free users, `plan == free`): rate-limited by email (`2 req/min`) → primary model (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`) with fallback to (`@cf/meta/llama-3.1-8b-instruct-fast`)
- **Right branch** (premium users): rate-limited (`30 req/min`) → primary model (`llama3.1-8b` via Cerebras) with fallback to (`gpt-oss-120b` via Workers AI)
- Rate limit exceeded on either branch falls back directly to **End** via a red dashed line
