import { useDeferredValue, useEffect, useState } from 'react'
import { Panel } from '@/components/Panel'
import { formatTimestamp } from '@/lib/formatters'
import { useCortex } from '@/hooks/useCortex'
import { getDisplayName, getModeContent } from '@/lib/ui-mode'
import { hasLiveDashboardData } from '@/lib/runtime-data'

export const MemoriesPage = () => {
  const { setViewContext, snapshot, uiFocus, uiMode } = useCortex()
  const [selectedAgent, setSelectedAgent] = useState<string>('all')
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const content = getModeContent(uiMode)
  const focusedMemoryAgentId =
    snapshot && uiFocus.memoryId
      ? snapshot.memories.find((memory) => memory.id === uiFocus.memoryId)?.agentId ?? null
      : null
  const effectiveSelectedAgent =
    uiFocus.memoryAgentId ?? focusedMemoryAgentId ?? selectedAgent

  const filteredMemories = snapshot
    ? snapshot.memories.filter((memory) => {
        const matchesAgent =
          effectiveSelectedAgent === 'all' || memory.agentId === effectiveSelectedAgent
        const haystack = `${memory.title} ${memory.detail} ${memory.keywords.join(' ')}`
        const matchesSearch =
          !deferredSearch || haystack.toLowerCase().includes(deferredSearch.toLowerCase())

        return matchesAgent && matchesSearch
      })
    : []
  const selectedMemory =
    filteredMemories.find((memory) => memory.id === uiFocus.memoryId) ?? filteredMemories[0]

  useEffect(() => {
    if (!snapshot) {
      return
    }

    setViewContext({
      details: {
        selectedAgentFilter: effectiveSelectedAgent,
        search: deferredSearch,
        visibleMemories: filteredMemories.length,
        selectedMemoryId: selectedMemory?.id ?? null,
      },
    })
  }, [
    deferredSearch,
    effectiveSelectedAgent,
    filteredMemories.length,
    selectedMemory?.id,
    setViewContext,
    snapshot,
  ])

  if (!snapshot) {
    return <div className="loading-state">{content.memories.loading}</div>
  }

  if (!hasLiveDashboardData(snapshot)) {
    return (
      <div className="stack-grid">
        <Panel
          title={content.memories.panelTitle}
          eyebrow={content.memories.panelEyebrow}
          className="minimal-panel"
        >
          <div className="clean-empty-state">
            <span className="status-badge status-idle">idle</span>
            <h3>Awaiting live memory intake</h3>
            <p>Saved decisions and agent memory will appear here once a live source is connected.</p>
          </div>
        </Panel>
      </div>
    )
  }

  return (
    <div className="memory-layout">
      <Panel title={content.memories.panelTitle} eyebrow={content.memories.panelEyebrow} className="minimal-panel">
        <div className="memory-controls">
          <div className="chip-row compact">
            <button
              className={`data-chip${effectiveSelectedAgent === 'all' ? ' active' : ''}`}
              type="button"
              onClick={() => setSelectedAgent('all')}
            >
              {content.memories.allAgentsLabel}
            </button>
            {snapshot.agents.map((agent) => (
              <button
                key={agent.id}
                className={`data-chip${effectiveSelectedAgent === agent.id ? ' active' : ''}`}
                type="button"
                onClick={() => setSelectedAgent(agent.id)}
              >
                {getDisplayName(agent.id, uiMode)}
              </button>
            ))}
          </div>

          <label className="search-input">
            <span>{content.memories.searchLabel}</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={content.memories.searchPlaceholder}
            />
          </label>
        </div>

        <div className="memory-timeline minimal-list">
          {filteredMemories.map((memory) => (
            <article
              key={memory.id}
              className={`memory-item priority-${memory.priority}`}
              data-ui-focus={uiFocus.memoryId === memory.id}
            >
              <header>
                <div>
                  <span>{memory.category}</span>
                  <strong>{memory.title}</strong>
                </div>
                {memory.pinned ? <em>{content.memories.pinnedLabel}</em> : null}
              </header>
              <footer>
                <span>{formatTimestamp(memory.timestamp)}</span>
                <span>{getDisplayName(memory.agentId, uiMode)}</span>
              </footer>
            </article>
          ))}
        </div>
      </Panel>

      <Panel title={content.memories.focusTitle} eyebrow={content.memories.focusEyebrow} className="minimal-panel">
        {selectedMemory ? (
          <div className="memory-focus">
            <span className={`status-badge status-${selectedMemory.priority}`}>
              {selectedMemory.priority}
            </span>
            <h3>{selectedMemory.title}</h3>
            <p>{selectedMemory.detail}</p>
            <div className="focus-meta">
              <span>{formatTimestamp(selectedMemory.timestamp)}</span>
              <span>{getDisplayName(selectedMemory.agentId, uiMode)}</span>
            </div>
            <div className="chip-row">
              {selectedMemory.keywords.map((keyword) => (
                <span key={keyword} className="data-chip active">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="loading-state">{content.memories.empty}</div>
        )}
      </Panel>
    </div>
  )
}
