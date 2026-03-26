import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

export interface Env {
  AUTH_VALID_USERNAME: string
  AUTH_VALID_PASSWORD: string
  AUTH_SECOND_USERNAME: string
  AUTH_SECOND_PASSWORD: string
  AUTH_LEAKED_USERNAME: string
  AUTH_LEAKED_PASSWORD: string
  JWT_SECRET: string
  TURNSTILE_SECRET_KEY: string
}

const app = new Hono<{ Bindings: Env }>()

app.use(
  '*',
  cors({
    origin: ['https://demo.jonathangoc.com', 'http://localhost:5173', 'http://localhost:5175', 'http://localhost:4173'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['X-Exposed-Credential-Check'],
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

// --- Turnstile validation ---

interface TurnstileResult {
  success: boolean
  'error-codes'?: string[]
  action?: string
  hostname?: string
  challenge_ts?: string
}

async function validateTurnstileWithRetry(
  token: string,
  secret: string,
  remoteip: string,
  expectedAction: string,
  maxRetries = 3
): Promise<{ valid: boolean; reason?: string }> {
  const idempotencyKey = crypto.randomUUID()

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const formData = new FormData()
      formData.append('secret', secret)
      formData.append('response', token)
      formData.append('remoteip', remoteip)
      formData.append('idempotency_key', idempotencyKey)

      const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: formData,
      })

      const result = await res.json() as TurnstileResult

      if (!res.ok) {
        if (attempt === maxRetries) return { valid: false, reason: 'siteverify_error' }
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000))
        continue
      }

      if (!result.success) {
        return { valid: false, reason: result['error-codes']?.[0] ?? 'unknown' }
      }

      if (result.action && result.action !== expectedAction) {
        return { valid: false, reason: 'action_mismatch' }
      }

      return { valid: true }
    } catch {
      if (attempt === maxRetries) return { valid: false, reason: 'internal_error' }
      await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000))
    }
  }

  return { valid: false, reason: 'max_retries_exceeded' }
}

// --- Crypto helpers ---

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
  let body: { Username?: string; Password?: string; TurnstileToken?: string }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }

  const { Username, Password, TurnstileToken } = body
  if (!Username || !Password) {
    return c.json({ error: 'Username and Password are required' }, 400)
  }

  const turnstileSecret = c.env.TURNSTILE_SECRET_KEY
  if (turnstileSecret) {
    if (!TurnstileToken) {
      return c.json({ error: 'CAPTCHA token missing. Please complete the verification.' }, 400)
    }
    const remoteip = c.req.header('CF-Connecting-IP') ?? ''
    const check = await validateTurnstileWithRetry(TurnstileToken, turnstileSecret, remoteip, 'login')
    if (!check.valid) {
      return c.json({ error: 'CAPTCHA validation failed. Please try again.' }, 401)
    }
  }

  const jwtSecret = c.env.JWT_SECRET || 'dev-secret-change-in-production'
  const validUser = c.env.AUTH_VALID_USERNAME || 'jcarvalho@myemail.com'
  const validPass = c.env.AUTH_VALID_PASSWORD || 'PleaseDontHackMe'
  const secondUser = c.env.AUTH_SECOND_USERNAME || ''
  const secondPass = c.env.AUTH_SECOND_PASSWORD || ''
  const leakedUser = c.env.AUTH_LEAKED_USERNAME || 'CF_EXPOSED_USERNAME@example.com'
  const leakedPass = c.env.AUTH_LEAKED_PASSWORD || 'CF_EXPOSED_PASSWORD'

  type AccountData = Record<string, string>
  let account: AccountData | null = null

  if (Username === validUser && Password === validPass) {
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
  } else if (secondUser && Username === secondUser && Password === secondPass) {
    account = {
      name: 'Jonathan Gabriel Carvalho',
      email: secondUser,
      phone: '+44 7700 900142',
      address: '22 Bishopsgate, London, EC2N 4BQ',
      memberSince: 'August 2023',
      plan: 'Standard',
      cardLast4: '6017',
      accountNumber: 'ACC-••••-••••-6017',
      avatarSeed: 'JonathanGabrielCarvalho',
    }
  } else if (Username === leakedUser && Password === leakedPass) {
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

  // Forward the Exposed-Credential-Check header added by Cloudflare's managed transform
  const exposedCredentialCheck = c.req.header('Exposed-Credential-Check')
  if (exposedCredentialCheck) {
    c.header('X-Exposed-Credential-Check', exposedCredentialCheck)
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
