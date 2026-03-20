import { useNavigate } from 'react-router-dom'
import { ArrowRight, Shield, Globe, Cpu, Database, Cloud } from 'lucide-react'
import GlobeSection from '../components/GlobeSection'
import NavBar from '../components/NavBar'
import HeroGlobe from '../components/HeroGlobe'

interface DemoCard {
  id: string
  title: string
  description: string
  tag: string
  tagColor: string
  icon: React.ReactNode
  path: string
  gradient: string
  available: boolean
  services: string[]
}

const demos: DemoCard[] = [
  {
    id: 'ai-chat',
    title: 'AI Chat',
    description: 'Conversational AI powered by 25+ models — Llama 4, Qwen3, DeepSeek R1, Gemma 3, Mistral, and more — running on Cloudflare Workers AI at the edge.',
    tag: 'Workers AI',
    tagColor: 'bg-orange-100 text-orange-700',
    icon: <Cpu className="w-6 h-6" />,
    path: '/demo/ai-chat',
    gradient: 'from-orange-500 to-amber-400',
    available: true,
    services: ['Workers AI', 'Llama 4', 'Qwen3', 'DeepSeek R1'],
  },
  {
    id: 'ai-agent',
    title: 'AI Agent',
    description: 'A streaming chat agent powered by Cloudflare Agents SDK — calls server-side tools, executes client-side browser tools, and asks for user approval before sensitive actions.',
    tag: 'Agents SDK',
    tagColor: 'bg-violet-100 text-violet-700',
    icon: <Cpu className="w-6 h-6" />,
    path: '/demo/ai-agent',
    gradient: 'from-violet-500 to-purple-400',
    available: true,
    services: ['Agents SDK', 'Durable Objects', 'Workers AI'],
  },
  {
    id: 'r2-storage',
    title: 'R2 Object Storage',
    description: 'Upload, manage, and serve files globally with Cloudflare R2 — zero egress fees, S3-compatible cloud storage.',
    tag: 'R2 Storage',
    tagColor: 'bg-purple-100 text-purple-700',
    icon: <Cloud className="w-6 h-6" />,
    path: '/demo/r2-storage',
    gradient: 'from-purple-500 to-violet-400',
    available: false,
    services: ['R2', 'Workers', 'Hono.js'],
  },
  {
    id: 'd1-database',
    title: 'D1 SQL Database',
    description: 'Run SQL queries on Cloudflare D1 — a serverless SQLite-compatible database deployed at the edge globally.',
    tag: 'D1 Database',
    tagColor: 'bg-green-100 text-green-700',
    icon: <Database className="w-6 h-6" />,
    path: '/demo/d1-database',
    gradient: 'from-green-500 to-emerald-400',
    available: false,
    services: ['D1', 'Workers', 'Hono.js'],
  },
  {
    id: 'security',
    title: 'Zero Trust Security',
    description: 'Demonstrate Cloudflare\'s security capabilities including WAF, DDoS protection, and bot management in real-time.',
    tag: 'Security',
    tagColor: 'bg-red-100 text-red-700',
    icon: <Shield className="w-6 h-6" />,
    path: '/demo/security',
    gradient: 'from-red-500 to-rose-400',
    available: false,
    services: ['WAF', 'Zero Trust', 'Workers'],
  },
  {
    id: 'edge-network',
    title: 'Edge Performance',
    description: 'Visualize real-time edge performance metrics across Cloudflare\'s global network with latency measurements.',
    tag: 'Network',
    tagColor: 'bg-teal-100 text-teal-700',
    icon: <Globe className="w-6 h-6" />,
    path: '/demo/edge-network',
    gradient: 'from-teal-500 to-cyan-400',
    available: false,
    services: ['Analytics', 'Workers', 'KV'],
  },
]


export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <NavBar />

      {/* Hero */}
      <section className="overflow-hidden bg-[#FAFAFA] h-screen pt-20 flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full h-full grid grid-cols-1 lg:grid-cols-2 items-center gap-8">

          {/* Left — text */}
          <div className="flex flex-col justify-center py-8 lg:py-0">
            <h1 className="text-4xl sm:text-5xl md:text-[3.75rem] font-bold text-gray-900 tracking-tight leading-tight mb-6">
              Connect, protect, and<br />
              build <span className="text-[#F6821F]">everywhere</span>
            </h1>
            <p className="text-base text-gray-500 max-w-md leading-relaxed">
              We make websites, apps, AI agents, and networks faster and more secure. Our agile SASE platform accelerates safe AI adoption, and our developer platform is the best place to build and run AI apps.
            </p>
          </div>

          {/* Right — globe, overflows off right edge (desktop only) */}
          <div className="relative self-stretch hidden lg:block">
            <div className="absolute top-1/2 -translate-y-1/2 left-0 w-[600px] h-[600px] translate-x-[60px]">
              <HeroGlobe />
            </div>
          </div>

        </div>
      </section>

      {/* Region: Earth Globe */}
      <GlobeSection />

      {/* Demo Grid */}
      <section id="demo-environments" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Demo Environments</h2>
            <p className="text-gray-500">Select a demo to explore its capabilities</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {demos.map((demo, i) => (
              <DemoCard
                key={demo.id}
                demo={demo}
                onClick={() => demo.available && navigate(demo.path)}
                index={i}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section className="py-20 px-6 bg-gray-900">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Built on Cloudflare's Edge Network</h2>
          <p className="text-gray-400 mb-12 max-w-2xl mx-auto">
            Every demo runs on Cloudflare's global network — sub-millisecond compute, globally distributed storage, and AI inference closer to your users.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '⚡', title: 'Workers', desc: 'Serverless compute at 330+ locations' },
              { icon: '🧠', title: 'Workers AI', desc: 'ML inference at the edge with GPU' },
              { icon: '🗄️', title: 'D1 + R2', desc: 'Edge-native databases and storage' },
              { icon: '🔑', title: 'Workers KV', desc: 'Globally distributed key-value store' },
            ].map((item) => (
              <div key={item.title} className="bg-gray-800 rounded-2xl p-6 text-left">
                <div className="text-2xl mb-3">{item.icon}</div>
                <div className="text-white font-semibold text-sm mb-1">{item.title}</div>
                <div className="text-gray-400 text-xs leading-relaxed">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

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
          <p className="text-xs text-gray-400">
            Built with Cloudflare Workers, React 18, and Tailwind CSS
          </p>
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

function DemoCard({
  demo,
  onClick,
  index,
}: {
  demo: DemoCard
  onClick: () => void
  index: number
}) {
  return (
    <div
      onClick={onClick}
      className={`
        group relative bg-white rounded-3xl p-6 border border-gray-200/80 overflow-hidden
        animate-slide-up
        ${demo.available ? 'cursor-pointer card-hover' : 'opacity-60 cursor-default'}
      `}
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}
    >
      {/* Gradient accent */}
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${demo.gradient} opacity-10 rounded-bl-full`} />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${demo.gradient} text-white shadow-sm`}>
            {demo.icon}
          </div>
          {!demo.available && (
            <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full font-medium">
              Coming Soon
            </span>
          )}
          {demo.available && (
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${demo.tagColor}`}>
              {demo.tag}
            </span>
          )}
        </div>

        {/* Content */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
          {demo.title}
        </h3>
        <p className="text-sm text-gray-500 leading-relaxed mb-5">
          {demo.description}
        </p>

        {/* Services */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {demo.services.map((s) => (
            <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-mono">
              {s}
            </span>
          ))}
        </div>

        {/* CTA */}
        {demo.available && (
          <div className="flex items-center gap-1 text-sm font-medium text-[#F6821F] group-hover:gap-2 transition-all">
            Launch Demo <ArrowRight className="w-4 h-4" />
          </div>
        )}
      </div>
    </div>
  )
}
