import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  LogIn,
  User,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  ShieldCheck,
  ShieldAlert,
  Eye,
  EyeOff,
  Calendar,
  Star,
  LogOut,
  X,
} from 'lucide-react'

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement | string, params: Record<string, unknown>) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
      getResponse: (widgetId: string) => string | undefined
    }
  }
}

const AUTH_API_BASE = import.meta.env.VITE_AUTH_API_URL ?? 'https://democredentialstuffing.jonathangoc.com'

const DISPLAY_VALID_USERNAME = 'jcarvalho@myemail.com'
const DISPLAY_VALID_PASSWORD = 'PleaseDontHackMe'
const DISPLAY_LEAKED_USERNAME = import.meta.env.VITE_EXPOSED_USERNAME ?? 'CF_EXPOSED_USERNAME@example.com'
const DISPLAY_LEAKED_PASSWORD = import.meta.env.VITE_EXPOSED_PASSWORD ?? 'CF_EXPOSED_PASSWORD'

const EXPOSED_CRED_MEANINGS: Record<string, { short: string; detail: string }> = {
  '1': {
    short: 'Username & password found in breach',
    detail: 'Both the username and password combination were found together in a known data breach database.',
  },
  '2': {
    short: 'Username found in breach',
    detail: 'The username alone was found in a known data breach database.',
  },
  '3': {
    short: 'Password is similar to username',
    detail: 'The password is similar to the username, indicating a weak or predictable credential pair.',
  },
  '4': {
    short: 'Password found in breach',
    detail: 'The password alone was found in a known data breach database.',
  },
}

interface Account {
  name: string
  email: string
  phone: string
  address: string
  memberSince: string
  plan: string
  cardLast4: string
  accountNumber: string
  avatarSeed: string
}

export default function CredentialStuffingPage() {
  const navigate = useNavigate()
  const [loggedInAccount, setLoggedInAccount] = useState<Account | null>(null)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [exposedCredCheck, setExposedCredCheck] = useState<string | null>(null)
  const [wafBlockData, setWafBlockData] = useState<{ status: number; body: unknown } | null>(null)
  const setWafBlockRef = useRef(setWafBlockData)
  setWafBlockRef.current = setWafBlockData

  const handleLogin = (account: Account, token: string, credCheck: string | null) => {
    setLoggedInAccount(account)
    setSessionToken(token)
    setExposedCredCheck(credCheck)
  }

  const handleLogout = async () => {
    try {
      await fetch(`${AUTH_API_BASE}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessionToken ?? ''}` },
      })
    } catch { /* ignore */ }
    setLoggedInAccount(null)
    setSessionToken(null)
    setExposedCredCheck(null)
  }

  return (
    <div className="h-screen flex flex-col bg-[#FAFAFA] overflow-hidden">
      <header className="glass border-b border-gray-200/50 flex-none">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-400 rounded-lg text-white">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-sm font-semibold text-gray-900 leading-none">Preventing Credential Stuffing Attacks</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://dash.cloudflare.com/?to=/:account/:zone/security/security-rules"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-[#F6821F] text-white px-3 py-1.5 rounded-full hover:bg-[#E07010] transition-colors font-medium"
            >
              Go to <strong>Security Rules</strong>
            </a>
            <a
              href="https://dash.cloudflare.com/add808ef3e2b76bd4cec9c8247455e46/log-explorer/dashboards/6b78d9f2-98a6-4eb3-9e6a-8450a1fff23b"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-[#F6821F] text-white px-3 py-1.5 rounded-full hover:bg-[#E07010] transition-colors font-medium"
            >
              Go to <strong>Log Explorer</strong>
            </a>
            <a
              href="https://dash.cloudflare.com/?to=/:account/turnstile"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-[#F6821F] text-white px-3 py-1.5 rounded-full hover:bg-[#E07010] transition-colors font-medium"
            >
              Go to <strong>Turnstile Analytics</strong>
            </a>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-12">
          {loggedInAccount ? (
            <AccountView account={loggedInAccount} exposedCredCheck={exposedCredCheck} onLogout={handleLogout} />
          ) : (
            <LoginView onLogin={handleLogin} onWafBlocked={(d) => setWafBlockRef.current(d)} />
          )}
        </div>
      </div>{/* end flex-1 scroll */}

      {/* WAF Block Modal */}
      {wafBlockData && (
        <WafBlockModal
          data={wafBlockData}
          onClose={() => setWafBlockData(null)}
        />
      )}
    </div>
  )
}

function LoginView({
  onLogin,
  onWafBlocked,
}: {
  onLogin: (account: Account, token: string, credCheck: string | null) => void
  onWafBlocked: (d: { status: number; body: unknown }) => void
}) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)

  useEffect(() => {
    const sitekey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined
    if (!sitekey) return
    const render = () => {
      if (!containerRef.current || widgetIdRef.current) return
      widgetIdRef.current = window.turnstile!.render(containerRef.current, {
        sitekey,
        theme: 'auto',
        action: 'login',
        callback: (token: string) => setTurnstileToken(token),
        'expired-callback': () => setTurnstileToken(null),
        'error-callback': () => setTurnstileToken(null),
      })
    }
    if (window.turnstile) {
      render()
    } else {
      const id = setInterval(() => {
        if (window.turnstile) { clearInterval(id); render() }
      }, 100)
      return () => clearInterval(id)
    }
    return () => {
      if (widgetIdRef.current) {
        window.turnstile?.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    let res: Response
    try {
      res = await fetch(`${AUTH_API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Username: username, Password: password, TurnstileToken: turnstileToken ?? '' }),
      })
    } catch {
      onWafBlocked({ status: 403, body: null })
      setIsLoading(false)
      return
    }
    if (res.status === 403) {
      try {
        const text = await res.clone().text()
        let body: unknown
        try { body = JSON.parse(text) } catch { body = text }
        onWafBlocked({ status: 403, body })
      } catch { onWafBlocked({ status: 403, body: null }) }
      if (widgetIdRef.current) { window.turnstile?.reset(widgetIdRef.current); setTurnstileToken(null) }
      setIsLoading(false)
      return
    }
    try {
      const data = await res.json() as { token?: string; account?: Account; error?: string }
      if (!res.ok || !data.token || !data.account) {
        setError(data.error ?? 'Invalid username or password. Please try again.')
        if (widgetIdRef.current) { window.turnstile?.reset(widgetIdRef.current); setTurnstileToken(null) }
      } else {
        const credCheck = res.headers.get('X-Exposed-Credential-Check')
        onLogin(data.account, data.token, credCheck)
      }
    } catch {
      setError('Unable to reach the authentication server. Please try again.')
    }
    setIsLoading(false)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

      {/* Left — context */}
      <div className="space-y-6">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 mb-4">
            <ShieldCheck className="w-3.5 h-3.5" /> Demo Scenario
          </span>
          <h2 className="text-3xl font-bold text-gray-900 leading-tight mb-3">
            Credential Stuffing Attacks
          </h2>
          <p className="text-gray-500 leading-relaxed">
            Credential stuffing is an automated attack where attackers use large lists of stolen username/password pairs to gain unauthorised access to user accounts by brute-forcing login endpoints at scale.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-[#F6821F]">How the attack works</p>
          {[
            { step: '01', title: 'Data breach occurs', desc: 'Credentials are stolen from a third-party service and sold on the dark web.' },
            { step: '02', title: 'Automated testing', desc: 'Bots replay millions of credential pairs against login forms at high speed.' },
            { step: '03', title: 'Account takeover', desc: 'Successful logins grant attackers access to sensitive data and payment details.' },
          ].map(item => (
            <div key={item.step} className="flex gap-3">
              <span className="flex-none w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">{item.step}</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div
          className="bg-green-50 border border-green-100 rounded-2xl p-5 cursor-pointer hover:ring-2 hover:ring-green-300 transition-all select-none"
          onClick={() => { setUsername(DISPLAY_VALID_USERNAME); setPassword(DISPLAY_VALID_PASSWORD); setError('') }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-widest text-green-700">Valid User Credentials</p>
            <span className="text-[10px] text-green-500 font-medium">Click to autofill</span>
          </div>
          <div className="space-y-1.5 font-mono text-sm">
            <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-green-100">
              <span className="text-gray-500 text-xs">Username</span>
              <span className="text-gray-900 font-medium">{DISPLAY_VALID_USERNAME}</span>
            </div>
            <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-green-100">
              <span className="text-gray-500 text-xs">Password</span>
              <span className="text-gray-900 font-medium">{DISPLAY_VALID_PASSWORD}</span>
            </div>
          </div>
        </div>

        <div
          className="bg-red-50 border border-red-100 rounded-2xl p-5 cursor-pointer hover:ring-2 hover:ring-red-300 transition-all select-none"
          onClick={() => { setUsername(DISPLAY_LEAKED_USERNAME); setPassword(DISPLAY_LEAKED_PASSWORD); setError('') }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-widest text-red-600">Leaked Credentials</p>
            <span className="text-[10px] text-red-400 font-medium">Click to autofill</span>
          </div>
          <div className="space-y-1.5 font-mono text-sm">
            <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-red-100">
              <span className="text-gray-500 text-xs">Username</span>
              <span className="text-gray-900 font-medium">{DISPLAY_LEAKED_USERNAME}</span>
            </div>
            <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-red-100">
              <span className="text-gray-500 text-xs">Password</span>
              <span className="text-gray-900 font-medium">{DISPLAY_LEAKED_PASSWORD}</span>
            </div>
          </div>
          <p className="text-[11px] text-red-400 mt-3 leading-relaxed">
            In a real attack, bots would try thousands of credential pairs like these against this form automatically.
          </p>
        </div>
      </div>

      {/* Right — login form */}
      <div className="lg:sticky lg:top-24">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-400 px-8 py-8 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <User className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-white font-bold text-xl">Welcome back</h2>
            <p className="text-indigo-100 text-sm mt-1">Sign in to your account</p>
          </div>

          <form onSubmit={handleLogin} className="px-8 py-8 space-y-5">
            <div>
              <label htmlFor="cs-username" className="block text-xs font-semibold text-gray-700 mb-1.5">Username</label>
              <input
                id="cs-username"
                type="text"
                value={username}
                onChange={e => { setUsername(e.target.value); setError('') }}
                placeholder="Enter your username"
                autoComplete="username"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-all bg-gray-50 placeholder-gray-400"
              />
            </div>

            <div>
              <label htmlFor="cs-password" className="block text-xs font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  id="cs-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full px-4 py-2.5 pr-10 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-all bg-gray-50 placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-2.5">
                {error}
              </div>
            )}

            <div className="flex justify-center">
              <div ref={containerRef} />
            </div>

            <button
              type="submit"
              disabled={isLoading || !username || !password || !turnstileToken}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                isLoading || !username || !password || !turnstileToken
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-br from-indigo-500 to-purple-400 text-white hover:from-indigo-600 hover:to-purple-500 shadow-indigo-200'
              }`}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {isLoading ? 'Signing in…' : 'Sign in'}
            </button>

          </form>
        </div>
      </div>

    </div>
  )
}

function AccountView({ account, exposedCredCheck, onLogout }: { account: Account; exposedCredCheck: string | null; onLogout: () => void }) {
  const meaning = exposedCredCheck ? EXPOSED_CRED_MEANINGS[exposedCredCheck] : null
  return (
    <div className={`${exposedCredCheck ? 'grid grid-cols-1 xl:grid-cols-2 gap-8 items-start' : 'max-w-3xl mx-auto'} animate-fade-in`}>

      {/* Left column */}
      <div className="space-y-6">

      {/* Profile card */}
      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-400 h-28 relative">
          <div className="absolute -bottom-10 left-8">
            <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
              <img
                src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${account.avatarSeed}&backgroundColor=b6e3f4`}
                alt="Avatar"
                className="w-full h-full object-cover"
                onError={e => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>
          </div>
          <div className="absolute top-4 right-5">
            <span className="flex items-center gap-1 text-xs font-semibold bg-white/20 text-white px-2.5 py-1 rounded-full">
              <Star className="w-3 h-3 fill-white" /> {account.plan}
            </span>
          </div>
        </div>

        <div className="pt-14 px-8 pb-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{account.name}</h2>
              <p className="text-sm text-gray-500">{account.email}</p>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { icon: <Mail className="w-4 h-4" />, label: 'Email address', value: account.email },
          { icon: <Phone className="w-4 h-4" />, label: 'Phone number', value: account.phone },
          { icon: <MapPin className="w-4 h-4" />, label: 'Home address', value: account.address },
          { icon: <Calendar className="w-4 h-4" />, label: 'Member since', value: account.memberSince },
          { icon: <CreditCard className="w-4 h-4" />, label: 'Payment card', value: `•••• •••• •••• ${account.cardLast4}` },
          { icon: <User className="w-4 h-4" />, label: 'Account number', value: account.accountNumber },
        ].map(item => (
          <div key={item.label} className="bg-white rounded-2xl border border-gray-200 px-5 py-4 flex items-start gap-3">
            <div className="flex-none w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center mt-0.5">
              {item.icon}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400 font-medium">{item.label}</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5 truncate">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Threat summary */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-amber-700 mb-3">What Cloudflare would have blocked</p>
        <div className="space-y-2">
          {[
            'Detected automated login attempts from a known bot network',
            'Rate-limited requests exceeding 10 login attempts per second',
            'Flagged IP addresses matching threat intelligence feeds',
            'Challenged suspicious sessions with Turnstile CAPTCHA',
          ].map(item => (
            <div key={item} className="flex items-start gap-2 text-sm text-amber-800">
              <ShieldCheck className="w-4 h-4 text-amber-500 flex-none mt-0.5" />
              {item}
            </div>
          ))}
        </div>
      </div>

      </div>{/* end left column */}

      {/* Right column — Exposed-Credential-Check terminal */}
      {exposedCredCheck && (
        <div className="xl:sticky xl:top-6 space-y-3">
          <div className="rounded-2xl overflow-hidden border border-gray-800 shadow-xl">
            {/* Terminal title bar */}
            <div className="bg-gray-900 px-4 py-2.5 flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="w-3 h-3 rounded-full bg-yellow-400" />
                <span className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <span className="text-xs text-gray-400 font-mono ml-2">Cloudflare — leaked credentials detection</span>
            </div>
            {/* Terminal body */}
            <div className="bg-gray-950 px-5 py-5 font-mono text-sm space-y-4">
              <div>
                <p className="text-gray-500 text-xs mb-2">// Request header added by Cloudflare managed transform</p>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-blue-400">Exposed-Credential-Check</span>
                  <span className="text-red-400 font-bold text-base">{exposedCredCheck}</span>
                </div>
              </div>
              {meaning && (
                <div className="border-t border-gray-800 pt-4">
                  <p className="text-gray-500 text-xs mb-3">// Value reference</p>
                  <div className="space-y-2">
                    {Object.entries(EXPOSED_CRED_MEANINGS).map(([val, info]) => (
                      <div key={val} className={`flex items-start gap-3 rounded-lg px-3 py-2 ${val === exposedCredCheck ? 'bg-red-950/60 ring-1 ring-red-700' : 'opacity-40'}`}>
                        <span className={`flex-none font-bold text-base w-4 text-center ${val === exposedCredCheck ? 'text-red-400' : 'text-gray-500'}`}>{val}</span>
                        <span className={`text-xs leading-relaxed ${val === exposedCredCheck ? 'text-red-200' : 'text-gray-500'}`}>{info.short}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {meaning && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-red-700 mb-2">What this means</p>
              <p className="text-xs text-red-600 leading-relaxed">{meaning.detail}</p>
              <a
                href="https://developers.cloudflare.com/waf/detections/leaked-credentials/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-xs text-red-700 font-semibold hover:underline"
              >
                View docs →
              </a>
            </div>
          )}
        </div>
      )}

    </div>
  )
}

function WafBlockModal({
  data,
  onClose,
}: {
  data: { status: number; body: unknown }
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-red-300">
        <div className="bg-red-600 px-6 py-4 flex items-center gap-3">
          <div className="flex-none w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-base leading-tight">Login Request Blocked by WAF</p>
            <p className="text-red-200 text-xs mt-0.5">HTTP {data.status} Forbidden &middot; Cloudflare WAF</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex-none text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="bg-red-50 px-6 py-3 border-b border-red-100">
          <p className="text-sm text-red-800 leading-relaxed">
            Cloudflare&apos;s WAF detected and blocked this login request. The WAF response payload is shown below.
          </p>
        </div>
        <div className="bg-white border-t border-gray-200 px-4 py-4 overflow-auto max-h-72">
          {data.body === null ? (
            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-mono text-yellow-600">{'// WAF response body unavailable'}</p>
              <p className="text-[11px] font-mono text-gray-500 leading-relaxed">
                {'// The WAF returned HTTP 403 without CORS headers,\n// so the browser blocked access to the response body.\n//\n// To expose the WAF payload, add an HTTP Response\n// Header Transform Rule in the Cloudflare dashboard:\n//\n//   Zone \u2192 Rules \u2192 Transform Rules \u2192 Modify Response Headers\n//   Field : Access-Control-Allow-Origin\n//   Value : https://demo.jonathangoc.com'}
              </p>
            </div>
          ) : (
            <pre className="text-[11px] font-mono leading-relaxed whitespace-pre-wrap break-all">
              {JSON.stringify(data.body, null, 2)
                .split('\n')
                .map((line, i) => {
                  const keyMatch = line.match(/^(\s*)("[^"]+")(: )(.*)$/)
                  if (keyMatch) {
                    const [, indent, key, colon, val] = keyMatch
                    const isString = val.startsWith('"')
                    const isNumber = /^-?\d/.test(val)
                    const isBool = val === 'true' || val === 'false'
                    const isNull = val === 'null'
                    const valColor = isString ? 'text-green-700' : isNumber ? 'text-orange-600' : isBool ? 'text-blue-600' : isNull ? 'text-gray-400' : 'text-gray-700'
                    return (
                      <span key={i} className="block">
                        <span className="text-gray-400">{indent}</span>
                        <span className="text-red-700 font-medium">{key}</span>
                        <span className="text-gray-400">{colon}</span>
                        <span className={valColor}>{val}</span>
                      </span>
                    )
                  }
                  return <span key={i} className="block text-gray-600 font-medium">{line}</span>
                })}
            </pre>
          )}
        </div>
        <div className="bg-red-50 border-t border-red-100 px-6 py-4 flex items-center justify-between gap-3">
          <p className="text-xs text-red-400">Modify your credentials and try again.</p>
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>
        </div>
      </div>
    </div>
  )
}
