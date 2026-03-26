import { useEffect, useRef } from 'react'
import lottie from 'lottie-web/build/player/lottie_light'

const LOTTIE_URL = '/lottie-sase.json'

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
