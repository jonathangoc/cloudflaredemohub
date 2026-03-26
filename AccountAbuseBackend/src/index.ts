import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

export interface Env {
  ACCOUNT_ABUSE_USERS: KVNamespace
}

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
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  })
)

app.use('*', logger())

app.get('/', (c) => {
  return c.json({
    name: 'Cloudflare Demo Hub — Account Abuse Protection API',
    version: '1.0.0',
    endpoints: {
      'POST /signup': 'Register a new user account',
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

app.post('/signup', async (c) => {
  let body: { Username?: string; Password?: string; Name?: string }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const { Username, Password, Name } = body

  if (!Username || !Password) {
    return c.json({ error: 'Username and Password are required' }, 400)
  }

  if (!EMAIL_RE.test(Username)) {
    return c.json({ error: 'Username must be a valid email address' }, 400)
  }

  if (Password.length < 8) {
    return c.json({ error: 'Password must be at least 8 characters' }, 400)
  }

  const key = `user:${Username.toLowerCase()}`
  const existing = await c.env.ACCOUNT_ABUSE_USERS.get(key)
  if (existing) {
    return c.json({ error: 'An account with this email already exists' }, 409)
  }

  const displayName = Name?.trim() || Username.split('@')[0]
  const now = new Date().toISOString()

  await c.env.ACCOUNT_ABUSE_USERS.put(
    key,
    JSON.stringify({ name: displayName, email: Username.toLowerCase(), password: Password, createdAt: now })
  )

  return c.json(
    {
      success: true,
      message: 'Account created successfully',
      account: { email: Username.toLowerCase(), name: displayName, createdAt: now },
    },
    200
  )
})

app.notFound((c) => c.json({ error: 'Not found' }, 404))
app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return c.json({ error: 'Internal server error' }, 500)
})

export default app
