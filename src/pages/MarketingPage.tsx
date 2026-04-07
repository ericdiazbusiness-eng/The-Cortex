import { motion } from 'framer-motion'
import { Panel } from '@/components/Panel'
import { formatTimestamp } from '@/lib/formatters'
import { useCortex } from '@/hooks/useCortex'
import { getCampaignOwner, getModeContent, getOutreachOwner } from '@/lib/ui-mode'

export const MarketingPage = () => {
  const { snapshot, runCommand, uiMode } = useCortex()
  const content = getModeContent(uiMode)

  if (!snapshot) {
    return <div className="loading-state">{content.marketing.loading}</div>
  }

  const marketingCommands = ['publish-marketing-brief', 'run-outreach-sync']
    .map((id) => snapshot.commands.find((command) => command.id === id))
    .filter((command): command is NonNullable<typeof command> => Boolean(command))

  return (
    <div className="stack-grid">
      <Panel title={content.marketing.metricsTitle} eyebrow={content.marketing.metricsEyebrow}>
        <div className="node-grid">
          {snapshot.marketingMetrics.map((metric) => (
            <article key={metric.id} className={`node-card accent-${metric.accent}`}>
              <strong>{metric.value}</strong>
              <p>{metric.label}</p>
              <div className="node-stats">
                <span>{metric.delta}</span>
              </div>
            </article>
          ))}
        </div>

        <div className="command-row section-spacer">
          {marketingCommands.map((command) => (
            <button
              key={command.id}
              className={`command-button ${command.tone}`}
              type="button"
              onClick={() => {
                void runCommand(command.id, 'marketing')
              }}
            >
              {command.label}
            </button>
          ))}
        </div>
      </Panel>

      <Panel title={content.marketing.campaignsTitle} eyebrow={content.marketing.campaignsEyebrow}>
        <div className="schedule-grid">
          {snapshot.campaigns.map((campaign) => (
            <motion.article
              key={campaign.id}
              className={`schedule-card accent-${campaign.accent}`}
              whileHover={{ y: -8 }}
            >
              <header>
                <div>
                  <span className={`status-badge status-${campaign.status}`}>{campaign.status}</span>
                  <h3>{campaign.name}</h3>
                </div>
                <strong>{campaign.target}</strong>
              </header>

              <p>{campaign.objective}</p>

              <div className="chip-row">
                {campaign.channels.map((channel) => (
                  <span key={channel} className="data-chip">
                    {channel}
                  </span>
                ))}
              </div>

              <div className="schedule-meta">
                <div>
                  <span>{content.marketing.ownerLabel}</span>
                  <strong>{getCampaignOwner(campaign, uiMode)}</strong>
                </div>
                <div>
                  <span>{content.marketing.dueLabel}</span>
                  <strong>{formatTimestamp(campaign.dueAt)}</strong>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </Panel>

      <Panel title={content.marketing.queueTitle} eyebrow={content.marketing.queueEyebrow}>
        <div className="agent-grid">
          {snapshot.outreachQueue.map((item) => (
            <motion.article
              key={item.id}
              className={`agent-card accent-${item.accent}`}
              whileHover={{ y: -8 }}
            >
              <div className="agent-card-head">
                <div>
                  <span className={`status-badge status-${item.status}`}>{item.status}</span>
                  <h3>{item.title}</h3>
                  <p>{item.channel}</p>
                </div>
                <div className="agent-memory-bank">{item.volume}</div>
              </div>

              <p className="agent-description">
                {content.marketing.audienceLabel}: {item.audience}
              </p>

              <div className="schedule-meta">
                <div>
                  <span>{content.marketing.ownerLabel}</span>
                  <strong>{getOutreachOwner(item, uiMode)}</strong>
                </div>
                <div>
                  <span>{content.marketing.nextActionLabel}</span>
                  <strong>{item.nextAction}</strong>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </Panel>
    </div>
  )
}
