import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { getCoreGreeting, type UiMode } from '@/lib/ui-mode'
import type { CortexRealtimeState } from '@/shared/cortex'

export const CoreMind = ({
  onToggle,
  realtimeState,
  uiMode,
}: {
  onToggle: () => Promise<void>
  realtimeState: CortexRealtimeState
  uiMode: UiMode
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const greeting = getCoreGreeting(uiMode)
  const visualState = realtimeState.visualState

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = 400
    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const cx = size / 2
    const cy = size / 2
    const isOn = visualState === 'on'
    const activityScale = isOn ? 1.18 : 0.46
    const primary = uiMode === 'business'
        ? '95, 196, 214'
        : '103, 244, 255'
    const core = uiMode === 'business'
        ? '197, 161, 90'
        : '24, 217, 255'
    const brainPoints = generateBrainPoints(cx, cy, size * 0.36)

    let animId: number
    const draw = (time: number) => {
      ctx.clearRect(0, 0, size, size)

      const rotPhase = time * 0.0003 * activityScale
      const scanY = cy + Math.sin(time * 0.0011 * activityScale) * size * 0.35
      const stateGlow = isOn ? 0.26 : 0.035
      const lineAlpha = isOn ? 1 : 0.14
      const pointAlphaScale = isOn ? 1 : 0.3

      ctx.lineWidth = 0.8
      for (let i = 0; i < brainPoints.length; i++) {
        const p1 = brainPoints[i]
        const x1 = cx + (p1.x - cx) * Math.cos(rotPhase)
        const y1 = p1.y

        for (let j = i + 1; j < brainPoints.length; j++) {
          const p2 = brainPoints[j]
          const dx = p1.x - p2.x
          const dy = p1.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < 55) {
            const x2 = cx + (p2.x - cx) * Math.cos(rotPhase)
            const y2 = p2.y
            const distToScan = Math.min(Math.abs(y1 - scanY), Math.abs(y2 - scanY))
            const scanGlow = Math.max(0, 1 - distToScan / 60)
            const alpha =
              ((1 - dist / 55) * (0.18 + stateGlow) + scanGlow * (0.2 + stateGlow)) *
              pointAlphaScale
            ctx.beginPath()
            ctx.strokeStyle =
              scanGlow > 0.3
                ? `rgba(${primary}, ${alpha})`
                : `rgba(${primary}, ${alpha * 0.6})`
            ctx.moveTo(x1, y1)
            ctx.lineTo(x2, y2)
            ctx.stroke()
          }
        }
      }

      for (const p of brainPoints) {
        const x = cx + (p.x - cx) * Math.cos(rotPhase)
        const y = p.y
        const distToScan = Math.abs(y - scanY)
        const scanGlow = isOn ? Math.max(0, 1 - distToScan / 50) : 0
        const pulse = (isOn ? 0.38 : 0.16) + 0.18 * Math.sin(time * 0.0034 * activityScale + p.phase)

        ctx.beginPath()
        ctx.arc(x, y, p.r * (1 + scanGlow * 0.6), 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${primary}, ${pulse + scanGlow * 0.3 + stateGlow * 0.3})`
        ctx.fill()

        if (scanGlow > 0.2 && isOn) {
          const glow = ctx.createRadialGradient(x, y, 0, x, y, p.r * 6)
          glow.addColorStop(0, `rgba(${primary}, ${scanGlow * 0.6})`)
          glow.addColorStop(1, 'transparent')
          ctx.fillStyle = glow
          ctx.fillRect(x - p.r * 6, y - p.r * 6, p.r * 12, p.r * 12)
        }
      }

      ctx.beginPath()
      const scanGrad = ctx.createLinearGradient(cx - size * 0.4, scanY, cx + size * 0.4, scanY)
      scanGrad.addColorStop(0, 'transparent')
      scanGrad.addColorStop(0.3, `rgba(${primary}, ${0.5 * lineAlpha})`)
      scanGrad.addColorStop(0.5, `rgba(${primary}, ${0.8 * lineAlpha})`)
      scanGrad.addColorStop(0.7, `rgba(${primary}, ${0.5 * lineAlpha})`)
      scanGrad.addColorStop(1, 'transparent')
      ctx.strokeStyle = scanGrad
      ctx.lineWidth = isOn ? 2 : 1
      ctx.moveTo(cx - size * 0.4, scanY)
      ctx.lineTo(cx + size * 0.4, scanY)
      ctx.stroke()

      const coreGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.3)
      coreGlow.addColorStop(0, `rgba(${core}, ${isOn ? 0.14 : 0.035})`)
      coreGlow.addColorStop(0.5, `rgba(${core}, ${isOn ? 0.06 : 0.012})`)
      coreGlow.addColorStop(1, 'transparent')
      ctx.fillStyle = coreGlow
      ctx.fillRect(0, 0, size, size)

      animId = requestAnimationFrame(draw)
    }

    animId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animId)
  }, [uiMode, visualState])

  const ariaLabel = realtimeState.active
    ? 'Stop realtime voice'
    : 'Start realtime voice'

  return (
    <motion.button
      type="button"
      className="core-mind"
      data-realtime-state={visualState}
      initial={{ scale: 0.88, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.75, ease: 'easeOut' }}
      onClick={() => {
        void onToggle()
      }}
      aria-label={ariaLabel}
      aria-pressed={realtimeState.active}
    >
      <div className="core-brain-holo">
        <canvas ref={canvasRef} className="brain-canvas" />
        <div className="holo-noise" />
      </div>
      <div className="core-shell">
        <div className="core-shell-inner">
          <h1 className="core-greeting">{greeting}</h1>
        </div>
      </div>
    </motion.button>
  )
}

interface BrainPoint {
  x: number
  y: number
  r: number
  phase: number
}

function generateBrainPoints(cx: number, cy: number, radius: number): BrainPoint[] {
  const points: BrainPoint[] = []

  for (let i = 0; i < 120; i++) {
    const angle = Math.random() * Math.PI * 2
    const r = radius * (0.3 + Math.random() * 0.7)
    const xStretch = 1.15 + 0.2 * Math.sin(angle * 2)
    const yStretch = 0.9 + 0.15 * Math.cos(angle)

    let x = cx + Math.cos(angle) * r * xStretch
    let y = cy + Math.sin(angle) * r * yStretch * 0.85

    const foldFreq = 6 + Math.random() * 4
    const foldAmp = 3 + Math.random() * 8
    x += Math.sin(angle * foldFreq) * foldAmp * 0.3
    y += Math.cos(angle * foldFreq) * foldAmp * 0.4
    y -= radius * 0.08

    points.push({
      x,
      y,
      r: 1.2 + Math.random() * 2,
      phase: Math.random() * Math.PI * 2,
    })
  }
  return points
}
