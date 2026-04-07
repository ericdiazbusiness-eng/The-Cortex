import type { Session, WebContents } from 'electron'
import type { CortexRealtimeSessionRequest } from '../src/shared/cortex'

export const DEFAULT_REALTIME_MODEL = 'gpt-realtime-1.5'
export const DEFAULT_REALTIME_VOICE = 'marin'
const REALTIME_CALLS_URL = 'https://api.openai.com/v1/realtime/calls'

type PermissionHandlerSession = Pick<
  Session,
  'setPermissionCheckHandler' | 'setPermissionRequestHandler'
>

const getEnvValue = (name: string, fallback: string) =>
  process.env[name]?.trim() || fallback

const safeTrim = (value: string) => value.trim()

export const isTrustedCortexOrigin = (value: string | null | undefined) => {
  if (!value) {
    return false
  }

  return (
    value.startsWith('file://') ||
    value.startsWith('http://localhost:') ||
    value.startsWith('http://127.0.0.1:') ||
    value.startsWith('https://localhost:') ||
    value.startsWith('https://127.0.0.1:')
  )
}

export const buildRealtimeSessionConfig = (
  payload: CortexRealtimeSessionRequest,
) => ({
  type: 'realtime',
  model: safeTrim(payload.model ?? getEnvValue('OPENAI_REALTIME_MODEL', DEFAULT_REALTIME_MODEL)),
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
      voice: safeTrim(payload.voice ?? getEnvValue('OPENAI_REALTIME_VOICE', DEFAULT_REALTIME_VOICE)),
    },
  },
})

export const createRealtimeCallAnswer = async (
  offerSdp: string,
  payload: CortexRealtimeSessionRequest,
): Promise<string> => {
  const apiKey = process.env.OPENAI_API_KEY?.trim()

  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY for realtime voice.')
  }

  const formData = new FormData()
  formData.set('sdp', offerSdp)
  formData.set('session', JSON.stringify(buildRealtimeSessionConfig(payload)))

  const response = await fetch(REALTIME_CALLS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  })

  const body = await response.text()

  if (!response.ok) {
    throw new Error(
      `OpenAI realtime call failed (${response.status}): ${body || response.statusText}`,
    )
  }

  return body
}

const getRequestLocation = (webContents: WebContents | null) => webContents?.getURL() ?? null

export const attachMediaPermissionHandlers = (ses: PermissionHandlerSession) => {
  ses.setPermissionCheckHandler((webContents, permission) => {
    if (permission !== 'media') {
      return false
    }

    return isTrustedCortexOrigin(getRequestLocation(webContents))
  })

  ses.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(permission === 'media' && isTrustedCortexOrigin(getRequestLocation(webContents)))
  })
}
