import { useEffect } from 'react'
import { Panel } from '@/components/Panel'
import { useCortex } from '@/hooks/useCortex'

export const CommunityPage = () => {
  const { snapshot, setViewContext } = useCortex()

  useEffect(() => {
    if (!snapshot) {
      return
    }

    setViewContext({
      details: {
        activeSignals: snapshot.communitySignals.filter((signal) => signal.status === 'active').length,
        readySignals: snapshot.communitySignals.filter((signal) => signal.status === 'ready').length,
        staleSignals: snapshot.communitySignals.filter((signal) => signal.status === 'stale').length,
      },
    })
  }, [setViewContext, snapshot])

  if (!snapshot) {
    return null
  }

  return (
    <div className="mission-os-grid">
      <Panel title="Scavenjer Community Pulse" eyebrow="City votes, Discord, players, hosts" className="minimal-panel">
        <div className="record-grid">
          {snapshot.communitySignals.map((signal) => (
            <article key={signal.id} className={`record-card accent-${signal.accent}`}>
              <div className="record-card-head">
                <span className="status-badge status-active">{signal.status}</span>
                <span className="record-card-meta">{signal.ownerLaneId}</span>
              </div>
              <h3>{signal.title}</h3>
              <div className="surface-columns">
                <div>
                  <span className="surface-label">Happened</span>
                  <p>{signal.happened}</p>
                </div>
                <div>
                  <span className="surface-label">Now</span>
                  <p>{signal.happeningNow}</p>
                </div>
              </div>
              <div className="record-footnote">
                <strong>Approval</strong>
                <span>{signal.approvalNeeded}</span>
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  )
}
