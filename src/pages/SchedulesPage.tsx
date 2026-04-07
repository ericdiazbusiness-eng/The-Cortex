import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Panel } from '@/components/Panel'
import { formatTimestamp } from '@/lib/formatters'
import { useCortex } from '@/hooks/useCortex'
import { getModeContent } from '@/lib/ui-mode'

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

  return (
    <div className="stack-grid">
      <Panel title={content.schedules.panelTitle} eyebrow={content.schedules.panelEyebrow}>
        <div className="schedule-grid">
          {snapshot.jobs.map((job) => (
            <motion.article
              key={job.id}
              className={`schedule-card accent-${job.accent}`}
              data-ui-focus={uiFocus.scheduleId === job.id}
              whileHover={{ y: -8 }}
            >
              <header>
                <div>
                  <span className={`status-badge status-${job.status}`}>{job.status}</span>
                  <h3>{job.name}</h3>
                </div>
                <strong>{job.schedule}</strong>
              </header>

              <p>{job.description}</p>

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
            </motion.article>
          ))}
        </div>
      </Panel>
    </div>
  )
}
