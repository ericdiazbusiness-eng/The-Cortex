// @vitest-environment node

import {
  attachMediaPermissionHandlers,
  buildRealtimeSessionConfig,
  createRealtimeCallAnswer,
  isTrustedCortexOrigin,
  setRealtimeDebugReporter,
} from './realtime-session'
import type { CortexRealtimeSessionRequest } from '../src/shared/cortex'

type PermissionCheckHandler = (
  webContents: { getURL: () => string } | null,
  permission: string,
) => boolean

type PermissionRequestHandler = (
  webContents: { getURL: () => string },
  permission: string,
  callback: (granted: boolean) => void,
) => void

const TEST_REQUEST: CortexRealtimeSessionRequest = {
  instructions: 'Use tools first.',
  tools: [],
  mode: 'premium_voice',
  runtime: 'experimental_realtime_webrtc',
  textModel: 'gpt-4.1',
  transcriptionProvider: 'openai',
  speechProvider: 'openai',
  silentOutput: false,
  navigationPolicy: 'auto',
  toolPreference: 'read_first',
  preferredToolGroups: ['read', 'ui_action', 'execution'],
  context: {
    route: '/cortex',
    routeTitle: 'Overview',
    routeSubtitle: 'Cortex command presence',
    workspace: 'cortex',
    details: {
      neuralLoad: 74,
    },
  },
}

describe('realtime-session helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    delete process.env.OPENAI_API_KEY
    delete process.env.OPENAI_REALTIME_MODEL
    delete process.env.OPENAI_REALTIME_VOICE
    delete process.env.CORTEX_REALTIME_DEBUG
    delete process.env.VITE_CORTEX_REALTIME_DEBUG
    setRealtimeDebugReporter(null)
    vi.restoreAllMocks()
  })

  it('builds the expected session config for realtime voice calls', () => {
    process.env.OPENAI_REALTIME_MODEL = 'gpt-realtime-1.5'
    process.env.OPENAI_REALTIME_VOICE = 'marin'

    const session = buildRealtimeSessionConfig(TEST_REQUEST)

    expect(session).toMatchObject({
      type: 'realtime',
      model: 'gpt-4.1',
      instructions: 'Use tools first.',
      tool_choice: 'auto',
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
          voice: 'marin',
        },
      },
    })
    expect(session).not.toHaveProperty('metadata')
  })

  it('posts the SDP and serialized session config to OpenAI', async () => {
    process.env.OPENAI_API_KEY = 'test-key'
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue('answer-sdp'),
    })
    vi.stubGlobal('fetch', fetchMock)

    const answer = await createRealtimeCallAnswer('offer-sdp', TEST_REQUEST)

    expect(answer).toBe('answer-sdp')
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.openai.com/v1/realtime/calls',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-key',
        },
      }),
    )

    const request = fetchMock.mock.calls[0]?.[1]
    const formData = request?.body as FormData
    expect(formData.get('sdp')).toBe('offer-sdp')
    expect(String(formData.get('session'))).toContain('"type":"realtime"')
    expect(String(formData.get('session'))).toContain('"model":"gpt-4.1"')
  })

  it('rejects session creation when OPENAI_API_KEY is missing', async () => {
    await expect(createRealtimeCallAnswer('offer-sdp', TEST_REQUEST)).rejects.toThrow(
      /OPENAI_API_KEY/i,
    )
  })

  it('only trusts local Cortex origins for media permissions', () => {
    expect(isTrustedCortexOrigin('file:///app/index.html')).toBe(true)
    expect(isTrustedCortexOrigin('http://localhost:5173')).toBe(true)
    expect(isTrustedCortexOrigin('https://example.com')).toBe(false)
  })

  it('installs media-only permission handlers', () => {
    let permissionCheckHandler: PermissionCheckHandler | null = null
    let permissionRequestHandler: PermissionRequestHandler | null = null

    attachMediaPermissionHandlers({
      setPermissionCheckHandler: (handler: PermissionCheckHandler | null) => {
        permissionCheckHandler = handler as typeof permissionCheckHandler
      },
      setPermissionRequestHandler: (handler: PermissionRequestHandler | null) => {
        permissionRequestHandler = handler as typeof permissionRequestHandler
      },
    } as Parameters<typeof attachMediaPermissionHandlers>[0])

    expect(permissionCheckHandler).not.toBeNull()
    expect(permissionRequestHandler).not.toBeNull()

    expect(
      permissionCheckHandler!(
        {
          getURL: () => 'file:///app/index.html',
        },
        'media',
      ),
    ).toBe(true)
    expect(
      permissionCheckHandler!(
        {
          getURL: () => 'https://example.com',
        },
        'media',
      ),
    ).toBe(false)

    const callback = vi.fn()
    permissionRequestHandler!(
      {
        getURL: () => 'http://localhost:5173',
      },
      'media',
      callback,
    )
    expect(callback).toHaveBeenCalledWith(true)
  })

  it('keeps console milestone logging disabled by default', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    buildRealtimeSessionConfig(TEST_REQUEST)
    isTrustedCortexOrigin('file:///app/index.html')

    expect(logSpy).not.toHaveBeenCalled()
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('prints milestone console logs when realtime debug is enabled', async () => {
    process.env.CORTEX_REALTIME_DEBUG = 'true'
    process.env.OPENAI_API_KEY = 'test-key'
    const reporter = vi.fn()
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue('answer-sdp'),
    })
    vi.stubGlobal('fetch', fetchMock)
    setRealtimeDebugReporter(reporter)

    await createRealtimeCallAnswer('offer-sdp', TEST_REQUEST)

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('[RT][main] Creating realtime call answer.'),
      expect.objectContaining({
        runtime: 'experimental_realtime_webrtc',
        mode: 'premium_voice',
      }),
    )
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('[RT][main] Received realtime call response from OpenAI.'),
      expect.objectContaining({
        ok: true,
        status: 200,
      }),
    )
    expect(reporter).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'main',
        level: 'log',
        message: 'Creating realtime call answer.',
      }),
    )
  })
})
