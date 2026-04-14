import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { DEFAULT_FALLBACK_DATA, type CortexBridge } from '@/shared/cortex'
import { UI_MODE_STORAGE_KEY } from '@/lib/ui-mode'

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

const installAudioContextStub = () => {
  const sourceNode = {
    connect: vi.fn(),
    disconnect: vi.fn(),
  }
  const analyser = {
    fftSize: 0,
    getByteTimeDomainData: vi.fn((buffer: Uint8Array) => buffer.fill(128)),
  }

  class MockAudioContext {
    state: AudioContextState = 'running'

    createAnalyser() {
      return analyser as unknown as AnalyserNode
    }

    createMediaStreamSource() {
      return sourceNode as unknown as MediaStreamAudioSourceNode
    }

    close() {
      return Promise.resolve()
    }
  }

  vi.stubGlobal('AudioContext', MockAudioContext)
}

const createApiStub = (overrides: Partial<CortexBridge> = {}): CortexBridge => ({
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

const clearStoredMode = () => {
  window.localStorage?.removeItem?.(UI_MODE_STORAGE_KEY)
}

describe('The Cortex realtime voice flow', () => {
  beforeEach(() => {
    clearStoredMode()
    window.location.hash = '#/'
    vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    installAudioContextStub()
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
    const media = createMediaStreamStub()
    const api = createApiStub()

    window.cortexApi = api
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
    const api = createApiStub({
      getDashboardSnapshot: vi.fn().mockResolvedValue(clone(DEFAULT_FALLBACK_DATA)),
    })

    window.cortexApi = api
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockRejectedValue(new Error('Microphone access denied.')),
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
    const media = createMediaStreamStub()
    const api = createApiStub()

    window.cortexApi = api
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
    expect(api.createRealtimeCall).not.toHaveBeenCalled()
  })

  it('can start realtime after the Electron bridge becomes available post-render', async () => {
    const user = userEvent.setup()
    const media = createMediaStreamStub()

    render(<App />)

    const api = createApiStub()

    window.cortexApi = api
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
    expect(api.createRealtimeCall).not.toHaveBeenCalled()
  })
})
