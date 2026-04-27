import {
  DEFAULT_REALTIME_STATE,
  getRealtimeModeProfile,
  type CortexBridge,
  type CortexRealtimeDebugEntryInput,
  type CortexRealtimeMode,
  type CortexRealtimeSessionRequest,
  type CortexRealtimeState,
  type CortexRealtimeStatus,
  type CortexRealtimeToolCall,
  type CortexRealtimeToolDefinition,
  type CortexSystemMetricKey,
  type CortexToolVoiceInputItem,
  type CortexViewContext,
  type WorkspaceSnapshot,
} from '@/shared/cortex'
import { getWorkspaceRouteOptions } from '@/lib/ui-mode'

type ToolCallHandler = (call: CortexRealtimeToolCall) => Promise<unknown>

type ControllerDependencies = {
  api: CortexBridge
  getSessionRequest: () => CortexRealtimeSessionRequest
  onStateChange: (state: CortexRealtimeState) => void
  onToolCall: ToolCallHandler
}

type JsonRecord = Record<string, unknown>

type RealtimeEvent = {
  type?: string
  response?: {
    output?: Array<{
      type?: string
      name?: string
      call_id?: string
      arguments?: string
    }>
  }
  session?: {
    id?: string
  }
  error?: {
    message?: string
  }
}

type ControllerResources = {
  audioElement: HTMLAudioElement
  dataChannel: RTCDataChannel
  peerConnection: RTCPeerConnection
  stream: MediaStream
}

type ToolVoiceResources = {
  audioContext: AudioContext
  analyser: AnalyserNode
  audioElement: HTMLAudioElement
  monitorId: number
  processorNode: ScriptProcessorNode | null
  processorSink: GainNode | null
  recorder: MediaRecorder | null
  sourceNode: MediaStreamAudioSourceNode
  stream: MediaStream
  silenceSince: number | null
  startedSpeakingAt: number | null
  interruptionFrames: number
  chunks: Blob[]
  streamingTranscription: boolean
  transcriptionSocket: RealtimeTranscriptionSocket | null
  transcriptionReady: Promise<void> | null
  resolveTranscriptionReady: (() => void) | null
  rejectTranscriptionReady: ((reason?: unknown) => void) | null
  transcriptionStarted: boolean
  sentPreviousText: boolean
  bufferedSpeakingChunks: string[]
}

type RealtimeTranscriptionSocket = {
  addEventListener: WebSocket['addEventListener']
  removeEventListener: WebSocket['removeEventListener']
  send: WebSocket['send']
  close: WebSocket['close']
  readyState: number
}

type ControllerOptions = {
  rtcPeerConnectionFactory?: () => RTCPeerConnection
  getUserMedia?: typeof navigator.mediaDevices.getUserMedia
  createAudioElement?: () => HTMLAudioElement
  audioContextFactory?: () => AudioContext
  mediaRecorderFactory?: (
    stream: MediaStream,
    options?: MediaRecorderOptions,
  ) => MediaRecorder
  realtimeTranscriptionSocketFactory?: (url: string) => RealtimeTranscriptionSocket
}

const isoNow = () => new Date().toISOString()

const toErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unknown realtime voice error.'

const getDefaultUserMedia = async () => {
  if (
    typeof navigator === 'undefined' ||
    !navigator.mediaDevices ||
    typeof navigator.mediaDevices.getUserMedia !== 'function'
  ) {
    throw new Error('Microphone access is unavailable in this environment.')
  }

  return navigator.mediaDevices.getUserMedia({
    audio: buildMicrophoneConstraints(),
  })
}

const buildMicrophoneConstraints = () => ({
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  channelCount: 1,
  sampleRate: 16000,
  sampleSize: 16,
})

const safeParseJson = (value: string | undefined) => {
  if (!value) {
    return {}
  }

  try {
    return JSON.parse(value) as JsonRecord
  } catch {
    return { raw: value }
  }
}

const isFunctionCallOutput = (value: { type?: string }) => value.type === 'function_call'

const createSessionIdentity = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `realtime-${Date.now()}`
}

const TOOL_VOICE_CHECK_INTERVAL_MS = 120
const TOOL_VOICE_SILENCE_MS = 1700
const TOOL_VOICE_THRESHOLD = 7
const TOOL_VOICE_INTERRUPT_THRESHOLD = 26
const TOOL_VOICE_INTERRUPT_FRAMES = 2
const TOOL_VOICE_TIMESLICE_MS = 250
const TOOL_VOICE_MAX_RECORDING_MS = 18000
const ELEVENLABS_REALTIME_TRANSCRIPTIONS_URL = 'wss://api.elevenlabs.io/v1/speech-to-text/realtime'
const REALTIME_TRANSCRIPTION_SAMPLE_RATE = 16000
const REALTIME_TRANSCRIPTION_AUDIO_FORMAT = 'pcm_16000'
const REALTIME_TRANSCRIPTION_PROCESSOR_BUFFER_SIZE = 4096
const REALTIME_TRANSCRIPTION_VAD_SILENCE_SECS = 1.8
const REALTIME_TRANSCRIPTION_VAD_THRESHOLD = 0.34
const REALTIME_TRANSCRIPTION_MIN_SPEECH_MS = 120
const REALTIME_TRANSCRIPTION_MIN_SILENCE_MS = 160
const REALTIME_TRANSCRIPTION_SPEAKING_BUFFER_LIMIT = 6
const SOCKET_READY_STATE_CONNECTING = 0
const SOCKET_READY_STATE_OPEN = 1
const TOOL_VOICE_RECORDER_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
] as const
const DEFAULT_TRANSCRIPTION_MODEL = 'gpt-4o-mini-transcribe'
const DEFAULT_TEXT_MODEL = 'gpt-4.1-mini'
const DEFAULT_SPEECH_MODEL = 'gpt-4o-mini-tts'
const SYSTEM_METRIC_OPTIONS: CortexSystemMetricKey[] = [
  'throughput',
  'memoryIntegrity',
  'activeNodes',
  'queueDepth',
]

const truncateText = (value: string | null | undefined, limit = 140) => {
  if (!value) {
    return null
  }

  const normalized = value.replace(/\s+/g, ' ').trim()
  if (!normalized) {
    return null
  }

  return normalized.length <= limit ? normalized : `${normalized.slice(0, limit - 1)}…`
}

const isVoiceTurnAbortError = (error: unknown): error is Error =>
  error instanceof Error && error.message.startsWith('VOICE_TURN_ABORTED:')

const getVoiceTurnAbortDetails = (error: unknown) => {
  if (!isVoiceTurnAbortError(error)) {
    return null
  }

  const [, stage = 'responding', ...reasonParts] = error.message.split(':')
  return {
    stage,
    reason: reasonParts.join(':') || 'aborted',
  }
}

const isLiveStatus = (status: CortexRealtimeStatus) =>
  status === 'connecting' ||
  status === 'listening' ||
  status === 'speaking' ||
  status === 'executing'

const isRealtimeDebugEnabled = () => {
  const viteValue =
    typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.VITE_CORTEX_REALTIME_DEBUG
      : undefined
  const runtimeProcess = globalThis as typeof globalThis & {
    process?: {
      env?: Record<string, string | undefined>
    }
  }
  const processValue =
    runtimeProcess.process?.env
      ? runtimeProcess.process.env.VITE_CORTEX_REALTIME_DEBUG ??
        runtimeProcess.process.env.CORTEX_REALTIME_DEBUG
      : undefined

  return viteValue === 'true' || processValue === 'true'
}

const logRealtimeDebug = (
  level: 'log' | 'warn' | 'error',
  message: string,
  context?: Record<string, unknown>,
) => {
  if (!isRealtimeDebugEnabled()) {
    return
  }

  const prefix = '[RT][renderer]'
  if (context && Object.keys(context).length > 0) {
    console[level](`${prefix} ${message}`, context)
    return
  }

  console[level](`${prefix} ${message}`)
}

const withVisualState = (state: CortexRealtimeState): CortexRealtimeState => ({
  ...state,
  visualState: isLiveStatus(state.status) && state.active ? 'on' : 'off',
})

const serializeToolOutput = (value: unknown) =>
  JSON.stringify(
    value && typeof value === 'object'
      ? value
      : {
          value,
        },
  )

const encodePcm16Base64 = (
  input: Float32Array,
  sourceSampleRate: number,
  targetSampleRate = REALTIME_TRANSCRIPTION_SAMPLE_RATE,
) => {
  if (!input.length) {
    return ''
  }

  if (sourceSampleRate <= 0 || targetSampleRate <= 0) {
    return ''
  }

  const ratio = sourceSampleRate / targetSampleRate
  const outputLength = Math.max(1, Math.round(input.length / ratio))
  const output = new Int16Array(outputLength)
  let offsetResult = 0
  let offsetBuffer = 0

  while (offsetResult < output.length) {
    const nextOffsetBuffer = Math.min(input.length, Math.round((offsetResult + 1) * ratio))
    let sum = 0
    let count = 0

    for (let index = offsetBuffer; index < nextOffsetBuffer; index += 1) {
      sum += input[index]
      count += 1
    }

    const sample = count ? sum / count : input[Math.min(offsetBuffer, input.length - 1)] ?? 0
    const clamped = Math.max(-1, Math.min(1, sample))
    output[offsetResult] =
      clamped < 0 ? Math.round(clamped * 0x8000) : Math.round(clamped * 0x7fff)

    offsetResult += 1
    offsetBuffer = nextOffsetBuffer
  }

  return btoa(
    Array.from(new Uint8Array(output.buffer), (value) => String.fromCharCode(value)).join(''),
  )
}

export const buildRealtimeToolDefinitions = (
  workspaceSnapshot: WorkspaceSnapshot | null,
): CortexRealtimeToolDefinition[] => {
  const snapshot =
    workspaceSnapshot?.workspace === 'cortex' ? workspaceSnapshot.dashboard : null
  const activeWorkspace = workspaceSnapshot?.workspace ?? 'cortex'
  const commandIds = workspaceSnapshot?.dashboard.commands.map((command) => command.id) ?? []
  const agentIds = snapshot?.agentLanes.map((lane) => lane.id) ?? []
  const memoryIds = snapshot?.vaultEntries.map((entry) => entry.id) ?? []
  const workflowIds = snapshot?.workflows.map((workflow) => workflow.id) ?? []
  const jobIds = snapshot?.drops.map((drop) => drop.id) ?? []
  const marketingMetricIds = snapshot?.studioAssets.map((asset) => asset.id) ?? []
  const nullableStringSchema = (description: string, enumValues?: string[]) => ({
    type: ['string', 'null'],
    description,
    ...(enumValues ? { enum: [...enumValues, null] } : {}),
  })
  const nullableNumberSchema = (description: string) => ({
    type: ['number', 'null'],
    description,
  })

  const baseTools: CortexRealtimeToolDefinition[] = [
    {
      type: 'function',
      strict: true,
      name: 'get_dashboard_snapshot',
      description: 'Return the full structured snapshot for the current workspace session.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
        additionalProperties: false,
      },
    },
    {
      type: 'function',
      strict: true,
      name: 'get_ui_context',
      description: 'Return the current route, workspace, and page-local context from the UI.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
        additionalProperties: false,
      },
    },
    {
      type: 'function',
      strict: true,
      name: 'navigate_ui',
      description: 'Navigate the dashboard to a specific page when it helps reveal the requested information.',
      parameters: {
        type: 'object',
        properties: {
          route: {
            type: 'string',
            description: 'Dashboard route to open.',
            enum: getWorkspaceRouteOptions(activeWorkspace),
          },
        },
        required: ['route'],
        additionalProperties: false,
      },
    },
    {
      type: 'function',
      strict: true,
      name: 'run_command',
      description:
        'Run one of the currently available workspace commands. Use only when the user explicitly asks to execute an action.',
      parameters: {
        type: 'object',
        properties: {
          commandId: {
            type: 'string',
            description: 'Command ID to execute.',
            enum: commandIds,
          },
          context: nullableStringSchema('Short explanation of why this command is being run.'),
        },
        required: ['commandId', 'context'],
        additionalProperties: false,
      },
    },
  ]

  if (!snapshot) {
    return baseTools
  }

  return [
    ...baseTools,
    {
      type: 'function',
      strict: true,
      name: 'get_system_metrics',
      description: 'Return the current system health metrics from the dashboard snapshot.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
        additionalProperties: false,
      },
    },
    {
      type: 'function',
      strict: true,
      name: 'list_agents',
      description: 'List known agent lanes, optionally filtered by lane status.',
      parameters: {
        type: 'object',
        properties: {
          status: nullableStringSchema('Optional agent status filter.'),
        },
        required: ['status'],
        additionalProperties: false,
      },
    },
    {
      type: 'function',
      strict: true,
      name: 'list_memories',
      description: 'List knowledge vault entries, with optional filtering by lane ID or free-text search.',
      parameters: {
        type: 'object',
        properties: {
          agentId: nullableStringSchema('Optional lane ID filter.', agentIds),
          query: nullableStringSchema(
            'Optional free-text filter over vault title, summary, and tags.',
          ),
          limit: nullableNumberSchema('Optional result limit.'),
        },
        required: ['agentId', 'query', 'limit'],
        additionalProperties: false,
      },
    },
    {
      type: 'function',
      strict: true,
      name: 'list_workflows',
      description: 'List workflow records, with optional free-text search over titles, tools, and architecture.',
      parameters: {
        type: 'object',
        properties: {
          query: nullableStringSchema(
            'Optional free-text filter over workflow title, description, architecture, and tools.',
          ),
          limit: nullableNumberSchema('Optional result limit.'),
        },
        required: ['query', 'limit'],
        additionalProperties: false,
      },
    },
    {
      type: 'function',
      strict: true,
      name: 'list_schedules',
      description: 'List operations drops, optionally filtered by drop status.',
      parameters: {
        type: 'object',
        properties: {
          status: nullableStringSchema('Optional job status filter.'),
        },
        required: ['status'],
        additionalProperties: false,
      },
    },
    {
      type: 'function',
      strict: true,
      name: 'list_recent_logs',
      description: 'List recent audit and runtime events from the current mission snapshot.',
      parameters: {
        type: 'object',
        properties: {
          limit: nullableNumberSchema('Maximum number of log events to return.'),
        },
        required: ['limit'],
        additionalProperties: false,
      },
    },
    {
      type: 'function',
      strict: true,
      name: 'focus_agent',
      description: 'Open the ZiBz page and focus a specific agent lane.',
      parameters: {
        type: 'object',
        properties: {
          agentId: {
            type: 'string',
            description: 'Lane ID to focus.',
            enum: agentIds,
          },
        },
        required: ['agentId'],
        additionalProperties: false,
      },
    },
    {
      type: 'function',
      strict: true,
      name: 'focus_memory',
      description: 'Open Knowledge and focus a specific vault record.',
      parameters: {
        type: 'object',
        properties: {
          memoryId: {
            type: 'string',
            description: 'Vault entry ID to focus.',
            enum: memoryIds,
          },
        },
        required: ['memoryId'],
        additionalProperties: false,
      },
    },
    {
      type: 'function',
      strict: true,
      name: 'focus_workflow',
      description: 'Open Workflows and focus a specific workflow record.',
      parameters: {
        type: 'object',
        properties: {
          workflowId: {
            type: 'string',
            description: 'Workflow ID to focus.',
            enum: workflowIds,
          },
        },
        required: ['workflowId'],
        additionalProperties: false,
      },
    },
    {
      type: 'function',
      strict: true,
      name: 'focus_schedule',
      description: 'Open Operations and focus a specific drop.',
      parameters: {
        type: 'object',
        properties: {
          jobId: {
            type: 'string',
            description: 'Drop ID to focus.',
            enum: jobIds,
          },
        },
        required: ['jobId'],
        additionalProperties: false,
      },
    },
    {
      type: 'function',
      strict: true,
      name: 'focus_system_metric',
      description: 'Open Economy and highlight a specific diagnostic metric card.',
      parameters: {
        type: 'object',
        properties: {
          metricKey: {
            type: 'string',
            description: 'System metric key to highlight.',
            enum: SYSTEM_METRIC_OPTIONS,
          },
        },
        required: ['metricKey'],
        additionalProperties: false,
      },
    },
    {
      type: 'function',
      strict: true,
      name: 'focus_marketing_metric',
      description:
        'Open Studio and highlight a specific content pipeline asset.',
      parameters: {
        type: 'object',
        properties: {
          metricId: {
            type: 'string',
            description: 'Studio asset ID to highlight.',
            enum: marketingMetricIds,
          },
        },
        required: ['metricId'],
        additionalProperties: false,
      },
    },
  ]
}

const stringifyViewDetails = (details: CortexViewContext['details']) => {
  const entries = Object.entries(details)
  if (!entries.length) {
    return 'none'
  }

  return entries
    .map(([key, value]) => `${key}=${Array.isArray(value) ? value.join(', ') : String(value)}`)
    .join('; ')
}

const describeToolPriority = (toolGroups: CortexRealtimeSessionRequest['preferredToolGroups']) =>
  toolGroups.join(' -> ')

export const buildRealtimeInstructions = (
  workspaceSnapshot: WorkspaceSnapshot | null,
  viewContext: CortexViewContext,
  realtimeMode: CortexRealtimeMode,
) => {
  const snapshot =
    workspaceSnapshot?.workspace === 'cortex' ? workspaceSnapshot.dashboard : null
  const commands =
    workspaceSnapshot?.dashboard.commands.length
      ? workspaceSnapshot.dashboard.commands
          .map((command) => `${command.id}: ${command.description}`)
          .join('\n')
      : snapshot?.commands.length
      ? snapshot.commands.map((command) => `${command.id}: ${command.description}`).join('\n')
      : 'No commands are currently available.'
  const modeProfile = getRealtimeModeProfile(realtimeMode)
  const replyStyle =
    modeProfile.silentOutput
      ? 'Do not produce spoken filler or conversational audio replies in this mode.'
      : modeProfile.preferredToolGroups[0] === 'execution'
        ? 'Keep replies especially short, direct, and tool-oriented.'
      : realtimeMode === 'lean_voice'
          ? 'Keep replies short and avoid filler acknowledgements.'
          : 'Keep replies natural, concise, and supportive.'
  const navigationGuidance =
    modeProfile.navigationPolicy === 'ask_then_move'
      ? 'Only navigate or focus the UI when the user explicitly asks you to show, open, go to, highlight, reveal, display, or focus something.'
      : modeProfile.navigationPolicy === 'focus_only'
        ? 'You may focus items on the current page, but avoid route changes unless the user explicitly requests them.'
        : 'You may navigate the UI or highlight the relevant metric when it helps the user follow along.'
  const outputGuidance = modeProfile.silentOutput
    ? 'Treat the UI as the primary response surface. Prefer tool-driven navigation and highlighting over spoken explanation.'
    : 'If you navigate or focus the UI, briefly tell the user what you are opening or highlighting.'

  return [
    'You are The Cortex voice copilot inside a live dashboard.',
    'This product intentionally uses a chained voice pipeline: capture, transcribe, reason with tools, then optionally synthesize speech.',
    'Use structured tools and current UI context as the source of truth.',
    'Do not infer facts from visuals alone.',
    replyStyle,
    'Clearly separate facts from recommendations.',
    'For current-state questions, call the relevant tools before answering.',
    navigationGuidance,
    outputGuidance,
    'When the user asks to execute an action, say what you are running before you call run_command.',
    'The user has allowed full command access, but you should still only run commands that match their request.',
    `Current realtime mode: ${modeProfile.id}.`,
    `Runtime: ${modeProfile.runtime}.`,
    `Mode silent output: ${modeProfile.silentOutput ? 'enabled' : 'disabled'}.`,
    `Mode tool priority: ${describeToolPriority(modeProfile.preferredToolGroups)}.`,
    `Mode navigation policy: ${modeProfile.navigationPolicy}.`,
    `Current route: ${viewContext.routeTitle} (${viewContext.route}).`,
    `Current route subtitle: ${viewContext.routeSubtitle}.`,
    `Current workspace: ${viewContext.workspace}.`,
    `Current UI details: ${stringifyViewDetails(viewContext.details)}.`,
    'Available command IDs:',
    commands,
  ].join('\n')
}

export const buildRealtimeSessionRequest = (
  workspaceSnapshot: WorkspaceSnapshot | null,
  viewContext: CortexViewContext,
  realtimeMode: CortexRealtimeMode,
): CortexRealtimeSessionRequest => ({
  instructions: buildRealtimeInstructions(workspaceSnapshot, viewContext, realtimeMode),
  tools: buildRealtimeToolDefinitions(workspaceSnapshot),
  context: viewContext,
  mode: realtimeMode,
  runtime: getRealtimeModeProfile(realtimeMode).runtime,
  textModel: getRealtimeModeProfile(realtimeMode).textModel,
  transcriptionProvider: getRealtimeModeProfile(realtimeMode).transcriptionProvider,
  transcriptionModel: getRealtimeModeProfile(realtimeMode).transcriptionModel,
  speechProvider: getRealtimeModeProfile(realtimeMode).speechProvider,
  speechModel: getRealtimeModeProfile(realtimeMode).speechModel,
  voice: getRealtimeModeProfile(realtimeMode).voice,
  voiceSettings: getRealtimeModeProfile(realtimeMode).voiceSettings,
  pronunciationDictionaries: getRealtimeModeProfile(realtimeMode).pronunciationDictionaries,
  silentOutput: getRealtimeModeProfile(realtimeMode).silentOutput,
  navigationPolicy: getRealtimeModeProfile(realtimeMode).navigationPolicy,
  toolPreference: getRealtimeModeProfile(realtimeMode).toolPreference,
  preferredToolGroups: getRealtimeModeProfile(realtimeMode).preferredToolGroups,
})

const blobToBase64 = async (blob: Blob) => {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let binary = ''

  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000))
  }

  return btoa(binary)
}

const buildRealtimeResponseCreateEvent = () => ({
  type: 'response.create',
  response: {
    output_modalities: ['audio'],
  },
})

const getDefaultAudioContext = () => {
  const AudioContextCtor =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

  if (!AudioContextCtor) {
    throw new Error('Audio analysis is unavailable in this environment.')
  }

  return new AudioContextCtor()
}

const resumeAudioContext = async (audioContext: AudioContext) => {
  if (audioContext.state === 'running') {
    return
  }

  try {
    await audioContext.resume()
  } catch {
    // Some runtimes require a direct user gesture before audio analysis can resume.
  }
}

const getDefaultMediaRecorderFactory = (
  stream: MediaStream,
  options?: MediaRecorderOptions,
) => {
  if (typeof MediaRecorder === 'undefined') {
    throw new Error('MediaRecorder is unavailable in this environment.')
  }

  return new MediaRecorder(stream, options)
}

const getSupportedRecorderMimeType = () => {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return null
  }

  return (
    TOOL_VOICE_RECORDER_MIME_TYPES.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) ??
    null
  )
}

const getAudioCaptureFileName = (mimeType: string | undefined) => {
  if (!mimeType) {
    return 'tool-voice-input.webm'
  }

  if (mimeType.includes('mp4')) {
    return 'tool-voice-input.mp4'
  }

  if (mimeType.includes('ogg')) {
    return 'tool-voice-input.ogg'
  }

  return 'tool-voice-input.webm'
}

export class CortexRealtimeController {
  private readonly api: CortexBridge

  private readonly audioContextFactory: () => AudioContext

  private readonly createAudioElement: () => HTMLAudioElement

  private readonly getSessionRequest: () => CortexRealtimeSessionRequest

  private readonly getUserMedia: typeof navigator.mediaDevices.getUserMedia

  private readonly mediaRecorderFactory: (
    stream: MediaStream,
    options?: MediaRecorderOptions,
  ) => MediaRecorder

  private readonly realtimeTranscriptionSocketFactory: (url: string) => RealtimeTranscriptionSocket

  private readonly onStateChange: (state: CortexRealtimeState) => void

  private readonly onToolCall: ToolCallHandler

  private activeRequest: CortexRealtimeSessionRequest | null = null

  private resources: ControllerResources | null = null

  private state: CortexRealtimeState = DEFAULT_REALTIME_STATE

  private toolVoiceResources: ToolVoiceResources | null = null

  private toolVoicePreviousResponseId: string | null = null

  private lastUserTranscript: string | null = null

  private recentToolResultSummaries: string[] = []

  private interruptedTurnIds = new Set<string>()

  private captureRecoveryInFlight = false

  private version = 0

  constructor(dependencies: ControllerDependencies, options: ControllerOptions = {}) {
    this.api = dependencies.api
    this.audioContextFactory = options.audioContextFactory ?? getDefaultAudioContext
    this.createAudioElement =
      options.createAudioElement ?? (() => document.createElement('audio'))
    this.getSessionRequest = dependencies.getSessionRequest
    this.getUserMedia = options.getUserMedia ?? getDefaultUserMedia
    this.mediaRecorderFactory =
      options.mediaRecorderFactory ?? getDefaultMediaRecorderFactory
    this.realtimeTranscriptionSocketFactory =
      options.realtimeTranscriptionSocketFactory ?? ((url: string) => new WebSocket(url))
    this.onStateChange = dependencies.onStateChange
    this.onToolCall = dependencies.onToolCall
  }

  private getDebugContext(extra: Record<string, unknown> = {}) {
    return {
      active: this.state.active,
      runtime: this.activeRequest?.runtime ?? null,
      mode: this.activeRequest?.mode ?? null,
      sessionId: this.state.sessionId,
      sessionAttemptId: this.state.sessionAttemptId,
      lastInterruptionReason: this.state.lastInterruptionReason,
      lastAbortedStage: this.state.lastAbortedStage,
      stage: this.state.stage,
      status: this.state.status,
      turnId: this.state.turnId,
      version: this.version,
      ...extra,
    }
  }

  private publishDebugEntry(entry: CortexRealtimeDebugEntryInput) {
    if (!isRealtimeDebugEnabled()) {
      return
    }

    void this.api.recordRealtimeDebug(entry).catch(() => {
      // Keep debug publication fire-and-forget so instrumentation cannot break voice flow.
    })
  }

  private debugLog(message: string, context?: Record<string, unknown>) {
    const fullContext = this.getDebugContext(context)
    logRealtimeDebug('log', message, fullContext)
    this.publishDebugEntry({
      source: 'renderer',
      level: 'log',
      severity: 'log',
      mode: this.activeRequest?.mode ?? 'unknown',
      stage: this.state.stage,
      transport: this.activeRequest?.runtime,
      sessionAttemptId: this.state.sessionAttemptId,
      turnId: this.state.turnId,
      transcriptPreview: this.state.lastTranscriptPreview,
      responsePreview: this.state.lastResponsePreview,
      toolName: this.state.lastToolCall?.name ?? null,
      errorCode: this.state.lastFailure?.code ?? null,
      errorMessage: this.state.lastFailure?.message ?? null,
      message,
      context: fullContext,
    })
  }

  private debugWarn(message: string, context?: Record<string, unknown>) {
    const fullContext = this.getDebugContext(context)
    logRealtimeDebug('warn', message, fullContext)
    this.publishDebugEntry({
      source: 'renderer',
      level: 'warn',
      severity: 'warn',
      mode: this.activeRequest?.mode ?? 'unknown',
      stage: this.state.stage,
      transport: this.activeRequest?.runtime,
      sessionAttemptId: this.state.sessionAttemptId,
      turnId: this.state.turnId,
      transcriptPreview: this.state.lastTranscriptPreview,
      responsePreview: this.state.lastResponsePreview,
      toolName: this.state.lastToolCall?.name ?? null,
      errorCode: this.state.lastFailure?.code ?? null,
      errorMessage: this.state.lastFailure?.message ?? null,
      message,
      context: fullContext,
    })
  }

  private debugError(message: string, context?: Record<string, unknown>) {
    const fullContext = this.getDebugContext(context)
    logRealtimeDebug('error', message, fullContext)
    this.publishDebugEntry({
      source: 'renderer',
      level: 'error',
      severity: 'error',
      mode: this.activeRequest?.mode ?? 'unknown',
      stage: this.state.stage,
      transport: this.activeRequest?.runtime,
      sessionAttemptId: this.state.sessionAttemptId,
      turnId: this.state.turnId,
      transcriptPreview: this.state.lastTranscriptPreview,
      responsePreview: this.state.lastResponsePreview,
      toolName: this.state.lastToolCall?.name ?? null,
      errorCode: this.state.lastFailure?.code ?? null,
      errorMessage: this.state.lastFailure?.message ?? null,
      message,
      context: fullContext,
    })
  }

  async toggle() {
    this.debugLog('Toggle requested.', {
      connecting: this.state.status === 'connecting',
    })

    if (this.state.active || this.state.status === 'connecting') {
      await this.stop('Realtime voice stopped.')
      return
    }

    await this.start()
  }

  async start() {
    const version = ++this.version
    const sessionId = createSessionIdentity()
    const request = this.getSessionRequest()
    this.activeRequest = request
    this.toolVoicePreviousResponseId = null
    this.lastUserTranscript = null
    this.recentToolResultSummaries = []
    this.interruptedTurnIds.clear()

    this.debugLog('Start requested.', {
      mode: request.mode,
      runtime: request.runtime,
      model: request.textModel ?? null,
      preferredToolGroups: request.preferredToolGroups,
      requestedSessionId: sessionId,
    })

    this.setState(
      withVisualState({
        ...DEFAULT_REALTIME_STATE,
        active: true,
        sessionId,
        sessionAttemptId: sessionId,
        status: 'connecting',
        stage: 'ready',
        lastEventAt: isoNow(),
      }),
    )
    await this.recordLog(
      'info',
      `Voice pipeline connection requested for ${request.mode} (${request.textModel ?? 'default'}).`,
    )

    try {
      this.debugLog('Routing start into chained voice pipeline.')
      await this.startToolVoice(version, request)
    } catch (error) {
      if (!this.isCurrentVersion(version)) {
        this.debugWarn('Start error ignored because controller version changed.', {
          error: toErrorMessage(error),
        })
        return
      }

      this.debugError('Start failed.', {
        error: toErrorMessage(error),
      })
      this.cleanupAllResources()
      this.activeRequest = null
      await this.transitionToError(toErrorMessage(error))
    }
  }

  async stop(message = 'Realtime voice stopped.') {
    this.version += 1
    const wasActive =
      this.state.active ||
      this.state.status === 'connecting' ||
      this.resources !== null ||
      this.toolVoiceResources !== null

    this.debugLog('Stop requested.', {
      message,
      wasActive,
    })

    await this.abortActiveTurn('manual_stop', {
      recordInterruption: false,
    })
    this.cleanupAllResources()
    this.activeRequest = null
    this.toolVoicePreviousResponseId = null
    this.lastUserTranscript = null
    this.recentToolResultSummaries = []
    this.interruptedTurnIds.clear()
    this.setState(
      withVisualState({
        ...DEFAULT_REALTIME_STATE,
        stage: 'stopped',
        lastEventAt: isoNow(),
      }),
    )

    if (wasActive) {
      await this.recordLog('info', message)
    }
  }

  async syncSession() {
    this.debugLog('Session sync requested but skipped because the chained voice runtime injects context per turn.')
  }

  private async abortActiveTurn(
    reason: string,
    options: {
      recordInterruption: boolean
    },
  ) {
    const sessionAttemptId = this.state.sessionAttemptId
    const turnId = this.state.turnId
    const stage = this.state.stage

    if (!sessionAttemptId || !turnId) {
      return false
    }

    if (
      stage !== 'transcribing' &&
      stage !== 'responding' &&
      stage !== 'tooling' &&
      stage !== 'speaking'
    ) {
      return false
    }

    if (options.recordInterruption) {
      this.interruptedTurnIds.add(turnId)
      this.setState(
        withVisualState({
          ...this.state,
          lastInterruptionReason: reason,
          lastInterruptedResponsePreview: this.state.lastResponsePreview,
          lastAbortedStage: stage,
          lastEventAt: isoNow(),
        }),
      )
      this.publishDebugEntry({
        source: 'renderer',
        level: 'warn',
        severity: 'warn',
        message: 'Voice turn interrupted by live speech input.',
        mode: this.activeRequest?.mode ?? 'unknown',
        stage,
        transport: this.activeRequest?.runtime,
        sessionAttemptId,
        turnId,
        transcriptPreview: this.state.lastTranscriptPreview,
        responsePreview: this.state.lastResponsePreview,
        toolName: this.state.lastToolCall?.name ?? null,
        errorCode: 'INTERRUPT',
        errorMessage: reason,
        context: this.getDebugContext({
          interruptionReason: reason,
          interruptedStage: stage,
        }),
      })
    }

    await this.api.abortVoiceTurn({
      sessionAttemptId,
      turnId,
      reason,
    })

    return true
  }

  async dispose() {
    this.debugLog('Dispose requested.')
    await this.stop('Realtime voice session disposed.')
  }

  private usesStreamingTranscription(request: CortexRealtimeSessionRequest) {
    return (
      request.mode === 'neural_voice' &&
      request.transcriptionProvider === 'elevenlabs' &&
      request.transcriptionModel === 'scribe_v2_realtime'
    )
  }

  private createRealtimeTranscriptionUrl(token: string, request: CortexRealtimeSessionRequest) {
    const params = new URLSearchParams({
      token,
      model_id: request.transcriptionModel ?? 'scribe_v2_realtime',
      audio_format: REALTIME_TRANSCRIPTION_AUDIO_FORMAT,
      commit_strategy: 'vad',
      vad_silence_threshold_secs: String(REALTIME_TRANSCRIPTION_VAD_SILENCE_SECS),
      vad_threshold: String(REALTIME_TRANSCRIPTION_VAD_THRESHOLD),
      min_speech_duration_ms: String(REALTIME_TRANSCRIPTION_MIN_SPEECH_MS),
      min_silence_duration_ms: String(REALTIME_TRANSCRIPTION_MIN_SILENCE_MS),
      include_timestamps: 'false',
    })

    if (request.mode === 'neural_voice') {
      params.set('language_code', 'en')
    }

    return `${ELEVENLABS_REALTIME_TRANSCRIPTIONS_URL}?${params.toString()}`
  }

  private async startToolVoice(
    version: number,
    request: CortexRealtimeSessionRequest,
  ) {
    this.debugLog('Starting chained voice pipeline.', {
      runtime: request.runtime,
      silentOutput: request.silentOutput,
      textModel: request.textModel ?? null,
      transcriptionModel: request.transcriptionModel ?? null,
      speechModel: request.speechModel ?? null,
    })
    const stream = await this.getUserMedia({
      audio: buildMicrophoneConstraints(),
    })
    this.debugLog('Tool-voice microphone stream granted.', {
      trackCount: stream.getTracks().length,
    })

    if (!this.isCurrentVersion(version)) {
      this.debugWarn('Aborting tool-voice start because controller version changed.')
      stream.getTracks().forEach((track) => track.stop())
      return
    }

    const audioElement = this.createPlaybackAudioElement()
    await this.beginRealtimeVoiceCapture(version, stream, audioElement, request)

    this.setState(
      withVisualState({
        ...this.state,
        active: true,
        status: 'listening',
        stage: 'ready',
        error: null,
        lastFailure: null,
        lastEventAt: isoNow(),
        lastCompletedStageAt: isoNow(),
      }),
    )
    this.publishDebugEntry({
      source: 'renderer',
      level: 'log',
      severity: 'log',
      message: 'Voice pipeline is ready.',
      mode: request.mode,
      stage: 'ready',
      transport: request.runtime,
      sessionAttemptId: this.state.sessionAttemptId,
      turnId: this.state.turnId,
      transcriptPreview: this.state.lastTranscriptPreview,
      responsePreview: this.state.lastResponsePreview,
      toolName: this.state.lastToolCall?.name ?? null,
      errorCode: null,
      errorMessage: null,
      context: this.getDebugContext({
        textModel: request.textModel ?? null,
      }),
    })
    await this.recordLog(
      'success',
      request.silentOutput
        ? `UI director connected with ${request.textModel}.`
        : `Voice pipeline connected with ${request.textModel}.`,
      'green',
    )
  }

  private async beginRealtimeVoiceCapture(
    version: number,
    stream: MediaStream,
    playbackAudioElement: HTMLAudioElement,
    request: CortexRealtimeSessionRequest,
  ) {
    this.debugLog('Arming local voice capture loop.', {
      trackCount: stream.getTracks().length,
    })
    this.cleanupToolVoiceResources()

    const audioContext = this.audioContextFactory()
    await resumeAudioContext(audioContext)
    this.debugLog('Audio context ready for capture.', {
      audioContextState: audioContext.state,
    })
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 1024

    const sourceNode = audioContext.createMediaStreamSource(stream)
    sourceNode.connect(analyser)

    let processorNode: ScriptProcessorNode | null = null
    let processorSink: GainNode | null = null
    let streamingTranscription = false
    let transcriptionSocket: RealtimeTranscriptionSocket | null = null
    let transcriptionReady: Promise<void> | null = null
    let resolveTranscriptionReady: (() => void) | null = null
    let rejectTranscriptionReady: ((reason?: unknown) => void) | null = null

    if (this.usesStreamingTranscription(request)) {
      const token = await this.api.createRealtimeTranscriptionToken({
        mode: request.mode,
        purpose: 'realtime_scribe',
      })
      const realtimeUrl = this.createRealtimeTranscriptionUrl(token.token, request)
      this.debugLog('Opening ElevenLabs realtime transcription session.', {
        expiresAt: token.expiresAt,
        model: request.transcriptionModel ?? null,
      })

      transcriptionReady = new Promise<void>((resolve, reject) => {
        resolveTranscriptionReady = resolve
        rejectTranscriptionReady = reject
      })
      transcriptionSocket = this.realtimeTranscriptionSocketFactory(realtimeUrl)
      processorNode = audioContext.createScriptProcessor(
        REALTIME_TRANSCRIPTION_PROCESSOR_BUFFER_SIZE,
        1,
        1,
      )
      processorSink = audioContext.createGain()
      processorSink.gain.value = 0
      sourceNode.connect(processorNode)
      processorNode.connect(processorSink)
      processorSink.connect(audioContext.destination)
      streamingTranscription = true
    }

    this.toolVoiceResources = this.createVoiceCaptureResources(
      stream,
      playbackAudioElement,
      audioContext,
      analyser,
      sourceNode,
      processorNode,
      processorSink,
      streamingTranscription,
      transcriptionSocket,
      transcriptionReady,
      resolveTranscriptionReady,
      rejectTranscriptionReady,
      version,
    )

    if (this.toolVoiceResources.streamingTranscription) {
      this.armRealtimeTranscriptionSession(this.toolVoiceResources, request, version)
      await this.toolVoiceResources.transcriptionReady
    }
    this.debugLog('Local voice capture loop armed.', {
      monitorIntervalMs: TOOL_VOICE_CHECK_INTERVAL_MS,
    })
  }

  private createPlaybackAudioElement() {
    const audioElement = this.createAudioElement()
    audioElement.autoplay = true
    ;(audioElement as HTMLAudioElement & { playsInline?: boolean }).playsInline = true
    audioElement.addEventListener('playing', this.handleAudioPlaying)
    audioElement.addEventListener('pause', this.handleAudioPause)
    audioElement.addEventListener('ended', this.handleAudioPause)
    return audioElement
  }

  private async recoverToolVoiceCapture(version: number, reason: string) {
    if (
      this.captureRecoveryInFlight ||
      !this.isCurrentVersion(version) ||
      !this.state.active
    ) {
      return
    }

    this.captureRecoveryInFlight = true
    this.debugWarn('Attempting to recover local voice capture.', {
      reason,
    })

    try {
      this.cleanupToolVoiceResources()
      const stream = await this.getUserMedia({
        audio: buildMicrophoneConstraints(),
      })

      if (!this.isCurrentVersion(version)) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      const audioElement = this.createPlaybackAudioElement()
      if (!this.activeRequest) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      await this.beginRealtimeVoiceCapture(version, stream, audioElement, this.activeRequest)
      this.setState(
        withVisualState({
          ...this.state,
          active: true,
          status: 'listening',
          stage: 'ready',
          error: null,
          lastEventAt: isoNow(),
          lastCompletedStageAt: isoNow(),
        }),
      )
      await this.recordLog('warning', `Voice capture recovered after ${reason}.`, 'amber')
    } catch (error) {
      if (!this.isCurrentVersion(version)) {
        return
      }

      const message = toErrorMessage(error)
      this.debugError('Voice capture recovery failed.', {
        reason,
        error: message,
      })
      await this.transitionToError(`Voice capture recovery failed. ${message}`)
    } finally {
      this.captureRecoveryInFlight = false
    }
  }

  private async monitorToolVoiceInput(version: number) {
    try {
      if (!this.isCurrentVersion(version)) {
        return
      }

      const resources = this.toolVoiceResources
      if (!resources || !this.state.active || this.state.status === 'executing') {
        return
      }

      const audioContext = resources.audioContext
      if (audioContext.state === 'suspended' || audioContext.state === 'interrupted') {
        await resumeAudioContext(audioContext)
      }

      const streamTracks =
        typeof resources.stream.getTracks === 'function' ? resources.stream.getTracks() : []
      const hasLiveTrack = streamTracks.length
        ? streamTracks.some((track) => {
            const mediaTrack = track as MediaStreamTrack & { readyState?: string }
            return mediaTrack.readyState !== 'ended'
          })
        : true
      if ((typeof resources.stream.active === 'boolean' && !resources.stream.active) || !hasLiveTrack) {
        await this.recoverToolVoiceCapture(version, 'microphone stream ended')
        return
      }

      if (
        audioContext.state === 'closed' ||
        audioContext.state === 'interrupted' ||
        audioContext.state === 'suspended'
      ) {
        await this.recoverToolVoiceCapture(version, `audio context ${audioContext.state}`)
        return
      }

      const samples = new Uint8Array(resources.analyser.fftSize)
      resources.analyser.getByteTimeDomainData(samples)
      const level =
        samples.reduce((sum, sample) => sum + Math.abs(sample - 128), 0) / samples.length
      const now = performance.now()
      const isPlaybackActive = !resources.audioElement.paused

      if (isPlaybackActive) {
        if (level > TOOL_VOICE_INTERRUPT_THRESHOLD) {
          resources.interruptionFrames += 1
          if (resources.interruptionFrames >= TOOL_VOICE_INTERRUPT_FRAMES) {
            resources.interruptionFrames = 0
            await this.interruptSpeakingTurn(resources, version, level)
          }
        } else {
          resources.interruptionFrames = 0
        }

        return
      }

      resources.interruptionFrames = 0

      if (resources.streamingTranscription) {
        return
      }

      if (level > TOOL_VOICE_THRESHOLD) {
        resources.silenceSince = null
        resources.startedSpeakingAt ??= now
        if (!resources.recorder) {
          this.startToolVoiceRecorder(resources, version)
          return
        }

        if (
          resources.startedSpeakingAt &&
          now - resources.startedSpeakingAt >= TOOL_VOICE_MAX_RECORDING_MS
        ) {
          this.debugWarn('Recorder reached max utterance window; forcing turn finalization.', {
            recordingMs: Math.round(now - resources.startedSpeakingAt),
          })
          resources.startedSpeakingAt = null
          if (typeof resources.recorder.requestData === 'function') {
            resources.recorder.requestData()
          }
          resources.recorder.stop()
        }
        return
      }

      if (!resources.recorder) {
        resources.startedSpeakingAt = null
        return
      }

      resources.silenceSince ??= now
      if (now - resources.silenceSince >= TOOL_VOICE_SILENCE_MS) {
        this.debugLog('Detected trailing silence; stopping recorder.', {
          silenceMs: now - resources.silenceSince,
        })
        resources.silenceSince = null
        resources.startedSpeakingAt = null
        if (typeof resources.recorder.requestData === 'function') {
          resources.recorder.requestData()
        }
        resources.recorder.stop()
      }
    } catch (error) {
      if (!this.isCurrentVersion(version)) {
        return
      }

      const message = toErrorMessage(error)
      this.debugWarn('Local voice capture loop hit an error.', {
        error: message,
      })
      await this.recordLog('warning', `Tool voice capture loop hit an error. ${message}`, 'amber')
      this.setState(
        withVisualState({
          ...this.state,
          active: true,
          status: 'listening',
          stage: 'ready',
          error: message,
          lastFailure: {
            code: 'voice_capture_monitor_failed',
            message,
            stage: this.state.stage,
            timestamp: isoNow(),
          },
          lastEventAt: isoNow(),
        }),
      )
    }
  }

  private async interruptSpeakingTurn(
    resources: ToolVoiceResources,
    version: number,
    level: number,
  ) {
    if (!this.isCurrentVersion(version) || this.state.status !== 'speaking') {
      return
    }

    this.debugWarn('Detected user speech during playback; interrupting active turn.', {
      inputLevel: Math.round(level * 100) / 100,
      turnId: this.state.turnId,
    })

    try {
      resources.audioElement.pause()
    } catch {
      // Ignore pause failures from environments that do not fully implement media elements.
    }
    resources.audioElement.src = ''

    await this.abortActiveTurn('barge_in', {
      recordInterruption: true,
    })

    if (!this.isCurrentVersion(version) || resources.recorder) {
      return
    }

    resources.silenceSince = null
    resources.startedSpeakingAt = performance.now()
    this.startToolVoiceRecorder(resources, version)
  }

  private startToolVoiceRecorder(resources: ToolVoiceResources, version: number) {
    const preferredMimeType = getSupportedRecorderMimeType()
    const recorder = preferredMimeType
      ? this.mediaRecorderFactory(resources.stream, {
          mimeType: preferredMimeType,
        })
      : this.mediaRecorderFactory(resources.stream)

    resources.recorder = recorder
    resources.chunks = []
    this.setState(
      withVisualState({
        ...this.state,
        active: true,
        status: 'listening',
        stage: 'capturing',
        error: null,
        lastEventAt: isoNow(),
        lastCompletedStageAt: isoNow(),
      }),
    )
    this.publishDebugEntry({
      source: 'renderer',
      level: 'log',
      severity: 'log',
      message: 'Voice activity detected; capture started.',
      mode: this.activeRequest?.mode ?? 'unknown',
      stage: 'capturing',
      transport: this.activeRequest?.runtime,
      sessionAttemptId: this.state.sessionAttemptId,
      turnId: this.state.turnId,
      transcriptPreview: this.state.lastTranscriptPreview,
      responsePreview: this.state.lastResponsePreview,
      toolName: this.state.lastToolCall?.name ?? null,
      errorCode: null,
      errorMessage: null,
      context: this.getDebugContext({
        mimeType: recorder.mimeType || preferredMimeType || 'default mime type',
      }),
    })

    void this.recordLog(
      'info',
      `Voice capture started (${recorder.mimeType || preferredMimeType || 'default mime type'}).`,
    )

    recorder.addEventListener('dataavailable', (event) => {
      if (event.data.size > 0) {
        resources.chunks.push(event.data)
        this.debugLog('Recorder produced audio chunk.', {
          chunkSize: event.data.size,
          chunkCount: resources.chunks.length,
        })
      }
    })

    recorder.addEventListener('error', () => {
      resources.recorder = null
      this.debugWarn('Recorder emitted an error event.')
      void this.recordLog('warning', 'Tool voice recorder reported an error.', 'amber')
    })

    recorder.addEventListener(
      'stop',
      () => {
        resources.recorder = null
        const blob = new Blob(resources.chunks, {
          type: recorder.mimeType || preferredMimeType || 'audio/webm',
        })
        this.debugLog('Recorder stopped.', {
          blobSize: blob.size,
          mimeType: blob.type,
        })
        resources.chunks = []
        if (blob.size > 0) {
          void this.processToolVoiceTurn(blob, version)
          return
        }

        void this.recordLog('warning', 'Tool voice recorder stopped without captured audio.', 'amber')
      },
      { once: true },
    )

    recorder.start(TOOL_VOICE_TIMESLICE_MS)
  }

  private armRealtimeTranscriptionSession(
    resources: ToolVoiceResources,
    request: CortexRealtimeSessionRequest,
    version: number,
  ) {
    const socket = resources.transcriptionSocket
    if (!socket) {
      return
    }

    const handleMessage = (event: MessageEvent<string>) => {
      const payload = safeParseJson(event.data) as Record<string, unknown>
      const messageType = typeof payload.message_type === 'string' ? payload.message_type : 'unknown'

      if (messageType === 'session_started') {
        resources.transcriptionStarted = true
        resources.resolveTranscriptionReady?.()
        resources.resolveTranscriptionReady = null
        resources.rejectTranscriptionReady = null
        this.debugLog('ElevenLabs realtime transcription session started.', {
          sessionConfig: payload.config ?? null,
        })
        return
      }

      if (messageType === 'partial_transcript') {
        const partialText = typeof payload.text === 'string' ? payload.text.trim() : ''
        if (!partialText || !this.isCurrentVersion(version)) {
          return
        }

        this.setState(
          withVisualState({
            ...this.state,
            active: true,
            status: this.state.status === 'speaking' ? this.state.status : 'listening',
            stage: this.state.status === 'speaking' ? this.state.stage : 'capturing',
            lastTranscriptPreview: truncateText(partialText),
            lastEventAt: isoNow(),
          }),
        )
        return
      }

      if (messageType === 'committed_transcript') {
        const committedText = typeof payload.text === 'string' ? payload.text.trim() : ''
        if (!committedText || !this.isCurrentVersion(version)) {
          return
        }

        resources.bufferedSpeakingChunks = []
        void this.handleTranscriptTurn(committedText, request, version)
        return
      }

      if (messageType.endsWith('error')) {
        if (resources.transcriptionSocket !== socket) {
          return
        }
        const message =
          typeof payload.message === 'string'
            ? payload.message
            : typeof payload.detail === 'string'
              ? payload.detail
              : 'ElevenLabs realtime transcription failed.'
        resources.rejectTranscriptionReady?.(new Error(message))
        resources.resolveTranscriptionReady = null
        resources.rejectTranscriptionReady = null
        if (this.isCurrentVersion(version) && this.state.active) {
          void this.transitionToError(message)
        }
      }
    }

    const handleError = () => {
      if (resources.transcriptionSocket !== socket) {
        return
      }
      resources.rejectTranscriptionReady?.(
        new Error('ElevenLabs realtime transcription connection failed.'),
      )
      resources.resolveTranscriptionReady = null
      resources.rejectTranscriptionReady = null
      if (this.isCurrentVersion(version) && this.state.active) {
        void this.transitionToError('ElevenLabs realtime transcription connection failed.')
      }
    }

    const handleClose = () => {
      if (resources.transcriptionSocket !== socket) {
        return
      }
      resources.rejectTranscriptionReady?.(
        new Error('ElevenLabs realtime transcription session closed before becoming ready.'),
      )
      resources.resolveTranscriptionReady = null
      resources.rejectTranscriptionReady = null
      if (this.isCurrentVersion(version) && this.state.active) {
        void this.transitionToError('ElevenLabs realtime transcription session closed unexpectedly.')
      }
    }

    socket.addEventListener('message', handleMessage as EventListener)
    socket.addEventListener('error', handleError)
    socket.addEventListener('close', handleClose)

    if (resources.processorNode) {
      resources.processorNode.onaudioprocess = (event) => {
        this.handleRealtimeTranscriptionAudioFrame(resources, version, event)
      }
    }
  }

  private handleRealtimeTranscriptionAudioFrame(
    resources: ToolVoiceResources,
    version: number,
    event: AudioProcessingEvent,
  ) {
    if (
      !this.isCurrentVersion(version) ||
      !resources.streamingTranscription ||
      !resources.transcriptionSocket ||
      !resources.transcriptionStarted ||
      !this.activeRequest
    ) {
      return
    }

    const encodedChunk = encodePcm16Base64(
      event.inputBuffer.getChannelData(0),
      resources.audioContext.sampleRate,
    )
    if (!encodedChunk) {
      return
    }

    if (!resources.audioElement.paused) {
      resources.bufferedSpeakingChunks = [
        ...resources.bufferedSpeakingChunks.slice(
          -(REALTIME_TRANSCRIPTION_SPEAKING_BUFFER_LIMIT - 1),
        ),
        encodedChunk,
      ]
      return
    }

    if (resources.bufferedSpeakingChunks.length) {
      const buffered = [...resources.bufferedSpeakingChunks, encodedChunk]
      resources.bufferedSpeakingChunks = []
      buffered.forEach((chunk, index) => {
        this.sendRealtimeTranscriptionChunk(resources, chunk, index === 0)
      })
      return
    }

    this.sendRealtimeTranscriptionChunk(resources, encodedChunk, true)
  }

  private sendRealtimeTranscriptionChunk(
    resources: ToolVoiceResources,
    audioBase64: string,
    allowPreviousText: boolean,
  ) {
    const socket = resources.transcriptionSocket
    if (!socket || socket.readyState !== SOCKET_READY_STATE_OPEN) {
      return
    }

    const payload: Record<string, unknown> = {
      message_type: 'input_audio_chunk',
      audio_base_64: audioBase64,
      sample_rate: REALTIME_TRANSCRIPTION_SAMPLE_RATE,
    }

    if (allowPreviousText && !resources.sentPreviousText) {
      const previousText = truncateText(this.state.lastResponsePreview, 48)
      if (previousText) {
        payload.previous_text = previousText
      }
      resources.sentPreviousText = true
    }

    socket.send(JSON.stringify(payload))
  }

  private createVoiceCaptureResources(
    stream: MediaStream,
    audioElement: HTMLAudioElement,
    audioContext: AudioContext,
    analyser: AnalyserNode,
    sourceNode: MediaStreamAudioSourceNode,
    processorNode: ScriptProcessorNode | null,
    processorSink: GainNode | null,
    streamingTranscription: boolean,
    transcriptionSocket: RealtimeTranscriptionSocket | null,
    transcriptionReady: Promise<void> | null,
    resolveTranscriptionReady: (() => void) | null,
    rejectTranscriptionReady: ((reason?: unknown) => void) | null,
    version: number,
  ): ToolVoiceResources {
    const monitorId = window.setInterval(() => {
      void this.monitorToolVoiceInput(version)
    }, TOOL_VOICE_CHECK_INTERVAL_MS)

    return {
      audioContext,
      analyser,
      audioElement,
      monitorId,
      processorNode,
      processorSink,
      recorder: null,
      sourceNode,
      stream,
      silenceSince: null,
      startedSpeakingAt: null,
      interruptionFrames: 0,
      chunks: [],
      streamingTranscription,
      transcriptionSocket,
      transcriptionReady,
      resolveTranscriptionReady,
      rejectTranscriptionReady,
      transcriptionStarted: false,
      sentPreviousText: false,
      bufferedSpeakingChunks: [],
    }
  }

  private async processToolVoiceTurn(blob: Blob, version: number) {
    const request = this.activeRequest
    if (!request || !this.isCurrentVersion(version)) {
      this.debugWarn('Captured turn ignored because request/version was stale.', {
        blobSize: blob.size,
      })
      return
    }

    const turnId = createSessionIdentity()

    try {
      this.debugLog('Processing captured voice turn.', {
        blobSize: blob.size,
        blobType: blob.type,
        turnId,
      })
      this.setState(
        withVisualState({
          ...this.state,
          active: true,
          status: 'executing',
          stage: 'transcribing',
          turnId,
          error: null,
          lastFailure: null,
          lastEventAt: isoNow(),
          lastCompletedStageAt: isoNow(),
        }),
      )
      this.publishDebugEntry({
        source: 'renderer',
        level: 'log',
        severity: 'log',
        message: 'Transcription requested.',
        mode: request.mode,
        stage: 'transcribing',
        transport: request.runtime,
        sessionAttemptId: this.state.sessionAttemptId,
        turnId,
        transcriptPreview: null,
        responsePreview: this.state.lastResponsePreview,
        toolName: this.state.lastToolCall?.name ?? null,
        errorCode: null,
        errorMessage: null,
        context: this.getDebugContext({
          blobSize: blob.size,
          blobType: blob.type,
          turnId,
        }),
      })
      await this.recordLog(
        'info',
        'Voice pipeline captured a new utterance.',
      )

        const transcript = await this.api.transcribeAudio({
          audioBase64: await blobToBase64(blob),
          mimeType: blob.type || 'audio/webm',
          fileName: getAudioCaptureFileName(blob.type),
          provider: request.transcriptionProvider,
          model: request.transcriptionModel ?? DEFAULT_TRANSCRIPTION_MODEL,
          mode: request.mode,
          sessionAttemptId: this.state.sessionAttemptId ?? undefined,
          turnId,
        })
      this.debugLog('Transcription request completed.', {
        transcriptLength: transcript.length,
        turnId,
      })

      if (!this.isCurrentVersion(version)) {
        return
      }

      if (!transcript) {
        this.debugWarn('Transcription returned no text for captured turn.')
        this.setState(
          withVisualState({
            ...this.state,
            active: true,
            status: 'listening',
            stage: 'ready',
            error: null,
            lastEventAt: isoNow(),
          }),
        )
        return
      }

      await this.handleTranscriptTurn(transcript, request, version, turnId)
    } catch (error) {
      if (!this.isCurrentVersion(version)) {
        return
      }

      if (isVoiceTurnAbortError(error)) {
        const aborted = getVoiceTurnAbortDetails(error)
        if (this.interruptedTurnIds.has(turnId)) {
          this.interruptedTurnIds.delete(turnId)
        }
        this.publishDebugEntry({
          source: 'renderer',
          level: 'warn',
          severity: 'warn',
          message: 'Voice turn cancellation completed.',
          mode: request.mode,
          stage: (aborted?.stage as CortexRealtimeState['stage']) ?? this.state.stage,
          transport: request.runtime,
          sessionAttemptId: this.state.sessionAttemptId,
          turnId,
          transcriptPreview: this.state.lastTranscriptPreview,
          responsePreview: this.state.lastResponsePreview,
          toolName: this.state.lastToolCall?.name ?? null,
          errorCode: 'ABORT_TURN',
          errorMessage: aborted?.reason ?? 'aborted',
          context: this.getDebugContext({
            abortedStage: aborted?.stage ?? null,
            interruptionReason: aborted?.reason ?? null,
            turnId,
          }),
        })
        return
      }

      const message = toErrorMessage(error)
      this.debugError('Tool-voice turn failed.', {
        error: message,
      })
      await this.recordLog('error', `Tool voice turn failed. ${message}`, 'red')
      this.setState(
        withVisualState({
          ...this.state,
          active: true,
          status: 'listening',
          stage: 'ready',
          error: message,
          lastFailure: {
            code: 'voice_turn_failed',
            message,
            stage: this.state.stage,
            timestamp: isoNow(),
          },
          lastEventAt: isoNow(),
        }),
      )
    }
  }

  private async handleTranscriptTurn(
    transcript: string,
    request: CortexRealtimeSessionRequest,
    version: number,
    turnId = createSessionIdentity(),
  ) {
    this.lastUserTranscript = transcript
    const transcriptPreview = truncateText(transcript)
    this.setState(
      withVisualState({
        ...this.state,
        active: true,
        status: 'executing',
        stage: 'responding',
        turnId,
        error: null,
        lastTranscriptPreview: transcriptPreview,
        lastEventAt: isoNow(),
        lastCompletedStageAt: isoNow(),
      }),
    )
    this.publishDebugEntry({
      source: 'renderer',
      level: 'log',
      severity: 'log',
      message: 'Transcript received; generating response.',
      mode: request.mode,
      stage: 'responding',
      transport: request.runtime,
      sessionAttemptId: this.state.sessionAttemptId,
      turnId,
      transcriptPreview,
      responsePreview: this.state.lastResponsePreview,
      toolName: this.state.lastToolCall?.name ?? null,
      errorCode: null,
      errorMessage: null,
      context: this.getDebugContext({
        transcriptPreview,
        turnId,
      }),
    })

    await this.recordLog('info', 'Voice transcription received.')

    const finalText = await this.resolveToolVoiceResponse(
      request,
      [
        {
          type: 'message',
          role: 'user',
          content: transcript,
        },
      ],
      version,
      turnId,
    )
    this.debugLog('Tool-voice response resolution completed.', {
      finalTextLength: finalText.length,
    })

    if (!this.isCurrentVersion(version)) {
      return
    }

    if (!finalText) {
      this.debugWarn('Tool-voice response completed without final text.')
      this.setState(
        withVisualState({
          ...this.state,
          active: true,
          status: 'listening',
          stage: 'ready',
          error: null,
          lastEventAt: isoNow(),
        }),
      )
      return
    }

    const responsePreview = truncateText(finalText)
    this.setState(
      withVisualState({
        ...this.state,
        active: true,
        turnId,
        lastResponsePreview: responsePreview,
        lastEventAt: isoNow(),
      }),
    )

    await this.recordLog(
      'success',
      request.silentOutput ? 'UI director response ready.' : 'Voice response ready.',
      'green',
    )

    if (request.silentOutput) {
      if (finalText) {
        await this.recordLog('info', `UI director summary: ${responsePreview ?? finalText}`)
      }
      this.setState(
        withVisualState({
          ...this.state,
          active: true,
          status: 'listening',
          stage: 'silent_complete',
          error: null,
          lastEventAt: isoNow(),
          lastCompletedStageAt: isoNow(),
        }),
      )
      this.publishDebugEntry({
        source: 'renderer',
        level: 'log',
        severity: 'log',
        message: 'Silent UI response ready.',
        mode: request.mode,
        stage: 'silent_complete',
        transport: request.runtime,
        sessionAttemptId: this.state.sessionAttemptId,
        turnId,
        transcriptPreview: this.state.lastTranscriptPreview,
        responsePreview,
        toolName: this.state.lastToolCall?.name ?? null,
        errorCode: null,
        errorMessage: null,
        context: this.getDebugContext({
          responsePreview,
          turnId,
        }),
      })
      return
    }

    const speech = await this.api.synthesizeSpeech({
      text: finalText,
      provider: request.speechProvider,
      model: request.speechModel ?? DEFAULT_SPEECH_MODEL,
      voice: request.voice,
      voiceSettings: request.voiceSettings,
      pronunciationDictionaries: request.pronunciationDictionaries,
      format: 'mp3',
      mode: request.mode,
      sessionAttemptId: this.state.sessionAttemptId ?? undefined,
      turnId,
    })
    this.debugLog('Speech synthesis completed.', {
      mimeType: speech.mimeType,
      audioBase64Length: speech.audioBase64.length,
      responsePreview,
      turnId,
    })

    if (!this.isCurrentVersion(version)) {
      return
    }

    const resources = this.toolVoiceResources
    if (!resources) {
      return
    }

    this.setState(
      withVisualState({
        ...this.state,
        active: true,
        status: 'speaking',
        stage: 'speaking',
        turnId,
        error: null,
        lastResponsePreview: responsePreview,
        lastEventAt: isoNow(),
        lastCompletedStageAt: isoNow(),
      }),
    )
    resources.audioElement.src = `data:${speech.mimeType};base64,${speech.audioBase64}`

    try {
      await resources.audioElement.play()
      this.publishDebugEntry({
        source: 'renderer',
        level: 'log',
        severity: 'log',
        message: 'Speech playback requested.',
        mode: request.mode,
        stage: 'speaking',
        transport: request.runtime,
        sessionAttemptId: this.state.sessionAttemptId,
        turnId,
        transcriptPreview: this.state.lastTranscriptPreview,
        responsePreview,
        toolName: this.state.lastToolCall?.name ?? null,
        errorCode: null,
        errorMessage: null,
        context: this.getDebugContext({
          responsePreview,
          turnId,
        }),
      })
    } catch {
      this.debugWarn('Tool-voice playback failed to start; returning to listening state.')
      this.setState(
        withVisualState({
          ...this.state,
          active: true,
          status: 'listening',
          stage: 'ready',
          error: null,
          lastFailure: {
            code: 'speech_playback_failed',
            message: 'Speech playback could not start.',
            stage: 'speaking',
            timestamp: isoNow(),
          },
          lastEventAt: isoNow(),
        }),
      )
    }
  }

  private async resolveToolVoiceResponse(
    request: CortexRealtimeSessionRequest,
    initialInput: CortexToolVoiceInputItem[],
    version: number,
    turnId: string,
  ) {
    let previousResponseId = this.toolVoicePreviousResponseId
    let input = initialInput
    let finalText = ''

    this.debugLog('Resolving tool-voice response.', {
      initialInputLength: initialInput.length,
      previousResponseId,
    })

    while (this.isCurrentVersion(version)) {
      const response = await this.createToolVoiceResponseWithFallback(
        request,
        input,
        previousResponseId,
        turnId,
      )
      this.debugLog('Received tool-voice model response.', {
        outputCount: response.output.length,
        previousResponseId,
        responseId: response.id,
        turnId,
      })

      previousResponseId = response.id
      finalText = response.outputText || finalText

      const functionCalls = response.output.filter(
        (item): item is Extract<typeof item, { type: 'function_call' }> =>
          item.type === 'function_call',
      )

      if (!functionCalls.length) {
        this.toolVoicePreviousResponseId = previousResponseId
        this.debugLog('Tool-voice response resolved without additional function calls.', {
          finalTextLength: finalText.trim().length,
          responseId: previousResponseId,
        })
        return finalText.trim()
      }

      input = []

      for (const output of functionCalls) {
        this.debugLog('Dispatching tool call from tool-voice response.', {
          callId: output.call_id,
          name: output.name,
        })
        const result = await this.executeToolCall({
          name: output.name,
          call_id: output.call_id,
          arguments: output.arguments,
        }, turnId)

        input.push({
          type: 'function_call_output',
          call_id: output.call_id,
          output: serializeToolOutput(result),
        })
      }
    }

    this.toolVoicePreviousResponseId = previousResponseId
    this.debugWarn('Tool-voice response loop exited because controller version changed.', {
      previousResponseId,
    })
    return finalText.trim()
  }

  private buildTurnInstructions(request: CortexRealtimeSessionRequest) {
    const continuationSections: string[] = []

    if (this.state.lastInterruptionReason || this.state.lastInterruptedResponsePreview) {
      continuationSections.push(
        'Recent interruption context:',
        `- The previous assistant reply was interrupted during ${this.state.lastAbortedStage ?? 'an active stage'} because of ${this.state.lastInterruptionReason ?? 'new user speech'}.`,
        `- Interrupted reply preview: ${this.state.lastInterruptedResponsePreview ?? 'not available'}.`,
        '- Continue naturally from the user interruption instead of restarting the conversation from scratch.',
      )
    }

    if (this.recentToolResultSummaries.length) {
      continuationSections.push(
        'Recent tool result summaries for continuity:',
        ...this.recentToolResultSummaries.map((summary) => `- ${summary}`),
      )
    }

    if (!continuationSections.length) {
      return request.instructions
    }

    return [request.instructions, '', ...continuationSections].join('\n')
  }

  private async createToolVoiceResponseWithFallback(
    request: CortexRealtimeSessionRequest,
    input: CortexToolVoiceInputItem[],
    previousResponseId: string | null,
    turnId: string,
  ) {
    const latestRequest = this.activeRequest
      ? {
          ...this.getSessionRequest(),
          mode: this.activeRequest.mode,
          runtime: this.activeRequest.runtime,
          textModel: this.activeRequest.textModel,
          transcriptionModel: this.activeRequest.transcriptionModel,
          speechModel: this.activeRequest.speechModel,
          voice: this.activeRequest.voice,
          silentOutput: this.activeRequest.silentOutput,
          navigationPolicy: this.activeRequest.navigationPolicy,
          toolPreference: this.activeRequest.toolPreference,
          preferredToolGroups: this.activeRequest.preferredToolGroups,
        }
      : request

    try {
      return await this.api.createToolVoiceResponse({
        model: latestRequest.textModel ?? DEFAULT_TEXT_MODEL,
        instructions: this.buildTurnInstructions(latestRequest),
        tools: latestRequest.tools,
        input,
        previousResponseId,
        mode: latestRequest.mode,
        sessionAttemptId: this.state.sessionAttemptId ?? undefined,
        turnId,
      })
    } catch (error) {
      if (!previousResponseId) {
        throw error
      }

      const message = toErrorMessage(error)
      this.publishDebugEntry({
        source: 'renderer',
        level: 'warn',
        severity: 'warn',
        message: 'Response continuation failed; retrying with full-context replay.',
        mode: latestRequest.mode,
        stage: this.state.stage,
        transport: latestRequest.runtime,
        sessionAttemptId: this.state.sessionAttemptId,
        turnId,
        transcriptPreview: this.state.lastTranscriptPreview,
        responsePreview: this.state.lastResponsePreview,
        toolName: this.state.lastToolCall?.name ?? null,
        errorCode: 'previous_response_retry',
        errorMessage: message,
        context: this.getDebugContext({
          previousResponseId,
          turnId,
        }),
      })

      return this.api.createToolVoiceResponse({
        model: latestRequest.textModel ?? DEFAULT_TEXT_MODEL,
        instructions: this.buildTurnInstructions(latestRequest),
        tools: latestRequest.tools,
        input,
        previousResponseId: null,
        mode: latestRequest.mode,
        sessionAttemptId: this.state.sessionAttemptId ?? undefined,
        turnId,
      })
    }
  }

  private summarizeToolResult(toolName: string, result: unknown) {
    const compact = truncateText(
      typeof result === 'string' ? result : JSON.stringify(result),
      180,
    )

    if (!compact) {
      return
    }

    this.recentToolResultSummaries = [
      `${toolName}: ${compact}`,
      ...this.recentToolResultSummaries.filter((entry) => !entry.startsWith(`${toolName}:`)),
    ].slice(0, 6)
  }

  private readonly handleAudioPause = () => {
    if (!this.state.active) {
      return
    }

    this.debugLog('Audio element paused.')
    this.setState(
      withVisualState({
        ...this.state,
        status: 'listening',
        stage: 'ready',
        lastEventAt: isoNow(),
      }),
    )
  }

  private readonly handleAudioPlaying = () => {
    if (!this.state.active) {
      return
    }

    this.debugLog('Audio element started playing.')
    this.setState(
      withVisualState({
        ...this.state,
        status: 'speaking',
        stage: 'speaking',
        lastEventAt: isoNow(),
        lastCompletedStageAt: isoNow(),
      }),
    )
    this.publishDebugEntry({
      source: 'renderer',
      level: 'log',
      severity: 'log',
      message: 'Speech playback started.',
      mode: this.activeRequest?.mode ?? 'unknown',
      stage: 'speaking',
      transport: this.activeRequest?.runtime,
      sessionAttemptId: this.state.sessionAttemptId,
      turnId: this.state.turnId,
      transcriptPreview: this.state.lastTranscriptPreview,
      responsePreview: this.state.lastResponsePreview,
      toolName: this.state.lastToolCall?.name ?? null,
      errorCode: null,
      errorMessage: null,
      context: this.getDebugContext(),
    })
  }

  private readonly handleDataChannelMessage = async (event: MessageEvent<string>) => {
    const payload = safeParseJson(event.data) as RealtimeEvent
    this.debugLog('Received data channel message.', {
      eventType: payload.type ?? 'unknown',
    })
    await this.handleRealtimeEvent(payload)
  }

  private readonly handleUnexpectedChannelClose = async () => {
    if (!this.state.active && this.state.status !== 'connecting') {
      return
    }

    this.debugWarn('Data channel closed unexpectedly.')
    this.cleanupAllResources()
    this.activeRequest = null
    await this.transitionToError('Realtime voice connection closed unexpectedly.')
  }

  private readonly handleUnexpectedChannelError = async () => {
    this.debugError('Data channel emitted an unexpected error.')
    await this.transitionToError('Realtime voice data channel encountered an error.')
  }

  private cleanupAllResources() {
    this.debugLog('Cleaning up all realtime resources.')
    this.cleanupResources()
    this.cleanupToolVoiceResources()
  }

  private cleanupResources(resources: ControllerResources | null = this.resources) {
    if (!resources) {
      return
    }

    this.debugLog('Cleaning up WebRTC resources.', {
      channelState: resources.dataChannel.readyState,
      connectionState: resources.peerConnection.connectionState,
    })

    try {
      resources.audioElement.pause()
    } catch {
      // JSDOM does not implement HTMLMediaElement pause/play behavior.
    }
    resources.audioElement.removeEventListener('playing', this.handleAudioPlaying)
    resources.audioElement.removeEventListener('pause', this.handleAudioPause)
    resources.audioElement.removeEventListener('ended', this.handleAudioPause)
    resources.audioElement.srcObject = null

    resources.dataChannel.removeEventListener('message', this.handleDataChannelMessage)
    resources.dataChannel.removeEventListener('close', this.handleUnexpectedChannelClose)
    resources.dataChannel.removeEventListener('error', this.handleUnexpectedChannelError)

    if (resources.dataChannel.readyState === 'open' || resources.dataChannel.readyState === 'connecting') {
      resources.dataChannel.close()
    }

    resources.peerConnection.ontrack = null
    if (resources.peerConnection.signalingState !== 'closed') {
      resources.peerConnection.close()
    }

    resources.stream.getTracks().forEach((track) => track.stop())

    if (this.resources === resources) {
      this.resources = null
    }
  }

  private cleanupToolVoiceResources(resources: ToolVoiceResources | null = this.toolVoiceResources) {
    if (!resources) {
      return
    }

    this.debugLog('Cleaning up local voice resources.', {
      recorderState: resources.recorder?.state ?? 'inactive',
    })

    window.clearInterval(resources.monitorId)

    if (resources.recorder && resources.recorder.state !== 'inactive') {
      resources.recorder.stop()
    }

    resources.rejectTranscriptionReady?.(new Error('Realtime transcription session closed.'))
    resources.resolveTranscriptionReady = null
    resources.rejectTranscriptionReady = null

    if (resources.processorNode) {
      resources.processorNode.onaudioprocess = null
      resources.processorNode.disconnect()
    }

    if (resources.processorSink) {
      resources.processorSink.disconnect()
    }

    const transcriptionSocket = resources.transcriptionSocket
    resources.transcriptionSocket = null
    if (
      transcriptionSocket &&
      (transcriptionSocket.readyState === SOCKET_READY_STATE_OPEN ||
        transcriptionSocket.readyState === SOCKET_READY_STATE_CONNECTING)
    ) {
      transcriptionSocket.close()
    }

    try {
      resources.audioElement.pause()
    } catch {
      // JSDOM does not implement HTMLMediaElement pause/play behavior.
    }

    resources.audioElement.removeEventListener('playing', this.handleAudioPlaying)
    resources.audioElement.removeEventListener('pause', this.handleAudioPause)
    resources.audioElement.removeEventListener('ended', this.handleAudioPause)
    resources.audioElement.src = ''

    resources.sourceNode.disconnect()
    resources.stream.getTracks().forEach((track) => track.stop())
    void resources.audioContext.close()

    if (this.toolVoiceResources === resources) {
      this.toolVoiceResources = null
    }
  }

  private isCurrentVersion(version: number) {
    return version === this.version
  }

  private async handleRealtimeEvent(event: RealtimeEvent) {
    this.debugLog('Handling realtime event.', {
      eventType: event.type ?? 'unknown',
      hasError: Boolean(event.error?.message),
      outputCount: event.response?.output?.length ?? 0,
    })
    if (event.session?.id && event.session.id !== this.state.sessionId) {
      this.setState({
        ...this.state,
        sessionId: event.session.id,
        lastEventAt: isoNow(),
      })
    }

    switch (event.type) {
      case 'session.created':
        await this.recordLog('info', 'Realtime session created.')
        break
      case 'response.created':
        if (this.state.active && this.state.status !== 'executing') {
          this.setState(
            withVisualState({
            ...this.state,
            status: 'speaking',
            lastEventAt: isoNow(),
            }),
          )
        }
        await this.recordLog('info', 'Realtime response generation started.')
        break
      case 'response.done':
        await this.handleResponseDone(event)
        break
      case 'session.updated':
        if (this.state.active && this.state.status !== 'executing') {
          this.setState(
            withVisualState({
            ...this.state,
            status: 'listening',
            lastEventAt: isoNow(),
            }),
          )
        }
        await this.recordLog('info', 'Realtime session updated.')
        break
      case 'input_audio_buffer.speech_started':
        await this.recordLog('info', 'Realtime session detected speech input.')
        break
      case 'input_audio_buffer.speech_stopped':
        await this.recordLog('info', 'Realtime session finished receiving speech input.')
        break
      case 'response.audio_transcript.done':
        await this.recordLog('info', 'Realtime assistant transcript completed.')
        break
      case 'error':
        await this.transitionToError(
          event.error?.message ?? 'Realtime voice reported a session error.',
        )
        break
      default:
        break
    }
  }

  private async handleResponseDone(event: RealtimeEvent) {
    const outputs = event.response?.output ?? []
    const functionCalls = outputs.filter(isFunctionCallOutput)
    this.debugLog('Handling response.done event.', {
      outputCount: outputs.length,
      functionCallCount: functionCalls.length,
    })

    if (!functionCalls.length) {
      if (this.state.active) {
        this.setState(
          withVisualState({
          ...this.state,
          status: 'listening',
          lastEventAt: isoNow(),
          }),
        )
      }
      return
    }

    for (const output of functionCalls) {
      this.debugLog('Executing response.done function call.', {
        callId: output.call_id,
        name: output.name,
      })
      const result = await this.executeFunctionCall(output)

      this.sendEvent({
        type: 'conversation.item.create',
        item: {
          type: 'function_call_output',
          call_id: output.call_id,
          output: serializeToolOutput(result),
        },
      })
      this.debugLog('Sent function_call_output back to realtime session.', {
        callId: output.call_id,
      })
    }

    this.sendEvent(buildRealtimeResponseCreateEvent())
    this.debugLog('Requested follow-up realtime response after tool outputs.')
  }

  private async executeToolCall(output: {
    name?: string
    call_id?: string
    arguments?: string
  }, turnId?: string) {
    return this.executeFunctionCall(output, turnId)
  }

  private async executeFunctionCall(output: {
    name?: string
    call_id?: string
    arguments?: string
  }, turnId = this.state.turnId ?? createSessionIdentity()) {
    if (!output.name || !output.call_id) {
      this.debugWarn('Tool call missing metadata and will return an error.', {
        name: output.name ?? null,
        callId: output.call_id ?? null,
      })
      return {
        ok: false,
        error: 'Tool call missing required metadata.',
      }
    }

    const toolCall: CortexRealtimeToolCall = {
      name: output.name,
      callId: output.call_id,
      arguments: safeParseJson(output.arguments),
      ...(this.lastUserTranscript ? { transcript: this.lastUserTranscript } : {}),
      ...(this.activeRequest ? { mode: this.activeRequest.mode } : {}),
    }
    const toolDefinition = this.activeRequest?.tools.find((tool) => tool.name === toolCall.name)
    const properties = toolDefinition?.parameters.properties ?? {}
    const required = toolDefinition?.parameters.required ?? []
    const argumentKeys = Object.keys(toolCall.arguments)

    if (!toolDefinition) {
      return {
        ok: false,
        error: `Unknown realtime tool requested: ${toolCall.name}.`,
      }
    }

    if (toolDefinition.parameters.additionalProperties === false) {
      const unsupported = argumentKeys.find((key) => !(key in properties))
      if (unsupported) {
        return {
          ok: false,
          error: `Tool ${toolCall.name} received unsupported argument ${unsupported}.`,
        }
      }
    }

    const missingRequired = required.find((key) => !(key in toolCall.arguments))
    if (missingRequired) {
      return {
        ok: false,
        error: `Tool ${toolCall.name} is missing required argument ${missingRequired}.`,
      }
    }

    this.setState(
      withVisualState({
        ...this.state,
        active: true,
        status: 'executing',
        stage: 'tooling',
        turnId,
        lastToolCall: toolCall,
        lastEventAt: isoNow(),
        lastCompletedStageAt: isoNow(),
      }),
    )
    this.publishDebugEntry({
      source: 'renderer',
      level: 'log',
      severity: 'log',
      message: 'Tool call requested.',
      mode: this.activeRequest?.mode ?? 'unknown',
      stage: 'tooling',
      transport: this.activeRequest?.runtime,
      sessionAttemptId: this.state.sessionAttemptId,
      turnId,
      transcriptPreview: this.state.lastTranscriptPreview,
      responsePreview: this.state.lastResponsePreview,
      toolName: toolCall.name,
      errorCode: null,
      errorMessage: null,
      context: this.getDebugContext({
        arguments: toolCall.arguments,
        callId: toolCall.callId,
      }),
    })
    await this.recordLog('info', `Voice tool call: ${toolCall.name}.`)
    this.debugLog('Dispatching tool call to app layer.', {
      callId: toolCall.callId,
      name: toolCall.name,
      arguments: toolCall.arguments,
    })

    try {
      const result = await this.onToolCall(toolCall)
      this.summarizeToolResult(toolCall.name, result)
      this.debugLog('Tool call completed successfully.', {
        callId: toolCall.callId,
        name: toolCall.name,
      })
      this.publishDebugEntry({
        source: 'renderer',
        level: 'log',
        severity: 'log',
        message: 'Tool call completed.',
        mode: this.activeRequest?.mode ?? 'unknown',
        stage: 'tooling',
        transport: this.activeRequest?.runtime,
        sessionAttemptId: this.state.sessionAttemptId,
        turnId,
        transcriptPreview: this.state.lastTranscriptPreview,
        responsePreview: this.state.lastResponsePreview,
        toolName: toolCall.name,
        errorCode: null,
        errorMessage: null,
        context: this.getDebugContext({
          callId: toolCall.callId,
        }),
      })
      await this.recordLog('success', `Voice tool completed: ${toolCall.name}.`, 'green')
      return result
    } catch (error) {
      const message = toErrorMessage(error)
      this.summarizeToolResult(toolCall.name, { ok: false, error: message })
      this.debugWarn('Tool call failed.', {
        callId: toolCall.callId,
        name: toolCall.name,
        error: message,
      })
      await this.recordLog('warning', `Voice tool failed: ${toolCall.name}. ${message}`, 'amber')
      return {
        ok: false,
        error: message,
      }
    }
  }

  private sendEvent(event: JsonRecord) {
    this.debugWarn('Skipped experimental realtime event because WebRTC is not the active product runtime.', {
      eventType: typeof event.type === 'string' ? event.type : 'unknown',
    })
  }

  private async transitionToError(message: string) {
    this.debugError('Transitioning controller into error state.', {
      error: message,
    })
    this.cleanupAllResources()
    this.activeRequest = null
    this.toolVoicePreviousResponseId = null
    this.lastUserTranscript = null
    this.setState(
      withVisualState({
        ...DEFAULT_REALTIME_STATE,
        status: 'error',
        stage: 'error',
        error: message,
        lastFailure: {
          code: 'voice_pipeline_error',
          message,
          stage: 'error',
          timestamp: isoNow(),
        },
        lastEventAt: isoNow(),
      }),
    )
    await this.recordLog('error', message, 'red')
  }

  private async recordLog(
    severity: 'info' | 'success' | 'warning' | 'error',
    message: string,
    accent?: 'cyan' | 'green' | 'amber' | 'red',
  ) {
    try {
      await this.api.recordRealtimeLog({
        channel: 'realtime',
        severity,
        message,
        accent,
      })
    } catch {
      // Logging failures should never take down the voice session.
    }
  }

  private setState(state: CortexRealtimeState) {
    const nextState = withVisualState(state)
    const previousState = this.state
    this.state = nextState
    if (
      previousState.status !== nextState.status ||
      previousState.stage !== nextState.stage ||
      previousState.active !== nextState.active ||
      previousState.visualState !== nextState.visualState ||
      previousState.error !== nextState.error
    ) {
      this.debugLog('Realtime state updated.', {
        next: {
          active: nextState.active,
          error: nextState.error,
          stage: nextState.stage,
          status: nextState.status,
          visualState: nextState.visualState,
        },
        previous: {
          active: previousState.active,
          error: previousState.error,
          stage: previousState.stage,
          status: previousState.status,
          visualState: previousState.visualState,
        },
      })
    }
    this.onStateChange(nextState)
  }
}
