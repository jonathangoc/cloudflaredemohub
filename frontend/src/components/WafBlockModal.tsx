import { ShieldAlert, X, ArrowLeft } from 'lucide-react'

export default function WafBlockModal({
  data,
  onClose,
  title = 'Login Request Blocked by WAF',
  subtitle = "Cloudflare's WAF detected and blocked this login request. The WAF response payload is shown below.",
  backLabel = 'Back to Login',
}: {
  data: { status: number; body: unknown; footerMessage?: string }
  onClose: () => void
  title?: string
  subtitle?: string
  backLabel?: string
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
            <p className="text-white font-bold text-base leading-tight">{title}</p>
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
          <p className="text-sm text-red-800 leading-relaxed">{subtitle}</p>
        </div>
        <div className="bg-white border-t border-gray-200 px-4 py-4 overflow-auto max-h-72">
          {data.body === null ? (
            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-mono text-yellow-600">{'// WAF response body unavailable'}</p>
              <p className="text-[11px] font-mono text-gray-500 leading-relaxed">
                {'// The WAF returned HTTP 403 without CORS headers,\n// so the browser blocked access to the response body.\n//\n// To expose the WAF payload, add an HTTP Response\n// Header Transform Rule in the Cloudflare dashboard:\n//\n//   Zone → Rules → Transform Rules → Modify Response Headers\n//   Field : Access-Control-Allow-Origin\n//   Value : https://demo.jonathangoc.com'}
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
          <p className="text-xs text-red-400">{data.footerMessage ?? 'Modify your credentials and try again.'}</p>
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            {backLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
