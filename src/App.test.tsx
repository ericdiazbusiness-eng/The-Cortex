import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { UI_MODE_STORAGE_KEY, WORKSPACE_CONTEXT_STORAGE_KEY } from '@/lib/ui-mode'
import {
  DEFAULT_BUSINESS_FALLBACK_DATA,
  REALTIME_MODE_STORAGE_KEY,
  DEFAULT_FALLBACK_DATA,
  type CortexBridge,
  type CortexDashboardSnapshot,
  type WorkspaceSnapshot,
} from '@/shared/cortex'

const clone = <T,>(value: T) => JSON.parse(JSON.stringify(value)) as T

const clearStoredMode = () => {
  window.localStorage?.removeItem?.(UI_MODE_STORAGE_KEY)
  window.localStorage?.removeItem?.(WORKSPACE_CONTEXT_STORAGE_KEY)
  window.localStorage?.removeItem?.(REALTIME_MODE_STORAGE_KEY)
}

const createApiStub = (
  initialSnapshot?: CortexDashboardSnapshot,
): CortexBridge => {
  let snapshot = clone(
    initialSnapshot ?? {
      ...DEFAULT_FALLBACK_DATA,
      gateway: {
        status: 'on' as const,
        processName: 'hermes',
        lastCheckedAt: new Date().toISOString(),
      },
    },
  )

  const getWorkspaceSnapshot = async (
    workspace: 'cortex' | 'business',
  ): Promise<WorkspaceSnapshot> =>
    workspace === 'business'
      ? {
          workspace,
          dashboard: clone(DEFAULT_BUSINESS_FALLBACK_DATA),
        }
      : {
          workspace,
          dashboard: clone(snapshot),
        }

  return {
  getWorkspaceSnapshot: vi.fn().mockImplementation(getWorkspaceSnapshot),
  getDashboardSnapshot: vi.fn().mockImplementation(async () => clone(snapshot)),
  getDatabaseStatus: vi.fn().mockResolvedValue({
    configured: false,
    connected: false,
    source: 'browser_fallback',
    checkedAt: new Date().toISOString(),
    error: null,
    workspaces: [],
    tables: [],
  }),
  listAgents: vi.fn().mockImplementation(async () => clone(snapshot.agentLanes)),
  listMemories: vi.fn().mockImplementation(async () => clone(snapshot.vaultEntries)),
  listWorkflows: vi.fn().mockImplementation(async () => clone(snapshot.workflows)),
  listSchedules: vi.fn().mockImplementation(async () => clone(snapshot.drops)),
  listLogs: vi.fn().mockImplementation(async () => clone(snapshot.auditEvents)),
  createWorkflow: vi.fn().mockImplementation(async (payload) => {
    const workflowId = `workflow-${Date.now()}`
    const workflow = {
      id: workflowId,
      title: payload.title,
      description: payload.description,
      toolsUsed: payload.toolsUsed,
      architecture: payload.architecture,
      diagramSource: {
        path: `fixtures/workflow-assets/${workflowId}/${payload.diagramSource.fileName}`,
        fileName: payload.diagramSource.fileName,
        mimeType: payload.diagramSource.mimeType,
        sizeBytes: payload.diagramSource.dataBase64.length,
        uploadedAt: new Date().toISOString(),
      },
      diagramPreview: {
        path: `fixtures/workflow-assets/${workflowId}/${payload.diagramPreview.fileName}`,
        fileName: payload.diagramPreview.fileName,
        mimeType: payload.diagramPreview.mimeType,
        sizeBytes: payload.diagramPreview.dataBase64.length,
        uploadedAt: new Date().toISOString(),
        previewUrl: `data:${payload.diagramPreview.mimeType};base64,${payload.diagramPreview.dataBase64}`,
      },
      zipAsset: payload.zipAsset
        ? {
            path: `fixtures/workflow-assets/${workflowId}/${payload.zipAsset.fileName}`,
            fileName: payload.zipAsset.fileName,
            mimeType: payload.zipAsset.mimeType,
            sizeBytes: payload.zipAsset.dataBase64.length,
            uploadedAt: new Date().toISOString(),
          }
        : null,
      updatedAt: new Date().toISOString(),
      accent: 'cyan' as const,
    }

    snapshot = {
      ...snapshot,
      workflows: [workflow, ...snapshot.workflows],
    }

    return clone(workflow)
  }),
  updateWorkflow: vi.fn().mockImplementation(async (payload) => {
    const current = snapshot.workflows.find((workflow) => workflow.id === payload.id)
    if (!current) {
      throw new Error('Unknown workflow')
    }

    const updated = {
      ...current,
      title: payload.title,
      description: payload.description,
      toolsUsed: payload.toolsUsed,
      architecture: payload.architecture,
      diagramSource:
        payload.diagramSource.mode === 'replace'
          ? {
              path: `fixtures/workflow-assets/${current.id}/${payload.diagramSource.fileName}`,
              fileName: payload.diagramSource.fileName,
              mimeType: payload.diagramSource.mimeType,
              sizeBytes: payload.diagramSource.dataBase64.length,
              uploadedAt: new Date().toISOString(),
            }
          : current.diagramSource,
      diagramPreview:
        payload.diagramPreview.mode === 'replace'
          ? {
              path: `fixtures/workflow-assets/${current.id}/${payload.diagramPreview.fileName}`,
              fileName: payload.diagramPreview.fileName,
              mimeType: payload.diagramPreview.mimeType,
              sizeBytes: payload.diagramPreview.dataBase64.length,
              uploadedAt: new Date().toISOString(),
              previewUrl: `data:${payload.diagramPreview.mimeType};base64,${payload.diagramPreview.dataBase64}`,
            }
          : current.diagramPreview,
      zipAsset:
        payload.zipAsset.mode === 'replace'
          ? {
              path: `fixtures/workflow-assets/${current.id}/${payload.zipAsset.fileName}`,
              fileName: payload.zipAsset.fileName,
              mimeType: payload.zipAsset.mimeType,
              sizeBytes: payload.zipAsset.dataBase64.length,
              uploadedAt: new Date().toISOString(),
            }
          : payload.zipAsset.mode === 'remove'
            ? null
            : current.zipAsset ?? null,
      updatedAt: new Date().toISOString(),
    }

    snapshot = {
      ...snapshot,
      workflows: snapshot.workflows.map((workflow) =>
        workflow.id === current.id ? updated : workflow,
      ),
    }

    return clone(updated)
  }),
  deleteWorkflow: vi.fn().mockImplementation(async (workflowId: string) => {
    snapshot = {
      ...snapshot,
      workflows: snapshot.workflows.filter((workflow) => workflow.id !== workflowId),
    }
  }),
  downloadWorkflowAsset: vi.fn().mockResolvedValue({
    ok: true,
    canceled: false,
    filePath: 'C:\\Downloads\\workflow-asset',
  }),
  runWorkspaceCommand: vi.fn().mockImplementation(async (_workspace, commandId, context) => ({
    commandId,
    ok: true,
    exitCode: 0,
    stdout: `Workspace command ${commandId} executed.`,
    stderr: '',
    ranAt: new Date().toISOString(),
    durationMs: 80,
    context,
  })),
  runCommand: vi.fn().mockResolvedValue({
    commandId: 'sync-mission-board',
    ok: true,
    exitCode: 0,
    stdout: 'Mission board synced.',
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
  createRealtimeCall: vi.fn().mockRejectedValue(new Error('unused in tests')),
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
}

describe('The Cortex app', () => {
  beforeEach(() => {
    clearStoredMode()
    window.location.hash = '#/'
    window.cortexApi = createApiStub()
  })

  afterEach(() => {
    delete window.cortexApi
    clearStoredMode()
    window.location.hash = '#/'
  })

  it('renders the overview with live usage indicators, gateway status, and the 9-item dock', async () => {
    render(<App />)

    expect(await screen.findByText('Hello Zaidek')).toBeInTheDocument()
    expect(screen.getByText('The Cortex')).toBeInTheDocument()
    expect(screen.getByText('Approvals Needed')).toBeInTheDocument()
    expect(screen.getByText('Blocked Missions')).toBeInTheDocument()
    expect(screen.getByRole('status', { name: /cortex profile gateway live/i })).toBeInTheDocument()

    for (const label of [
      'Overview',
      'Xylos',
      'Knowledge',
      'Workflows',
      'Operations',
      'Economy',
      'Community',
      'Studio',
      'Integrations',
    ]) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument()
    }

    expect(screen.queryByRole('link', { name: 'Missions' })).not.toBeInTheDocument()

    expect(screen.queryByRole('link', { name: /ops memory/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /agents/i })).not.toBeInTheDocument()
  })

  it('reveals overview indicator details on hover', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(await screen.findByText('Hello Zaidek')).toBeInTheDocument()
    expect(screen.queryByText('ElevenLabs')).not.toBeInTheDocument()

    await user.hover(screen.getByRole('button', { name: /elevenlabs/i }))

    expect(screen.getByText('ElevenLabs')).toBeInTheDocument()
    expect(screen.getByText(/characters remaining/i)).toBeInTheDocument()
  })

  it('renders the ZiB role selection surface and opens role workspace lanes', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(await screen.findByText('Hello Zaidek')).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Xylos' }))
    expect(await screen.findByRole('heading', { name: 'Choose a ZiB' })).toBeInTheDocument()
    expect(screen.getByText('Select a ZiB and Scavenjer-operation role to enter the workspace.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Command/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Your Active ZiB')).toBeInTheDocument()
    expect(screen.getByText('Command Workspace')).toBeInTheDocument()
    expect(screen.queryByText('Scavenjer GM Workspace')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Field/i }))
    expect(await screen.findByText('Field Workspace')).toBeInTheDocument()
    expect(screen.getByText('DropOps')).toBeInTheDocument()
    expect(screen.getAllByText('Missions').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Outputs').length).toBeGreaterThan(0)

    await user.click(screen.getByRole('link', { name: 'Knowledge' }))
    expect(await screen.findByText('Scavenjer Source Truth')).toBeInTheDocument()
  })

  it('renders the business knowledge route with the shared workspace layout', async () => {
    window.location.hash = '#/business/knowledge'
    window.cortexApi = createApiStub()
    render(<App />)

    expect(await screen.findByText('Business Source Truth')).toBeInTheDocument()
    expect(screen.getByText('Focused Relationship')).toBeInTheDocument()
    expect(screen.getByText('Operating References')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'ZiBz' })).toBeInTheDocument()
    expect(screen.queryByText('Scavenjer Source Truth')).not.toBeInTheDocument()
  })

  it('renders the business ZiBz route through the shared role selection surface', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/business/zibz'
    window.cortexApi = createApiStub()
    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Choose a ZiB' })).toBeInTheDocument()
    expect(screen.getByText('Select a ZiB and business-operation role to enter the workspace.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Command/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Command Workspace')).toBeInTheDocument()
    expect(screen.queryByText('Xylos Index')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Systems/i }))
    expect(await screen.findByText('Systems Workspace')).toBeInTheDocument()
    expect(screen.getByText('Finance Admin')).toBeInTheDocument()
  })

  it('renders a selection-first workflows view and validates required fields before save', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/cortex/workflows'
    window.cortexApi = createApiStub()
    render(<App />)

    expect(await screen.findByText('Workflow Registry')).toBeInTheDocument()
    expect(screen.getByText('Select A Workflow')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /drop request to live drop workflow preview/i })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Drop Request To Live Drop' }))
    expect(await screen.findByRole('img', { name: /drop request to live drop workflow preview/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'New Workflow' }))
    await user.click(screen.getByRole('button', { name: 'Create Workflow' }))
    expect(await screen.findByText('Title is required.')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Title'), 'Daily Workflow Export')
    await user.type(
      screen.getByLabelText('Description'),
      'Exports the approved workflow inventory to downstream systems.',
    )
    await user.type(screen.getByPlaceholderText('Add a tool'), 'Export runner')
    await user.click(screen.getByRole('button', { name: 'Add Tool' }))
    await user.type(
      screen.getByLabelText('Architecture'),
      'Cron start, export transform, then delivery into archive storage.',
    )

    await user.click(screen.getByRole('button', { name: 'Create Workflow' }))
    expect(await screen.findByText('Diagram source is required for a new workflow.')).toBeInTheDocument()
  })

  it('surfaces the restaurant food edits workflow with the five-shot variation details', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/cortex/workflows'
    window.cortexApi = createApiStub()
    render(<App />)

    expect(await screen.findByRole('button', { name: 'Restaurant Food Edit Variations' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Restaurant Food Edit Variations' }))

    expect(
      await screen.findByText(/five approved restaurant product-shot variations/i),
    ).toBeInTheDocument()
    expect(screen.getAllByText(/food edits google drive folder/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/generated edits subfolder/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/daily 9pm cron/i)).toBeInTheDocument()
    expect(screen.getByText(/hero-overhead-daylight/i)).toBeInTheDocument()
    expect(screen.getByText(/three-quarter-cinematic/i)).toBeInTheDocument()
    expect(screen.getByText(/close-detail-appetite/i)).toBeInTheDocument()
    expect(screen.getByText(/tableside-context-wide/i)).toBeInTheDocument()
    expect(screen.getByText(/low-angle-editorial/i)).toBeInTheDocument()
  })

  it('surfaces the Higgsfield MCP workflow with auth, verification, and runtime status context', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/cortex/workflows'
    window.cortexApi = createApiStub()
    render(<App />)

    expect(await screen.findByRole('button', { name: 'Higgsfield MCP Device-Auth Setup' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Higgsfield MCP Device-Auth Setup' }))

    expect(await screen.findByText(/device-flow auth/i)).toBeInTheDocument()
    expect(screen.getAllByText(/fnf-device-auth\.higgsfield\.ai/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/HIGGSFIELD_MCP_TOKEN/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/zaidekthecreator@gmail\.com/i)).toBeInTheDocument()
    expect(screen.getByText(/free plan with 0 credits/i)).toBeInTheDocument()
    expect(screen.getByText(/browsing and management actions work while fresh paid generations remain blocked/i)).toBeInTheDocument()
    expect(screen.getByText(/expected Cortex config\/.env entries were not obvious on disk/i)).toBeInTheDocument()
  })

  it('persists the business mode toggle', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(await screen.findByText('Hello Zaidek')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /toggle workspace context/i }))

    await waitFor(() => {
      expect(window.localStorage?.getItem?.(WORKSPACE_CONTEXT_STORAGE_KEY)).toBe('business')
    })
  })

  it('migrates the legacy mode flag into the business workspace landing', async () => {
    window.localStorage?.setItem?.(UI_MODE_STORAGE_KEY, 'business')

    render(<App />)

    expect(await screen.findByText('Business OS')).toBeInTheDocument()
    expect(screen.getByText('Hello Eric')).toBeInTheDocument()
    expect(window.localStorage?.getItem?.(WORKSPACE_CONTEXT_STORAGE_KEY)).toBe('business')
  })
})
