import { useState } from 'react'
import type { UiMode } from '@/lib/ui-mode'

type OverviewUsageRing = {
  id: 'agent' | 'elevenlabs' | 'openai'
  label: string
  detail: string
  symbol: string
  value: number
  tone: 'cyan' | 'magenta' | 'green'
  side: 'left' | 'right-top' | 'right-bottom'
}

const OVERVIEW_USAGE_RINGS: OverviewUsageRing[] = [
  {
    id: 'agent',
    label: 'Agent Usage',
    detail: 'Reserved lane',
    symbol: '⬡',
    value: 34,
    tone: 'green',
    side: 'left',
  },
  {
    id: 'elevenlabs',
    label: 'ElevenLabs',
    detail: 'Voice identity',
    symbol: '◌',
    value: 68,
    tone: 'magenta',
    side: 'right-top',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    detail: 'Reasoning lane',
    symbol: '✦',
    value: 57,
    tone: 'cyan',
    side: 'right-bottom',
  },
]

export const OverviewUsageRings = ({ uiMode }: { uiMode: UiMode }) => {
  const [activeRingId, setActiveRingId] = useState<OverviewUsageRing['id'] | null>(null)

  return (
    <>
      {OVERVIEW_USAGE_RINGS.map((ring) => {
        const isActive = ring.id === activeRingId

        return (
          <div
            key={ring.id}
            className={`overview-side-ring overview-side-ring-${ring.side}`}
          >
            <button
              type="button"
              className={`usage-ring usage-ring-${ring.tone}${isActive ? ' is-active' : ''}`}
              data-mode={uiMode}
              style={{ ['--ring-fill' as string]: `${ring.value}%` }}
              aria-label={ring.label}
              onMouseEnter={() => setActiveRingId(ring.id)}
              onMouseLeave={() => setActiveRingId((current) => (current === ring.id ? null : current))}
              onFocus={() => setActiveRingId(ring.id)}
              onBlur={() => setActiveRingId((current) => (current === ring.id ? null : current))}
            >
              <span className="usage-ring-orbit" aria-hidden="true" />
              <span className="usage-ring-core" aria-hidden="true">
                <span className="usage-ring-symbol">{ring.symbol}</span>
              </span>
              {isActive ? (
                <span className="usage-ring-tooltip" role="note">
                  <strong>{ring.label}</strong>
                  <span>{ring.detail}</span>
                </span>
              ) : null}
            </button>
          </div>
        )
      })}
    </>
  )
}
