import { useEffect, useRef } from 'react'
import type { UiMode } from '@/lib/ui-mode'

interface CircuitNode {
  x: number
  y: number
  radius: number
  pulsePhase: number
  color: string
}

interface CircuitPath {
  points: { x: number; y: number }[]
  color: string
  pulseOffset: number
  pulseSpeed: number
  width: number
}

const PALETTES: Record<UiMode, Array<{ r: number; g: number; b: number }>> = {
  cortex: [
    { r: 103, g: 244, b: 255 },
    { r: 221, g: 111, b: 255 },
    { r: 139, g: 255, b: 138 },
    { r: 255, g: 200, b: 111 },
  ],
  business: [
    { r: 17, g: 17, b: 17 },
    { r: 17, g: 17, b: 17 },
    { r: 36, g: 36, b: 36 },
    { r: 0, g: 0, b: 0 },
  ],
}

function createCircuitPaths(w: number, h: number, mode: UiMode): CircuitPath[] {
  const paths: CircuitPath[] = []
  const count = Math.floor((w * h) / 90000)
  const colors = PALETTES[mode]

  for (let i = 0; i < count; i++) {
    const c = colors[i % colors.length]
    const segments = 8 + Math.floor(Math.random() * 15)
    const points: { x: number; y: number }[] = []
    let cx = Math.random() * w
    let cy = Math.random() * h

    points.push({ x: cx, y: cy })
    let horizontal = Math.random() > 0.5

    for (let s = 0; s < segments; s++) {
      const len = 150 + Math.random() * 400
      if (horizontal) {
        cx += (Math.random() > 0.5 ? 1 : -1) * len
      } else {
        cy += (Math.random() > 0.5 ? 1 : -1) * len
      }
      cx = Math.max(0, Math.min(w, cx))
      cy = Math.max(0, Math.min(h, cy))
      points.push({ x: cx, y: cy })
      horizontal = !horizontal
    }

    const isBright = Math.random() > 0.8
    const opacity = mode === 'business'
      ? isBright
        ? 0.18 + Math.random() * 0.1
        : 0.08 + Math.random() * 0.08
      : isBright
        ? 0.12 + Math.random() * 0.06
        : 0.04 + Math.random() * 0.04

    paths.push({
      points,
      color: `rgba(${c.r}, ${c.g}, ${c.b}, ${opacity.toFixed(3)})`,
      pulseOffset: Math.random() * 1000,
      pulseSpeed: 0.02 + Math.random() * 0.06,
      width: 0.6 + Math.random() * 0.8,
    })
  }
  return paths
}

function createNodes(paths: CircuitPath[]): CircuitNode[] {
  const nodes: CircuitNode[] = []
  for (const path of paths) {
    for (const pt of path.points) {
      if (Math.random() > 0.65) {
        const nodeOpacity = Math.min(
          0.35,
          parseFloat(path.color.match(/[\d.]+\)$/)?.[0] ?? '0.1') * 2.5,
        )
        nodes.push({
          x: pt.x,
          y: pt.y,
          radius: 1.5 + Math.random() * 2,
          pulsePhase: Math.random() * Math.PI * 2,
          color: path.color.replace(/[\d.]+\)$/, `${nodeOpacity.toFixed(3)})`),
        })
      }
    }
  }
  return nodes
}

export const AnimatedBackground = ({ mode }: { mode: UiMode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let paths: CircuitPath[] = []
    let nodes: CircuitNode[] = []

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      paths = createCircuitPaths(window.innerWidth, window.innerHeight, mode)
      nodes = createNodes(paths)
    }

    resize()
    window.addEventListener('resize', resize)

    const draw = (time: number) => {
      const w = window.innerWidth
      const h = window.innerHeight
      ctx.clearRect(0, 0, w, h)

      for (const path of paths) {
        ctx.beginPath()
        ctx.strokeStyle = path.color
        ctx.lineWidth = path.width
        ctx.lineJoin = 'round'
        for (let i = 0; i < path.points.length; i++) {
          const p = path.points[i]
          if (i === 0) ctx.moveTo(p.x, p.y)
          else ctx.lineTo(p.x, p.y)
        }
        ctx.stroke()

        const totalLen = pathLength(path.points)
        if (totalLen < 1) continue
        const t = (time * path.pulseSpeed * 0.001 + path.pulseOffset) % 1
        const pos = pointAlongPath(path.points, t, totalLen)
        const pulseOpacity = Math.min(
          0.5,
          parseFloat(path.color.match(/[\d.]+\)$/)?.[0] ?? '0.1') * 3,
        )
        const glowColor = path.color.replace(
          /[\d.]+\)$/,
          `${pulseOpacity.toFixed(3)})`,
        )
        const grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 12)
        grad.addColorStop(0, glowColor)
        grad.addColorStop(1, 'transparent')
        ctx.fillStyle = grad
        ctx.fillRect(pos.x - 12, pos.y - 12, 24, 24)
      }

      for (const node of nodes) {
        const pulse = 0.5 + 0.5 * Math.sin(time * 0.002 + node.pulsePhase)
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2)
        ctx.fillStyle = node.color
        ctx.fill()

        const glow = ctx.createRadialGradient(
          node.x,
          node.y,
          0,
          node.x,
          node.y,
          node.radius * 3 * pulse + 2,
        )
        glow.addColorStop(0, node.color)
        glow.addColorStop(1, 'transparent')
        ctx.fillStyle = glow
        ctx.fillRect(
          node.x - node.radius * 4,
          node.y - node.radius * 4,
          node.radius * 8,
          node.radius * 8,
        )
      }

      animId = requestAnimationFrame(draw)
    }

    animId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [mode])

  return <canvas ref={canvasRef} className="circuit-canvas" aria-hidden="true" />
}

function pathLength(points: { x: number; y: number }[]): number {
  let len = 0
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x
    const dy = points[i].y - points[i - 1].y
    len += Math.sqrt(dx * dx + dy * dy)
  }
  return len
}

function pointAlongPath(
  points: { x: number; y: number }[],
  t: number,
  totalLen: number,
): { x: number; y: number } {
  const target = t * totalLen
  let traveled = 0
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x
    const dy = points[i].y - points[i - 1].y
    const segLen = Math.sqrt(dx * dx + dy * dy)
    if (traveled + segLen >= target) {
      const frac = (target - traveled) / segLen
      return {
        x: points[i - 1].x + dx * frac,
        y: points[i - 1].y + dy * frac,
      }
    }
    traveled += segLen
  }
  return points[points.length - 1]
}
