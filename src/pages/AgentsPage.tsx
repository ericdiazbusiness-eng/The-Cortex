import { useEffect, useState } from 'react'
import { Panel } from '@/components/Panel'
import { precisePercent, percent, formatTimestamp } from '@/lib/formatters'
import { useCortex } from '@/hooks/useCortex'
import { getAgentPresentation, getModeContent } from '@/lib/ui-mode'
import { hasLiveDashboardData } from '@/lib/runtime-data'

export const AgentsPage = () => {
  const { setViewContext, snapshot, runCommand, uiFocus, uiMode } = useCortex()
  const content = getModeContent(uiMode)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const boundedIndex =
    snapshot && snapshot.agents.length > 0
      ? ((selectedIndex % snapshot.agents.length) + snapshot.agents.length) % snapshot.agents.length
      : 0
  const focusedIndex =
    snapshot && uiFocus.agentId
      ? snapshot.agents.findIndex((agent) => agent.id === uiFocus.agentId)
      : -1
  const resolvedIndex = focusedIndex >= 0 ? focusedIndex : boundedIndex
  const selectedAgent = snapshot?.agents[resolvedIndex] ?? snapshot?.agents[0] ?? null
  const presentation = selectedAgent ? getAgentPresentation(selectedAgent, uiMode) : null

  useEffect(() => {
    if (!selectedAgent || !presentation) {
      return
    }

    setViewContext({
      details: {
        selectedAgentId: selectedAgent.id,
        selectedAgentName: presentation.displayName,
        selectedAgentStatus: selectedAgent.status,
        selectedAgentCapabilities: selectedAgent.capabilities.length,
      },
    })
  }, [presentation, selectedAgent, setViewContext])

  if (!snapshot) {
    return <div className="loading-state">{content.agents.loading}</div>
  }

  if (!selectedAgent) {
    return <div className="loading-state">{content.agents.loading}</div>
  }

  if (!hasLiveDashboardData(snapshot)) {
    return (
      <div className="stack-grid">
        <Panel
          title={content.agents.panelTitle}
          eyebrow={content.agents.panelEyebrow}
          className="minimal-panel"
        >
          <div className="clean-empty-state">
            <span className="status-badge status-idle">offline</span>
            <h3>Awaiting live ZiBz activity</h3>
            <p>This channel will stay clear until connected operational agents report real state.</p>
          </div>
        </Panel>
      </div>
    )
  }

  const resolvedPresentation = presentation ?? getAgentPresentation(selectedAgent, uiMode)

  const cycleAgent = (direction: 1 | -1) => {
    const nextIndex =
      (resolvedIndex + direction + snapshot.agents.length) % snapshot.agents.length
    setSelectedIndex(nextIndex)
  }

  return (
    <div className="stack-grid">
      <Panel title={content.agents.panelTitle} eyebrow={content.agents.panelEyebrow} className="minimal-panel">
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
              {resolvedIndex + 1} / {snapshot.agents.length}
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

        <article className={`agent-card zibz-focus-card accent-${selectedAgent.accent} minimal-card`}>
          <div className="minimal-headline-row">
            <div className="minimal-identity">
              <span className={`status-badge status-${selectedAgent.status}`}>
                {selectedAgent.status}
              </span>
              <h3>{resolvedPresentation.displayName}</h3>
              <p>{resolvedPresentation.role}</p>
            </div>
            <div className="agent-memory-bank">
              {selectedAgent.memoryBank} {content.agents.memoryUnit}
            </div>
          </div>

          <div className="minimal-stat-grid">
            <div className="meter-track compact">
              <span>Sync</span>
              <strong>{precisePercent(selectedAgent.sync)}</strong>
              <div className="meter-fill" style={{ width: `${selectedAgent.sync}%` }} />
            </div>
            <div className="meter-track compact">
              <span>Load</span>
              <strong>{percent(selectedAgent.load)}</strong>
              <div className="meter-fill danger" style={{ width: `${selectedAgent.load}%` }} />
            </div>
            <div className="minimal-meta-card">
              <span>{content.agents.lastActiveLabel}</span>
              <strong>{formatTimestamp(selectedAgent.lastActiveAt)}</strong>
            </div>
          </div>

          <div className="chip-row compact">
            {selectedAgent.capabilities.map((capability) => (
              <span key={capability} className="data-chip">
                {capability}
              </span>
            ))}
          </div>

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
        </article>
      </Panel>
    </div>
  )
}
