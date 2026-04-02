import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

const ALLOWED_ORIGINS = [
  'https://demo.jonathangoc.com',
  'http://localhost:5173',
  'http://localhost:5175',
  'http://localhost:4173',
]

const app = new Hono()

app.use(
  '*',
  cors({
    origin: ALLOWED_ORIGINS,
    allowMethods: ['GET', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
    exposeHeaders: ['X-WAF-Scores'],
    maxAge: 86400,
  })
)

app.use('*', logger())

app.get('/api/debug/cf', (c) => {
  const cf = (c.req.raw as Request & { cf?: Record<string, unknown> }).cf ?? {}
  return c.json({ cf })
})

app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    runtime: 'Cloudflare Workers',
    region: (c.req.raw as Request & { cf?: { colo?: string } }).cf?.colo ?? 'unknown',
  })
})

app.get('*', (c) => {
  // WAF scores are NOT available in request.cf inside Workers.
  // They must be injected as request headers via a Cloudflare Transform Rule
  // (Zone → Rules → Transform Rules → Modify Request Headers) using expressions like:
  //   X-WAF-Score       → to_string(cf.waf.score)
  //   X-WAF-Score-Class → cf.waf.score.class
  //   X-WAF-Score-SQLi  → to_string(cf.waf.score.sqli)
  //   X-WAF-Score-RCE   → to_string(cf.waf.score.rce)
  //   X-WAF-Score-XSS   → to_string(cf.waf.score.xss)
  const score = c.req.header('X-WAF-Score')       ?? null
  const cls   = c.req.header('X-WAF-Score-Class') ?? null
  const sqli  = c.req.header('X-WAF-Score-SQLi')  ?? null
  const rce   = c.req.header('X-WAF-Score-RCE')   ?? null
  const xss   = c.req.header('X-WAF-Score-XSS')   ?? null

  const scores = { score, class: cls, sqli, rce, xss }

  c.header('X-WAF-Scores', JSON.stringify(scores))

  return c.json({
    success: true,
    message: 'Request reached origin — not blocked by WAF',
    path: c.req.path,
    query: c.req.query(),
    waf: {
      scores,
      transformRuleActive: score !== null,
    },
  })
})

app.notFound((c) => c.json({ error: 'Not found' }, 404))
app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return c.json({ error: 'Internal server error' }, 500)
})

export default app
