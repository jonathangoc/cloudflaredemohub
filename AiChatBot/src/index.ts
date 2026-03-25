import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { streamText, convertToModelMessages } from 'ai'
import { createWorkersAI } from 'workers-ai-provider'

export interface Env {
  AI: Ai
}

interface ChatRequest {
  messages: unknown[]
  model?: string
}

const ALLOWED_MODELS = new Set([
  // Moonshot AI
  '@cf/moonshot/kimi-k2.5',
  // Meta
  '@cf/meta/llama-4-scout-17b-16e-instruct',
  '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  '@cf/meta/llama-3.2-11b-vision-instruct',
  '@cf/meta/llama-3.2-3b-instruct',
  '@cf/meta/llama-3.2-1b-instruct',
  '@cf/meta/llama-3.1-8b-instruct-fast',
  '@cf/meta/llama-3.1-8b-instruct',
  '@cf/meta/llama-3.1-8b-instruct-fp8',
  '@cf/meta/llama-3.1-8b-instruct-awq',
  '@cf/meta/llama-3-8b-instruct',
  // OpenAI
  '@cf/openai/gpt-oss-120b',
  '@cf/openai/gpt-oss-20b',
  // Qwen
  '@cf/qwen/qwen3-30b-a3b-fp8',
  '@cf/qwen/qwq-32b',
  '@cf/qwen/qwen2.5-coder-32b-instruct',
  // Google
  '@cf/google/gemma-3-12b-it',
  // Mistral
  '@cf/mistral/mistral-small-3.1-24b-instruct',
  // NVIDIA
  '@cf/nvidia/nemotron-3-120b-a12b',
  // DeepSeek
  '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',
  // IBM
  '@cf/ibm/granite-4.0-h-micro',
  // Zhipu AI
  '@cf/zhipuai/glm-4.7-flash',
  // AI Singapore
  '@cf/aisingapore/gemma-sea-lion-v4-27b-it',
])

const DEFAULT_MODEL = '@cf/meta/llama-3.2-3b-instruct'

const SYSTEM_PROMPT = 'You are a friendly assistant.'

const app = new Hono<{ Bindings: Env }>()

app.use(
  '*',
  cors({
    origin: ['https://demo.jonathangoc.com', 'http://localhost:5173', 'http://localhost:4173'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  })
)

app.use('*', logger())

app.get('/', (c) => {
  return c.json({
    name: 'Cloudflare Demo Hub API',
    version: '1.0.0',
    endpoints: {
      'POST /api/chat': 'AI chat with Workers AI',
      'GET /api/models': 'List available models',
      'GET /api/health': 'Health check',
    },
  })
})

app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    runtime: 'Cloudflare Workers',
    region: (c.req.raw as Request & { cf?: { colo?: string } }).cf?.colo ?? 'unknown',
  })
})

app.get('/api/models', (c) => {
  return c.json({
    models: [...ALLOWED_MODELS].map((id) => ({ id })),
  })
})

app.post('/api/chat', async (c) => {
  let body: ChatRequest

  try {
    body = await c.req.json<ChatRequest>()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const { messages, model: requestedModel } = body

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return c.json({ error: 'messages array is required and must not be empty' }, 400)
  }

  const model = requestedModel && ALLOWED_MODELS.has(requestedModel) ? requestedModel : DEFAULT_MODEL

  try {
    // WAF AI Security fields are Ruleset Engine fields — they are not available
    // on request.cf in Workers. They must be injected as request headers via a
    // Cloudflare "Modify Request Headers" Transform Rule on demoaichatbot.jonathangoc.com.
    // Each header maps: x-cf-llm-<field> → cf.llm.prompt.<field>
    const h = c.req.raw.headers
    const parseBool = (v: string | null): boolean | null =>
      v === 'true' ? true : v === 'false' ? false : null
    const parseNum = (v: string | null): number | null => {
      if (v === null) return null
      const n = Number(v)
      return isNaN(n) ? null : n
    }
    const parseList = (v: string | null): string[] | null =>
      v ? v.split(',').map(s => s.trim()).filter(Boolean) : null
    const wafDetections = {
      'cf.llm.prompt.detected':                parseBool(h.get('x-waf-llm-detected')),
      'cf.llm.prompt.pii_detected':            parseBool(h.get('x-waf-llm-pii-detected')),
      'cf.llm.prompt.pii_categories':          parseList(h.get('x-waf-llm-pii-categories')),
      'cf.llm.prompt.unsafe_topic_detected':   parseBool(h.get('x-waf-llm-unsafe-topic-detected')),
      'cf.llm.prompt.unsafe_topic_categories': parseList(h.get('x-waf-llm-unsafe-topic-categories')),
      'cf.llm.prompt.injection_score':         parseNum(h.get('x-waf-llm-injection-score')),
      'cf.llm.prompt.token_count':             parseNum(h.get('x-waf-llm-token-count')),
      'cf.llm.prompt.custom_topic_categories': parseList(h.get('x-waf-llm-custom-topic-categories')),
    }

    const workersai = createWorkersAI({ binding: c.env.AI })

    const result = streamText({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      model: workersai(model as any),
      system: SYSTEM_PROMPT,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages: await convertToModelMessages(messages as any),
    })

    const origin = c.req.header('Origin') ?? ''
    const allowedOrigins = ['https://demo.jonathangoc.com', 'http://localhost:5173', 'http://localhost:4173']
    const allowOrigin = allowedOrigins.includes(origin) ? origin : 'https://demo.jonathangoc.com'

    const streamResponse = result.toUIMessageStreamResponse()
    const headers = new Headers(streamResponse.headers)
    headers.set('Access-Control-Allow-Origin', allowOrigin)
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    headers.set('Access-Control-Expose-Headers', 'X-Model, X-CF-WAF-Fields')
    headers.set('X-Model', model)
    headers.set('X-CF-WAF-Fields', JSON.stringify(wafDetections))
    return new Response(streamResponse.body, { status: streamResponse.status, headers })
  } catch (err: unknown) {
    console.error('Workers AI error:', err)
    return c.json(
      {
        error: 'AI inference failed',
        message: err instanceof Error ? err.message : 'Unknown error',
      },
      500
    )
  }
})

app.notFound((c) => c.json({ error: 'Not found' }, 404))
app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return c.json({ error: 'Internal server error' }, 500)
})

export default app
