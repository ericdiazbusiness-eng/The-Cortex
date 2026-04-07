// @vitest-environment node

import {
  createToolVoiceResponse,
  synthesizeSpeech,
  transcribeAudioInput,
} from './tool-voice-openai'

describe('tool-voice-openai helpers', () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-key'
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.OPENAI_API_KEY
  })

  it('posts audio to the speech-to-text endpoint with the configured mini transcription model', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ text: 'hello cortex' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const text = await transcribeAudioInput({
      audioBase64: Buffer.from('audio').toString('base64'),
      mimeType: 'audio/webm',
      fileName: 'sample.webm',
      model: 'gpt-4o-mini-transcribe',
    })

    expect(text).toBe('hello cortex')
    const formData = fetchMock.mock.calls[0]?.[1]?.body as FormData
    expect(formData.get('model')).toBe('gpt-4o-mini-transcribe')
    expect(formData.get('response_format')).toBeNull()
  })

  it('uses response_format when requesting speech generation', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer),
    })
    vi.stubGlobal('fetch', fetchMock)

    await synthesizeSpeech({
      text: 'Queue depth is eleven.',
      model: 'gpt-4o-mini-tts',
      voice: 'marin',
      format: 'mp3',
    })

    const payload = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string) as Record<
      string,
      unknown
    >
    expect(payload).toMatchObject({
      model: 'gpt-4o-mini-tts',
      voice: 'marin',
      input: 'Queue depth is eleven.',
      response_format: 'mp3',
    })
    expect(payload).not.toHaveProperty('format')
  })

  it('parses response output text and function calls from the Responses API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        id: 'response-1',
        output_text: 'Opening Runtime now.',
        output: [
          {
            type: 'function_call',
            call_id: 'call-1',
            name: 'focus_system_metric',
            arguments: '{"metricKey":"queueDepth"}',
          },
        ],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const response = await createToolVoiceResponse({
      model: 'gpt-4o-mini',
      instructions: 'Use tools first.',
      tools: [],
      input: [{ type: 'message', role: 'user', content: 'Show queue depth.' }],
      previousResponseId: null,
    })

    expect(response).toMatchObject({
      id: 'response-1',
      outputText: 'Opening Runtime now.',
      output: [
        {
          type: 'function_call',
          call_id: 'call-1',
          name: 'focus_system_metric',
          arguments: '{"metricKey":"queueDepth"}',
        },
      ],
    })
  })
})
