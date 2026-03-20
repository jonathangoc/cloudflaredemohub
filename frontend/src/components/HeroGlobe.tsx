import { useEffect, useRef } from 'react'

const N_POINTS = 160
const K_NEAREST = 6

type P3 = [number, number, number]

function fibonacciSphere(n: number): P3[] {
  const pts: P3[] = []
  const phi = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = phi * i
    pts.push([Math.cos(theta) * r, y, Math.sin(theta) * r])
  }
  return pts
}

function buildEdges(pts: P3[], k: number): [number, number][] {
  const edges: [number, number][] = []
  const seen = new Set<string>()
  for (let i = 0; i < pts.length; i++) {
    const dists: { j: number; d: number }[] = []
    for (let j = 0; j < pts.length; j++) {
      if (j === i) continue
      const dx = pts[i][0] - pts[j][0]
      const dy = pts[i][1] - pts[j][1]
      const dz = pts[i][2] - pts[j][2]
      dists.push({ j, d: dx * dx + dy * dy + dz * dz })
    }
    dists.sort((a, b) => a.d - b.d)
    for (let n = 0; n < Math.min(k, dists.length); n++) {
      const j = dists[n].j
      const key = i < j ? `${i}-${j}` : `${j}-${i}`
      if (!seen.has(key)) {
        seen.add(key)
        edges.push([i, j])
      }
    }
  }
  return edges
}

const PTS = fibonacciSphere(N_POINTS)
const EDGES = buildEdges(PTS, K_NEAREST)

export default function HeroGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let rotY = 0
    let rafId: number
    let w = 0
    let h = 0
    let dpr = 1

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.offsetWidth
      h = canvas.offsetHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      const r = Math.min(w, h) * 0.46
      const cx = w / 2
      const cy = h / 2

      const cosY = Math.cos(rotY)
      const sinY = Math.sin(rotY)

      const proj = PTS.map(([px, py, pz]) => {
        const rx = cosY * px + sinY * pz
        const rz = -sinY * px + cosY * pz
        return { x: cx + rx * r, y: cy - py * r, z: rz }
      })

      // Draw edges — fade based on depth
      for (const [i, j] of EDGES) {
        const a = proj[i]
        const b = proj[j]
        const avgZ = (a.z + b.z) / 2
        const t = (avgZ + 1) / 2
        const alpha = Math.max(0.04, t * 0.7)
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.strokeStyle = `rgba(246,130,31,${alpha.toFixed(3)})`
        ctx.lineWidth = 0.85
        ctx.stroke()
      }

      // Draw nodes — larger and brighter on front face
      for (const p of proj) {
        const t = (p.z + 1) / 2
        const alpha = Math.max(0.06, t * 0.9 + 0.1)
        const size = t * 3.2 + 1.0

        // Soft glow
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 3.5)
        grd.addColorStop(0, `rgba(246,130,31,${(alpha * 0.45).toFixed(3)})`)
        grd.addColorStop(1, 'rgba(246,130,31,0)')
        ctx.beginPath()
        ctx.arc(p.x, p.y, size * 3.5, 0, Math.PI * 2)
        ctx.fillStyle = grd
        ctx.fill()

        // Core dot
        ctx.beginPath()
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(246,130,31,${alpha.toFixed(3)})`
        ctx.fill()
      }

      rotY += 0.004
      rafId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
}
