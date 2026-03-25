import { useState } from 'react'
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
  Eye,
  EyeOff,
  Calendar,
  Star,
  LogOut,
} from 'lucide-react'

const AUTH_API_BASE = import.meta.env.VITE_AUTH_API_URL ?? 'https://democredentialstuffing.jonathangoc.com'

const DISPLAY_VALID_USERNAME = 'jcarvalho@cloudflare.com'
const DISPLAY_VALID_PASSWORD = 'PleaseDontHackMe'
const DISPLAY_LEAKED_USERNAME = import.meta.env.VITE_EXPOSED_USERNAME ?? 'CF_EXPOSED_USERNAME@example.com'
const DISPLAY_LEAKED_PASSWORD = import.meta.env.VITE_EXPOSED_PASSWORD ?? 'CF_EXPOSED_PASSWORD'

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

  const handleLogin = (account: Account, token: string) => {
    setLoggedInAccount(account)
    setSessionToken(token)
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
          <a
            href="https://dash.cloudflare.com/?to=/:account/:zone/security/security-rules"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-[#F6821F] text-white px-3 py-1.5 rounded-full hover:bg-[#E07010] transition-colors font-medium"
          >
            Go to <strong>Security Rules</strong>
          </a>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-12">
          {loggedInAccount ? (
            <AccountView account={loggedInAccount} onLogout={handleLogout} />
          ) : (
            <LoginView onLogin={handleLogin} />
          )}
        </div>
      </div>
    </div>
  )
}

function LoginView({ onLogin }: { onLogin: (account: Account, token: string) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const res = await fetch(`${AUTH_API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Username: username, Password: password }),
      })
      const data = await res.json() as { token?: string; account?: Account; error?: string }
      if (!res.ok || !data.token || !data.account) {
        setError(data.error ?? 'Invalid username or password. Please try again.')
      } else {
        onLogin(data.account, data.token)
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
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => { setUsername(e.target.value); setError('') }}
                placeholder="Enter your username"
                autoComplete="username"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-all bg-gray-50 placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
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

            <button
              type="submit"
              disabled={isLoading || !username || !password}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                isLoading || !username || !password
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

function AccountView({ account, onLogout }: { account: Account; onLogout: () => void }) {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">

      {/* Success banner */}
      <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-5 py-4">
        <ShieldCheck className="w-5 h-5 text-green-600 flex-none" />
        <div>
          <p className="text-sm font-semibold text-green-800">Login successful — account accessed</p>
          <p className="text-xs text-green-600 mt-0.5">
            In a credential stuffing attack, this is the moment an attacker gains full control of the victim's account.
          </p>
        </div>
      </div>

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

    </div>
  )
}
