import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'

const PRODUCTS_COLUMNS = [
  {
    heading: 'SASE and workspace security',
    href: 'https://www.cloudflare.com/sase/',
    items: [
      { label: 'Zero trust network access', href: 'https://www.cloudflare.com/zero-trust/products/access/' },
      { label: 'Secure web gateway', href: 'https://www.cloudflare.com/teams/gateway/' },
      { label: 'Network-as-a-service / SD-WAN', href: 'https://www.cloudflare.com/network-services/' },
      { label: 'Email security', href: 'https://www.cloudflare.com/zero-trust/products/email-security/' },
    ],
  },
  {
    heading: 'Application security',
    href: 'https://www.cloudflare.com/application-services/',
    items: [
      { label: 'L7 DDoS protection', href: 'https://www.cloudflare.com/ddos/' },
      { label: 'Web application firewall', href: 'https://www.cloudflare.com/waf/' },
      { label: 'API security', href: 'https://www.cloudflare.com/en-gb/application-services/products/api-shield/' },
      { label: 'Bot management', href: 'https://www.cloudflare.com/products/bot-management/' },
    ],
  },
  {
    heading: 'Application performance',
    href: 'https://www.cloudflare.com/performance/',
    items: [
      { label: 'CDN', href: 'https://www.cloudflare.com/cdn/' },
      { label: 'DNS', href: 'https://www.cloudflare.com/dns/' },
      { label: 'Smart routing', href: 'https://www.cloudflare.com/en-gb/application-services/products/argo-smart-routing/' },
      { label: 'Load balancing', href: 'https://www.cloudflare.com/load-balancing/' },
    ],
  },
  {
    heading: 'Networking',
    href: 'https://www.cloudflare.com/network-services/',
    items: [
      { label: 'L3/4 DDoS protection', href: 'https://www.cloudflare.com/network-services/products/magic-transit/' },
      { label: 'Firewall-as-a-service', href: 'https://www.cloudflare.com/network-services/products/magic-firewall/' },
      { label: 'Network Interconnect', href: 'https://www.cloudflare.com/network-services/products/network-interconnect/' },
      { label: 'Smart routing', href: 'https://www.cloudflare.com/en-gb/application-services/products/argo-smart-routing/' },
    ],
  },
]

const PLANS = [
  { label: 'Enterprise plans', href: 'https://www.cloudflare.com/plans/enterprise/' },
  { label: 'Small business plans', href: 'https://www.cloudflare.com/plans/business/' },
  { label: 'Individual plans', href: 'https://www.cloudflare.com/plans/' },
  { label: 'Compare plans', href: 'https://www.cloudflare.com/plans/' },
]

const DEMOS_ITEMS = [
  { label: 'Secure AI-powered apps', path: '/demo/ai-chat' },
  { label: 'Preventing Credential Stuffing Attacks', path: '/demo/credential-stuffing' },
  { label: 'Discover and secure your APIs' },
  { label: 'Prevent malicious bot activity' },
  { label: 'Protect your most critical endpoints' },
  { label: 'Augment security with threat intelligence' },
  { label: 'Accelerate web content' },
]

const RESOURCES_GROUPS = [
  {
    heading: 'Learn',
    items: [
      { label: 'Learning Center', href: 'https://www.cloudflare.com/en-gb/learning/' },
      { label: 'Analyst Reports', href: 'https://www.cloudflare.com/en-gb/analysts/' },
      { label: 'Ebooks', href: 'https://www.cloudflare.com/resource-hub/?resourcetype=Ebook' },
      { label: 'Resource Hub', href: 'https://www.cloudflare.com/resource-hub/' },
    ],
  },
  {
    heading: 'Connect',
    items: [
      { label: 'Blog', href: 'https://blog.cloudflare.com/' },
      { label: 'Community Forum', href: 'https://community.cloudflare.com/' },
      { label: 'Events', href: 'https://www.cloudflare.com/events/' },
      { label: 'Webinars', href: 'https://www.cloudflare.com/webinars/' },
    ],
  },
  {
    heading: 'Support',
    items: [
      { label: 'Help Center', href: 'https://support.cloudflare.com/' },
      { label: 'Developer Docs', href: 'https://developers.cloudflare.com/' },
      { label: 'Trust Hub', href: 'https://www.cloudflare.com/trust-hub/' },
      { label: 'Case Studies', href: 'https://www.cloudflare.com/case-studies/' },
    ],
  },
]

export default function NavBar() {
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()

  const handlePlatformClick = () => {
    if (location.pathname === '/') {
      document.getElementById('home-region-earth')?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate('/', { state: { scrollToPlatform: true } })
    }
  }

  const handleDemosClick = () => {
    if (location.pathname === '/') {
      document.getElementById('demo-environments')?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate('/', { state: { scrollToDemos: true } })
    }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-gray-200/50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center flex-none">
          <img
            src="https://cf-assets.www.cloudflare.com/dzlvafdwdttg/69wNwfiY5mFmgpd9eQFW6j/d5131c08085a977aa70f19e7aada3fa9/1pixel-down__1_.svg"
            alt="Cloudflare"
            width={239}
            className="w-[239px] h-auto"
          />
        </Link>

        {/* Centre nav items */}
        <div className="hidden lg:flex items-center gap-1 mx-6">

          {/* Platform */}
          <button
            onClick={handlePlatformClick}
            className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap"
          >
            Platform
          </button>

          {/* Products */}
          <div
            className="relative"
            onMouseEnter={() => setOpenMenu('products')}
            onMouseLeave={() => setOpenMenu(null)}
          >
            <button
              className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                openMenu === 'products' ? 'text-gray-900 bg-gray-100' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Products
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openMenu === 'products' ? 'rotate-180' : ''}`} />
            </button>

            {openMenu === 'products' && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2" style={{ width: 860 }}>
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                  <div className="p-6">
                    <p className="text-[11px] font-bold tracking-widest text-[#F6821F] uppercase mb-5">Products</p>
                    <div className="grid grid-cols-4 gap-8">
                      {PRODUCTS_COLUMNS.map((col) => (
                        <div key={col.heading}>
                          <a
                            href={col.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-sm font-semibold text-gray-900 hover:text-[#F6821F] mb-3 transition-colors leading-snug"
                          >
                            {col.heading}
                          </a>
                          <ul className="space-y-2">
                            {col.items.map((item) => (
                              <li key={item.label}>
                                <a
                                  href={item.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                                >
                                  {item.label}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-gray-50 border-t border-gray-100 px-6 py-4">
                    <p className="text-[11px] font-bold tracking-widest text-[#F6821F] uppercase mb-3">Plans &amp; Pricing</p>
                    <div className="grid grid-cols-4 gap-4">
                      {PLANS.map((plan) => (
                        <a
                          key={plan.label}
                          href={plan.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-700 hover:text-[#F6821F] transition-colors font-medium"
                        >
                          {plan.label}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Resources */}
          <div
            className="relative"
            onMouseEnter={() => setOpenMenu('resources')}
            onMouseLeave={() => setOpenMenu(null)}
          >
            <button
              className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                openMenu === 'resources' ? 'text-gray-900 bg-gray-100' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Resources
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openMenu === 'resources' ? 'rotate-180' : ''}`} />
            </button>

            {openMenu === 'resources' && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2" style={{ width: 560 }}>
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6">
                  <div className="grid grid-cols-3 gap-8">
                    {RESOURCES_GROUPS.map((group) => (
                      <div key={group.heading}>
                        <p className="text-[11px] font-bold tracking-widest text-[#F6821F] uppercase mb-3">{group.heading}</p>
                        <ul className="space-y-2.5">
                          {group.items.map((item) => (
                            <li key={item.label}>
                              <a
                                href={item.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                              >
                                {item.label}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Demos */}
          <div
            className="relative"
            onMouseEnter={() => setOpenMenu('demos')}
            onMouseLeave={() => setOpenMenu(null)}
          >
            <button
              className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                openMenu === 'demos' ? 'text-gray-900 bg-gray-100' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Demos
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openMenu === 'demos' ? 'rotate-180' : ''}`} />
            </button>

            {openMenu === 'demos' && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2" style={{ width: 320 }}>
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-5">
                  <p className="text-[11px] font-bold tracking-widest text-[#F6821F] uppercase mb-4">Use Cases</p>
                  <ul className="space-y-1">
                    {DEMOS_ITEMS.map((item) => (
                      <li key={item.label}>
                        <button
                          onClick={() => item.path ? navigate(item.path) : handleDemosClick()}
                          className="w-full text-left text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-2 py-1.5 rounded-lg transition-colors"
                        >
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* About */}
          <Link
            to="/about"
            className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap"
          >
            About
          </Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-5 flex-none">
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
  )
}
