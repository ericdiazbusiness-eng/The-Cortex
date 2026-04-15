import { act, useEffect } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HashRouter, Route, Routes } from 'react-router-dom'
import App from './App'
import { AppLayout } from '@/components/AppLayout'
import { CortexProvider } from '@/context/CortexContext'
import { useCortex } from '@/hooks/useCortex'
import { AgentsPage } from '@/pages/AgentsPage'
import { OverviewPage } from '@/pages/OverviewPage'
import {
  DEFAULT_FALLBACK_DATA,
  REALTIME_MODE_STORAGE_KEY,
  type CortexBridge,
  type CortexRealtimeDebugEntry,
} from '@/shared/cortex'
import { getModeContent, UI_MODE_STORAGE_KEY } from '@/lib/ui-mode'

const clone = <T,>(value: T) => JSON.parse(JSON.stringify(value)) as T
const clearStoredMode = () => {
  window.localStorage?.removeItem?.(UI_MODE_STORAGE_KEY)
  window.localStorage?.removeItem?.(REALTIME_MODE_STORAGE_KEY)
}

const FocusMarketingAgentDriver = () => {
  const { focusUi } = useCortex()

  useEffect(() => {
    focusUi({
      route: '/agents',
      agentId: 'zib001',
    })
  }, [focusUi])

  return null
}

const RealtimeNavigationProbe = () => {
  const { realtimeMode } = useCortex()

  return (
    <div>
      <span>{realtimeMode}</span>
    </div>
  )
}

const RealtimeNavigationDriver = () => {
  const { focusUi, setRealtimeMode } = useCortex()

  useEffect(() => {
    setRealtimeMode('neural_voice')
    focusUi({
      route: '/agents',
    })
  }, [focusUi, setRealtimeMode])

  return null
}

const UiModeProbe = () => {
  const { toggleUiMode, uiMode } = useCortex()
  const content = getModeContent(uiMode)

  return (
    <div>
      <button type="button" onClick={toggleUiMode}>
        Toggle theme mode
      </button>
      <span>{uiMode}</span>
      {content.nav.map((item) => (
        <span key={item.path}>{item.label}</span>
      ))}
    </div>
  )
}

describe('The Cortex app', () => {
  beforeEach(() => {
    clearStoredMode()
    window.location.hash = '#/'

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
        stdout: 'Ops sync completed.',
        stderr: '',
        ranAt: new Date().toISOString(),
        durationMs: 120,
      }),
      createRealtimeCall: vi.fn().mockRejectedValue(
        new Error('Realtime voice is not configured in this test.'),
      ),
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
    }

    window.cortexApi = api
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
    delete window.cortexApi
    clearStoredMode()
    window.location.hash = '#/'
  })

  it('renders the default scavenjer shell and navigates to ops memory', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(await screen.findByText('Hello Zaidek')).toBeInTheDocument()
    expect(screen.getByText('The Cortex')).toBeInTheDocument()
    expect(screen.getByText('Active Priorities')).toBeInTheDocument()
    expect(screen.getByText('Urgent Items')).toBeInTheDocument()
    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /usage$/i })).toHaveLength(1)
    expect(screen.getByRole('button', { name: /elevenlabs/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /openai/i })).toBeInTheDocument()
    expect(screen.queryByText('ElevenLabs')).not.toBeInTheDocument()
    expect(screen.queryByText('OpenAI')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /marketing/i })).not.toBeInTheDocument()
    expect(screen.queryByText('Sentient Mind')).not.toBeInTheDocument()
    expect(screen.queryByText('Dark mode operations')).not.toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: /Ops Memory/i }))

    await waitFor(() => {
      expect(screen.getByText('Central memory stream')).toBeInTheDocument()
      expect(screen.getByText('Ops Memory')).toBeInTheDocument()
    })
  })

  it('switches to business mode, persists it, and updates labels on the same routes', async () => {
    render(
      <CortexProvider>
        <UiModeProbe />
      </CortexProvider>,
    )

    expect(screen.getByText('scavenjer')).toBeInTheDocument()
    expect(screen.getByText('Ops Memory')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /toggle theme mode/i }))

    await waitFor(() => {
      expect(screen.getByText('business')).toBeInTheDocument()
    })

    expect(window.localStorage?.getItem?.(UI_MODE_STORAGE_KEY)).toBe('business')
    expect(screen.getByText('Decisions')).toBeInTheDocument()
    expect(screen.getByText('ZiBz')).toBeInTheDocument()
    expect(screen.queryByText('Growth')).not.toBeInTheDocument()
  })

  it('keeps the ZiBz page minimal when only fixture data is available', async () => {
    const firstView = render(
      <CortexProvider>
        <AgentsPage />
      </CortexProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('ZiBz operations channel')).toBeInTheDocument()
      expect(screen.getByText('Awaiting live ZiBz activity')).toBeInTheDocument()
      expect(screen.queryByText('Outreach queue')).not.toBeInTheDocument()
    })

    firstView.unmount()

    render(
      <CortexProvider>
        <FocusMarketingAgentDriver />
        <AgentsPage />
      </CortexProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('Awaiting live ZiBz activity')).toBeInTheDocument()
      expect(screen.queryByText('Outreach queue')).not.toBeInTheDocument()
    })
  })

  it('returns the overview neural surface after page navigation', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(await screen.findByText('Hello Zaidek')).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: /Ops Memory/i }))

    await waitFor(() => {
      expect(screen.getByText('Central memory stream')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('link', { name: /Overview/i }))

    await waitFor(() => {
      expect(screen.getByText('Hello Zaidek')).toBeInTheDocument()
    })
  })

  it('reveals provider labels only on hover for the overview side rings', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(await screen.findByText('Hello Zaidek')).toBeInTheDocument()
    expect(screen.queryByText('ElevenLabs')).not.toBeInTheDocument()

    await user.hover(screen.getByRole('button', { name: /elevenlabs/i }))

    expect(screen.getByText('ElevenLabs')).toBeInTheDocument()
    expect(screen.getByText('Voice identity')).toBeInTheDocument()

    await user.unhover(screen.getByRole('button', { name: /elevenlabs/i }))

    await waitFor(() => {
      expect(screen.queryByText('ElevenLabs')).not.toBeInTheDocument()
    })
  })

  it('keeps exactly one realtime mode toggle active and persists the selected mode', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(await screen.findByText('Hello Zaidek')).toBeInTheDocument()

    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(4)
    expect(screen.queryByText('Premium voice mode')).not.toBeInTheDocument()

    const premium = screen.getByRole('radio', { name: /premium voice mode/i })
    const neural = screen.getByRole('radio', { name: /neural voice mode/i })
    const lean = screen.getByRole('radio', { name: /lean voice mode/i })
    const director = screen.getByRole('radio', { name: /ui director mode/i })

    expect(premium).toHaveAttribute('aria-checked', 'true')
    expect(neural).toHaveAttribute('aria-checked', 'false')
    expect(lean).toHaveAttribute('aria-checked', 'false')
    expect(director).toHaveAttribute('aria-checked', 'false')

    await user.click(neural)

    expect(premium).toHaveAttribute('aria-checked', 'false')
    expect(neural).toHaveAttribute('aria-checked', 'true')
    expect(lean).toHaveAttribute('aria-checked', 'false')
    expect(director).toHaveAttribute('aria-checked', 'false')
    expect(window.localStorage?.getItem?.(REALTIME_MODE_STORAGE_KEY)).toBe('neural_voice')
  })

  it('migrates the stored VECTOR profile into ECO in the default three-mode set', async () => {
    const user = userEvent.setup()
    window.localStorage?.setItem?.(REALTIME_MODE_STORAGE_KEY, 'tool_voice')

    render(<App />)

    expect(await screen.findByText('Hello Zaidek')).toBeInTheDocument()
    const lean = screen.getByRole('radio', { name: /lean voice mode/i })

    expect(lean).toHaveAttribute('aria-checked', 'true')
    expect(window.localStorage?.getItem?.(REALTIME_MODE_STORAGE_KEY)).toBe('lean_voice')

    await user.click(screen.getByRole('radio', { name: /ui director mode/i }))
    expect(window.localStorage?.getItem?.(REALTIME_MODE_STORAGE_KEY)).toBe('ui_director')
  })

  it('can restore the legacy four-profile strip with the internal profile-set flag', async () => {
    vi.stubEnv('VITE_CORTEX_PROFILE_SET', 'legacy_four_mode')

    render(<App />)

    expect(await screen.findByText('Hello Zaidek')).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(5)
    expect(screen.getByRole('radio', { name: /tool voice mode/i })).toBeInTheDocument()
  })

  it('keeps the overview surface clean when NEURAL is selected', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(await screen.findByText('Hello Zaidek')).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: /neural voice mode/i }))

    expect(screen.getByText('Hello Zaidek')).toBeInTheDocument()
    expect(screen.queryByText(/suggested voice stack/i)).not.toBeInTheDocument()
    expect(
      screen.queryByText(/NEURAL pairs ElevenLabs identity with a cheaper OpenAI brain/i),
    ).not.toBeInTheDocument()
  })

  it('briefly flashes a one-word mode indicator when a realtime mode is chosen', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(await screen.findByText('Hello Zaidek')).toBeInTheDocument()
    expect(screen.queryByText('ECO')).not.toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: /ui director mode/i }))

    expect(screen.getByText('GUIDE')).toBeInTheDocument()
  })

  it('lets mode selection stay responsive in browser fallback mode', async () => {
    const user = userEvent.setup()
    delete window.cortexApi

    render(<App />)

    expect(await screen.findByText('Hello Zaidek')).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: /lean voice mode/i }))

    expect(screen.getByRole('radio', { name: /lean voice mode/i })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(screen.getByText('ECO')).toBeInTheDocument()
  })

  it('mounts the animated canvas only on the overview route', async () => {
    const user = userEvent.setup()
    const view = render(<App />)

    expect(await screen.findByText('Hello Zaidek')).toBeInTheDocument()
    expect(view.container.querySelector('.page-viewport[data-scene-runtime="overview"]')).not.toBeNull()
    expect(view.container.querySelector('.circuit-canvas')).not.toBeNull()
    expect(view.container.querySelector('.page-backdrop-static')).toBeNull()

    await user.click(screen.getByRole('link', { name: /Ops Memory/i }))

    await waitFor(() => {
      expect(screen.getByText('Central memory stream')).toBeInTheDocument()
      expect(view.container.querySelector('.page-viewport[data-scene-runtime="route"]')).not.toBeNull()
      expect(view.container.querySelector('.circuit-canvas')).toBeNull()
      expect(view.container.querySelector('.page-backdrop-static')).not.toBeNull()
    })
  })

  it('keeps the shared voice mode state while navigating away from overview', async () => {
    render(
      <CortexProvider>
        <HashRouter>
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <RealtimeNavigationDriver />
                  <RealtimeNavigationProbe />
                  <AppLayout />
                </>
              }
            >
              <Route index element={<OverviewPage />} />
              <Route path="agents" element={<AgentsPage />} />
            </Route>
          </Routes>
        </HashRouter>
      </CortexProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('ZiBz operations channel')).toBeInTheDocument()
      expect(screen.getByText('neural_voice')).toBeInTheDocument()
    })
  })

  it('renders the standalone realtime debug route and streams live entries', async () => {
    const debugEntry: CortexRealtimeDebugEntry = {
      id: 'debug-1',
      timestamp: '2026-04-07T16:05:00.000Z',
      source: 'main',
      level: 'warn',
      message: 'Realtime peer connection failed before becoming ready.',
      context: {
        mode: 'premium_voice',
      },
    }
    let debugListener: ((entry: CortexRealtimeDebugEntry) => void) | null = null

    window.location.hash = '#/debug'
    window.cortexApi = {
      ...window.cortexApi!,
      getRealtimeDebugEntries: vi.fn().mockResolvedValue([debugEntry]),
      subscribeToRealtimeDebug: vi.fn().mockImplementation((listener) => {
        debugListener = listener
        return () => {
          debugListener = null
        }
      }),
    }

    render(<App />)

    expect(await screen.findByText('Milestone Grid')).toBeInTheDocument()
    expect(
      await screen.findAllByText('Realtime peer connection failed before becoming ready.'),
    ).not.toHaveLength(0)
    expect(screen.getByText('Recent activity')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument()
    const exportBox = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(exportBox.value).toContain(
      'PRIME | MAIN | WARN | Realtime peer connection failed before becoming ready.',
    )
    expect(exportBox.value).not.toContain('{"timestamp"')

    const listener = debugListener
    if (listener) {
      await act(async () => {
        ;(listener as (entry: CortexRealtimeDebugEntry) => void)({
          id: 'debug-2',
          timestamp: '2026-04-07T16:05:02.000Z',
          source: 'renderer',
          level: 'warn',
          message: 'Realtime user turn sent to the live session.',
          context: {
            status: 'executing',
          },
        })
      })
    }

    expect(
      await screen.findAllByText('Realtime user turn sent to the live session.'),
    ).not.toHaveLength(0)
  })

  it('can leave the ZiBz page through dock navigation without being forced back', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('link', { name: /ZiBz/i }))

    await waitFor(() => {
      expect(screen.getByText('ZiBz operations channel')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('link', { name: /Ops Memory/i }))

    await waitFor(() => {
      expect(screen.getByText('Central memory stream')).toBeInTheDocument()
      expect(screen.queryByText('ZiBz operations channel')).not.toBeInTheDocument()
    })
  })
})
