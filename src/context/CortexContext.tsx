import {
  useCallback,
  createContext,
  startTransition,
  useEffect,
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
import {
  WORKSPACE_CONTEXT_STORAGE_KEY,
  UI_MODE_STORAGE_KEY,
  getPageMeta,
  getWorkspaceFromRoute,
  getWorkspaceHomeRoute,
  getWorkspaceRouteOptions,
  type UiMode,
} from '@/lib/ui-mode'
import {
  DEFAULT_REALTIME_MODE,
  DEFAULT_REALTIME_STATE,
  DEFAULT_UI_FOCUS,
  REALTIME_MODE_STORAGE_KEY,
  type BusinessDashboardSnapshot,
  getRealtimeModeProfiles,
  type CortexCommandResult,
  type CortexDashboardSnapshot,
  type CortexWorkflow,
  type CortexWorkflowAssetDownloadRequest,
  type CortexWorkflowAssetDownloadResult,
  type CortexWorkflowCreateInput,
  type AgentLaneId,
  type CortexRealtimeMode,
  type CortexRealtimeState,
  type CortexRealtimeToolCall,
  type CortexRoute,
  type CortexStreamEvent,
  type CortexSystemMetricKey,
  type CortexUiFocus,
  type CortexWorkflowUpdateInput,
  type CortexViewContext,
  type CortexViewContextValue,
  type WorkspaceContext,
  type WorkspaceSnapshot,
  resolveStoredRealtimeMode,
} from '@/shared/cortex'

type ViewContextUpdate = Partial<Omit<CortexViewContext, 'details'>> & {
  details?: Record<string, CortexViewContextValue>
}

type UiFocusUpdate = Partial<Omit<CortexUiFocus, 'revision'>>

type CortexContextValue = {
  snapshot: CortexDashboardSnapshot | null
  businessSnapshot: BusinessDashboardSnapshot | null
  workspaceSnapshot: WorkspaceSnapshot | null
  lastCommandResult: CortexCommandResult | null
  realtime: CortexRealtimeState
  realtimeMode: CortexRealtimeMode
  uiFocus: CortexUiFocus
  uiMode: UiMode
  viewContext: CortexViewContext
  workspaceContext: WorkspaceContext
  focusUi: (partial: UiFocusUpdate) => void
  navigateUi: (route: CortexRoute) => void
  syncUiRoute: (route: CortexRoute) => void
  setRealtimeMode: (mode: CortexRealtimeMode) => void
  setUiMode: (mode: UiMode) => void
  setViewContext: (partial: ViewContextUpdate) => void
  toggleUiMode: () => void
  toggleRealtimeVoice: () => Promise<void>
  runCommand: (commandId: string, context?: string) => Promise<CortexCommandResult>
  createWorkflow: (payload: CortexWorkflowCreateInput) => Promise<CortexWorkflow>
  updateWorkflow: (payload: CortexWorkflowUpdateInput) => Promise<CortexWorkflow>
  deleteWorkflow: (workflowId: string) => Promise<void>
  downloadWorkflowAsset: (
    payload: CortexWorkflowAssetDownloadRequest,
  ) => Promise<CortexWorkflowAssetDownloadResult>
  refresh: () => Promise<void>
}

const CortexContext = createContext<CortexContextValue | null>(null)

const SYSTEM_METRIC_KEYS: CortexSystemMetricKey[] = [
  'throughput',
  'memoryIntegrity',
  'activeNodes',
  'queueDepth',
]

const getWorkspaceFromCurrentLocation = (): UiMode | null => {
  if (typeof window === 'undefined') {
    return null
  }

  const hashRoute = window.location.hash.replace(/^#/, '').split('?')[0]
  if (hashRoute.startsWith('/business') || hashRoute.startsWith('/cortex')) {
    return getWorkspaceFromRoute(hashRoute)
  }

  const pathname = window.location.pathname
  if (pathname.startsWith('/business') || pathname.startsWith('/cortex')) {
    return getWorkspaceFromRoute(pathname)
  }

  return null
}

const getInitialUiMode = (): UiMode => {
  const routeWorkspace = getWorkspaceFromCurrentLocation()
  if (routeWorkspace) {
    return routeWorkspace
  }

  if (typeof window === 'undefined') {
    return 'cortex'
  }

  const storage = window.localStorage
  const storedWorkspace =
    storage && typeof storage.getItem === 'function'
      ? storage.getItem(WORKSPACE_CONTEXT_STORAGE_KEY)
      : null
  if (storedWorkspace === 'business' || storedWorkspace === 'cortex') {
    return storedWorkspace
  }

  const storedLegacyMode =
    storage && typeof storage.getItem === 'function'
      ? storage.getItem(UI_MODE_STORAGE_KEY)
      : null
  return storedLegacyMode === 'business' ? 'business' : 'cortex'
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
  const homeRoute = getWorkspaceHomeRoute(uiMode)
  const pageMeta = getPageMeta(uiMode, homeRoute)

  return {
    route: homeRoute,
    routeTitle: pageMeta.title,
    routeSubtitle: pageMeta.subtitle,
    workspace: uiMode,
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
  const [businessSnapshot, setBusinessSnapshot] = useState<BusinessDashboardSnapshot | null>(null)
  const [workspaceSnapshot, setWorkspaceSnapshot] = useState<WorkspaceSnapshot | null>(null)
  const [lastCommandResult, setLastCommandResult] =
    useState<CortexCommandResult | null>(null)
  const [uiMode, setUiModeState] = useState<UiMode>(getInitialUiMode)
  const [realtimeMode, setRealtimeModeState] = useState<CortexRealtimeMode>(getInitialRealtimeMode)
  const [realtime, setRealtime] = useState<CortexRealtimeState>(DEFAULT_REALTIME_STATE)
  const [uiFocus, setUiFocusState] = useState<CortexUiFocus>({
    ...DEFAULT_UI_FOCUS,
    workspace: getInitialUiMode(),
  })
  const [viewContext, setViewContextState] = useState<CortexViewContext>(() =>
    buildInitialViewContext(getInitialUiMode()),
  )
  const api = getCortexApi()
  const realtimeControllerRef = useRef<CortexRealtimeController | null>(null)
  const snapshotRef = useRef<CortexDashboardSnapshot | null>(snapshot)
  const businessSnapshotRef = useRef<BusinessDashboardSnapshot | null>(businessSnapshot)
  const workspaceSnapshotRef = useRef<WorkspaceSnapshot | null>(workspaceSnapshot)
  const viewContextRef = useRef<CortexViewContext>(viewContext)
  const uiFocusRef = useRef<CortexUiFocus>(uiFocus)
  const realtimeModeRef = useRef<CortexRealtimeMode>(realtimeMode)
  const workspaceContextRef = useRef<WorkspaceContext>(uiMode)

  const refresh = useCallback(async () => {
    const next = await api.getWorkspaceSnapshot(uiMode)
    setWorkspaceSnapshot(next)

    if (next.workspace === 'business') {
      setBusinessSnapshot(next.dashboard)
      setSnapshot(null)
      return
    }

    setSnapshot(next.dashboard)
    setBusinessSnapshot(null)
  }, [api, uiMode])

  const applyEvent = useCallback((event: CortexStreamEvent) => {
    if (workspaceContextRef.current !== 'cortex') {
      return
    }

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
            auditEvents: [event.log, ...current.auditEvents].slice(0, 40),
          }
        }

        if (event.kind === 'gatewayPulse') {
          return {
            ...current,
            gateway: event.gateway,
          }
        }

        setLastCommandResult(event.result)
        return current
      })
    })
  }, [])

  useEffect(() => {
    let isCancelled = false

    const hydrate = async () => {
      const next = await api.getWorkspaceSnapshot(uiMode)
      if (!isCancelled) {
        setWorkspaceSnapshot(next)
        if (next.workspace === 'business') {
          setBusinessSnapshot(next.dashboard)
          setSnapshot(null)
        } else {
          setSnapshot(next.dashboard)
          setBusinessSnapshot(null)
        }
      }
    }

    void hydrate()
    const unsubscribe = api.subscribeToEvents(applyEvent)
    return () => {
      isCancelled = true
      unsubscribe()
    }
  }, [api, applyEvent, uiMode])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storage = window.localStorage
      if (storage && typeof storage.setItem === 'function') {
        storage.setItem(WORKSPACE_CONTEXT_STORAGE_KEY, uiMode)
        storage.setItem(UI_MODE_STORAGE_KEY, uiMode === 'business' ? 'business' : 'scavenjer')
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
    snapshotRef.current = snapshot
    businessSnapshotRef.current = businessSnapshot
    workspaceSnapshotRef.current = workspaceSnapshot
    viewContextRef.current = viewContext
    uiFocusRef.current = uiFocus
    realtimeModeRef.current = realtimeMode
    workspaceContextRef.current = uiMode
  }, [businessSnapshot, realtimeMode, snapshot, uiFocus, uiMode, viewContext, workspaceSnapshot])

  const runCommand = useCallback(async (commandId: string, context?: string) => {
    const result = await api.runWorkspaceCommand(uiMode, commandId, context)
    setLastCommandResult(result)
    await refresh()
    return result
  }, [api, refresh, uiMode])

  const focusUi = useCallback((partial: UiFocusUpdate) => {
    setUiFocusState((current) => ({
      workspace:
        partial.route ? getWorkspaceFromRoute(partial.route) : partial.workspace ?? current.workspace,
      route: partial.route ?? current.route,
      missionId: partial.missionId ?? current.missionId,
      laneId: partial.laneId ?? current.laneId,
      vaultEntryId: partial.vaultEntryId ?? current.vaultEntryId,
      workflowId: partial.workflowId ?? current.workflowId,
      dropId: partial.dropId ?? current.dropId,
      systemMetricKey: partial.systemMetricKey ?? current.systemMetricKey,
      studioAssetId: partial.studioAssetId ?? current.studioAssetId,
      economyMetricId: partial.economyMetricId ?? current.economyMetricId,
      integrationMonitorId:
        partial.integrationMonitorId ?? current.integrationMonitorId,
      auditEventId: partial.auditEventId ?? current.auditEventId,
      communitySignalId: partial.communitySignalId ?? current.communitySignalId,
      revision: current.revision + 1,
    }))
  }, [])

  const navigateUi = useCallback((route: CortexRoute) => {
    const workspace = getWorkspaceFromRoute(route)
    setUiModeState(workspace)
    setUiFocusState((current) => ({
      ...current,
      workspace,
      route,
      revision: current.revision + 1,
    }))
  }, [])

  const syncUiRoute = useCallback((route: CortexRoute) => {
    const workspace = getWorkspaceFromRoute(route)
    setUiModeState(workspace)
    setUiFocusState((current) => {
      if (current.route === route && current.workspace === workspace) {
        return current
      }

      return {
        ...current,
        workspace,
        route,
      }
    })
  }, [])

  const createWorkflow = useCallback(async (payload: CortexWorkflowCreateInput) => {
    const workflow = await api.createWorkflow(payload)
    await refresh()
    focusUi({
      route: '/cortex/workflows',
      workflowId: workflow.id,
    })
    return workflow
  }, [api, focusUi, refresh])

  const updateWorkflow = useCallback(async (payload: CortexWorkflowUpdateInput) => {
    const workflow = await api.updateWorkflow(payload)
    await refresh()
    focusUi({
      route: '/cortex/workflows',
      workflowId: workflow.id,
    })
    return workflow
  }, [api, focusUi, refresh])

  const deleteWorkflow = useCallback(async (workflowId: string) => {
    await api.deleteWorkflow(workflowId)
    await refresh()
    focusUi({
      route: '/cortex/workflows',
      workflowId: null,
    })
  }, [api, focusUi, refresh])

  const downloadWorkflowAsset = useCallback(
    (payload: CortexWorkflowAssetDownloadRequest) => api.downloadWorkflowAsset(payload),
    [api],
  )

  const getLiveWorkspaceSnapshot = useCallback(
    async () => workspaceSnapshotRef.current ?? api.getWorkspaceSnapshot(workspaceContextRef.current),
    [api],
  )

  const handleRealtimeToolCall = useCallback(async (toolCall: CortexRealtimeToolCall) => {
    const currentWorkspaceSnapshot = await getLiveWorkspaceSnapshot()
    const currentSnapshot =
      currentWorkspaceSnapshot.workspace === 'cortex'
        ? currentWorkspaceSnapshot.dashboard
        : null
    const activeRealtimeMode = toolCall.mode ?? realtimeModeRef.current
    const isUiDirector = activeRealtimeMode === 'ui_director'
    const transcript = toolCall.transcript ?? null
    const activeWorkspace = currentWorkspaceSnapshot.workspace

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
        return currentWorkspaceSnapshot
      case 'get_system_metrics':
        if (!currentSnapshot) {
          throw new Error('System metrics are only available in the Cortex workspace.')
        }
        return currentSnapshot.system
      case 'list_agents': {
        if (!currentSnapshot) {
          throw new Error('Agent lanes are only available in the Cortex workspace.')
        }
        const status = normalizeString(toolCall.arguments.status)
        return status
          ? currentSnapshot.agentLanes.filter((lane) => lane.status === status)
          : currentSnapshot.agentLanes
      }
      case 'list_memories': {
        if (!currentSnapshot) {
          throw new Error('Knowledge memories are only available in the Cortex workspace.')
        }
        const laneId = normalizeString(toolCall.arguments.agentId)
        const query = normalizeString(toolCall.arguments.query)?.toLowerCase() ?? null
        const limit = normalizeLimit(toolCall.arguments.limit, 12, 40)

        return currentSnapshot.vaultEntries
          .filter((entry) => {
            const matchesLane =
              !laneId ||
              entry.linkedMissionIds.some((missionId) => {
                const mission = currentSnapshot.missions.find((item) => item.id === missionId)
                return mission?.assignedLaneId === laneId
              })
            const haystack =
              `${entry.title} ${entry.summary} ${entry.tags.join(' ')}`.toLowerCase()
            const matchesQuery = !query || haystack.includes(query)
            return matchesLane && matchesQuery
          })
          .slice(0, limit)
      }
      case 'list_workflows': {
        if (!currentSnapshot) {
          throw new Error('Workflow records are only available in the Cortex workspace.')
        }
        const query = normalizeString(toolCall.arguments.query)?.toLowerCase() ?? null
        const limit = normalizeLimit(toolCall.arguments.limit, 12, 40)

        return currentSnapshot.workflows
          .filter((workflow) => {
            const haystack =
              `${workflow.title} ${workflow.description} ${workflow.architecture} ${workflow.toolsUsed.join(' ')}`.toLowerCase()
            return !query || haystack.includes(query)
          })
          .slice(0, limit)
      }
      case 'list_schedules': {
        if (!currentSnapshot) {
          throw new Error('Schedules are only available in the Cortex workspace.')
        }
        const status = normalizeString(toolCall.arguments.status)
        return status
          ? currentSnapshot.drops.filter((drop) => drop.status === status)
          : currentSnapshot.drops
      }
      case 'list_recent_logs': {
        if (!currentSnapshot) {
          throw new Error('Recent logs are only available in the Cortex workspace.')
        }
        const limit = normalizeLimit(toolCall.arguments.limit, 10, 40)
        return currentSnapshot.auditEvents.slice(0, limit)
      }
      case 'get_ui_context':
        return {
          viewContext: viewContextRef.current,
          uiFocus: uiFocusRef.current,
          realtimeMode: activeRealtimeMode,
        }
      case 'navigate_ui': {
        const route = normalizeString(toolCall.arguments.route) as CortexRoute | null
        if (!route || !getWorkspaceRouteOptions(activeWorkspace).includes(route)) {
          throw new Error('navigate_ui requires a valid route.')
        }

        navigateUi(route)
        return {
          ok: true,
          route,
        }
      }
      case 'focus_agent': {
        if (!currentSnapshot) {
          throw new Error('Agent focus is only available in the Cortex workspace.')
        }
        const laneId = normalizeString(toolCall.arguments.agentId)
        const resolvedLaneId = currentSnapshot.agentLanes.find((lane) => lane.id === laneId)?.id ?? null
        if (!resolvedLaneId) {
          throw new Error('focus_agent requires an agentId.')
        }

        focusUi({
          route: '/cortex/zibz',
          laneId: resolvedLaneId as AgentLaneId,
          missionId: null,
          vaultEntryId: null,
          workflowId: null,
          dropId: null,
          systemMetricKey: null,
          studioAssetId: null,
          economyMetricId: null,
          integrationMonitorId: null,
          auditEventId: null,
          communitySignalId: null,
        })

        return {
          ok: true,
          route: '/cortex/zibz',
          laneId: resolvedLaneId,
        }
      }
      case 'focus_memory': {
        if (!currentSnapshot) {
          throw new Error('Memory focus is only available in the Cortex workspace.')
        }
        const vaultEntryId = normalizeString(toolCall.arguments.memoryId)
        if (!vaultEntryId) {
          throw new Error('focus_memory requires a memoryId.')
        }

        focusUi({
          route: '/cortex/knowledge',
          missionId: null,
          laneId: null,
          vaultEntryId,
          workflowId: null,
          dropId: null,
          systemMetricKey: null,
          studioAssetId: null,
          economyMetricId: null,
          integrationMonitorId: null,
          auditEventId: null,
          communitySignalId: null,
        })

        return {
          ok: true,
          route: '/cortex/knowledge',
          vaultEntryId,
        }
      }
      case 'focus_workflow': {
        if (!currentSnapshot) {
          throw new Error('Workflow focus is only available in the Cortex workspace.')
        }
        const workflowId = normalizeString(toolCall.arguments.workflowId)
        if (!workflowId) {
          throw new Error('focus_workflow requires a workflowId.')
        }

        focusUi({
          route: '/cortex/workflows',
          missionId: null,
          laneId: null,
          vaultEntryId: null,
          workflowId,
          dropId: null,
          systemMetricKey: null,
          studioAssetId: null,
          economyMetricId: null,
          integrationMonitorId: null,
          auditEventId: null,
          communitySignalId: null,
        })

        return {
          ok: true,
          route: '/cortex/workflows',
          workflowId,
        }
      }
      case 'focus_schedule': {
        if (!currentSnapshot) {
          throw new Error('Schedule focus is only available in the Cortex workspace.')
        }
        const dropId = normalizeString(toolCall.arguments.jobId)
        if (!dropId) {
          throw new Error('focus_schedule requires a jobId.')
        }

        focusUi({
          route: '/cortex/operations',
          missionId: null,
          laneId: null,
          vaultEntryId: null,
          workflowId: null,
          dropId,
          systemMetricKey: null,
          studioAssetId: null,
          economyMetricId: null,
          integrationMonitorId: null,
          auditEventId: null,
          communitySignalId: null,
        })

        return {
          ok: true,
          route: '/cortex/operations',
          dropId,
        }
      }
      case 'focus_system_metric': {
        if (!currentSnapshot) {
          throw new Error('System metric focus is only available in the Cortex workspace.')
        }
        const metricKey = normalizeString(toolCall.arguments.metricKey) as
          | CortexSystemMetricKey
          | null
        if (!metricKey || !SYSTEM_METRIC_KEYS.includes(metricKey)) {
          throw new Error('focus_system_metric requires a valid metricKey.')
        }

        focusUi({
          route: '/cortex/economy',
          missionId: null,
          laneId: null,
          vaultEntryId: null,
          workflowId: null,
          dropId: null,
          systemMetricKey: metricKey,
          studioAssetId: null,
          economyMetricId: null,
          integrationMonitorId: null,
          auditEventId: null,
          communitySignalId: null,
        })

        return {
          ok: true,
          route: '/cortex/economy',
          metricKey,
        }
      }
      case 'focus_marketing_metric': {
        if (!currentSnapshot) {
          throw new Error('Studio focus is only available in the Cortex workspace.')
        }
        const studioAssetId = normalizeString(toolCall.arguments.metricId)
        if (!studioAssetId) {
          throw new Error('focus_marketing_metric requires a metricId.')
        }

        focusUi({
          route: '/cortex/studio',
          missionId: null,
          laneId: 'content_agent',
          vaultEntryId: null,
          workflowId: null,
          dropId: null,
          systemMetricKey: null,
          studioAssetId,
          economyMetricId: null,
          integrationMonitorId: null,
          auditEventId: null,
          communitySignalId: null,
        })

        return {
          ok: true,
          route: '/cortex/studio',
          studioAssetId,
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
            viewContext: viewContextRef.current,
            realtimeMode: activeRealtimeMode,
          }),
        )
      }
      default:
        throw new Error(`Unknown realtime tool requested: ${toolCall.name}`)
    }
  }, [focusUi, getLiveWorkspaceSnapshot, navigateUi, runCommand])

  const getRealtimeSessionRequest = useCallback(
    () =>
      buildRealtimeSessionRequest(
        workspaceSnapshotRef.current,
        viewContextRef.current,
        realtimeModeRef.current,
      ),
    [],
  )

  const handleRealtimeStateChange = useCallback((nextState: CortexRealtimeState) => {
    setRealtime(nextState)
  }, [])

  const ensureRealtimeController = useCallback(() => {
    if (realtimeControllerRef.current) {
      return realtimeControllerRef.current
    }

    if (!hasElectronRealtimeBridge()) {
      return null
    }

    const controller = new CortexRealtimeController({
      api: getCortexApi(),
      getSessionRequest: () => getRealtimeSessionRequest(),
      onStateChange: (nextState) => {
        handleRealtimeStateChange(nextState)
      },
      onToolCall: (toolCall) => handleRealtimeToolCall(toolCall),
    })
    realtimeControllerRef.current = controller
    return controller
  }, [getRealtimeSessionRequest, handleRealtimeStateChange, handleRealtimeToolCall])

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
    const homeRoute = getWorkspaceHomeRoute(mode)
    setUiFocusState((current) => ({
      ...DEFAULT_UI_FOCUS,
      workspace: mode,
      route: homeRoute,
      revision: current.revision + 1,
    }))
    setViewContextState(buildInitialViewContext(mode))
  }, [])

  const setRealtimeMode = useCallback((mode: CortexRealtimeMode) => {
    const nextMode = resolveStoredRealtimeMode(mode)
    if (!(nextMode in getRealtimeModeProfiles())) {
      return
    }

    setRealtimeModeState(nextMode)
  }, [])

  const toggleUiMode = useCallback(() => {
    setUiMode(uiMode === 'business' ? 'cortex' : 'business')
  }, [setUiMode, uiMode])

  const setViewContext = useCallback((partial: ViewContextUpdate) => {
    setViewContextState((current) => ({
      ...current,
      ...partial,
      workspace: partial.workspace ?? current.workspace,
      routeTitle:
        partial.routeTitle ??
        (partial.route
          ? getPageMeta(partial.workspace ?? current.workspace, partial.route).title
          : current.routeTitle),
      routeSubtitle:
        partial.routeSubtitle ??
        (partial.route
          ? getPageMeta(partial.workspace ?? current.workspace, partial.route).subtitle
          : current.routeSubtitle),
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
        businessSnapshot,
        workspaceSnapshot,
        lastCommandResult,
        realtime,
        realtimeMode,
        uiFocus,
        uiMode,
        viewContext,
        workspaceContext: uiMode,
        focusUi,
        navigateUi,
        syncUiRoute,
        setRealtimeMode,
        setUiMode,
        setViewContext,
        toggleUiMode,
        toggleRealtimeVoice,
        runCommand,
        createWorkflow,
        updateWorkflow,
        deleteWorkflow,
        downloadWorkflowAsset,
        refresh,
      }}
    >
      {children}
    </CortexContext.Provider>
  )
}

export { CortexContext }
