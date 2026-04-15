import { useEffect } from 'react'
import { Panel } from '@/components/Panel'
import { formatTimestamp, percent } from '@/lib/formatters'
import { useCortex } from '@/hooks/useCortex'
import { getModeContent } from '@/lib/ui-mode'
import { hasLiveDashboardData } from '@/lib/runtime-data'

export const SystemLogsPage = () => {
  const { lastCommandResult, setViewContext, snapshot, uiFocus, uiMode } = useCortex()
  const content = getModeContent(uiMode)

  useEffect(() => {
    if (!snapshot) {
      return
    }

    setViewContext({
      details: {
        logCount: snapshot.logs.length,
        throughput: snapshot.system.throughput,
        lastCommandId: lastCommandResult?.commandId ?? null,
      },
    })
  }, [lastCommandResult?.commandId, setViewContext, snapshot])

  if (!snapshot) {
    return <div className="loading-state">{content.system.loading}</div>
  }

  if (!hasLiveDashboardData(snapshot)) {
    return (
      <div className="stack-grid">
        <Panel
          title={content.system.diagnosticsTitle}
          eyebrow={content.system.diagnosticsEyebrow}
          className="minimal-panel"
        >
          <div className="clean-empty-state">
            <span className="status-badge status-idle">idle</span>
            <h3>Awaiting runtime telemetry</h3>
            <p>Diagnostics, logs, and execution feedback will stay minimal until live runtime data arrives.</p>
          </div>
        </Panel>
      </div>
    )
  }

  return (
    <div className="system-layout">
      <Panel title={content.system.diagnosticsTitle} eyebrow={content.system.diagnosticsEyebrow} className="minimal-panel">
        <div className="diagnostic-grid">
          <article
            className="diagnostic-card"
            data-ui-focus={uiFocus.systemMetricKey === 'throughput'}
          >
            <span>{content.system.throughputLabel}</span>
            <strong>{percent(snapshot.system.throughput)}</strong>
          </article>
          <article
            className="diagnostic-card"
            data-ui-focus={uiFocus.systemMetricKey === 'memoryIntegrity'}
          >
            <span>{content.system.memoryIntegrityLabel}</span>
            <strong>{percent(snapshot.system.memoryIntegrity)}</strong>
          </article>
          <article
            className="diagnostic-card"
            data-ui-focus={uiFocus.systemMetricKey === 'activeNodes'}
          >
            <span>{content.system.activeNodesLabel}</span>
            <strong>{snapshot.system.activeNodes}</strong>
          </article>
          <article
            className="diagnostic-card"
            data-ui-focus={uiFocus.systemMetricKey === 'queueDepth'}
          >
            <span>{content.system.queueDepthLabel}</span>
            <strong>{snapshot.system.queueDepth}</strong>
          </article>
        </div>
      </Panel>

      <Panel title={content.system.logsTitle} eyebrow={content.system.logsEyebrow} className="minimal-panel">
        <div className="system-log-list minimal-list">
          {snapshot.logs.slice(0, 8).map((log) => (
            <article key={log.id} className={`log-line accent-${log.accent}`}>
              <span>{formatTimestamp(log.timestamp)}</span>
              <strong>{log.channel}</strong>
              <p>{log.message}</p>
            </article>
          ))}
        </div>
      </Panel>

      <Panel title={content.system.resultTitle} eyebrow={content.system.resultEyebrow} className="minimal-panel">
        {lastCommandResult ? (
          <div className="command-result">
            <span className={`status-badge status-${lastCommandResult.ok ? 'active' : 'warning'}`}>
              {lastCommandResult.ok ? 'success' : 'failed'}
            </span>
            <h3>{lastCommandResult.commandId}</h3>
            <p>
              {content.system.ranAtLabel} {formatTimestamp(lastCommandResult.ranAt)}
            </p>
            <pre>{lastCommandResult.stdout || lastCommandResult.stderr}</pre>
          </div>
        ) : (
          <div className="loading-state">{content.system.empty}</div>
        )}
      </Panel>
    </div>
  )
}
