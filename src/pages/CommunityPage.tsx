import { useEffect } from 'react'
import { Panel } from '@/components/Panel'
import { useCortex } from '@/hooks/useCortex'
import { buildCommunityModel } from './workspace-page-models'

export const CommunityPage = () => {
  const { businessSnapshot, snapshot, setViewContext, uiMode } = useCortex()
  const model = buildCommunityModel(uiMode, snapshot, businessSnapshot)

  useEffect(() => {
    const nextModel = buildCommunityModel(uiMode, snapshot, businessSnapshot)
    if (!nextModel) {
      return
    }

    setViewContext({
      details: {
        activeSignals: nextModel.cards.filter((signal) => signal.status === 'active').length,
        readySignals: nextModel.cards.filter((signal) => signal.status === 'ready').length,
        staleSignals: nextModel.cards.filter((signal) => signal.status === 'stale' || signal.status === 'watch').length,
      },
    })
  }, [businessSnapshot, setViewContext, snapshot, uiMode])

  if (!model) {
    return null
  }

  return (
    <div className="mission-os-grid page-motif-community">
      <Panel title={model.title} eyebrow={model.eyebrow} className="minimal-panel">
        <div className="record-grid">
          {model.cards.map((signal) => (
            <article key={signal.id} className={`record-card accent-${signal.accent}`}>
              <div className="record-card-head">
                <span className="status-badge status-active">{signal.status}</span>
                <span className="record-card-meta">{signal.meta}</span>
              </div>
              <h3>{signal.title}</h3>
              <div className="surface-columns">
                {(signal.columns ?? []).map((column) => (
                  <div key={column.label}>
                    <span className="surface-label">{column.label}</span>
                    <p>{column.value}</p>
                  </div>
                ))}
              </div>
              {(signal.footnotes ?? []).map((footnote) => (
                <div key={footnote.label} className="record-footnote">
                  <strong>{footnote.label}</strong>
                  <span>{footnote.value}</span>
                </div>
              ))}
            </article>
          ))}
        </div>
      </Panel>
    </div>
  )
}
