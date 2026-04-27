import { useEffect } from 'react'
import { Panel } from '@/components/Panel'
import { useCortex } from '@/hooks/useCortex'
import { formatDateTime } from './mission-os-utils'

export const StudioPage = () => {
  const { snapshot, setViewContext, uiFocus } = useCortex()

  useEffect(() => {
    if (!snapshot) {
      return
    }

    setViewContext({
      details: {
        studioAssets: snapshot.studioAssets.length,
        approvalsNeeded: snapshot.studioAssets.filter((asset) => asset.approvalState === 'pending').length,
        focusedStudioAssetId: uiFocus.studioAssetId,
      },
    })
  }, [setViewContext, snapshot, uiFocus.studioAssetId])

  if (!snapshot) {
    return null
  }

  return (
    <div className="mission-os-grid">
      <Panel title="Broadcast Studio" eyebrow="Drops, recaps, Chronicles, partner proof" className="minimal-panel">
        <div className="record-grid">
          {snapshot.studioAssets.map((asset) => (
            <article
              key={asset.id}
              className={`record-card accent-${asset.accent}${uiFocus.studioAssetId === asset.id ? ' is-focused' : ''}`}
            >
              <div className="record-card-head">
                <span className="status-badge status-active">{asset.status}</span>
                <span className="record-card-meta">{asset.format}</span>
              </div>
              <h3>{asset.title}</h3>
              <p>{asset.brief}</p>
              <div className="record-footnote">
                <strong>Approval</strong>
                <span>{asset.approvalState}</span>
              </div>
              <div className="record-footnote">
                <strong>Updated</strong>
                <span>{formatDateTime(asset.updatedAt)}</span>
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  )
}
