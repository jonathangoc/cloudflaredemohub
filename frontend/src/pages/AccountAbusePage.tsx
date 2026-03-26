import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  UserPlus,
  ShieldAlert,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  LogIn,
  Users,
  Lock,
  AlertTriangle,
  Zap,
} from 'lucide-react'

const ACCOUNT_ABUSE_API_BASE =
  import.meta.env.VITE_ACCOUNT_ABUSE_API_URL ?? 'https://demoaccountabuse.jonathangoc.com'

// --- Random data generator ---

const FIRST_NAMES = [
  'James', 'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'William', 'Sophia',
  'Benjamin', 'Isabella', 'Lucas', 'Mia', 'Henry', 'Charlotte', 'Alexander',
  'Amelia', 'Mason', 'Harper', 'Ethan', 'Evelyn', 'Daniel', 'Luna', 'Logan',
  'Aria', 'Jackson', 'Scarlett', 'Sebastian', 'Grace', 'Owen', 'Chloe',
]
const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
  'Davis', 'Wilson', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White',
  'Harris', 'Martin', 'Thompson', 'Young', 'Robinson', 'Clark', 'Lewis',
  'Lee', 'Walker', 'Hall', 'Allen', 'King', 'Wright', 'Scott', 'Hill', 'Green',
]
const DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'proton.me', 'icloud.com']
const ADJECTIVES = [
  'quick', 'brave', 'calm', 'dark', 'eager', 'fair', 'grand', 'happy',
  'kind', 'lucky', 'noble', 'proud', 'rapid', 'smart', 'swift', 'bold',
  'cool', 'fierce', 'giant', 'honest',
]
const NOUNS = [
  'eagle', 'tiger', 'river', 'mountain', 'ocean', 'forest', 'thunder',
  'castle', 'shadow', 'wizard', 'phoenix', 'falcon', 'dragon', 'knight',
  'ranger', 'arrow', 'comet', 'flame', 'storm', 'blade',
]

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateRandomUser() {
  const first = rand(FIRST_NAMES)
  const last = rand(LAST_NAMES)
  const domain = rand(DOMAINS)
  const num = Math.floor(Math.random() * 900) + 100
  const adj = rand(ADJECTIVES)
  const noun = rand(NOUNS)
  const passNum = Math.floor(Math.random() * 90) + 10
  return {
    name: `${first} ${last}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}${num}@${domain}`,
    password: `${adj.charAt(0).toUpperCase()}${adj.slice(1)}-${noun.charAt(0).toUpperCase()}${noun.slice(1)}-${passNum}!`,
  }
}

// --- Main page ---

interface CreatedAccount {
  email: string
  name: string
  createdAt: string
}

export default function AccountAbusePage() {
  const navigate = useNavigate()
  const [createdAccount, setCreatedAccount] = useState<CreatedAccount | null>(null)

  return (
    <div className="h-screen flex flex-col bg-[#FAFAFA] overflow-hidden">
      {/* Header */}
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
              <div className="p-1.5 bg-gradient-to-br from-rose-500 to-orange-400 rounded-lg text-white">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="text-sm font-semibold text-gray-900 leading-none">
                Account Abuse Protection
              </div>
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
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-12">
          {createdAccount ? (
            <SuccessView account={createdAccount} onReset={() => setCreatedAccount(null)} onLogin={() => navigate('/demo/credential-stuffing')} />
          ) : (
            <SignUpView onCreated={setCreatedAccount} />
          )}
        </div>
      </div>
    </div>
  )
}

// --- Sign-up view ---

function SignUpView({ onCreated }: { onCreated: (a: CreatedAccount) => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const fillRef = useRef(false)

  const autoFill = () => {
    fillRef.current = true
    const user = generateRandomUser()
    setName(user.name)
    setEmail(user.email)
    setPassword(user.password)
    setConfirmPassword(user.password)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`${ACCOUNT_ABUSE_API_BASE}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Username: email, Password: password, Name: name }),
      })
      const data = await res.json() as { success?: boolean; account?: CreatedAccount; error?: string }
      if (!res.ok || !data.account) {
        setError(data.error ?? 'Registration failed. Please try again.')
      } else {
        onCreated(data.account)
      }
    } catch {
      setError('Unable to reach the server. Please try again.')
    }
    setIsLoading(false)
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 items-start animate-fade-in">

      {/* Left — info panel */}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-3">
            Account Abuse Protection
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Fraud detection allows you to detect and mitigate account abuse among your traffic,
            specifically bulk account creation and account takeover attacks.
          </p>
        </div>

        {/* Attack types */}
        <div className="grid grid-cols-1 gap-4">
          <ThreatCard
            icon={<Users className="w-5 h-5" />}
            color="from-rose-500 to-orange-400"
            title="Bulk Account Creation"
            description="Attackers use bots to register thousands of fake accounts in seconds — to abuse free trials, collect bonuses, or stage future attacks."
          />
          <ThreatCard
            icon={<Lock className="w-5 h-5" />}
            color="from-orange-500 to-amber-400"
            title="Account Takeover"
            description="Credential stuffing and brute-force attacks attempt to hijack legitimate accounts using leaked username/password pairs."
          />
          <ThreatCard
            icon={<AlertTriangle className="w-5 h-5" />}
            color="from-amber-500 to-yellow-400"
            title="Fake Identity Fraud"
            description="Synthetic identities combine real and fabricated data to bypass traditional fraud detection systems at scale."
          />
        </div>

        {/* Cloudflare solutions */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-[#F6821F]" />
            <p className="text-xs font-bold tracking-widest text-[#F6821F] uppercase">
              Cloudflare Protection
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {['Bot Management', 'WAF Rules', 'Rate Limiting'].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#F6821F] rounded-full flex-none" />
                <span className="text-xs text-gray-600 font-mono">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — signup form */}
      <div className="flex justify-center">
        <div className="w-full max-w-md bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Form header */}
          <div className="bg-gradient-to-br from-rose-500 to-orange-400 px-8 py-7">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-white font-bold text-lg">Create an Account</h2>
            </div>
            <p className="text-rose-100 text-sm mt-1">
              Sign up to explore Account Abuse Protection
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
            {/* Auto-fill button */}
            <button
              type="button"
              onClick={autoFill}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border-2 border-dashed border-rose-200 text-rose-600 hover:border-rose-400 hover:bg-rose-50 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Auto-fill with random identity
            </button>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); setError('') }}
                placeholder="Enter your full name"
                autoComplete="name"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400 transition-all bg-gray-50 placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                placeholder="Enter your email address"
                autoComplete="email"
                required
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400 transition-all bg-gray-50 placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  required
                  className="w-full px-4 py-2.5 pr-10 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400 transition-all bg-gray-50 placeholder-gray-400"
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

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Confirm Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setError('') }}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  required
                  className="w-full px-4 py-2.5 pr-10 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400 transition-all bg-gray-50 placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
              disabled={isLoading || !email || !password || !confirmPassword}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                isLoading || !email || !password || !confirmPassword
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-br from-rose-500 to-orange-400 text-white hover:from-rose-600 hover:to-orange-500 shadow-rose-200'
              }`}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              {isLoading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>
      </div>

    </div>
  )
}

// --- Success view ---

function SuccessView({
  account,
  onReset,
  onLogin,
}: {
  account: CreatedAccount
  onReset: () => void
  onLogin: () => void
}) {
  return (
    <div className="max-w-xl mx-auto animate-fade-in">
      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
        {/* Green header */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-400 px-8 py-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-9 h-9 text-white" />
          </div>
          <h2 className="text-white text-2xl font-bold mb-1">Account Created!</h2>
          <p className="text-emerald-100 text-sm">Your account has been registered successfully.</p>
        </div>

        {/* Account details */}
        <div className="px-8 py-6 space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</span>
            <span className="text-sm font-medium text-gray-900">{account.name}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</span>
            <span className="text-sm font-medium text-gray-900">{account.email}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Created</span>
            <span className="text-sm font-medium text-gray-900">
              {new Date(account.createdAt).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-8 pb-8 space-y-3">
          <button
            onClick={onLogin}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-br from-indigo-500 to-purple-400 hover:from-indigo-600 hover:to-purple-500 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-indigo-200"
          >
            <LogIn className="w-4 h-4" />
            Go to Login — Credential Stuffing Demo
          </button>
          <button
            onClick={onReset}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Register another account
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 mt-6">
        Use these credentials to sign in on the{' '}
        <button onClick={onLogin} className="text-indigo-500 hover:underline font-medium">
          Credential Stuffing demo page
        </button>
        .
      </p>
    </div>
  )
}

// --- Threat card ---

function ThreatCard({
  icon,
  color,
  title,
  description,
}: {
  icon: React.ReactNode
  color: string
  title: string
  description: string
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex gap-4 items-start">
      <div className={`flex-none w-10 h-10 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center text-white shadow-sm`}>
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

