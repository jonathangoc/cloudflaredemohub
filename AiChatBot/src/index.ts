import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { stream } from 'hono/streaming'

export interface Env {
  AI: Ai
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatParams {
  max_tokens?: number
  temperature?: number
  top_p?: number
}

interface ChatRequest {
  messages: ChatMessage[]
  model?: string
  stream?: boolean
  params?: ChatParams
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

const SYSTEM_PROMPT = `You are a helpful, knowledgeable AI assistant running on Cloudflare Workers AI at the edge. 
You are part of the Cloudflare Demo Hub — an interactive platform showcasing Cloudflare Developer Platform capabilities.
Be thorough, accurate, and friendly. Provide complete and detailed answers — do not truncate or cut off your response. Format code with markdown code blocks. Use clear structure with headers when helpful.`

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

  const { messages, model: requestedModel, stream: useStream = true, params } = body

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return c.json({ error: 'messages array is required and must not be empty' }, 400)
  }

  const model = requestedModel && ALLOWED_MODELS.has(requestedModel) ? requestedModel : DEFAULT_MODEL

  const validRoles = new Set(['user', 'assistant', 'system'])
  for (const msg of messages) {
    if (!validRoles.has(msg.role) || typeof msg.content !== 'string') {
      return c.json({ error: `Invalid message format: role must be user|assistant|system` }, 400)
    }
  }

  const messagesWithSystem: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages.filter((m) => m.role !== 'system'),
  ]

  try {
    if (useStream) {
      c.header('Content-Type', 'text/event-stream')
      c.header('Cache-Control', 'no-cache')
      c.header('X-Model', model)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const aiStream = await c.env.AI.run(model as any, {
        messages: messagesWithSystem,
        stream: true,
        max_tokens: params?.max_tokens ?? 256,
        temperature: params?.temperature ?? 0.6,
        top_p: params?.top_p ?? 1,
      })

      return stream(c, async (s) => {
        const reader = (aiStream as ReadableStream).getReader()
        const decoder = new TextDecoder()

        s.onAbort(() => {
          reader.cancel()
        })

        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            await s.write('data: [DONE]\n\n')
            break
          }
          const text = decoder.decode(value, { stream: true })
          const lines = text.split('\n').filter((l) => l.trim())
          for (const line of lines) {
            await s.write(line + '\n\n')
          }
        }
      })
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await c.env.AI.run(model as any, {
        messages: messagesWithSystem,
        max_tokens: params?.max_tokens ?? 256,
        temperature: params?.temperature ?? 0.6,
        top_p: params?.top_p ?? 1,
      }) as { response: string }

      return c.json({
        response: result.response,
        model,
        usage: {
          prompt_tokens: null,
          completion_tokens: null,
          total_tokens: null,
        },
      }, 200, {
        'X-Model': model,
      })
    }
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
