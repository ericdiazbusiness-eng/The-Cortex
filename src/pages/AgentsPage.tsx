import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Panel } from '@/components/Panel'
import { precisePercent, percent, formatTimestamp } from '@/lib/formatters'
import { useCortex } from '@/hooks/useCortex'
import {
  getAgentPresentation,
  getCampaignOwner,
  getModeContent,
  getOutreachOwner,
} from '@/lib/ui-mode'

const MARKETING_AGENT_ID = 'zib001'

export const AgentsPage = () => {
  const { setViewContext, snapshot, runCommand, uiFocus, uiMode } = useCortex()
  const content = getModeContent(uiMode)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const boundedIndex =
    snapshot && snapshot.agents.length > 0 ? selectedIndex % snapshot.agents.length : 0
  const selectedAgent = snapshot?.agents[boundedIndex] ?? snapshot?.agents[0] ?? null
  const presentation = selectedAgent ? getAgentPresentation(selectedAgent, uiMode) : null
  const isMarketingLane = selectedAgent?.id === MARKETING_AGENT_ID

  useEffect(() => {
    if (!selectedAgent || !presentation) {
      return
    }

    setViewContext({
      details: {
        selectedAgentId: selectedAgent.id,
        selectedAgentName: presentation.displayName,
        selectedAgentStatus: selectedAgent.status,
        marketingLane: isMarketingLane,
        focusedMarketingMetricId: uiFocus.marketingMetricId,
      },
    })
  }, [
    isMarketingLane,
    presentation?.displayName,
    uiFocus.marketingMetricId,
    selectedAgent?.id,
    selectedAgent?.status,
    setViewContext,
  ])

  useEffect(() => {
    if (!snapshot || !uiFocus.agentId) {
      return
    }

    const nextIndex = snapshot.agents.findIndex((agent) => agent.id === uiFocus.agentId)
    if (nextIndex >= 0) {
      setSelectedIndex(nextIndex)
    }
  }, [snapshot, uiFocus.agentId, uiFocus.revision])

  if (!snapshot) {
    return <div className="loading-state">{content.agents.loading}</div>
  }

  if (!selectedAgent) {
    return <div className="loading-state">{content.agents.loading}</div>
  }

  const resolvedPresentation = presentation ?? getAgentPresentation(selectedAgent, uiMode)

  const cycleAgent = (direction: 1 | -1) => {
    const nextIndex =
      (boundedIndex + direction + snapshot.agents.length) % snapshot.agents.length
    setSelectedIndex(nextIndex)
  }

  return (
    <div className="stack-grid">
      <Panel title={content.agents.panelTitle} eyebrow={content.agents.panelEyebrow}>
        <div className="zibz-switcher">
          <button
            type="button"
            className="zibz-cycle-button"
            aria-label="Previous ZiBz"
            onClick={() => cycleAgent(-1)}
          >
            &lt;
          </button>

          <div className="zibz-switcher-focus">
            <span className="status-badge status-active">
              {boundedIndex + 1} / {snapshot.agents.length}
            </span>
            <div>
              <h3 className="zibz-switcher-title">{resolvedPresentation.displayName}</h3>
              <p className="agent-description">{resolvedPresentation.role}</p>
            </div>
          </div>

          <button
            type="button"
            className="zibz-cycle-button"
            aria-label="Next ZiBz"
            onClick={() => cycleAgent(1)}
          >
            &gt;
          </button>
        </div>

        <motion.article
          key={selectedAgent.id}
          className={`agent-card zibz-focus-card accent-${selectedAgent.accent}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
        >
          <div className="agent-card-head">
            <div className="agent-card-identity">
              <div className="agent-avatar-container">
                {selectedAgent.avatar ? (
                  <img
                    src={selectedAgent.avatar}
                    alt={resolvedPresentation.displayName}
                    className="agent-avatar"
                  />
                ) : (
                  <span className="agent-avatar-fallback">{content.agents.fallbackIcon}</span>
                )}
              </div>
              <div>
                <span className={`status-badge status-${selectedAgent.status}`}>
                  {selectedAgent.status}
                </span>
                <h3>{resolvedPresentation.displayName}</h3>
                <p>{resolvedPresentation.role}</p>
              </div>
            </div>
            <div className="agent-memory-bank">
              {selectedAgent.memoryBank} {content.agents.memoryUnit}
            </div>
          </div>

          <p className="agent-description">{resolvedPresentation.description}</p>

          <div className="meter-cluster">
            <div className="meter-track">
              <span>Sync</span>
              <strong>{precisePercent(selectedAgent.sync)}</strong>
              <div className="meter-fill" style={{ width: `${selectedAgent.sync}%` }} />
            </div>
            <div className="meter-track">
              <span>Load</span>
              <strong>{percent(selectedAgent.load)}</strong>
              <div className="meter-fill danger" style={{ width: `${selectedAgent.load}%` }} />
            </div>
          </div>

          <div className="chip-row">
            {selectedAgent.capabilities.map((capability) => (
              <span key={capability} className="data-chip">
                {capability}
              </span>
            ))}
          </div>

          <footer className="agent-card-footer">
            <span>
              {content.agents.lastActiveLabel} {formatTimestamp(selectedAgent.lastActiveAt)}
            </span>
            <div className="command-row compact">
              {selectedAgent.commandIds.map((commandId) => {
                const command = snapshot.commands.find((item) => item.id === commandId)
                if (!command) {
                  return null
                }

                return (
                  <button
                    key={command.id}
                    className={`command-button ${command.tone}`}
                    type="button"
                    onClick={() => {
                      void runCommand(command.id, selectedAgent.id)
                    }}
                  >
                    {command.label}
                  </button>
                )
              })}
            </div>
          </footer>
        </motion.article>
      </Panel>

      {isMarketingLane ? (
        <>
          <Panel
            title={content.marketing.metricsTitle}
            eyebrow={content.marketing.metricsEyebrow}
          >
            <div className="node-grid">
              {snapshot.marketingMetrics.map((metric) => (
                <article
                  key={metric.id}
                  className={`node-card accent-${metric.accent}`}
                  data-ui-focus={uiFocus.marketingMetricId === metric.id}
                >
                  <strong>{metric.value}</strong>
                  <p>{metric.label}</p>
                  <div className="node-stats">
                    <span>{metric.delta}</span>
                  </div>
                </article>
              ))}
            </div>
          </Panel>

          <Panel
            title={content.marketing.campaignsTitle}
            eyebrow={content.marketing.campaignsEyebrow}
          >
            <div className="schedule-grid">
              {snapshot.campaigns.map((campaign) => (
                <motion.article
                  key={campaign.id}
                  className={`schedule-card accent-${campaign.accent}`}
                  whileHover={{ y: -8 }}
                >
                  <header>
                    <div>
                      <span className={`status-badge status-${campaign.status}`}>
                        {campaign.status}
                      </span>
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
        </>
      ) : null}
    </div>
  )
}
