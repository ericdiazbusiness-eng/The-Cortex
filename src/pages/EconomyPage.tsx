import { useEffect } from 'react'
import { Panel } from '@/components/Panel'
import { useCortex } from '@/hooks/useCortex'
import { buildEconomyModel } from './workspace-page-models'

export const EconomyPage = () => {
  const { businessSnapshot, snapshot, setViewContext, uiMode } = useCortex()
  const model = buildEconomyModel(uiMode, snapshot, businessSnapshot)

  useEffect(() => {
    const nextModel = buildEconomyModel(uiMode, snapshot, businessSnapshot)
    if (!nextModel) {
      return
    }

    setViewContext({
      details: {
        economyMetrics: nextModel.metrics.length,
        staleMissions: nextModel.risks.filter((risk) => risk.meta === 'stale').length,
        warningIntegrations: nextModel.risks.filter((risk) => risk.meta !== 'healthy').length,
      },
    })
  }, [businessSnapshot, setViewContext, snapshot, uiMode])

  if (!model) {
    return null
  }

  return (
    <div className="mission-os-grid page-motif-economy">
      <Panel title={model.title} eyebrow={model.eyebrow} className="minimal-panel">
        <div className="metric-grid">
          {model.metrics.map((metric) => (
            <article key={metric.id} className={`metric-card accent-${metric.accent}`}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <p>{metric.detail}</p>
            </article>
          ))}
        </div>
      </Panel>

      <Panel title={model.riskTitle} eyebrow={model.riskEyebrow} className="minimal-panel">
        <div className="stack-list">
          {model.risks.map((item) => (
            <article key={item.id} className={`list-row accent-${item.accent}`}>
              <div>
                <strong>{item.title}</strong>
                <span>{item.meta}</span>
              </div>
              <div>
                <strong>{item.status}</strong>
                <span>{item.subtitle}</span>
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  )
}
