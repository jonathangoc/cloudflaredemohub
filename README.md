# Cloudflare Demo Hub

A modular, microservices-based interactive demo website showcasing the Cloudflare Developer Platform.

## Architecture

```
cloudflaredemohub/
├── frontend/        # React 18 + TypeScript + Tailwind CSS + Vite
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.tsx       # Main hub (Apple-like design)
│   │   │   └── AIChatPage.tsx     # AI Chat demo
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── worker.ts              # Cloudflare Worker (serves SPA)
│   │   └── index.css
│   ├── wrangler.toml              # Deploy to demo.jonathangoc.com
│   └── package.json
└── AiChatBot/       # Hono.js + Cloudflare Workers AI
    ├── src/
    │   └── index.ts               # API routes
    ├── wrangler.toml              # Deploy to demoaichatbot.jonathangoc.com
    └── package.json
```

## Prerequisites

- Node.js 18+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) — `npm i -g wrangler`
- Cloudflare account with Workers AI enabled
- DNS zone `jonathangoc.com` configured in Cloudflare

## Local Development

### Frontend

```bash
cd frontend
cp .env.example .env        # Set VITE_API_URL if needed
npm install
npm run dev                 # http://localhost:5173
```

### AiChatBot

```bash
cd AiChatBot
npm install
npm run dev                 # http://localhost:8787
```

For local AiChatBot dev with Workers AI, you need to authenticate with Wrangler:

```bash
wrangler login
```

Then run AiChatBot with remote AI bindings:

```bash
wrangler dev --remote
```

## Deployment

### AiChatBot (deploy first)

```bash
cd AiChatBot
wrangler deploy --env production
```

### Frontend

```bash
cd frontend
npm run deploy
# or separately:
npm run build
wrangler deploy --env production
```

## Demo Environments

| Demo | Route | Backend | Status |
|------|-------|---------|--------|
| AI Chat | `/demo/ai-chat` | Workers AI (Llama) | ✅ Live |
| KV Store Explorer | `/demo/kv-store` | Workers KV | 🔜 Soon |
| R2 Object Storage | `/demo/r2-storage` | R2 | 🔜 Soon |
| D1 SQL Database | `/demo/d1-database` | D1 | 🔜 Soon |
| Zero Trust Security | `/demo/security` | WAF + ZT | 🔜 Soon |
| Edge Performance | `/demo/edge-network` | Analytics | 🔜 Soon |

## AI Chat API

### POST `/api/chat`

```json
{
  "messages": [
    { "role": "user", "content": "Hello!" }
  ],
  "model": "@cf/meta/llama-3.2-3b-instruct",
  "stream": true
}
```

**Available Models:**
- `@cf/meta/llama-3.2-3b-instruct` (default, fastest)
- `@cf/meta/llama-3.2-11b-vision-instruct`
- `@cf/meta/llama-3.1-8b-instruct`
- `@cf/meta/llama-3.1-70b-instruct`

### GET `/api/health`

Returns runtime info including edge colo.

### GET `/api/models`

Lists all available models.

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite, Cloudflare Workers (static hosting)
- **AiChatBot**: Hono.js, Cloudflare Workers AI, TypeScript
- **Deployment**: Cloudflare Workers (global edge)
