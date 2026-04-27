import { useEffect } from 'react'
import { Panel } from '@/components/Panel'
import { useCortex } from '@/hooks/useCortex'
import { formatDateTime } from './mission-os-utils'

export const KnowledgePage = () => {
  const { snapshot, setViewContext, uiFocus } = useCortex()

  const focusedEntry =
    snapshot?.vaultEntries.find((entry) => entry.id === uiFocus.vaultEntryId) ??
    snapshot?.vaultEntries[0] ??
    null

  useEffect(() => {
    if (!snapshot) {
      return
    }

    setViewContext({
      details: {
        vaultEntries: snapshot.vaultEntries.length,
        canonicalEntries: snapshot.vaultEntries.filter((entry) => entry.canonical).length,
        loreEntries: snapshot.loreEntries.length,
      },
    })
  }, [setViewContext, snapshot])

  if (!snapshot) {
    return null
  }

  return (
    <div className="mission-os-grid">
      <Panel title="Scavenjer Source Truth" eyebrow="Doctrine, rules, admin context" className="minimal-panel">
        <div className="record-grid">
          {snapshot.vaultEntries.map((entry) => (
            <article
              key={entry.id}
              className={`record-card accent-${entry.accent}${focusedEntry?.id === entry.id ? ' is-focused' : ''}`}
            >
              <div className="record-card-head">
                <span className="status-badge status-active">{entry.category}</span>
                <span className="record-card-meta">{entry.canonical ? 'canonical' : 'draft'}</span>
              </div>
              <h3>{entry.title}</h3>
              <p>{entry.summary}</p>
              <div className="chip-row compact">
                {entry.tags.map((tag) => (
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
        <Panel title="Focused Vault Entry" eyebrow="Canonical memory detail" className="minimal-panel">
          {focusedEntry ? (
            <div className="record-card accent-cyan">
              <div className="record-card-head">
                <span className="status-badge status-active">{focusedEntry.category}</span>
                <span className="record-card-meta">{formatDateTime(focusedEntry.updatedAt)}</span>
              </div>
              <h3>{focusedEntry.title}</h3>
              <p>{focusedEntry.summary}</p>
              <div className="record-footnote">
                <strong>Source</strong>
                <span>{focusedEntry.source}</span>
              </div>
            </div>
          ) : null}
        </Panel>

        <Panel title="Lore / Simulations" eyebrow="Ekos, identity, phase trees" className="minimal-panel">
          <div className="stack-list">
            {snapshot.loreEntries.map((entry) => (
              <article key={entry.id} className={`list-row accent-${entry.accent}`}>
                <div>
                  <strong>{entry.title}</strong>
                  <span>{entry.arc}</span>
                </div>
                <div>
                  <strong>{entry.canonStatus}</strong>
                  <span>{entry.phaseTree}</span>
                </div>
              </article>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}
