import type {
  CortexAbortVoiceTurnRequest,
  CortexAbortVoiceTurnResult,
  CortexAudioTranscriptionRequest,
  CortexPronunciationDictionaryLocator,
  CortexRealtimeTranscriptionTokenRequest,
  CortexRealtimeTranscriptionTokenResult,
  CortexRealtimeDebugEntryInput,
  CortexSpeechSynthesisRequest,
  CortexSpeechSynthesisResult,
  CortexToolVoiceOutputItem,
  CortexToolVoiceResponse,
  CortexToolVoiceResponseRequest,
  CortexVoiceSettings,
} from '../src/shared/cortex'

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses'
const OPENAI_TRANSCRIPTIONS_URL = 'https://api.openai.com/v1/audio/transcriptions'
const OPENAI_SPEECH_URL = 'https://api.openai.com/v1/audio/speech'
const ELEVENLABS_TRANSCRIPTIONS_URL = 'https://api.elevenlabs.io/v1/speech-to-text'
const ELEVENLABS_SINGLE_USE_TOKEN_URL = 'https://api.elevenlabs.io/v1/single-use-token'
const ELEVENLABS_SPEECH_URL = 'https://api.elevenlabs.io/v1/text-to-speech'
const ELEVENLABS_VOICE_PLACEHOLDER = 'elevenlabs-custom'
const VOICE_TURN_ABORT_ERROR_PREFIX = 'VOICE_TURN_ABORTED'

type AbortableVoiceStage = 'transcribing' | 'responding' | 'speaking'
type ActiveTurnControllers = Partial<Record<AbortableVoiceStage, AbortController>>

type ToolVoiceDebugReporter = (entry: CortexRealtimeDebugEntryInput) => void

let toolVoiceDebugReporter: ToolVoiceDebugReporter | null = null
const activeTurnControllers = new Map<string, ActiveTurnControllers>()

export const setToolVoiceDebugReporter = (reporter: ToolVoiceDebugReporter | null) => {
  toolVoiceDebugReporter = reporter
}

const isRealtimeDebugEnabled = () =>
  process.env.CORTEX_REALTIME_DEBUG?.trim() === 'true' ||
  process.env.VITE_CORTEX_REALTIME_DEBUG?.trim() === 'true'

const reportToolVoiceDebug = (
  level: 'log' | 'warn' | 'error',
  message: string,
  context?: Record<string, unknown>,
  metadata?: {
    mode?: CortexAudioTranscriptionRequest['mode']
    sessionAttemptId?: string
    stage?: CortexRealtimeDebugEntryInput['stage']
    toolName?: string | null
    transcriptPreview?: string | null
    responsePreview?: string | null
    errorCode?: string | null
    turnId?: string
  },
) => {
  if (!isRealtimeDebugEnabled()) {
    return
  }

  toolVoiceDebugReporter?.({
    source: 'main',
    level,
    severity: level,
    message,
    mode: metadata?.mode ?? 'unknown',
    stage: metadata?.stage,
    transport: 'voice_pipeline',
    sessionAttemptId: metadata?.sessionAttemptId ?? null,
    turnId: metadata?.turnId ?? null,
    transcriptPreview: metadata?.transcriptPreview ?? null,
    responsePreview: metadata?.responsePreview ?? null,
    toolName: metadata?.toolName ?? null,
    errorCode: metadata?.errorCode ?? (level === 'error' ? 'openai_request_failed' : null),
    errorMessage: level === 'error' || metadata?.errorCode ? message : null,
    context,
  })

  const prefix = '[RT][main]'
  if (context && Object.keys(context).length > 0) {
    console[level](`${prefix} ${message}`, context)
    return
  }

  console[level](`${prefix} ${message}`)
}

const getApiKey = () => {
  const apiKey = process.env.OPENAI_API_KEY?.trim()

  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY for tool voice mode.')
  }

  return apiKey
}

const getOpenAIAuthHint = (status: number) =>
  status === 401 ? ' Check OPENAI_API_KEY; OpenAI rejected the key as invalid or expired.' : ''

const getElevenLabsApiKey = () => process.env.ELEVENLABS_API_KEY?.trim() ?? null
const getElevenLabsTranscriptionLanguage = () =>
  process.env.ELEVENLABS_STT_LANGUAGE?.trim() || 'en'

const parseJsonEnv = <T,>(value: string | undefined, fallback: T): T => {
  if (!value?.trim()) {
    return fallback
  }

  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

const resolveElevenLabsVoiceId = (voice: string | undefined) => {
  const normalizedVoice = voice?.trim()
  if (normalizedVoice && normalizedVoice !== ELEVENLABS_VOICE_PLACEHOLDER) {
    return normalizedVoice
  }

  return process.env.ELEVENLABS_VOICE_ID?.trim() || null
}

const normalizeVoiceSettings = (settings: CortexVoiceSettings | undefined | null) => {
  if (!settings) {
    return null
  }

  const normalized: Record<string, boolean | number> = {}

  if (typeof settings.speed === 'number' && Number.isFinite(settings.speed)) {
    normalized.speed = settings.speed
  }
  if (typeof settings.stability === 'number' && Number.isFinite(settings.stability)) {
    normalized.stability = settings.stability
  }
  if (
    typeof settings.similarityBoost === 'number' &&
    Number.isFinite(settings.similarityBoost)
  ) {
    normalized.similarity_boost = settings.similarityBoost
  }
  if (typeof settings.style === 'number' && Number.isFinite(settings.style)) {
    normalized.style = settings.style
  }
  if (typeof settings.useSpeakerBoost === 'boolean') {
    normalized.use_speaker_boost = settings.useSpeakerBoost
  }

  return Object.keys(normalized).length ? normalized : null
}

const getElevenLabsVoiceSettings = (settings: CortexVoiceSettings | undefined) => {
  const payloadSettings = normalizeVoiceSettings(settings)
  if (payloadSettings) {
    return payloadSettings
  }

  return normalizeVoiceSettings(
    parseJsonEnv<CortexVoiceSettings | null>(process.env.ELEVENLABS_VOICE_SETTINGS, null),
  )
}

const normalizePronunciationDictionaries = (
  locators: CortexPronunciationDictionaryLocator[] | undefined,
) => {
  if (!locators?.length) {
    return null
  }

  const normalized = locators
    .map((locator) => ({
      id: locator.id?.trim(),
      version_id: locator.versionId?.trim(),
    }))
    .filter((locator) => locator.id && locator.version_id)

  return normalized.length ? normalized : null
}

const getElevenLabsPronunciationDictionaries = (
  locators: CortexPronunciationDictionaryLocator[] | undefined,
) => {
  const payloadLocators = normalizePronunciationDictionaries(locators)
  if (payloadLocators) {
    return payloadLocators
  }

  return normalizePronunciationDictionaries(
    parseJsonEnv<CortexPronunciationDictionaryLocator[] | null>(
      process.env.ELEVENLABS_PRONUNCIATION_DICTIONARIES,
      null,
    ) ?? undefined,
  )
}

const readErrorBody = async (response: Response) => {
  try {
    return await response.text()
  } catch {
    return response.statusText
  }
}

const getTurnKey = ({
  sessionAttemptId,
  turnId,
}: {
  sessionAttemptId?: string | null
  turnId?: string | null
}) =>
  sessionAttemptId && turnId ? `${sessionAttemptId}:${turnId}` : null

const getAbortReason = (
  signal: AbortSignal,
  fallbackStage: AbortableVoiceStage,
): {
  reason: string
  stage: AbortableVoiceStage
} => {
  const signalReason = signal.reason

  if (signalReason && typeof signalReason === 'object') {
    const reasonRecord = signalReason as Record<string, unknown>
    const reason =
      typeof reasonRecord.reason === 'string' && reasonRecord.reason.trim()
        ? reasonRecord.reason.trim()
        : 'aborted'
    const stage =
      reasonRecord.stage === 'transcribing' ||
      reasonRecord.stage === 'responding' ||
      reasonRecord.stage === 'speaking'
        ? reasonRecord.stage
        : fallbackStage

    return {
      reason,
      stage,
    }
  }

  return {
    reason: 'aborted',
    stage: fallbackStage,
  }
}

const createVoiceTurnAbortError = (stage: AbortableVoiceStage, reason: string) => {
  const error = new Error(`${VOICE_TURN_ABORT_ERROR_PREFIX}:${stage}:${reason}`)
  error.name = 'VoiceTurnAbortError'
  return error
}

const registerTurnAbortController = (
  payload: {
    sessionAttemptId?: string
    turnId?: string
  },
  stage: AbortableVoiceStage,
  controller: AbortController,
) => {
  const key = getTurnKey(payload)
  if (!key) {
    return
  }

  const current = activeTurnControllers.get(key) ?? {}
  current[stage] = controller
  activeTurnControllers.set(key, current)
}

const unregisterTurnAbortController = (
  payload: {
    sessionAttemptId?: string
    turnId?: string
  },
  stage: AbortableVoiceStage,
  controller: AbortController,
) => {
  const key = getTurnKey(payload)
  if (!key) {
    return
  }

  const current = activeTurnControllers.get(key)
  if (!current || current[stage] !== controller) {
    return
  }

  delete current[stage]
  if (!current.transcribing && !current.responding && !current.speaking) {
    activeTurnControllers.delete(key)
    return
  }

  activeTurnControllers.set(key, current)
}

export const abortActiveVoiceTurn = async (
  payload: CortexAbortVoiceTurnRequest,
): Promise<CortexAbortVoiceTurnResult> => {
  const key = getTurnKey(payload)
  if (!key) {
    return {
      ok: true,
      aborted: false,
      abortedStages: [],
      reason: payload.reason,
    }
  }

  const current = activeTurnControllers.get(key)
  if (!current) {
    return {
      ok: true,
      aborted: false,
      abortedStages: [],
      reason: payload.reason,
    }
  }

  const abortedStages: AbortableVoiceStage[] = []
  ;(['transcribing', 'responding', 'speaking'] as const).forEach((stage) => {
    const controller = current[stage]
    if (!controller || controller.signal.aborted) {
      return
    }

    controller.abort({
      reason: payload.reason,
      stage,
    })
    abortedStages.push(stage)
  })

  reportToolVoiceDebug(
    'warn',
    'Active voice turn abort requested.',
    {
      abortedStages,
      reason: payload.reason,
      sessionAttemptId: payload.sessionAttemptId ?? null,
      turnId: payload.turnId ?? null,
    },
    {
      mode: undefined,
      sessionAttemptId: payload.sessionAttemptId ?? undefined,
      stage: abortedStages.at(-1) ?? undefined,
      turnId: payload.turnId ?? undefined,
    },
  )

  return {
    ok: true,
    aborted: abortedStages.length > 0,
    abortedStages,
    reason: payload.reason,
  }
}

const extractOutputText = (
  payload: Record<string, unknown>,
  output: CortexToolVoiceOutputItem[],
) => {
  const direct = payload.output_text
  if (typeof direct === 'string' && direct.trim()) {
    return direct.trim()
  }

  const textParts = output.flatMap((item) => {
    if (item.type !== 'message') {
      return []
    }

    return item.content
      .map((part) => (typeof part.text === 'string' ? part.text : ''))
      .filter(Boolean)
  })

  return textParts.join('\n').trim()
}

const transcribeAudioWithOpenAI = async (
  payload: CortexAudioTranscriptionRequest,
): Promise<string> => {
  const apiKey = getApiKey()
  const controller = new AbortController()
  const formData = new FormData()
  const fileName = payload.fileName?.trim() || 'tool-voice-input.webm'
  const blob = new Blob([Buffer.from(payload.audioBase64, 'base64')], {
    type: payload.mimeType,
  })

  formData.set('file', blob, fileName)
  formData.set('model', payload.model?.trim() || 'gpt-4o-mini-transcribe')

  reportToolVoiceDebug(
    'log',
    'OpenAI transcription request started.',
    {
      fileName,
      mimeType: payload.mimeType,
      model: payload.model?.trim() || 'gpt-4o-mini-transcribe',
    },
    {
      mode: payload.mode,
      sessionAttemptId: payload.sessionAttemptId,
      stage: 'transcribing',
      turnId: payload.turnId,
    },
  )

  registerTurnAbortController(payload, 'transcribing', controller)
  let response: Response

  try {
    response = await fetch(OPENAI_TRANSCRIPTIONS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
      signal: controller.signal,
    })
  } catch (error) {
    unregisterTurnAbortController(payload, 'transcribing', controller)
    if (controller.signal.aborted) {
      const aborted = getAbortReason(controller.signal, 'transcribing')
      reportToolVoiceDebug(
        'warn',
        'OpenAI transcription request aborted.',
        {
          reason: aborted.reason,
        },
        {
          mode: payload.mode,
          sessionAttemptId: payload.sessionAttemptId,
          stage: 'transcribing',
          turnId: payload.turnId,
        },
      )
      throw createVoiceTurnAbortError(aborted.stage, aborted.reason)
    }

    throw error
  }

  const data = (await response.json().catch(() => null)) as Record<string, unknown> | null
  unregisterTurnAbortController(payload, 'transcribing', controller)

  if (!response.ok) {
    reportToolVoiceDebug(
      'error',
      `OpenAI transcription failed (${response.status}).`,
      data ?? undefined,
      {
        mode: payload.mode,
        sessionAttemptId: payload.sessionAttemptId,
        stage: 'transcribing',
        errorCode: 'ABORT_TRANSCRIPTION',
        turnId: payload.turnId,
      },
    )
    throw new Error(
      `OpenAI transcription failed (${response.status}): ${
        JSON.stringify(data) || response.statusText
      }${getOpenAIAuthHint(response.status)}`,
    )
  }

  const transcript = typeof data?.text === 'string' ? data.text.trim() : ''
  reportToolVoiceDebug(
    'log',
    'OpenAI transcription completed.',
    {
      transcriptLength: transcript.length,
    },
    {
      mode: payload.mode,
      sessionAttemptId: payload.sessionAttemptId,
      stage: 'responding',
      transcriptPreview: transcript.slice(0, 120),
      turnId: payload.turnId,
    },
  )

  return transcript
}

const transcribeAudioWithElevenLabs = async (
  payload: CortexAudioTranscriptionRequest,
  apiKey: string,
): Promise<string> => {
  const controller = new AbortController()
  const formData = new FormData()
  const fileName = payload.fileName?.trim() || 'tool-voice-input.webm'
  const blob = new Blob([Buffer.from(payload.audioBase64, 'base64')], {
    type: payload.mimeType,
  })
  const model = payload.model?.trim() || 'scribe_v2'

  formData.set('file', blob, fileName)
  formData.set('model_id', model)
  formData.set('language_code', getElevenLabsTranscriptionLanguage())
  formData.set('timestamps_granularity', 'none')
  formData.set('tag_audio_events', 'false')
  formData.set('diarize', 'false')
  formData.set('file_format', 'other')
  formData.set('temperature', '0')

  reportToolVoiceDebug(
    'log',
    'ElevenLabs transcription request started.',
    {
      fileName,
      mimeType: payload.mimeType,
      model,
    },
    {
      mode: payload.mode,
      sessionAttemptId: payload.sessionAttemptId,
      stage: 'transcribing',
      turnId: payload.turnId,
    },
  )

  registerTurnAbortController(payload, 'transcribing', controller)
  let response: Response

  try {
    response = await fetch(ELEVENLABS_TRANSCRIPTIONS_URL, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
      },
      body: formData,
      signal: controller.signal,
    })
  } catch (error) {
    unregisterTurnAbortController(payload, 'transcribing', controller)
    if (controller.signal.aborted) {
      const aborted = getAbortReason(controller.signal, 'transcribing')
      reportToolVoiceDebug(
        'warn',
        'ElevenLabs transcription request aborted.',
        {
          reason: aborted.reason,
        },
        {
          mode: payload.mode,
          sessionAttemptId: payload.sessionAttemptId,
          stage: 'transcribing',
          turnId: payload.turnId,
        },
      )
      throw createVoiceTurnAbortError(aborted.stage, aborted.reason)
    }

    throw error
  }

  const data = (await response.json().catch(() => null)) as Record<string, unknown> | null
  unregisterTurnAbortController(payload, 'transcribing', controller)

  if (!response.ok) {
    reportToolVoiceDebug(
      'error',
      `ElevenLabs transcription failed (${response.status}).`,
      data ?? undefined,
      {
        mode: payload.mode,
        sessionAttemptId: payload.sessionAttemptId,
        stage: 'transcribing',
        errorCode: 'ABORT_TRANSCRIPTION',
        turnId: payload.turnId,
      },
    )
    throw new Error(
      `ElevenLabs transcription failed (${response.status}): ${
        JSON.stringify(data) || response.statusText
      }`,
    )
  }

  const transcript = typeof data?.text === 'string' ? data.text.trim() : ''
  reportToolVoiceDebug(
    'log',
    'ElevenLabs transcription completed.',
    {
      transcriptLength: transcript.length,
    },
    {
      mode: payload.mode,
      sessionAttemptId: payload.sessionAttemptId,
      stage: 'responding',
      transcriptPreview: transcript.slice(0, 120),
      turnId: payload.turnId,
    },
  )

  return transcript
}

export const transcribeAudioInput = async (
  payload: CortexAudioTranscriptionRequest,
): Promise<string> => {
  if (payload.provider === 'elevenlabs') {
    const apiKey = getElevenLabsApiKey()
    if (apiKey) {
      return transcribeAudioWithElevenLabs(payload, apiKey)
    }

    throw new Error('Missing ELEVENLABS_API_KEY for neural voice mode transcription.')
  }

  return transcribeAudioWithOpenAI({
    ...payload,
    provider: 'openai',
  })
}

export const createRealtimeTranscriptionToken = async (
  payload: CortexRealtimeTranscriptionTokenRequest = {},
): Promise<CortexRealtimeTranscriptionTokenResult> => {
  const apiKey = getElevenLabsApiKey()
  if (!apiKey) {
    throw new Error('Missing ELEVENLABS_API_KEY for neural realtime transcription.')
  }

  const purpose = payload.purpose?.trim() || 'realtime_scribe'

  reportToolVoiceDebug(
    'log',
    'ElevenLabs realtime transcription token request started.',
    {
      purpose,
    },
    {
      mode: payload.mode,
      stage: 'ready',
    },
  )

  const response = await fetch(
    `${ELEVENLABS_SINGLE_USE_TOKEN_URL}/${encodeURIComponent(purpose)}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
      },
    },
  )

  const data = (await response.json().catch(() => null)) as Record<string, unknown> | null
  if (!response.ok || !data || typeof data.token !== 'string' || !data.token.trim()) {
    reportToolVoiceDebug(
      'error',
      `ElevenLabs realtime transcription token request failed (${response.status}).`,
      data ?? undefined,
      {
        errorCode: 'elevenlabs_request_failed',
        mode: payload.mode,
        stage: 'ready',
      },
    )
    throw new Error(
      `ElevenLabs realtime transcription token request failed (${response.status}): ${
        JSON.stringify(data) || response.statusText
      }`,
    )
  }

  const expiresAt =
    typeof data.expires_at_unix_secs === 'number'
      ? new Date(data.expires_at_unix_secs * 1000).toISOString()
      : null

  reportToolVoiceDebug(
    'log',
    'ElevenLabs realtime transcription token request completed.',
    {
      expiresAt,
      purpose,
    },
    {
      mode: payload.mode,
      stage: 'ready',
    },
  )

  return {
    token: data.token.trim(),
    expiresAt,
  }
}

export const createToolVoiceResponse = async (
  payload: CortexToolVoiceResponseRequest,
): Promise<CortexToolVoiceResponse> => {
  const apiKey = getApiKey()
  const controller = new AbortController()

  reportToolVoiceDebug(
    'log',
    'OpenAI response request started.',
    {
      inputCount: payload.input.length,
      model: payload.model,
      previousResponseId: payload.previousResponseId ?? null,
      toolCount: payload.tools.length,
    },
    {
      mode: payload.mode,
      sessionAttemptId: payload.sessionAttemptId,
      stage: 'responding',
      turnId: payload.turnId,
    },
  )

  registerTurnAbortController(payload, 'responding', controller)
  let response: Response

  try {
    response = await fetch(OPENAI_RESPONSES_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: payload.model,
        instructions: payload.instructions,
        input: payload.input,
        previous_response_id: payload.previousResponseId ?? undefined,
        tools: payload.tools,
        tool_choice: 'auto',
      }),
      signal: controller.signal,
    })
  } catch (error) {
    unregisterTurnAbortController(payload, 'responding', controller)
    if (controller.signal.aborted) {
      const aborted = getAbortReason(controller.signal, 'responding')
      reportToolVoiceDebug(
        'warn',
        'OpenAI response request aborted.',
        {
          reason: aborted.reason,
        },
        {
          mode: payload.mode,
          sessionAttemptId: payload.sessionAttemptId,
          stage: 'responding',
          errorCode: 'ABORT_RESPONSE',
          turnId: payload.turnId,
        },
      )
      throw createVoiceTurnAbortError(aborted.stage, aborted.reason)
    }

    throw error
  }

  const data = (await response.json().catch(() => null)) as Record<string, unknown> | null
  unregisterTurnAbortController(payload, 'responding', controller)

  if (!response.ok || !data) {
    reportToolVoiceDebug(
      'error',
      `OpenAI response request failed (${response.status}).`,
      data ?? undefined,
      {
        mode: payload.mode,
        sessionAttemptId: payload.sessionAttemptId,
        stage: 'responding',
        turnId: payload.turnId,
      },
    )
    throw new Error(
      `OpenAI tool voice response failed (${response.status}): ${
        JSON.stringify(data) || response.statusText
      }${getOpenAIAuthHint(response.status)}`,
    )
  }

  const rawOutput = Array.isArray(data.output) ? data.output : []
  const output = rawOutput
    .map((item): CortexToolVoiceOutputItem | null => {
      if (!item || typeof item !== 'object') {
        return null
      }

      const entry = item as Record<string, unknown>

      if (
        entry.type === 'function_call' &&
        typeof entry.call_id === 'string' &&
        typeof entry.name === 'string'
      ) {
        return {
          type: 'function_call',
          call_id: entry.call_id,
          name: entry.name,
          arguments: typeof entry.arguments === 'string' ? entry.arguments : '{}',
        }
      }

      if (entry.type === 'message') {
        const content = Array.isArray(entry.content)
          ? entry.content.reduce<Array<{ type: string; text?: string }>>((parts, part) => {
              if (!part || typeof part !== 'object') {
                return parts
              }

              const contentPart = part as Record<string, unknown>
              parts.push({
                type: typeof contentPart.type === 'string' ? contentPart.type : 'output_text',
                text:
                  typeof contentPart.text === 'string'
                    ? contentPart.text
                    : typeof contentPart.transcript === 'string'
                      ? contentPart.transcript
                      : undefined,
              })
              return parts
            }, [])
          : []

        return {
          type: 'message',
          role: 'assistant',
          content,
        }
      }

      return null
    })
    .filter((item): item is CortexToolVoiceOutputItem => item !== null)

  const outputText = extractOutputText(data, output)
  const functionCall = output.find((item) => item.type === 'function_call')

  reportToolVoiceDebug(
    'log',
    'OpenAI response request completed.',
    {
      outputCount: output.length,
      responseId: typeof data.id === 'string' ? data.id : null,
    },
    {
      mode: payload.mode,
      sessionAttemptId: payload.sessionAttemptId,
      stage: functionCall ? 'tooling' : 'responding',
      responsePreview: outputText.slice(0, 120),
      toolName: functionCall?.name ?? null,
      turnId: payload.turnId,
    },
  )

  return {
    id: typeof data.id === 'string' ? data.id : `response-${Date.now()}`,
    outputText,
    output,
  }
}

const synthesizeSpeechWithOpenAI = async (
  payload: CortexSpeechSynthesisRequest,
): Promise<CortexSpeechSynthesisResult> => {
  const apiKey = getApiKey()
  const format = payload.format === 'wav' ? 'wav' : 'mp3'
  const controller = new AbortController()

  reportToolVoiceDebug(
    'log',
    'OpenAI speech synthesis request started.',
    {
      format,
      model: payload.model?.trim() || 'gpt-4o-mini-tts',
      voice: payload.voice?.trim() || 'marin',
    },
    {
      mode: payload.mode,
      sessionAttemptId: payload.sessionAttemptId,
      stage: 'speaking',
      responsePreview: payload.text.slice(0, 120),
      turnId: payload.turnId,
    },
  )

  registerTurnAbortController(payload, 'speaking', controller)
  let response: Response

  try {
    response = await fetch(OPENAI_SPEECH_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: payload.model?.trim() || 'gpt-4o-mini-tts',
        voice: payload.voice?.trim() || 'marin',
        input: payload.text,
        response_format: format,
      }),
      signal: controller.signal,
    })
  } catch (error) {
    unregisterTurnAbortController(payload, 'speaking', controller)
    if (controller.signal.aborted) {
      const aborted = getAbortReason(controller.signal, 'speaking')
      reportToolVoiceDebug(
        'warn',
        'OpenAI speech synthesis request aborted.',
        {
          reason: aborted.reason,
        },
        {
          mode: payload.mode,
          sessionAttemptId: payload.sessionAttemptId,
          stage: 'speaking',
          errorCode: 'ABORT_TTS',
          turnId: payload.turnId,
        },
      )
      throw createVoiceTurnAbortError(aborted.stage, aborted.reason)
    }

    throw error
  }

  if (!response.ok) {
    unregisterTurnAbortController(payload, 'speaking', controller)
    reportToolVoiceDebug(
      'error',
      `OpenAI speech synthesis failed (${response.status}).`,
      undefined,
      {
        mode: payload.mode,
        sessionAttemptId: payload.sessionAttemptId,
        stage: 'speaking',
        responsePreview: payload.text.slice(0, 120),
        turnId: payload.turnId,
      },
    )
    throw new Error(
      `OpenAI speech synthesis failed (${response.status}): ${await readErrorBody(response)}${getOpenAIAuthHint(response.status)}`,
    )
  }

  const audioBuffer = Buffer.from(await response.arrayBuffer())
  unregisterTurnAbortController(payload, 'speaking', controller)
  reportToolVoiceDebug(
    'log',
    'OpenAI speech synthesis completed.',
    {
      audioBytes: audioBuffer.byteLength,
      format,
    },
    {
      mode: payload.mode,
      sessionAttemptId: payload.sessionAttemptId,
      stage: 'speaking',
      responsePreview: payload.text.slice(0, 120),
      turnId: payload.turnId,
    },
  )
  return {
    audioBase64: audioBuffer.toString('base64'),
    mimeType: format === 'wav' ? 'audio/wav' : 'audio/mpeg',
  }
}

const synthesizeSpeechWithElevenLabs = async (
  payload: CortexSpeechSynthesisRequest,
  apiKey: string,
): Promise<CortexSpeechSynthesisResult> => {
  const controller = new AbortController()
  const voiceId = resolveElevenLabsVoiceId(payload.voice)
  const model = payload.model?.trim() || 'eleven_flash_v2_5'
  const outputFormat = 'mp3_44100_128'
  const voiceSettings = getElevenLabsVoiceSettings(payload.voiceSettings)
  const pronunciationDictionaries = getElevenLabsPronunciationDictionaries(
    payload.pronunciationDictionaries,
  )

  if (!voiceId) {
    throw new Error('Missing ELEVENLABS_VOICE_ID for neural voice mode.')
  }

  reportToolVoiceDebug(
    'log',
    'ElevenLabs speech synthesis request started.',
    {
      format: outputFormat,
      model,
      voice: voiceId,
    },
    {
      mode: payload.mode,
      sessionAttemptId: payload.sessionAttemptId,
      stage: 'speaking',
      responsePreview: payload.text.slice(0, 120),
      turnId: payload.turnId,
    },
  )

  registerTurnAbortController(payload, 'speaking', controller)
  let response: Response

  try {
    response = await fetch(`${ELEVENLABS_SPEECH_URL}/${encodeURIComponent(voiceId)}?output_format=${outputFormat}&optimize_streaming_latency=3`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text: payload.text,
        model_id: model,
        voice_settings: voiceSettings ?? undefined,
        pronunciation_dictionary_locators: pronunciationDictionaries ?? undefined,
      }),
      signal: controller.signal,
    })
  } catch (error) {
    unregisterTurnAbortController(payload, 'speaking', controller)
    if (controller.signal.aborted) {
      const aborted = getAbortReason(controller.signal, 'speaking')
      reportToolVoiceDebug(
        'warn',
        'ElevenLabs speech synthesis request aborted.',
        {
          reason: aborted.reason,
        },
        {
          mode: payload.mode,
          sessionAttemptId: payload.sessionAttemptId,
          stage: 'speaking',
          errorCode: 'ABORT_TTS',
          turnId: payload.turnId,
        },
      )
      throw createVoiceTurnAbortError(aborted.stage, aborted.reason)
    }

    throw error
  }

  if (!response.ok) {
    unregisterTurnAbortController(payload, 'speaking', controller)
    const errorBody = await readErrorBody(response)
    reportToolVoiceDebug(
      'error',
      `ElevenLabs speech synthesis failed (${response.status}).`,
      {
        status: response.status,
        body: errorBody,
      },
      {
        mode: payload.mode,
        sessionAttemptId: payload.sessionAttemptId,
        stage: 'speaking',
        errorCode: 'elevenlabs_request_failed',
        responsePreview: payload.text.slice(0, 120),
        turnId: payload.turnId,
      },
    )
    throw new Error(
      `ElevenLabs speech synthesis failed (${response.status}): ${errorBody}`,
    )
  }

  const audioBuffer = Buffer.from(await response.arrayBuffer())
  unregisterTurnAbortController(payload, 'speaking', controller)
  reportToolVoiceDebug(
    'log',
    'ElevenLabs speech synthesis completed.',
    {
      audioBytes: audioBuffer.byteLength,
      format: outputFormat,
    },
    {
      mode: payload.mode,
      sessionAttemptId: payload.sessionAttemptId,
      stage: 'speaking',
      responsePreview: payload.text.slice(0, 120),
      turnId: payload.turnId,
    },
  )

  return {
    audioBase64: audioBuffer.toString('base64'),
    mimeType: 'audio/mpeg',
  }
}

export const synthesizeSpeech = async (
  payload: CortexSpeechSynthesisRequest,
): Promise<CortexSpeechSynthesisResult> => {
  if (payload.provider === 'elevenlabs') {
    const apiKey = getElevenLabsApiKey()
    if (apiKey) {
      return synthesizeSpeechWithElevenLabs(payload, apiKey)
    }

    throw new Error('Missing ELEVENLABS_API_KEY for neural voice mode speech synthesis.')
  }

  return synthesizeSpeechWithOpenAI({
    ...payload,
    provider: 'openai',
  })
}
