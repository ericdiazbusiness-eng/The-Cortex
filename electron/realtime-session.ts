import type { Session, WebContents } from 'electron'
import type {
  CortexRealtimeDebugEntryInput,
  CortexRealtimeSessionRequest,
} from '../src/shared/cortex'

export const DEFAULT_REALTIME_MODEL = 'gpt-realtime-1.5'
export const DEFAULT_REALTIME_VOICE = 'marin'
const REALTIME_CALLS_URL = 'https://api.openai.com/v1/realtime/calls'

type PermissionHandlerSession = Pick<
  Session,
  'setPermissionCheckHandler' | 'setPermissionRequestHandler'
>

type RealtimeDebugReporter = (entry: CortexRealtimeDebugEntryInput) => void

let realtimeDebugReporter: RealtimeDebugReporter | null = null

export const setRealtimeDebugReporter = (reporter: RealtimeDebugReporter | null) => {
  realtimeDebugReporter = reporter
}

const getEnvValue = (name: string, fallback: string) =>
  process.env[name]?.trim() || fallback

const safeTrim = (value: string) => value.trim()

const isRealtimeDebugEnabled = () =>
  process.env.CORTEX_REALTIME_DEBUG?.trim() === 'true' ||
  process.env.VITE_CORTEX_REALTIME_DEBUG?.trim() === 'true'

const logRealtimeDebug = (
  level: 'log' | 'warn' | 'error',
  message: string,
  context?: Record<string, unknown>,
) => {
  if (!isRealtimeDebugEnabled()) {
    return
  }

  realtimeDebugReporter?.({
    source: 'main',
    level,
    message,
    context,
  })

  const prefix = '[RT][main]'
  if (context && Object.keys(context).length > 0) {
    console[level](`${prefix} ${message}`, context)
    return
  }

  console[level](`${prefix} ${message}`)
}

export const isTrustedCortexOrigin = (value: string | null | undefined) => {
  logRealtimeDebug('log', 'Checking trusted Cortex origin.', {
    origin: value ?? null,
  })

  if (!value) {
    logRealtimeDebug('warn', 'Origin rejected because it was empty.', {
      origin: value ?? null,
    })
    return false
  }

  const trusted =
    value.startsWith('file://') ||
    value.startsWith('http://localhost:') ||
    value.startsWith('http://127.0.0.1:') ||
    value.startsWith('https://localhost:') ||
    value.startsWith('https://127.0.0.1:')

  logRealtimeDebug(trusted ? 'log' : 'warn', 'Trusted origin decision completed.', {
    origin: value,
    trusted,
  })

  return trusted
}

export const buildRealtimeSessionConfig = (
  payload: CortexRealtimeSessionRequest,
) => {
  const sessionConfig = {
    type: 'realtime',
    model: safeTrim(
      payload.textModel ?? getEnvValue('OPENAI_REALTIME_MODEL', DEFAULT_REALTIME_MODEL),
    ),
    instructions: payload.instructions,
    tool_choice: 'auto',
    tools: payload.tools,
    output_modalities: ['audio'],
    audio: {
      input: {
        turn_detection: {
          type: 'semantic_vad',
          create_response: true,
          interrupt_response: true,
          eagerness: 'auto',
        },
      },
      output: {
        voice: safeTrim(
          payload.voice ?? getEnvValue('OPENAI_REALTIME_VOICE', DEFAULT_REALTIME_VOICE),
        ),
      },
    },
  }

  logRealtimeDebug('log', 'Built realtime session config.', {
    mode: payload.mode,
    runtime: payload.runtime,
    model: sessionConfig.model,
    voice: sessionConfig.audio.output.voice,
    toolCount: payload.tools.length,
  })

  return sessionConfig
}

export const createRealtimeCallAnswer = async (
  offerSdp: string,
  payload: CortexRealtimeSessionRequest,
): Promise<string> => {
  logRealtimeDebug('log', 'Creating realtime call answer.', {
    mode: payload.mode,
    runtime: payload.runtime,
    model: payload.textModel ?? DEFAULT_REALTIME_MODEL,
    offerLength: offerSdp.length,
  })

  const apiKey = process.env.OPENAI_API_KEY?.trim()

  if (!apiKey) {
    logRealtimeDebug('error', 'Realtime call answer failed because OPENAI_API_KEY is missing.')
    throw new Error('Missing OPENAI_API_KEY for realtime voice.')
  }

  const formData = new FormData()
  formData.set('sdp', offerSdp)
  formData.set('session', JSON.stringify(buildRealtimeSessionConfig(payload)))

  logRealtimeDebug('log', 'Posting realtime SDP offer to OpenAI.', {
    url: REALTIME_CALLS_URL,
  })

  const response = await fetch(REALTIME_CALLS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  })

  const body = await response.text()

  logRealtimeDebug(response.ok ? 'log' : 'warn', 'Received realtime call response from OpenAI.', {
    status: response.status,
    ok: response.ok,
    bodyPreview: body.slice(0, 240),
  })

  if (!response.ok) {
    logRealtimeDebug('error', 'Realtime call failed.', {
      status: response.status,
      bodyPreview: body.slice(0, 240),
    })
    throw new Error(
      `OpenAI realtime call failed (${response.status}): ${body || response.statusText}`,
    )
  }

  logRealtimeDebug('log', 'Returning realtime SDP answer.', {
    answerLength: body.length,
  })

  return body
}

const getRequestLocation = (webContents: WebContents | null) => webContents?.getURL() ?? null

export const attachMediaPermissionHandlers = (ses: PermissionHandlerSession) => {
  ses.setPermissionCheckHandler((webContents, permission) => {
    if (permission !== 'media') {
      logRealtimeDebug('log', 'Permission check rejected for non-media permission.', {
        permission,
        origin: getRequestLocation(webContents),
      })
      return false
    }

    const origin = getRequestLocation(webContents)
    const trusted = isTrustedCortexOrigin(origin)
    logRealtimeDebug(trusted ? 'log' : 'warn', 'Permission check evaluated media request.', {
      permission,
      origin,
      granted: trusted,
    })
    return trusted
  })

  ses.setPermissionRequestHandler((webContents, permission, callback) => {
    const origin = getRequestLocation(webContents)
    const granted = permission === 'media' && isTrustedCortexOrigin(origin)
    logRealtimeDebug(granted ? 'log' : 'warn', 'Permission request handled.', {
      permission,
      origin,
      granted,
    })
    callback(granted)
  })
}
