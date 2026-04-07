import { useDeferredValue, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Panel } from '@/components/Panel'
import { formatTimestamp } from '@/lib/formatters'
import { useCortex } from '@/hooks/useCortex'
import { getDisplayName, getModeContent } from '@/lib/ui-mode'

export const MemoriesPage = () => {
  const { setViewContext, snapshot, uiFocus, uiMode } = useCortex()
  const [selectedAgent, setSelectedAgent] = useState<string>('all')
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const content = getModeContent(uiMode)

  const filteredMemories = snapshot
    ? snapshot.memories.filter((memory) => {
        const matchesAgent = selectedAgent === 'all' || memory.agentId === selectedAgent
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
        selectedAgentFilter: selectedAgent,
        search: deferredSearch,
        visibleMemories: filteredMemories.length,
        selectedMemoryId: selectedMemory?.id ?? null,
      },
    })
  }, [
    deferredSearch,
    filteredMemories.length,
    selectedAgent,
    selectedMemory?.id,
    setViewContext,
    snapshot,
  ])

  useEffect(() => {
    if (!snapshot) {
      return
    }

    if (uiFocus.memoryAgentId) {
      setSelectedAgent(uiFocus.memoryAgentId)
      return
    }

    if (uiFocus.memoryId) {
      const focusedMemory = snapshot.memories.find((memory) => memory.id === uiFocus.memoryId)
      if (focusedMemory) {
        setSelectedAgent(focusedMemory.agentId)
      }
    }
  }, [snapshot, uiFocus.memoryAgentId, uiFocus.memoryId, uiFocus.revision])

  if (!snapshot) {
    return <div className="loading-state">{content.memories.loading}</div>
  }

  return (
    <div className="memory-layout">
      <Panel title={content.memories.panelTitle} eyebrow={content.memories.panelEyebrow}>
        <div className="memory-controls">
          <div className="chip-row">
            <button
              className={`data-chip${selectedAgent === 'all' ? ' active' : ''}`}
              type="button"
              onClick={() => setSelectedAgent('all')}
            >
              {content.memories.allAgentsLabel}
            </button>
            {snapshot.agents.map((agent) => (
              <button
                key={agent.id}
                className={`data-chip${selectedAgent === agent.id ? ' active' : ''}`}
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

        <div className="memory-timeline">
          {filteredMemories.map((memory, index) => (
            <motion.article
              key={memory.id}
              className={`memory-item priority-${memory.priority}`}
              data-ui-focus={uiFocus.memoryId === memory.id}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <header>
                <div>
                  <span>{memory.category}</span>
                  <strong>{memory.title}</strong>
                </div>
                {memory.pinned ? <em>{content.memories.pinnedLabel}</em> : null}
              </header>
              <p>{memory.detail}</p>
              <footer>
                <span>{formatTimestamp(memory.timestamp)}</span>
                <span>{memory.keywords.join(' / ')}</span>
              </footer>
            </motion.article>
          ))}
        </div>
      </Panel>

      <Panel title={content.memories.focusTitle} eyebrow={content.memories.focusEyebrow}>
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
