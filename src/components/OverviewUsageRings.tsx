import { useState } from 'react'
import type { UiMode } from '@/lib/ui-mode'
import {
  DEFAULT_GATEWAY_STATE,
  type CortexDashboardSnapshot,
  type CortexGatewayState,
  type CortexUsageIndicator,
} from '@/shared/cortex'

const getGatewayStateLabel = (status: CortexGatewayState['status']) => {
  switch (status) {
    case 'on':
      return 'Live'
    case 'off':
      return 'Offline'
    default:
      return 'Unknown'
  }
}

const getGatewayBadgeLabel = (status: CortexGatewayState['status']) => {
  switch (status) {
    case 'on':
      return 'LIVE'
    case 'off':
      return 'OFF'
    default:
      return 'UNK'
  }
}

export const OverviewUsageRings = ({
  uiMode,
  snapshot,
  gateway = DEFAULT_GATEWAY_STATE,
}: {
  uiMode: UiMode
  snapshot: CortexDashboardSnapshot
  gateway?: CortexGatewayState
}) => {
  const [activeRingId, setActiveRingId] = useState<CortexUsageIndicator['id'] | null>(null)
  const gatewayStateLabel = getGatewayStateLabel(gateway.status)
  const gatewayBadgeLabel = getGatewayBadgeLabel(gateway.status)
  const overviewUsageRings: CortexUsageIndicator[] = snapshot.usageIndicators

  return (
    <div className="overview-top-rail">
      <div className="overview-top-slot overview-top-slot-gateway">
        <div
          className={`gateway-chip gateway-chip-${gateway.status}`}
          role="status"
          aria-label={`Cortex Profile Gateway ${gatewayStateLabel}`}
          data-status={gateway.status}
        >
          <span className="gateway-chip-dot" aria-hidden="true" />
          <span className="gateway-chip-copy">
            <span className="gateway-chip-label">Cortex Profile Gateway</span>
            <span className="gateway-chip-state">{gatewayBadgeLabel}</span>
          </span>
        </div>
      </div>
      <div className="overview-top-slot overview-top-slot-usage">
        <div className="overview-usage-rings" role="group" aria-label="Overview usage indicators">
          {overviewUsageRings.map((ring) => {
            const isActive = ring.id === activeRingId

            return (
              <button
                key={ring.id}
                type="button"
                className={`usage-ring usage-ring-${ring.tone}${isActive ? ' is-active' : ''}`}
                data-mode={uiMode}
                style={{ ['--ring-fill' as string]: `${ring.value}%` }}
                aria-label={`${ring.label}, ${ring.value}% remaining`}
                onMouseEnter={() => setActiveRingId(ring.id)}
                onMouseLeave={() =>
                  setActiveRingId((current) => (current === ring.id ? null : current))
                }
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
            )
          })}
        </div>
      </div>
    </div>
  )
}
