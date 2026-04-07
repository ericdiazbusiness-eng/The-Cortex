import {
  CORTEX_REALTIME_MODE_PROFILES,
  DEFAULT_REALTIME_STATE,
  type CortexBridge,
  type CortexDashboardSnapshot,
  type CortexRealtimeMode,
  type CortexRealtimeSessionRequest,
  type CortexRealtimeState,
  type CortexRealtimeStatus,
  type CortexRealtimeToolCall,
  type CortexRealtimeToolDefinition,
  type CortexRoute,
  type CortexSystemMetricKey,
  type CortexToolVoiceInputItem,
  type CortexViewContext,
} from '@/shared/cortex'

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
  recorder: MediaRecorder | null
  sourceNode: MediaStreamAudioSourceNode
  stream: MediaStream
  silenceSince: number | null
  startedSpeakingAt: number | null
  chunks: Blob[]
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
    audio: true,
  })
}

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

const OPEN_TIMEOUT_MS = 10_000
const CONNECTION_TIMEOUT_MS = 12_000
const TOOL_VOICE_CHECK_INTERVAL_MS = 180
const TOOL_VOICE_SILENCE_MS = 900
const TOOL_VOICE_THRESHOLD = 10
const TOOL_VOICE_TIMESLICE_MS = 250
const TOOL_VOICE_RECORDER_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
] as const
const DEFAULT_REALTIME_MODEL = 'gpt-realtime-1.5'
const DEFAULT_REALTIME_VOICE = 'marin'
const DEFAULT_TRANSCRIPTION_MODEL = 'gpt-4o-mini-transcribe'
const ROUTE_OPTIONS: CortexRoute[] = ['/', '/agents', '/memories', '/schedules', '/system']
const SYSTEM_METRIC_OPTIONS: CortexSystemMetricKey[] = [
  'throughput',
  'memoryIntegrity',
  'activeNodes',
  'queueDepth',
]

const isLiveStatus = (status: CortexRealtimeStatus) =>
  status === 'connecting' ||
  status === 'listening' ||
  status === 'speaking' ||
  status === 'executing'

const withVisualState = (state: CortexRealtimeState): CortexRealtimeState => ({
  ...state,
  visualState: isLiveStatus(state.status) && state.active ? 'on' : 'off',
})

const waitForIceGatheringComplete = async (peerConnection: RTCPeerConnection) => {
  if (peerConnection.iceGatheringState === 'complete') {
    return
  }

  await new Promise<void>((resolve) => {
    const timeout = window.setTimeout(() => {
      cleanup()
      resolve()
    }, 2_000)

    const handleStateChange = () => {
      if (peerConnection.iceGatheringState === 'complete') {
        cleanup()
        resolve()
      }
    }

    const cleanup = () => {
      window.clearTimeout(timeout)
      peerConnection.removeEventListener('icegatheringstatechange', handleStateChange)
    }

    peerConnection.addEventListener('icegatheringstatechange', handleStateChange)
  })
}

const waitForOpenChannel = async (channel: RTCDataChannel) => {
  if (channel.readyState === 'open') {
    return
  }

  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup()
      reject(new Error('Realtime data channel timed out before opening.'))
    }, OPEN_TIMEOUT_MS)

    const handleOpen = () => {
      cleanup()
      resolve()
    }
    const handleError = () => {
      cleanup()
      reject(new Error('Realtime data channel failed to open.'))
    }

    const cleanup = () => {
      window.clearTimeout(timeout)
      channel.removeEventListener('open', handleOpen)
      channel.removeEventListener('error', handleError)
    }

    channel.addEventListener('open', handleOpen, { once: true })
    channel.addEventListener('error', handleError, { once: true })
  })
}

const waitForPeerConnectionReady = async (peerConnection: RTCPeerConnection) => {
  const connectionState = peerConnection.connectionState
  const iceState = peerConnection.iceConnectionState

  if (connectionState === 'connected') {
    return
  }

  if (iceState === 'connected' || iceState === 'completed') {
    return
  }

  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup()
      reject(new Error('Realtime peer connection timed out before becoming ready.'))
    }, CONNECTION_TIMEOUT_MS)

    const handleStateChange = () => {
      const nextConnectionState = peerConnection.connectionState
      const nextIceState = peerConnection.iceConnectionState

      if (
        nextConnectionState === 'connected' ||
        nextIceState === 'connected' ||
        nextIceState === 'completed'
      ) {
        cleanup()
        resolve()
        return
      }

      if (
        nextConnectionState === 'failed' ||
        nextConnectionState === 'closed' ||
        nextConnectionState === 'disconnected' ||
        nextIceState === 'failed' ||
        nextIceState === 'closed' ||
        nextIceState === 'disconnected'
      ) {
        cleanup()
        reject(new Error('Realtime peer connection failed before becoming ready.'))
      }
    }

    const cleanup = () => {
      window.clearTimeout(timeout)
      peerConnection.removeEventListener('connectionstatechange', handleStateChange)
      peerConnection.removeEventListener('iceconnectionstatechange', handleStateChange)
    }

    peerConnection.addEventListener('connectionstatechange', handleStateChange)
    peerConnection.addEventListener('iceconnectionstatechange', handleStateChange)
  })
}

const serializeToolOutput = (value: unknown) =>
  JSON.stringify(
    value && typeof value === 'object'
      ? value
      : {
          value,
        },
  )

export const buildRealtimeToolDefinitions = (
  snapshot: CortexDashboardSnapshot | null,
): CortexRealtimeToolDefinition[] => {
  const commandIds = snapshot?.commands.map((command) => command.id) ?? []
  const agentIds = snapshot?.agents.map((agent) => agent.id) ?? []
  const memoryIds = snapshot?.memories.map((memory) => memory.id) ?? []
  const jobIds = snapshot?.jobs.map((job) => job.id) ?? []
  const marketingMetricIds = snapshot?.marketingMetrics.map((metric) => metric.id) ?? []

  return [
    {
      type: 'function',
      name: 'get_dashboard_snapshot',
      description: 'Return the full structured dashboard snapshot for the current Cortex session.',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
    },
    {
      type: 'function',
      name: 'get_system_metrics',
      description: 'Return the current system health metrics from the dashboard snapshot.',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
    },
    {
      type: 'function',
      name: 'list_agents',
      description: 'List known agents, optionally filtered by agent status.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            description: 'Optional agent status filter.',
          },
        },
        additionalProperties: false,
      },
    },
    {
      type: 'function',
      name: 'list_memories',
      description: 'List memories, with optional filtering by agent ID or free-text search.',
      parameters: {
        type: 'object',
        properties: {
          agentId: {
            type: 'string',
            description: 'Optional agent ID filter.',
          },
          query: {
            type: 'string',
            description: 'Optional free-text filter over memory title, detail, and keywords.',
          },
          limit: {
            type: 'number',
            description: 'Optional result limit.',
          },
        },
        additionalProperties: false,
      },
    },
    {
      type: 'function',
      name: 'list_schedules',
      description: 'List scheduled jobs, optionally filtered by job status.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            description: 'Optional job status filter.',
          },
        },
        additionalProperties: false,
      },
    },
    {
      type: 'function',
      name: 'list_recent_logs',
      description: 'List recent log events from the current runtime.',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Maximum number of log events to return.',
          },
        },
        additionalProperties: false,
      },
    },
    {
      type: 'function',
      name: 'get_ui_context',
      description: 'Return the current route, mode, and page-local context from the UI.',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
    },
    {
      type: 'function',
      name: 'navigate_ui',
      description: 'Navigate the dashboard to a specific page when it helps reveal the requested information.',
      parameters: {
        type: 'object',
        properties: {
          route: {
            type: 'string',
            description: 'Dashboard route to open.',
            enum: ROUTE_OPTIONS,
          },
        },
        required: ['route'],
        additionalProperties: false,
      },
    },
    {
      type: 'function',
      name: 'focus_agent',
      description: 'Open the ZiBz page and focus a specific agent card.',
      parameters: {
        type: 'object',
        properties: {
          agentId: {
            type: 'string',
            description: 'Agent ID to focus.',
            enum: agentIds,
          },
        },
        required: ['agentId'],
        additionalProperties: false,
      },
    },
    {
      type: 'function',
      name: 'focus_memory',
      description: 'Open Ops Memory and focus a specific memory record.',
      parameters: {
        type: 'object',
        properties: {
          memoryId: {
            type: 'string',
            description: 'Memory ID to focus.',
            enum: memoryIds,
          },
          agentId: {
            type: 'string',
            description: 'Optional agent ID filter to apply first.',
            enum: agentIds,
          },
        },
        required: ['memoryId'],
        additionalProperties: false,
      },
    },
    {
      type: 'function',
      name: 'focus_schedule',
      description: 'Open Schedules and focus a specific scheduled job.',
      parameters: {
        type: 'object',
        properties: {
          jobId: {
            type: 'string',
            description: 'Scheduled job ID to focus.',
            enum: jobIds,
          },
        },
        required: ['jobId'],
        additionalProperties: false,
      },
    },
    {
      type: 'function',
      name: 'focus_system_metric',
      description: 'Open Runtime / Logs and highlight a specific diagnostic metric card.',
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
      name: 'focus_marketing_metric',
      description:
        'Open the ZiB001 marketing lane on the ZiBz page and highlight a specific marketing metric.',
      parameters: {
        type: 'object',
        properties: {
          metricId: {
            type: 'string',
            description: 'Marketing metric ID to highlight.',
            enum: marketingMetricIds,
          },
        },
        required: ['metricId'],
        additionalProperties: false,
      },
    },
    {
      type: 'function',
      name: 'run_command',
      description:
        'Run one of the currently available Cortex commands. Use only when the user explicitly asks to execute an action.',
      parameters: {
        type: 'object',
        properties: {
          commandId: {
            type: 'string',
            description: 'Command ID to execute.',
            enum: commandIds,
          },
          context: {
            type: 'string',
            description: 'Short explanation of why this command is being run.',
          },
        },
        required: ['commandId'],
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
  snapshot: CortexDashboardSnapshot | null,
  viewContext: CortexViewContext,
  realtimeMode: CortexRealtimeMode,
) => {
  const commands =
    snapshot?.commands.length
      ? snapshot.commands.map((command) => `${command.id}: ${command.description}`).join('\n')
      : 'No commands are currently available.'
  const modeProfile = CORTEX_REALTIME_MODE_PROFILES[realtimeMode]
  const replyStyle =
    modeProfile.silentOutput
      ? 'Do not produce spoken filler or conversational audio replies in this mode.'
      : realtimeMode === 'tool_voice'
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
    'You are The Cortex realtime voice copilot inside a live dashboard.',
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
    `Mode silent output: ${modeProfile.silentOutput ? 'enabled' : 'disabled'}.`,
    `Mode tool priority: ${describeToolPriority(modeProfile.preferredToolGroups)}.`,
    `Mode navigation policy: ${modeProfile.navigationPolicy}.`,
    `Current route: ${viewContext.routeTitle} (${viewContext.route}).`,
    `Current route subtitle: ${viewContext.routeSubtitle}.`,
    `Current UI mode: ${viewContext.uiMode}.`,
    `Current UI details: ${stringifyViewDetails(viewContext.details)}.`,
    'Available command IDs:',
    commands,
  ].join('\n')
}

export const buildRealtimeSessionRequest = (
  snapshot: CortexDashboardSnapshot | null,
  viewContext: CortexViewContext,
  realtimeMode: CortexRealtimeMode,
): CortexRealtimeSessionRequest => ({
  instructions: buildRealtimeInstructions(snapshot, viewContext, realtimeMode),
  tools: buildRealtimeToolDefinitions(snapshot),
  context: viewContext,
  mode: realtimeMode,
  engine: CORTEX_REALTIME_MODE_PROFILES[realtimeMode].engine,
  model: CORTEX_REALTIME_MODE_PROFILES[realtimeMode].model,
  textModel: CORTEX_REALTIME_MODE_PROFILES[realtimeMode].textModel,
  transcriptionModel: CORTEX_REALTIME_MODE_PROFILES[realtimeMode].transcriptionModel,
  speechModel: CORTEX_REALTIME_MODE_PROFILES[realtimeMode].speechModel,
  voice: CORTEX_REALTIME_MODE_PROFILES[realtimeMode].voice,
  silentOutput: CORTEX_REALTIME_MODE_PROFILES[realtimeMode].silentOutput,
  navigationPolicy: CORTEX_REALTIME_MODE_PROFILES[realtimeMode].navigationPolicy,
  toolPreference: CORTEX_REALTIME_MODE_PROFILES[realtimeMode].toolPreference,
  preferredToolGroups: CORTEX_REALTIME_MODE_PROFILES[realtimeMode].preferredToolGroups,
})

const buildRealtimeSessionUpdate = (
  request: CortexRealtimeSessionRequest,
  options: {
    disableAudioTurnDetection?: boolean
  } = {},
) => ({
  type: 'realtime',
  model: request.model ?? DEFAULT_REALTIME_MODEL,
  instructions: request.instructions,
  tools: request.tools,
  tool_choice: 'auto',
  output_modalities: ['audio'],
  audio: {
    input: options.disableAudioTurnDetection
      ? {
          turn_detection: null,
        }
      : {
          turn_detection: {
            type: 'semantic_vad',
            create_response: true,
            interrupt_response: true,
            eagerness: 'auto',
          },
        },
    output: {
      voice: request.voice ?? DEFAULT_REALTIME_VOICE,
    },
  },
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

  private readonly onStateChange: (state: CortexRealtimeState) => void

  private readonly onToolCall: ToolCallHandler

  private readonly rtcPeerConnectionFactory: () => RTCPeerConnection

  private activeRequest: CortexRealtimeSessionRequest | null = null

  private resources: ControllerResources | null = null

  private state: CortexRealtimeState = DEFAULT_REALTIME_STATE

  private toolVoiceResources: ToolVoiceResources | null = null

  private toolVoicePreviousResponseId: string | null = null

  private lastUserTranscript: string | null = null

  private localTurnCaptureEnabled = false

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
    this.onStateChange = dependencies.onStateChange
    this.onToolCall = dependencies.onToolCall
    this.rtcPeerConnectionFactory =
      options.rtcPeerConnectionFactory ?? (() => new RTCPeerConnection())
  }

  async toggle() {
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
    this.localTurnCaptureEnabled = false

    this.setState(
      withVisualState({
      ...DEFAULT_REALTIME_STATE,
      active: true,
      sessionId,
      status: 'connecting',
      lastEventAt: isoNow(),
      }),
    )
    await this.recordLog(
      'info',
      `Realtime voice connection requested for ${request.mode} (${request.model ?? request.textModel ?? 'default'}).`,
    )

    try {
      if (request.engine === 'tool_voice') {
        await this.startToolVoice(version, request)
        return
      }

      const stream = await this.getUserMedia({
        audio: true,
      })

      if (!this.isCurrentVersion(version)) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      const peerConnection = this.rtcPeerConnectionFactory()
      const audioElement = this.createAudioElement()
      const dataChannel = peerConnection.createDataChannel('oai-events')

      audioElement.autoplay = true
      ;(audioElement as HTMLAudioElement & { playsInline?: boolean }).playsInline = true
      audioElement.addEventListener('playing', this.handleAudioPlaying)
      audioElement.addEventListener('pause', this.handleAudioPause)
      audioElement.addEventListener('ended', this.handleAudioPause)

      peerConnection.ontrack = (event) => {
        const [remoteStream] = event.streams
        if (remoteStream) {
          audioElement.srcObject = remoteStream
          void audioElement.play().catch(() => {
            // If autoplay is blocked, the live connection still remains active.
          })
        }
      }

      dataChannel.addEventListener('message', this.handleDataChannelMessage)
      dataChannel.addEventListener('close', this.handleUnexpectedChannelClose)
      dataChannel.addEventListener('error', this.handleUnexpectedChannelError)

      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream)
      })

      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)
      await waitForIceGatheringComplete(peerConnection)
      await this.recordLog('info', 'Realtime SDP offer prepared.')

      const answerSdp = await this.api.createRealtimeCall(
        peerConnection.localDescription?.sdp ?? offer.sdp ?? '',
        request,
      )
      await this.recordLog('info', 'Realtime SDP answer received from OpenAI.')

      if (!this.isCurrentVersion(version)) {
        this.cleanupResources({
          audioElement,
          dataChannel,
          peerConnection,
          stream,
        })
        return
      }

      await peerConnection.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp,
      })
      await this.recordLog('info', 'Realtime remote description applied.')

      this.resources = {
        audioElement,
        dataChannel,
        peerConnection,
        stream,
      }

      await Promise.all([
        waitForOpenChannel(dataChannel),
        waitForPeerConnectionReady(peerConnection),
      ])
      await this.recordLog('info', 'Realtime data channel and peer connection are ready.')

      if (!this.isCurrentVersion(version)) {
        await this.stop()
        return
      }

      await this.recordLog('info', 'Realtime microphone track attached to the WebRTC session.')
      const localCaptureArmed = await this.beginRealtimeVoiceCapture(
        version,
        stream,
        audioElement,
        false,
      )
      this.localTurnCaptureEnabled = localCaptureArmed

      this.sendSessionUpdate()
      await this.recordLog('info', 'Realtime session configuration sent.')
      await this.recordLog(
        'info',
        localCaptureArmed
          ? 'Realtime local voice capture armed.'
          : 'Realtime local voice capture unavailable; using server-side speech detection.',
      )
      this.setState(
        withVisualState({
        ...this.state,
        active: true,
        status: 'listening',
        error: null,
        lastEventAt: isoNow(),
        }),
      )
      await this.recordLog('success', 'Realtime voice connected and listening.', 'green')
    } catch (error) {
      if (!this.isCurrentVersion(version)) {
        return
      }

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

    if (wasActive && this.resources) {
      this.sendEvent({
        type: 'response.cancel',
      })
    }

    this.cleanupAllResources()
    this.activeRequest = null
    this.toolVoicePreviousResponseId = null
    this.lastUserTranscript = null
    this.localTurnCaptureEnabled = false
    this.setState(
      withVisualState({
      ...DEFAULT_REALTIME_STATE,
      lastEventAt: isoNow(),
      }),
    )

    if (wasActive) {
      await this.recordLog('info', message)
    }
  }

  async syncSession() {
    if (
      !this.resources ||
      !this.activeRequest ||
      this.resources.dataChannel.readyState !== 'open'
    ) {
      return
    }

    this.sendSessionUpdate()
  }

  async dispose() {
    await this.stop('Realtime voice session disposed.')
  }

  private async startToolVoice(
    version: number,
    request: CortexRealtimeSessionRequest,
  ) {
    const stream = await this.getUserMedia({
      audio: true,
    })

    if (!this.isCurrentVersion(version)) {
      stream.getTracks().forEach((track) => track.stop())
      return
    }

    const audioElement = this.createAudioElement()
    audioElement.autoplay = true
    ;(audioElement as HTMLAudioElement & { playsInline?: boolean }).playsInline = true
    audioElement.addEventListener('playing', this.handleAudioPlaying)
    audioElement.addEventListener('pause', this.handleAudioPause)
    audioElement.addEventListener('ended', this.handleAudioPause)
    this.localTurnCaptureEnabled = await this.beginRealtimeVoiceCapture(
      version,
      stream,
      audioElement,
      true,
    )

    this.setState(
      withVisualState({
        ...this.state,
        active: true,
        status: 'listening',
        error: null,
        lastEventAt: isoNow(),
      }),
    )
    await this.recordLog(
      'success',
      request.silentOutput
        ? `UI director connected with ${request.textModel}.`
        : `Tool voice connected with ${request.textModel}.`,
      'green',
    )
  }

  private async beginRealtimeVoiceCapture(
    version: number,
    stream: MediaStream,
    playbackAudioElement: HTMLAudioElement,
    required: boolean,
  ) {
    try {
      this.cleanupToolVoiceResources()

      const audioContext = this.audioContextFactory()
      await resumeAudioContext(audioContext)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 1024

      const sourceNode = audioContext.createMediaStreamSource(stream)
      sourceNode.connect(analyser)

      this.toolVoiceResources = this.createVoiceCaptureResources(
        stream,
        playbackAudioElement,
        audioContext,
        analyser,
        sourceNode,
        version,
      )

      return true
    } catch (error) {
      this.cleanupToolVoiceResources()

      if (required) {
        throw error
      }

      await this.recordLog(
        'warning',
        `Realtime local capture could not be armed. ${toErrorMessage(error)}`,
        'amber',
      )
      return false
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
      if (audioContext.state === 'suspended') {
        await resumeAudioContext(audioContext)
      }

      if (
        audioContext.state === 'closed' ||
        audioContext.state === 'interrupted' ||
        audioContext.state === 'suspended'
      ) {
        return
      }

      if (!resources.audioElement.paused) {
        return
      }

      const samples = new Uint8Array(resources.analyser.fftSize)
      resources.analyser.getByteTimeDomainData(samples)
      const level =
        samples.reduce((sum, sample) => sum + Math.abs(sample - 128), 0) / samples.length
      const now = performance.now()

      if (level > TOOL_VOICE_THRESHOLD) {
        resources.silenceSince = null
        resources.startedSpeakingAt ??= now
        if (!resources.recorder) {
          this.startToolVoiceRecorder(resources, version)
        }
        return
      }

      if (!resources.recorder) {
        resources.startedSpeakingAt = null
        return
      }

      resources.silenceSince ??= now
      if (now - resources.silenceSince >= TOOL_VOICE_SILENCE_MS) {
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
      await this.recordLog('warning', `Tool voice capture loop hit an error. ${message}`, 'amber')
      this.setState(
        withVisualState({
          ...this.state,
          active: true,
          status: 'listening',
          error: message,
          lastEventAt: isoNow(),
        }),
      )
    }
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

    void this.recordLog('info', `Tool voice recorder started (${recorder.mimeType || preferredMimeType || 'default mime type'}).`)

    recorder.addEventListener('dataavailable', (event) => {
      if (event.data.size > 0) {
        resources.chunks.push(event.data)
      }
    })

    recorder.addEventListener('error', () => {
      resources.recorder = null
      void this.recordLog('warning', 'Tool voice recorder reported an error.', 'amber')
    })

    recorder.addEventListener(
      'stop',
      () => {
        resources.recorder = null
        const blob = new Blob(resources.chunks, {
          type: recorder.mimeType || preferredMimeType || 'audio/webm',
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

  private createVoiceCaptureResources(
    stream: MediaStream,
    audioElement: HTMLAudioElement,
    audioContext: AudioContext,
    analyser: AnalyserNode,
    sourceNode: MediaStreamAudioSourceNode,
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
      recorder: null,
      sourceNode,
      stream,
      silenceSince: null,
      startedSpeakingAt: null,
      chunks: [],
    }
  }

  private async processToolVoiceTurn(blob: Blob, version: number) {
    const request = this.activeRequest
    if (!request || !this.isCurrentVersion(version)) {
      return
    }

    try {
      this.setState(
        withVisualState({
          ...this.state,
          active: true,
          status: 'executing',
          error: null,
          lastEventAt: isoNow(),
        }),
      )
      await this.recordLog(
        'info',
        request.engine === 'tool_voice'
          ? 'Tool voice captured a new utterance.'
          : 'Realtime voice captured a new utterance.',
      )

      const transcript = await this.api.transcribeAudio({
        audioBase64: await blobToBase64(blob),
        mimeType: blob.type || 'audio/webm',
        fileName: getAudioCaptureFileName(blob.type),
        model: request.transcriptionModel ?? DEFAULT_TRANSCRIPTION_MODEL,
      })

      if (!this.isCurrentVersion(version)) {
        return
      }

      if (!transcript) {
        this.setState(
          withVisualState({
            ...this.state,
            active: true,
            status: 'listening',
            error: null,
            lastEventAt: isoNow(),
          }),
        )
        return
      }

      this.lastUserTranscript = transcript

      await this.recordLog(
        'info',
        request.engine === 'tool_voice'
          ? 'Tool voice transcription received.'
          : 'Realtime voice transcription received.',
      )

      if (request.engine === 'webrtc') {
        this.sendTextTurn(transcript)
        await this.recordLog('info', 'Realtime user turn sent to the live session.')
        this.setState(
          withVisualState({
            ...this.state,
            active: true,
            status: 'listening',
            error: null,
            lastEventAt: isoNow(),
          }),
        )
        return
      }

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
      )

      if (!this.isCurrentVersion(version)) {
        return
      }

      if (!finalText) {
        this.setState(
          withVisualState({
            ...this.state,
            active: true,
            status: 'listening',
            error: null,
            lastEventAt: isoNow(),
          }),
        )
        return
      }

      await this.recordLog(
        'success',
        request.silentOutput ? 'UI director response ready.' : 'Tool voice response ready.',
        'green',
      )

      if (request.silentOutput) {
        if (finalText) {
          await this.recordLog('info', `UI director summary: ${finalText}`)
        }
        this.setState(
          withVisualState({
            ...this.state,
            active: true,
            status: 'listening',
            error: null,
            lastEventAt: isoNow(),
          }),
        )
        return
      }

      const speech = await this.api.synthesizeSpeech({
        text: finalText,
        model: request.speechModel,
        voice: request.voice,
        format: 'mp3',
      })

      if (!this.isCurrentVersion(version)) {
        return
      }

      const resources = this.toolVoiceResources
      if (!resources) {
        return
      }

      resources.audioElement.src = `data:${speech.mimeType};base64,${speech.audioBase64}`
      this.setState(
        withVisualState({
          ...this.state,
          active: true,
          status: 'speaking',
          error: null,
          lastEventAt: isoNow(),
        }),
      )

      try {
        await resources.audioElement.play()
      } catch {
        this.setState(
          withVisualState({
            ...this.state,
            active: true,
            status: 'listening',
            error: null,
            lastEventAt: isoNow(),
          }),
        )
      }
    } catch (error) {
      if (!this.isCurrentVersion(version)) {
        return
      }

      const message = toErrorMessage(error)
      await this.recordLog('error', `Tool voice turn failed. ${message}`, 'red')
      this.setState(
        withVisualState({
          ...this.state,
          active: true,
          status: 'listening',
          error: message,
          lastEventAt: isoNow(),
        }),
      )
    }
  }

  private async resolveToolVoiceResponse(
    request: CortexRealtimeSessionRequest,
    initialInput: CortexToolVoiceInputItem[],
    version: number,
  ) {
    let previousResponseId = this.toolVoicePreviousResponseId
    let input = initialInput
    let finalText = ''

    while (this.isCurrentVersion(version)) {
      const response = await this.api.createToolVoiceResponse({
        model: request.textModel ?? 'gpt-4o-mini',
        instructions: request.instructions,
        tools: request.tools,
        input,
        previousResponseId,
      })

      previousResponseId = response.id
      finalText = response.outputText || finalText

      const functionCalls = response.output.filter(
        (item): item is Extract<typeof item, { type: 'function_call' }> =>
          item.type === 'function_call',
      )

      if (!functionCalls.length) {
        this.toolVoicePreviousResponseId = previousResponseId
        return finalText.trim()
      }

      input = []

      for (const output of functionCalls) {
        const result = await this.executeToolCall({
          name: output.name,
          call_id: output.call_id,
          arguments: output.arguments,
        })

        input.push({
          type: 'function_call_output',
          call_id: output.call_id,
          output: serializeToolOutput(result),
        })
      }
    }

    this.toolVoicePreviousResponseId = previousResponseId
    return finalText.trim()
  }

  private readonly handleAudioPause = () => {
    if (!this.state.active || this.state.status === 'executing') {
      return
    }

    this.setState(
      withVisualState({
      ...this.state,
      status: 'listening',
      lastEventAt: isoNow(),
      }),
    )
  }

  private readonly handleAudioPlaying = () => {
    if (!this.state.active || this.state.status === 'executing') {
      return
    }

    this.setState(
      withVisualState({
      ...this.state,
      status: 'speaking',
      lastEventAt: isoNow(),
      }),
    )
  }

  private readonly handleDataChannelMessage = async (event: MessageEvent<string>) => {
    const payload = safeParseJson(event.data) as RealtimeEvent
    await this.handleRealtimeEvent(payload)
  }

  private readonly handleUnexpectedChannelClose = async () => {
    if (!this.state.active && this.state.status !== 'connecting') {
      return
    }

    this.cleanupAllResources()
    this.activeRequest = null
    await this.transitionToError('Realtime voice connection closed unexpectedly.')
  }

  private readonly handleUnexpectedChannelError = async () => {
    await this.transitionToError('Realtime voice data channel encountered an error.')
  }

  private cleanupAllResources() {
    this.cleanupResources()
    this.cleanupToolVoiceResources()
  }

  private cleanupResources(resources: ControllerResources | null = this.resources) {
    if (!resources) {
      return
    }

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

    window.clearInterval(resources.monitorId)

    if (resources.recorder && resources.recorder.state !== 'inactive') {
      resources.recorder.stop()
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
      const result = await this.executeFunctionCall(output)

      this.sendEvent({
        type: 'conversation.item.create',
        item: {
          type: 'function_call_output',
          call_id: output.call_id,
          output: serializeToolOutput(result),
        },
      })
    }

    this.sendEvent(buildRealtimeResponseCreateEvent())
  }

  private async executeToolCall(output: {
    name?: string
    call_id?: string
    arguments?: string
  }) {
    return this.executeFunctionCall(output)
  }

  private async executeFunctionCall(output: {
    name?: string
    call_id?: string
    arguments?: string
  }) {
    if (!output.name || !output.call_id) {
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
      }

    this.setState(
      withVisualState({
      ...this.state,
      active: true,
      status: 'executing',
      lastToolCall: toolCall,
      lastEventAt: isoNow(),
      }),
    )
    await this.recordLog('info', `Realtime tool call: ${toolCall.name}.`)

    try {
      const result = await this.onToolCall(toolCall)
      await this.recordLog('success', `Realtime tool completed: ${toolCall.name}.`, 'green')
      return result
    } catch (error) {
      const message = toErrorMessage(error)
      await this.recordLog('warning', `Realtime tool failed: ${toolCall.name}. ${message}`, 'amber')
      return {
        ok: false,
        error: message,
      }
    }
  }

  private sendEvent(event: JsonRecord) {
    if (!this.resources || this.resources.dataChannel.readyState !== 'open') {
      return
    }

    this.resources.dataChannel.send(JSON.stringify(event))
  }

  private sendTextTurn(text: string) {
    if (!text.trim()) {
      return
    }

    if (!this.resources || this.resources.dataChannel.readyState !== 'open') {
      throw new Error('Realtime data channel is not ready for the next user turn.')
    }

    this.sendEvent({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text,
          },
        ],
      },
    })
    this.sendEvent(buildRealtimeResponseCreateEvent())
  }

  private sendSessionUpdate() {
    const request = this.activeRequest
      ? {
          ...this.getSessionRequest(),
          mode: this.activeRequest.mode,
          engine: this.activeRequest.engine,
          model: this.activeRequest.model,
          textModel: this.activeRequest.textModel,
          transcriptionModel: this.activeRequest.transcriptionModel,
          speechModel: this.activeRequest.speechModel,
          voice: this.activeRequest.voice,
        }
      : this.getSessionRequest()
    const session = buildRealtimeSessionUpdate(request, {
      // PRIME and ECO use the local transcription loop for user turns, then
      // keep the realtime session focused on streamed audio output + tool calls.
      disableAudioTurnDetection: request.engine === 'webrtc' && this.localTurnCaptureEnabled,
    })

    this.sendEvent({
      type: 'session.update',
      session,
    })
  }

  private async transitionToError(message: string) {
    this.cleanupAllResources()
    this.activeRequest = null
    this.toolVoicePreviousResponseId = null
    this.lastUserTranscript = null
    this.localTurnCaptureEnabled = false
    this.setState(
      withVisualState({
      ...DEFAULT_REALTIME_STATE,
      status: 'error',
      error: message,
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
    this.state = nextState
    this.onStateChange(nextState)
  }
}
