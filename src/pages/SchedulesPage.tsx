import { useEffect } from 'react'
import { Panel } from '@/components/Panel'
import { formatTimestamp } from '@/lib/formatters'
import { useCortex } from '@/hooks/useCortex'
import { getModeContent } from '@/lib/ui-mode'
import { hasLiveDashboardData } from '@/lib/runtime-data'

export const SchedulesPage = () => {
  const { setViewContext, snapshot, runCommand, uiFocus, uiMode } = useCortex()
  const content = getModeContent(uiMode)

  useEffect(() => {
    if (!snapshot) {
      return
    }

    setViewContext({
      details: {
        scheduledJobs: snapshot.jobs.length,
        runningJobs: snapshot.jobs.filter((job) => job.status === 'running').length,
        driftedJobs: snapshot.jobs.filter((job) => job.status === 'drift').length,
      },
    })
  }, [setViewContext, snapshot])

  if (!snapshot) {
    return <div className="loading-state">{content.schedules.loading}</div>
  }

  if (!hasLiveDashboardData(snapshot)) {
    return (
      <div className="stack-grid">
        <Panel
          title={content.schedules.panelTitle}
          eyebrow={content.schedules.panelEyebrow}
          className="minimal-panel"
        >
          <div className="clean-empty-state">
            <span className="status-badge status-idle">idle</span>
            <h3>Awaiting live automation signals</h3>
            <p>Scheduled jobs will populate here when real automations and cron sources are available.</p>
          </div>
        </Panel>
      </div>
    )
  }

  return (
    <div className="stack-grid">
      <Panel title={content.schedules.panelTitle} eyebrow={content.schedules.panelEyebrow} className="minimal-panel">
        <div className="schedule-grid minimal-list">
          {snapshot.jobs.map((job) => (
            <article
              key={job.id}
              className={`schedule-card accent-${job.accent}`}
              data-ui-focus={uiFocus.scheduleId === job.id}
            >
              <header>
                <div>
                  <span className={`status-badge status-${job.status}`}>{job.status}</span>
                  <h3>{job.name}</h3>
                </div>
                <strong>{job.schedule}</strong>
              </header>

              <div className="schedule-meta">
                <div>
                  <span>{content.schedules.lastRunLabel}</span>
                  <strong>{formatTimestamp(job.lastRunAt)}</strong>
                </div>
                <div>
                  <span>{content.schedules.nextRunLabel}</span>
                  <strong>{formatTimestamp(job.nextRunAt)}</strong>
                </div>
                <div>
                  <span>{content.schedules.driftLabel}</span>
                  <strong>{job.driftMinutes}m</strong>
                </div>
              </div>

              <div className="command-row compact">
                <button
                  className="command-button secondary"
                  type="button"
                  onClick={() => {
                    void runCommand(job.commandId, job.id)
                  }}
                >
                  {content.schedules.runNowLabel}
                </button>
                <button className="command-button primary" type="button">
                  {content.schedules.pauseLabel}
                </button>
                <button className="command-button danger" type="button">
                  {content.schedules.retryLabel}
                </button>
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  )
}
