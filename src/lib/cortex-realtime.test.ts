import { waitFor } from '@testing-library/react'
import {
  buildRealtimeSessionRequest,
  CortexRealtimeController,
} from './cortex-realtime'
import {
  DEFAULT_FALLBACK_DATA,
  type CortexBridge,
  type CortexRealtimeState,
  type CortexViewContext,
} from '@/shared/cortex'

const createBridgeStub = (overrides: Partial<CortexBridge> = {}): CortexBridge => ({
  getDashboardSnapshot: vi.fn().mockResolvedValue(DEFAULT_FALLBACK_DATA),
  listAgents: vi.fn().mockResolvedValue(DEFAULT_FALLBACK_DATA.agents),
  listMemories: vi.fn().mockResolvedValue(DEFAULT_FALLBACK_DATA.memories),
  listSchedules: vi.fn().mockResolvedValue(DEFAULT_FALLBACK_DATA.jobs),
  listLogs: vi.fn().mockResolvedValue(DEFAULT_FALLBACK_DATA.logs),
  runCommand: vi.fn().mockResolvedValue({
    commandId: 'run-ops-sync',
    ok: true,
    exitCode: 0,
    stdout: 'ok',
    stderr: '',
    ranAt: new Date().toISOString(),
    durationMs: 80,
  }),
  createRealtimeCall: vi.fn().mockResolvedValue('unused'),
  transcribeAudio: vi.fn().mockResolvedValue('hello cortex'),
  createRealtimeTranscriptionToken: vi.fn().mockResolvedValue({
    token: 'token-1',
    expiresAt: null,
  }),
  createToolVoiceResponse: vi.fn().mockResolvedValue({
    id: 'response-1',
    outputText: 'Tool voice response.',
    output: [],
  }),
  synthesizeSpeech: vi.fn().mockResolvedValue({
    audioBase64: '',
    mimeType: 'audio/mpeg',
  }),
  abortVoiceTurn: vi.fn().mockResolvedValue({
    ok: true,
    aborted: false,
    abortedStages: [],
    reason: 'none',
  }),
  recordRealtimeLog: vi.fn().mockResolvedValue(undefined),
  getRealtimeDebugEntries: vi.fn().mockResolvedValue([]),
  recordRealtimeDebug: vi.fn().mockResolvedValue(undefined),
  subscribeToEvents: vi.fn().mockImplementation(() => () => {}),
  subscribeToRealtimeDebug: vi.fn().mockImplementation(() => () => {}),
  ...overrides,
})

const createMediaStreamStub = () => {
  const track = {
    stop: vi.fn(),
  } as unknown as MediaStreamTrack

  return {
    stream: {
      getTracks: () => [track],
    } as MediaStream,
    track,
  }
}

const createAudioContextStub = () => {
  const sourceNode = {
    connect: vi.fn(),
    disconnect: vi.fn(),
  } as unknown as MediaStreamAudioSourceNode
  const processorNode = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    onaudioprocess: null,
  } as unknown as ScriptProcessorNode
  const gainNode = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    gain: {
      value: 1,
    },
  } as unknown as GainNode
  const analyser = {
    fftSize: 0,
    getByteTimeDomainData: vi.fn((buffer: Uint8Array) => buffer.fill(128)),
  } as unknown as AnalyserNode
  const audioContext = {
    createAnalyser: vi.fn(() => analyser),
    createMediaStreamSource: vi.fn(() => sourceNode),
    createScriptProcessor: vi.fn(() => processorNode),
    createGain: vi.fn(() => gainNode),
    destination: {},
    close: vi.fn().mockResolvedValue(undefined),
    sampleRate: 16000,
    state: 'running',
  } as unknown as AudioContext

  return {
    analyser,
    audioContext,
    gainNode,
    processorNode,
    sourceNode,
  }
}

class MockRealtimeTranscriptionSocket {
  static readonly OPEN = 1

  static readonly CONNECTING = 0

  readyState = MockRealtimeTranscriptionSocket.CONNECTING

  send = vi.fn()

  close = vi.fn(() => {
    this.readyState = 3
  })

  private listeners = new Map<string, Set<(event: Event | MessageEvent<string>) => void>>()

  addEventListener = (type: string, listener: (event: Event | MessageEvent<string>) => void) => {
    const bucket = this.listeners.get(type) ?? new Set()
    bucket.add(listener)
    this.listeners.set(type, bucket)
  }

  removeEventListener = (
    type: string,
    listener: (event: Event | MessageEvent<string>) => void,
  ) => {
    this.listeners.get(type)?.delete(listener)
  }

  emit(type: string, event?: Event | MessageEvent<string>) {
    if (type === 'open') {
      this.readyState = MockRealtimeTranscriptionSocket.OPEN
    }
    const payload = event ?? new Event(type)
    this.listeners.get(type)?.forEach((listener) => listener(payload))
  }
}

const TEST_VIEW_CONTEXT: CortexViewContext = {
  route: '/',
  routeTitle: 'Overview',
  routeSubtitle: 'Scavenjer command presence',
  uiMode: 'scavenjer',
  details: {
    neuralLoad: 74,
  },
}

const createController = (
  mode: 'premium_voice' | 'neural_voice' | 'lean_voice' | 'tool_voice' | 'ui_director',
  bridge: CortexBridge,
  states: CortexRealtimeState[],
  options: {
    realtimeTranscriptionSocketFactory?: (url: string) => MockRealtimeTranscriptionSocket
  } = {},
) => {
  const { stream } = createMediaStreamStub()
  const { audioContext } = createAudioContextStub()

  return new CortexRealtimeController(
    {
      api: bridge,
      getSessionRequest: () =>
        buildRealtimeSessionRequest(DEFAULT_FALLBACK_DATA, TEST_VIEW_CONTEXT, mode),
      onStateChange: (state) => {
        states.push(state)
      },
      onToolCall: vi.fn().mockResolvedValue({
        ok: true,
      }),
    },
    {
      audioContextFactory: () => audioContext,
      getUserMedia: vi.fn().mockResolvedValue(stream),
      realtimeTranscriptionSocketFactory: options.realtimeTranscriptionSocketFactory,
    },
  )
}

describe('CortexRealtimeController', () => {
  beforeEach(() => {
    vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(function (
      this: HTMLMediaElement,
    ) {
      this.dispatchEvent(new Event('playing'))
      return Promise.resolve()
    })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('maps each realtime mode to the shared voice pipeline presets', () => {
    const premiumRequest = buildRealtimeSessionRequest(
      DEFAULT_FALLBACK_DATA,
      TEST_VIEW_CONTEXT,
      'premium_voice',
    )
    const leanRequest = buildRealtimeSessionRequest(
      DEFAULT_FALLBACK_DATA,
      TEST_VIEW_CONTEXT,
      'lean_voice',
    )
    const neuralRequest = buildRealtimeSessionRequest(
      DEFAULT_FALLBACK_DATA,
      TEST_VIEW_CONTEXT,
      'neural_voice',
    )
    const toolRequest = buildRealtimeSessionRequest(
      DEFAULT_FALLBACK_DATA,
      TEST_VIEW_CONTEXT,
      'tool_voice',
    )
    const directorRequest = buildRealtimeSessionRequest(
      DEFAULT_FALLBACK_DATA,
      TEST_VIEW_CONTEXT,
      'ui_director',
    )

    expect(premiumRequest).toMatchObject({
      runtime: 'voice_pipeline',
      textModel: 'gpt-4.1',
      transcriptionModel: 'gpt-4o-mini-transcribe',
      speechModel: 'gpt-4o-mini-tts',
    })
    expect(leanRequest).toMatchObject({
      runtime: 'voice_pipeline',
      textModel: 'gpt-4.1-mini',
      transcriptionProvider: 'openai',
      transcriptionModel: 'gpt-4o-mini-transcribe',
      speechProvider: 'openai',
      speechModel: 'gpt-4o-mini-tts',
    })
    expect(neuralRequest).toMatchObject({
      runtime: 'voice_pipeline',
      textModel: 'gpt-4.1-mini',
      transcriptionProvider: 'elevenlabs',
      transcriptionModel: 'scribe_v2_realtime',
      speechProvider: 'elevenlabs',
      speechModel: 'eleven_flash_v2_5',
      voice: 'elevenlabs-custom',
    })
    expect(toolRequest).toMatchObject({
      runtime: 'voice_pipeline',
      textModel: 'gpt-4.1-mini',
      transcriptionProvider: 'openai',
      transcriptionModel: 'gpt-4o-mini-transcribe',
      speechProvider: 'openai',
      speechModel: 'gpt-4o-mini-tts',
    })
    expect(directorRequest).toMatchObject({
      runtime: 'voice_pipeline',
      textModel: 'gpt-4.1-mini',
      transcriptionProvider: 'openai',
      transcriptionModel: 'gpt-4o-mini-transcribe',
      speechProvider: 'openai',
      silentOutput: true,
      navigationPolicy: 'ask_then_move',
      toolPreference: 'ui_first',
    })
  })

  it('starts and stops the shared voice pipeline without using realtime WebRTC bootstrap', async () => {
    const bridge = createBridgeStub()
    const states: CortexRealtimeState[] = []
    const controller = createController('premium_voice', bridge, states)

    await controller.start()

    expect(bridge.createRealtimeCall).not.toHaveBeenCalled()
    expect(states.at(-1)).toMatchObject({
      active: true,
      status: 'listening',
      stage: 'ready',
      visualState: 'on',
    })

    await controller.stop()

    expect(states.at(-1)).toMatchObject({
      active: false,
      status: 'idle',
      stage: 'stopped',
      visualState: 'off',
    })
  })

  it('runs PRIME through transcribe -> respond -> speak with the premium reasoning model', async () => {
    const bridge = createBridgeStub({
      transcribeAudio: vi.fn().mockResolvedValue('Show me queue depth.'),
      createToolVoiceResponse: vi.fn().mockResolvedValue({
        id: 'response-prime-1',
        outputText: 'Queue depth is eleven.',
        output: [],
      }),
      synthesizeSpeech: vi.fn().mockResolvedValue({
        audioBase64: 'ZmFrZQ==',
        mimeType: 'audio/mpeg',
      }),
    })
    const states: CortexRealtimeState[] = []
    const controller = createController('premium_voice', bridge, states)

    await controller.start()

    const blob = {
      type: 'audio/webm',
      arrayBuffer: async () => new TextEncoder().encode('prime-turn').buffer,
    } as unknown as Blob

    await (controller as unknown as {
      processToolVoiceTurn: (blob: Blob, version: number) => Promise<void>
      version: number
    }).processToolVoiceTurn(blob, (controller as unknown as { version: number }).version)

    await waitFor(() => {
      expect(bridge.transcribeAudio).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o-mini-transcribe',
          mode: 'premium_voice',
        }),
      )
      expect(bridge.createToolVoiceResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4.1',
          mode: 'premium_voice',
        }),
      )
      expect(bridge.synthesizeSpeech).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o-mini-tts',
          mode: 'premium_voice',
        }),
      )
    })

    await waitFor(() => {
      expect(states.at(-1)).toMatchObject({
        active: true,
        status: 'speaking',
        stage: 'speaking',
        visualState: 'on',
        lastTranscriptPreview: 'Show me queue depth.',
        lastResponsePreview: 'Queue depth is eleven.',
      })
    })
  })

  it('routes NEURAL turns through ElevenLabs realtime streaming and the mini brain', async () => {
    const socket = new MockRealtimeTranscriptionSocket()
    const socketFactory = vi.fn(() => {
      queueMicrotask(() => {
        socket.emit(
          'message',
          new MessageEvent('message', {
            data: JSON.stringify({
              message_type: 'session_started',
              session_id: 'scribe-session-1',
            }),
          }),
        )
      })
      return socket
    })
    const bridge = createBridgeStub({
      createToolVoiceResponse: vi.fn().mockResolvedValue({
        id: 'response-neural-1',
        outputText: 'Neural voice stack is ready.',
        output: [],
      }),
      synthesizeSpeech: vi.fn().mockResolvedValue({
        audioBase64: 'ZmFrZQ==',
        mimeType: 'audio/mpeg',
      }),
    })
    const states: CortexRealtimeState[] = []
    const controller = createController('neural_voice', bridge, states, {
      realtimeTranscriptionSocketFactory: socketFactory,
    })

    await controller.start()

    socket.emit(
      'message',
      new MessageEvent('message', {
        data: JSON.stringify({
          message_type: 'committed_transcript',
          text: 'Shape the Cortex voice stack.',
        }),
      }),
    )

    await waitFor(() => {
      expect(bridge.createRealtimeTranscriptionToken).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'neural_voice',
          purpose: 'realtime_scribe',
        }),
      )
      expect(bridge.transcribeAudio).not.toHaveBeenCalled()
      expect(bridge.createToolVoiceResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4.1-mini',
          mode: 'neural_voice',
        }),
      )
      expect(bridge.synthesizeSpeech).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'elevenlabs',
          model: 'eleven_flash_v2_5',
          mode: 'neural_voice',
        }),
      )
    })

    expect(states.at(-1)).toMatchObject({
      active: true,
      status: 'speaking',
      stage: 'speaking',
      visualState: 'on',
    })
  })

  it('keeps previous_response_id continuity across VECTOR turns', async () => {
    const bridge = createBridgeStub({
      createToolVoiceResponse: vi
        .fn()
        .mockResolvedValueOnce({
          id: 'response-tool-1',
          outputText: 'First turn.',
          output: [],
        })
        .mockResolvedValueOnce({
          id: 'response-tool-2',
          outputText: 'Second turn.',
          output: [],
        }),
      synthesizeSpeech: vi.fn().mockResolvedValue({
        audioBase64: 'ZmFrZQ==',
        mimeType: 'audio/mpeg',
      }),
    })
    const states: CortexRealtimeState[] = []
    const controller = createController('tool_voice', bridge, states)

    await controller.start()

    const blob = {
      type: 'audio/webm',
      arrayBuffer: async () => new TextEncoder().encode('tool-voice').buffer,
    } as unknown as Blob

    const internal = controller as unknown as {
      processToolVoiceTurn: (blob: Blob, version: number) => Promise<void>
      version: number
    }

    await internal.processToolVoiceTurn(blob, internal.version)
    await internal.processToolVoiceTurn(blob, internal.version)

    expect(bridge.createToolVoiceResponse).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        model: 'gpt-4.1-mini',
        previousResponseId: null,
      }),
    )
    expect(bridge.createToolVoiceResponse).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        model: 'gpt-4.1-mini',
        previousResponseId: 'response-tool-1',
      }),
    )
  })

  it('routes tool calls through the same turn and feeds the results back into the follow-up response', async () => {
    const onToolCall = vi.fn().mockResolvedValue({
      ok: true,
      route: '/system',
    })
    const bridge = createBridgeStub({
      transcribeAudio: vi.fn().mockResolvedValue('Show me throughput.'),
      createToolVoiceResponse: vi
        .fn()
        .mockResolvedValueOnce({
          id: 'response-tool-1',
          outputText: '',
          output: [
            {
              type: 'function_call',
              call_id: 'call-1',
              name: 'focus_system_metric',
              arguments: JSON.stringify({
                metricKey: 'throughput',
              }),
            },
          ],
        })
        .mockResolvedValueOnce({
          id: 'response-tool-2',
          outputText: 'Opening Runtime and highlighting throughput.',
          output: [],
        }),
      synthesizeSpeech: vi.fn().mockResolvedValue({
        audioBase64: 'ZmFrZQ==',
        mimeType: 'audio/mpeg',
      }),
    })
    const states: CortexRealtimeState[] = []
    const { stream } = createMediaStreamStub()
    const { audioContext } = createAudioContextStub()
    const controller = new CortexRealtimeController(
      {
        api: bridge,
        getSessionRequest: () =>
          buildRealtimeSessionRequest(DEFAULT_FALLBACK_DATA, TEST_VIEW_CONTEXT, 'tool_voice'),
        onStateChange: (state) => {
          states.push(state)
        },
        onToolCall,
      },
      {
        audioContextFactory: () => audioContext,
        getUserMedia: vi.fn().mockResolvedValue(stream),
      },
    )

    await controller.start()

    const blob = {
      type: 'audio/webm',
      arrayBuffer: async () => new TextEncoder().encode('tool-call-turn').buffer,
    } as unknown as Blob

    await (controller as unknown as {
      processToolVoiceTurn: (blob: Blob, version: number) => Promise<void>
      version: number
    }).processToolVoiceTurn(blob, (controller as unknown as { version: number }).version)

    expect(onToolCall).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'focus_system_metric',
        mode: 'tool_voice',
      }),
    )
    expect(bridge.createToolVoiceResponse).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        input: [
          expect.objectContaining({
            type: 'function_call_output',
            call_id: 'call-1',
          }),
        ],
      }),
    )
    await waitFor(() => {
      expect(states.at(-1)).toMatchObject({
        lastToolCall: expect.objectContaining({
          name: 'focus_system_metric',
        }),
        stage: 'speaking',
      })
    })
  })

  it('keeps GUIDE silent while still processing spoken turns', async () => {
    const bridge = createBridgeStub({
      transcribeAudio: vi.fn().mockResolvedValue('Show me queue depth.'),
      createToolVoiceResponse: vi.fn().mockResolvedValue({
        id: 'response-guide-1',
        outputText: 'Opening Runtime and highlighting queue depth.',
        output: [],
      }),
    })
    const states: CortexRealtimeState[] = []
    const controller = createController('ui_director', bridge, states)

    await controller.start()

    const blob = {
      type: 'audio/webm',
      arrayBuffer: async () => new TextEncoder().encode('guide-turn').buffer,
    } as unknown as Blob

    await (controller as unknown as {
      processToolVoiceTurn: (blob: Blob, version: number) => Promise<void>
      version: number
    }).processToolVoiceTurn(blob, (controller as unknown as { version: number }).version)

    expect(bridge.createToolVoiceResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-4.1-mini',
        mode: 'ui_director',
      }),
    )
    expect(bridge.synthesizeSpeech).not.toHaveBeenCalled()
    expect(states.at(-1)).toMatchObject({
      active: true,
      status: 'listening',
      stage: 'silent_complete',
      visualState: 'on',
    })
  })

  it('interrupts PRIME or ECO playback on new speech without tearing down the session', async () => {
    const bridge = createBridgeStub({
      abortVoiceTurn: vi.fn().mockResolvedValue({
        ok: true,
        aborted: true,
        abortedStages: ['speaking'],
        reason: 'barge_in',
      }),
    })
    const states: CortexRealtimeState[] = []
    const controller = createController('lean_voice', bridge, states)

    await controller.start()

    const internal = controller as unknown as {
      interruptSpeakingTurn: (resources: unknown, version: number, level: number) => Promise<void>
      startToolVoiceRecorder: (resources: unknown, version: number) => void
      toolVoiceResources: Record<string, unknown> | null
      state: CortexRealtimeState
      version: number
    }

    expect(internal.toolVoiceResources).not.toBeNull()
    const startRecorderSpy = vi
      .spyOn(internal, 'startToolVoiceRecorder')
      .mockImplementation(() => {})

    internal.state = {
      ...internal.state,
      active: true,
      status: 'speaking',
      stage: 'speaking',
      sessionAttemptId: 'session-1',
      turnId: 'turn-1',
      lastResponsePreview: 'The current queue depth is eleven.',
    }

    await internal.interruptSpeakingTurn(internal.toolVoiceResources!, internal.version, 40)

    expect(bridge.abortVoiceTurn).toHaveBeenCalledWith({
      sessionAttemptId: 'session-1',
      turnId: 'turn-1',
      reason: 'barge_in',
    })
    expect(startRecorderSpy).toHaveBeenCalled()
    expect(states.at(-1)).toMatchObject({
      lastInterruptionReason: 'barge_in',
      lastAbortedStage: 'speaking',
      lastInterruptedResponsePreview: 'The current queue depth is eleven.',
    })
  })

  it('prints milestone console logs when realtime debug is enabled', async () => {
    vi.stubEnv('VITE_CORTEX_REALTIME_DEBUG', 'true')

    const bridge = createBridgeStub()
    const states: CortexRealtimeState[] = []
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const controller = createController('premium_voice', bridge, states)

    await controller.start()

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('[RT][renderer] Start requested.'),
      expect.objectContaining({
        mode: 'premium_voice',
        runtime: 'voice_pipeline',
      }),
    )
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('[RT][renderer] Starting chained voice pipeline.'),
      expect.objectContaining({
        mode: 'premium_voice',
        runtime: 'voice_pipeline',
      }),
    )
  })
})
