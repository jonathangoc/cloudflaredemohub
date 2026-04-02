import { Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AIChatPage from './pages/AIChatPage'
import AIAgentPage from './pages/AIAgentPage'
import AboutPage from './pages/AboutPage'
import CredentialStuffingPage from './pages/CredentialStuffingPage'
import AccountAbusePage from './pages/AccountAbusePage'
import WAFPage from './pages/WAFPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/demo/ai-chat" element={<AIChatPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/demo/credential-stuffing" element={<CredentialStuffingPage />} />
        <Route path="/demo/account-abuse" element={<AccountAbusePage />} />
        <Route path="/demo/waf" element={<WAFPage />} />
        <Route path="/demo/ai-agent" element={
          <Suspense fallback={
            <div className="h-screen flex items-center justify-center bg-gray-50">
              <div className="flex items-center gap-2 text-gray-400">
                <div className="w-5 h-5 border-2 border-violet-300 border-t-violet-500 rounded-full animate-spin" />
                <span className="text-sm">Loading agent…</span>
              </div>
            </div>
          }>
            <AIAgentPage />
          </Suspense>
        } />
      </Routes>
    </BrowserRouter>
  )
}
