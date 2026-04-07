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

class FakeDataChannel extends EventTarget {
  readyState: RTCDataChannelState = 'connecting'

  sent: string[] = []

  close() {
    this.readyState = 'closed'
    this.dispatchEvent(new Event('close'))
  }

  emitJson(payload: unknown) {
    this.dispatchEvent(
      new MessageEvent('message', {
        data: JSON.stringify(payload),
      }),
    )
  }

  open() {
    this.readyState = 'open'
    this.dispatchEvent(new Event('open'))
  }

  send(payload: string) {
    this.sent.push(payload)
  }
}

class FakePeerConnection extends EventTarget {
  readonly createOffer = vi.fn(async () => ({
    sdp: 'offer-sdp',
    type: 'offer',
  }))

  readonly createDataChannel = vi.fn(() => this.dataChannel)

  readonly addTrack = vi.fn()

  readonly close = vi.fn(() => {
    this.signalingState = 'closed'
  })

  readonly dataChannel = new FakeDataChannel()

  readonly setLocalDescription = vi.fn(async (description) => {
    this.localDescription = description
    this.iceGatheringState = 'complete'
    this.dispatchEvent(new Event('icegatheringstatechange'))
  })

  readonly setRemoteDescription = vi.fn(async () => {
    this.connectionState = 'connected'
    this.iceConnectionState = 'connected'
    this.dispatchEvent(new Event('connectionstatechange'))
    this.dispatchEvent(new Event('iceconnectionstatechange'))
    this.dataChannel.open()
  })

  connectionState: RTCPeerConnectionState = 'new'

  iceConnectionState: RTCIceConnectionState = 'new'

  iceGatheringState: RTCIceGatheringState = 'new'

  localDescription: RTCSessionDescriptionInit | null = null

  ontrack: ((event: RTCTrackEvent) => void) | null = null

  signalingState: RTCSignalingState = 'stable'
}

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
  createRealtimeCall: vi.fn().mockResolvedValue('answer-sdp'),
  transcribeAudio: vi.fn().mockResolvedValue('hello cortex'),
  createToolVoiceResponse: vi.fn().mockResolvedValue({
    id: 'response-1',
    outputText: 'Tool voice response.',
    output: [],
  }),
  synthesizeSpeech: vi.fn().mockResolvedValue({
    audioBase64: '',
    mimeType: 'audio/mpeg',
  }),
  recordRealtimeLog: vi.fn().mockResolvedValue(undefined),
  subscribeToEvents: vi.fn().mockImplementation(() => () => {}),
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
  const analyser = {
    fftSize: 0,
    getByteTimeDomainData: vi.fn(),
  } as unknown as AnalyserNode
  const audioContext = {
    createAnalyser: vi.fn(() => analyser),
    createMediaStreamSource: vi.fn(() => sourceNode),
    close: vi.fn().mockResolvedValue(undefined),
    state: 'running',
  } as unknown as AudioContext

  return {
    analyser,
    audioContext,
    sourceNode,
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

describe('CortexRealtimeController', () => {
  beforeEach(() => {
    vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('starts, connects, and tears down realtime resources', async () => {
    const peerConnection = new FakePeerConnection()
    const { stream, track } = createMediaStreamStub()
    const { audioContext } = createAudioContextStub()
    const bridge = createBridgeStub()
    const states: CortexRealtimeState[] = []

    const controller = new CortexRealtimeController(
      {
        api: bridge,
        getSessionRequest: () =>
          buildRealtimeSessionRequest(DEFAULT_FALLBACK_DATA, TEST_VIEW_CONTEXT, 'premium_voice'),
        onStateChange: (state) => {
          states.push(state)
        },
        onToolCall: vi.fn(),
      },
      {
        audioContextFactory: () => audioContext,
        getUserMedia: vi.fn().mockResolvedValue(stream),
        rtcPeerConnectionFactory: () => peerConnection as unknown as RTCPeerConnection,
      },
    )

    await controller.start()

    expect(bridge.createRealtimeCall).toHaveBeenCalledWith(
      'offer-sdp',
      expect.objectContaining({
        context: TEST_VIEW_CONTEXT,
      }),
    )
    expect(peerConnection.addTrack).toHaveBeenCalledWith(track, stream)
    expect(states.at(-1)).toMatchObject({
      active: true,
      status: 'listening',
      visualState: 'on',
    })

    expect(
      peerConnection.dataChannel.sent.some((payload) => {
        const parsed = JSON.parse(payload)
        return (
          parsed.type === 'session.update' &&
          parsed.session?.audio?.input?.turn_detection === null &&
          parsed.session?.audio?.output?.voice === 'marin'
        )
      }),
    ).toBe(true)

    expect(
      (
        controller as unknown as {
          toolVoiceResources: unknown
        }
      ).toolVoiceResources,
    ).toBeTruthy()

    await controller.stop()

    expect(track.stop).toHaveBeenCalled()
    expect(peerConnection.close).toHaveBeenCalled()
    expect(states.at(-1)).toMatchObject({
      active: false,
      status: 'idle',
      visualState: 'off',
    })
  })

  it('maps each realtime mode to the expected engine and model stack', () => {
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
      engine: 'webrtc',
      model: 'gpt-realtime-1.5',
      transcriptionModel: 'gpt-4o-mini-transcribe',
    })
    expect(leanRequest).toMatchObject({
      engine: 'webrtc',
      model: 'gpt-realtime-mini',
      transcriptionModel: 'gpt-4o-mini-transcribe',
    })
    expect(toolRequest).toMatchObject({
      engine: 'tool_voice',
      textModel: 'gpt-4o-mini',
      transcriptionModel: 'gpt-4o-mini-transcribe',
      speechModel: 'gpt-4o-mini-tts',
    })
    expect(directorRequest).toMatchObject({
      engine: 'tool_voice',
      textModel: 'gpt-4o-mini',
      transcriptionModel: 'gpt-4o-mini-transcribe',
      silentOutput: true,
      navigationPolicy: 'ask_then_move',
      toolPreference: 'ui_first',
    })
  })

  it('moves into an error state when realtime bootstrap fails', async () => {
    const peerConnection = new FakePeerConnection()
    const { stream } = createMediaStreamStub()
    const { audioContext } = createAudioContextStub()
    const bridge = createBridgeStub({
      createRealtimeCall: vi
        .fn()
        .mockRejectedValue(new Error('Missing OPENAI_API_KEY for realtime voice.')),
    })
    const states: CortexRealtimeState[] = []

    const controller = new CortexRealtimeController(
      {
        api: bridge,
        getSessionRequest: () =>
          buildRealtimeSessionRequest(DEFAULT_FALLBACK_DATA, TEST_VIEW_CONTEXT, 'premium_voice'),
        onStateChange: (state) => {
          states.push(state)
        },
        onToolCall: vi.fn(),
      },
      {
        audioContextFactory: () => audioContext,
        getUserMedia: vi.fn().mockResolvedValue(stream),
        rtcPeerConnectionFactory: () => peerConnection as unknown as RTCPeerConnection,
      },
    )

    await controller.start()

    expect(states.at(-1)).toMatchObject({
      active: false,
      status: 'error',
      visualState: 'off',
      error: 'Missing OPENAI_API_KEY for realtime voice.',
    })
  })

  it('returns to off when the live channel closes unexpectedly', async () => {
    const peerConnection = new FakePeerConnection()
    const { stream } = createMediaStreamStub()
    const { audioContext } = createAudioContextStub()
    const states: CortexRealtimeState[] = []

    const controller = new CortexRealtimeController(
      {
        api: createBridgeStub(),
        getSessionRequest: () =>
          buildRealtimeSessionRequest(DEFAULT_FALLBACK_DATA, TEST_VIEW_CONTEXT, 'premium_voice'),
        onStateChange: (state) => {
          states.push(state)
        },
        onToolCall: vi.fn(),
      },
      {
        audioContextFactory: () => audioContext,
        getUserMedia: vi.fn().mockResolvedValue(stream),
        rtcPeerConnectionFactory: () => peerConnection as unknown as RTCPeerConnection,
      },
    )

    await controller.start()
    peerConnection.dataChannel.close()

    await waitFor(() => {
      expect(states.at(-1)).toMatchObject({
        active: false,
        visualState: 'off',
        status: 'error',
      })
    })
  })

  it('round-trips tool calls back into the realtime data channel', async () => {
    const peerConnection = new FakePeerConnection()
    const { stream } = createMediaStreamStub()
    const { audioContext } = createAudioContextStub()
    const onToolCall = vi.fn().mockResolvedValue({
      ok: true,
      system: 'healthy',
    })

    const controller = new CortexRealtimeController(
      {
        api: createBridgeStub(),
        getSessionRequest: () =>
          buildRealtimeSessionRequest(DEFAULT_FALLBACK_DATA, TEST_VIEW_CONTEXT, 'premium_voice'),
        onStateChange: vi.fn(),
        onToolCall,
      },
      {
        audioContextFactory: () => audioContext,
        getUserMedia: vi.fn().mockResolvedValue(stream),
        rtcPeerConnectionFactory: () => peerConnection as unknown as RTCPeerConnection,
      },
    )

    await controller.start()

    peerConnection.dataChannel.emitJson({
      type: 'response.done',
      response: {
        output: [
          {
            type: 'function_call',
            name: 'get_ui_context',
            call_id: 'call-1',
            arguments: '{"route":"/"}',
          },
        ],
      },
    })

    await waitFor(() => {
      expect(onToolCall).toHaveBeenCalledWith({
        name: 'get_ui_context',
        callId: 'call-1',
        arguments: {
          route: '/',
        },
      })
    })

    expect(
      peerConnection.dataChannel.sent.some((payload) => {
        const parsed = JSON.parse(payload)
        return (
          parsed.type === 'conversation.item.create' &&
          parsed.item?.type === 'function_call_output' &&
          parsed.item?.call_id === 'call-1'
        )
      }),
    ).toBe(true)
    expect(
      peerConnection.dataChannel.sent.some((payload) => {
        const parsed = JSON.parse(payload)
        return (
          parsed.type === 'response.create' &&
          Array.isArray(parsed.response?.output_modalities) &&
          parsed.response.output_modalities.includes('audio')
        )
      }),
    ).toBe(true)
  })

  it('uses the transcription, tool-response, and speech pipeline in tool voice mode', async () => {
    const { stream } = createMediaStreamStub()
    const bridge = createBridgeStub({
      transcribeAudio: vi.fn().mockResolvedValue('Show me the runtime queue depth.'),
      createToolVoiceResponse: vi.fn().mockResolvedValue({
        id: 'response-tool-1',
        outputText: 'Queue depth is eleven and I can open Runtime to show it.',
        output: [],
      }),
      synthesizeSpeech: vi.fn().mockResolvedValue({
        audioBase64: 'ZmFrZQ==',
        mimeType: 'audio/mpeg',
      }),
    })
    const states: CortexRealtimeState[] = []
    const sourceNode = {
      connect: vi.fn(),
      disconnect: vi.fn(),
    } as unknown as MediaStreamAudioSourceNode
    const analyser = {
      fftSize: 0,
      getByteTimeDomainData: vi.fn(),
    } as unknown as AnalyserNode
    const audioContext = {
      createAnalyser: vi.fn(() => analyser),
      createMediaStreamSource: vi.fn(() => sourceNode),
      close: vi.fn().mockResolvedValue(undefined),
    } as unknown as AudioContext

    vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)

    const controller = new CortexRealtimeController(
      {
        api: bridge,
        getSessionRequest: () =>
          buildRealtimeSessionRequest(DEFAULT_FALLBACK_DATA, TEST_VIEW_CONTEXT, 'tool_voice'),
        onStateChange: (state) => {
          states.push(state)
        },
        onToolCall: vi.fn(),
      },
      {
        audioContextFactory: () => audioContext,
        getUserMedia: vi.fn().mockResolvedValue(stream),
      },
    )

    await controller.start()

    expect(bridge.createRealtimeCall).not.toHaveBeenCalled()
    expect(states.at(-1)).toMatchObject({
      active: true,
      status: 'listening',
      visualState: 'on',
    })

    const toolVoiceBlob = {
      type: 'audio/webm',
      arrayBuffer: async () => new TextEncoder().encode('tool-voice').buffer,
    } as unknown as Blob

    await (controller as unknown as {
      processToolVoiceTurn: (blob: Blob, version: number) => Promise<void>
      version: number
    }).processToolVoiceTurn(
      toolVoiceBlob,
      (controller as unknown as { version: number }).version,
    )

    await waitFor(() => {
      expect(bridge.transcribeAudio).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o-mini-transcribe',
        }),
      )
      expect(bridge.createToolVoiceResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o-mini',
        }),
      )
      expect(bridge.synthesizeSpeech).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o-mini-tts',
          voice: 'marin',
        }),
      )
    })

    expect(states.at(-1)).toMatchObject({
      active: true,
      status: 'speaking',
      visualState: 'on',
    })

    await controller.stop()
  })

  it('keeps tool voice response context across multiple turns', async () => {
    const { stream } = createMediaStreamStub()
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
    const sourceNode = {
      connect: vi.fn(),
      disconnect: vi.fn(),
    } as unknown as MediaStreamAudioSourceNode
    const analyser = {
      fftSize: 0,
      getByteTimeDomainData: vi.fn(),
    } as unknown as AnalyserNode
    const audioContext = {
      createAnalyser: vi.fn(() => analyser),
      createMediaStreamSource: vi.fn(() => sourceNode),
      close: vi.fn().mockResolvedValue(undefined),
    } as unknown as AudioContext

    vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)

    const controller = new CortexRealtimeController(
      {
        api: bridge,
        getSessionRequest: () =>
          buildRealtimeSessionRequest(DEFAULT_FALLBACK_DATA, TEST_VIEW_CONTEXT, 'tool_voice'),
        onStateChange: vi.fn(),
        onToolCall: vi.fn(),
      },
      {
        audioContextFactory: () => audioContext,
        getUserMedia: vi.fn().mockResolvedValue(stream),
      },
    )

    await controller.start()

    const toolVoiceBlob = {
      type: 'audio/webm',
      arrayBuffer: async () => new TextEncoder().encode('tool-voice').buffer,
    } as unknown as Blob

    await (controller as unknown as {
      processToolVoiceTurn: (blob: Blob, version: number) => Promise<void>
      version: number
    }).processToolVoiceTurn(
      toolVoiceBlob,
      (controller as unknown as { version: number }).version,
    )

    await (controller as unknown as {
      processToolVoiceTurn: (blob: Blob, version: number) => Promise<void>
      version: number
    }).processToolVoiceTurn(
      toolVoiceBlob,
      (controller as unknown as { version: number }).version,
    )

    expect(bridge.createToolVoiceResponse).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        previousResponseId: null,
      }),
    )
    expect(bridge.createToolVoiceResponse).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        previousResponseId: 'response-tool-1',
      }),
    )
  })

  it('keeps UI director silent while still processing spoken turns', async () => {
    const { stream } = createMediaStreamStub()
    const bridge = createBridgeStub({
      transcribeAudio: vi.fn().mockResolvedValue('Show me queue depth.'),
      createToolVoiceResponse: vi.fn().mockResolvedValue({
        id: 'response-guide-1',
        outputText: 'Opening Runtime and highlighting queue depth.',
        output: [],
      }),
    })
    const states: CortexRealtimeState[] = []
    const sourceNode = {
      connect: vi.fn(),
      disconnect: vi.fn(),
    } as unknown as MediaStreamAudioSourceNode
    const analyser = {
      fftSize: 0,
      getByteTimeDomainData: vi.fn(),
    } as unknown as AnalyserNode
    const audioContext = {
      createAnalyser: vi.fn(() => analyser),
      createMediaStreamSource: vi.fn(() => sourceNode),
      close: vi.fn().mockResolvedValue(undefined),
    } as unknown as AudioContext

    const controller = new CortexRealtimeController(
      {
        api: bridge,
        getSessionRequest: () =>
          buildRealtimeSessionRequest(DEFAULT_FALLBACK_DATA, TEST_VIEW_CONTEXT, 'ui_director'),
        onStateChange: (state) => {
          states.push(state)
        },
        onToolCall: vi.fn(),
      },
      {
        audioContextFactory: () => audioContext,
        getUserMedia: vi.fn().mockResolvedValue(stream),
      },
    )

    await controller.start()

    const toolVoiceBlob = {
      type: 'audio/webm',
      arrayBuffer: async () => new TextEncoder().encode('ui-director').buffer,
    } as unknown as Blob

    await (controller as unknown as {
      processToolVoiceTurn: (blob: Blob, version: number) => Promise<void>
      version: number
    }).processToolVoiceTurn(
      toolVoiceBlob,
      (controller as unknown as { version: number }).version,
    )

    expect(bridge.createToolVoiceResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-4o-mini',
      }),
    )
    expect(bridge.synthesizeSpeech).not.toHaveBeenCalled()
    expect(states.at(-1)).toMatchObject({
      active: true,
      status: 'listening',
      visualState: 'on',
    })
  })

  it('transcribes local speech and sends text turns into the live realtime session', async () => {
    const peerConnection = new FakePeerConnection()
    const { stream } = createMediaStreamStub()
    const { audioContext } = createAudioContextStub()
    const bridge = createBridgeStub({
      transcribeAudio: vi.fn().mockResolvedValue('Show me the queue depth.'),
    })

    const controller = new CortexRealtimeController(
      {
        api: bridge,
        getSessionRequest: () =>
          buildRealtimeSessionRequest(DEFAULT_FALLBACK_DATA, TEST_VIEW_CONTEXT, 'premium_voice'),
        onStateChange: vi.fn(),
        onToolCall: vi.fn(),
      },
      {
        audioContextFactory: () => audioContext,
        getUserMedia: vi.fn().mockResolvedValue(stream),
        rtcPeerConnectionFactory: () => peerConnection as unknown as RTCPeerConnection,
      },
    )

    await controller.start()

    const turnBlob = {
      size: 8,
      type: 'audio/webm',
      arrayBuffer: async () => new TextEncoder().encode('voice-turn').buffer,
    } as unknown as Blob

    await (controller as unknown as {
      processToolVoiceTurn: (blob: Blob, version: number) => Promise<void>
      version: number
    }).processToolVoiceTurn(turnBlob, (controller as unknown as { version: number }).version)

    expect(bridge.transcribeAudio).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-4o-mini-transcribe',
      }),
    )
    expect(
      peerConnection.dataChannel.sent.some((payload) => {
        const parsed = JSON.parse(payload)
        return (
          parsed.type === 'conversation.item.create' &&
          parsed.item?.type === 'message' &&
          parsed.item?.content?.[0]?.type === 'input_text' &&
          parsed.item?.content?.[0]?.text === 'Show me the queue depth.'
        )
      }),
    ).toBe(true)
    expect(
      peerConnection.dataChannel.sent.some((payload) => {
        const parsed = JSON.parse(payload)
        return (
          parsed.type === 'response.create' &&
          Array.isArray(parsed.response?.output_modalities) &&
          parsed.response.output_modalities.includes('audio')
        )
      }),
    ).toBe(true)
  })
})
