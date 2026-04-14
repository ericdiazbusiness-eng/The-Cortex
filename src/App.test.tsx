import { act, useEffect } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import App from './App'
import { AppLayout } from '@/components/AppLayout'
import { CortexProvider } from '@/context/CortexContext'
import { useCortex } from '@/hooks/useCortex'
import { AgentsPage } from '@/pages/AgentsPage'
import { MemoriesPage } from '@/pages/MemoriesPage'
import { OverviewPage } from '@/pages/OverviewPage'
import { SchedulesPage } from '@/pages/SchedulesPage'
import { SystemLogsPage } from '@/pages/SystemLogsPage'
import {
  DEFAULT_FALLBACK_DATA,
  REALTIME_MODE_STORAGE_KEY,
  type CortexBridge,
  type CortexRealtimeDebugEntry,
} from '@/shared/cortex'
import { UI_MODE_STORAGE_KEY } from '@/lib/ui-mode'

const clone = <T,>(value: T) => JSON.parse(JSON.stringify(value)) as T
const clearStoredMode = () => {
  window.localStorage?.removeItem?.(UI_MODE_STORAGE_KEY)
  window.localStorage?.removeItem?.(REALTIME_MODE_STORAGE_KEY)
}

const FocusMarketingMetricDriver = () => {
  const { focusUi } = useCortex()

  useEffect(() => {
    focusUi({
      route: '/agents',
      agentId: 'zib001',
      marketingMetricId: 'metric-2',
    })
  }, [focusUi])

  return null
}

const renderWithFocusDriver = () =>
  render(
    <CortexProvider>
      <HashRouter>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <FocusMarketingMetricDriver />
                <AppLayout />
              </>
            }
          >
            <Route index element={<OverviewPage />} />
            <Route path="agents" element={<AgentsPage />} />
            <Route path="marketing" element={<Navigate to="/agents" replace />} />
            <Route path="memories" element={<MemoriesPage />} />
            <Route path="schedules" element={<SchedulesPage />} />
            <Route path="system" element={<SystemLogsPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </CortexProvider>,
  )

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
    const user = userEvent.setup()
    render(<App />)

    expect(await screen.findByText('Hello Zaidek')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /toggle theme mode/i }))

    await waitFor(() => {
      expect(screen.getByText('Hello Eric')).toBeInTheDocument()
    })

    expect(window.localStorage?.getItem?.(UI_MODE_STORAGE_KEY)).toBe('business')
    expect(screen.getByRole('link', { name: /Decisions/i })).toBeInTheDocument()
    expect(screen.queryByText('Business light mode')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ZiBz/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Growth/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: /ZiBz/i }))

    await waitFor(() => {
      expect(screen.getByText('ZiBz operations channel')).toBeInTheDocument()
      expect(screen.getAllByText('Executive operator').length).toBeGreaterThan(0)
      expect(screen.getByText('ZiBz')).toBeInTheDocument()
    })
  })

  it('cycles through ZiBz roles and only shows campaign sections for the marketing-owned ZiB', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('link', { name: /ZiBz/i }))

    await waitFor(() => {
      expect(screen.getByText('ZiBz operations channel')).toBeInTheDocument()
      expect(screen.getAllByText('ZiB00').length).toBeGreaterThan(0)
      expect(screen.queryByText('ZiB001 marketing command')).not.toBeInTheDocument()
    })

    const nextButton = screen.getByRole('button', { name: /next zibz/i })
    for (let attempt = 0; attempt < 3 && !screen.queryByText('ZiB001 marketing command'); attempt += 1) {
      fireEvent.click(nextButton)
    }

    await waitFor(() => {
      expect(screen.getAllByText('ZiB001').length).toBeGreaterThan(0)
      expect(screen.getByText('ZiB001 marketing command')).toBeInTheDocument()
      expect(screen.getByText('Outreach queue')).toBeInTheDocument()
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
    expect(view.container.querySelector('.circuit-canvas')).not.toBeNull()
    expect(view.container.querySelector('.page-backdrop-static')).toBeNull()

    await user.click(screen.getByRole('link', { name: /Ops Memory/i }))

    await waitFor(() => {
      expect(screen.getByText('Central memory stream')).toBeInTheDocument()
      expect(view.container.querySelector('.circuit-canvas')).toBeNull()
      expect(view.container.querySelector('.page-backdrop-static')).not.toBeNull()
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

  it('navigates to the marketing lane and highlights the requested metric when UI focus updates', async () => {
    renderWithFocusDriver()

    expect(await screen.findByText('ZiB001 marketing command')).toBeInTheDocument()

    const focusedMetric = screen.getByText('Active campaigns').closest('article')
    expect(focusedMetric).toHaveAttribute('data-ui-focus', 'true')
    expect(screen.getAllByText('ZiB001').length).toBeGreaterThan(0)
  })
})
