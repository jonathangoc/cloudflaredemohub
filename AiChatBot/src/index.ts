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

// USD per 1M tokens [input, output] — https://developers.cloudflare.com/workers-ai/platform/pricing/
const PRICING_PER_M: Record<string, [number, number]> = {
  '@cf/meta/llama-4-scout-17b-16e-instruct': [0.27, 0.85],
  '@cf/meta/llama-3.3-70b-instruct-fp8-fast': [0.293, 2.253],
  '@cf/meta/llama-3.2-11b-vision-instruct': [0.049, 0.676],
  '@cf/meta/llama-3.2-3b-instruct': [0.051, 0.335],
  '@cf/meta/llama-3.2-1b-instruct': [0.027, 0.201],
  '@cf/meta/llama-3.1-8b-instruct-fp8': [0.152, 0.287],
  '@cf/meta/llama-3.1-8b-instruct-awq': [0.123, 0.266],
  '@cf/meta/llama-3.1-8b-instruct': [0.282, 0.827],
  '@cf/meta/llama-3-8b-instruct': [0.282, 0.827],
  '@cf/openai/gpt-oss-120b': [0.35, 0.75],
  '@cf/openai/gpt-oss-20b': [0.2, 0.3],
  '@cf/qwen/qwen3-30b-a3b-fp8': [0.051, 0.335],
  '@cf/qwen/qwq-32b': [0.66, 1.0],
  '@cf/qwen/qwen2.5-coder-32b-instruct': [0.66, 1.0],
  '@cf/google/gemma-3-12b-it': [0.345, 0.556],
  '@cf/mistral/mistral-small-3.1-24b-instruct': [0.351, 0.555],
  '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b': [0.497, 4.881],
  '@cf/ibm/granite-4.0-h-micro': [0.017, 0.112],
}

const round = (n: number, digits = 8) => Number(n.toFixed(digits))

function estimateCost(model: string, inputTokens: number, outputTokens: number) {
  const price = PRICING_PER_M[model]
  if (!price) return null
  const input = (inputTokens / 1e6) * price[0]
  const output = (outputTokens / 1e6) * price[1]
  return {
    currency: 'USD',
    input: round(input),
    output: round(output),
    total: round(input + output),
    price_per_million_tokens: { input: price[0], output: price[1] },
  }
}

const SYSTEM_PROMPT = 'You are a friendly assistant.'

// Workers AI streaming chunks can carry the same token in both `response` and
// `choices[0].delta.content`; workers-ai-provider emits both, duplicating every word.
function dedupeSSE(): TransformStream<Uint8Array, Uint8Array> {
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()
  let buffer = ''
  const fixLine = (line: string) => {
    if (!line.startsWith('data:')) return line
    const payload = line.slice(5).trim()
    if (!payload || payload === '[DONE]') return line
    try {
      const chunk = JSON.parse(payload)
      if (chunk.response && chunk.choices?.[0]?.delta?.content) {
        delete chunk.response
        return `data: ${JSON.stringify(chunk)}`
      }
    } catch {}
    return line
  }
  return new TransformStream({
    transform(bytes, controller) {
      buffer += decoder.decode(bytes, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      if (lines.length) controller.enqueue(encoder.encode(lines.map(fixLine).join('\n') + '\n'))
    },
    flush(controller) {
      buffer += decoder.decode()
      if (buffer) controller.enqueue(encoder.encode(fixLine(buffer)))
    },
  })
}

function withDedupedStream(ai: Ai): Ai {
  return new Proxy(ai, {
    get(target, prop) {
      if (prop === 'run') {
        return async (...args: unknown[]) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const out = await (target.run as any)(...args)
          return out instanceof ReadableStream ? out.pipeThrough(dedupeSSE()) : out
        }
      }
      const value = Reflect.get(target, prop, target)
      return typeof value === 'function' ? value.bind(target) : value
    },
  })
}

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
    const workersai = createWorkersAI({ binding: withDedupedStream(c.env.AI) })
    const colo = (c.req.raw as Request & { cf?: { colo?: string } }).cf?.colo ?? 'unknown'
    const startedAt = Date.now()
    let firstTokenAt: number | undefined

    const result = streamText({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      model: workersai(model as any),
      system: SYSTEM_PROMPT,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages: await convertToModelMessages(messages as any),
      onChunk: ({ chunk }) => {
        if (firstTokenAt === undefined && (chunk.type === 'text-delta' || chunk.type === 'reasoning-delta')) firstTokenAt = Date.now()
      },
    })

    const origin = c.req.header('Origin') ?? ''
    const allowedOrigins = ['https://demo.jonathangoc.com', 'http://localhost:5173', 'http://localhost:4173']
    const allowOrigin = allowedOrigins.includes(origin) ? origin : 'https://demo.jonathangoc.com'

    const streamResponse = result.toUIMessageStreamResponse({
      messageMetadata: ({ part }) => {
        if (part.type === 'start') return { model, colo, created: Math.floor(startedAt / 1000) }
        if (part.type !== 'finish') return undefined
        const finishedAt = Date.now()
        const u = part.totalUsage
        const inputTokens = u.inputTokens ?? 0
        const outputTokens = u.outputTokens ?? 0
        const genMs = firstTokenAt ? finishedAt - firstTokenAt : undefined
        return {
          model,
          colo,
          finish_reason: part.finishReason,
          usage: {
            prompt_tokens: inputTokens,
            completion_tokens: outputTokens,
            total_tokens: u.totalTokens ?? inputTokens + outputTokens,
            ...(u.outputTokenDetails?.reasoningTokens != null && { reasoning_tokens: u.outputTokenDetails.reasoningTokens }),
            ...(u.inputTokenDetails?.cacheReadTokens != null && { cached_prompt_tokens: u.inputTokenDetails.cacheReadTokens }),
          },
          cost: estimateCost(model, inputTokens, outputTokens),
          timing: {
            server_ms: finishedAt - startedAt,
            time_to_first_token_ms: firstTokenAt ? firstTokenAt - startedAt : null,
            tokens_per_second: genMs && outputTokens ? round(outputTokens / (genMs / 1000), 1) : null,
          },
        }
      },
    })
    const headers = new Headers(streamResponse.headers)
    headers.set('Access-Control-Allow-Origin', allowOrigin)
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    headers.set('X-Model', model)
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
