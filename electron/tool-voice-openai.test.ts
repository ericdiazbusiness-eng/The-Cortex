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
    delete process.env.ELEVENLABS_API_KEY
    delete process.env.ELEVENLABS_VOICE_ID
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

  it('routes neural transcription to ElevenLabs when that provider is requested', async () => {
    process.env.ELEVENLABS_API_KEY = 'xi-test'
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ text: 'hello from elevenlabs' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const text = await transcribeAudioInput({
      audioBase64: Buffer.from('audio').toString('base64'),
      mimeType: 'audio/webm',
      fileName: 'sample.webm',
      provider: 'elevenlabs',
      model: 'scribe_v2',
    })

    expect(text).toBe('hello from elevenlabs')
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://api.elevenlabs.io/v1/speech-to-text')
    const formData = fetchMock.mock.calls[0]?.[1]?.body as FormData
    expect(formData.get('model_id')).toBe('scribe_v2')
    expect(formData.get('language_code')).toBe('en')
    expect(formData.get('tag_audio_events')).toBe('false')
    expect(formData.get('temperature')).toBe('0')
  })

  it('routes neural speech synthesis to ElevenLabs when that provider is requested', async () => {
    process.env.ELEVENLABS_API_KEY = 'xi-test'
    process.env.ELEVENLABS_VOICE_ID = 'voice-123'
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: vi.fn().mockResolvedValue(new Uint8Array([4, 5, 6]).buffer),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await synthesizeSpeech({
      text: 'Neural voice online.',
      provider: 'elevenlabs',
      model: 'eleven_flash_v2_5',
      voice: 'elevenlabs-custom',
      format: 'mp3',
      voiceSettings: {
        stability: 0.4,
        similarityBoost: 0.8,
        style: 0.2,
        speed: 1,
        useSpeakerBoost: true,
      },
    })

    expect(result.mimeType).toBe('audio/mpeg')
    expect(fetchMock.mock.calls[0]?.[0]).toContain(
      'https://api.elevenlabs.io/v1/text-to-speech/voice-123',
    )
    const payload = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string) as Record<
      string,
      unknown
    >
    expect(payload).toMatchObject({
      text: 'Neural voice online.',
      model_id: 'eleven_flash_v2_5',
      voice_settings: {
        stability: 0.4,
        similarity_boost: 0.8,
        style: 0.2,
        speed: 1,
        use_speaker_boost: true,
      },
    })
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

  it('adds an API key hint when OpenAI rejects the Responses request with 401', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: vi.fn().mockResolvedValue({
        error: {
          message: 'Incorrect API key provided.',
          type: 'invalid_request_error',
          code: 'invalid_api_key',
        },
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      createToolVoiceResponse({
        model: 'gpt-4o-mini',
        instructions: 'Use tools first.',
        tools: [],
        input: [{ type: 'message', role: 'user', content: 'Show queue depth.' }],
        previousResponseId: null,
      }),
    ).rejects.toThrow(/OPENAI_API_KEY; OpenAI rejected the key as invalid or expired/i)
  })
})
