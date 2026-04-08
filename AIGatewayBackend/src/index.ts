import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

interface Env {
  CF_AIG_TOKEN: string
}

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ChatRequest {
  messages: Message[]
  metadata: {
    plan: 'premium' | 'free'
    email?: string
  }
}

const ACCOUNT_ID = 'add808ef3e2b76bd4cec9c8247455e46'
const GATEWAY_NAME = 'default'
const MODEL = '@cf/meta/llama-3.2-3b-instruct'

const ALLOWED_ORIGINS = [
  'https://demo.jonathangoc.com',
  'http://localhost:5173',
  'http://localhost:5175',
  'http://localhost:4173',
]

const app = new Hono<{ Bindings: Env }>()

app.use(
  '*',
  cors({
    origin: ALLOWED_ORIGINS,
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
    maxAge: 86400,
  })
)

app.use('*', logger())

app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    runtime: 'Cloudflare Workers',
    region: (c.req.raw as Request & { cf?: { colo?: string } }).cf?.colo ?? 'unknown',
  })
})

app.post('/api/chat', async (c) => {
  let body: ChatRequest
  try {
    body = await c.req.json<ChatRequest>()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const { messages, metadata } = body

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return c.json({ error: 'messages array is required and must not be empty' }, 400)
  }

  if (!metadata?.plan) {
    return c.json({ error: 'metadata.plan is required' }, 400)
  }

  const url = `https://gateway.ai.cloudflare.com/v1/${ACCOUNT_ID}/${GATEWAY_NAME}/workers-ai/v1/chat/completions`

  try {
    const aiResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${c.env.CF_AIG_TOKEN}`,
        'Content-Type': 'application/json',
        'cf-aig-metadata': JSON.stringify(metadata),
      },
      body: JSON.stringify({ model: MODEL, messages }),
    })

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      console.error('AI Gateway error:', aiResponse.status, errorText)
      return c.json({ error: 'AI Gateway request failed', details: errorText }, 502)
    }

    const data = await aiResponse.json()
    return c.json(data)
  } catch (err) {
    console.error('Fetch error:', err)
    return c.json(
      { error: 'Failed to reach AI Gateway', message: err instanceof Error ? err.message : 'Unknown error' },
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
