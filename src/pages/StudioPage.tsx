import { useEffect } from 'react'
import { Panel } from '@/components/Panel'
import { useCortex } from '@/hooks/useCortex'
import { formatDateTime } from './mission-os-utils'
import { buildStudioModel } from './workspace-page-models'

export const StudioPage = () => {
  const { businessSnapshot, snapshot, setViewContext, uiFocus, uiMode } = useCortex()
  const model = buildStudioModel(uiMode, snapshot, businessSnapshot, uiFocus.studioAssetId)

  useEffect(() => {
    const nextModel = buildStudioModel(uiMode, snapshot, businessSnapshot, uiFocus.studioAssetId)
    if (!nextModel) {
      return
    }

    setViewContext({
      details: {
        studioAssets: nextModel.cards.length,
        approvalsNeeded: nextModel.cards.filter((asset) =>
          asset.footnotes?.some((footnote) => footnote.label === 'Approval' && footnote.value === 'pending'),
        ).length,
        focusedStudioAssetId: uiFocus.studioAssetId,
      },
    })
  }, [businessSnapshot, setViewContext, snapshot, uiFocus.studioAssetId, uiMode])

  if (!model) {
    return null
  }

  return (
    <div className="mission-os-grid page-motif-studio">
      <Panel title={model.title} eyebrow={model.eyebrow} className="minimal-panel">
        <div className="record-grid">
          {model.cards.map((asset) => (
            <article
              key={asset.id}
              className={`record-card accent-${asset.accent}${model.focusedId === asset.id ? ' is-focused' : ''}`}
            >
              <div className="record-card-head">
                <span className="status-badge status-active">{asset.status}</span>
                <span className="record-card-meta">{asset.meta}</span>
              </div>
              <h3>{asset.title}</h3>
              <p>{asset.body}</p>
              {(asset.footnotes ?? []).map((footnote) => (
                <div key={footnote.label} className="record-footnote">
                  <strong>{footnote.label}</strong>
                  <span>{footnote.label === 'Updated' ? formatDateTime(footnote.value) : footnote.value}</span>
                </div>
              ))}
            </article>
          ))}
        </div>
      </Panel>
    </div>
  )
}
