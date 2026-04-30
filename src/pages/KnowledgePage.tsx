import { useEffect } from 'react'
import { Panel } from '@/components/Panel'
import { useCortex } from '@/hooks/useCortex'
import { buildKnowledgeModel } from './workspace-page-models'

export const KnowledgePage = () => {
  const { businessSnapshot, setViewContext, snapshot, uiFocus, uiMode } = useCortex()

  const model = buildKnowledgeModel(uiMode, snapshot, businessSnapshot, uiFocus.vaultEntryId)

  useEffect(() => {
    const nextModel = buildKnowledgeModel(uiMode, snapshot, businessSnapshot, uiFocus.vaultEntryId)
    if (!nextModel) {
      return
    }

    setViewContext({
      details: {
        vaultEntries: nextModel.cards.length,
        canonicalEntries: nextModel.cards.filter((entry) => entry.meta === 'canonical').length,
        loreEntries: nextModel.supportItems.length,
      },
    })
  }, [businessSnapshot, setViewContext, snapshot, uiFocus.vaultEntryId, uiMode])

  if (!model) {
    return null
  }

  return (
    <div className="mission-os-grid page-motif-knowledge">
      <Panel title={model.title} eyebrow={model.eyebrow} className="minimal-panel">
        <div className="record-grid">
          {model.cards.map((entry) => (
            <article
              key={entry.id}
              className={`record-card accent-${entry.accent}${model.focusedCard?.id === entry.id ? ' is-focused' : ''}`}
            >
              <div className="record-card-head">
                <span className="status-badge status-active">{entry.status}</span>
                <span className="record-card-meta">{entry.meta}</span>
              </div>
              <h3>{entry.title}</h3>
              <p>{entry.body}</p>
              <div className="chip-row compact">
                {(entry.chips ?? []).map((tag) => (
                  <span key={tag} className="data-chip">
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </Panel>

      <div className="mission-os-detail-grid">
        <Panel title={model.detailTitle} eyebrow={model.detailEyebrow} className="minimal-panel">
          {model.focusedCard ? (
            <div className="record-card accent-cyan">
              <div className="record-card-head">
                <span className="status-badge status-active">{model.focusedCard.status}</span>
                <span className="record-card-meta">{model.focusedCard.meta}</span>
              </div>
              <h3>{model.focusedCard.title}</h3>
              <p>{model.focusedCard.body}</p>
              {(model.focusedCard.footnotes ?? []).map((footnote) => (
                <div key={footnote.label} className="record-footnote">
                  <strong>{footnote.label}</strong>
                  <span>{footnote.value}</span>
                </div>
              ))}
            </div>
          ) : null}
        </Panel>

        <Panel title={model.supportTitle} eyebrow={model.supportEyebrow} className="minimal-panel">
          <div className="stack-list">
            {model.supportItems.map((entry) => (
              <article key={entry.id} className={`list-row accent-${entry.accent}`}>
                <div>
                  <strong>{entry.title}</strong>
                  <span>{entry.subtitle}</span>
                </div>
                <div>
                  <strong>{entry.status}</strong>
                  <span>{entry.meta}</span>
                </div>
              </article>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}
