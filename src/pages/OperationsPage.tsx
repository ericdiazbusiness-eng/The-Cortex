import { useEffect } from 'react'
import { Panel } from '@/components/Panel'
import { useCortex } from '@/hooks/useCortex'
import { formatDateTime } from './mission-os-utils'
import { buildOperationsModel } from './workspace-page-models'

export const OperationsPage = () => {
  const { businessSnapshot, snapshot, setViewContext, runCommand, uiFocus, uiMode } = useCortex()
  const model = buildOperationsModel(uiMode, snapshot, businessSnapshot, uiFocus.dropId)

  useEffect(() => {
    const nextModel = buildOperationsModel(uiMode, snapshot, businessSnapshot, uiFocus.dropId)
    if (!nextModel) {
      return
    }

    setViewContext({
      details: {
        activeDrops: nextModel.cards.filter((card) => card.status === 'live' || card.status === 'active').length,
        pendingDrops: nextModel.cards.filter((card) => card.status === 'pending' || card.status === 'queued').length,
        focusedDropId: uiFocus.dropId,
      },
    })
  }, [businessSnapshot, setViewContext, snapshot, uiFocus.dropId, uiMode])

  if (!model) {
    return null
  }

  return (
    <div className="mission-os-grid page-motif-operations">
      <Panel title={model.title} eyebrow={model.eyebrow} className="minimal-panel">
        <div className="record-grid">
          {model.cards.map((drop) => (
            <article
              key={drop.id}
              className={`record-card accent-${drop.accent}${uiFocus.dropId === drop.id ? ' is-focused' : ''}`}
            >
              <div className="record-card-head">
                <span className="status-badge status-active">{drop.status}</span>
                <span className="record-card-meta">{drop.meta}</span>
              </div>
              <h3>{drop.title}</h3>
              <p>{drop.body}</p>
              <dl className="record-meta-grid">
                {(drop.columns ?? []).map((column) => (
                  <div key={column.label}>
                    <dt>{column.label}</dt>
                    <dd>{column.label === 'Scheduled' || column.label === 'Due' ? formatDateTime(column.value) : column.value}</dd>
                  </div>
                ))}
              </dl>
              {(drop.footnotes ?? []).map((footnote) => (
                <div key={footnote.label} className="record-footnote">
                  <strong>{footnote.label}</strong>
                  <span>{footnote.value}</span>
                </div>
              ))}
            </article>
          ))}
        </div>
      </Panel>

      <Panel title={model.controlsTitle} eyebrow={model.controlsEyebrow} className="minimal-panel">
        <div className="command-row compact">
          {model.commands.map((command) => (
            <button
              key={command.id}
              className={`command-button ${command.tone}`}
              type="button"
              onClick={() => {
                void runCommand(command.id, model.commandContext)
              }}
            >
              {command.label}
            </button>
          ))}
        </div>
      </Panel>
    </div>
  )
}
