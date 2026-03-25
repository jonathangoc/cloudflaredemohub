import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

export interface Env {
  AUTH_VALID_USERNAME: string
  AUTH_VALID_PASSWORD: string
  AUTH_LEAKED_USERNAME: string
  AUTH_LEAKED_PASSWORD: string
  JWT_SECRET: string
}

const app = new Hono<{ Bindings: Env }>()

app.use(
  '*',
  cors({
    origin: ['https://demo.jonathangoc.com', 'http://localhost:5173', 'http://localhost:5175', 'http://localhost:4173'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  })
)

app.use('*', logger())

app.get('/', (c) => {
  return c.json({
    name: 'Cloudflare Demo Hub — Credential Stuffing API',
    version: '1.0.0',
    endpoints: {
      'POST /api/auth/login': 'Validate credentials and return a signed JWT',
      'POST /api/auth/logout': 'Invalidate client session',
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

// --- Crypto helpers ---

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')
}

function b64url(obj: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(obj))
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function signJWT(payload: Record<string, unknown>, secret: string): Promise<string> {
  const hdr = b64url({ alg: 'HS256', typ: 'JWT' })
  const pld = b64url(payload)
  const input = `${hdr}.${pld}`
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(input))
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  return `${input}.${sigB64}`
}

// --- Auth routes ---

app.post('/api/auth/login', async (c) => {
  let body: { Username?: string; Password?: string }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }

  const { Username, Password } = body
  if (!Username || !Password) {
    return c.json({ error: 'Username and Password are required' }, 400)
  }

  const jwtSecret = c.env.JWT_SECRET || 'dev-secret-change-in-production'
  const validUser = c.env.AUTH_VALID_USERNAME || 'jcarvalho@cloudflare.com'
  const leakedUser = c.env.AUTH_LEAKED_USERNAME || 'CF_EXPOSED_USERNAME@example.com'
  const validPassHash = await sha256Hex(c.env.AUTH_VALID_PASSWORD || 'PleaseDontHackMe')
  const leakedPassHash = await sha256Hex(c.env.AUTH_LEAKED_PASSWORD || 'CF_EXPOSED_PASSWORD')

  type AccountData = Record<string, string>
  let account: AccountData | null = null

  if (Username === validUser && Password === validPassHash) {
    account = {
      name: 'Jonathan Carvalho',
      email: validUser,
      phone: '+1 (650) 555-0147',
      address: '101 Townsend St, San Francisco, CA 94107',
      memberSince: 'January 2021',
      plan: 'Enterprise',
      cardLast4: '3391',
      accountNumber: 'ACC-\u2022\u2022\u2022\u2022-\u2022\u2022\u2022\u2022-3391',
      avatarSeed: 'JonathanCarvalho',
    }
  } else if (Username === leakedUser && Password === leakedPassHash) {
    account = {
      name: 'John Smith',
      email: leakedUser,
      phone: '+1 (415) 555-0192',
      address: '742 Evergreen Terrace, Springfield, IL 62701',
      memberSince: 'March 2019',
      plan: 'Premium',
      cardLast4: '4821',
      accountNumber: 'ACC-\u2022\u2022\u2022\u2022-\u2022\u2022\u2022\u2022-7834',
      avatarSeed: 'JohnSmith',
    }
  }

  if (!account) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  const now = Math.floor(Date.now() / 1000)
  const token = await signJWT({ sub: Username, iat: now, exp: now + 3600, account }, jwtSecret)

  return c.json({ token, account })
})

app.post('/api/auth/logout', (c) => {
  return c.json({ success: true })
})

app.notFound((c) => c.json({ error: 'Not found' }, 404))
app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return c.json({ error: 'Internal server error' }, 500)
})

export default app
