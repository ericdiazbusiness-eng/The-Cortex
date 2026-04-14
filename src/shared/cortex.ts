export type AccentTone = 'cyan' | 'green' | 'magenta' | 'amber' | 'red'
export type AgentStatus = 'active' | 'idle' | 'warning' | 'offline'
export type JobStatus = 'scheduled' | 'running' | 'paused' | 'drift' | 'failed'
export type LogSeverity = 'info' | 'success' | 'warning' | 'error'
export type MemoryPriority = 'low' | 'medium' | 'high'
export type OutreachChannel = 'social' | 'email' | 'dm' | 'community' | 'partnership'
export type OutreachStatus = 'planned' | 'drafting' | 'scheduled' | 'active' | 'blocked' | 'complete'
export type CortexUiMode = 'scavenjer' | 'business'
export type CortexRoute = '/' | '/agents' | '/memories' | '/schedules' | '/system'
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
  uiMode: CortexUiMode
  details: Record<string, CortexViewContextValue>
}

export type CortexUiFocus = {
  route: CortexRoute | null
  agentId: string | null
  memoryId: string | null
  memoryAgentId: string | null
  scheduleId: string | null
  systemMetricKey: CortexSystemMetricKey | null
  marketingMetricId: string | null
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

export type CortexAgent = {
  id: string
  name: string
  role: string
  description: string
  status: AgentStatus
  sync: number
  load: number
  commandIds: string[]
  capabilities: string[]
  memoryBank: number
  lastActiveAt: string
  accent: AccentTone
  avatar?: string
}

export type CortexMemory = {
  id: string
  agentId: string
  title: string
  detail: string
  timestamp: string
  priority: MemoryPriority
  category: string
  keywords: string[]
  pinned: boolean
}

export type CortexJob = {
  id: string
  name: string
  description: string
  ownerAgentId: string
  schedule: string
  status: JobStatus
  driftMinutes: number
  lastRunAt: string
  nextRunAt: string
  commandId: string
  accent: AccentTone
}

export type CortexLogEvent = {
  id: string
  timestamp: string
  channel: string
  severity: LogSeverity
  message: string
  agentId?: string
  accent: AccentTone
}

export type CortexCommand = {
  id: string
  label: string
  description: string
  scope: 'system' | 'agent' | 'memory' | 'schedule' | 'marketing'
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

export type CortexMarketingMetric = {
  id: string
  label: string
  value: string
  delta: string
  accent: AccentTone
}

export type CortexCampaign = {
  id: string
  name: string
  objective: string
  status: OutreachStatus
  ownerAgentId: string
  channels: OutreachChannel[]
  target: string
  dueAt: string
  accent: AccentTone
}

export type CortexOutreachQueueItem = {
  id: string
  channel: OutreachChannel
  title: string
  audience: string
  status: OutreachStatus
  ownerAgentId: string
  volume: string
  nextAction: string
  accent: AccentTone
}

export type CortexDashboardSnapshot = {
  agents: CortexAgent[]
  memories: CortexMemory[]
  jobs: CortexJob[]
  logs: CortexLogEvent[]
  commands: CortexCommand[]
  system: CortexSystemSnapshot
  marketingMetrics: CortexMarketingMetric[]
  campaigns: CortexCampaign[]
  outreachQueue: CortexOutreachQueueItem[]
}

export type CortexStreamEvent =
  | { kind: 'systemPulse'; snapshot: CortexSystemSnapshot }
  | { kind: 'log'; log: CortexLogEvent }
  | { kind: 'commandResult'; result: CortexCommandResult }

export type CortexBridge = {
  getDashboardSnapshot: () => Promise<CortexDashboardSnapshot>
  listAgents: () => Promise<CortexAgent[]>
  listMemories: () => Promise<CortexMemory[]>
  listSchedules: () => Promise<CortexJob[]>
  listLogs: () => Promise<CortexLogEvent[]>
  runCommand: (commandId: string, context?: string) => Promise<CortexCommandResult>
  createRealtimeCall: (
    offerSdp: string,
    payload: CortexRealtimeSessionRequest,
  ) => Promise<string>
  transcribeAudio: (payload: CortexAudioTranscriptionRequest) => Promise<string>
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
  'list_schedules',
  'list_recent_logs',
  'get_ui_context',
] as const

export const CORTEX_UI_ACTION_TOOL_NAMES = [
  'navigate_ui',
  'focus_agent',
  'focus_memory',
  'focus_schedule',
  'focus_system_metric',
  'focus_marketing_metric',
] as const

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
    transcriptionModel: 'scribe_v2',
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
    transcriptionModel: 'scribe_v2',
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
  route: null,
  agentId: null,
  memoryId: null,
  memoryAgentId: null,
  scheduleId: null,
  systemMetricKey: null,
  marketingMetricId: null,
  revision: 0,
}

export const DEFAULT_FALLBACK_DATA: CortexDashboardSnapshot = {
  agents: [
    {
      id: 'zib00',
      name: 'ZiB00',
      role: 'Scavenjer ops architect',
      description:
        'Owns system structure, prioritization, dashboard design, and cross-agent execution standards for Scavenjer.',
      status: 'active',
      sync: 99.2,
      load: 76,
      commandIds: ['refresh-overview', 'run-ops-sync'],
      capabilities: ['Ops architecture', 'Priority enforcement', 'Execution reviews'],
      memoryBank: 34,
      lastActiveAt: '2026-03-27T12:10:00.000Z',
      accent: 'cyan',
    },
    {
      id: 'zib001',
      name: 'ZiB001',
      role: 'Marketing orchestration lead',
      description:
        'Runs Scavenjer marketing operations across posts, outreach, email, DMs, and campaign execution.',
      status: 'active',
      sync: 97.1,
      load: 71,
      commandIds: ['publish-marketing-brief', 'run-outreach-sync'],
      capabilities: ['Campaign execution', 'Outreach sequencing', 'Channel coordination'],
      memoryBank: 29,
      lastActiveAt: '2026-03-27T12:06:00.000Z',
      accent: 'magenta',
    },
    {
      id: 'zib002',
      name: 'ZiB002',
      role: 'Drop deployment coordinator',
      description:
        'Tracks Game Areas, manual drop placement, business QR handling, and pending deployment steps across Marbleverse.',
      status: 'active',
      sync: 96.4,
      load: 68,
      commandIds: ['sync-drop-queue'],
      capabilities: ['Drop intake', 'Area status', 'Manual execution queue'],
      memoryBank: 22,
      lastActiveAt: '2026-03-27T12:02:00.000Z',
      accent: 'green',
    },
    {
      id: 'zib003',
      name: 'ZiB003',
      role: 'Runtime and token monitor',
      description:
        'Watches automation cost, token usage, cron reliability, and execution drift so agents stay economically useful.',
      status: 'warning',
      sync: 91.8,
      load: 63,
      commandIds: ['review-runtime-usage', 'audit-cron-health'],
      capabilities: ['Usage tracking', 'Cron health', 'Cost visibility'],
      memoryBank: 15,
      lastActiveAt: '2026-03-27T11:54:00.000Z',
      accent: 'amber',
    },
  ],
  memories: [
    {
      id: 'memory-1',
      agentId: 'zib00',
      title: 'Current-state wedge clarified',
      detail:
        'Scavenjer is currently operating through the website plus manual Marbleverse drops, not a full autonomous ecosystem. The dashboard should optimize current operations first.',
      timestamp: '2026-03-27T12:09:00.000Z',
      priority: 'high',
      category: 'strategy',
      keywords: ['current-state', 'wedge', 'dashboard'],
      pinned: true,
    },
    {
      id: 'memory-2',
      agentId: 'drop-ops',
      title: 'Manual drop pipeline remains the choke point',
      detail:
        'Drops still require selecting a Game Area in Marbleverse and handling execution manually, so operations need a visible queue and status model.',
      timestamp: '2026-03-27T12:04:00.000Z',
      priority: 'high',
      category: 'drop-ops',
      keywords: ['marbleverse', 'manual', 'queue'],
      pinned: true,
    },
    {
      id: 'memory-3',
      agentId: 'zib001',
      title: 'ZiB001 needs channel-level accountability',
      detail:
        'Marketing cannot live as a vague agent concept. Posts, emails, DMs, and outreach targets need visible queues and measurable performance.',
      timestamp: '2026-03-27T12:07:00.000Z',
      priority: 'high',
      category: 'marketing',
      keywords: ['zib001', 'outreach', 'metrics'],
      pinned: true,
    },
    {
      id: 'memory-4',
      agentId: 'ledger-watch',
      title: 'Runtime economics must stay visible',
      detail:
        'If autonomous agents are going to help Scavenjer, token/runtime cost and cron reliability need to be first-class operational metrics, not hidden system trivia.',
      timestamp: '2026-03-27T11:56:00.000Z',
      priority: 'medium',
      category: 'runtime',
      keywords: ['tokens', 'runtime', 'cron'],
      pinned: false,
    },
  ],
  jobs: [
    {
      id: 'drop-queue-review',
      name: 'Drop queue review',
      description: 'Checks requested drops, Game Area readiness, and which manual deployment steps are blocking release.',
      ownerAgentId: 'drop-ops',
      schedule: 'Every morning at 9:00 AM',
      status: 'scheduled',
      driftMinutes: 0,
      lastRunAt: '2026-03-27T12:00:00.000Z',
      nextRunAt: '2026-03-28T14:00:00.000Z',
      commandId: 'sync-drop-queue',
      accent: 'green',
    },
    {
      id: 'marketing-sync',
      name: 'Marketing execution sync',
      description: 'Reviews campaign backlog, ZiB001 output, pending approvals, and channels that need content or outreach this week.',
      ownerAgentId: 'zib001',
      schedule: 'Weekdays at 11:00 AM',
      status: 'running',
      driftMinutes: 1,
      lastRunAt: '2026-03-27T16:00:00.000Z',
      nextRunAt: '2026-03-28T16:00:00.000Z',
      commandId: 'run-outreach-sync',
      accent: 'magenta',
    },
    {
      id: 'runtime-audit',
      name: 'Runtime and cron audit',
      description: 'Measures automation cost, failed tasks, and cron drift so Scavenjer can scale agents without waste.',
      ownerAgentId: 'ledger-watch',
      schedule: 'Hourly',
      status: 'drift',
      driftMinutes: 7,
      lastRunAt: '2026-03-27T11:00:00.000Z',
      nextRunAt: '2026-03-27T12:00:00.000Z',
      commandId: 'audit-cron-health',
      accent: 'amber',
    },
  ],
  logs: [
    {
      id: 'log-1',
      timestamp: '2026-03-27T12:08:30.000Z',
      channel: 'overview',
      severity: 'info',
      message: 'Scavenjer ops snapshot refreshed with current-state website, drop, and marketing assumptions.',
      accent: 'cyan',
    },
    {
      id: 'log-2',
      timestamp: '2026-03-27T12:05:14.000Z',
      channel: 'drop-ops',
      severity: 'warning',
      message: 'Manual Marbleverse deployment is still the main execution bottleneck for drop throughput.',
      agentId: 'drop-ops',
      accent: 'amber',
    },
    {
      id: 'log-3',
      timestamp: '2026-03-27T12:06:52.000Z',
      channel: 'marketing',
      severity: 'success',
      message: 'ZiB001 marketing lane prepared for posts, email, DMs, and outreach tracking.',
      agentId: 'zib001',
      accent: 'green',
    },
    {
      id: 'log-4',
      timestamp: '2026-03-27T11:59:27.000Z',
      channel: 'runtime',
      severity: 'info',
      message: 'Token usage and cron reliability marked as first-class operations metrics for autonomous agent deployment.',
      agentId: 'ledger-watch',
      accent: 'magenta',
    },
  ],
  commands: [
    {
      id: 'refresh-overview',
      label: 'Refresh Overview',
      description: 'Refreshes the core Scavenjer operating snapshot.',
      scope: 'system',
      tone: 'primary',
      command: 'node',
      args: ['scripts/cortex-command.mjs', 'refresh-overview'],
      cwd: '.',
    },
    {
      id: 'run-ops-sync',
      label: 'Run Ops Sync',
      description: 'Runs the main Scavenjer operations sync for ZiB00.',
      scope: 'system',
      tone: 'primary',
      command: 'node',
      args: ['scripts/cortex-command.mjs', 'run-ops-sync'],
      cwd: '.',
    },
    {
      id: 'sync-drop-queue',
      label: 'Sync Drop Queue',
      description: 'Checks requested drops, blockers, and Game Area readiness.',
      scope: 'schedule',
      tone: 'secondary',
      command: 'node',
      args: ['scripts/cortex-command.mjs', 'sync-drop-queue'],
      cwd: '.',
    },
    {
      id: 'publish-marketing-brief',
      label: 'Marketing Brief',
      description: 'Generates or refreshes a ZiB001 marketing brief.',
      scope: 'marketing',
      tone: 'secondary',
      command: 'node',
      args: ['scripts/cortex-command.mjs', 'publish-marketing-brief'],
      cwd: '.',
    },
    {
      id: 'run-outreach-sync',
      label: 'Outreach Sync',
      description: 'Runs outreach tracking across posts, emails, DMs, and partner touchpoints.',
      scope: 'marketing',
      tone: 'primary',
      command: 'node',
      args: ['scripts/cortex-command.mjs', 'run-outreach-sync'],
      cwd: '.',
    },
    {
      id: 'review-runtime-usage',
      label: 'Review Runtime',
      description: 'Reviews token usage and automation cost pressure.',
      scope: 'system',
      tone: 'secondary',
      command: 'node',
      args: ['scripts/cortex-command.mjs', 'review-runtime-usage'],
      cwd: '.',
    },
    {
      id: 'audit-cron-health',
      label: 'Audit Cron Health',
      description: 'Audits cron drift, task failures, and execution reliability.',
      scope: 'schedule',
      tone: 'danger',
      command: 'node',
      args: ['scripts/cortex-command.mjs', 'audit-cron-health'],
      cwd: '.',
    },
  ],
  marketingMetrics: [
    {
      id: 'metric-1',
      label: 'Planned outreach this week',
      value: '42 touches',
      delta: '+12 vs last week',
      accent: 'magenta',
    },
    {
      id: 'metric-2',
      label: 'Active campaigns',
      value: '4 campaigns',
      delta: '2 need approval',
      accent: 'cyan',
    },
    {
      id: 'metric-3',
      label: 'Email open rate',
      value: '38%',
      delta: '+6%',
      accent: 'green',
    },
    {
      id: 'metric-4',
      label: 'DM reply rate',
      value: '21%',
      delta: '+4%',
      accent: 'amber',
    },
  ],
  campaigns: [
    {
      id: 'campaign-1',
      name: 'Website traction push',
      objective: 'Drive Scavenjer.com traffic and get more visitors into account creation and Eko exploration.',
      status: 'active',
      ownerAgentId: 'zib001',
      channels: ['social', 'community', 'email'],
      target: 'New traffic + account signups',
      dueAt: '2026-03-31T23:00:00.000Z',
      accent: 'magenta',
    },
    {
      id: 'campaign-2',
      name: 'Business drop awareness',
      objective: 'Support physical business activations and make QR collectible participation easier to understand.',
      status: 'drafting',
      ownerAgentId: 'zib001',
      channels: ['social', 'community', 'partnership'],
      target: 'Local participation lift',
      dueAt: '2026-04-03T18:00:00.000Z',
      accent: 'green',
    },
    {
      id: 'campaign-3',
      name: 'Partner and creator outreach',
      objective: 'Build a pipeline of aligned collaborators, creators, and potential hosts.',
      status: 'planned',
      ownerAgentId: 'zib001',
      channels: ['dm', 'email', 'partnership'],
      target: '8 warm conversations',
      dueAt: '2026-04-05T20:00:00.000Z',
      accent: 'amber',
    },
  ],
  outreachQueue: [
    {
      id: 'outreach-1',
      channel: 'social',
      title: 'Weekly post sequence',
      audience: 'Current followers + cold discovery',
      status: 'scheduled',
      ownerAgentId: 'zib001',
      volume: '5 posts queued',
      nextAction: 'Finalize captions and CTA alignment',
      accent: 'magenta',
    },
    {
      id: 'outreach-2',
      channel: 'email',
      title: 'Interest reactivation email',
      audience: 'Warm signups and prior interest list',
      status: 'drafting',
      ownerAgentId: 'zib001',
      volume: '1 sequence / 3 emails',
      nextAction: 'Approve copy and audience segments',
      accent: 'cyan',
    },
    {
      id: 'outreach-3',
      channel: 'dm',
      title: 'Creator outreach wave',
      audience: 'Potential creators, hosts, and collaborators',
      status: 'active',
      ownerAgentId: 'zib001',
      volume: '18 DMs in motion',
      nextAction: 'Follow up on 6 warm replies',
      accent: 'green',
    },
    {
      id: 'outreach-4',
      channel: 'partnership',
      title: 'Business activation follow-up',
      audience: 'Businesses interested in drop participation',
      status: 'blocked',
      ownerAgentId: 'zib001',
      volume: '3 prospects waiting',
      nextAction: 'Need clear one-pager and offer framing',
      accent: 'amber',
    },
  ],
  system: {
    neuralLoad: 74,
    signalCoherence: 89,
    memoryIntegrity: 95,
    throughput: 78,
    activeNodes: 4,
    queueDepth: 11,
    runtimeSeconds: 128540,
    lastUpdated: '2026-03-27T12:08:00.000Z',
  },
}
