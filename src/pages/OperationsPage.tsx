import { useEffect } from 'react'
import { Panel } from '@/components/Panel'
import { useCortex } from '@/hooks/useCortex'
import { formatDateTime } from './mission-os-utils'

export const OperationsPage = () => {
  const { snapshot, setViewContext, runCommand, uiFocus } = useCortex()

  useEffect(() => {
    if (!snapshot) {
      return
    }

    setViewContext({
      details: {
        activeDrops: snapshot.drops.filter((drop) => drop.status === 'live').length,
        pendingDrops: snapshot.drops.filter((drop) => drop.status === 'pending').length,
        focusedDropId: uiFocus.dropId,
      },
    })
  }, [setViewContext, snapshot, uiFocus.dropId])

  if (!snapshot) {
    return null
  }

  return (
    <div className="mission-os-grid">
      <Panel title="Scavenjer Operations Board" eyebrow="Drops, hosts, rewards, scheduling" className="minimal-panel">
        <div className="record-grid">
          {snapshot.drops.map((drop) => (
            <article
              key={drop.id}
              className={`record-card accent-${drop.accent}${uiFocus.dropId === drop.id ? ' is-focused' : ''}`}
            >
              <div className="record-card-head">
                <span className="status-badge status-active">{drop.status}</span>
                <span className="record-card-meta">{drop.city}</span>
              </div>
              <h3>{drop.name}</h3>
              <p>{drop.location}</p>
              <dl className="record-meta-grid">
                <div>
                  <dt>Host</dt>
                  <dd>{drop.host}</dd>
                </div>
                <div>
                  <dt>Reward</dt>
                  <dd>{drop.reward}</dd>
                </div>
                <div>
                  <dt>Countdown</dt>
                  <dd>{drop.countdown}</dd>
                </div>
                <div>
                  <dt>Scheduled</dt>
                  <dd>{formatDateTime(drop.scheduledFor)}</dd>
                </div>
              </dl>
              <div className="record-footnote">
                <strong>Completion</strong>
                <span>{drop.completionState}</span>
              </div>
            </article>
          ))}
        </div>
      </Panel>

      <Panel title="Operations Controls" eyebrow="Drop and field actions" className="minimal-panel">
        <div className="command-row compact">
          {snapshot.commands
            .filter((command) => command.scope === 'operations')
            .map((command) => (
              <button
                key={command.id}
                className={`command-button ${command.tone}`}
                type="button"
                onClick={() => {
                  void runCommand(command.id, uiFocus.dropId ?? 'operations')
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
