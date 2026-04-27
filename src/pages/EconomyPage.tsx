import { useEffect } from 'react'
import { Panel } from '@/components/Panel'
import { useCortex } from '@/hooks/useCortex'

export const EconomyPage = () => {
  const { snapshot, setViewContext } = useCortex()

  useEffect(() => {
    if (!snapshot) {
      return
    }

    setViewContext({
      details: {
        economyMetrics: snapshot.economyMetrics.length,
        staleMissions: snapshot.missions.filter((mission) => mission.status === 'stale').length,
        warningIntegrations: snapshot.integrationMonitors.filter((monitor) => monitor.status !== 'healthy').length,
      },
    })
  }, [setViewContext, snapshot])

  if (!snapshot) {
    return null
  }

  return (
    <div className="mission-os-grid">
      <Panel title="Scavenjer Economy" eyebrow="Rewards, minting, partner proof" className="minimal-panel">
        <div className="metric-grid">
          {snapshot.economyMetrics.map((metric) => (
            <article key={metric.id} className={`metric-card accent-${metric.accent}`}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <p>{metric.detail}</p>
            </article>
          ))}
        </div>
      </Panel>

      <Panel title="Risk Watch" eyebrow="Blocked, stale, or revenue-leaking work" className="minimal-panel">
        <div className="stack-list">
          {snapshot.missions
            .filter((mission) => mission.status === 'stale' || mission.status === 'blocked')
            .map((mission) => (
              <article key={mission.id} className={`list-row accent-${mission.accent}`}>
                <div>
                  <strong>{mission.title}</strong>
                  <span>{mission.status}</span>
                </div>
                <div>
                  <strong>{mission.priority}</strong>
                  <span>{mission.nextAction}</span>
                </div>
              </article>
            ))}
        </div>
      </Panel>
    </div>
  )
}
