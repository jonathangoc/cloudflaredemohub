import { useNavigate } from 'react-router-dom'
import { ArrowRight, MapPin, Briefcase, ExternalLink, Cpu, Bot } from 'lucide-react'
import NavBar from '../components/NavBar'

export default function AboutPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <NavBar />

      <main className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto">

          {/* Page header */}
          <div className="mb-14">
            <span className="text-[11px] font-bold tracking-widest text-[#F6821F] uppercase">About</span>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mt-2 mb-4 tracking-tight">
              Cloudflare Demo Hub
            </h1>
            <p className="text-lg text-gray-500 max-w-2xl leading-relaxed">
              An interactive product demonstration platform built to showcase the full power of the Cloudflare Platform — live, hands-on, and deployable at the edge.
            </p>
          </div>

          {/* What it is / Who it's for */}
          <section className="mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-7 border border-gray-200">
                <div className="w-11 h-11 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-center mb-5 text-xl">
                  🎯
                </div>
                <h2 className="text-base font-semibold text-gray-900 mb-2">What it is</h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  A live, fully functional showcase of Cloudflare products and capabilities. Each demo is an interactive environment — not a static slide deck — that you can use in real time to understand how the technology works and what it can do for your organisation.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-7 border border-gray-200">
                <div className="w-11 h-11 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center mb-5 text-xl">
                  👥
                </div>
                <h2 className="text-base font-semibold text-gray-900 mb-2">Who it's for</h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Designed for customers and prospects who want to explore Cloudflare solutions hands-on. Whether you're evaluating AI, network security, or edge computing, this hub lets you experience the platform firsthand — ideal for technical evaluations, discovery calls, and executive briefings.
                </p>
              </div>
            </div>
          </section>

          {/* Available Demos */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Available Demos</h2>
            <p className="text-sm text-gray-500 mb-6">Click any demo to launch it and explore the capabilities.</p>

            <div className="space-y-3">
              {[
                {
                  icon: <Cpu className="w-5 h-5" />,
                  gradient: 'from-orange-500 to-amber-400',
                  title: 'AI Chat',
                  tag: 'Workers AI',
                  tagColor: 'bg-orange-100 text-orange-700',
                  desc: 'Conversational AI powered by 25+ models — Llama 4, Qwen3, DeepSeek R1, Gemma 3, Mistral, and more — running on Cloudflare Workers AI at the edge with streaming SSE responses and a model selector.',
                  path: '/demo/ai-chat',
                },
                {
                  icon: <Bot className="w-5 h-5" />,
                  gradient: 'from-violet-500 to-purple-400',
                  title: 'AI Agent',
                  tag: 'Agents SDK',
                  tagColor: 'bg-violet-100 text-violet-700',
                  desc: 'A streaming agentic AI powered by Cloudflare Agents SDK and Durable Objects — with server-side tools, browser-side tools, and user-gated approval for sensitive operations like large calculations.',
                  path: '/demo/ai-agent',
                },
              ].map((demo) => (
                <div
                  key={demo.title}
                  onClick={() => navigate(demo.path)}
                  className="group bg-white rounded-2xl p-5 border border-gray-200 flex items-center gap-5 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all"
                >
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${demo.gradient} text-white shadow-sm flex-none`}>
                    {demo.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-gray-900">{demo.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${demo.tagColor}`}>{demo.tag}</span>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed">{demo.desc}</p>
                  </div>
                  <div className="flex-none flex items-center gap-1 text-sm font-medium text-[#F6821F] opacity-0 group-hover:opacity-100 transition-opacity">
                    Launch <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              ))}

              <div className="bg-gray-50 rounded-2xl p-5 border border-dashed border-gray-300 text-center">
                <p className="text-sm text-gray-400">
                  More demos coming soon — R2 Object Storage, D1 SQL Database, Zero Trust Security, Edge Performance
                </p>
              </div>
            </div>
          </section>

          {/* About the author */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">About the Author</h2>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {/* Banner */}
              <div className="h-24 bg-gradient-to-r from-[#F6821F] to-amber-400" />

              <div className="px-7 pb-8">
                {/* Avatar */}
                <div className="-mt-12 mb-5">
                  <div className="w-20 h-20 rounded-2xl bg-gray-900 border-4 border-white shadow-lg flex items-center justify-center text-3xl select-none">
                    👨‍💻
                  </div>
                </div>

                <div className="mb-5">
                  <h3 className="text-xl font-bold text-gray-900">Jonathan Carvalho</h3>
                  <div className="flex flex-wrap items-center gap-4 mt-2">
                    <span className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Briefcase className="w-3.5 h-3.5 flex-none" />
                      Senior Solutions Engineer · Cloudflare
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-gray-500">
                      <MapPin className="w-3.5 h-3.5 flex-none" />
                      United Kingdom
                    </span>
                    <a
                      href="https://linkedin.com/in/jonathangoc"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 flex-none" />
                      linkedin.com/in/jonathangoc
                    </a>
                  </div>
                </div>

                <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                  <p>
                    Jonathan is a Senior Solutions Engineer at Cloudflare, specialising in helping enterprise and mid-market customers across multiple industries design and implement solutions built on the Cloudflare Platform. His work spans Zero Trust security architecture, SASE transformations, application performance, and AI-powered developer tooling.
                  </p>
                  <p>
                    With a strong technical background in cloud networking, security, and modern application development, Jonathan works alongside customers through the full lifecycle — from initial discovery and architecture design to proof-of-concept, technical evaluation, and deployment. He helps organisations modernise their infrastructure by replacing legacy VPNs with Zero Trust Network Access, protecting applications with Cloudflare's global WAF and DDoS protection, and accelerating developer teams with the Workers, R2, D1, and AI platforms.
                  </p>
                  <p>
                    This Demo Hub was built to complement technical conversations and customer engagements — giving teams a live, tangible experience of what the Cloudflare Platform can do, beyond what any slide deck can convey. It is continuously updated with new demos as Cloudflare's product surface grows.
                  </p>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100 flex flex-wrap gap-2">
                  {['Zero Trust / SASE', 'Workers AI', 'Cloudflare Agents SDK', 'Network Security', 'Edge Computing', 'DDoS Protection', 'Application Performance', 'Developer Platform'].map((tag) => (
                    <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-gray-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center">
            <img
              src="https://cf-assets.www.cloudflare.com/dzlvafdwdttg/69wNwfiY5mFmgpd9eQFW6j/d5131c08085a977aa70f19e7aada3fa9/1pixel-down__1_.svg"
              alt="Cloudflare"
              width={239}
              className="h-5 w-auto opacity-70"
            />
          </div>
          <p className="text-xs text-gray-400">Built with Cloudflare Workers, React 19, and Tailwind CSS</p>
          <a
            href="https://developers.cloudflare.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            developers.cloudflare.com →
          </a>
        </div>
      </footer>
    </div>
  )
}
