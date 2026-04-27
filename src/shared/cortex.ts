export type AccentTone = 'cyan' | 'green' | 'magenta' | 'amber' | 'red'
export type AgentStatus = 'active' | 'idle' | 'warning' | 'offline'
export type LogSeverity = 'info' | 'success' | 'warning' | 'error'
export type WorkspaceContext = 'cortex' | 'business'
export type CortexWorkspaceRoute =
  | '/cortex'
  | '/cortex/missions'
  | '/cortex/zibz'
  | '/cortex/knowledge'
  | '/cortex/workflows'
  | '/cortex/operations'
  | '/cortex/economy'
  | '/cortex/community'
  | '/cortex/studio'
  | '/cortex/integrations'
export type BusinessRoute =
  | '/business'
  | '/business/missions'
  | '/business/zibz'
  | '/business/knowledge'
  | '/business/workflows'
  | '/business/operations'
  | '/business/economy'
  | '/business/community'
  | '/business/studio'
  | '/business/integrations'
export type CortexRoute =
  | '/'
  | CortexWorkspaceRoute
  | BusinessRoute
export type CortexRealtimeStatus =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'speaking'
  | 'executing'
  | 'error'
export type CortexRealtimeVisualState = 'off' | 'on'
export type CortexRealtimeMode =
  | 'premium_voice'
  | 'neural_voice'
  | 'lean_voice'
  | 'tool_voice'
  | 'ui_director'
export type CortexVoiceRuntime = 'voice_pipeline' | 'experimental_realtime_webrtc'
export type CortexVoiceProfileSet = 'default_three_mode' | 'legacy_four_mode'
export type CortexVoiceProvider = 'openai' | 'elevenlabs'
export type CortexRealtimeNavigationPolicy = 'auto' | 'ask_then_move' | 'focus_only'
export type CortexRealtimeToolPreference = 'read_first' | 'ui_first'
export type CortexRealtimeToolGroup = 'read' | 'ui_action' | 'execution'
export type CortexGatewayStatus = 'unknown' | 'off' | 'on'
export type CortexGatewayState = {
  status: CortexGatewayStatus
  processName: string
  lastCheckedAt: string | null
}
export type MissionType =
  | 'launch'
  | 'research'
  | 'content'
  | 'host'
  | 'drop'
  | 'marketplace'
  | 'community'
  | 'technical'
  | 'lore_worldbuilding'
  | 'support'
export type MissionStatus =
  | 'planned'
  | 'active'
  | 'blocked'
  | 'in_review'
  | 'ready'
  | 'live'
  | 'complete'
  | 'stale'
export type ApprovalState = 'not_requested' | 'pending' | 'approved' | 'rejected'
export type AgentLaneId =
  | 'mission_controller'
  | 'research_agent'
  | 'ops_agent'
  | 'content_agent'
  | 'community_agent'
  | 'marketplace_agent'
  | 'lore_agent'
  | 'support_agent'
  | 'technical_agent'
  | 'audit_agent'
export type VaultEntryCategory =
  | 'doctrine'
  | 'product_decision'
  | 'lore_canon'
  | 'codex'
  | 'research'
export type DropStatus = 'pending' | 'scheduled' | 'live' | 'complete' | 'archived' | 'blocked'
export type StudioAssetStatus = 'brief' | 'drafting' | 'review' | 'ready' | 'published' | 'stale'
export type IntegrationStatus = 'healthy' | 'syncing' | 'warning' | 'error' | 'offline'
export type CommunitySignalStatus = 'watching' | 'active' | 'blocked' | 'ready' | 'stale'
export type AuditEventCategory =
  | 'mission'
  | 'approval'
  | 'integration'
  | 'operator'
  | 'runtime'
  | 'community'
export type CortexVoicePipelineStage =
  | 'ready'
  | 'capturing'
  | 'transcribing'
  | 'responding'
  | 'tooling'
  | 'speaking'
  | 'silent_complete'
  | 'error'
  | 'stopped'
export type CortexSystemMetricKey =
  | 'throughput'
  | 'memoryIntegrity'
  | 'activeNodes'
  | 'queueDepth'

export type CortexViewContextValue =
  | string
  | number
  | boolean
  | null
  | string[]
  | number[]

export type CortexPronunciationDictionaryLocator = {
  id: string
  versionId: string
}

export type CortexVoiceSettings = {
  speed?: number
  stability?: number
  similarityBoost?: number
  style?: number
  useSpeakerBoost?: boolean
}

export type CortexToolJsonSchema = {
  type: 'object'
  properties: Record<string, unknown>
  required?: string[]
  additionalProperties?: boolean
}

export type CortexRealtimeToolDefinition = {
  type: 'function'
  name: string
  description: string
  strict: true
  parameters: CortexToolJsonSchema
}

export type CortexViewContext = {
  route: CortexRoute
  routeTitle: string
  routeSubtitle: string
  workspace: WorkspaceContext
  details: Record<string, CortexViewContextValue>
}

export type CortexUiFocus = {
  workspace: WorkspaceContext
  route: CortexRoute | null
  missionId: string | null
  laneId: AgentLaneId | null
  vaultEntryId: string | null
  workflowId: string | null
  dropId: string | null
  systemMetricKey: CortexSystemMetricKey | null
  studioAssetId: string | null
  economyMetricId: string | null
  integrationMonitorId: string | null
  auditEventId: string | null
  communitySignalId: string | null
  revision: number
}

export type CortexRealtimeModeProfile = {
  id: CortexRealtimeMode
  ariaLabel: string
  color: 'cyan' | 'green' | 'amber' | 'magenta'
  glyph: 'pulse' | 'ring' | 'delta' | 'focus' | 'wave'
  runtime: CortexVoiceRuntime
  textModel?: string
  transcriptionProvider: CortexVoiceProvider
  transcriptionModel?: string
  speechProvider: CortexVoiceProvider
  speechModel?: string
  voice: string
  voiceSettings?: CortexVoiceSettings
  pronunciationDictionaries?: CortexPronunciationDictionaryLocator[]
  silentOutput: boolean
  navigationPolicy: CortexRealtimeNavigationPolicy
  toolPreference?: CortexRealtimeToolPreference
  preferredToolGroups: CortexRealtimeToolGroup[]
}

export type CortexRealtimeSessionRequest = {
  instructions: string
  tools: CortexRealtimeToolDefinition[]
  context: CortexViewContext
  mode: CortexRealtimeMode
  runtime: CortexVoiceRuntime
  textModel?: string
  transcriptionProvider: CortexVoiceProvider
  transcriptionModel?: string
  speechProvider: CortexVoiceProvider
  speechModel?: string
  voice?: string
  voiceSettings?: CortexVoiceSettings
  pronunciationDictionaries?: CortexPronunciationDictionaryLocator[]
  silentOutput: boolean
  navigationPolicy: CortexRealtimeNavigationPolicy
  toolPreference?: CortexRealtimeToolPreference
  preferredToolGroups: CortexRealtimeToolGroup[]
}

export type CortexAudioTranscriptionRequest = {
  audioBase64: string
  mimeType: string
  fileName?: string
  provider?: CortexVoiceProvider
  model?: string
  sessionAttemptId?: string
  turnId?: string
  mode?: CortexRealtimeMode
}

export type CortexRealtimeTranscriptionTokenRequest = {
  purpose?: 'realtime_scribe'
  mode?: CortexRealtimeMode
}

export type CortexRealtimeTranscriptionTokenResult = {
  token: string
  expiresAt: string | null
}

export type CortexToolVoiceInputItem =
  | {
      type: 'message'
      role: 'user' | 'assistant'
      content:
        | string
        | Array<{
            type: 'input_text' | 'output_text'
            text: string
          }>
    }
  | {
      type: 'function_call_output'
      call_id: string
      output: string
    }

export type CortexToolVoiceOutputItem =
  | {
      type: 'function_call'
      call_id: string
      name: string
      arguments: string
    }
  | {
      type: 'message'
      role: 'assistant'
      content: Array<{
        type: string
        text?: string
      }>
    }

export type CortexToolVoiceResponseRequest = {
  model: string
  instructions?: string
  tools: CortexRealtimeToolDefinition[]
  input: CortexToolVoiceInputItem[]
  previousResponseId?: string | null
  sessionAttemptId?: string
  turnId?: string
  mode?: CortexRealtimeMode
}

export type CortexToolVoiceResponse = {
  id: string
  outputText: string
  output: CortexToolVoiceOutputItem[]
}

export type CortexSpeechSynthesisRequest = {
  text: string
  provider?: CortexVoiceProvider
  model?: string
  voice?: string
  voiceSettings?: CortexVoiceSettings
  pronunciationDictionaries?: CortexPronunciationDictionaryLocator[]
  format?: 'mp3' | 'wav'
  sessionAttemptId?: string
  turnId?: string
  mode?: CortexRealtimeMode
}

export type CortexSpeechSynthesisResult = {
  audioBase64: string
  mimeType: string
}

export type CortexAbortVoiceTurnRequest = {
  sessionAttemptId?: string | null
  turnId?: string | null
  reason: string
}

export type CortexAbortVoiceTurnResult = {
  ok: boolean
  aborted: boolean
  abortedStages: string[]
  reason: string
}

export type CortexRealtimeToolCall = {
  name: string
  callId: string
  arguments: Record<string, unknown>
  transcript?: string
  mode?: CortexRealtimeMode
}

export type CortexRealtimeState = {
  status: CortexRealtimeStatus
  visualState: CortexRealtimeVisualState
  active: boolean
  sessionId: string | null
  sessionAttemptId: string | null
  turnId: string | null
  stage: CortexVoicePipelineStage
  error: string | null
  lastEventAt: string | null
  lastTranscriptPreview: string | null
  lastResponsePreview: string | null
  lastToolCall: CortexRealtimeToolCall | null
  lastInterruptionReason: string | null
  lastInterruptedResponsePreview: string | null
  lastAbortedStage: CortexVoicePipelineStage | null
  lastFailure: {
    code?: string | null
    message: string
    stage: CortexVoicePipelineStage
    timestamp: string
  } | null
  lastCompletedStageAt: string | null
}

export type CortexRealtimeLogEntry = {
  channel: string
  severity: LogSeverity
  message: string
  agentId?: string
  accent?: AccentTone
}

export type CortexRealtimeDebugLevel = 'log' | 'warn' | 'error'

export type CortexRealtimeDebugEntry = {
  id: string
  timestamp: string
  source: 'renderer' | 'main'
  level: CortexRealtimeDebugLevel
  message: string
  severity?: CortexRealtimeDebugLevel
  mode?: CortexRealtimeMode | 'unknown'
  stage?: CortexVoicePipelineStage
  transport?: CortexVoiceRuntime
  sessionAttemptId?: string | null
  turnId?: string | null
  transcriptPreview?: string | null
  responsePreview?: string | null
  toolName?: string | null
  errorCode?: string | null
  errorMessage?: string | null
  context?: Record<string, unknown>
}

export type CortexRealtimeDebugEntryInput = Omit<
  CortexRealtimeDebugEntry,
  'id' | 'timestamp'
>

export type CortexMission = {
  id: string
  title: string
  objective: string
  type: MissionType
  owner: string
  assignedLaneId: AgentLaneId
  sourceContext: string
  dependencies: string[]
  status: MissionStatus
  dueDate: string
  evidence: string[]
  outputs: string[]
  approvalState: ApprovalState
  nextAction: string
  blockedBy: string[]
  priority: 'low' | 'medium' | 'high'
  updatedAt: string
  accent: AccentTone
}

export type CortexMissionApproval = {
  id: string
  missionId: string
  title: string
  state: ApprovalState
  requestedBy: AgentLaneId
  approver: string
  requestedAt: string
  dueAt: string
  notes: string
  artifact: string
  accent: AccentTone
}

export type CortexAgentLane = {
  id: AgentLaneId
  name: string
  status: AgentStatus
  objective: string
  assignedMissionIds: string[]
  activeTasks: string[]
  currentContext: string
  sourceDocuments: string[]
  outputsProduced: string[]
  pendingApprovalIds: string[]
  memoryNotes: string[]
  failureFlags: string[]
  auditTrailIds: string[]
  load: number
  lastUpdated: string
  accent: AccentTone
}

export type CortexVaultEntry = {
  id: string
  title: string
  category: VaultEntryCategory
  summary: string
  source: string
  linkedMissionIds: string[]
  tags: string[]
  canonical: boolean
  updatedAt: string
  accent: AccentTone
}

export type CortexDrop = {
  id: string
  missionId: string | null
  name: string
  status: DropStatus
  location: string
  city: string
  host: string
  reward: string
  countdown: string
  scheduledFor: string
  evidence: string[]
  completionState: string
  accent: AccentTone
}

export type CortexWorkflowAsset = {
  path: string
  fileName: string
  mimeType: string
  sizeBytes: number
  uploadedAt: string
  previewUrl?: string | null
}

export type CortexWorkflow = {
  id: string
  title: string
  description: string
  toolsUsed: string[]
  architecture: string
  diagramSource: CortexWorkflowAsset
  diagramPreview: CortexWorkflowAsset
  zipAsset?: CortexWorkflowAsset | null
  updatedAt: string
  accent: AccentTone
}

export type CortexWorkflowAssetKey = 'diagramSource' | 'diagramPreview' | 'zipAsset'

export type CortexWorkflowAssetUpload = {
  fileName: string
  mimeType: string
  dataBase64: string
}

export type CortexWorkflowRequiredAssetMutation =
  | {
      mode: 'keep'
    }
  | ({
      mode: 'replace'
    } & CortexWorkflowAssetUpload)

export type CortexWorkflowOptionalAssetMutation =
  | {
      mode: 'keep'
    }
  | {
      mode: 'remove'
    }
  | ({
      mode: 'replace'
    } & CortexWorkflowAssetUpload)

export type CortexWorkflowCreateInput = {
  title: string
  description: string
  toolsUsed: string[]
  architecture: string
  diagramSource: CortexWorkflowAssetUpload
  diagramPreview: CortexWorkflowAssetUpload
  zipAsset?: CortexWorkflowAssetUpload | null
}

export type CortexWorkflowUpdateInput = {
  id: string
  title: string
  description: string
  toolsUsed: string[]
  architecture: string
  diagramSource: CortexWorkflowRequiredAssetMutation
  diagramPreview: CortexWorkflowRequiredAssetMutation
  zipAsset: CortexWorkflowOptionalAssetMutation
}

export type CortexWorkflowAssetDownloadRequest = {
  workflowId: string
  assetKey: CortexWorkflowAssetKey
}

export type CortexWorkflowAssetDownloadResult = {
  ok: boolean
  canceled: boolean
  filePath: string | null
}

export type CortexLoreEntry = {
  id: string
  title: string
  arc: string
  phaseTree: string
  canonStatus: 'stable' | 'review' | 'conflict'
  summary: string
  linkedAssetIds: string[]
  consistencyNotes: string[]
  accent: AccentTone
}

export type CortexStudioAsset = {
  id: string
  title: string
  format: 'social_post' | 'video' | 'brief' | 'campaign_asset' | 'lore_asset'
  status: StudioAssetStatus
  missionId: string | null
  ownerLaneId: AgentLaneId
  approvalState: ApprovalState
  brief: string
  outputs: string[]
  updatedAt: string
  accent: AccentTone
}

export type CortexIntegrationMonitor = {
  id: string
  name: string
  status: IntegrationStatus
  source: string
  freshness: string
  failureFlags: string[]
  actionRequired: string | null
  accent: AccentTone
}

export type CortexAuditEvent = {
  id: string
  timestamp: string
  category: AuditEventCategory
  severity: LogSeverity
  title: string
  message: string
  relatedMissionId?: string | null
  relatedLaneId?: AgentLaneId | null
  actor?: string | null
  accent: AccentTone
}

export type CortexCommand = {
  id: string
  label: string
  description: string
  scope:
    | 'system'
    | 'mission'
    | 'lane'
    | 'knowledge'
    | 'operations'
    | 'economy'
    | 'community'
    | 'studio'
    | 'integration'
    | 'audit'
  tone: 'primary' | 'secondary' | 'danger'
  command: string
  args: string[]
  cwd?: string
}

export type CortexCommandResult = {
  commandId: string
  ok: boolean
  exitCode: number
  stdout: string
  stderr: string
  ranAt: string
  durationMs: number
  context?: string
}

export type CortexSystemSnapshot = {
  neuralLoad: number
  signalCoherence: number
  memoryIntegrity: number
  throughput: number
  activeNodes: number
  queueDepth: number
  runtimeSeconds: number
  lastUpdated: string
}

export type CortexEconomyMetric = {
  id: string
  label: string
  value: string
  detail: string
  trend: 'up' | 'down' | 'flat'
  status: 'healthy' | 'warning' | 'critical'
  accent: AccentTone
}

export type CortexCommunitySignal = {
  id: string
  title: string
  status: CommunitySignalStatus
  ownerLaneId: AgentLaneId
  happened: string
  happeningNow: string
  blocked: string
  approvalNeeded: string
  readyToShip: string
  staleReason: string
  accent: AccentTone
}

export type BusinessMetric = {
  id: string
  label: string
  value: string
  detail: string
  accent: AccentTone
}

export type BusinessRelationship = {
  id: string
  name: string
  type: 'client' | 'partner' | 'personal'
  stage: 'active' | 'nurture' | 'watch'
  summary: string
  lastTouch: string
  nextTouch: string
  accent: AccentTone
}

export type BusinessQueueItem = {
  id: string
  title: string
  owner: string
  status: 'queued' | 'active' | 'blocked' | 'ready'
  nextAction: string
  dueAt: string
  accent: AccentTone
}

export type BusinessWorkspaceSection = {
  id: string
  route: BusinessRoute
  title: string
  description: string
  status: 'live' | 'placeholder'
  accent: AccentTone
}

export type BusinessDashboardSnapshot = {
  metrics: BusinessMetric[]
  relationships: BusinessRelationship[]
  queue: BusinessQueueItem[]
  sections: BusinessWorkspaceSection[]
  commands: CortexCommand[]
  system: CortexSystemSnapshot
  gateway?: CortexGatewayState
}

export type CortexDashboardSnapshot = {
  missions: CortexMission[]
  approvals: CortexMissionApproval[]
  agentLanes: CortexAgentLane[]
  vaultEntries: CortexVaultEntry[]
  workflows: CortexWorkflow[]
  drops: CortexDrop[]
  loreEntries: CortexLoreEntry[]
  studioAssets: CortexStudioAsset[]
  integrationMonitors: CortexIntegrationMonitor[]
  auditEvents: CortexAuditEvent[]
  economyMetrics: CortexEconomyMetric[]
  communitySignals: CortexCommunitySignal[]
  commands: CortexCommand[]
  system: CortexSystemSnapshot
  gateway?: CortexGatewayState
}

export type WorkspaceSnapshot =
  | {
      workspace: 'cortex'
      dashboard: CortexDashboardSnapshot
    }
  | {
      workspace: 'business'
      dashboard: BusinessDashboardSnapshot
    }

export type CortexStreamEvent =
  | { kind: 'systemPulse'; snapshot: CortexSystemSnapshot }
  | { kind: 'log'; log: CortexAuditEvent }
  | { kind: 'commandResult'; result: CortexCommandResult }
  | { kind: 'gatewayPulse'; gateway: CortexGatewayState }

export type CortexBridge = {
  getWorkspaceSnapshot: (workspace: WorkspaceContext) => Promise<WorkspaceSnapshot>
  getDashboardSnapshot: () => Promise<CortexDashboardSnapshot>
  listAgents: () => Promise<CortexAgentLane[]>
  listMemories: () => Promise<CortexVaultEntry[]>
  listWorkflows: () => Promise<CortexWorkflow[]>
  listSchedules: () => Promise<CortexDrop[]>
  listLogs: () => Promise<CortexAuditEvent[]>
  createWorkflow: (payload: CortexWorkflowCreateInput) => Promise<CortexWorkflow>
  updateWorkflow: (payload: CortexWorkflowUpdateInput) => Promise<CortexWorkflow>
  deleteWorkflow: (workflowId: string) => Promise<void>
  downloadWorkflowAsset: (
    payload: CortexWorkflowAssetDownloadRequest,
  ) => Promise<CortexWorkflowAssetDownloadResult>
  runWorkspaceCommand: (
    workspace: WorkspaceContext,
    commandId: string,
    context?: string,
  ) => Promise<CortexCommandResult>
  runCommand: (commandId: string, context?: string) => Promise<CortexCommandResult>
  createRealtimeCall: (
    offerSdp: string,
    payload: CortexRealtimeSessionRequest,
  ) => Promise<string>
  transcribeAudio: (payload: CortexAudioTranscriptionRequest) => Promise<string>
  createRealtimeTranscriptionToken: (
    payload?: CortexRealtimeTranscriptionTokenRequest,
  ) => Promise<CortexRealtimeTranscriptionTokenResult>
  createToolVoiceResponse: (
    payload: CortexToolVoiceResponseRequest,
  ) => Promise<CortexToolVoiceResponse>
  synthesizeSpeech: (
    payload: CortexSpeechSynthesisRequest,
  ) => Promise<CortexSpeechSynthesisResult>
  abortVoiceTurn: (payload: CortexAbortVoiceTurnRequest) => Promise<CortexAbortVoiceTurnResult>
  recordRealtimeLog: (entry: CortexRealtimeLogEntry) => Promise<void>
  getRealtimeDebugEntries: () => Promise<CortexRealtimeDebugEntry[]>
  recordRealtimeDebug: (entry: CortexRealtimeDebugEntryInput) => Promise<void>
  subscribeToEvents: (listener: (event: CortexStreamEvent) => void) => () => void
  subscribeToRealtimeDebug: (
    listener: (entry: CortexRealtimeDebugEntry) => void,
  ) => () => void
}

export const DEFAULT_REALTIME_STATE: CortexRealtimeState = {
  status: 'idle',
  visualState: 'off',
  active: false,
  sessionId: null,
  sessionAttemptId: null,
  turnId: null,
  stage: 'stopped',
  error: null,
  lastEventAt: null,
  lastTranscriptPreview: null,
  lastResponsePreview: null,
  lastToolCall: null,
  lastInterruptionReason: null,
  lastInterruptedResponsePreview: null,
  lastAbortedStage: null,
  lastFailure: null,
  lastCompletedStageAt: null,
}

export const DEFAULT_GATEWAY_STATE: CortexGatewayState = {
  status: 'unknown',
  processName: 'hermes',
  lastCheckedAt: null,
}

export const REALTIME_MODE_STORAGE_KEY = 'cortex-realtime-mode'

// Realtime tool architecture:
// - read tools answer questions with current structured dashboard data
// - UI action tools reveal where that data lives by navigating or focusing the UI
// - execution tools change runtime state only when the user explicitly requests it
export const CORTEX_READ_TOOL_NAMES = [
  'get_dashboard_snapshot',
  'get_system_metrics',
  'list_agents',
  'list_memories',
  'list_workflows',
  'list_schedules',
  'list_recent_logs',
  'get_ui_context',
] as const

export const BUSINESS_READ_TOOL_NAMES = [
  'get_dashboard_snapshot',
  'get_ui_context',
] as const

export const CORTEX_UI_ACTION_TOOL_NAMES = [
  'navigate_ui',
  'focus_agent',
  'focus_memory',
  'focus_workflow',
  'focus_schedule',
  'focus_system_metric',
  'focus_marketing_metric',
] as const

export const BUSINESS_UI_ACTION_TOOL_NAMES = ['navigate_ui'] as const

export const CORTEX_EXECUTION_TOOL_NAMES = ['run_command'] as const

export const DEFAULT_CORTEX_PROFILE_SET: CortexVoiceProfileSet = 'default_three_mode'
export const LEGACY_CORTEX_PROFILE_SET: CortexVoiceProfileSet = 'legacy_four_mode'

const readConfiguredProfileSet = (): CortexVoiceProfileSet => {
  const viteImportMeta = import.meta as ImportMeta & {
    env?: Record<string, string | undefined>
  }
  const viteValue =
    typeof import.meta !== 'undefined' && viteImportMeta.env
      ? viteImportMeta.env.VITE_CORTEX_PROFILE_SET
      : undefined
  const runtimeProcess = globalThis as typeof globalThis & {
    process?: {
      env?: Record<string, string | undefined>
    }
  }
  const processValue =
    runtimeProcess.process?.env
      ? runtimeProcess.process.env.VITE_CORTEX_PROFILE_SET ??
        runtimeProcess.process.env.CORTEX_PROFILE_SET
      : undefined

  return viteValue === LEGACY_CORTEX_PROFILE_SET || processValue === LEGACY_CORTEX_PROFILE_SET
    ? LEGACY_CORTEX_PROFILE_SET
    : DEFAULT_CORTEX_PROFILE_SET
}

export const getConfiguredCortexProfileSet = () => readConfiguredProfileSet()

const buildLegacyRealtimeModeProfiles = (): Record<
  CortexRealtimeMode,
  CortexRealtimeModeProfile
> => ({
  premium_voice: {
    id: 'premium_voice',
    ariaLabel: 'Premium voice mode',
    color: 'cyan',
    glyph: 'pulse',
    runtime: 'voice_pipeline',
    textModel: 'gpt-4.1',
    transcriptionProvider: 'openai',
    transcriptionModel: 'gpt-4o-mini-transcribe',
    speechProvider: 'openai',
    speechModel: 'gpt-4o-mini-tts',
    voice: 'marin',
    silentOutput: false,
    navigationPolicy: 'auto',
    toolPreference: 'read_first',
    preferredToolGroups: ['read', 'ui_action', 'execution'],
  },
  neural_voice: {
    id: 'neural_voice',
    ariaLabel: 'Neural voice mode',
    color: 'amber',
    glyph: 'wave',
    runtime: 'voice_pipeline',
    textModel: 'gpt-4.1-mini',
    transcriptionProvider: 'elevenlabs',
    transcriptionModel: 'scribe_v2_realtime',
    speechProvider: 'elevenlabs',
    speechModel: 'eleven_flash_v2_5',
    voice: 'elevenlabs-custom',
    voiceSettings: {
      stability: 0.42,
      similarityBoost: 0.78,
      style: 0.28,
      speed: 1,
      useSpeakerBoost: true,
    },
    silentOutput: false,
    navigationPolicy: 'auto',
    toolPreference: 'read_first',
    preferredToolGroups: ['read', 'ui_action', 'execution'],
  },
  lean_voice: {
    id: 'lean_voice',
    ariaLabel: 'Lean voice mode',
    color: 'green',
    glyph: 'ring',
    runtime: 'voice_pipeline',
    textModel: 'gpt-4.1-mini',
    transcriptionProvider: 'openai',
    transcriptionModel: 'gpt-4o-mini-transcribe',
    speechProvider: 'openai',
    speechModel: 'gpt-4o-mini-tts',
    voice: 'marin',
    silentOutput: false,
    navigationPolicy: 'auto',
    toolPreference: 'read_first',
    preferredToolGroups: ['read', 'ui_action', 'execution'],
  },
  tool_voice: {
    id: 'tool_voice',
    ariaLabel: 'Tool voice mode',
    color: 'amber',
    glyph: 'delta',
    runtime: 'voice_pipeline',
    textModel: 'gpt-4.1-mini',
    transcriptionProvider: 'openai',
    transcriptionModel: 'gpt-4o-mini-transcribe',
    speechProvider: 'openai',
    speechModel: 'gpt-4o-mini-tts',
    voice: 'marin',
    silentOutput: false,
    navigationPolicy: 'auto',
    toolPreference: 'read_first',
    preferredToolGroups: ['read', 'ui_action', 'execution'],
  },
  ui_director: {
    id: 'ui_director',
    ariaLabel: 'UI director mode',
    color: 'magenta',
    glyph: 'focus',
    runtime: 'voice_pipeline',
    textModel: 'gpt-4.1-mini',
    transcriptionProvider: 'openai',
    transcriptionModel: 'gpt-4o-mini-transcribe',
    speechProvider: 'openai',
    voice: 'marin',
    silentOutput: true,
    navigationPolicy: 'ask_then_move',
    toolPreference: 'ui_first',
    preferredToolGroups: ['ui_action', 'read', 'execution'],
  },
})

const buildDefaultRealtimeModeProfiles = (): Record<
  CortexRealtimeMode,
  CortexRealtimeModeProfile
> => ({
  premium_voice: {
    id: 'premium_voice',
    ariaLabel: 'Premium voice mode',
    color: 'cyan',
    glyph: 'pulse',
    runtime: 'voice_pipeline',
    textModel: 'gpt-4.1',
    transcriptionProvider: 'openai',
    transcriptionModel: 'gpt-4o-mini-transcribe',
    speechProvider: 'openai',
    speechModel: 'gpt-4o-mini-tts',
    voice: 'marin',
    silentOutput: false,
    navigationPolicy: 'auto',
    toolPreference: 'read_first',
    preferredToolGroups: ['read', 'ui_action', 'execution'],
  },
  neural_voice: {
    id: 'neural_voice',
    ariaLabel: 'Neural voice mode',
    color: 'amber',
    glyph: 'wave',
    runtime: 'voice_pipeline',
    textModel: 'gpt-4.1-mini',
    transcriptionProvider: 'elevenlabs',
    transcriptionModel: 'scribe_v2_realtime',
    speechProvider: 'elevenlabs',
    speechModel: 'eleven_flash_v2_5',
    voice: 'elevenlabs-custom',
    voiceSettings: {
      stability: 0.42,
      similarityBoost: 0.78,
      style: 0.28,
      speed: 1,
      useSpeakerBoost: true,
    },
    silentOutput: false,
    navigationPolicy: 'auto',
    toolPreference: 'read_first',
    preferredToolGroups: ['read', 'ui_action', 'execution'],
  },
  lean_voice: {
    id: 'lean_voice',
    ariaLabel: 'Lean voice mode',
    color: 'green',
    glyph: 'ring',
    runtime: 'voice_pipeline',
    textModel: 'gpt-4.1-mini',
    transcriptionProvider: 'openai',
    transcriptionModel: 'gpt-4o-mini-transcribe',
    speechProvider: 'openai',
    speechModel: 'gpt-4o-mini-tts',
    voice: 'marin',
    silentOutput: false,
    navigationPolicy: 'auto',
    toolPreference: 'read_first',
    preferredToolGroups: ['execution', 'read', 'ui_action'],
  },
  tool_voice: {
    id: 'tool_voice',
    ariaLabel: 'Tool voice mode',
    color: 'amber',
    glyph: 'delta',
    runtime: 'voice_pipeline',
    textModel: 'gpt-4.1-mini',
    transcriptionProvider: 'openai',
    transcriptionModel: 'gpt-4o-mini-transcribe',
    speechProvider: 'openai',
    speechModel: 'gpt-4o-mini-tts',
    voice: 'marin',
    silentOutput: false,
    navigationPolicy: 'auto',
    toolPreference: 'read_first',
    preferredToolGroups: ['execution', 'read', 'ui_action'],
  },
  ui_director: {
    id: 'ui_director',
    ariaLabel: 'UI director mode',
    color: 'magenta',
    glyph: 'focus',
    runtime: 'voice_pipeline',
    textModel: 'gpt-4.1-mini',
    transcriptionProvider: 'openai',
    transcriptionModel: 'gpt-4o-mini-transcribe',
    speechProvider: 'openai',
    voice: 'marin',
    silentOutput: true,
    navigationPolicy: 'ask_then_move',
    toolPreference: 'ui_first',
    preferredToolGroups: ['ui_action', 'read', 'execution'],
  },
})

export const getRealtimeModeProfiles = (): Record<
  CortexRealtimeMode,
  CortexRealtimeModeProfile
> =>
  readConfiguredProfileSet() === LEGACY_CORTEX_PROFILE_SET
    ? buildLegacyRealtimeModeProfiles()
    : buildDefaultRealtimeModeProfiles()

export const getRealtimeModeProfile = (mode: CortexRealtimeMode) =>
  getRealtimeModeProfiles()[mode]

export const getVisibleRealtimeModes = (): CortexRealtimeMode[] =>
  readConfiguredProfileSet() === LEGACY_CORTEX_PROFILE_SET
    ? ['premium_voice', 'neural_voice', 'lean_voice', 'tool_voice', 'ui_director']
    : ['premium_voice', 'neural_voice', 'lean_voice', 'ui_director']

export const resolveStoredRealtimeMode = (
  storedMode: string | null | undefined,
): CortexRealtimeMode => {
  const normalizedStoredMode =
    readConfiguredProfileSet() === LEGACY_CORTEX_PROFILE_SET
      ? storedMode
      : storedMode === 'tool_voice'
        ? 'lean_voice'
        : storedMode

  if (!normalizedStoredMode) {
    return DEFAULT_REALTIME_MODE
  }

  const profiles = getRealtimeModeProfiles()
  if (normalizedStoredMode in profiles) {
    return normalizedStoredMode as CortexRealtimeMode
  }

  return DEFAULT_REALTIME_MODE
}

// Active mode registry for runtime usage.
export const CORTEX_REALTIME_MODE_PROFILES = getRealtimeModeProfiles()

export const DEFAULT_REALTIME_MODE: CortexRealtimeMode = 'premium_voice'

export const DEFAULT_UI_FOCUS: CortexUiFocus = {
  workspace: 'cortex',
  route: null,
  missionId: null,
  laneId: null,
  vaultEntryId: null,
  workflowId: null,
  dropId: null,
  systemMetricKey: null,
  studioAssetId: null,
  economyMetricId: null,
  integrationMonitorId: null,
  auditEventId: null,
  communitySignalId: null,
  revision: 0,
}

export const DEFAULT_FALLBACK_DATA: CortexDashboardSnapshot = {
  missions: [
    {
      id: 'mission-scavenjer-command',
      title: 'Scavenjer operating picture',
      objective: 'Keep drops, city events, hosts, rewards, community, commerce, and integrations in one owner-ready queue.',
      type: 'launch',
      owner: 'Scavenjer GM',
      assignedLaneId: 'mission_controller',
      sourceContext: 'Scavenjer.com, AR drops, admin modules, host program, business rewards, and Cortex alignment plan.',
      dependencies: ['mission-knowledge-map', 'mission-dropops-readiness'],
      status: 'active',
      dueDate: '2026-04-30T18:00:00.000Z',
      evidence: ['Live site route inventory', 'Admin portal module map', 'Autonomous role model'],
      outputs: ['Operations cockpit', 'Owner decision queue', 'Recommendations report'],
      approvalState: 'pending',
      nextAction: 'Approve the weekly operating priorities for drops, rewards, and commerce reliability.',
      blockedBy: [],
      priority: 'high',
      updatedAt: '2026-04-27T08:30:00.000Z',
      accent: 'cyan',
    },
    {
      id: 'mission-knowledge-map',
      title: 'Scavenjer source-truth map',
      objective: 'Convert the site, admin portal, docs, AR drop rules, Eko utility, and partner promise into reusable Cortex context.',
      type: 'research',
      owner: 'Lore And Doctrine',
      assignedLaneId: 'research_agent',
      sourceContext: 'Business page, AR Drops page, profile/connect docs, Discord notification docs, and admin types.',
      dependencies: [],
      status: 'ready',
      dueDate: '2026-04-28T17:00:00.000Z',
      evidence: ['Route list', 'Admin schema summary', 'Eko and Marbleverse Connect notes'],
      outputs: ['Doctrine cards', 'Runbook source shelf', 'Context taxonomy'],
      approvalState: 'approved',
      nextAction: 'Promote the Scavenjer operating doctrine into the Knowledge page.',
      blockedBy: [],
      priority: 'high',
      updatedAt: '2026-04-27T08:00:00.000Z',
      accent: 'green',
    },
    {
      id: 'mission-dropops-readiness',
      title: 'AR drop operations readiness',
      objective: 'Move drop requests through asset choice, registration thresholds, time-slot voting, scheduling, Discord alerts, and live completion evidence.',
      type: 'drop',
      owner: 'DropOps',
      assignedLaneId: 'ops_agent',
      sourceContext: 'Community drops implementation, ARDropsPage data model, drop scheduling setup, and Discord webhooks.',
      dependencies: ['mission-host-business-pipeline'],
      status: 'blocked',
      dueDate: '2026-04-29T20:00:00.000Z',
      evidence: ['Drop request queue', 'City vote threshold', 'Weekend time-slot flow'],
      outputs: ['Drop readiness board', 'Scheduling runbook', 'Discord alert packet'],
      approvalState: 'pending',
      nextAction: 'Approve the next city/event pairing and reward ceiling before scheduling.',
      blockedBy: ['Reward ceiling needs owner approval', 'Host confirmation incomplete'],
      priority: 'high',
      updatedAt: '2026-04-27T08:20:00.000Z',
      accent: 'amber',
    },
    {
      id: 'mission-host-business-pipeline',
      title: 'Host and business reward pipeline',
      objective: 'Turn hosts, local businesses, sponsor rewards, and real-world assets into a predictable drop supply chain.',
      type: 'host',
      owner: 'Host And Field Ops',
      assignedLaneId: 'community_agent',
      sourceContext: 'Hosts page, business page, AssetsModule, CityEventsModule, and DropsModule.',
      dependencies: [],
      status: 'in_review',
      dueDate: '2026-04-29T16:00:00.000Z',
      evidence: ['Business asset records', 'Host profiles', 'Reward sponsor fields'],
      outputs: ['Host readiness list', 'Partner reward board', 'Field handoff packet'],
      approvalState: 'pending',
      nextAction: 'Pick the highest-fit host/business pairing for the next public drop.',
      blockedBy: [],
      priority: 'high',
      updatedAt: '2026-04-27T08:10:00.000Z',
      accent: 'green',
    },
    {
      id: 'mission-commerce-minting',
      title: 'Commerce and mint reliability',
      objective: 'Keep support shop products, Stripe sessions, Crossmint collections, tracked collections, wallet delivery, and failed mint jobs under control.',
      type: 'marketplace',
      owner: 'Commerce And Mint',
      assignedLaneId: 'marketplace_agent',
      sourceContext: 'stripeService.ts, MintJobsModule, CrossmintCollectionsModule, TrackedCollectionsModule, and Eko collection flows.',
      dependencies: [],
      status: 'active',
      dueDate: '2026-04-30T19:00:00.000Z',
      evidence: ['Mint job statuses', 'Checkout session records', 'Tracked collection configs'],
      outputs: ['Failed mint watchlist', 'Retry policy', 'Collection readiness panel'],
      approvalState: 'not_requested',
      nextAction: 'Review failed mint retries before the next Eko promotion.',
      blockedBy: [],
      priority: 'medium',
      updatedAt: '2026-04-27T07:58:00.000Z',
      accent: 'cyan',
    },
    {
      id: 'mission-community-growth',
      title: 'Community and player growth loop',
      objective: 'Coordinate Discord, city voting, Scavenjer Types, leaderboard/activity, player profiles, and Eko-gated participation.',
      type: 'community',
      owner: 'Community Growth',
      assignedLaneId: 'support_agent',
      sourceContext: 'Profile feature docs, community drop flow, city voting, Discord commands, and live site player CTAs.',
      dependencies: ['mission-dropops-readiness'],
      status: 'active',
      dueDate: '2026-05-01T15:00:00.000Z',
      evidence: ['Discord command list', 'Profile schema', 'Scavenjer Type options'],
      outputs: ['Community pulse', 'Player segment board', 'Support escalation queue'],
      approvalState: 'not_requested',
      nextAction: 'Package city vote momentum into the next drop announcement.',
      blockedBy: [],
      priority: 'medium',
      updatedAt: '2026-04-27T08:12:00.000Z',
      accent: 'magenta',
    },
    {
      id: 'mission-studio-content',
      title: 'Broadcast and studio content pipeline',
      objective: 'Convert drops, hosts, rewards, lore, Chronicles, and winner evidence into scheduled creative output.',
      type: 'content',
      owner: 'Broadcast Studio',
      assignedLaneId: 'content_agent',
      sourceContext: 'Broadcast, Studios, Chronicles, social links, business partner promise, and drop recap needs.',
      dependencies: ['mission-dropops-readiness'],
      status: 'active',
      dueDate: '2026-04-30T22:00:00.000Z',
      evidence: ['Studio route inventory', 'Chronicles surface', 'Reward creative needs'],
      outputs: ['Drop teaser', 'Host spotlight', 'Partner recap', 'Chronicle brief'],
      approvalState: 'pending',
      nextAction: 'Approve the drop teaser and partner recap template.',
      blockedBy: [],
      priority: 'medium',
      updatedAt: '2026-04-27T07:45:00.000Z',
      accent: 'magenta',
    },
    {
      id: 'mission-integration-reliability',
      title: 'Integration reliability watch',
      objective: 'Keep Supabase, Thirdweb, Stripe, Crossmint, Discord, Marbleverse Connect, NeoMarket, Simulations, IPFS, and deployment routes observable.',
      type: 'technical',
      owner: 'Integration Reliability',
      assignedLaneId: 'technical_agent',
      sourceContext: 'Package dependencies, Discord notifications, SCAVENJER_CONNECT, route inventory, and admin modules.',
      dependencies: [],
      status: 'stale',
      dueDate: '2026-04-30T14:00:00.000Z',
      evidence: ['Connector list', 'Webhook HMAC flow', 'External route inventory'],
      outputs: ['Integration health matrix', 'Route mismatch recommendation', 'Read-only data adapter plan'],
      approvalState: 'not_requested',
      nextAction: 'Confirm the /events route behavior and document whether it should redirect to /drops.',
      blockedBy: [],
      priority: 'medium',
      updatedAt: '2026-04-26T21:30:00.000Z',
      accent: 'red',
    },
  ],
  approvals: [
    {
      id: 'approval-weekly-operating-priorities',
      missionId: 'mission-scavenjer-command',
      title: 'Approve weekly Scavenjer priorities',
      state: 'pending',
      requestedBy: 'mission_controller',
      approver: 'Owner',
      requestedAt: '2026-04-27T08:35:00.000Z',
      dueAt: '2026-04-27T18:00:00.000Z',
      notes: 'Locks which drop, host, reward, commerce, and content work gets autonomous attention first.',
      artifact: 'Scavenjer operating queue',
      accent: 'cyan',
    },
    {
      id: 'approval-next-drop-reward',
      missionId: 'mission-dropops-readiness',
      title: 'Approve next drop reward ceiling',
      state: 'pending',
      requestedBy: 'ops_agent',
      approver: 'Owner',
      requestedAt: '2026-04-27T08:22:00.000Z',
      dueAt: '2026-04-28T15:00:00.000Z',
      notes: 'Needed before the next host/business pairing can be scheduled publicly.',
      artifact: 'Reward and sponsor packet',
      accent: 'amber',
    },
    {
      id: 'approval-host-partner-fit',
      missionId: 'mission-host-business-pipeline',
      title: 'Approve host and business pairing',
      state: 'pending',
      requestedBy: 'community_agent',
      approver: 'Owner',
      requestedAt: '2026-04-27T08:15:00.000Z',
      dueAt: '2026-04-28T17:00:00.000Z',
      notes: 'Compares host reach, venue readiness, reward value, and field risk.',
      artifact: 'Host/business readiness card',
      accent: 'green',
    },
    {
      id: 'approval-studio-template',
      missionId: 'mission-studio-content',
      title: 'Approve recap and teaser template',
      state: 'pending',
      requestedBy: 'content_agent',
      approver: 'Owner',
      requestedAt: '2026-04-27T07:50:00.000Z',
      dueAt: '2026-04-28T12:00:00.000Z',
      notes: 'One approved template lets Studio publish drops, hosts, businesses, and winner proof faster.',
      artifact: 'Broadcast Studio template set',
      accent: 'magenta',
    },
  ],
  agentLanes: [
    {
      id: 'mission_controller',
      name: 'Scavenjer GM',
      status: 'active',
      objective: 'Keep Scavenjer running as a business system with the least possible owner effort.',
      assignedMissionIds: ['mission-scavenjer-command'],
      activeTasks: ['Rank owner decisions', 'Balance drop, commerce, and content priorities'],
      currentContext: 'Owner cockpit is focused on drops, hosts, rewards, mint reliability, and integration risk.',
      sourceDocuments: ['Scavenjer live site', 'Admin portal map', 'Cortex alignment plan'],
      outputsProduced: ['Weekly owner queue', 'Scavenjer operations map'],
      pendingApprovalIds: ['approval-weekly-operating-priorities'],
      memoryNotes: ['No new navigation is needed for this pass.'],
      failureFlags: [],
      auditTrailIds: ['audit-operating-picture'],
      load: 82,
      lastUpdated: '2026-04-27T08:35:00.000Z',
      accent: 'cyan',
    },
    {
      id: 'research_agent',
      name: 'Lore And Doctrine',
      status: 'active',
      objective: 'Keep Scavenjer product truth, AR rules, Eko utility, and worldbuilding consistent.',
      assignedMissionIds: ['mission-knowledge-map'],
      activeTasks: ['Normalize route inventory', 'Promote admin schema into runbooks'],
      currentContext: 'Source truth now covers the live site, admin portal, AR drops, Connect, profiles, and Discord.',
      sourceDocuments: ['SCAVENJER_CONNECT.md', 'PROFILE_FEATURE.md', 'COMMUNITY_DROPS_IMPLEMENTATION.md'],
      outputsProduced: ['Knowledge taxonomy', 'Scavenjer doctrine cards'],
      pendingApprovalIds: [],
      memoryNotes: ['Eko access, city voting, drop requests, and Marbleverse IDs must stay aligned.'],
      failureFlags: [],
      auditTrailIds: ['audit-knowledge-ready'],
      load: 64,
      lastUpdated: '2026-04-27T08:00:00.000Z',
      accent: 'green',
    },
    {
      id: 'ops_agent',
      name: 'DropOps',
      status: 'warning',
      objective: 'Move AR drops from request to live execution through thresholds, voting, scheduling, and proof.',
      assignedMissionIds: ['mission-dropops-readiness'],
      activeTasks: ['Confirm reward ceiling', 'Prepare Discord alert payload', 'Check registration threshold'],
      currentContext: 'Next drop is blocked until the owner approves the reward ceiling and host/business pairing.',
      sourceDocuments: ['ARDropsPage.tsx', 'DROP_SCHEDULING_SETUP.md', 'discordNotifications.ts'],
      outputsProduced: ['Drop readiness board', 'Scheduling runbook'],
      pendingApprovalIds: ['approval-next-drop-reward'],
      memoryNotes: ['Community-voted drops should auto-schedule after registration and vote conditions clear.'],
      failureFlags: ['Reward approval pending', 'Host confirmation incomplete'],
      auditTrailIds: ['audit-drop-blocked'],
      load: 76,
      lastUpdated: '2026-04-27T08:20:00.000Z',
      accent: 'amber',
    },
    {
      id: 'content_agent',
      name: 'Broadcast Studio',
      status: 'active',
      objective: 'Turn drops, businesses, hosts, and winners into shippable creative without slowing operations.',
      assignedMissionIds: ['mission-studio-content'],
      activeTasks: ['Approve teaser template', 'Draft host spotlight', 'Prepare partner recap format'],
      currentContext: 'Studio output is tied to Broadcast, Studios, Chronicles, social posts, and business partner proof.',
      sourceDocuments: ['Broadcast route', 'Studios route', 'Chronicles route', 'business page copy'],
      outputsProduced: ['Drop teaser concept', 'Partner recap outline'],
      pendingApprovalIds: ['approval-studio-template'],
      memoryNotes: ['Every drop should generate content and business proof by default.'],
      failureFlags: [],
      auditTrailIds: ['audit-studio-template'],
      load: 70,
      lastUpdated: '2026-04-27T07:50:00.000Z',
      accent: 'magenta',
    },
    {
      id: 'community_agent',
      name: 'Host And Field Ops',
      status: 'active',
      objective: 'Keep hosts, local businesses, sponsors, city events, and field readiness moving.',
      assignedMissionIds: ['mission-host-business-pipeline'],
      activeTasks: ['Rank host readiness', 'Compare partner reward value', 'Prepare field handoff'],
      currentContext: 'Host and business partner work is now treated as the supply chain for real-world rewards.',
      sourceDocuments: ['Hosts page', 'BusinessPage.tsx', 'AssetsModule', 'CityEventsModule'],
      outputsProduced: ['Host/business pairing card', 'Reward supply board'],
      pendingApprovalIds: ['approval-host-partner-fit'],
      memoryNotes: ['Businesses care about foot traffic, exposure, creator partnerships, and conversion proof.'],
      failureFlags: [],
      auditTrailIds: ['audit-host-pipeline'],
      load: 68,
      lastUpdated: '2026-04-27T08:10:00.000Z',
      accent: 'green',
    },
    {
      id: 'marketplace_agent',
      name: 'Commerce And Mint',
      status: 'active',
      objective: 'Protect revenue and ownership flows across support shop, Stripe, Crossmint, and Eko collection access.',
      assignedMissionIds: ['mission-commerce-minting'],
      activeTasks: ['Watch failed mint jobs', 'Review tracked collections', 'Check product checkout readiness'],
      currentContext: 'Commerce reliability is active because Eko utility, shop purchases, and wallet delivery support operations.',
      sourceDocuments: ['stripeService.ts', 'MintJobsModule', 'CrossmintCollectionsModule', 'TrackedCollectionsModule'],
      outputsProduced: ['Failed mint watchlist', 'Collection readiness matrix'],
      pendingApprovalIds: [],
      memoryNotes: ['Failed mint retries create support load and trust risk.'],
      failureFlags: ['Mint retry queue needs review'],
      auditTrailIds: ['audit-commerce-watch'],
      load: 59,
      lastUpdated: '2026-04-27T07:58:00.000Z',
      accent: 'cyan',
    },
    {
      id: 'lore_agent',
      name: 'Chronicles Keeper',
      status: 'active',
      objective: 'Align Chronicles, lore, simulations, and Eko mythology with real Scavenjer operations.',
      assignedMissionIds: ['mission-knowledge-map', 'mission-studio-content'],
      activeTasks: ['Check Eko utility language', 'Prepare Chronicle branch notes'],
      currentContext: 'Lore supports the product by clarifying why Ekos, Dark Circuit rewards, and simulations matter.',
      sourceDocuments: ['Chronicles route', 'Whitepaper route', 'Simulations external link'],
      outputsProduced: ['Eko utility note', 'Chronicle brief'],
      pendingApprovalIds: [],
      memoryNotes: ['Lore should not conflict with actual gameplay mechanics or business promises.'],
      failureFlags: [],
      auditTrailIds: ['audit-knowledge-ready'],
      load: 47,
      lastUpdated: '2026-04-27T07:42:00.000Z',
      accent: 'magenta',
    },
    {
      id: 'support_agent',
      name: 'Community Growth',
      status: 'active',
      objective: 'Route player, profile, Discord, city vote, drop registration, and partner questions into fast next actions.',
      assignedMissionIds: ['mission-community-growth'],
      activeTasks: ['Package city vote momentum', 'Segment Scavenjer Types', 'Prepare support macros'],
      currentContext: 'Growth loop connects Discord, Scavenjer Types, Eko holders, leaderboard activity, and city voting.',
      sourceDocuments: ['Profile feature docs', 'Discord command docs', 'SCAVENJER_TYPES'],
      outputsProduced: ['Player segment board', 'Support escalation queue'],
      pendingApprovalIds: [],
      memoryNotes: ['Profile and wallet issues should not slow drop participation.'],
      failureFlags: [],
      auditTrailIds: ['audit-community-growth'],
      load: 62,
      lastUpdated: '2026-04-27T08:12:00.000Z',
      accent: 'green',
    },
    {
      id: 'technical_agent',
      name: 'Integration Reliability',
      status: 'warning',
      objective: 'Keep every Scavenjer integration observable before it becomes player or partner pain.',
      assignedMissionIds: ['mission-integration-reliability'],
      activeTasks: ['Check route mismatch', 'Map webhooks', 'Prepare read-only adapter recommendation'],
      currentContext: 'The site depends on Supabase, Thirdweb, Stripe, Crossmint, Discord, Marbleverse, IPFS, and external routes.',
      sourceDocuments: ['package.json', 'discordNotifications.ts', 'SCAVENJER_CONNECT.md', 'App.tsx routes'],
      outputsProduced: ['Integration matrix', 'Events route recommendation'],
      pendingApprovalIds: [],
      memoryNotes: ['Future live data should enter through Integrations rather than new navigation.'],
      failureFlags: ['/events link needs route or redirect confirmation'],
      auditTrailIds: ['audit-integration-route'],
      load: 71,
      lastUpdated: '2026-04-26T21:30:00.000Z',
      accent: 'amber',
    },
    {
      id: 'audit_agent',
      name: 'Audit And Finance',
      status: 'warning',
      objective: 'Watch stale work, failed mints, reward overrun, support drag, and owner bottlenecks.',
      assignedMissionIds: ['mission-commerce-minting', 'mission-integration-reliability'],
      activeTasks: ['Flag stale integrations', 'Review failed mints', 'Track partner value proof'],
      currentContext: 'Audit is focused on revenue leakage, delivery trust, and high-friction human approvals.',
      sourceDocuments: ['Mint job records', 'Drop approval queue', 'Partner reward pipeline'],
      outputsProduced: ['Risk watchlist', 'Economy signals'],
      pendingApprovalIds: [],
      memoryNotes: ['The goal is fewer human decisions, not less visibility.'],
      failureFlags: ['Route mismatch unresolved', 'Mint retry queue needs owner review'],
      auditTrailIds: ['audit-commerce-watch', 'audit-integration-route'],
      load: 66,
      lastUpdated: '2026-04-27T08:05:00.000Z',
      accent: 'red',
    },
  ],
  vaultEntries: [
    {
      id: 'vault-scavenjer-doctrine',
      title: 'Scavenjer operating doctrine',
      category: 'doctrine',
      summary: 'Scavenjer turns the real world into a playable AR game using drops, rewards, hosts, city voting, Ekos, and Marbleverse participation.',
      source: 'scavenjer.com homepage and Scavenjer site routes',
      linkedMissionIds: ['mission-scavenjer-command', 'mission-knowledge-map'],
      tags: ['scavenjer', 'ar-drops', 'marbleverse'],
      canonical: true,
      updatedAt: '2026-04-27T08:00:00.000Z',
      accent: 'cyan',
    },
    {
      id: 'vault-business-promise',
      title: 'Business partner promise',
      category: 'product_decision',
      summary: 'Businesses use Scavenjer to turn locations into game destinations, earn guaranteed exposure, drive foot traffic, and collect conversion proof.',
      source: 'BusinessPage.tsx and live For Businesses section',
      linkedMissionIds: ['mission-host-business-pipeline'],
      tags: ['business', 'partners', 'rewards'],
      canonical: true,
      updatedAt: '2026-04-27T08:06:00.000Z',
      accent: 'green',
    },
    {
      id: 'vault-drop-system',
      title: 'AR drop system runbook',
      category: 'codex',
      summary: 'Drops combine registration thresholds, Eko gating, city votes, weekend time-slot scheduling, Discord notifications, sponsors, rewards, and completion evidence.',
      source: 'ARDropsPage.tsx, COMMUNITY_DROPS_IMPLEMENTATION.md, DROP_SCHEDULING_SETUP.md',
      linkedMissionIds: ['mission-dropops-readiness'],
      tags: ['drops', 'registration', 'discord'],
      canonical: true,
      updatedAt: '2026-04-27T08:20:00.000Z',
      accent: 'amber',
    },
    {
      id: 'vault-eko-profile',
      title: 'Eko, profile, and Marbleverse identity',
      category: 'lore_canon',
      summary: 'Ekos provide collectible identity, access, avatars, city voting, requested drops, and Dark Circuit rewards while profiles bind wallets, Marbleverse IDs, and Scavenjer Types.',
      source: 'PROFILE_FEATURE.md, SCAVENJER_CONNECT.md, live Ekos section',
      linkedMissionIds: ['mission-community-growth', 'mission-commerce-minting'],
      tags: ['eko', 'profiles', 'identity'],
      canonical: true,
      updatedAt: '2026-04-27T08:12:00.000Z',
      accent: 'magenta',
    },
    {
      id: 'vault-admin-entities',
      title: 'Admin portal operating entities',
      category: 'research',
      summary: 'The Scavenjer admin portal manages members, hosts, game modes, city events, assets, drops, drop requests, collectible events, mint jobs, Crossmint collections, tracked collections, city voting, presale, and image library records.',
      source: 'src/pages/admin/AdminPortal.tsx and src/admin/types.ts',
      linkedMissionIds: ['mission-knowledge-map', 'mission-integration-reliability'],
      tags: ['admin', 'supabase', 'operations'],
      canonical: true,
      updatedAt: '2026-04-27T08:03:00.000Z',
      accent: 'amber',
    },
  ],
  workflows: [
    {
      id: 'workflow-drop-request-to-live',
      title: 'Drop Request To Live Drop',
      description:
        'Converts a user or host drop request into an approved AR drop with asset, registration threshold, time-slot vote, Discord announcement, and completion evidence.',
      toolsUsed: ['Supabase', 'Discord webhook', 'Drop scheduler', 'Host approval'],
      architecture:
        'Request intake creates the candidate record, DropOps validates city, asset, reward, and Eko requirements, owner approval locks budget, registration and voting select the time, then Discord and the site publish the live drop.',
      diagramSource: {
        path: 'fixtures/workflow-assets/workflow-drop-request-to-live/drop-request-to-live.excalidraw',
        fileName: 'drop-request-to-live.excalidraw',
        mimeType: 'application/vnd.excalidraw+json',
        sizeBytes: 2492,
        uploadedAt: '2026-04-27T08:20:00.000Z',
      },
      diagramPreview: {
        path: 'fixtures/workflow-assets/workflow-drop-request-to-live/drop-request-to-live-preview.svg',
        fileName: 'drop-request-to-live-preview.svg',
        mimeType: 'image/svg+xml',
        sizeBytes: 1736,
        uploadedAt: '2026-04-27T08:20:00.000Z',
        previewUrl:
          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><rect width="640" height="360" rx="28" fill="%23070d1a"/><rect x="44" y="68" width="148" height="70" rx="16" fill="%2312283d" stroke="%2367f4ff" stroke-width="3"/><rect x="246" y="68" width="148" height="70" rx="16" fill="%23182929" stroke="%238bff8a" stroke-width="3"/><rect x="448" y="68" width="148" height="70" rx="16" fill="%2327173d" stroke="%23dd6fff" stroke-width="3"/><rect x="246" y="224" width="148" height="70" rx="16" fill="%23372118" stroke="%23ffc86f" stroke-width="3"/><text x="118" y="108" fill="%23edf8ff" font-family="Arial" font-size="18" text-anchor="middle">Cron Trigger</text><text x="320" y="108" fill="%23edf8ff" font-family="Arial" font-size="18" text-anchor="middle">Normalizer</text><text x="522" y="108" fill="%23edf8ff" font-family="Arial" font-size="18" text-anchor="middle">Notion Sync</text><text x="320" y="264" fill="%23edf8ff" font-family="Arial" font-size="18" text-anchor="middle">Vault Update</text><path d="M192 103h54" stroke="%2367f4ff" stroke-width="4" stroke-linecap="round"/><path d="M394 103h54" stroke="%238bff8a" stroke-width="4" stroke-linecap="round"/><path d="M320 138v82" stroke="%23ffc86f" stroke-width="4" stroke-linecap="round"/><circle cx="246" cy="103" r="6" fill="%2367f4ff"/><circle cx="448" cy="103" r="6" fill="%238bff8a"/><circle cx="320" cy="220" r="6" fill="%23ffc86f"/></svg>',
      },
      zipAsset: null,
      updatedAt: '2026-04-27T08:20:00.000Z',
      accent: 'cyan',
    },
    {
      id: 'workflow-mint-job-triage',
      title: 'Mint Job Triage',
      description:
        'Monitors support shop purchases, Stripe sessions, wallet delivery, retry counts, transaction hashes, and failed mints before they become support issues.',
      toolsUsed: ['Stripe', 'Crossmint', 'Supabase', 'Wallet lookup'],
      architecture:
        'Commerce records every checkout and mint job, Audit reviews pending and failed states, retry rules escalate repeated failures, and Support receives wallet-specific context.',
      diagramSource: {
        path: 'fixtures/workflow-assets/workflow-mint-job-triage/mint-job-triage.excalidraw',
        fileName: 'mint-job-triage.excalidraw',
        mimeType: 'application/vnd.excalidraw+json',
        sizeBytes: 2378,
        uploadedAt: '2026-04-27T07:58:00.000Z',
      },
      diagramPreview: {
        path: 'fixtures/workflow-assets/workflow-mint-job-triage/mint-job-triage-preview.svg',
        fileName: 'mint-job-triage-preview.svg',
        mimeType: 'image/svg+xml',
        sizeBytes: 1762,
        uploadedAt: '2026-04-27T07:58:00.000Z',
        previewUrl:
          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><rect width="640" height="360" rx="28" fill="%23070d1a"/><rect x="48" y="76" width="164" height="64" rx="16" fill="%2312283d" stroke="%2367f4ff" stroke-width="3"/><rect x="238" y="76" width="164" height="64" rx="16" fill="%23372118" stroke="%23ffc86f" stroke-width="3"/><rect x="428" y="76" width="164" height="64" rx="16" fill="%2327173d" stroke="%23dd6fff" stroke-width="3"/><rect x="238" y="220" width="164" height="64" rx="16" fill="%23182929" stroke="%238bff8a" stroke-width="3"/><text x="130" y="114" fill="%23edf8ff" font-family="Arial" font-size="18" text-anchor="middle">Cron Audit</text><text x="320" y="114" fill="%23edf8ff" font-family="Arial" font-size="18" text-anchor="middle">Spend Diff</text><text x="510" y="114" fill="%23edf8ff" font-family="Arial" font-size="18" text-anchor="middle">Approval Packet</text><text x="320" y="258" fill="%23edf8ff" font-family="Arial" font-size="18" text-anchor="middle">Operations Feed</text><path d="M212 108h26" stroke="%2367f4ff" stroke-width="4" stroke-linecap="round"/><path d="M402 108h26" stroke="%23ffc86f" stroke-width="4" stroke-linecap="round"/><path d="M320 140v80" stroke="%238bff8a" stroke-width="4" stroke-linecap="round"/><circle cx="238" cy="108" r="6" fill="%2367f4ff"/><circle cx="428" cy="108" r="6" fill="%23ffc86f"/><circle cx="320" cy="220" r="6" fill="%238bff8a"/></svg>',
      },
      zipAsset: null,
      updatedAt: '2026-04-27T07:58:00.000Z',
      accent: 'amber',
    },
  ],
  drops: [
    {
      id: 'drop-community-vote-next',
      missionId: 'mission-dropops-readiness',
      name: 'Community-voted city drop',
      status: 'blocked',
      location: 'Winner city route pending',
      city: 'Community vote',
      host: 'Host shortlist pending owner pick',
      reward: 'Business reward bundle + Eko-gated bonus',
      countdown: 'approval needed',
      scheduledFor: '2026-04-29T19:00:00.000Z',
      evidence: ['Drop request queue', 'City vote signal', 'Sponsor reward options'],
      completionState: 'Blocked on reward ceiling and host/business pairing approval',
      accent: 'amber',
    },
    {
      id: 'drop-business-foot-traffic',
      missionId: 'mission-host-business-pipeline',
      name: 'Business foot-traffic pilot',
      status: 'scheduled',
      location: 'Local partner destination',
      city: 'Pilot market',
      host: 'Creator host + business sponsor',
      reward: 'Real-world product/service redemption',
      countdown: '3d',
      scheduledFor: '2026-04-30T17:30:00.000Z',
      evidence: ['Business asset record', 'Sponsor deliverables', 'Host readiness note'],
      completionState: 'Scheduled after final partner creative approval',
      accent: 'green',
    },
    {
      id: 'drop-eko-holder-request',
      missionId: 'mission-community-growth',
      name: 'Eko holder requested drop',
      status: 'live',
      location: 'Marbleverse-enabled AR area',
      city: 'Active player market',
      host: 'Community host',
      reward: 'Dark Circuit reward + collectible proof',
      countdown: '02h 11m',
      scheduledFor: '2026-04-27T18:00:00.000Z',
      evidence: ['Eko requirement', 'Discord announcement', 'Registration proof'],
      completionState: 'Live; collecting player evidence and recap material',
      accent: 'cyan',
    },
  ],
  loreEntries: [
    {
      id: 'lore-eko-dark-circuit',
      title: 'Eko and Dark Circuit utility',
      arc: 'Eko Access Layer',
      phaseTree: 'Collectible identity -> gated access -> requested drops -> rewards',
      canonStatus: 'review',
      summary: 'Eko language must support real product utility without overpromising gameplay mechanics or reward availability.',
      linkedAssetIds: ['studio-chronicles-brief', 'studio-eko-utility-card'],
      consistencyNotes: ['Align Dark Circuit language with actual reward and access mechanics.'],
      accent: 'magenta',
    },
    {
      id: 'lore-scavenjer-types',
      title: 'Scavenjer Types identity system',
      arc: 'Player Identity',
      phaseTree: 'Profile creation -> one-time type choice -> avatar/social identity -> community segmentation',
      canonStatus: 'stable',
      summary: 'Pop Gs, The Family, The Futurists, The Foodies, The Hidden, and The Health-Minded are stable player segmentation primitives.',
      linkedAssetIds: ['studio-type-segment-post'],
      consistencyNotes: ['Use the exact type names from the Scavenjer site.'],
      accent: 'cyan',
    },
  ],
  studioAssets: [
    {
      id: 'studio-drop-teaser',
      title: 'Next drop teaser system',
      format: 'brief',
      status: 'review',
      missionId: 'mission-studio-content',
      ownerLaneId: 'content_agent',
      approvalState: 'pending',
      brief: 'Reusable teaser format for AR drops that can announce city vote, registration threshold, reward, sponsor, and Marbleverse CTA.',
      outputs: ['Teaser framework', 'CTA copy', 'Discord variant'],
      updatedAt: '2026-04-27T07:50:00.000Z',
      accent: 'cyan',
    },
    {
      id: 'studio-partner-recap',
      title: 'Business partner recap',
      format: 'social_post',
      status: 'ready',
      missionId: 'mission-host-business-pipeline',
      ownerLaneId: 'content_agent',
      approvalState: 'approved',
      brief: 'Proof package that shows foot traffic, player engagement, host content, and reward redemption value for business partners.',
      outputs: ['Partner recap outline', 'Metric callouts'],
      updatedAt: '2026-04-27T08:06:00.000Z',
      accent: 'green',
    },
    {
      id: 'studio-chronicles-brief',
      title: 'Chronicles drop branch',
      format: 'video',
      status: 'drafting',
      missionId: 'mission-studio-content',
      ownerLaneId: 'lore_agent',
      approvalState: 'pending',
      brief: 'Narrative bridge between live AR gameplay, Eko identity, city momentum, and the next Chronicle entry.',
      outputs: ['Story branch notes', 'Short-form hook'],
      updatedAt: '2026-04-27T07:42:00.000Z',
      accent: 'magenta',
    },
    {
      id: 'studio-eko-utility-card',
      title: 'Eko utility card',
      format: 'lore_asset',
      status: 'review',
      missionId: 'mission-community-growth',
      ownerLaneId: 'lore_agent',
      approvalState: 'not_requested',
      brief: 'Clear explanation of Eko access, avatars, voting, requested drops, and Dark Circuit rewards for players.',
      outputs: ['Utility bullets', 'Visual hierarchy notes'],
      updatedAt: '2026-04-27T08:12:00.000Z',
      accent: 'amber',
    },
  ],
  integrationMonitors: [
    {
      id: 'integration-supabase',
      name: 'Supabase',
      status: 'warning',
      source: 'Profiles, drops, assets, hosts, votes, mint jobs, admin data',
      freshness: 'Context mapped; live adapter not connected',
      failureFlags: ['Read-only Cortex adapter not implemented yet'],
      actionRequired: 'Add read-only Scavenjer data adapter under Integrations in a later pass.',
      accent: 'amber',
    },
    {
      id: 'integration-thirdweb',
      name: 'Thirdweb',
      status: 'healthy',
      source: 'Wallet auth, SIWE, NFT ownership, Eko avatar access',
      freshness: 'Context from Scavenjer Connect and profile docs',
      failureFlags: [],
      actionRequired: null,
      accent: 'green',
    },
    {
      id: 'integration-commerce',
      name: 'Stripe And Crossmint',
      status: 'healthy',
      source: 'Support shop checkout, mint jobs, Crossmint collections, tracked collections',
      freshness: 'Service contracts mapped',
      failureFlags: ['Retry queue should be watched before Eko pushes'],
      actionRequired: 'Review failed mint queue before the next sales push.',
      accent: 'cyan',
    },
    {
      id: 'integration-discord',
      name: 'Discord Webhooks',
      status: 'syncing',
      source: 'Drops, city events, assets, community, admin notifications and slash commands',
      freshness: 'Webhook channels mapped',
      failureFlags: [],
      actionRequired: 'Confirm production channel routing before live announcements.',
      accent: 'green',
    },
    {
      id: 'integration-marbleverse',
      name: 'Marbleverse Connect',
      status: 'healthy',
      source: 'Thirdweb wallet popup, SIWE signature, HMAC partner callback',
      freshness: 'Connect flow mapped',
      failureFlags: [],
      actionRequired: null,
      accent: 'magenta',
    },
    {
      id: 'integration-route-events',
      name: 'Events Route',
      status: 'warning',
      source: 'Live footer link versus app route inventory',
      freshness: 'Mismatch found in context pass',
      failureFlags: ['/events appears linked but app routes center on /drops'],
      actionRequired: 'Add route or redirect in Scavenjer site if confirmed.',
      accent: 'red',
    },
  ],
  auditEvents: [
    {
      id: 'audit-operating-picture',
      timestamp: '2026-04-27T08:35:00.000Z',
      category: 'mission',
      severity: 'info',
      title: 'Scavenjer operating picture aligned',
      message: 'Cortex dark mode is now framed around Scavenjer drops, hosts, businesses, commerce, community, studio, and integrations.',
      relatedMissionId: 'mission-scavenjer-command',
      relatedLaneId: 'mission_controller',
      actor: 'Scavenjer GM',
      accent: 'cyan',
    },
    {
      id: 'audit-knowledge-ready',
      timestamp: '2026-04-27T08:00:00.000Z',
      category: 'approval',
      severity: 'success',
      title: 'Scavenjer source truth mapped',
      message: 'Live site, admin modules, AR drop docs, profile docs, and Connect flow were promoted into Cortex context.',
      relatedMissionId: 'mission-knowledge-map',
      relatedLaneId: 'research_agent',
      actor: 'Lore And Doctrine',
      accent: 'green',
    },
    {
      id: 'audit-drop-blocked',
      timestamp: '2026-04-27T08:20:00.000Z',
      category: 'mission',
      severity: 'warning',
      title: 'Next drop blocked on reward decision',
      message: 'DropOps flagged the community-voted drop as blocked until owner approves the reward ceiling and host/business pairing.',
      relatedMissionId: 'mission-dropops-readiness',
      relatedLaneId: 'ops_agent',
      actor: 'DropOps',
      accent: 'amber',
    },
    {
      id: 'audit-host-pipeline',
      timestamp: '2026-04-27T08:10:00.000Z',
      category: 'community',
      severity: 'info',
      title: 'Host and business pipeline ranked',
      message: 'Host And Field Ops ranked partner opportunities by host readiness, reward value, field fit, and recap potential.',
      relatedMissionId: 'mission-host-business-pipeline',
      relatedLaneId: 'community_agent',
      actor: 'Host And Field Ops',
      accent: 'green',
    },
    {
      id: 'audit-studio-template',
      timestamp: '2026-04-27T07:50:00.000Z',
      category: 'community',
      severity: 'info',
      title: 'Studio templates queued',
      message: 'Broadcast Studio prepared a reusable drop teaser and business partner recap format for approval.',
      relatedMissionId: 'mission-studio-content',
      relatedLaneId: 'content_agent',
      actor: 'Broadcast Studio',
      accent: 'magenta',
    },
    {
      id: 'audit-commerce-watch',
      timestamp: '2026-04-27T07:58:00.000Z',
      category: 'runtime',
      severity: 'warning',
      title: 'Mint retry queue needs review',
      message: 'Commerce And Mint surfaced failed or retrying mint jobs as a trust and support risk before the next sales push.',
      relatedMissionId: 'mission-commerce-minting',
      relatedLaneId: 'marketplace_agent',
      actor: 'Commerce And Mint',
      accent: 'amber',
    },
    {
      id: 'audit-integration-route',
      timestamp: '2026-04-26T21:30:00.000Z',
      category: 'runtime',
      severity: 'error',
      title: 'Events route recommendation logged',
      message: 'Integration Reliability found an /events live-site link while the app route inventory appears centered on /drops.',
      relatedMissionId: 'mission-integration-reliability',
      relatedLaneId: 'technical_agent',
      actor: 'Integration Reliability',
      accent: 'red',
    },
  ],
  economyMetrics: [
    {
      id: 'economy-reward-value',
      label: 'Reward Value',
      value: '$3.8k',
      detail: 'Estimated partner reward value queued across active drops and business pilots.',
      trend: 'up',
      status: 'healthy',
      accent: 'amber',
    },
    {
      id: 'economy-commerce-health',
      label: 'Mint Health',
      value: '6 review',
      detail: 'Failed or retrying support shop mint jobs need review before the next Eko sales push.',
      trend: 'flat',
      status: 'warning',
      accent: 'cyan',
    },
    {
      id: 'economy-partner-proof',
      label: 'Partner Proof',
      value: '2 packs',
      detail: 'Two business recap packets can prove exposure, engagement, and real-world redemption value.',
      trend: 'up',
      status: 'healthy',
      accent: 'green',
    },
    {
      id: 'economy-risk-drag',
      label: 'Risk Drag',
      value: '1 lane',
      detail: 'Integration reliability is carrying the unresolved /events route recommendation.',
      trend: 'up',
      status: 'critical',
      accent: 'red',
    },
  ],
  communitySignals: [
    {
      id: 'community-city-vote',
      title: 'City vote momentum',
      status: 'ready',
      ownerLaneId: 'support_agent',
      happened: 'Players are being pushed toward voting, registering, and requesting drops.',
      happeningNow: 'Community Growth is packaging the strongest city signal for the next announcement.',
      blocked: 'Reward and host approval still block public scheduling.',
      approvalNeeded: 'Next city/event pairing',
      readyToShip: 'City vote announcement',
      staleReason: 'Momentum decays if the vote is not tied to a scheduled drop window.',
      accent: 'green',
    },
    {
      id: 'community-discord-ops',
      title: 'Discord operations',
      status: 'active',
      ownerLaneId: 'ops_agent',
      happened: 'Drop, city event, asset, community, and admin webhook channels are mapped.',
      happeningNow: 'DropOps is preparing announcement payloads and slash-command context.',
      blocked: 'Production channel routing should be confirmed before live announcements.',
      approvalNeeded: 'Webhook channel confirmation',
      readyToShip: 'Drop alert template',
      staleReason: 'No stale signal while channel ownership stays clear.',
      accent: 'cyan',
    },
    {
      id: 'community-scavenjer-types',
      title: 'Scavenjer Types segments',
      status: 'blocked',
      ownerLaneId: 'support_agent',
      happened: 'Profile context includes one-time Scavenjer Type selection and Eko avatar checks.',
      happeningNow: 'Community Growth is mapping type segments to campaign and support actions.',
      blocked: 'Segmentation needs real profile counts before it can drive automation.',
      approvalNeeded: 'Read-only profile adapter later',
      readyToShip: 'Type-based content prompts',
      staleReason: 'Type strategy stays directional until connected to live data.',
      accent: 'magenta',
    },
  ],
  commands: [
    {
      id: 'sync-mission-board',
      label: 'Sync Ops',
      description: 'Refresh Scavenjer drops, hosts, rewards, commerce, community, and integration priorities.',
      scope: 'mission',
      tone: 'primary',
      command: 'node',
      args: ['scripts/cortex-command.mjs', 'sync-mission-board'],
      cwd: '.',
    },
    {
      id: 'review-approvals',
      label: 'Review Approvals',
      description: 'Review owner decisions for reward ceiling, host/business pairing, and studio templates.',
      scope: 'mission',
      tone: 'secondary',
      command: 'node',
      args: ['scripts/cortex-command.mjs', 'review-approvals'],
      cwd: '.',
    },
    {
      id: 'refresh-zibz-lanes',
      label: 'Refresh Xylos',
      description: 'Refresh Scavenjer Xylos workloads, context, and failure flags.',
      scope: 'lane',
      tone: 'secondary',
      command: 'node',
      args: ['scripts/cortex-command.mjs', 'refresh-zibz-lanes'],
      cwd: '.',
    },
    {
      id: 'sync-vault',
      label: 'Sync Vault',
      description: 'Refresh Scavenjer doctrine, AR drop rules, Eko utility, and admin source context.',
      scope: 'knowledge',
      tone: 'secondary',
      command: 'node',
      args: ['scripts/cortex-command.mjs', 'sync-vault'],
      cwd: '.',
    },
    {
      id: 'sync-drop-lane',
      label: 'Sync Drops',
      description: 'Refresh drop requests, registration/vote state, scheduling, Discord alerts, and completion evidence.',
      scope: 'operations',
      tone: 'primary',
      command: 'node',
      args: ['scripts/cortex-command.mjs', 'sync-drop-lane'],
      cwd: '.',
    },
    {
      id: 'audit-economy',
      label: 'Audit Economy',
      description: 'Refresh reward value, failed mints, partner proof, and stale operational drag.',
      scope: 'economy',
      tone: 'danger',
      command: 'node',
      args: ['scripts/cortex-command.mjs', 'audit-economy'],
      cwd: '.',
    },
    {
      id: 'refresh-community-pulse',
      label: 'Community Pulse',
      description: 'Refresh city votes, Discord ops, Scavenjer Types, support issues, and host movement.',
      scope: 'community',
      tone: 'secondary',
      command: 'node',
      args: ['scripts/cortex-command.mjs', 'refresh-community-pulse'],
      cwd: '.',
    },
    {
      id: 'sync-studio',
      label: 'Sync Studio',
      description: 'Refresh Broadcast, Studios, Chronicles, drop recaps, and partner creative approvals.',
      scope: 'studio',
      tone: 'primary',
      command: 'node',
      args: ['scripts/cortex-command.mjs', 'sync-studio'],
      cwd: '.',
    },
    {
      id: 'check-integrations',
      label: 'Check Integrations',
      description: 'Refresh Supabase, Thirdweb, Stripe, Crossmint, Discord, Marbleverse, IPFS, and route health.',
      scope: 'integration',
      tone: 'secondary',
      command: 'node',
      args: ['scripts/cortex-command.mjs', 'check-integrations'],
      cwd: '.',
    },
    {
      id: 'review-audit-trail',
      label: 'Review Audit',
      description: 'Review stale integrations, failed mints, reward overrun, and human bottlenecks.',
      scope: 'audit',
      tone: 'secondary',
      command: 'node',
      args: ['scripts/cortex-command.mjs', 'review-audit-trail'],
      cwd: '.',
    },
  ],
  system: {
    neuralLoad: 74,
    signalCoherence: 89,
    memoryIntegrity: 95,
    throughput: 78,
    activeNodes: 10,
    queueDepth: 14,
    runtimeSeconds: 128540,
    lastUpdated: '2026-04-19T10:24:00.000Z',
  },
}

export const DEFAULT_BUSINESS_FALLBACK_DATA: BusinessDashboardSnapshot = {
  metrics: [
    {
      id: 'business-revenue',
      label: 'Owner Pipeline',
      value: '$42k',
      detail: 'Open proposals, partner opportunities, retainers, and renewal work across the current cycle.',
      accent: 'green',
    },
    {
      id: 'business-touchpoints',
      label: 'Follow-Ups',
      value: '18',
      detail: 'Client, partner, referral, and personal relationship touches that need owner-quality context.',
      accent: 'cyan',
    },
    {
      id: 'business-delivery',
      label: 'Delivery Promises',
      value: '5 active',
      detail: 'Active client work, internal commitments, and operational promises that need clean follow-through.',
      accent: 'amber',
    },
  ],
  relationships: [
    {
      id: 'relationship-northstar',
      name: 'Anchor Client',
      type: 'client',
      stage: 'active',
      summary: 'Retainer account with two active deliverables, renewal timing, and proof-of-value notes.',
      lastTouch: '2026-04-23T16:00:00.000Z',
      nextTouch: '2026-04-28T15:30:00.000Z',
      accent: 'cyan',
    },
    {
      id: 'relationship-jordan',
      name: 'Strategic Partner',
      type: 'partner',
      stage: 'nurture',
      summary: 'Referral and collaboration partner who needs a clear next offer and relationship touch.',
      lastTouch: '2026-04-21T18:30:00.000Z',
      nextTouch: '2026-04-29T17:00:00.000Z',
      accent: 'magenta',
    },
    {
      id: 'relationship-family',
      name: 'Personal Network',
      type: 'personal',
      stage: 'watch',
      summary: 'High-trust personal relationships kept visible without mixing them into client delivery noise.',
      lastTouch: '2026-04-20T12:00:00.000Z',
      nextTouch: '2026-04-27T12:00:00.000Z',
      accent: 'green',
    },
  ],
  queue: [
    {
      id: 'business-queue-proposal',
      title: 'Renewal proposal for anchor client',
      owner: 'Eric',
      status: 'active',
      nextAction: 'Finalize terms, proof-of-value summary, and send the proposal packet.',
      dueAt: '2026-04-29T18:00:00.000Z',
      accent: 'green',
    },
    {
      id: 'business-queue-followup',
      title: 'Partner and referral follow-up batch',
      owner: 'Eric',
      status: 'queued',
      nextAction: 'Send context-aware outreach with one concrete next step per relationship.',
      dueAt: '2026-04-30T17:00:00.000Z',
      accent: 'cyan',
    },
    {
      id: 'business-queue-cash',
      title: 'Invoice reconciliation',
      owner: 'Finance lane',
      status: 'blocked',
      nextAction: 'Confirm one outstanding payment and update cash timing before close.',
      dueAt: '2026-05-01T20:00:00.000Z',
      accent: 'amber',
    },
  ],
  sections: [
    {
      id: 'business-section-clients',
      route: '/business/knowledge',
      title: 'Knowledge',
      description: 'Client memory, proposals, retainers, offers, proof points, and reusable operating context.',
      status: 'live',
      accent: 'cyan',
    },
    {
      id: 'business-section-relationships',
      route: '/business/workflows',
      title: 'Workflows',
      description: 'Proposal, follow-up, renewal, delivery, finance, and relationship automation loops.',
      status: 'live',
      accent: 'magenta',
    },
    {
      id: 'business-section-delivery',
      route: '/business/operations',
      title: 'Operations',
      description: 'Client delivery, handoffs, due dates, owner bottlenecks, and active commitments.',
      status: 'live',
      accent: 'amber',
    },
    {
      id: 'business-section-finance',
      route: '/business/economy',
      title: 'Economy',
      description: 'Cash flow, invoices, pipeline quality, margin, subscriptions, and monthly close signals.',
      status: 'live',
      accent: 'green',
    },
    {
      id: 'business-section-community',
      route: '/business/community',
      title: 'Community',
      description: 'Client, partner, referral, and personal relationship rhythm without noisy CRM overhead.',
      status: 'live',
      accent: 'magenta',
    },
    {
      id: 'business-section-studio',
      route: '/business/studio',
      title: 'Studio',
      description: 'Proposals, case studies, offer pages, sales decks, and publishing assets tied to revenue.',
      status: 'live',
      accent: 'cyan',
    },
    {
      id: 'business-section-integrations',
      route: '/business/integrations',
      title: 'Integrations',
      description: 'Inbox, calendar, CRM, docs, finance tools, automations, and operational reliability.',
      status: 'live',
      accent: 'amber',
    },
  ],
  commands: [
    {
      id: 'refresh-business-pipeline',
      label: 'Refresh Pipeline',
      description: 'Refresh business pipeline metrics and upcoming relationship actions.',
      scope: 'community',
      tone: 'primary',
      command: 'node',
      args: ['scripts/cortex-command.mjs', 'refresh-business-pipeline'],
      cwd: '.',
    },
  ],
  system: {
    neuralLoad: 61,
    signalCoherence: 92,
    memoryIntegrity: 97,
    throughput: 70,
    activeNodes: 6,
    queueDepth: 7,
    runtimeSeconds: 128540,
    lastUpdated: '2026-04-25T19:24:00.000Z',
  },
}
