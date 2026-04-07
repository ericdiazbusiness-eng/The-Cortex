import { useEffect } from 'react'
import { Panel } from '@/components/Panel'
import { formatTimestamp, percent } from '@/lib/formatters'
import { useCortex } from '@/hooks/useCortex'
import { getModeContent } from '@/lib/ui-mode'

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

  return (
    <div className="system-layout">
      <Panel title={content.system.diagnosticsTitle} eyebrow={content.system.diagnosticsEyebrow}>
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

      <Panel title={content.system.logsTitle} eyebrow={content.system.logsEyebrow}>
        <div className="system-log-list">
          {snapshot.logs.map((log) => (
            <article key={log.id} className={`log-line accent-${log.accent}`}>
              <span>{formatTimestamp(log.timestamp)}</span>
              <strong>{log.channel}</strong>
              <p>{log.message}</p>
            </article>
          ))}
        </div>
      </Panel>

      <Panel title={content.system.resultTitle} eyebrow={content.system.resultEyebrow}>
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
