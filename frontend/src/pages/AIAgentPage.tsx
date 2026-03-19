import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Bot, Cloud, Globe, Calculator, CheckCircle,
  XCircle, AlertTriangle, ChevronDown, Loader2, Send, Trash2, Sparkles,
} from 'lucide-react'
import { useAgent } from 'agents/react'
import { useAgentChat } from '@cloudflare/ai-chat/react'

const AGENT_HOST = import.meta.env.DEV
  ? 'localhost:8788'
  : 'demoaiagent.jonathangoc.com'

// ---------------------------------------------------------------------------
// Local types that mirror the AI SDK UIMessage / UIMessagePart shape
// ---------------------------------------------------------------------------
interface TextPart {
  type: 'text'
  text: string
}
interface ToolPart {
  type: 'tool'
  toolCallId: string
  toolName: string
  state: 'input-streaming' | 'input-available' | 'output-streaming' | 'output-available' | 'approval-required'
  input?: Record<string, unknown>
  output?: unknown
}
type MsgPart = TextPart | ToolPart
interface AgentMsg {
  id: string
  role: 'user' | 'assistant'
  parts: MsgPart[]
}

// ---------------------------------------------------------------------------
// Tool metadata
// ---------------------------------------------------------------------------
interface ToolMeta {
  icon: React.ReactNode
  label: string
  typeBadge: string
  color: string
  bg: string
  border: string
  badge: string
}
const TOOL_CONFIG: Record<string, ToolMeta> = {
  getWeather: {
    icon: <Cloud className="w-3.5 h-3.5" />,
    label: 'Get Weather',
    typeBadge: 'Server-side',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
  },
  getUserTimezone: {
    icon: <Globe className="w-3.5 h-3.5" />,
    label: 'Get Timezone',
    typeBadge: 'Browser',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    badge: 'bg-purple-100 text-purple-700',
  },
  calculate: {
    icon: <Calculator className="w-3.5 h-3.5" />,
    label: 'Calculate',
    typeBadge: 'Approval',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-700',
  },
}

const SAMPLE_PROMPTS = [
  {
    category: '☁️ Weather',
    prompts: ["What's the weather in Paris?", 'Is it sunny in Tokyo?', 'Weather in New York'],
  },
  {
    category: '🌐 Timezone',
    prompts: ["What's my local timezone?", 'What time is it for me?'],
  },
  {
    category: '🔢 Calculate',
    prompts: ["What's 42 × 7?", 'Calculate 1500 + 2500', 'Divide 144 by 12'],
  },
]

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function AIAgentPage() {
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const agent = useAgent({ agent: 'ChatAgent', host: AGENT_HOST } as any)
  const {
    messages,
    sendMessage,
    clearHistory,
    addToolApprovalResponse,
    status,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useAgentChat({
    agent,
    // Catch network errors (e.g. agent backend not yet deployed) so use()
    // never sees a rejected promise and the Suspense boundary can resolve.
    getInitialMessages: async ({ url }: { url: string }) => {
      try {
        const res = await fetch(`${url}/get-messages`)
        if (!res.ok) return []
        const text = await res.text()
        if (!text.trim()) return []
        return JSON.parse(text)
      } catch {
        return []
      }
    },
    onToolCall: async ({ toolCall, addToolOutput }: {
      toolCall: { toolName: string; toolCallId: string }
      addToolOutput: (opts: { toolCallId: string; output: unknown }) => void
    }) => {
      if (toolCall.toolName === 'getUserTimezone') {
        addToolOutput({
          toolCallId: toolCall.toolCallId,
          output: {
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            localTime: new Date().toLocaleTimeString(),
          },
        })
      }
    },
  } as Parameters<typeof useAgentChat>[0])

  const msgs = messages as unknown as AgentMsg[]
  const isStreaming = status === 'streaming' || status === 'submitted'

  const handleSend = useCallback(() => {
    if (!input.trim() || isStreaming) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(sendMessage as any)({ text: input.trim() })
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }, [input, isStreaming, sendMessage])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const lastMsgIsAssistant = msgs.length > 0 && msgs[msgs.length - 1].role === 'assistant'

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="flex-none bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-500" />
          </button>
          <div className="p-1.5 bg-gradient-to-br from-violet-500 to-purple-400 rounded-lg text-white flex-none">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900 leading-none">AI Agent</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Cloudflare Agents SDK · Durable Objects</div>
          </div>
          <div className="flex items-center gap-1.5 ml-1">
            <div className={`w-1.5 h-1.5 rounded-full ${isStreaming ? 'bg-orange-400 animate-pulse' : 'bg-green-400'}`} />
            <span className="text-xs text-gray-500">{isStreaming ? 'Streaming' : 'Connected'}</span>
          </div>
        </div>
        <button
          onClick={() => clearHistory()}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-500 px-3 py-1.5 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear
        </button>
      </header>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left sidebar */}
        <aside className="hidden lg:flex flex-col w-60 flex-none border-r border-gray-200 bg-white overflow-y-auto">
          <div className="px-4 pt-4 pb-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Try these</p>
          </div>
          {SAMPLE_PROMPTS.map((cat) => (
            <div key={cat.category} className="px-3 py-2">
              <p className="text-[10px] font-medium text-gray-400 px-2 mb-1">{cat.category}</p>
              {cat.prompts.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    if (isStreaming) return
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ;(sendMessage as any)({ text: p })
                  }}
                  disabled={isStreaming}
                  className="w-full text-left text-xs text-gray-600 px-2 py-1.5 rounded-lg hover:bg-violet-50 hover:text-violet-700 transition-colors mb-0.5 disabled:opacity-40"
                >
                  {p}
                </button>
              ))}
            </div>
          ))}
        </aside>

        {/* Main chat column */}
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            {msgs.length === 0 ? (
              <WelcomeScreen />
            ) : (
              msgs.map((msg) => (
                <MessageRow
                  key={msg.id}
                  msg={msg}
                  onApprove={(id) => addToolApprovalResponse({ id, approved: true })}
                  onReject={(id) => addToolApprovalResponse({ id, approved: false })}
                />
              ))
            )}

            {/* Typing indicator while waiting for first assistant token */}
            {isStreaming && !lastMsgIsAssistant && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-400 flex items-center justify-center flex-none">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div className="flex-none border-t border-gray-200 bg-white px-4 pt-3 pb-4">
            <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2 focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-100 transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
                }}
                placeholder="Ask the agent anything… (Enter to send)"
                rows={1}
                disabled={isStreaming}
                className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 resize-none outline-none leading-relaxed disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
                className={`flex-none p-2 rounded-xl transition-all ${
                  input.trim() && !isStreaming
                    ? 'bg-gradient-to-br from-violet-500 to-purple-400 text-white hover:from-violet-600 hover:to-purple-500 shadow-md shadow-violet-200'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-center text-xs text-gray-300 mt-2">Powered by Cloudflare Agents SDK</p>
          </div>
        </div>

        {/* Right panel — tool legend */}
        <aside className="hidden xl:flex flex-col w-64 flex-none border-l border-gray-200 bg-white overflow-y-auto">
          <div className="px-4 pt-4 pb-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Tool Types</p>
          </div>
          {[
            {
              icon: <Cloud className="w-4 h-4" />,
              label: 'Server-side',
              badge: 'bg-blue-100 text-blue-700',
              desc: 'Executes automatically on the server. No user interaction needed.',
              example: 'getWeather',
            },
            {
              icon: <Globe className="w-4 h-4" />,
              label: 'Browser',
              badge: 'bg-purple-100 text-purple-700',
              desc: "Handled in the user's browser. Returns local device data.",
              example: 'getUserTimezone',
            },
            {
              icon: <AlertTriangle className="w-4 h-4" />,
              label: 'Approval-gated',
              badge: 'bg-amber-100 text-amber-700',
              desc: 'Pauses the agent and asks the user to approve before executing.',
              example: 'calculate (> 1000)',
            },
          ].map((t) => (
            <div key={t.label} className="mx-3 mb-3 p-3 rounded-xl border border-gray-100 bg-gray-50">
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${t.badge} inline-block mb-1.5`}>
                {t.label}
              </span>
              <p className="text-[11px] text-gray-500 leading-relaxed mb-1.5">{t.desc}</p>
              <p className="text-[10px] font-mono text-gray-400">e.g. {t.example}</p>
            </div>
          ))}
          <div className="px-4 pt-1 pb-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Architecture</p>
            <div className="text-[11px] text-gray-500 leading-relaxed space-y-1">
              <p>• Agent runs as a <span className="font-medium text-gray-700">Durable Object</span></p>
              <p>• Persistent WebSocket connection</p>
              <p>• SQLite-backed message history</p>
              <p>• Workers AI inference at the edge</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Welcome screen
// ---------------------------------------------------------------------------
function WelcomeScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 text-center max-w-lg mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-400 flex items-center justify-center mb-5 shadow-lg shadow-violet-200">
        <Sparkles className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">AI Agent with Tools</h2>
      <p className="text-sm text-gray-500 leading-relaxed mb-8 max-w-sm">
        A streaming AI agent running on Cloudflare Agents SDK. It can call server-side tools, execute client-side tools in your browser, and ask for approval before sensitive actions.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
        {[
          { icon: <Cloud className="w-5 h-5" />, title: 'Server-side', eg: '"Weather in Paris?"', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
          { icon: <Globe className="w-5 h-5" />, title: 'Browser', eg: "\"What's my timezone?\"", color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100' },
          { icon: <AlertTriangle className="w-5 h-5" />, title: 'Approval-gated', eg: '"Calculate 1500+2500"', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
        ].map((c) => (
          <div key={c.title} className={`p-3 rounded-xl border ${c.bg} text-left`}>
            <div className={`mb-1 ${c.color}`}>{c.icon}</div>
            <div className="text-xs font-semibold text-gray-700 mb-0.5">{c.title}</div>
            <div className="text-[10px] text-gray-400 font-mono">{c.eg}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Message row
// ---------------------------------------------------------------------------
function MessageRow({
  msg,
  onApprove,
  onReject,
}: {
  msg: AgentMsg
  onApprove: (id: string) => void
  onReject: (id: string) => void
}) {
  const isUser = msg.role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-400 flex items-center justify-center flex-none mt-0.5">
          <Bot className="w-3.5 h-3.5 text-white" />
        </div>
      )}
      <div className={`flex-1 min-w-0 space-y-2 ${isUser ? 'flex flex-col items-end' : ''}`}>
        {msg.parts.map((part, i) => {
          if (part.type === 'text' && part.text) {
            return (
              <div
                key={i}
                className={`px-4 py-3 rounded-2xl shadow-sm max-w-[85%] text-sm leading-relaxed whitespace-pre-wrap ${
                  isUser
                    ? 'bg-gradient-to-br from-violet-500 to-purple-400 text-white rounded-tr-sm'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
                }`}
              >
                {part.text}
              </div>
            )
          }
          if (part.type === 'tool') {
            return (
              <ToolCallCard
                key={part.toolCallId}
                part={part as ToolPart}
                onApprove={onApprove}
                onReject={onReject}
              />
            )
          }
          return null
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tool call card
// ---------------------------------------------------------------------------
function ToolCallCard({
  part,
  onApprove,
  onReject,
}: {
  part: ToolPart
  onApprove: (id: string) => void
  onReject: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const meta = TOOL_CONFIG[part.toolName]

  const isLoading =
    part.state === 'input-streaming' ||
    part.state === 'input-available' ||
    part.state === 'output-streaming'
  const isDone = part.state === 'output-available'
  const needsApproval = part.state === 'approval-required'

  const bg     = meta?.bg     ?? 'bg-gray-50'
  const border = meta?.border ?? 'border-gray-200'
  const badge  = meta?.badge  ?? 'bg-gray-100 text-gray-600'
  const color  = meta?.color  ?? 'text-gray-700'

  const inputEntries = part.input ? Object.entries(part.input) : []

  return (
    <div className={`max-w-sm rounded-xl border ${border} ${bg} overflow-hidden text-left`}>

      {/* Header row */}
      <div className={`flex items-center justify-between px-3 py-2 border-b ${border}`}>
        <div className={`flex items-center gap-1.5 ${color} font-medium text-xs`}>
          {meta?.icon ?? <Sparkles className="w-3.5 h-3.5" />}
          {meta?.label ?? part.toolName}
        </div>
        <div className="flex items-center gap-1.5">
          {needsApproval ? (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
              <AlertTriangle className="w-2.5 h-2.5" /> Approval Required
            </span>
          ) : (
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${badge}`}>
              {meta?.typeBadge ?? 'Tool'}
            </span>
          )}
          {isDone && <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
          {isLoading && <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" />}
        </div>
      </div>

      {/* Input args */}
      {inputEntries.length > 0 && (
        <div className="px-3 py-1.5 text-[11px] font-mono text-gray-500 border-b border-gray-100/80">
          {inputEntries.map(([k, v]) => (
            <span key={k} className="mr-3">
              <span className="text-gray-400">{k}:</span> {String(v)}
            </span>
          ))}
        </div>
      )}

      {/* Approval buttons */}
      {needsApproval && (
        <div className="flex gap-2 px-3 py-2.5">
          <button
            onClick={() => onApprove(part.toolCallId)}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            <CheckCircle className="w-3.5 h-3.5" /> Approve
          </button>
          <button
            onClick={() => onReject(part.toolCallId)}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            <XCircle className="w-3.5 h-3.5" /> Reject
          </button>
        </div>
      )}

      {/* Result (collapsible) */}
      {isDone && part.output != null && (
        <>
          <button
            onClick={() => setExpanded((p) => !p)}
            className={`w-full flex items-center justify-between px-3 py-2 text-[11px] text-gray-500 hover:bg-black/5 transition-colors border-t ${border}`}
          >
            <span>View result</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
          {expanded && (
            <pre className="px-3 pb-3 text-[10px] font-mono text-gray-600 whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-40">
              {JSON.stringify(part.output, null, 2)}
            </pre>
          )}
        </>
      )}
    </div>
  )
}
