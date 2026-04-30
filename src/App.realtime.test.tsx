import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import {
  DEFAULT_BUSINESS_FALLBACK_DATA,
  DEFAULT_FALLBACK_DATA,
  type CortexBridge,
} from '@/shared/cortex'

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

const createApiStub = (): CortexBridge => ({
  getWorkspaceSnapshot: vi.fn().mockImplementation(async (workspace: 'cortex' | 'business') =>
    workspace === 'business'
      ? {
          workspace,
          dashboard: clone(DEFAULT_BUSINESS_FALLBACK_DATA),
        }
      : {
          workspace,
          dashboard: clone(DEFAULT_FALLBACK_DATA),
        },
  ),
  getDashboardSnapshot: vi.fn().mockResolvedValue(clone(DEFAULT_FALLBACK_DATA)),
  getDatabaseStatus: vi.fn().mockResolvedValue({
    configured: false,
    connected: false,
    source: 'browser_fallback',
    checkedAt: new Date().toISOString(),
    error: null,
    workspaces: [],
    tables: [],
  }),
  listAgents: vi.fn().mockResolvedValue(clone(DEFAULT_FALLBACK_DATA.agentLanes)),
  listMemories: vi.fn().mockResolvedValue(clone(DEFAULT_FALLBACK_DATA.vaultEntries)),
  listWorkflows: vi.fn().mockResolvedValue(clone(DEFAULT_FALLBACK_DATA.workflows)),
  listSchedules: vi.fn().mockResolvedValue(clone(DEFAULT_FALLBACK_DATA.drops)),
  listLogs: vi.fn().mockResolvedValue(clone(DEFAULT_FALLBACK_DATA.auditEvents)),
  createWorkflow: vi.fn().mockResolvedValue(clone(DEFAULT_FALLBACK_DATA.workflows[0])),
  updateWorkflow: vi.fn().mockResolvedValue(clone(DEFAULT_FALLBACK_DATA.workflows[0])),
  deleteWorkflow: vi.fn().mockResolvedValue(undefined),
  downloadWorkflowAsset: vi.fn().mockResolvedValue({
    ok: true,
    canceled: false,
    filePath: 'C:\\Downloads\\workflow-asset',
  }),
  runWorkspaceCommand: vi.fn().mockImplementation(async (_workspace, commandId, context) => ({
    commandId,
    ok: true,
    exitCode: 0,
    stdout: 'ok',
    stderr: '',
    ranAt: new Date().toISOString(),
    durationMs: 80,
    context,
  })),
  runCommand: vi.fn().mockResolvedValue({
    commandId: 'sync-mission-board',
    ok: true,
    exitCode: 0,
    stdout: 'ok',
    stderr: '',
    ranAt: new Date().toISOString(),
    durationMs: 80,
  }),
  prepareVoiceAction: vi.fn().mockImplementation(async (payload) => ({
    actionId: 'voice-action-1',
    action: payload.action,
    workspace: payload.workspace,
    parameters: payload.parameters,
    reason: payload.reason ?? null,
    requiresConfirmation: true,
    expiresAt: new Date(Date.now() + 120_000).toISOString(),
    summary: `${payload.action} prepared.`,
  })),
  confirmVoiceAction: vi.fn().mockResolvedValue({
    actionId: 'voice-action-1',
    action: 'refresh_workspace',
    workspace: 'cortex',
    ok: true,
    confirmed: true,
    canceled: false,
    result: null,
    error: null,
    auditedAt: new Date().toISOString(),
  }),
  createRealtimeCall: vi.fn().mockResolvedValue('answer-sdp'),
  transcribeAudio: vi.fn().mockResolvedValue(''),
  createRealtimeTranscriptionToken: vi.fn().mockResolvedValue({
    token: 'token-1',
    expiresAt: null,
  }),
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
})

describe('The Cortex realtime voice flow', () => {
  beforeEach(() => {
    window.location.hash = '#/'
    vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    installAudioContextStub()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    delete window.cortexApi
    window.location.hash = '#/'
  })

  it('keeps the realtime session alive across route changes', async () => {
    const user = userEvent.setup()
    const media = createMediaStreamStub()
    window.cortexApi = createApiStub()
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

    await user.click(screen.getByRole('link', { name: 'Xylos' }))
    expect(await screen.findByRole('heading', { name: 'Choose a ZiB' })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Overview' }))
    expect(await screen.findByText('Hello Zaidek')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /stop realtime voice/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })
})
