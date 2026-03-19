import { useNavigate } from 'react-router-dom'
import { ArrowRight, Shield, Globe, Cpu, Database, Cloud, ChevronRight } from 'lucide-react'
import GlobeSection from '../components/GlobeSection'

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
    id: 'kv-store',
    title: 'KV Store Explorer',
    description: 'Explore Cloudflare Workers KV — a globally distributed key-value store with ultra-low latency reads at the edge.',
    tag: 'Workers KV',
    tagColor: 'bg-blue-100 text-blue-700',
    icon: <Database className="w-6 h-6" />,
    path: '/demo/kv-store',
    gradient: 'from-blue-500 to-cyan-400',
    available: false,
    services: ['Workers KV', 'Workers', 'Hono.js'],
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
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CloudflareIcon className="w-8 h-8" />
            <span className="font-semibold text-gray-900 text-sm tracking-tight">Cloudflare Demo Hub</span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="https://developers.cloudflare.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1"
            >
              Docs <ChevronRight className="w-3 h-3" />
            </a>
            <a
              href="https://dash.cloudflare.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm bg-[#F6821F] text-white px-4 py-1.5 rounded-full hover:bg-[#E07010] transition-colors font-medium"
            >
              Dashboard
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <h1 className="text-6xl md:text-7xl font-bold text-gray-900 tracking-tight leading-none mb-6">
            Cloudflare{' '}
            <span className="text-gradient-orange">Demo Hub</span>
          </h1>

          <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed mb-10">
            Explore interactive demos showcasing the full power of the Cloudflare Platform — from AI inference at the edge to secure apps and SASE environments.
          </p>

          <button
            onClick={() => document.getElementById('demo-environments')?.scrollIntoView({ behavior: 'smooth' })}
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-3.5 rounded-full text-sm font-medium hover:bg-gray-700 transition-all duration-200 shadow-lg shadow-gray-900/20"
          >
            Start Exploring
            <ArrowRight className="w-4 h-4" />
          </button>
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
          <div className="flex items-center gap-2">
            <CloudflareIcon className="w-5 h-5" />
            <span className="text-sm text-gray-500">Cloudflare Demo Hub</span>
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

function CloudflareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M42.5 38.5c0.8-2.8-0.1-5.8-2.3-7.5-1.9-1.5-4.4-2-6.7-1.3l-0.4 0.1-0.2-0.4c-1-2.3-3.1-3.9-5.7-4.1-3.7-0.4-7 2.3-7.4 6l-0.1 0.6-0.6-0.1c-2.7-0.5-5.3 1.3-5.8 4-0.5 2.7 1.3 5.3 4 5.8 0.3 0.1 0.6 0.1 0.9 0.1h22.5c2 0 3.8-1.4 4.3-3.4l0.1-0.3-.6.5z"
        fill="#F6821F"
      />
      <path
        d="M50.5 33c-0.3 0-0.6 0-0.9 0.1l-0.5 0.1-0.2-0.5c-1.3-3.3-4.5-5.5-8.1-5.5-0.9 0-1.8 0.1-2.6 0.4l-0.5 0.2-0.3-0.5c-1.7-2.9-4.8-4.7-8.2-4.7-5.3 0-9.6 4.3-9.6 9.6 0 0.3 0 0.7 0.1 1l0.1 0.7-0.7 0.1c-2.8 0.6-4.8 3.1-4.8 6 0 3.3 2.7 6 6 6h30.2c3.3 0 6-2.7 6-6 0-3.3-2.7-6-6-6l0.1-1z"
        fill="#FBAD41"
        opacity="0.6"
      />
    </svg>
  )
}
