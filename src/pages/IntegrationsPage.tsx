import { useEffect } from 'react'
import { Panel } from '@/components/Panel'
import { useCortex } from '@/hooks/useCortex'

export const IntegrationsPage = () => {
  const { snapshot, setViewContext, uiFocus } = useCortex()

  useEffect(() => {
    if (!snapshot) {
      return
    }

    setViewContext({
      details: {
        integrationCount: snapshot.integrationMonitors.length,
        warningIntegrations: snapshot.integrationMonitors.filter((monitor) => monitor.status !== 'healthy').length,
        focusedIntegrationId: uiFocus.integrationMonitorId,
      },
    })
  }, [setViewContext, snapshot, uiFocus.integrationMonitorId])

  if (!snapshot) {
    return null
  }

  return (
    <div className="mission-os-grid">
      <Panel title="Scavenjer Integration Monitor" eyebrow="Supabase, wallets, commerce, Discord" className="minimal-panel">
        <div className="record-grid">
          {snapshot.integrationMonitors.map((monitor) => (
            <article
              key={monitor.id}
              className={`record-card accent-${monitor.accent}${uiFocus.integrationMonitorId === monitor.id ? ' is-focused' : ''}`}
            >
              <div className="record-card-head">
                <span className="status-badge status-active">{monitor.status}</span>
                <span className="record-card-meta">{monitor.freshness}</span>
              </div>
              <h3>{monitor.name}</h3>
              <p>{monitor.source}</p>
              <div className="record-footnote">
                <strong>Action Required</strong>
                <span>{monitor.actionRequired ?? 'None'}</span>
              </div>
              <div className="chip-row compact">
                {monitor.failureFlags.map((flag) => (
                  <span key={flag} className="data-chip">
                    {flag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  )
}
