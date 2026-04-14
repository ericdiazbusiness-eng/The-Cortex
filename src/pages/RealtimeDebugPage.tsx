import { useEffect, useMemo, useRef, useState } from 'react'
import {
  getVisibleRealtimeModes,
  type CortexRealtimeDebugEntry,
  type CortexRealtimeMode,
} from '@/shared/cortex'

type DebugProfileFilter = 'all' | CortexRealtimeMode | 'unknown'
type DebugSeverityView = 'core' | 'all'

const PROFILE_LABELS: Record<DebugProfileFilter, string> = {
  all: 'ALL',
  premium_voice: 'PRIME',
  neural_voice: 'NEURAL',
  lean_voice: 'ECO',
  tool_voice: 'VECTOR',
  ui_director: 'GUIDE',
  unknown: 'UNSET',
}

const MAX_EXPORT_ENTRIES = 120
const IGNORABLE_WARNINGS = new Set([
  'Session sync requested but skipped because the chained voice runtime injects context per turn.',
])
const CORE_ISSUE_KEYWORDS = [
  'failed',
  'error',
  'timed out',
  'blocked',
  'missing',
  'rejected',
  'denied',
  'closed unexpectedly',
  'unavailable',
  'turn failed',
]
const PIPELINE_STEP_CONFIG = [
  {
    id: 'ready',
    label: 'ready',
    stage: 'ready',
  },
  {
    id: 'capturing',
    label: 'capturing',
    stage: 'capturing',
  },
  {
    id: 'transcribing',
    label: 'transcribing',
    stage: 'transcribing',
  },
  {
    id: 'responding',
    label: 'responding',
    stage: 'responding',
  },
  {
    id: 'tooling',
    label: 'tooling',
    stage: 'tooling',
  },
  {
    id: 'speaking',
    label: 'speaking',
    stage: 'speaking',
  },
  {
    id: 'silent_complete',
    label: 'silent done',
    stage: 'silent_complete',
  },
] as const

const formatTimestamp = (value: string) => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

const getEntryProfile = (entry: CortexRealtimeDebugEntry): DebugProfileFilter => {
  const mode = entry.mode ?? entry.context?.mode

  if (
    mode === 'premium_voice' ||
    mode === 'neural_voice' ||
    mode === 'lean_voice' ||
    mode === 'tool_voice' ||
    mode === 'ui_director'
  ) {
    return mode
  }

  return 'unknown'
}

const formatCompactContext = (entry: CortexRealtimeDebugEntry) => {
  if (!entry.context) {
    return []
  }

  const compactKeys = [
    'runtime',
    'status',
    'stage',
    'sessionId',
    'sessionAttemptId',
    'turnId',
    'version',
    'responseId',
    'callId',
    'name',
    'error',
    'runtime',
  ] as const

  return compactKeys.flatMap((key) => {
    const value = entry.context?.[key]
    if (value === undefined || value === null || value === '') {
      return []
    }

    return [`${key}:${String(value)}`]
  })
}

const buildExportLine = (entry: CortexRealtimeDebugEntry) => {
  const compactContext = formatCompactContext(entry)
  const contextSuffix = compactContext.length ? ` | ${compactContext.join(' ')}` : ''
  const stageSuffix = entry.stage ? ` | stage:${entry.stage}` : ''
  const toolSuffix = entry.toolName ? ` | tool:${entry.toolName}` : ''
  const errorSuffix = entry.errorCode ? ` | code:${entry.errorCode}` : ''

  return [
    formatTimestamp(entry.timestamp),
    PROFILE_LABELS[getEntryProfile(entry)],
    entry.source.toUpperCase(),
    entry.level.toUpperCase(),
    entry.message,
  ].join(' | ') + stageSuffix + toolSuffix + errorSuffix + contextSuffix
}

const isCoreIssueEntry = (entry: CortexRealtimeDebugEntry) => {
  const message = entry.message.toLowerCase()

  if (entry.level === 'error') {
    return true
  }

  if (entry.stage === 'error' || entry.errorCode || entry.errorMessage) {
    return true
  }

  if (entry.level === 'warn' && !IGNORABLE_WARNINGS.has(entry.message)) {
    return true
  }

  return CORE_ISSUE_KEYWORDS.some((keyword) => message.includes(keyword))
}

const isInterruptionEntry = (entry: CortexRealtimeDebugEntry) =>
  entry.errorCode === 'INTERRUPT' ||
  entry.errorCode === 'ABORT_TURN' ||
  entry.errorCode === 'ABORT_RESPONSE' ||
  entry.errorCode === 'ABORT_TTS' ||
  entry.errorCode === 'ABORT_TRANSCRIPTION'

const dedupeEntries = (entries: CortexRealtimeDebugEntry[]) => {
  const seen = new Set<string>()

  return entries.filter((entry) => {
    const compactContext = formatCompactContext(entry).join('|')
    const key = `${entry.source}|${entry.level}|${entry.message}|${compactContext}`

    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

const dedupeEntriesByMessage = (entries: CortexRealtimeDebugEntry[]) => {
  const seen = new Set<string>()

  return entries.filter((entry) => {
    const key = `${getEntryProfile(entry)}|${entry.source}|${entry.level}|${entry.message}`
    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

export const RealtimeDebugPage = () => {
  const [entries, setEntries] = useState<CortexRealtimeDebugEntry[]>([])
  const [isReady, setIsReady] = useState(false)
  const [profileFilter, setProfileFilter] = useState<DebugProfileFilter>('all')
  const [severityView, setSeverityView] = useState<DebugSeverityView>('core')
  const [copied, setCopied] = useState(false)
  const exportRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    let isMounted = true
    const api = window.cortexApi

    if (!api) {
      setIsReady(true)
      return () => {}
    }

    void api
      .getRealtimeDebugEntries()
      .then((initialEntries) => {
        if (!isMounted) {
          return
        }

        setEntries(initialEntries)
        setIsReady(true)
      })
      .catch(() => {
        if (!isMounted) {
          return
        }

        setIsReady(true)
      })

    const unsubscribe = api.subscribeToRealtimeDebug((entry) => {
      if (!isMounted) {
        return
      }

      setEntries((currentEntries) => [entry, ...currentEntries].slice(0, 400))
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  const profileSummaries = useMemo(
    () =>
      getVisibleRealtimeModes().map((profile) => {
        const profileEntries = entries.filter((entry) => getEntryProfile(entry) === profile)
        return {
          profile,
          count: profileEntries.length,
          lastEntry: profileEntries[0] ?? null,
        }
      }),
    [entries],
  )

  const filteredEntries = useMemo(() => {
    const scopedEntries =
      profileFilter === 'all'
        ? entries
        : entries.filter((entry) => getEntryProfile(entry) === profileFilter)

    const severityFilteredEntries =
      severityView === 'core' ? scopedEntries.filter(isCoreIssueEntry) : scopedEntries

    return dedupeEntries(severityFilteredEntries)
  }, [entries, profileFilter, severityView])

  const recentActivityEntries = useMemo(() => {
    const scopedEntries =
      profileFilter === 'all'
        ? entries
        : entries.filter((entry) => getEntryProfile(entry) === profileFilter)

    return dedupeEntriesByMessage(scopedEntries).slice(0, 8)
  }, [entries, profileFilter])

  const pipelineProfiles = useMemo(() => {
    if (profileFilter === 'all') {
      return getVisibleRealtimeModes()
    }

    if (profileFilter === 'unknown') {
      return []
    }

    return [profileFilter]
  }, [profileFilter])

  const pipelineSummaries = useMemo(
    () =>
      pipelineProfiles.map((profile) => {
        const profileEntries = entries.filter((entry) => getEntryProfile(entry) === profile)

        return {
          profile,
          lastEvent: profileEntries[0] ?? null,
          lastIssue: profileEntries.find(isCoreIssueEntry) ?? null,
          lastInterruption: profileEntries.find(isInterruptionEntry) ?? null,
          steps: PIPELINE_STEP_CONFIG.map((step) => {
            const match = profileEntries.find((entry) => entry.stage === step.stage)
            return {
              ...step,
              seen: Boolean(match),
              timestamp: match?.timestamp ?? null,
              message: match?.message ?? null,
            }
          }),
        }
      }),
    [entries, pipelineProfiles],
  )

  const coreIssueCount = useMemo(() => entries.filter(isCoreIssueEntry).length, [entries])

  const visibleIssuesLabel =
    severityView === 'core' ? `${filteredEntries.length} core issues` : `${filteredEntries.length} visible`

  const visibleModeLabel = severityView === 'core' ? 'Core issues only' : 'All milestones'

  const summaryTail = (count: number, lastEntry: CortexRealtimeDebugEntry | null) => {
    if (!count) {
      return severityView === 'core' ? 'no core issues' : 'no events'
    }

    return lastEntry ? `${lastEntry.source} ${lastEntry.level}` : 'events available'
  }

  const exportText = useMemo(
    () =>
      filteredEntries
        .slice(0, MAX_EXPORT_ENTRIES)
        .map((entry) => buildExportLine(entry))
        .join('\n'),
    [filteredEntries],
  )

  const handleCopy = async () => {
    if (!exportText) {
      return
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(exportText)
      } else {
        throw new Error('Clipboard API unavailable.')
      }
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      const textarea = exportRef.current
      if (!textarea) {
        setCopied(false)
        return
      }

      textarea.focus()
      textarea.select()
      textarea.setSelectionRange(0, textarea.value.length)

      const copiedWithCommand = document.execCommand('copy')
      setCopied(copiedWithCommand)
      window.setTimeout(() => setCopied(false), 1200)
    }
  }

  return (
    <main className="realtime-debug-shell" data-ready={isReady}>
      <header className="realtime-debug-header">
        <div>
          <p className="realtime-debug-eyebrow">Realtime Diagnostics</p>
          <h1>Milestone Grid</h1>
        </div>
        <div className="realtime-debug-stats">
          <span>{entries.length} events</span>
          <span>{coreIssueCount} core issues</span>
          <span>{visibleIssuesLabel}</span>
          <span>{window.cortexApi ? 'Electron bridge' : 'Browser fallback'}</span>
        </div>
      </header>

      {!window.cortexApi ? (
        <section className="realtime-debug-empty">
          <h2>Renderer-only preview</h2>
          <p>
            Open this route from the Electron debug window to watch live realtime milestones from
            both the renderer and main process.
          </p>
        </section>
      ) : (
        <>
          <section className="realtime-debug-modebar" aria-label="Realtime debug view">
            <button
              type="button"
              className="realtime-debug-modechip"
              data-active={severityView === 'core'}
              onClick={() => setSeverityView('core')}
            >
              Core issues
            </button>
            <button
              type="button"
              className="realtime-debug-modechip"
              data-active={severityView === 'all'}
              onClick={() => setSeverityView('all')}
            >
              All milestones
            </button>
          </section>

          <section className="realtime-debug-summary" aria-label="Realtime profile summaries">
            <button
              type="button"
              className="realtime-debug-summary-card"
              data-active={profileFilter === 'all'}
              onClick={() => setProfileFilter('all')}
            >
              <span className="realtime-debug-summary-label">ALL</span>
              <strong>{severityView === 'core' ? coreIssueCount : entries.length}</strong>
              <span className="realtime-debug-summary-tail">{visibleModeLabel}</span>
            </button>
            {profileSummaries.map(({ profile, count, lastEntry }) => (
              <button
                key={profile}
                type="button"
                className="realtime-debug-summary-card"
                data-active={profileFilter === profile}
                data-profile={profile}
                onClick={() => setProfileFilter(profile)}
              >
                <span className="realtime-debug-summary-label">{PROFILE_LABELS[profile]}</span>
                <strong>
                  {
                    (severityView === 'core'
                      ? entries.filter(
                          (entry) =>
                            getEntryProfile(entry) === profile && isCoreIssueEntry(entry),
                        )
                      : entries.filter((entry) => getEntryProfile(entry) === profile)
                    ).length
                  }
                </strong>
                <span className="realtime-debug-summary-tail">{summaryTail(count, lastEntry)}</span>
              </button>
            ))}
          </section>

          <section className="realtime-debug-export">
            <div className="realtime-debug-export-bar">
              <span>Copy-ready stream</span>
              <button type="button" onClick={() => void handleCopy()}>
                {copied ? 'copied' : 'copy'}
              </button>
            </div>
            <textarea
              className="realtime-debug-export-text"
              ref={exportRef}
              readOnly
              value={exportText}
              spellCheck={false}
            />
          </section>

          {pipelineSummaries.length ? (
            <section className="realtime-debug-pipeline" aria-label="Realtime voice pipeline">
              {pipelineSummaries.map(({ profile, steps, lastEvent, lastIssue, lastInterruption }) => (
                <article
                  key={`pipeline-${profile}`}
                  className="realtime-debug-pipeline-card"
                  data-profile={profile}
                >
                  <div className="realtime-debug-pipeline-title">{PROFILE_LABELS[profile]}</div>
                  <div className="realtime-debug-pipeline-steps">
                    {steps.map((step) => (
                      <div
                        key={`${profile}-${step.id}`}
                        className="realtime-debug-pipeline-step"
                        data-seen={step.seen}
                      >
                        <span>{step.label}</span>
                        <strong>{step.seen ? formatTimestamp(step.timestamp!) : 'pending'}</strong>
                      </div>
                    ))}
                  </div>
                  <div className="realtime-debug-pipeline-meta">
                    <div className="realtime-debug-pipeline-meta-row">
                      <span>current stage</span>
                      <strong>{lastEvent?.stage ?? 'none'}</strong>
                    </div>
                    <div className="realtime-debug-pipeline-meta-row">
                      <span>last transcript</span>
                      <strong>{lastEvent?.transcriptPreview ?? 'none'}</strong>
                    </div>
                    <div className="realtime-debug-pipeline-meta-row">
                      <span>last response</span>
                      <strong>{lastEvent?.responsePreview ?? 'none'}</strong>
                    </div>
                    <div className="realtime-debug-pipeline-meta-row">
                      <span>last tool</span>
                      <strong>{lastEvent?.toolName ?? 'none'}</strong>
                    </div>
                    <div className="realtime-debug-pipeline-meta-row">
                      <span>last event</span>
                      <strong>
                        {lastEvent
                          ? `${formatTimestamp(lastEvent.timestamp)} ${lastEvent.message}`
                          : 'none'}
                      </strong>
                    </div>
                    <div
                      className="realtime-debug-pipeline-meta-row"
                      data-issue={Boolean(lastIssue)}
                    >
                      <span>last issue</span>
                      <strong>
                        {lastIssue
                          ? `${formatTimestamp(lastIssue.timestamp)} ${lastIssue.message}`
                          : 'none'}
                      </strong>
                    </div>
                    <div className="realtime-debug-pipeline-meta-row" data-issue={Boolean(lastInterruption)}>
                      <span>last interruption</span>
                      <strong>
                        {lastInterruption
                          ? `${formatTimestamp(lastInterruption.timestamp)} ${
                              lastInterruption.errorCode ?? lastInterruption.message
                            }`
                          : 'none'}
                      </strong>
                    </div>
                    <div className="realtime-debug-pipeline-meta-row" data-issue={Boolean(lastInterruption)}>
                      <span>last aborted stage</span>
                      <strong>
                        {lastInterruption?.context?.interruptedStage
                          ? String(lastInterruption.context.interruptedStage)
                          : 'none'}
                      </strong>
                    </div>
                    <div className="realtime-debug-pipeline-meta-row" data-issue={Boolean(lastInterruption)}>
                      <span>interrupted reply</span>
                      <strong>{lastInterruption?.responsePreview ?? 'none'}</strong>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          ) : null}

          {recentActivityEntries.length ? (
            <section className="realtime-debug-recent">
              <div className="realtime-debug-recent-title">Recent activity</div>
              <div className="realtime-debug-recent-list">
                {recentActivityEntries.map((entry) => (
                  <div key={`recent-${entry.id}`} className="realtime-debug-recent-row">
                    <span>{formatTimestamp(entry.timestamp)}</span>
                    <span>{PROFILE_LABELS[getEntryProfile(entry)]}</span>
                    <span>{entry.source.toUpperCase()}</span>
                    <span>{entry.level.toUpperCase()}</span>
                    <span>{entry.message}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {filteredEntries.length ? (
            <section className="realtime-debug-list" aria-label="Realtime debug stream">
              {filteredEntries.map((entry) => {
                const profile = getEntryProfile(entry)
                const compactContext = formatCompactContext(entry)

                return (
                  <article
                    key={entry.id}
                    className="realtime-debug-entry"
                    data-level={entry.level}
                    data-source={entry.source}
                    data-profile={profile}
                  >
                    <div className="realtime-debug-entry-row">
                      <time dateTime={entry.timestamp}>{formatTimestamp(entry.timestamp)}</time>
                      <span className="realtime-debug-pill">{PROFILE_LABELS[profile]}</span>
                      <span className="realtime-debug-pill">{entry.source}</span>
                      <span className="realtime-debug-pill">{entry.level}</span>
                      <span className="realtime-debug-message">{entry.message}</span>
                    </div>
                    {compactContext.length ? (
                      <div className="realtime-debug-context-inline">
                        {compactContext.map((item) => (
                          <span key={`${entry.id}-${item}`} className="realtime-debug-context-chip">
                            {item}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {entry.context ? (
                      <details className="realtime-debug-context-details">
                        <summary>context</summary>
                        <pre>{JSON.stringify(entry.context, null, 2)}</pre>
                      </details>
                    ) : null}
                  </article>
                )
              })}
            </section>
          ) : (
            <section className="realtime-debug-empty">
              <h2>
                No {severityView === 'core' ? 'core issues' : 'events'} for{' '}
                {PROFILE_LABELS[profileFilter]}
              </h2>
              <p>
                {severityView === 'core'
                  ? 'The current stream has no detrimental entries. Use Recent activity below to confirm the session is progressing, or switch to All milestones for the full flow.'
                  : 'Start that profile and the matching milestones will stream here immediately.'}
              </p>
            </section>
          )}
        </>
      )}
    </main>
  )
}
