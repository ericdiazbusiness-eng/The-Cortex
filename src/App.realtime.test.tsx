import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { DEFAULT_FALLBACK_DATA, type CortexBridge } from '@/shared/cortex'
import { UI_MODE_STORAGE_KEY } from '@/lib/ui-mode'

class FakeDataChannel extends EventTarget {
  readyState: RTCDataChannelState = 'connecting'

  send = vi.fn()

  close() {
    this.readyState = 'closed'
    this.dispatchEvent(new Event('close'))
  }

  open() {
    this.readyState = 'open'
    this.dispatchEvent(new Event('open'))
  }
}

class FakePeerConnection extends EventTarget {
  readonly dataChannel = new FakeDataChannel()

  readonly addTrack = vi.fn()

  readonly close = vi.fn(() => {
    this.signalingState = 'closed'
  })

  readonly createDataChannel = vi.fn(() => this.dataChannel)

  readonly createOffer = vi.fn(async () => ({
    sdp: 'offer-sdp',
    type: 'offer',
  }))

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

const clone = <T,>(value: T) => JSON.parse(JSON.stringify(value)) as T

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

const clearStoredMode = () => {
  window.localStorage?.removeItem?.(UI_MODE_STORAGE_KEY)
}

describe('The Cortex realtime voice flow', () => {
  beforeEach(() => {
    clearStoredMode()
    window.location.hash = '#/'
    vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    delete window.cortexApi
    clearStoredMode()
    window.location.hash = '#/'
  })

  it('keeps the realtime session alive across route changes and returns to idle on stop', async () => {
    const user = userEvent.setup()
    const peerConnection = new FakePeerConnection()
    const media = createMediaStreamStub()
    const api: CortexBridge = {
      getDashboardSnapshot: vi.fn().mockResolvedValue(clone(DEFAULT_FALLBACK_DATA)),
      listAgents: vi.fn().mockResolvedValue(clone(DEFAULT_FALLBACK_DATA.agents)),
      listMemories: vi.fn().mockResolvedValue(clone(DEFAULT_FALLBACK_DATA.memories)),
      listSchedules: vi.fn().mockResolvedValue(clone(DEFAULT_FALLBACK_DATA.jobs)),
      listLogs: vi.fn().mockResolvedValue(clone(DEFAULT_FALLBACK_DATA.logs)),
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
      transcribeAudio: vi.fn().mockResolvedValue(''),
      createToolVoiceResponse: vi.fn().mockResolvedValue({
        id: 'response-1',
        outputText: '',
        output: [],
      }),
      synthesizeSpeech: vi.fn().mockResolvedValue({
        audioBase64: '',
        mimeType: 'audio/mpeg',
      }),
      recordRealtimeLog: vi.fn().mockResolvedValue(undefined),
      subscribeToEvents: vi.fn().mockImplementation(() => () => {}),
    }

    window.cortexApi = api
    vi.stubGlobal(
      'RTCPeerConnection',
      function MockRTCPeerConnection() {
        return peerConnection as unknown as RTCPeerConnection
      },
    )
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue(media.stream),
      },
    })

    render(<App />)

    const startButton = await screen.findByRole('button', { name: /start realtime voice/i })
    await user.click(startButton)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /stop realtime voice/i })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
      expect(screen.getByRole('button', { name: /stop realtime voice/i })).toHaveAttribute(
        'data-realtime-state',
        'on',
      )
    })

    await user.click(screen.getByRole('link', { name: /Ops Memory/i }))
    await waitFor(() => {
      expect(screen.getByText('Central memory stream')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('link', { name: /Overview/i }))

    const stopButton = await screen.findByRole('button', { name: /stop realtime voice/i })
    expect(stopButton).toHaveAttribute('aria-pressed', 'true')

    await user.click(stopButton)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /start realtime voice/i })).toHaveAttribute(
        'data-realtime-state',
        'off',
      )
    })
  })

  it('returns the neural interface to its idle visual state after a realtime bootstrap failure', async () => {
    const user = userEvent.setup()
    const peerConnection = new FakePeerConnection()
    const media = createMediaStreamStub()
    const api: CortexBridge = {
      getDashboardSnapshot: vi.fn().mockResolvedValue(clone(DEFAULT_FALLBACK_DATA)),
      listAgents: vi.fn().mockResolvedValue(clone(DEFAULT_FALLBACK_DATA.agents)),
      listMemories: vi.fn().mockResolvedValue(clone(DEFAULT_FALLBACK_DATA.memories)),
      listSchedules: vi.fn().mockResolvedValue(clone(DEFAULT_FALLBACK_DATA.jobs)),
      listLogs: vi.fn().mockResolvedValue(clone(DEFAULT_FALLBACK_DATA.logs)),
      runCommand: vi.fn().mockResolvedValue({
        commandId: 'run-ops-sync',
        ok: true,
        exitCode: 0,
        stdout: 'ok',
        stderr: '',
        ranAt: new Date().toISOString(),
        durationMs: 80,
      }),
      createRealtimeCall: vi
        .fn()
        .mockRejectedValue(new Error('Missing OPENAI_API_KEY for realtime voice.')),
      transcribeAudio: vi.fn().mockResolvedValue(''),
      createToolVoiceResponse: vi.fn().mockResolvedValue({
        id: 'response-1',
        outputText: '',
        output: [],
      }),
      synthesizeSpeech: vi.fn().mockResolvedValue({
        audioBase64: '',
        mimeType: 'audio/mpeg',
      }),
      recordRealtimeLog: vi.fn().mockResolvedValue(undefined),
      subscribeToEvents: vi.fn().mockImplementation(() => () => {}),
    }

    window.cortexApi = api
    vi.stubGlobal(
      'RTCPeerConnection',
      function MockRTCPeerConnection() {
        return peerConnection as unknown as RTCPeerConnection
      },
    )
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue(media.stream),
      },
    })

    render(<App />)

    await user.click(await screen.findByRole('button', { name: /start realtime voice/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /start realtime voice/i })).toHaveAttribute(
        'data-realtime-state',
        'off',
      )
    })
  })

  it('keeps the live realtime session running when the mode toggle changes', async () => {
    const user = userEvent.setup()
    const peerConnection = new FakePeerConnection()
    const media = createMediaStreamStub()
    const api: CortexBridge = {
      getDashboardSnapshot: vi.fn().mockResolvedValue(clone(DEFAULT_FALLBACK_DATA)),
      listAgents: vi.fn().mockResolvedValue(clone(DEFAULT_FALLBACK_DATA.agents)),
      listMemories: vi.fn().mockResolvedValue(clone(DEFAULT_FALLBACK_DATA.memories)),
      listSchedules: vi.fn().mockResolvedValue(clone(DEFAULT_FALLBACK_DATA.jobs)),
      listLogs: vi.fn().mockResolvedValue(clone(DEFAULT_FALLBACK_DATA.logs)),
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
      transcribeAudio: vi.fn().mockResolvedValue(''),
      createToolVoiceResponse: vi.fn().mockResolvedValue({
        id: 'response-1',
        outputText: '',
        output: [],
      }),
      synthesizeSpeech: vi.fn().mockResolvedValue({
        audioBase64: '',
        mimeType: 'audio/mpeg',
      }),
      recordRealtimeLog: vi.fn().mockResolvedValue(undefined),
      subscribeToEvents: vi.fn().mockImplementation(() => () => {}),
    }

    window.cortexApi = api
    vi.stubGlobal(
      'RTCPeerConnection',
      function MockRTCPeerConnection() {
        return peerConnection as unknown as RTCPeerConnection
      },
    )
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue(media.stream),
      },
    })

    render(<App />)

    await user.click(await screen.findByRole('button', { name: /start realtime voice/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /stop realtime voice/i })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
    })

    await user.click(screen.getByRole('radio', { name: /lean voice mode/i }))

    expect(screen.getByRole('button', { name: /stop realtime voice/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(api.createRealtimeCall).toHaveBeenCalledTimes(1)
  })

  it('can start realtime after the Electron bridge becomes available post-render', async () => {
    const user = userEvent.setup()
    const peerConnection = new FakePeerConnection()
    const media = createMediaStreamStub()

    render(<App />)

    const api: CortexBridge = {
      getDashboardSnapshot: vi.fn().mockResolvedValue(clone(DEFAULT_FALLBACK_DATA)),
      listAgents: vi.fn().mockResolvedValue(clone(DEFAULT_FALLBACK_DATA.agents)),
      listMemories: vi.fn().mockResolvedValue(clone(DEFAULT_FALLBACK_DATA.memories)),
      listSchedules: vi.fn().mockResolvedValue(clone(DEFAULT_FALLBACK_DATA.jobs)),
      listLogs: vi.fn().mockResolvedValue(clone(DEFAULT_FALLBACK_DATA.logs)),
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
      transcribeAudio: vi.fn().mockResolvedValue(''),
      createToolVoiceResponse: vi.fn().mockResolvedValue({
        id: 'response-1',
        outputText: '',
        output: [],
      }),
      synthesizeSpeech: vi.fn().mockResolvedValue({
        audioBase64: '',
        mimeType: 'audio/mpeg',
      }),
      recordRealtimeLog: vi.fn().mockResolvedValue(undefined),
      subscribeToEvents: vi.fn().mockImplementation(() => () => {}),
    }

    window.cortexApi = api
    vi.stubGlobal(
      'RTCPeerConnection',
      function MockRTCPeerConnection() {
        return peerConnection as unknown as RTCPeerConnection
      },
    )
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue(media.stream),
      },
    })

    await user.click(await screen.findByRole('button', { name: /start realtime voice/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /stop realtime voice/i })).toHaveAttribute(
        'data-realtime-state',
        'on',
      )
    })
    expect(api.createRealtimeCall).toHaveBeenCalledTimes(1)
  })
})
