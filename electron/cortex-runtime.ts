import { promises as fs } from 'node:fs'
import path from 'node:path'
import { performance } from 'node:perf_hooks'
import { spawn } from 'node:child_process'
import {
  DEFAULT_FALLBACK_DATA,
  type CortexAgent,
  type CortexCampaign,
  type CortexCommand,
  type CortexCommandResult,
  type CortexDashboardSnapshot,
  type CortexJob,
  type CortexLogEvent,
  type CortexMarketingMetric,
  type CortexMemory,
  type CortexOutreachQueueItem,
  type CortexRealtimeLogEntry,
  type CortexStreamEvent,
  type CortexSystemSnapshot,
} from '../src/shared/cortex'

export type CortexConfig = {
  dataSources: {
    agentsPath: string
    memoriesPath: string
    schedulesPath: string
    logsPath: string
    systemPath: string
  }
  commands: CortexCommand[]
}

export type RuntimeState = {
  agents: CortexAgent[]
  memories: CortexMemory[]
  jobs: CortexJob[]
  logs: CortexLogEvent[]
  system: CortexSystemSnapshot
  commands: CortexCommand[]
  marketingMetrics: CortexMarketingMetric[]
  campaigns: CortexCampaign[]
  outreachQueue: CortexOutreachQueueItem[]
}

const CONFIG_FILE = 'cortex.config.json'
const MAX_LOGS = 40

const normalizeWindowsPath = (value: string) =>
  process.platform === 'win32' && value.startsWith('\\\\?\\')
    ? value.slice(4)
    : value

const defaultConfig: CortexConfig = {
  dataSources: {
    agentsPath: './fixtures/agents.json',
    memoriesPath: './fixtures/memories.json',
    schedulesPath: './fixtures/schedules.json',
    logsPath: './fixtures/logs.json',
    systemPath: './fixtures/system.json',
  },
  commands: DEFAULT_FALLBACK_DATA.commands,
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const isoNow = () => new Date().toISOString()

const resolveProjectPath = (projectRoot: string, targetPath: string) =>
  normalizeWindowsPath(
    path.isAbsolute(targetPath) ? targetPath : path.resolve(projectRoot, targetPath),
  )

async function readJsonFile<T>(
  filePath: string,
  fallback: T,
): Promise<T> {
  try {
    const contents = await fs.readFile(filePath, 'utf8')
    return JSON.parse(contents) as T
  } catch {
    return clone(fallback)
  }
}

export async function loadConfig(projectRoot: string): Promise<CortexConfig> {
  const configPath = path.resolve(projectRoot, CONFIG_FILE)
  const fileConfig = await readJsonFile<Partial<CortexConfig>>(configPath, {})

  return {
    dataSources: {
      agentsPath:
        fileConfig.dataSources?.agentsPath ?? defaultConfig.dataSources.agentsPath,
      memoriesPath:
        fileConfig.dataSources?.memoriesPath ??
        defaultConfig.dataSources.memoriesPath,
      schedulesPath:
        fileConfig.dataSources?.schedulesPath ??
        defaultConfig.dataSources.schedulesPath,
      logsPath:
        fileConfig.dataSources?.logsPath ?? defaultConfig.dataSources.logsPath,
      systemPath:
        fileConfig.dataSources?.systemPath ??
        defaultConfig.dataSources.systemPath,
    },
    commands: fileConfig.commands?.length ? fileConfig.commands : defaultConfig.commands,
  }
}

function applySystemDrift(
  system: CortexSystemSnapshot,
  scale: number,
): CortexSystemSnapshot {
  return {
    ...system,
    neuralLoad: Math.max(28, Math.min(96, system.neuralLoad + scale * 5)),
    signalCoherence: Math.max(
      62,
      Math.min(100, system.signalCoherence + scale * 4),
    ),
    memoryIntegrity: Math.max(
      78,
      Math.min(100, system.memoryIntegrity - scale * 2.2),
    ),
    queueDepth: Math.max(4, Math.min(32, system.queueDepth + Math.round(scale * 3))),
    throughput: Math.max(38, Math.min(99, system.throughput + scale * 6)),
    activeNodes: Math.max(4, system.activeNodes + (scale > 0 ? 1 : 0)),
    runtimeSeconds: system.runtimeSeconds + 7,
    lastUpdated: isoNow(),
  }
}

const makeLog = (
  entry: Pick<CortexLogEvent, 'channel' | 'message' | 'severity'> &
    Partial<CortexLogEvent>,
): CortexLogEvent => ({
  id: entry.id ?? `log-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
  timestamp: entry.timestamp ?? isoNow(),
  channel: entry.channel,
  severity: entry.severity,
  message: entry.message,
  agentId: entry.agentId,
  accent: entry.accent ?? 'cyan',
})

const replaceAgentStatus = (
  agents: CortexAgent[],
  agentId: string,
  status: CortexAgent['status'],
) =>
  agents.map((agent) =>
    agent.id === agentId
      ? {
          ...agent,
          status,
          lastActiveAt: isoNow(),
        }
      : agent,
  )

export function applyCommandMutation(
  state: RuntimeState,
  commandId: string,
  result: CortexCommandResult,
): RuntimeState {
  const nextState = clone(state)
  const logEntries: CortexLogEvent[] = []

  switch (commandId) {
    case 'refresh-overview':
    case 'run-ops-sync':
      nextState.system = applySystemDrift(nextState.system, 0.6)
      nextState.agents = replaceAgentStatus(nextState.agents, 'zib00', 'active')
      logEntries.push(
        makeLog({
          channel: 'overview',
          severity: 'info',
          message: 'Scavenjer ops overview refreshed by ZiB00.',
          agentId: 'zib00',
          accent: 'cyan',
        }),
      )
      break
    case 'sync-drop-queue':
      nextState.system = applySystemDrift(nextState.system, 0.35)
      nextState.agents = replaceAgentStatus(nextState.agents, 'drop-ops', 'active')
      logEntries.push(
        makeLog({
          channel: 'drop-ops',
          severity: 'info',
          message: 'Drop queue sync completed. Manual deployment blockers reviewed.',
          agentId: 'drop-ops',
          accent: 'green',
        }),
      )
      break
    case 'publish-marketing-brief':
    case 'run-outreach-sync':
      nextState.system = applySystemDrift(nextState.system, 0.45)
      nextState.agents = replaceAgentStatus(nextState.agents, 'zib001', 'active')
      logEntries.push(
        makeLog({
          channel: 'marketing',
          severity: 'success',
          message: 'ZiB001 marketing lane refreshed across campaigns and outreach queue.',
          agentId: 'zib001',
          accent: 'magenta',
        }),
      )
      break
    case 'review-runtime-usage':
    case 'audit-cron-health':
      nextState.system = applySystemDrift(nextState.system, -0.15)
      nextState.agents = replaceAgentStatus(nextState.agents, 'ledger-watch', 'warning')
      logEntries.push(
        makeLog({
          channel: 'runtime',
          severity: result.ok ? 'info' : 'warning',
          message: result.ok
            ? 'Runtime usage review completed.'
            : 'Runtime review reported issues that need attention.',
          agentId: 'ledger-watch',
          accent: 'amber',
        }),
      )
      break
    default:
      logEntries.push(
        makeLog({
          channel: 'commands',
          severity: result.ok ? 'info' : 'warning',
          message: `Command ${commandId} executed${result.ok ? '.' : ' with issues.'}`,
          accent: result.ok ? 'cyan' : 'red',
        }),
      )
      break
  }

  nextState.logs = [...logEntries, ...nextState.logs].slice(0, MAX_LOGS)
  return nextState
}

function createRuntimeState(config: CortexConfig): RuntimeState {
  return {
    agents: clone(DEFAULT_FALLBACK_DATA.agents),
    memories: clone(DEFAULT_FALLBACK_DATA.memories),
    jobs: clone(DEFAULT_FALLBACK_DATA.jobs),
    logs: clone(DEFAULT_FALLBACK_DATA.logs),
    system: clone(DEFAULT_FALLBACK_DATA.system),
    commands: clone(config.commands),
    marketingMetrics: clone(DEFAULT_FALLBACK_DATA.marketingMetrics),
    campaigns: clone(DEFAULT_FALLBACK_DATA.campaigns),
    outreachQueue: clone(DEFAULT_FALLBACK_DATA.outreachQueue),
  }
}

export function createCortexRuntime(projectRoot: string) {
  const normalizedProjectRoot = normalizeWindowsPath(projectRoot)
  let state: RuntimeState | null = null
  let pulseTimer: NodeJS.Timeout | null = null
  const listeners = new Set<(event: CortexStreamEvent) => void>()

  const ensureState = async () => {
    if (state) {
      return state
    }

    const config = await loadConfig(normalizedProjectRoot)
    const seeded = createRuntimeState(config)

    seeded.agents = await readJsonFile(
      resolveProjectPath(normalizedProjectRoot, config.dataSources.agentsPath),
      seeded.agents,
    )
    seeded.memories = await readJsonFile(
      resolveProjectPath(normalizedProjectRoot, config.dataSources.memoriesPath),
      seeded.memories,
    )
    seeded.jobs = await readJsonFile(
      resolveProjectPath(normalizedProjectRoot, config.dataSources.schedulesPath),
      seeded.jobs,
    )
    seeded.logs = await readJsonFile(
      resolveProjectPath(normalizedProjectRoot, config.dataSources.logsPath),
      seeded.logs,
    )
    seeded.system = await readJsonFile(
      resolveProjectPath(normalizedProjectRoot, config.dataSources.systemPath),
      seeded.system,
    )

    state = seeded
    return seeded
  }

  const emit = (event: CortexStreamEvent) => {
    listeners.forEach((listener) => listener(event))
  }

  return {
    async getDashboardSnapshot(): Promise<CortexDashboardSnapshot> {
      const current = await ensureState()
      return clone({
        agents: current.agents,
        memories: current.memories,
        jobs: current.jobs,
        logs: current.logs,
        commands: current.commands,
        system: current.system,
        marketingMetrics: current.marketingMetrics,
        campaigns: current.campaigns,
        outreachQueue: current.outreachQueue,
      })
    },
    async listAgents() {
      return (await ensureState()).agents
    },
    async listMemories() {
      return (await ensureState()).memories
    },
    async listSchedules() {
      return (await ensureState()).jobs
    },
    async listLogs() {
      return (await ensureState()).logs
    },
    async runCommand(commandId: string, context?: string): Promise<CortexCommandResult> {
      const current = await ensureState()
      const command = current.commands.find((entry) => entry.id === commandId)

      if (!command) {
        return {
          commandId,
          ok: false,
          exitCode: 1,
          stdout: '',
          stderr: `Unknown command: ${commandId}`,
          ranAt: isoNow(),
          durationMs: 0,
          context,
        }
      }

      const startedAt = performance.now()
      const cwd = resolveProjectPath(normalizedProjectRoot, command.cwd ?? '.')

      const result = await new Promise<CortexCommandResult>((resolve) => {
        const child = spawn(command.command, [...command.args], {
          cwd,
          shell: false,
        })

        let stdout = ''
        let stderr = ''

        child.stdout.on('data', (chunk) => {
          stdout += chunk.toString()
        })

        child.stderr.on('data', (chunk) => {
          stderr += chunk.toString()
        })

        child.on('close', (exitCode) => {
          resolve({
            commandId,
            ok: exitCode === 0,
            exitCode: exitCode ?? 1,
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            ranAt: isoNow(),
            durationMs: Math.round(performance.now() - startedAt),
            context,
          })
        })

        child.on('error', (error) => {
          resolve({
            commandId,
            ok: false,
            exitCode: 1,
            stdout: '',
            stderr: error.message,
            ranAt: isoNow(),
            durationMs: Math.round(performance.now() - startedAt),
            context,
          })
        })
      })

      state = applyCommandMutation(current, commandId, result)
      emit({ kind: 'commandResult', result })
      emit({
        kind: 'log',
        log: state.logs[0],
      })

      return result
    },
    async recordRealtimeLog(entry: CortexRealtimeLogEntry) {
      const current = await ensureState()
      const log = makeLog({
        channel: entry.channel,
        severity: entry.severity,
        message: entry.message,
        agentId: entry.agentId,
        accent: entry.accent,
      })

      current.logs = [log, ...current.logs].slice(0, MAX_LOGS)
      emit({ kind: 'log', log })
    },
    subscribeToEvents(listener: (event: CortexStreamEvent) => void) {
      listeners.add(listener)

      if (!pulseTimer) {
        pulseTimer = setInterval(async () => {
          const current = await ensureState()
          current.system = applySystemDrift(current.system, Math.sin(Date.now() / 5000) * 0.18)
          emit({ kind: 'systemPulse', snapshot: current.system })
        }, 6000)
      }

      return () => {
        listeners.delete(listener)
        if (!listeners.size && pulseTimer) {
          clearInterval(pulseTimer)
          pulseTimer = null
        }
      }
    },
  }
}
