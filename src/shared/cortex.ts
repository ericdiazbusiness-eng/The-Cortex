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
export type CortexVoiceRuntime = 'gpt_realtime_webrtc' | 'voice_pipeline'
export type CortexVoiceProfileSet = 'default_three_mode' | 'legacy_four_mode'
export type CortexVoiceProvider = 'openai' | 'elevenlabs'
export type CortexRealtimeNavigationPolicy = 'auto' | 'ask_then_move' | 'focus_only'
export type CortexRealtimeToolPreference = 'read_first' | 'ui_first'
export type CortexRealtimeToolGroup = 'read' | 'ui_action' | 'execution'
export type CortexDatabaseEntityType =
  | 'mission'
  | 'approval'
  | 'operator'
  | 'memory'
  | 'workflow'
  | 'drop'
  | 'lore'
  | 'studio_asset'
  | 'integration'
  | 'usage_indicator'
  | 'audit_event'
  | 'economy_metric'
  | 'community_signal'
  | 'business_metric'
  | 'business_relationship'
  | 'business_queue_item'
  | 'business_section'
  | 'command'
  | 'system'
export type CortexDatabaseStatus = {
  configured: boolean
  connected: boolean
  source: 'supabase' | 'fixtures' | 'browser_fallback' | 'mixed'
  checkedAt: string
  error: string | null
  workspaces: Array<{
    workspace: WorkspaceContext
    source: 'supabase' | 'fixtures' | 'browser_fallback' | 'mixed'
    entityCount: number
    stale: boolean
  }>
  tables: Array<{
    name: string
    configured: boolean
    connected: boolean
    readOnly: boolean
    recordCount: number | null
    lastCheckedAt: string
    error: string | null
  }>
}
export type CortexVoiceActionType =
  | 'navigate_ui'
  | 'focus_record'
  | 'run_workspace_command'
  | 'refresh_workspace'
  | 'create_workflow'
  | 'update_workflow'
  | 'delete_workflow'
export type CortexVoiceActionRequest = {
  action: CortexVoiceActionType
  workspace: WorkspaceContext
  parameters: Record<string, unknown>
  reason?: string | null
  transcript?: string | null
}
export type CortexVoiceActionPrepared = {
  actionId: string
  action: CortexVoiceActionType
  workspace: WorkspaceContext
  parameters: Record<string, unknown>
  reason: string | null
  transcript: string | null
  requiresConfirmation: true
  expiresAt: string
  summary: string
}
export type CortexVoiceActionConfirmation = {
  actionId: string
  confirmed: boolean
  transcript?: string | null
}
export type CortexVoiceActionResult = {
  actionId: string
  action: CortexVoiceActionType
  workspace: WorkspaceContext
  ok: boolean
  confirmed: boolean
  canceled: boolean
  result: unknown
  error: string | null
  auditedAt: string
}
export type CortexRealtimeLatencyMarks = {
  sessionStartedAt: string | null
  speechStartedAt: string | null
  speechStoppedAt: string | null
  responseStartedAt: string | null
  toolStartedAt: string | null
  toolCompletedAt: string | null
  firstAudioAt: string | null
  cancelledAt: string | null
  fallbackAt: string | null
}
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
  realtimeModel?: string
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
  realtimeModel?: string
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
  latency: CortexRealtimeLatencyMarks | null
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

export type CortexWorkflowGraphNodeKind =
  | 'trigger'
  | 'agent'
  | 'tool'
  | 'service'
  | 'decision'
  | 'storage'
  | 'output'

export type CortexWorkflowGraphNode = {
  id: string
  label: string
  detail?: string
  kind: CortexWorkflowGraphNodeKind
  accent?: AccentTone
  x: number
  y: number
}

export type CortexWorkflowGraphEdge = {
  id: string
  from: string
  to: string
  label?: string
}

export type CortexWorkflowGraph = {
  version: 1
  layout: 'flowchart-canvas' | 'agent-canvas'
  nodes: CortexWorkflowGraphNode[]
  edges: CortexWorkflowGraphEdge[]
  note?: string
}

export type CortexWorkflow = {
  id: string
  title: string
  description: string
  toolsUsed: string[]
  architecture: string
  diagramGraph?: CortexWorkflowGraph | null
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
  diagramGraph?: CortexWorkflowGraph | null
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
  diagramGraph?: CortexWorkflowGraph | null
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

export type CortexWorkflowAssetContentRequest = CortexWorkflowAssetDownloadRequest

export type CortexWorkflowAssetContentResult = {
  fileName: string
  mimeType: string
  sizeBytes: number
  dataBase64: string
  text: string | null
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

export type CortexLoreCanonStatus = 'stable' | 'review' | 'conflict' | 'draft'

export type CortexLoreSourceRef = {
  label: string
  source: 'Notion' | 'Scav Repo' | 'Cortex' | 'Scavenjer Site'
}

export type CortexLoreRecordBase = {
  id: string
  title: string
  summary: string
  canonStatus: CortexLoreCanonStatus
  accent: AccentTone
  imageUrl: string
  aesthetic: string
  automationContext: string
  personalityContext: string
  visualPrompt: string
  sourceRefs: CortexLoreSourceRef[]
  relatedCharacterIds: string[]
  relatedEnvironmentIds: string[]
  relatedFactionIds: string[]
  relatedArtifactIds: string[]
  tags: string[]
}

export type CortexLoreUniverse = CortexLoreRecordBase & {
  kind: 'universe'
  layer: 'anchor' | 'resonance' | 'mythic'
  storyline: string
  direction: string
}

export type CortexLoreCharacter = CortexLoreRecordBase & {
  kind: 'character'
  role: string
  universeId: string
  clan?: string
}

export type CortexLoreEnvironment = CortexLoreRecordBase & {
  kind: 'environment'
  universeId: string
  environmentType: 'sector' | 'planet' | 'city' | 'arena' | 'drop-zone'
}

export type CortexLoreFaction = CortexLoreRecordBase & {
  kind: 'faction'
  universeId: string
  agenda: string
}

export type CortexLoreArtifact = CortexLoreRecordBase & {
  kind: 'artifact'
  universeId: string
  function: string
}

export type CortexLoreAtlas = {
  loreUniverses: CortexLoreUniverse[]
  loreCharacters: CortexLoreCharacter[]
  loreEnvironments: CortexLoreEnvironment[]
  loreFactions: CortexLoreFaction[]
  loreArtifacts: CortexLoreArtifact[]
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

export type CortexUsageIndicatorId = 'elevenlabs' | 'codex_session' | 'codex_weekly'

export type CortexUsageIndicator = {
  id: CortexUsageIndicatorId
  label: string
  detail: string
  symbol: string
  value: number
  tone: 'cyan' | 'magenta' | 'green'
  source: 'live' | 'fallback' | 'unavailable'
  refreshedAt: string | null
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
  usageIndicators: CortexUsageIndicator[]
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
  | { kind: 'usagePulse'; indicators: CortexUsageIndicator[] }

export type CortexDesktopWindowState = {
  overlayEnabled: boolean
  visible: boolean
  alwaysOnTop: boolean
  interactive: true
  shortcuts: {
    toggleVisibility: string
    toggleOverlay: string
    quit: string
  }
}

export type CortexBridge = {
  getDesktopWindowState: () => Promise<CortexDesktopWindowState>
  setDesktopOverlayEnabled: (enabled: boolean) => Promise<CortexDesktopWindowState>
  toggleDesktopWindowVisibility: () => Promise<CortexDesktopWindowState>
  getWorkspaceSnapshot: (workspace: WorkspaceContext) => Promise<WorkspaceSnapshot>
  getDashboardSnapshot: () => Promise<CortexDashboardSnapshot>
  getDatabaseStatus: () => Promise<CortexDatabaseStatus>
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
  getWorkflowAssetContent: (
    payload: CortexWorkflowAssetContentRequest,
  ) => Promise<CortexWorkflowAssetContentResult>
  runWorkspaceCommand: (
    workspace: WorkspaceContext,
    commandId: string,
    context?: string,
  ) => Promise<CortexCommandResult>
  runCommand: (commandId: string, context?: string) => Promise<CortexCommandResult>
  prepareVoiceAction: (
    payload: CortexVoiceActionRequest,
  ) => Promise<CortexVoiceActionPrepared>
  confirmVoiceAction: (
    payload: CortexVoiceActionConfirmation,
  ) => Promise<CortexVoiceActionResult>
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
  latency: null,
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
  'get_workspace_snapshot',
  'get_dashboard_snapshot',
  'get_route_context',
  'get_database_status',
  'list_database_entities',
  'search_database_entities',
  'get_focused_record',
  'get_system_metrics',
  'list_agents',
  'list_memories',
  'list_workflows',
  'list_schedules',
  'list_recent_logs',
  'get_ui_context',
] as const

export const BUSINESS_READ_TOOL_NAMES = [
  'get_workspace_snapshot',
  'get_dashboard_snapshot',
  'get_route_context',
  'get_database_status',
  'list_database_entities',
  'search_database_entities',
  'get_focused_record',
  'get_ui_context',
] as const

export const CORTEX_UI_ACTION_TOOL_NAMES = [
  'navigate_ui',
  'focus_record',
  'focus_agent',
  'focus_memory',
  'focus_workflow',
  'focus_schedule',
  'focus_system_metric',
  'focus_marketing_metric',
] as const

export const BUSINESS_UI_ACTION_TOOL_NAMES = ['navigate_ui', 'focus_record'] as const

export const CORTEX_EXECUTION_TOOL_NAMES = [
  'prepare_voice_action',
  'confirm_voice_action',
  'run_command',
] as const

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
    realtimeModel: 'gpt-realtime-1.5',
    textModel: 'gpt-4.1',
    transcriptionProvider: 'openai',
    transcriptionModel: 'gpt-4o-mini-transcribe',
    speechProvider: 'elevenlabs',
    speechModel: 'eleven_flash_v2_5',
    voice: 'elevenlabs-custom',
    voiceSettings: {
      stability: 0.42,
      similarityBoost: 0.78,
      style: 0.3,
      speed: 1.03,
      useSpeakerBoost: true,
    },
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
    realtimeModel: 'gpt-realtime-1.5',
    textModel: 'gpt-4.1-mini',
    transcriptionProvider: 'openai',
    transcriptionModel: 'gpt-4o-mini-transcribe',
    speechProvider: 'elevenlabs',
    speechModel: 'eleven_flash_v2_5',
    voice: 'elevenlabs-custom',
    voiceSettings: {
      stability: 0.42,
      similarityBoost: 0.78,
      style: 0.28,
      speed: 1.04,
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
    realtimeModel: 'gpt-realtime-1.5',
    textModel: 'gpt-4.1-mini',
    transcriptionProvider: 'openai',
    transcriptionModel: 'gpt-4o-mini-transcribe',
    speechProvider: 'elevenlabs',
    speechModel: 'eleven_flash_v2_5',
    voice: 'elevenlabs-custom',
    voiceSettings: {
      stability: 0.46,
      similarityBoost: 0.72,
      style: 0.12,
      speed: 1.08,
      useSpeakerBoost: false,
    },
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
    realtimeModel: 'gpt-realtime-1.5',
    textModel: 'gpt-4.1-mini',
    transcriptionProvider: 'openai',
    transcriptionModel: 'gpt-4o-mini-transcribe',
    speechProvider: 'elevenlabs',
    speechModel: 'eleven_flash_v2_5',
    voice: 'elevenlabs-custom',
    voiceSettings: {
      stability: 0.48,
      similarityBoost: 0.72,
      style: 0.08,
      speed: 1.06,
      useSpeakerBoost: false,
    },
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
    realtimeModel: 'gpt-realtime-1.5',
    textModel: 'gpt-4.1-mini',
    transcriptionProvider: 'openai',
    transcriptionModel: 'gpt-4o-mini-transcribe',
    speechProvider: 'elevenlabs',
    speechModel: 'eleven_flash_v2_5',
    voice: 'elevenlabs-custom',
    silentOutput: true,
    navigationPolicy: 'ask_then_move',
    toolPreference: 'ui_first',
    preferredToolGroups: ['ui_action', 'read', 'execution'],
  },
})

const buildLegacyRealtimeModeProfiles = (): Record<
  CortexRealtimeMode,
  CortexRealtimeModeProfile
> => ({
  premium_voice: {
    id: 'premium_voice',
    ariaLabel: 'Premium voice mode',
    color: 'cyan',
    glyph: 'pulse',
    runtime: 'gpt_realtime_webrtc',
    realtimeModel: 'gpt-realtime-1.5',
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
    runtime: 'gpt_realtime_webrtc',
    realtimeModel: 'gpt-realtime-1.5',
    textModel: 'gpt-4.1-mini',
    transcriptionProvider: 'openai',
    transcriptionModel: 'gpt-4o-mini-transcribe',
    speechProvider: 'openai',
    speechModel: 'gpt-4o-mini-tts',
    voice: 'cedar',
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
    runtime: 'gpt_realtime_webrtc',
    realtimeModel: 'gpt-realtime-1.5',
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
    runtime: 'gpt_realtime_webrtc',
    realtimeModel: 'gpt-realtime-1.5',
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
    runtime: 'gpt_realtime_webrtc',
    realtimeModel: 'gpt-realtime-1.5',
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

export const DEFAULT_REALTIME_MODE: CortexRealtimeMode = 'neural_voice'

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

const WORKFLOW_PREVIEW_TONES: Record<AccentTone | 'blue', { stroke: string; fill: string; sub: string }> = {
  cyan: { stroke: '#67f4ff', fill: '#10283a', sub: '#9fd5e5' },
  amber: { stroke: '#ffc86f', fill: '#352515', sub: '#ffd79e' },
  green: { stroke: '#8bff8a', fill: '#15301f', sub: '#b4f7b3' },
  magenta: { stroke: '#dd6fff', fill: '#2d193f', sub: '#f4b8ff' },
  red: { stroke: '#ff7c8d', fill: '#371821', sub: '#ffc7d0' },
  blue: { stroke: '#7aa7ff', fill: '#132542', sub: '#b7caff' },
}

const WORKFLOW_PREVIEW_SEQUENCE: Array<AccentTone | 'blue'> = [
  'cyan',
  'magenta',
  'amber',
  'green',
  'blue',
]

const escapeWorkflowPreviewText = (value: string) =>
  value.replace(/[&<>"]/g, (character) => {
    if (character === '&') return '&amp;'
    if (character === '<') return '&lt;'
    if (character === '>') return '&gt;'
    return '&quot;'
  })

const wrapWorkflowPreviewText = (value: string, maxChars: number, maxLines: number) => {
  const words = value.replace(/[\u2013\u2014]/g, '-').split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''

  for (const word of words) {
    const nextLine = line ? `${line} ${word}` : word
    if (nextLine.length > maxChars && line) {
      lines.push(line)
      line = word
      if (lines.length === maxLines - 1) {
        break
      }
    } else {
      line = nextLine
    }
  }

  if (line && lines.length < maxLines) {
    lines.push(line)
  }

  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) {
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/\.\.\.$/, '')}...`
  }

  return lines
}

const buildWorkflowPreviewNode = ({
  x,
  y,
  width,
  height,
  tone,
  label,
  detail,
  pill = false,
}: {
  x: number
  y: number
  width: number
  height: number
  tone: AccentTone | 'blue'
  label: string
  detail?: string
  pill?: boolean
}) => {
  const palette = WORKFLOW_PREVIEW_TONES[tone]
  const titleLines = wrapWorkflowPreviewText(label, 42, 2)
  const detailLines = detail ? wrapWorkflowPreviewText(detail, 58, 2) : []
  const titleStart = y + (detailLines.length ? 30 : 40) - (titleLines.length - 1) * 11
  const detailStart = titleStart + titleLines.length * 24 + 6
  const titleSvg = titleLines
    .map(
      (line, index) =>
        `<text x="${x + width / 2}" y="${titleStart + index * 24}" fill="#edf8ff" font-family="Arial, sans-serif" font-size="22" font-weight="700" text-anchor="middle">${escapeWorkflowPreviewText(line)}</text>`,
    )
    .join('')
  const detailSvg = detailLines
    .map(
      (line, index) =>
        `<text x="${x + width / 2}" y="${detailStart + index * 20}" fill="${palette.sub}" font-family="Arial, sans-serif" font-size="15" text-anchor="middle">${escapeWorkflowPreviewText(line)}</text>`,
    )
    .join('')

  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${pill ? 38 : 18}" fill="${palette.fill}" fill-opacity="0.9" stroke="${palette.stroke}" stroke-width="3"/>${titleSvg}${detailSvg}`
}

const buildWorkflowPreviewDataUrl = ({
  title,
  description,
  toolsUsed,
  accent,
}: {
  title: string
  description: string
  toolsUsed: string[]
  accent: AccentTone
}) => {
  const visibleTools = toolsUsed.slice(0, 6)
  const hiddenToolCount = toolsUsed.length - visibleTools.length
  const steps = [
    { label: title, detail: description, tone: accent, pill: true },
    ...visibleTools.map((tool, index) => ({
      label: tool,
      detail: index === 0 ? 'Agent handoff and workflow step' : 'Provider action inside the run',
      tone: WORKFLOW_PREVIEW_SEQUENCE[index % WORKFLOW_PREVIEW_SEQUENCE.length],
      pill: false,
    })),
    ...(hiddenToolCount > 0
      ? [
          {
            label: `${hiddenToolCount} more tools`,
            detail: 'Additional providers remain attached to this workflow',
            tone: 'blue' as const,
            pill: false,
          },
        ]
      : []),
    {
      label: 'Reviewable Output',
      detail: 'Agent-ready result, source files, and operator review path',
      tone: 'green' as const,
      pill: true,
    },
  ]
  const width = 1280
  const nodeWidth = 760
  const nodeHeight = 108
  const gap = 42
  const top = 48
  const x = (width - nodeWidth) / 2
  const height = top * 2 + steps.length * nodeHeight + (steps.length - 1) * gap
  const defs = WORKFLOW_PREVIEW_SEQUENCE.concat('blue')
    .map((tone) => {
      const palette = WORKFLOW_PREVIEW_TONES[tone]
      return `<marker id="arrow-${tone}" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="${palette.stroke}"/></marker>`
    })
    .join('')
  const body = steps
    .map((step, index) => {
      const y = top + index * (nodeHeight + gap)
      const palette = WORKFLOW_PREVIEW_TONES[step.tone]
      const connector =
        index === steps.length - 1
          ? ''
          : `<path d="M${width / 2} ${y + nodeHeight + 8} C ${width / 2} ${y + nodeHeight + 36}, ${width / 2} ${y + nodeHeight + gap - 36}, ${width / 2} ${y + nodeHeight + gap - 8}" stroke="${palette.stroke}" stroke-width="4" fill="none" stroke-linecap="round" marker-end="url(#arrow-${step.tone})"/>`

      return `${buildWorkflowPreviewNode({ x, y, width: nodeWidth, height: nodeHeight, ...step })}${connector}`
    })
    .join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><defs>${defs}</defs>${body}</svg>`

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
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
        previewUrl: buildWorkflowPreviewDataUrl({
          title: 'Drop Request To Live Drop',
          description:
            'Converts a user or host drop request into an approved AR drop with asset, registration threshold, time-slot vote, Discord announcement, and completion evidence.',
          toolsUsed: ['Supabase', 'Discord webhook', 'Drop scheduler', 'Host approval'],
          accent: 'cyan',
        }),
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
        previewUrl: buildWorkflowPreviewDataUrl({
          title: 'Mint Job Triage',
          description:
            'Monitors support shop purchases, Stripe sessions, wallet delivery, retry counts, transaction hashes, and failed mints before they become support issues.',
          toolsUsed: ['Stripe', 'Crossmint', 'Supabase', 'Wallet lookup'],
          accent: 'amber',
        }),
      },
      zipAsset: null,
      updatedAt: '2026-04-27T07:58:00.000Z',
      accent: 'amber',
    },
    {
      id: 'workflow-restaurant-food-edit-variations',
      title: 'Restaurant Food Edit Variations',
      description:
        'Generates five approved restaurant product-shot variations from the Food Edits Google Drive folder while preserving the original plated dish, then uploads accepted results into the Generated Edits subfolder for review.',
      toolsUsed: [
        'Google Drive',
        'Google Workspace OAuth',
        'Codex gpt-image-2 edit mode',
        'Vision verification',
        'Cron automation',
      ],
      architecture:
        'A daily 9PM cron run selects the next source image from the Food Edits Google Drive folder, downloads it locally, creates a preservation-first hero-overhead-daylight baseline plus four additional shot profiles (three-quarter-cinematic, close-detail-appetite, tableside-context-wide, and low-angle-editorial), verifies each candidate against the original plate and plating layout with a score threshold of 85, and uploads only approved variants into the Generated Edits subfolder while posting status back to the Cortex thread.',
      diagramSource: {
        path: 'fixtures/workflow-assets/workflow-restaurant-food-edit-variations/restaurant-food-edit-variations.excalidraw',
        fileName: 'restaurant-food-edit-variations.excalidraw',
        mimeType: 'application/vnd.excalidraw+json',
        sizeBytes: 3252,
        uploadedAt: '2026-04-27T23:20:00.000Z',
      },
      diagramPreview: {
        path: 'fixtures/workflow-assets/workflow-restaurant-food-edit-variations/restaurant-food-edit-variations-preview.svg',
        fileName: 'restaurant-food-edit-variations-preview.svg',
        mimeType: 'image/svg+xml',
        sizeBytes: 3613,
        uploadedAt: '2026-04-27T23:20:00.000Z',
        previewUrl: buildWorkflowPreviewDataUrl({
          title: 'Restaurant Food Edit Variations',
          description:
            'Generates five approved restaurant product-shot variations from the Food Edits Google Drive folder while preserving the original plated dish, then uploads accepted results into the Generated Edits subfolder for review.',
          toolsUsed: [
            'Google Drive',
            'Google Workspace OAuth',
            'Codex gpt-image-2 edit mode',
            'Vision verification',
            'Cron automation',
          ],
          accent: 'green',
        }),
      },
      zipAsset: null,
      updatedAt: '2026-04-27T23:20:00.000Z',
      accent: 'green',
    },
    {
      id: 'workflow-hyperframes-motion-pipeline',
      title: 'Hyperframes Motion Video Pipeline',
      description:
        'Hyperframes now includes a concrete Retatrutide benefits explainer structure inside the peptide lane, while still covering Scavenjer, script-based content repurposing, and Business + AI Consulting motion workflows.',
      toolsUsed: [
        'Creative brief or source script',
        'Storyboard / scene map',
        'HTML compositions',
        'GSAP timelines',
        'Animated data graphics',
        'Voiceover / narration pass',
        'Compliance review',
        'Hyperframes CLI',
        'FFmpeg renderer',
      ],
      architecture:
        'Retatrutide is now a fully-structured 32-second explainer inside the Hyperframes workflow, with hard visual changes every 3–5 seconds: Scene 1 hook uses a dark lab void, orbiting molecule core, particle burst, and title shockwave; Scene 2 builds a triple-agonist mechanism map across GLP-1, GIP, and glucagon lanes; Scene 3 hits appetite control with a satiety ring, craving-meter drop, and collapsing meal cards; Scene 4 pushes energy expenditure with a thermogenic heat map, rising graph, and body-outline scan; Scene 5 shifts into glucose and biomarker support with stabilizing curves and metric cards; Scene 6 reframes body composition with silhouette morphs and protocol-dependent language; Scene 7 handles supervision, sourcing, and dosage caveats with a compliance card lock; Scene 8 closes on a premium educational CTA. The ZIP bundle ships the actual storyboard, voiceover outline, graphics checklist, and JSON scene spec so the eventual Hyperframes build has plenty of animations, graphics, and detail instead of turning into a lazy wellness slideshow.',
      diagramSource: {
        path: 'fixtures/workflow-assets/workflow-hyperframes-motion-pipeline/hyperframes-motion-pipeline.excalidraw',
        fileName: 'hyperframes-motion-pipeline.excalidraw',
        mimeType: 'application/vnd.excalidraw+json',
        sizeBytes: 20970,
        uploadedAt: '2026-05-03T07:36:24.000Z',
      },
      diagramPreview: {
        path: 'fixtures/workflow-assets/workflow-hyperframes-motion-pipeline/hyperframes-motion-pipeline-preview.svg',
        fileName: 'hyperframes-motion-pipeline-preview.svg',
        mimeType: 'image/svg+xml',
        sizeBytes: 8976,
        uploadedAt: '2026-05-03T07:36:24.000Z',
        previewUrl: buildWorkflowPreviewDataUrl({
          title: 'Hyperframes Motion Video Pipeline',
          description:
            'Hyperframes now includes a concrete Retatrutide benefits explainer structure inside the peptide lane, while still covering Scavenjer, script-based content repurposing, and Business + AI Consulting motion workflows.',
          toolsUsed: [
            'Creative brief or source script',
            'Storyboard / scene map',
            'HTML compositions',
            'GSAP timelines',
            'Animated data graphics',
            'Voiceover / narration pass',
            'Compliance review',
            'Hyperframes CLI',
            'FFmpeg renderer',
          ],
          accent: 'magenta',
        }),
      },
      zipAsset: {
        path: 'fixtures/workflow-assets/workflow-hyperframes-motion-pipeline/hyperframes-retatrutide-structure.zip',
        fileName: 'hyperframes-retatrutide-structure.zip',
        mimeType: 'application/zip',
        sizeBytes: 4343,
        uploadedAt: '2026-05-03T07:36:24.000Z',
      },
      updatedAt: '2026-05-03T07:36:24.000Z',
      accent: 'magenta',
    },
    {
      id: 'workflow-higgsfield-mcp-device-auth',
      title: 'Higgsfield MCP Device-Auth Setup',
      description:
        "Connects Cortex to Higgsfield's remote MCP through device-flow auth, persists a bearer for native HTTP MCP calls, then verifies live workspace, model, media, and generation-history tools while capturing the current blocker: the account is authenticated but sitting at 0 credits on the free plan.",
      toolsUsed: [
        'Higgsfield MCP',
        'Device-flow OAuth',
        'Native HTTP MCP',
        'HIGGSFIELD_MCP_TOKEN',
        'Workspace and generation probes',
      ],
      architecture:
        "Higgsfield's protected-resource metadata points Hermes-class clients to fnf-device-auth.higgsfield.ai instead of a clean standard OAuth discovery doc, so the workflow starts by requesting a device code from /authorize, sending the operator to the Higgsfield verification URI, polling /token until approval lands, and writing the returned bearer into Cortex as HIGGSFIELD_MCP_TOKEN. Cortex then calls the remote MCP endpoint at https://mcp.higgsfield.ai/mcp with an Authorization header through native HTTP MCP wiring and confirms usability by hitting balance, workspace, model, preset, history, and media tools. Current verified context: the connection is live as zaidekthecreator@gmail.com with a private workspace present, but the account is on the free plan with 0 credits, so browsing and management actions work while fresh paid generations remain blocked until credits are added; persistent local config wiring should also be cleaned up because the live connection is working even though the expected Cortex config/.env entries were not obvious on disk.",
      diagramSource: {
        path: 'fixtures/workflow-assets/workflow-higgsfield-mcp-device-auth/higgsfield-mcp-device-auth.excalidraw',
        fileName: 'higgsfield-mcp-device-auth.excalidraw',
        mimeType: 'application/vnd.excalidraw+json',
        sizeBytes: 11341,
        uploadedAt: '2026-04-29T05:42:11.000Z',
      },
      diagramPreview: {
        path: 'fixtures/workflow-assets/workflow-higgsfield-mcp-device-auth/higgsfield-mcp-device-auth-preview.svg',
        fileName: 'higgsfield-mcp-device-auth-preview.svg',
        mimeType: 'image/svg+xml',
        sizeBytes: 5181,
        uploadedAt: '2026-04-29T05:42:11.000Z',
        previewUrl: buildWorkflowPreviewDataUrl({
          title: 'Higgsfield MCP Device-Auth Setup',
          description:
            "Connects Cortex to Higgsfield's remote MCP through device-flow auth, persists a bearer for native HTTP MCP calls, then verifies live workspace, model, media, and generation-history tools while capturing the current blocker: the account is authenticated but sitting at 0 credits on the free plan.",
          toolsUsed: [
            'Higgsfield MCP',
            'Device-flow OAuth',
            'Native HTTP MCP',
            'HIGGSFIELD_MCP_TOKEN',
            'Workspace and generation probes',
          ],
          accent: 'magenta',
        }),
      },
      zipAsset: null,
      updatedAt: '2026-04-29T05:42:11.000Z',
      accent: 'magenta',
    }
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
  usageIndicators: [
    {
      id: 'elevenlabs',
      label: 'ElevenLabs',
      detail: '87,915 / 90,000 characters remaining this cycle.',
      symbol: 'E',
      value: 98,
      tone: 'magenta',
      source: 'fallback',
      refreshedAt: '2026-04-27T08:30:00.000Z',
    },
    {
      id: 'codex_session',
      label: 'Codex Session',
      detail: '90% remaining in the current Codex window.',
      symbol: 'S',
      value: 90,
      tone: 'cyan',
      source: 'fallback',
      refreshedAt: '2026-04-27T08:30:00.000Z',
    },
    {
      id: 'codex_weekly',
      label: 'Codex Weekly',
      detail: '95% remaining in the weekly Codex window.',
      symbol: 'W',
      value: 95,
      tone: 'green',
      source: 'fallback',
      refreshedAt: '2026-04-27T08:30:00.000Z',
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
