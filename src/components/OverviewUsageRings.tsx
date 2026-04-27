import { useState } from 'react'
import type { UiMode } from '@/lib/ui-mode'
import {
  DEFAULT_GATEWAY_STATE,
  type CortexDashboardSnapshot,
  type CortexGatewayState,
} from '@/shared/cortex'

type OverviewUsageRing = {
  id: 'missions' | 'approvals' | 'drops'
  label: string
  detail: string
  symbol: string
  value: number
  tone: 'cyan' | 'magenta' | 'green'
}

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
  const [activeRingId, setActiveRingId] = useState<OverviewUsageRing['id'] | null>(null)
  const gatewayStateLabel = getGatewayStateLabel(gateway.status)
  const gatewayBadgeLabel = getGatewayBadgeLabel(gateway.status)
  const totalMissions = Math.max(snapshot.missions.length, 1)
  const liveOrActiveMissions = snapshot.missions.filter((mission) =>
    ['active', 'in_review', 'ready', 'live'].includes(mission.status),
  ).length
  const pendingApprovals = snapshot.approvals.filter((approval) => approval.state === 'pending').length
  const activeDrops = snapshot.drops.filter((drop) => ['live', 'scheduled'].includes(drop.status)).length
  const overviewUsageRings: OverviewUsageRing[] = [
    {
      id: 'missions',
      label: 'Mission Load',
      detail: `${liveOrActiveMissions} active of ${snapshot.missions.length}`,
      symbol: 'M',
      value: Math.round((liveOrActiveMissions / totalMissions) * 100),
      tone: 'cyan',
    },
    {
      id: 'approvals',
      label: 'Approvals',
      detail: `${pendingApprovals} pending approvals`,
      symbol: 'P',
      value: Math.min(100, pendingApprovals * 20),
      tone: 'magenta',
    },
    {
      id: 'drops',
      label: 'Live Drops',
      detail: `${activeDrops} active or scheduled`,
      symbol: 'D',
      value: Math.min(100, activeDrops * 25),
      tone: 'green',
    },
  ]

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
        <div className="overview-status-strip">
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
                  aria-label={`${ring.label}, ${ring.value}%`}
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
    </div>
  )
}
