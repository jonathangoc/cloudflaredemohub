import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AIChatPage from './pages/AIChatPage'
import AIAgentPage from './pages/AIAgentPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/demo/ai-chat" element={<AIChatPage />} />
        <Route path="/demo/ai-agent" element={<AIAgentPage />} />
      </Routes>
    </BrowserRouter>
  )
}
