import {
  useCallback,
  createContext,
  startTransition,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { getCortexApi } from '@/lib/cortex-api'
import {
  buildRealtimeSessionRequest,
  CortexRealtimeController,
} from '@/lib/cortex-realtime'
import {
  hasExplicitExecutionIntent,
  hasExplicitUiNavigationIntent,
  isExecutionToolName,
  isUiActionToolName,
} from '@/lib/realtime-intent'
import { getPageMeta, UI_MODE_STORAGE_KEY, type UiMode } from '@/lib/ui-mode'
import {
  DEFAULT_REALTIME_MODE,
  DEFAULT_REALTIME_STATE,
  DEFAULT_UI_FOCUS,
  REALTIME_MODE_STORAGE_KEY,
  getRealtimeModeProfiles,
  type CortexCommandResult,
  type CortexDashboardSnapshot,
  type CortexRealtimeMode,
  type CortexRealtimeState,
  type CortexRealtimeToolCall,
  type CortexRoute,
  type CortexStreamEvent,
  type CortexSystemMetricKey,
  type CortexUiFocus,
  type CortexViewContext,
  type CortexViewContextValue,
  resolveStoredRealtimeMode,
} from '@/shared/cortex'

type ViewContextUpdate = Partial<Omit<CortexViewContext, 'details'>> & {
  details?: Record<string, CortexViewContextValue>
}

type UiFocusUpdate = Partial<Omit<CortexUiFocus, 'revision'>>

type CortexContextValue = {
  snapshot: CortexDashboardSnapshot | null
  lastCommandResult: CortexCommandResult | null
  realtime: CortexRealtimeState
  realtimeMode: CortexRealtimeMode
  uiFocus: CortexUiFocus
  uiMode: UiMode
  viewContext: CortexViewContext
  focusUi: (partial: UiFocusUpdate) => void
  navigateUi: (route: CortexRoute) => void
  setRealtimeMode: (mode: CortexRealtimeMode) => void
  setUiMode: (mode: UiMode) => void
  setViewContext: (partial: ViewContextUpdate) => void
  toggleUiMode: () => void
  toggleRealtimeVoice: () => Promise<void>
  runCommand: (commandId: string, context?: string) => Promise<CortexCommandResult>
  refresh: () => Promise<void>
}

const CortexContext = createContext<CortexContextValue | null>(null)

const ROUTES: CortexRoute[] = ['/', '/agents', '/memories', '/schedules', '/system']
const SYSTEM_METRIC_KEYS: CortexSystemMetricKey[] = [
  'throughput',
  'memoryIntegrity',
  'activeNodes',
  'queueDepth',
]

const getInitialUiMode = (): UiMode => {
  if (typeof window === 'undefined') {
    return 'scavenjer'
  }

  const storage = window.localStorage
  const stored =
    storage && typeof storage.getItem === 'function'
      ? storage.getItem(UI_MODE_STORAGE_KEY)
      : null
  return stored === 'business' ? 'business' : 'scavenjer'
}

const getInitialRealtimeMode = (): CortexRealtimeMode => {
  if (typeof window === 'undefined') {
    return DEFAULT_REALTIME_MODE
  }

  const storage = window.localStorage
  const stored =
    storage && typeof storage.getItem === 'function'
      ? storage.getItem(REALTIME_MODE_STORAGE_KEY)
      : null

  return resolveStoredRealtimeMode(stored)
}

const buildInitialViewContext = (uiMode: UiMode): CortexViewContext => {
  const pageMeta = getPageMeta(uiMode, '/')

  return {
    route: '/',
    routeTitle: pageMeta.title,
    routeSubtitle: pageMeta.subtitle,
    uiMode,
    details: {},
  }
}

const normalizeString = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : null

const normalizeLimit = (value: unknown, fallback: number, maximum: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback
  }

  return Math.max(1, Math.min(maximum, Math.round(value)))
}

const hasElectronRealtimeBridge = () =>
  typeof window !== 'undefined' && Boolean(window.cortexApi)

export const CortexProvider = ({ children }: { children: ReactNode }) => {
  const [snapshot, setSnapshot] = useState<CortexDashboardSnapshot | null>(null)
  const [lastCommandResult, setLastCommandResult] =
    useState<CortexCommandResult | null>(null)
  const [uiMode, setUiModeState] = useState<UiMode>(getInitialUiMode)
  const [realtimeMode, setRealtimeModeState] = useState<CortexRealtimeMode>(getInitialRealtimeMode)
  const [realtime, setRealtime] = useState<CortexRealtimeState>(DEFAULT_REALTIME_STATE)
  const [uiFocus, setUiFocusState] = useState<CortexUiFocus>(DEFAULT_UI_FOCUS)
  const [viewContext, setViewContextState] = useState<CortexViewContext>(() =>
    buildInitialViewContext(getInitialUiMode()),
  )
  const api = getCortexApi()
  const realtimeControllerRef = useRef<CortexRealtimeController | null>(null)

  const refresh = useCallback(async () => {
    const next = await api.getDashboardSnapshot()
    setSnapshot(next)
  }, [api])

  const applyEvent = useEffectEvent((event: CortexStreamEvent) => {
    startTransition(() => {
      setSnapshot((current) => {
        if (!current) {
          return current
        }

        if (event.kind === 'systemPulse') {
          return {
            ...current,
            system: event.snapshot,
          }
        }

        if (event.kind === 'log') {
          return {
            ...current,
            logs: [event.log, ...current.logs].slice(0, 40),
          }
        }

        setLastCommandResult(event.result)
        return current
      })
    })
  })

  useEffect(() => {
    let isCancelled = false

    const hydrate = async () => {
      const next = await api.getDashboardSnapshot()
      if (!isCancelled) {
        setSnapshot(next)
      }
    }

    void hydrate()
    const unsubscribe = api.subscribeToEvents(applyEvent)
    return () => {
      isCancelled = true
      unsubscribe()
    }
  }, [api, applyEvent])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storage = window.localStorage
      if (storage && typeof storage.setItem === 'function') {
        storage.setItem(UI_MODE_STORAGE_KEY, uiMode)
      }
    }
  }, [uiMode])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storage = window.localStorage
      if (storage && typeof storage.setItem === 'function') {
        storage.setItem(REALTIME_MODE_STORAGE_KEY, resolveStoredRealtimeMode(realtimeMode))
      }
    }
  }, [realtimeMode])

  useEffect(() => {
    const pageMeta = getPageMeta(uiMode, viewContext.route)
    setViewContextState((current) => ({
      ...current,
      uiMode,
      routeTitle: pageMeta.title,
      routeSubtitle: pageMeta.subtitle,
    }))
  }, [uiMode, viewContext.route])

  const runCommand = useCallback(async (commandId: string, context?: string) => {
    const result = await api.runCommand(commandId, context)
    setLastCommandResult(result)
    await refresh()
    return result
  }, [api, refresh])

  const focusUi = useCallback((partial: UiFocusUpdate) => {
    setUiFocusState((current) => ({
      route: partial.route ?? current.route,
      agentId: partial.agentId ?? current.agentId,
      memoryId: partial.memoryId ?? current.memoryId,
      memoryAgentId: partial.memoryAgentId ?? current.memoryAgentId,
      scheduleId: partial.scheduleId ?? current.scheduleId,
      systemMetricKey: partial.systemMetricKey ?? current.systemMetricKey,
      marketingMetricId: partial.marketingMetricId ?? current.marketingMetricId,
      revision: current.revision + 1,
    }))
  }, [])

  const navigateUi = useCallback((route: CortexRoute) => {
    setUiFocusState((current) => ({
      ...current,
      route,
      revision: current.revision + 1,
    }))
  }, [])

  const getLiveSnapshot = useEffectEvent(async () => snapshot ?? api.getDashboardSnapshot())

  const handleRealtimeToolCall = useEffectEvent(async (toolCall: CortexRealtimeToolCall) => {
    const currentSnapshot = await getLiveSnapshot()
    const activeRealtimeMode = toolCall.mode ?? realtimeMode
    const isUiDirector = activeRealtimeMode === 'ui_director'
    const transcript = toolCall.transcript ?? null

    if (isUiDirector && isUiActionToolName(toolCall.name) && !hasExplicitUiNavigationIntent(transcript)) {
      return {
        ok: false,
        error:
          'UI navigation is blocked in GUIDE mode until the user explicitly asks to show, open, navigate, reveal, display, or highlight something.',
      }
    }

    if (isUiDirector && isExecutionToolName(toolCall.name) && !hasExplicitExecutionIntent(transcript)) {
      return {
        ok: false,
        error:
          'Execution is blocked in GUIDE mode until the user explicitly asks to run or execute an action.',
      }
    }

    switch (toolCall.name) {
      case 'get_dashboard_snapshot':
        return currentSnapshot
      case 'get_system_metrics':
        return currentSnapshot.system
      case 'list_agents': {
        const status = normalizeString(toolCall.arguments.status)
        return status
          ? currentSnapshot.agents.filter((agent) => agent.status === status)
          : currentSnapshot.agents
      }
      case 'list_memories': {
        const agentId = normalizeString(toolCall.arguments.agentId)
        const query = normalizeString(toolCall.arguments.query)?.toLowerCase() ?? null
        const limit = normalizeLimit(toolCall.arguments.limit, 12, 40)

        return currentSnapshot.memories
          .filter((memory) => {
            const matchesAgent = !agentId || memory.agentId === agentId
            const haystack =
              `${memory.title} ${memory.detail} ${memory.keywords.join(' ')}`.toLowerCase()
            const matchesQuery = !query || haystack.includes(query)
            return matchesAgent && matchesQuery
          })
          .slice(0, limit)
      }
      case 'list_schedules': {
        const status = normalizeString(toolCall.arguments.status)
        return status
          ? currentSnapshot.jobs.filter((job) => job.status === status)
          : currentSnapshot.jobs
      }
      case 'list_recent_logs': {
        const limit = normalizeLimit(toolCall.arguments.limit, 10, 40)
        return currentSnapshot.logs.slice(0, limit)
      }
      case 'get_ui_context':
      return {
          viewContext,
          uiFocus,
          realtimeMode: activeRealtimeMode,
        }
      case 'navigate_ui': {
        const route = normalizeString(toolCall.arguments.route) as CortexRoute | null
        if (!route || !ROUTES.includes(route)) {
          throw new Error('navigate_ui requires a valid route.')
        }

        navigateUi(route)
        return {
          ok: true,
          route,
        }
      }
      case 'focus_agent': {
        const agentId = normalizeString(toolCall.arguments.agentId)
        if (!agentId) {
          throw new Error('focus_agent requires an agentId.')
        }

        focusUi({
          route: '/agents',
          agentId,
          memoryId: null,
          memoryAgentId: null,
          scheduleId: null,
          systemMetricKey: null,
          marketingMetricId: null,
        })

        return {
          ok: true,
          route: '/agents',
          agentId,
        }
      }
      case 'focus_memory': {
        const memoryId = normalizeString(toolCall.arguments.memoryId)
        if (!memoryId) {
          throw new Error('focus_memory requires a memoryId.')
        }

        const memory =
          currentSnapshot.memories.find((entry) => entry.id === memoryId) ?? null
        const memoryAgentId =
          normalizeString(toolCall.arguments.agentId) ?? memory?.agentId ?? null

        focusUi({
          route: '/memories',
          agentId: null,
          memoryId,
          memoryAgentId,
          scheduleId: null,
          systemMetricKey: null,
          marketingMetricId: null,
        })

        return {
          ok: true,
          route: '/memories',
          memoryId,
          memoryAgentId,
        }
      }
      case 'focus_schedule': {
        const scheduleId = normalizeString(toolCall.arguments.jobId)
        if (!scheduleId) {
          throw new Error('focus_schedule requires a jobId.')
        }

        focusUi({
          route: '/schedules',
          agentId: null,
          memoryId: null,
          memoryAgentId: null,
          scheduleId,
          systemMetricKey: null,
          marketingMetricId: null,
        })

        return {
          ok: true,
          route: '/schedules',
          scheduleId,
        }
      }
      case 'focus_system_metric': {
        const metricKey = normalizeString(toolCall.arguments.metricKey) as
          | CortexSystemMetricKey
          | null
        if (!metricKey || !SYSTEM_METRIC_KEYS.includes(metricKey)) {
          throw new Error('focus_system_metric requires a valid metricKey.')
        }

        focusUi({
          route: '/system',
          agentId: null,
          memoryId: null,
          memoryAgentId: null,
          scheduleId: null,
          systemMetricKey: metricKey,
          marketingMetricId: null,
        })

        return {
          ok: true,
          route: '/system',
          metricKey,
        }
      }
      case 'focus_marketing_metric': {
        const metricId = normalizeString(toolCall.arguments.metricId)
        if (!metricId) {
          throw new Error('focus_marketing_metric requires a metricId.')
        }

        focusUi({
          route: '/agents',
          agentId: 'zib001',
          memoryId: null,
          memoryAgentId: null,
          scheduleId: null,
          systemMetricKey: null,
          marketingMetricId: metricId,
        })

        return {
          ok: true,
          route: '/agents',
          agentId: 'zib001',
          metricId,
        }
      }
      case 'run_command': {
        const commandId = normalizeString(toolCall.arguments.commandId)
        if (!commandId) {
          throw new Error('run_command requires a commandId.')
        }

        const contextNote = normalizeString(toolCall.arguments.context)
        return runCommand(
          commandId,
          JSON.stringify({
            source: 'realtime',
            note: contextNote,
            viewContext,
            realtimeMode: activeRealtimeMode,
          }),
        )
      }
      default:
        throw new Error(`Unknown realtime tool requested: ${toolCall.name}`)
    }
  })

  const getRealtimeSessionRequest = useEffectEvent(() =>
    buildRealtimeSessionRequest(snapshot, viewContext, realtimeMode),
  )

  const handleRealtimeStateChange = useEffectEvent((nextState: CortexRealtimeState) => {
    setRealtime(nextState)
  })

  const createRealtimeController = useEffectEvent((bridgeApi: ReturnType<typeof getCortexApi>) => {
    return new CortexRealtimeController({
      api: bridgeApi,
      getSessionRequest: () => getRealtimeSessionRequest(),
      onStateChange: (nextState) => {
        handleRealtimeStateChange(nextState)
      },
      onToolCall: (toolCall) => handleRealtimeToolCall(toolCall),
    })
  })

  const ensureRealtimeController = useCallback(() => {
    if (realtimeControllerRef.current) {
      return realtimeControllerRef.current
    }

    if (!hasElectronRealtimeBridge()) {
      return null
    }

    const controller = createRealtimeController(getCortexApi())
    realtimeControllerRef.current = controller
    return controller
  }, [createRealtimeController])

  useEffect(() => {
    return () => {
      const controller = realtimeControllerRef.current
      realtimeControllerRef.current = null
      if (controller) {
        void controller.dispose()
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handleBeforeUnload = () => {
      void realtimeControllerRef.current?.dispose()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  const setUiMode = useCallback((mode: UiMode) => {
    setUiModeState(mode)
  }, [])

  const setRealtimeMode = useCallback((mode: CortexRealtimeMode) => {
    const nextMode = resolveStoredRealtimeMode(mode)
    if (!(nextMode in getRealtimeModeProfiles())) {
      return
    }

    setRealtimeModeState(nextMode)
  }, [])

  const toggleUiMode = useCallback(() => {
    setUiModeState((current) =>
      current === 'scavenjer' ? 'business' : 'scavenjer',
    )
  }, [])

  const setViewContext = useCallback((partial: ViewContextUpdate) => {
    setViewContextState((current) => ({
      ...current,
      ...partial,
      details: partial.details ?? current.details,
    }))
  }, [])

  const toggleRealtimeVoice = useCallback(async () => {
    const controller = ensureRealtimeController()

    if (!controller) {
      await getCortexApi().recordRealtimeLog({
        channel: 'realtime',
        severity: 'warning',
        message: 'Realtime voice is only available inside the Electron desktop runtime.',
        accent: 'amber',
      })
      return
    }

    await controller.toggle()
  }, [ensureRealtimeController])

  return (
    <CortexContext.Provider
      value={{
        snapshot,
        lastCommandResult,
        realtime,
        realtimeMode,
        uiFocus,
        uiMode,
        viewContext,
        focusUi,
        navigateUi,
        setRealtimeMode,
        setUiMode,
        setViewContext,
        toggleUiMode,
        toggleRealtimeVoice,
        runCommand,
        refresh,
      }}
    >
      {children}
    </CortexContext.Provider>
  )
}

export { CortexContext }
