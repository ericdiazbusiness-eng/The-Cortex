import type {
  CortexAudioTranscriptionRequest,
  CortexSpeechSynthesisRequest,
  CortexSpeechSynthesisResult,
  CortexToolVoiceOutputItem,
  CortexToolVoiceResponse,
  CortexToolVoiceResponseRequest,
} from '../src/shared/cortex'

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses'
const OPENAI_TRANSCRIPTIONS_URL = 'https://api.openai.com/v1/audio/transcriptions'
const OPENAI_SPEECH_URL = 'https://api.openai.com/v1/audio/speech'

const getApiKey = () => {
  const apiKey = process.env.OPENAI_API_KEY?.trim()

  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY for tool voice mode.')
  }

  return apiKey
}

const readErrorBody = async (response: Response) => {
  try {
    return await response.text()
  } catch {
    return response.statusText
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

export const transcribeAudioInput = async (
  payload: CortexAudioTranscriptionRequest,
): Promise<string> => {
  const apiKey = getApiKey()
  const formData = new FormData()
  const fileName = payload.fileName?.trim() || 'tool-voice-input.webm'
  const blob = new Blob([Buffer.from(payload.audioBase64, 'base64')], {
    type: payload.mimeType,
  })

  formData.set('file', blob, fileName)
  formData.set('model', payload.model?.trim() || 'gpt-4o-mini-transcribe')

  const response = await fetch(OPENAI_TRANSCRIPTIONS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  })

  const data = (await response.json().catch(() => null)) as Record<string, unknown> | null

  if (!response.ok) {
    throw new Error(
      `OpenAI transcription failed (${response.status}): ${
        JSON.stringify(data) || response.statusText
      }`,
    )
  }

  return typeof data?.text === 'string' ? data.text.trim() : ''
}

export const createToolVoiceResponse = async (
  payload: CortexToolVoiceResponseRequest,
): Promise<CortexToolVoiceResponse> => {
  const apiKey = getApiKey()

  const response = await fetch(OPENAI_RESPONSES_URL, {
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
  })

  const data = (await response.json().catch(() => null)) as Record<string, unknown> | null

  if (!response.ok || !data) {
    throw new Error(
      `OpenAI tool voice response failed (${response.status}): ${
        JSON.stringify(data) || response.statusText
      }`,
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

  return {
    id: typeof data.id === 'string' ? data.id : `response-${Date.now()}`,
    outputText: extractOutputText(data, output),
    output,
  }
}

export const synthesizeSpeech = async (
  payload: CortexSpeechSynthesisRequest,
): Promise<CortexSpeechSynthesisResult> => {
  const apiKey = getApiKey()
  const format = payload.format === 'wav' ? 'wav' : 'mp3'

  const response = await fetch(OPENAI_SPEECH_URL, {
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
  })

  if (!response.ok) {
    throw new Error(
      `OpenAI speech synthesis failed (${response.status}): ${await readErrorBody(response)}`,
    )
  }

  const audioBuffer = Buffer.from(await response.arrayBuffer())
  return {
    audioBase64: audioBuffer.toString('base64'),
    mimeType: format === 'wav' ? 'audio/wav' : 'audio/mpeg',
  }
}
