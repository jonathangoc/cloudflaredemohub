import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ArrowRight, Shield, Cpu, Key, Lock, Eye, Zap, ShieldCheck, ShieldAlert, ScanLine, Network } from 'lucide-react'
import GlobeSection from '../components/GlobeSection'
import NavBar from '../components/NavBar'
import HeroGlobe from '../components/HeroGlobe'

const CATEGORIES = ['AI', 'API Security', 'Application Security', 'Bot Detection & Mitigation', 'Performance'] as const
type Category = typeof CATEGORIES[number]

interface DemoCard {
  id: string
  category: Category
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
    id: 'secure-ai-apps',
    category: 'AI',
    title: 'Secure AI-powered apps',
    description: 'Secure your AI applications against misuse and protect model integrity. AI Security for Apps provides model-agnostic protection, integrated natively with Cloudflare\'s global edge network.',
    tag: 'AI Gateway',
    tagColor: 'bg-orange-100 text-orange-700',
    icon: <Cpu className="w-6 h-6" />,
    path: '/demo/ai-chat',
    gradient: 'from-orange-500 to-amber-400',
    available: true,
    services: ['AI Gateway', 'Firewall for AI', 'Workers AI'],
  },
  {
    id: 'credential-stuffing',
    category: 'Bot Detection & Mitigation',
    title: 'Preventing Credential Stuffing Attacks',
    description: 'Stop automated attacks that use stolen credential lists to gain unauthorised access to user accounts. Combine Bot Management, WAF rules, and Turnstile to block credential stuffing at the edge.',
    tag: 'Bot Management',
    tagColor: 'bg-indigo-100 text-indigo-700',
    icon: <ShieldCheck className="w-6 h-6" />,
    path: '/demo/credential-stuffing',
    gradient: 'from-indigo-500 to-purple-400',
    available: true,
    services: ['Bot Management', 'WAF', 'Turnstile'],
  },
  {
    id: 'account-abuse',
    category: 'Bot Detection & Mitigation',
    title: 'Account Abuse Protection',
    description: 'Fraud detection allows you to detect and mitigate account abuse among your traffic, specifically bulk account creation and account takeover attacks.',
    tag: 'Bot Management',
    tagColor: 'bg-rose-100 text-rose-700',
    icon: <ShieldAlert className="w-6 h-6" />,
    path: '/demo/account-abuse',
    gradient: 'from-rose-500 to-orange-400',
    available: true,
    services: ['Bot Management', 'Turnstile', 'WAF', 'Workers KV'],
  },
  {
    id: 'content-scanning',
    category: 'Application Security',
    title: 'Content Scanning and Malware Protection',
    description: 'Detect and block malicious file uploads before they reach your origin. Cloudflare scans uploaded content at the edge, stopping malware, ransomware, and other threats without impacting performance.',
    tag: 'WAF',
    tagColor: 'bg-emerald-100 text-emerald-700',
    icon: <ScanLine className="w-6 h-6" />,
    path: '/demo/credential-stuffing',
    gradient: 'from-emerald-500 to-teal-400',
    available: true,
    services: ['WAF', 'R2', 'Workers'],
  },
  {
    id: 'waf',
    category: 'Application Security',
    title: 'Web Application Firewall',
    description: 'Get automatic protection from vulnerabilities and the flexibility to create custom rules. Filter SQL injection, RCE, and XSS attacks at the Cloudflare edge before they reach your origin.',
    tag: 'WAF',
    tagColor: 'bg-blue-100 text-blue-700',
    icon: <Shield className="w-6 h-6" />,
    path: '/demo/waf',
    gradient: 'from-blue-600 to-indigo-500',
    available: true,
    services: ['WAF', 'Managed Rules', 'Workers'],
  },
  {
    id: 'ai-gateway',
    category: 'AI',
    title: 'Observe and control your AI applications',
    description: 'Connect any AI provider through a single universal endpoint. AI Gateway gives you real-time logs, cost analytics, semantic caching, rate limiting, and automatic fallbacks — so your AI applications stay reliable, observable, and cost-efficient at any scale.',
    tag: 'AI Gateway',
    tagColor: 'bg-amber-100 text-amber-700',
    icon: <Network className="w-6 h-6" />,
    path: '/demo/ai-gateway',
    gradient: 'from-amber-500 to-yellow-400',
    available: true,
    services: ['AI Gateway', 'Workers AI', 'Analytics Engine'],
  },
  {
    id: 'api-security',
    category: 'API Security',
    title: 'Discover and secure your APIs',
    description: 'APIs are more important than ever within application infrastructure. Gain a complete view of API usage and ensure APIs are not compromised or leaking data.',
    tag: 'API Shield',
    tagColor: 'bg-blue-100 text-blue-700',
    icon: <Key className="w-6 h-6" />,
    path: '/demo/api-security',
    gradient: 'from-blue-500 to-indigo-400',
    available: false,
    services: ['API Shield', 'WAF', 'Workers'],
  },
  {
    id: 'bot-management',
    category: 'Bot Detection & Mitigation',
    title: 'Prevent malicious bot activity',
    description: 'Cloudflare Bot Management uses advanced machine learning to identify and block unwanted bots.',
    tag: 'Bot Management',
    tagColor: 'bg-red-100 text-red-700',
    icon: <Shield className="w-6 h-6" />,
    path: '/demo/bot-management',
    gradient: 'from-red-500 to-rose-400',
    available: false,
    services: ['Bot Management', 'Workers AI', 'WAF'],
  },
  {
    id: 'endpoint-protection',
    category: 'Bot Detection & Mitigation',
    title: 'Protect your most critical endpoints',
    description: 'Block unwanted bots and authenticate real visitors with a frictionless Cloudflare CAPTCHA alternative, ensuring top-tier security without sacrificing your website\'s speed or user experience.',
    tag: 'Turnstile',
    tagColor: 'bg-violet-100 text-violet-700',
    icon: <Lock className="w-6 h-6" />,
    path: '/demo/endpoint-protection',
    gradient: 'from-violet-500 to-purple-400',
    available: false,
    services: ['Turnstile', 'Zero Trust', 'Workers'],
  },
  {
    id: 'threat-intelligence',
    category: 'Application Security',
    title: 'Augment security with threat intelligence',
    description: 'Cloudflare enhances existing security measures with wide-ranging threat intelligence not available anywhere else.',
    tag: 'Threat Intel',
    tagColor: 'bg-teal-100 text-teal-700',
    icon: <Eye className="w-6 h-6" />,
    path: '/demo/threat-intelligence',
    gradient: 'from-teal-500 to-cyan-400',
    available: false,
    services: ['Threat Intelligence', 'WAF', 'Analytics'],
  },
  {
    id: 'accelerate-content',
    category: 'Performance',
    title: 'Accelerate web content',
    description: 'Cache static content, compress dynamic content, optimize images, and deliver video from the global Cloudflare network for the fastest possible load times.',
    tag: 'CDN',
    tagColor: 'bg-green-100 text-green-700',
    icon: <Zap className="w-6 h-6" />,
    path: '/demo/accelerate-content',
    gradient: 'from-green-500 to-emerald-400',
    available: false,
    services: ['CDN', 'Argo Smart Routing', 'Workers'],
  },
]


export default function HomePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeCategory, setActiveCategory] = useState<Category>('AI')

  useEffect(() => {
    if (location.state?.scrollToDemos) {
      setTimeout(() => {
        document.getElementById('demo-environments')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
    if (location.state?.scrollToPlatform) {
      setTimeout(() => {
        document.getElementById('home-region-earth')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [])

  return (
    <div className="h-screen overflow-y-scroll snap-y snap-mandatory bg-[#FAFAFA]">
      <NavBar />

      {/* Hero */}
      <section className="overflow-hidden bg-[#FAFAFA] h-screen pt-20 flex items-center snap-start snap-always">
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
      <div className="snap-start snap-always h-screen">
        <GlobeSection />
      </div>

      {/* Demo Grid — grouped by category */}
      <section id="demo-environments" className="h-screen overflow-hidden snap-start snap-always flex flex-col pt-20">
        <div className="max-w-7xl mx-auto px-6 w-full py-6 flex flex-col h-full">
          <div className="text-center mb-5">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">Select a use-case to explore Cloudflare's capabilities</h2>
          </div>

          <div role="tablist" className="flex flex-wrap justify-center gap-2 mb-6">
            {CATEGORIES.map((cat) => {
              const items = demos.filter(d => d.category === cat)
              const live = items.filter(d => d.available).length
              const active = cat === activeCategory
              return (
                <button
                  key={cat}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                    active ? 'bg-[#F6821F] border-[#F6821F] text-white shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300 hover:text-gray-900'
                  }`}
                >
                  {cat}
                  <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${active ? 'bg-white/25 text-white' : live ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                    {live ? `${live} live` : 'soon'}
                  </span>
                </button>
              )
            })}
          </div>

          <div key={activeCategory} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto min-h-0 content-start p-1">
            {demos.filter(d => d.category === activeCategory).map((demo, i) => (
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
        ${demo.available ? 'cursor-pointer card-hover' : 'opacity-50 grayscale cursor-default'}
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
            <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium bg-green-100 text-green-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              Live
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
