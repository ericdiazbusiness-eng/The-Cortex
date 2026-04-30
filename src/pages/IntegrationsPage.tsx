import { useEffect } from 'react'
import { Panel } from '@/components/Panel'
import { useCortex } from '@/hooks/useCortex'
import { buildIntegrationsModel } from './workspace-page-models'

export const IntegrationsPage = () => {
  const { businessSnapshot, snapshot, setViewContext, uiFocus, uiMode } = useCortex()
  const model = buildIntegrationsModel(uiMode, snapshot, businessSnapshot, uiFocus.integrationMonitorId)

  useEffect(() => {
    const nextModel = buildIntegrationsModel(uiMode, snapshot, businessSnapshot, uiFocus.integrationMonitorId)
    if (!nextModel) {
      return
    }

    setViewContext({
      details: {
        integrationCount: nextModel.cards.length,
        warningIntegrations: nextModel.cards.filter((monitor) => monitor.status !== 'healthy' && monitor.status !== 'live').length,
        focusedIntegrationId: uiFocus.integrationMonitorId,
      },
    })
  }, [businessSnapshot, setViewContext, snapshot, uiFocus.integrationMonitorId, uiMode])

  if (!model) {
    return null
  }

  return (
    <div className="mission-os-grid page-motif-integrations">
      <Panel title={model.title} eyebrow={model.eyebrow} className="minimal-panel">
        <div className="record-grid">
          {model.cards.map((monitor) => (
            <article
              key={monitor.id}
              className={`record-card accent-${monitor.accent}${model.focusedId === monitor.id ? ' is-focused' : ''}`}
            >
              <div className="record-card-head">
                <span className="status-badge status-active">{monitor.status}</span>
                <span className="record-card-meta">{monitor.meta}</span>
              </div>
              <h3>{monitor.title}</h3>
              <p>{monitor.body}</p>
              {(monitor.footnotes ?? []).map((footnote) => (
                <div key={footnote.label} className="record-footnote">
                  <strong>{footnote.label}</strong>
                  <span>{footnote.value}</span>
                </div>
              ))}
              <div className="chip-row compact">
                {(monitor.chips ?? []).map((flag) => (
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
