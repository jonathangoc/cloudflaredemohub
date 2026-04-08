import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Network, Send, Trash2, Crown, User, Loader2,
  Sparkles, Mail, ChevronRight, ZoomIn, ZoomOut, Maximize2,
} from 'lucide-react'

const MODEL = 'dynamic/my_route'

const EXAMPLE_PROMPTS = [
  'What are the key benefits of Cloudflare AI Gateway?',
  'Explain semantic caching in simple terms',
  'Write a short poem about cloud security',
  'What is rate limiting for AI APIs?',
]

interface Message { role: 'user' | 'assistant'; content: string }

/* ── Diagram (pan/zoom SVG) ─────────────────────────── */

function Diagram() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState({ tx: 0, ty: 0, scale: 0.78 })
  const drag = useRef({ on: false, sx: 0, sy: 0, stx: 0, sty: 0 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      setView(v => ({ ...v, scale: Math.min(3, Math.max(0.2, v.scale * (1 - e.deltaY * 0.001))) }))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const onDown = (e: React.MouseEvent) => {
    drag.current = { on: true, sx: e.clientX, sy: e.clientY, stx: view.tx, sty: view.ty }
  }
  const onMove = (e: React.MouseEvent) => {
    if (!drag.current.on) return
    setView(v => ({ ...v, tx: drag.current.stx + e.clientX - drag.current.sx, ty: drag.current.sty + e.clientY - drag.current.sy }))
  }
  const onUp = () => { drag.current.on = false }
  const resetView = () => setView({ tx: 0, ty: 0, scale: 0.78 })

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-[#F8FAFC] cursor-grab active:cursor-grabbing select-none"
      onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
    >
      {/* dot grid background */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <pattern id="dot-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="#CBD5E1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dot-grid)" />
      </svg>

      {/* zoom controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1 pointer-events-auto">
        <button onClick={() => setView(v => ({ ...v, scale: Math.min(3, v.scale + 0.15) }))} className="w-7 h-7 bg-white border border-gray-200 rounded-md flex items-center justify-center text-gray-500 hover:bg-gray-50 shadow-sm">
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => setView(v => ({ ...v, scale: Math.max(0.2, v.scale - 0.15) }))} className="w-7 h-7 bg-white border border-gray-200 rounded-md flex items-center justify-center text-gray-500 hover:bg-gray-50 shadow-sm">
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button onClick={resetView} className="w-7 h-7 bg-white border border-gray-200 rounded-md flex items-center justify-center text-gray-500 hover:bg-gray-50 shadow-sm">
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* diagram */}
      <svg
        viewBox="0 0 980 680"
        width="980"
        height="680"
        className="absolute overflow-visible pointer-events-none"
        style={{
          left: '50%', top: '50%',
          transform: `translate(calc(-50% + ${view.tx}px), calc(-50% + ${view.ty}px)) scale(${view.scale})`,
          transformOrigin: 'center center',
        }}
      >
        {/* ── LINES ── */}
        {/* START → my_route */}
        <line x1="490" y1="38" x2="490" y2="55" stroke="#94A3B8" strokeWidth="1.5" />
        {/* my_route → SPLIT badge */}
        <line x1="490" y1="95" x2="490" y2="138" stroke="#94A3B8" strokeWidth="1.5" />
        {/* SPLIT → If/Else box */}
        <line x1="490" y1="162" x2="490" y2="175" stroke="#94A3B8" strokeWidth="1.5" />
        {/* If/Else → fork */}
        <line x1="490" y1="233" x2="490" y2="248" stroke="#94A3B8" strokeWidth="1.5" />
        <line x1="125" y1="248" x2="805" y2="248" stroke="#94A3B8" strokeWidth="1.5" />
        <line x1="125" y1="248" x2="125" y2="283" stroke="#94A3B8" strokeWidth="1.5" />
        <line x1="805" y1="248" x2="805" y2="283" stroke="#94A3B8" strokeWidth="1.5" />

        {/* True/False labels */}
        <rect x="221" y="240" width="36" height="16" rx="4" fill="#22C55E" />
        <text x="239" y="252" textAnchor="middle" fontSize="11" fill="white" fontWeight="700">True</text>
        <rect x="655" y="240" width="40" height="16" rx="4" fill="#EF4444" />
        <text x="675" y="252" textAnchor="middle" fontSize="11" fill="white" fontWeight="700">False</text>

        {/* LEFT branch */}
        <line x1="125" y1="352" x2="125" y2="394" stroke="#94A3B8" strokeWidth="1.5" />
        {/* MODEL 1 → MODEL 2 fallback (horizontal dashed red) */}
        <line x1="240" y1="427" x2="290" y2="427" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="5 3" />
        <text x="242" y="421" fontSize="11" fill="#EF4444" fontWeight="600">Fallback</text>

        {/* RIGHT branch */}
        <line x1="805" y1="352" x2="805" y2="396" stroke="#94A3B8" strokeWidth="1.5" />
        {/* right primary (gray) → llama3.1-8b */}
        <line x1="645" y1="396" x2="805" y2="396" stroke="#94A3B8" strokeWidth="1.5" />
        <line x1="645" y1="396" x2="645" y2="412" stroke="#94A3B8" strokeWidth="1.5" />
        {/* right fallback (red) → gpt-oss-120b */}
        <line x1="805" y1="396" x2="960" y2="396" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="5 3" />
        <line x1="960" y1="396" x2="960" y2="412" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="5 3" />
        <text x="838" y="390" fontSize="11" fill="#EF4444" fontWeight="600">Fallback</text>

        {/* RATE LIMIT fallback: exits right from RATE LIMIT box → down to End (red dashed) */}
        <line x1="235" y1="324" x2="510" y2="324" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="5 3" />
        <text x="285" y="318" fontSize="11" fill="#EF4444" fontWeight="600">Fallback</text>
        <line x1="510" y1="324" x2="510" y2="612" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="5 3" />

        {/* MODEL 1 + MODEL 2 → End (grey) */}
        <line x1="125" y1="454" x2="125" y2="570" stroke="#94A3B8" strokeWidth="1.5" />
        <line x1="390" y1="454" x2="390" y2="570" stroke="#94A3B8" strokeWidth="1.5" />
        <line x1="125" y1="570" x2="415" y2="570" stroke="#94A3B8" strokeWidth="1.5" />
        <line x1="415" y1="570" x2="415" y2="612" stroke="#94A3B8" strokeWidth="1.5" />

        {/* right primary + fallback → End */}
        <line x1="645" y1="464" x2="645" y2="612" stroke="#94A3B8" strokeWidth="1.5" />
        <line x1="960" y1="454" x2="960" y2="612" stroke="#94A3B8" strokeWidth="1.5" />
        <line x1="960" y1="612" x2="565" y2="612" stroke="#94A3B8" strokeWidth="1.5" />

        {/* ── NODES ── */}

        {/* START */}
        <rect x="422" y="12" width="136" height="26" rx="13" fill="#3B82F6" />
        <text x="490" y="29" textAnchor="middle" fontSize="13" fill="white" fontWeight="700">⚡ START</text>

        {/* dynamic/my_route */}
        <rect x="332" y="55" width="316" height="40" rx="8" fill="white" stroke="#93C5FD" strokeWidth="2" />
        <text x="490" y="80" textAnchor="middle" fontSize="15" fill="#1D4ED8" fontWeight="600">dynamic / my_route</text>

        {/* SPLIT badge */}
        <rect x="453" y="138" width="74" height="24" rx="12" fill="#3B82F6" />
        <text x="490" y="154" textAnchor="middle" fontSize="12" fill="white" fontWeight="700">◇ SPLIT</text>

        {/* If / Else box */}
        <rect x="352" y="162" width="276" height="71" rx="8" fill="white" stroke="#93C5FD" strokeWidth="1.5" strokeDasharray="5 3" />
        <text x="372" y="184" fontSize="15" fill="#374151" fontWeight="500">If / Else</text>
        <text x="372" y="204" fontSize="13" fill="#6B7280">plan == free</text>

        {/* ── LEFT BRANCH ── */}
        <rect x="15" y="296" width="220" height="56" rx="8" fill="white" stroke="#E5E7EB" strokeWidth="1.5" />
        <text x="33" y="320" fontSize="13" fill="#374151">🔑 On metadata.email</text>
        <text x="33" y="340" fontSize="12" fill="#6B7280">2 requests / min</text>
        <rect x="53" y="278" width="144" height="22" rx="11" fill="#EF4444" />
        <text x="125" y="293" textAnchor="middle" fontSize="12" fill="white" fontWeight="700">⚡ RATE LIMIT</text>

        <rect x="10" y="400" width="230" height="54" rx="8" fill="white" stroke="#E5E7EB" strokeWidth="1.5" />
        <circle cx="29" cy="419" r="8" fill="#F6821F" />
        <text x="43" y="423" fontSize="13" fill="#374151" fontWeight="500">@cf/meta/llama-3.3-7...</text>
        <text x="43" y="441" fontSize="11" fill="#6B7280">Workers AI</text>
        <rect x="53" y="382" width="144" height="22" rx="11" fill="#22C55E" />
        <text x="125" y="397" textAnchor="middle" fontSize="12" fill="white" fontWeight="700">⚙ MODEL</text>

        {/* left fallback model – horizontally aligned right of MODEL 1 */}
        <rect x="290" y="400" width="200" height="54" rx="8" fill="white" stroke="#E5E7EB" strokeWidth="1.5" />
        <circle cx="309" cy="419" r="8" fill="#F6821F" />
        <text x="323" y="423" fontSize="13" fill="#374151" fontWeight="500">@cf/meta/llama-3.1-8...</text>
        <text x="323" y="441" fontSize="11" fill="#6B7280">Workers AI</text>
        <rect x="318" y="382" width="144" height="22" rx="11" fill="#22C55E" />
        <text x="390" y="397" textAnchor="middle" fontSize="12" fill="white" fontWeight="700">⚙ MODEL</text>

        {/* ── RIGHT BRANCH ── */}
        <rect x="695" y="296" width="220" height="56" rx="8" fill="white" stroke="#E5E7EB" strokeWidth="1.5" />
        <text x="713" y="320" fontSize="13" fill="#374151">🔑 Rate Limit</text>
        <text x="713" y="340" fontSize="12" fill="#6B7280">30 requests / min</text>
        <rect x="733" y="278" width="144" height="22" rx="11" fill="#EF4444" />
        <text x="805" y="293" textAnchor="middle" fontSize="12" fill="white" fontWeight="700">⚡ RATE LIMIT</text>

        {/* right primary model: llama3.1-8b Cerebras */}
        <rect x="545" y="400" width="200" height="54" rx="8" fill="white" stroke="#E5E7EB" strokeWidth="1.5" />
        <circle cx="563" cy="419" r="8" fill="#EF4444" />
        <text x="577" y="423" fontSize="13" fill="#374151" fontWeight="500">llama3.1-8b</text>
        <text x="577" y="441" fontSize="11" fill="#6B7280">Cerebras</text>
        <rect x="573" y="382" width="144" height="22" rx="11" fill="#22C55E" />
        <text x="645" y="397" textAnchor="middle" fontSize="12" fill="white" fontWeight="700">⚙ MODEL</text>

        {/* right fallback model: gpt-oss-120b Workers AI */}
        <rect x="860" y="400" width="198" height="54" rx="8" fill="white" stroke="#E5E7EB" strokeWidth="1.5" />
        <circle cx="878" cy="419" r="8" fill="#F6821F" />
        <text x="892" y="423" fontSize="13" fill="#374151" fontWeight="500">gpt-oss-120b</text>
        <text x="892" y="441" fontSize="11" fill="#6B7280">Workers AI</text>
        <rect x="888" y="382" width="144" height="22" rx="11" fill="#22C55E" />
        <text x="960" y="397" textAnchor="middle" fontSize="12" fill="white" fontWeight="700">⚙ MODEL</text>

        {/* ── BOTTOM ── */}
        <rect x="415" y="612" width="150" height="36" rx="8" fill="white" stroke="#E5E7EB" strokeWidth="1.5" />
        <text x="490" y="635" textAnchor="middle" fontSize="15" fill="#374151">End</text>
      </svg>
    </div>
  )
}

/* ── Chat bubble ─────────────────────────────────────── */

function ChatBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && (
        <div className="flex-none w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm mt-0.5">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
      )}
      <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
        isUser ? 'bg-gray-900 text-white rounded-tr-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
      }`}>
        {msg.content}
      </div>
    </div>
  )
}

export default function AIGatewayPage() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [plan, setPlan] = useState<'premium' | 'free'>('premium')
  const [email, setEmail] = useState('user@example.com')
  const [input, setInput] = useState('')
  const [diagramWidth, setDiagramWidth] = useState(480)
  const isResizing = useRef(false)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isResizing.current) return
      const newWidth = window.innerWidth - e.clientX
      setDiagramWidth(Math.min(Math.max(newWidth, 280), window.innerWidth - 280))
    }
    const onUp = () => { isResizing.current = false; document.body.style.cursor = '' }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return
    const userMsg: Message = { role: 'user', content: text }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput('')
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/aig', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-aig-metadata': JSON.stringify({ plan, email: email.trim() || undefined }),
        },
        body: JSON.stringify({ model: MODEL, messages: history }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string; message?: string }
        if (res.status === 429) throw new Error(err.message ?? 'Rate limit exceeded (429)')
        throw new Error(err.error ?? `HTTP ${res.status}`)
      }
      const data = await res.json() as { choices?: { message?: { content?: string } }[], result?: { response?: string } }
      const content = data.choices?.[0]?.message?.content ?? data.result?.response ?? 'No response'
      setMessages(h => [...h, { role: 'assistant', content }])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages, plan, email])

  return (
    <div className="h-screen flex flex-col bg-[#FAFAFA] overflow-hidden">
      {/* Header */}
      <header className="glass border-b border-gray-200/50 flex-none">
        <div className="px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-amber-500 to-orange-400 rounded-lg text-white">
                <Network className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-gray-900">AI Gateway</span>
            </div>
            <span className="hidden sm:flex items-center gap-1 text-xs text-gray-400">
              <ChevronRight className="w-3 h-3" />
              Observe and control your AI applications
            </span>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button onClick={() => { setMessages([]); setError(null) }} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />Clear
              </button>
            )}
            <a href="https://dash.cloudflare.com/?to=/:account/ai/ai-gateway/gateways" target="_blank" rel="noopener noreferrer"
              className="text-xs bg-[#F6821F] text-white px-3 py-1.5 rounded-full hover:bg-[#E07010] transition-colors font-medium">
              AI Gateway <strong>Dashboard</strong>
            </a>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* ── Chat panel (left) ── */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* User config */}
          <div className="flex-none px-4 py-3 bg-white border-b border-gray-100 space-y-2.5">
            {/* Plan toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-10 flex-none">Plan</span>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
                <button onClick={() => setPlan('premium')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${plan === 'premium' ? 'bg-amber-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                  <Crown className="w-3 h-3" />Premium
                </button>
                <button onClick={() => setPlan('free')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${plan === 'free' ? 'bg-gray-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                  <User className="w-3 h-3" />Free
                </button>
              </div>
            </div>
            {/* Email */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-10 flex-none">Email</span>
              <div className="flex-1 flex items-center gap-1.5 border border-gray-200 rounded-lg px-2.5 py-1.5">
                <Mail className="w-3 h-3 text-gray-400 flex-none" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="metadata.email"
                  className="flex-1 text-xs outline-none bg-transparent text-gray-700 placeholder-gray-400 font-mono" />
              </div>
            </div>
            {/* Live metadata preview */}
            <div className="text-[10px] font-mono bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-500 truncate">
              <span className="text-gray-400">cf-aig-metadata: </span>
              {JSON.stringify({ plan, email: email.trim() || undefined })}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <Network className="w-6 h-6 text-amber-500" />
                </div>
                <p className="text-sm text-gray-500">Select a plan, set your email,<br />and start chatting</p>
                <p className="text-xs text-gray-400">Routed via <code className="bg-gray-100 px-1 rounded">dynamic/my_route</code></p>
              </div>
            )}
            {messages.map((m, i) => <ChatBubble key={i} msg={m} />)}
            {loading && (
              <div className="flex gap-2.5">
                <div className="flex-none w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-3.5 py-3 shadow-sm">
                  <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                </div>
              </div>
            )}
            {error && <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="flex-none border-t border-gray-100 bg-white px-3 pb-3 pt-2.5 space-y-2">
            <div className="flex flex-wrap gap-1">
              {EXAMPLE_PROMPTS.map(p => (
                <button key={p} onClick={() => { setInput(p); inputRef.current?.focus() }} disabled={loading}
                  className="text-[11px] bg-gray-100 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 text-gray-600 border border-gray-200 px-2 py-0.5 rounded-full transition-colors disabled:opacity-40">
                  {p}
                </button>
              ))}
            </div>
            <div className="flex gap-2 items-end">
              <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder="Send a message… (Enter to send)" rows={2} disabled={loading}
                className="flex-1 resize-none text-sm rounded-xl border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all placeholder-gray-400 disabled:opacity-60" />
              <button onClick={send} disabled={!input.trim() || loading}
                className="flex-none flex items-center gap-1.5 px-3.5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-400 text-white text-sm font-semibold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Drag handle ── */}
        <div
          className="flex-none w-1.5 cursor-col-resize bg-gray-200 hover:bg-amber-400 transition-colors active:bg-amber-500"
          onMouseDown={() => { isResizing.current = true; document.body.style.cursor = 'col-resize' }}
        />

        {/* ── Diagram panel (right) ── */}
        <div className="flex-none flex flex-col" style={{ width: diagramWidth }}>
          <div className="flex-none px-4 py-2.5 bg-white border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Dynamic Route</p>
              <p className="text-[11px] text-gray-400">Route each request to an LLM best fit for the job. Enforce rate limits, spend caps and custom conditional rules. Split traffic by percentage, target specific models or providers, and automatically fail over on errors.</p>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <Diagram />
          </div>
        </div>

      </div>
    </div>
  )
}
