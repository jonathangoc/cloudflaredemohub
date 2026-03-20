import { useEffect, useRef } from 'react'
import lottie from 'lottie-web'

const LOTTIE_URL = import.meta.env.DEV
  ? '/lottie-proxy/dzlvafdwdttg/UhRyCT3fmnh6UTeF2UYoh/8aeab79c544833f93c5d0d32a37b6413/data.json'
  : 'https://cf-assets.www.cloudflare.com/dzlvafdwdttg/UhRyCT3fmnh6UTeF2UYoh/8aeab79c544833f93c5d0d32a37b6413/data.json'

export default function SASEDiagram() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: LOTTIE_URL,
    })
    return () => anim.destroy()
  }, [])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
