import { useEffect, useMemo } from 'react'
import { Panel } from '@/components/Panel'
import { useCortex } from '@/hooks/useCortex'
import { formatDateTime } from './mission-os-utils'

export const MissionsPage = () => {
  const { snapshot, setViewContext, runCommand, uiFocus } = useCortex()

  const focusedMission =
    snapshot?.missions.find((mission) => mission.id === uiFocus.missionId) ??
    snapshot?.missions[0] ??
    null
  const pendingApprovals = useMemo(
    () => snapshot?.approvals.filter((approval) => approval.state === 'pending') ?? [],
    [snapshot],
  )

  useEffect(() => {
    if (!snapshot) {
      return
    }

    setViewContext({
      details: {
        missionCount: snapshot.missions.length,
        blockedMissions: snapshot.missions.filter((mission) => mission.status === 'blocked').length,
        approvalsNeeded: pendingApprovals.length,
        focusedMissionId: focusedMission?.id ?? null,
      },
    })
  }, [focusedMission?.id, pendingApprovals.length, setViewContext, snapshot])

  if (!snapshot) {
    return null
  }

  return (
    <div className="mission-os-grid">
      <Panel title="Mission Board" eyebrow="Objectives, blockers, approvals" className="minimal-panel">
        <div className="record-grid mission-card-grid">
          {snapshot.missions.map((mission) => (
            <article
              key={mission.id}
              className={`record-card accent-${mission.accent}${uiFocus.missionId === mission.id ? ' is-focused' : ''}`}
            >
              <div className="record-card-head">
                <span className="status-badge status-active">{mission.status}</span>
                <span className="record-card-meta">{mission.type}</span>
              </div>
              <h3>{mission.title}</h3>
              <p>{mission.objective}</p>
              <dl className="record-meta-grid">
                <div>
                  <dt>Owner</dt>
                  <dd>{mission.owner}</dd>
                </div>
                <div>
                  <dt>ZiB</dt>
                  <dd>{mission.assignedLaneId}</dd>
                </div>
                <div>
                  <dt>Due</dt>
                  <dd>{formatDateTime(mission.dueDate)}</dd>
                </div>
                <div>
                  <dt>Approval</dt>
                  <dd>{mission.approvalState}</dd>
                </div>
              </dl>
              <div className="chip-row compact">
                {mission.dependencies.map((dependency) => (
                  <span key={dependency} className="data-chip">
                    {dependency.replace('mission-', '')}
                  </span>
                ))}
              </div>
              <div className="record-footnote">
                <strong>Next</strong>
                <span>{mission.nextAction}</span>
              </div>
            </article>
          ))}
        </div>
      </Panel>

      <div className="mission-os-detail-grid">
        <Panel title="Mission Focus" eyebrow="Evidence, outputs, source context" className="minimal-panel">
          {focusedMission ? (
            <div className="mission-focus-card">
              <div className="record-card-head">
                <span className="status-badge status-active">{focusedMission.priority}</span>
                <span className="record-card-meta">{focusedMission.sourceContext}</span>
              </div>
              <h3>{focusedMission.title}</h3>
              <p>{focusedMission.objective}</p>
              <div className="surface-columns">
                <div>
                  <span className="surface-label">Evidence</span>
                  <ul className="mini-list">
                    {focusedMission.evidence.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="surface-label">Outputs</span>
                  <ul className="mini-list">
                    {focusedMission.outputs.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="record-footnote">
                <strong>Blocked By</strong>
                <span>{focusedMission.blockedBy.join(', ') || 'None'}</span>
              </div>
            </div>
          ) : null}
        </Panel>

        <Panel title="Approvals" eyebrow="What needs decision now" className="minimal-panel">
          <div className="stack-list">
            {pendingApprovals.map((approval) => (
              <article key={approval.id} className={`list-row accent-${approval.accent}`}>
                <div>
                  <strong>{approval.title}</strong>
                  <span>{approval.approver}</span>
                </div>
                <div>
                  <strong>{approval.state}</strong>
                  <span>{formatDateTime(approval.dueAt)}</span>
                </div>
              </article>
            ))}
          </div>
          <div className="command-row compact">
            {snapshot.commands
              .filter((command) => command.scope === 'mission')
              .map((command) => (
                <button
                  key={command.id}
                  className={`command-button ${command.tone}`}
                  type="button"
                  onClick={() => {
                    void runCommand(command.id, focusedMission?.id ?? 'missions')
                  }}
                >
                  {command.label}
                </button>
              ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}
