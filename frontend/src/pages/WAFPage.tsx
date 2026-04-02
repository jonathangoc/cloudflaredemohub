import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Database,
  Terminal,
  Code,
  Loader2,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  Minus,
  Plus,
} from 'lucide-react'
import WafBlockModal from '../components/WafBlockModal'

const WAF_API_BASE = import.meta.env.VITE_WAF_API_URL ?? 'https://demowaf.jonathangoc.com'

const ATTACKS = [
  {
    id: 'sql',
    name: 'SQL Injection',
    shortName: 'SQLi',
    Icon: Database,
    description:
      'Attempts to manipulate database queries via a UNION-based injection to extract password data from the Users table.',
    query:
      '?**/UN/**/ION/**/SEL/**/ECT/**/password/**/FR/OM/**/Users/**/WHE/**/RE/**/usersame/**/LIKE/**/%27tom',
    cardBg: 'linear-gradient(135deg, rgb(253, 207, 120), rgb(251, 173, 65))',
    borderColor: 'border-orange-200',
    bgLight: 'bg-orange-50',
    textAccent: 'text-orange-500',
  },
  {
    id: 'rce',
    name: 'Remote Code Execution',
    shortName: 'RCE',
    Icon: Terminal,
    description:
      'Exploits a path traversal vulnerability to read sensitive system files by escaping the web root via ../../../../ sequences.',
    query:
      '?g=sys_dia_data_down&file_name=../../../../../../../../../../../../etc/passwd',
    cardBg: 'linear-gradient(135deg, rgb(250, 172, 90), rgb(246, 130, 31))',
    borderColor: 'border-orange-300',
    bgLight: 'bg-orange-50',
    textAccent: 'text-orange-600',
  },
  {
    id: 'xss',
    name: 'Cross-Site Scripting',
    shortName: 'XSS',
    Icon: Code,
    description:
      'Injects a malicious SVG payload with an inline event handler, attempting to execute arbitrary JavaScript in the victim\'s browser.',
    query: '?globalHtml=%3Csvg%20on%20onContextMenu=alert(1337)%3E',
    cardBg: 'linear-gradient(135deg, rgb(255, 148, 108), rgb(255, 102, 51))',
    borderColor: 'border-orange-400',
    bgLight: 'bg-orange-100',
    textAccent: 'text-orange-800',
  },
] as const

type AttackId = (typeof ATTACKS)[number]['id']
type AttackStatus = 'idle' | 'sending' | 'done'

interface AttackState {
  count: number
  status: AttackStatus
  sent: number
  blocked: number
  reached: number
}

const defaultState = (): AttackState => ({
  count: 1,
  status: 'idle',
  sent: 0,
  blocked: 0,
  reached: 0,
})


export default function WAFPage() {
  const navigate = useNavigate()

  const [states, setStates] = useState<Record<AttackId, AttackState>>({
    sql: defaultState(),
    rce: defaultState(),
    xss: defaultState(),
  })

  const [wafBlockData, setWafBlockData] = useState<{
    status: number
    body: unknown
    footerMessage?: string
  } | null>(null)

  const update = (
    id: AttackId,
    patch: Partial<AttackState> | ((s: AttackState) => Partial<AttackState>)
  ) => {
    setStates((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...(typeof patch === 'function' ? patch(prev[id]) : patch),
      },
    }))
  }

  const sendAttacks = async (id: AttackId, query: string) => {
    const total = states[id].count
    update(id, { status: 'sending', sent: 0, blocked: 0, reached: 0 })

    let firstBlockBody: unknown = null
    let anyBlocked = false

    for (let i = 0; i < total; i++) {
      let res: Response | null = null
      try {
        res = await fetch(`${WAF_API_BASE}${query}`)
      } catch {
        anyBlocked = true
        update(id, (s) => ({ sent: s.sent + 1, blocked: s.blocked + 1 }))
        continue
      }

      update(id, (s) => ({ sent: s.sent + 1 }))

      if (res.status === 403) {
        anyBlocked = true
        update(id, (s) => ({ blocked: s.blocked + 1 }))
        if (firstBlockBody === null) {
          try {
            const text = await res.text()
            try {
              firstBlockBody = JSON.parse(text)
            } catch {
              firstBlockBody = text || null
            }
          } catch { /* ignore */ }
        }
      } else {
        update(id, (s) => ({ reached: s.reached + 1 }))
      }
    }

    update(id, { status: 'done' })

    if (anyBlocked) {
      setWafBlockData({
        status: 403,
        body: firstBlockBody,
        footerMessage: 'WAF rules are blocking this attack from reaching the origin.',
      })
    }
  }

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
              <div className="p-1.5 bg-gradient-to-br from-blue-600 to-indigo-500 rounded-lg text-white">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="text-sm font-semibold text-gray-900 leading-none">
                Web Application Firewall
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://dash.cloudflare.com/?to=/:account/:zone/security/waf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-[#F6821F] text-white px-3 py-1.5 rounded-full hover:bg-[#E07010] transition-colors font-medium"
            >
              Go to <strong>WAF Rules</strong>
            </a>
            <a
              href="https://dash.cloudflare.com/?to=/:account/:zone/security/events"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-[#F6821F] text-white px-3 py-1.5 rounded-full hover:bg-[#E07010] transition-colors font-medium"
            >
              Go to <strong>Security Events</strong>
            </a>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-4 space-y-4">

          {/* Description */}
          <div className="bg-white rounded-2xl border border-gray-200 px-6 py-4">
            <div className="flex items-start gap-3">
              <div className="flex-none w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-500 rounded-lg flex items-center justify-center text-white mt-0.5">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Get automatic protection from vulnerabilities and the flexibility to create custom
                rules. The <strong>Cloudflare Web Application Firewall (WAF)</strong> checks
                incoming web and API requests and filters undesired traffic based on sets of rules
                called rulesets. The WAF uses the <strong>Rules language</strong>, a flexible
                expression syntax that lets you filter traffic by request properties such as IP
                address, URL path, headers, and body content.
              </p>
            </div>
          </div>

          {/* Attack cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ATTACKS.map((attack) => {
              const st = states[attack.id]
              const { Icon } = attack
              const isSending = st.status === 'sending'
              const isDone = st.status === 'done'

              return (
                <div
                  key={attack.id}
                  className={`bg-white rounded-2xl border ${attack.borderColor} overflow-hidden shadow-sm`}
                >
                  {/* Card header */}
                  <div className="px-5 py-4" style={{ background: attack.cardBg }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-black/10 rounded-xl flex items-center justify-center text-gray-900">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-gray-900 font-bold text-sm leading-tight">
                            {attack.name}
                          </p>
                          <p className="text-gray-700 text-xs mt-0.5">{attack.shortName} Attack</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-black/10 text-gray-900">
                        WAF
                      </span>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="px-5 py-4 space-y-4">
                    <p className="text-sm text-gray-600 leading-relaxed">{attack.description}</p>

                    {/* Payload preview */}
                    <div
                      className={`rounded-xl ${attack.bgLight} border ${attack.borderColor} px-3 py-2.5`}
                    >
                      <p className={`text-[10px] font-mono font-semibold uppercase tracking-widest ${attack.textAccent} mb-1.5`}>
                        Attack payload
                      </p>
                      <p className="text-xs font-mono text-gray-700 break-all leading-relaxed line-clamp-2">
                        {attack.query}
                      </p>
                    </div>

                    {/* Request count */}
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-gray-500">Number of requests</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            update(attack.id, (s) => ({ count: Math.max(1, s.count - 1) }))
                          }
                          disabled={isSending || st.count <= 1}
                          className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold text-gray-900">
                          {st.count}
                        </span>
                        <button
                          onClick={() =>
                            update(attack.id, (s) => ({ count: Math.min(20, s.count + 1) }))
                          }
                          disabled={isSending || st.count >= 20}
                          className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Launch button */}
                    <button
                      onClick={() => sendAttacks(attack.id, attack.query)}
                      disabled={isSending}
                      style={isSending ? undefined : { background: attack.cardBg }}
                      className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                        isSending
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'text-white hover:opacity-90 active:scale-[0.98] shadow-sm'
                      }`}
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending {st.sent}/{st.count}…
                        </>
                      ) : (
                        `Launch ${attack.shortName} Attack`
                      )}
                    </button>

                    {/* Results */}
                    {isDone && (
                      <div
                        className={`rounded-xl border px-4 py-3 flex items-center justify-between gap-3 ${
                          st.blocked > 0
                            ? 'bg-red-50 border-red-200'
                            : 'bg-green-50 border-green-200'
                        }`}
                      >
                        <div>
                          <p
                            className={`text-xs font-bold ${
                              st.blocked > 0 ? 'text-red-700' : 'text-green-700'
                            }`}
                          >
                            {st.blocked > 0
                              ? `${st.blocked}/${st.sent} blocked by WAF`
                              : `All ${st.sent} reached origin`}
                          </p>
                          {st.reached > 0 && st.blocked > 0 && (
                            <p className="text-xs text-orange-600 mt-0.5">
                              {st.reached} reached origin
                            </p>
                          )}
                        </div>
                        {st.blocked > 0 ? (
                          <div className="flex-none w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-3 h-3 text-white" />
                          </div>
                        ) : (
                          <div className="flex-none w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Recommendations */}
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-orange-700 mb-3">
              Recommended Actions For WAF Protection
            </p>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-orange-500 font-bold text-xs">→</span>
                <a
                  href="https://developers.cloudflare.com/waf/managed-rules/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-orange-700 hover:underline leading-relaxed"
                >
                  Enable Cloudflare Managed Ruleset for instant protection against OWASP Top 10
                </a>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-orange-500 font-bold text-xs">→</span>
                <a
                  href="https://developers.cloudflare.com/waf/custom-rules/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-orange-700 hover:underline leading-relaxed"
                >
                  Create custom WAF rules using the flexible Rules language expression syntax
                </a>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-orange-500 font-bold text-xs">→</span>
                <a
                  href="https://developers.cloudflare.com/waf/analytics/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-orange-700 hover:underline leading-relaxed"
                >
                  Monitor and investigate threats with WAF Security Analytics
                </a>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* WAF Block Modal */}
      {wafBlockData && (
        <WafBlockModal
          data={wafBlockData}
          onClose={() => setWafBlockData(null)}
          title="Attack Blocked by WAF"
          subtitle="Cloudflare's WAF detected and blocked this attack. The WAF response payload is shown below."
          backLabel="Dismiss"
        />
      )}
    </div>
  )
}
