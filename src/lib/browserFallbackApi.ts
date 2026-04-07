import {
  CORTEX_REALTIME_MODE_PROFILES,
  DEFAULT_FALLBACK_DATA,
  type CortexBridge,
  type CortexCommandResult,
  type CortexDashboardSnapshot,
  type CortexLogEvent,
  type CortexRealtimeLogEntry,
  type CortexStreamEvent,
} from '@/shared/cortex'

const clone = <T,>(value: T) => JSON.parse(JSON.stringify(value)) as T

const isoNow = () => new Date().toISOString()

export const createBrowserFallbackApi = (): CortexBridge => {
  let snapshot: CortexDashboardSnapshot = clone(DEFAULT_FALLBACK_DATA)

  return {
    async getDashboardSnapshot() {
      return clone(snapshot)
    },
    async listAgents() {
      return clone(snapshot.agents)
    },
    async listMemories() {
      return clone(snapshot.memories)
    },
    async listSchedules() {
      return clone(snapshot.jobs)
    },
    async listLogs() {
      return clone(snapshot.logs)
    },
    async runCommand(commandId, context) {
      const result: CortexCommandResult = {
        commandId,
        ok: true,
        exitCode: 0,
        stdout: `Browser fallback executed ${commandId}.`,
        stderr: '',
        ranAt: isoNow(),
        durationMs: 140,
        context,
      }

      const log: CortexLogEvent = {
        id: `browser-${Date.now()}`,
        timestamp: isoNow(),
        channel: 'browser-fallback',
        severity: 'info',
        message: `Simulated command ${commandId} executed in browser fallback mode.`,
        accent: 'cyan',
      }

      snapshot = {
        ...snapshot,
        logs: [log, ...snapshot.logs].slice(0, 40),
        system: {
          ...snapshot.system,
          throughput: Math.min(99, snapshot.system.throughput + 1),
          runtimeSeconds: snapshot.system.runtimeSeconds + 1,
          lastUpdated: isoNow(),
        },
      }

      return result
    },
    async createRealtimeCall() {
      throw new Error('Realtime voice requires the Electron runtime bridge.')
    },
    async transcribeAudio() {
      throw new Error('Tool voice transcription requires the Electron runtime bridge.')
    },
    async createToolVoiceResponse() {
      return {
        id: `browser-response-${Date.now()}`,
        outputText:
          'Browser fallback tool voice is unavailable. Open the Electron app to use voice modes.',
        output: [
          {
            type: 'message',
            role: 'assistant',
            content: [
              {
                type: 'output_text',
                text:
                  'Browser fallback tool voice is unavailable. Open the Electron app to use voice modes.',
              },
            ],
          },
        ],
      }
    },
    async synthesizeSpeech(payload) {
      throw new Error(
        `Speech synthesis with ${payload.model ?? CORTEX_REALTIME_MODE_PROFILES.tool_voice.speechModel} requires the Electron runtime bridge.`,
      )
    },
    async recordRealtimeLog(entry: CortexRealtimeLogEntry) {
      const log: CortexLogEvent = {
        id: `realtime-${Date.now()}`,
        timestamp: isoNow(),
        channel: entry.channel,
        severity: entry.severity,
        message: entry.message,
        agentId: entry.agentId,
        accent: entry.accent ?? 'cyan',
      }

      snapshot = {
        ...snapshot,
        logs: [log, ...snapshot.logs].slice(0, 40),
      }
    },
    subscribeToEvents(listener) {
      const timer = window.setInterval(() => {
        const pulse: CortexStreamEvent = {
          kind: 'systemPulse',
          snapshot: {
            ...snapshot.system,
            throughput: 76 + Math.round(Math.sin(Date.now() / 3000) * 6),
            neuralLoad: 72 + Math.round(Math.cos(Date.now() / 4000) * 6),
            lastUpdated: isoNow(),
            runtimeSeconds: snapshot.system.runtimeSeconds + 5,
          },
        }

        listener(pulse)
      }, 6000)

      return () => window.clearInterval(timer)
    },
  }
}
