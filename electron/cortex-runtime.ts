import { promises as fs } from 'node:fs'
import path from 'node:path'
import { performance } from 'node:perf_hooks'
import { spawn } from 'node:child_process'
import {
  DEFAULT_BUSINESS_FALLBACK_DATA,
  DEFAULT_FALLBACK_DATA,
  DEFAULT_GATEWAY_STATE,
  type BusinessDashboardSnapshot,
  type CortexAgentLane,
  type CortexAuditEvent,
  type CortexCommand,
  type CortexCommandResult,
  type CortexDatabaseStatus,
  type CortexDashboardSnapshot,
  type CortexDrop,
  type CortexGatewayState,
  type CortexRealtimeLogEntry,
  type CortexStreamEvent,
  type CortexSystemSnapshot,
  type CortexUsageIndicator,
  type CortexVaultEntry,
  type CortexWorkflow,
  type CortexWorkflowAsset,
  type CortexWorkflowAssetDownloadRequest,
  type CortexWorkflowAssetUpload,
  type CortexWorkflowCreateInput,
  type CortexWorkflowUpdateInput,
  type CortexVoiceActionConfirmation,
  type CortexVoiceActionPrepared,
  type CortexVoiceActionRequest,
  type CortexVoiceActionResult,
  type WorkspaceContext,
  type WorkspaceSnapshot,
} from '../src/shared/cortex'
import { fetchOverviewUsageIndicators } from './provider-usage'
import {
  deleteSupabaseWorkflow,
  hasSupabaseDatabaseConfig,
  listSupabaseWorkflows,
  readSupabaseConnectionStatus,
  upsertSupabaseWorkflows,
} from './supabase-db'

export type CortexConfig = {
  dataSources: {
    missionsPath: string
    approvalsPath: string
    lanesPath: string
    vaultPath: string
    workflowsPath: string
    dropsPath: string
    lorePath: string
    studioPath: string
    integrationsPath: string
    auditPath: string
    economyPath: string
    communityPath: string
    systemPath: string
    businessPath: string
  }
  commands: CortexCommand[]
}

export type CortexRuntimeOptions = {
  gatewayProbe?: () => Promise<CortexGatewayState>
  usageProbe?: () => Promise<CortexUsageIndicator[]>
}

export type RuntimeState = CortexDashboardSnapshot & {
  gateway: CortexGatewayState
}

const CONFIG_FILE = 'cortex.config.json'
const MAX_AUDIT_EVENTS = 40
const DEFAULT_GATEWAY_PROCESS_TERMS = ['hermes', 'cortex profile gateway']
const DEFAULT_WORKFLOW_ASSET_ROOT = path.join('fixtures', 'workflow-assets')
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg'])
const DEFAULT_USAGE_REFRESH_INTERVAL_MS = 60_000
const VOICE_ACTION_TTL_MS = 120_000

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const isoNow = () => new Date().toISOString()

const compactAuditValue = (value: unknown, limit = 420) => {
  let serialized: string
  try {
    serialized = JSON.stringify(value)
  } catch {
    serialized = String(value)
  }

  return serialized.length > limit ? `${serialized.slice(0, limit - 3)}...` : serialized
}

const normalizeWindowsPath = (value: string) =>
  process.platform === 'win32' && value.startsWith('\\\\?\\') ? value.slice(4) : value

const resolveProjectPath = (projectRoot: string, targetPath: string) =>
  normalizeWindowsPath(
    path.isAbsolute(targetPath) ? targetPath : path.resolve(projectRoot, targetPath),
  )

const defaultConfig: CortexConfig = {
  dataSources: {
    missionsPath: './fixtures/missions.json',
    approvalsPath: './fixtures/approvals.json',
    lanesPath: './fixtures/lanes.json',
    vaultPath: './fixtures/vault.json',
    workflowsPath: './fixtures/workflows.json',
    dropsPath: './fixtures/drops.json',
    lorePath: './fixtures/lore.json',
    studioPath: './fixtures/studio.json',
    integrationsPath: './fixtures/integrations.json',
    auditPath: './fixtures/audit.json',
    economyPath: './fixtures/economy.json',
    communityPath: './fixtures/community.json',
    systemPath: './fixtures/system.json',
    businessPath: './fixtures/business-dashboard.json',
  },
  commands: DEFAULT_FALLBACK_DATA.commands,
}

const getGatewayProcessTerms = () => {
  const configured =
    process.env.CORTEX_HERMES_PROCESS_NAME?.trim() ||
    process.env.VITE_CORTEX_HERMES_PROCESS_NAME?.trim() ||
    ''

  const source = configured || DEFAULT_GATEWAY_PROCESS_TERMS.join(',')
  return source
    .split(/[;,]/)
    .map((term) => term.trim().toLowerCase())
    .filter(Boolean)
}

const readStreamText = async (child: ReturnType<typeof spawn>) =>
  new Promise<{ stdout: string; stderr: string; code: number | null }>((resolve) => {
    let stdout = ''
    let stderr = ''

    child.stdout?.on('data', (chunk) => {
      stdout += chunk.toString()
    })

    child.stderr?.on('data', (chunk) => {
      stderr += chunk.toString()
    })

    child.on('close', (code) => {
      resolve({ stdout, stderr, code })
    })

    child.on('error', (error) => {
      resolve({ stdout, stderr: error.message, code: null })
    })
  })

const defaultGatewayProbe = async (): Promise<CortexGatewayState> => {
  const processTerms = getGatewayProcessTerms()

  try {
    const command =
      process.platform === 'win32'
        ? spawn('tasklist', ['/fo', 'csv', '/nh'], { shell: false, windowsHide: true })
        : spawn('ps', ['-A', '-o', 'comm=', '-o', 'args='], { shell: false })
    const { stdout, code } = await readStreamText(command)

    if (code !== 0 && !stdout.trim()) {
      return {
        ...DEFAULT_GATEWAY_STATE,
        status: 'unknown',
        lastCheckedAt: isoNow(),
      }
    }

    const normalized = stdout.toLowerCase()
    const isRunning = processTerms.some((term) => normalized.includes(term))

    return {
      ...DEFAULT_GATEWAY_STATE,
      status: isRunning ? 'on' : 'off',
      lastCheckedAt: isoNow(),
    }
  } catch {
    return {
      ...DEFAULT_GATEWAY_STATE,
      status: 'unknown',
      lastCheckedAt: isoNow(),
    }
  }
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const contents = await fs.readFile(filePath, 'utf8')
    return JSON.parse(contents) as T
  } catch {
    return clone(fallback)
  }
}

async function writeJsonFile<T>(filePath: string, value: T) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

const bytesFromBase64 = (value: string) => Buffer.from(value, 'base64').byteLength

const sanitizeFileName = (value: string) =>
  value
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

const normalizeWorkflowTools = (toolsUsed: string[]) =>
  toolsUsed
    .map((tool) => tool.trim())
    .filter(Boolean)

const normalizeWorkflowText = (value: string, fieldName: string) => {
  const normalized = value.trim()
  if (!normalized) {
    throw new Error(`${fieldName} is required.`)
  }

  return normalized
}

const requireNonEmptyAsset = (
  asset: CortexWorkflowAssetUpload | null | undefined,
  fieldName: string,
) => {
  if (!asset) {
    throw new Error(`${fieldName} is required.`)
  }

  if (!asset.fileName.trim()) {
    throw new Error(`${fieldName} file name is required.`)
  }

  if (!asset.dataBase64 || bytesFromBase64(asset.dataBase64) <= 0) {
    throw new Error(`${fieldName} must not be empty.`)
  }

  return asset
}

const validateExtension = (fileName: string, extensions: Set<string>, fieldName: string) => {
  const extension = path.extname(fileName).toLowerCase()
  if (!extensions.has(extension)) {
    throw new Error(`${fieldName} must use one of: ${Array.from(extensions).join(', ')}`)
  }
}

const validateWorkflowCreateInput = (payload: CortexWorkflowCreateInput) => {
  const title = normalizeWorkflowText(payload.title, 'Title')
  const description = normalizeWorkflowText(payload.description, 'Description')
  const architecture = normalizeWorkflowText(payload.architecture, 'Architecture')
  const toolsUsed = normalizeWorkflowTools(payload.toolsUsed)
  if (!toolsUsed.length) {
    throw new Error('Tools used is required.')
  }

  const diagramSource = requireNonEmptyAsset(payload.diagramSource, 'Diagram source')
  const diagramPreview = requireNonEmptyAsset(payload.diagramPreview, 'Diagram preview')
  validateExtension(diagramSource.fileName, new Set(['.excalidraw']), 'Diagram source')
  validateExtension(diagramPreview.fileName, IMAGE_EXTENSIONS, 'Diagram preview')

  const zipAsset = payload.zipAsset ? requireNonEmptyAsset(payload.zipAsset, 'ZIP asset') : null
  if (zipAsset) {
    validateExtension(zipAsset.fileName, new Set(['.zip']), 'ZIP asset')
  }

  return {
    title,
    description,
    architecture,
    toolsUsed,
    diagramSource,
    diagramPreview,
    zipAsset,
  }
}

const validateWorkflowUpdateInput = (payload: CortexWorkflowUpdateInput) => {
  const title = normalizeWorkflowText(payload.title, 'Title')
  const description = normalizeWorkflowText(payload.description, 'Description')
  const architecture = normalizeWorkflowText(payload.architecture, 'Architecture')
  const toolsUsed = normalizeWorkflowTools(payload.toolsUsed)
  if (!toolsUsed.length) {
    throw new Error('Tools used is required.')
  }

  if (payload.diagramSource.mode === 'replace') {
    const diagramSource = requireNonEmptyAsset(payload.diagramSource, 'Diagram source')
    validateExtension(diagramSource.fileName, new Set(['.excalidraw']), 'Diagram source')
  }

  if (payload.diagramPreview.mode === 'replace') {
    const diagramPreview = requireNonEmptyAsset(payload.diagramPreview, 'Diagram preview')
    validateExtension(diagramPreview.fileName, IMAGE_EXTENSIONS, 'Diagram preview')
  }

  if (payload.zipAsset.mode === 'replace') {
    const zipAsset = requireNonEmptyAsset(payload.zipAsset, 'ZIP asset')
    validateExtension(zipAsset.fileName, new Set(['.zip']), 'ZIP asset')
  }

  return {
    id: payload.id,
    title,
    description,
    architecture,
    toolsUsed,
  }
}

const makeWorkflowId = (title: string) => {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)

  const suffix = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID().slice(0, 8)
    : `${Date.now()}`

  return `workflow-${slug || 'item'}-${suffix}`
}

const stripAssetPreview = (asset: CortexWorkflowAsset): CortexWorkflowAsset => {
  const { previewUrl: _previewUrl, ...rest } = asset
  return rest
}

const stripWorkflowPreviewData = (workflow: CortexWorkflow): CortexWorkflow => ({
  ...workflow,
  diagramSource: stripAssetPreview(workflow.diagramSource),
  diagramPreview: stripAssetPreview(workflow.diagramPreview),
  zipAsset: workflow.zipAsset ? stripAssetPreview(workflow.zipAsset) : workflow.zipAsset ?? null,
})

const buildPreviewUrl = async (absolutePath: string, mimeType: string) => {
  const buffer = await fs.readFile(absolutePath)
  return `data:${mimeType};base64,${buffer.toString('base64')}`
}

export async function loadConfig(projectRoot: string): Promise<CortexConfig> {
  const configPath = path.resolve(projectRoot, CONFIG_FILE)
  const fileConfig = await readJsonFile<Partial<CortexConfig>>(configPath, {})

  return {
    dataSources: {
      missionsPath:
        fileConfig.dataSources?.missionsPath ?? defaultConfig.dataSources.missionsPath,
      approvalsPath:
        fileConfig.dataSources?.approvalsPath ?? defaultConfig.dataSources.approvalsPath,
      lanesPath: fileConfig.dataSources?.lanesPath ?? defaultConfig.dataSources.lanesPath,
      vaultPath: fileConfig.dataSources?.vaultPath ?? defaultConfig.dataSources.vaultPath,
      workflowsPath:
        fileConfig.dataSources?.workflowsPath ?? defaultConfig.dataSources.workflowsPath,
      dropsPath: fileConfig.dataSources?.dropsPath ?? defaultConfig.dataSources.dropsPath,
      lorePath: fileConfig.dataSources?.lorePath ?? defaultConfig.dataSources.lorePath,
      studioPath: fileConfig.dataSources?.studioPath ?? defaultConfig.dataSources.studioPath,
      integrationsPath:
        fileConfig.dataSources?.integrationsPath ?? defaultConfig.dataSources.integrationsPath,
      auditPath: fileConfig.dataSources?.auditPath ?? defaultConfig.dataSources.auditPath,
      economyPath: fileConfig.dataSources?.economyPath ?? defaultConfig.dataSources.economyPath,
      communityPath:
        fileConfig.dataSources?.communityPath ?? defaultConfig.dataSources.communityPath,
      systemPath: fileConfig.dataSources?.systemPath ?? defaultConfig.dataSources.systemPath,
      businessPath: fileConfig.dataSources?.businessPath ?? defaultConfig.dataSources.businessPath,
    },
    commands: fileConfig.commands?.length ? fileConfig.commands : defaultConfig.commands,
  }
}

function applySystemDrift(system: CortexSystemSnapshot, scale: number): CortexSystemSnapshot {
  return {
    ...system,
    neuralLoad: Math.max(28, Math.min(96, system.neuralLoad + scale * 5)),
    signalCoherence: Math.max(62, Math.min(100, system.signalCoherence + scale * 3)),
    memoryIntegrity: Math.max(78, Math.min(100, system.memoryIntegrity - scale * 1.4)),
    queueDepth: Math.max(3, Math.min(34, system.queueDepth + Math.round(scale * 2))),
    throughput: Math.max(38, Math.min(99, system.throughput + scale * 5)),
    activeNodes: Math.max(4, system.activeNodes + (scale > 0 ? 1 : 0)),
    runtimeSeconds: system.runtimeSeconds + 7,
    lastUpdated: isoNow(),
  }
}

const makeAuditEvent = (
  entry: Pick<CortexAuditEvent, 'category' | 'message' | 'severity' | 'title'> &
    Partial<CortexAuditEvent>,
): CortexAuditEvent => ({
  id: entry.id ?? `audit-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
  timestamp: entry.timestamp ?? isoNow(),
  category: entry.category,
  severity: entry.severity,
  title: entry.title,
  message: entry.message,
  relatedMissionId: entry.relatedMissionId ?? null,
  relatedLaneId: entry.relatedLaneId ?? null,
  actor: entry.actor ?? null,
  accent: entry.accent ?? 'cyan',
})

const bumpLane = (
  lanes: CortexAgentLane[],
  laneId: CortexAgentLane['id'],
  status: CortexAgentLane['status'],
) =>
  lanes.map((lane) =>
    lane.id === laneId
      ? {
          ...lane,
          status,
          lastUpdated: isoNow(),
        }
      : lane,
  )

const bumpDrop = (drops: CortexDrop[], dropId: string, status: CortexDrop['status']) =>
  drops.map((drop) =>
    drop.id === dropId
      ? {
          ...drop,
          status,
        }
      : drop,
  )

export function applyCommandMutation(
  state: RuntimeState,
  commandId: string,
  result: CortexCommandResult,
): RuntimeState {
  const nextState = clone(state)
  const logs: CortexAuditEvent[] = []

  switch (commandId) {
    case 'sync-mission-board':
      nextState.system = applySystemDrift(nextState.system, 0.45)
      nextState.agentLanes = bumpLane(nextState.agentLanes, 'mission_controller', 'active')
      logs.push(
        makeAuditEvent({
          category: 'mission',
          severity: 'info',
          title: 'Mission board synced',
          message: 'Mission board refresh completed across active and blocked lanes.',
          relatedLaneId: 'mission_controller',
          accent: 'cyan',
        }),
      )
      break
    case 'refresh-zibz-lanes':
      nextState.system = applySystemDrift(nextState.system, 0.3)
      nextState.agentLanes = nextState.agentLanes.map((lane) => ({
        ...lane,
        load: Math.max(18, Math.min(94, lane.load + (lane.status === 'warning' ? -4 : 3))),
        lastUpdated: isoNow(),
      }))
      logs.push(
        makeAuditEvent({
          category: 'runtime',
          severity: 'info',
          title: 'ZiBz lane refresh',
          message: 'Lane assignments, tasks, and failure flags were refreshed.',
          relatedLaneId: 'technical_agent',
          accent: 'magenta',
        }),
      )
      break
    case 'sync-drop-lane':
      nextState.system = applySystemDrift(nextState.system, 0.35)
      nextState.agentLanes = bumpLane(nextState.agentLanes, 'ops_agent', 'active')
      nextState.drops = bumpDrop(nextState.drops, nextState.drops[0]?.id ?? '', 'live')
      logs.push(
        makeAuditEvent({
          category: 'mission',
          severity: 'success',
          title: 'Drop lane synced',
          message: 'Operations drop planner refreshed active, pending, and archived drop state.',
          relatedLaneId: 'ops_agent',
          relatedMissionId: nextState.drops[0]?.missionId ?? null,
          accent: 'green',
        }),
      )
      break
    case 'sync-studio':
      nextState.system = applySystemDrift(nextState.system, 0.24)
      nextState.agentLanes = bumpLane(nextState.agentLanes, 'content_agent', 'active')
      logs.push(
        makeAuditEvent({
          category: 'approval',
          severity: 'info',
          title: 'Studio pipeline refreshed',
          message: 'Studio asset briefs, approvals, and outputs were re-indexed.',
          relatedLaneId: 'content_agent',
          accent: 'magenta',
        }),
      )
      break
    case 'check-integrations':
      nextState.system = applySystemDrift(nextState.system, -0.08)
      logs.push(
        makeAuditEvent({
          category: 'integration',
          severity: result.ok ? 'info' : 'warning',
          title: 'Integration check',
          message: result.ok
            ? 'External connectors completed a fresh health pass.'
            : 'One or more external connectors still require operator attention.',
          relatedLaneId: 'technical_agent',
          accent: result.ok ? 'cyan' : 'amber',
        }),
      )
      break
    case 'review-audit-trail':
    case 'audit-economy':
      nextState.system = applySystemDrift(nextState.system, -0.12)
      nextState.agentLanes = bumpLane(nextState.agentLanes, 'audit_agent', 'warning')
      logs.push(
        makeAuditEvent({
          category: 'runtime',
          severity: result.ok ? 'info' : 'warning',
          title: 'Audit sweep completed',
          message: result.ok
            ? 'Audit sweep completed and evidence has been refreshed.'
            : 'Audit sweep reported unresolved evidence gaps.',
          relatedLaneId: 'audit_agent',
          accent: result.ok ? 'amber' : 'red',
        }),
      )
      break
    default:
      logs.push(
        makeAuditEvent({
          category: 'operator',
          severity: result.ok ? 'info' : 'warning',
          title: 'Command executed',
          message: `Command ${commandId} executed${result.ok ? '.' : ' with issues.'}`,
          accent: result.ok ? 'cyan' : 'red',
        }),
      )
      break
  }

  nextState.auditEvents = [...logs, ...nextState.auditEvents].slice(0, MAX_AUDIT_EVENTS)
  return nextState
}

function createRuntimeState(config: CortexConfig): RuntimeState {
  return {
    ...clone(DEFAULT_FALLBACK_DATA),
    commands: clone(config.commands),
    gateway: clone(DEFAULT_GATEWAY_STATE),
  }
}

function createBusinessRuntimeState(config: CortexConfig): BusinessDashboardSnapshot {
  return {
    ...clone(DEFAULT_BUSINESS_FALLBACK_DATA),
    commands: clone(config.commands),
    gateway: clone(DEFAULT_GATEWAY_STATE),
  }
}

const getWorkflowAssetRoot = (projectRoot: string) =>
  path.resolve(projectRoot, DEFAULT_WORKFLOW_ASSET_ROOT)

const getWorkflowAssetAbsolutePath = (projectRoot: string, asset: CortexWorkflowAsset) =>
  resolveProjectPath(projectRoot, asset.path)

const makeStoredWorkflowAsset = async (
  projectRoot: string,
  workflowId: string,
  assetType: 'diagram-source' | 'diagram-preview' | 'zip',
  asset: CortexWorkflowAssetUpload,
): Promise<CortexWorkflowAsset> => {
  const sanitizedFileName = sanitizeFileName(asset.fileName.trim()) || `${assetType}.bin`
  const workflowAssetDir = path.join(getWorkflowAssetRoot(projectRoot), workflowId)
  await fs.mkdir(workflowAssetDir, { recursive: true })

  const absolutePath = path.join(workflowAssetDir, `${assetType}-${sanitizedFileName}`)
  await fs.writeFile(absolutePath, Buffer.from(asset.dataBase64, 'base64'))

  return {
    path: path.relative(projectRoot, absolutePath).replace(/\\/g, '/'),
    fileName: asset.fileName.trim(),
    mimeType: asset.mimeType.trim() || 'application/octet-stream',
    sizeBytes: bytesFromBase64(asset.dataBase64),
    uploadedAt: isoNow(),
    previewUrl: asset.mimeType.startsWith('image/')
      ? await buildPreviewUrl(absolutePath, asset.mimeType)
      : null,
  }
}

const deleteWorkflowAssetIfPresent = async (
  projectRoot: string,
  asset: CortexWorkflowAsset | null | undefined,
) => {
  if (!asset) {
    return
  }

  await fs.rm(getWorkflowAssetAbsolutePath(projectRoot, asset), { force: true })
}

const hydrateWorkflowAsset = async (projectRoot: string, asset: CortexWorkflowAsset) => {
  const hydrated: CortexWorkflowAsset = {
    ...asset,
    previewUrl: asset.previewUrl ?? null,
  }

  if (!asset.mimeType.startsWith('image/')) {
    return hydrated
  }

  try {
    hydrated.previewUrl = await buildPreviewUrl(
      getWorkflowAssetAbsolutePath(projectRoot, asset),
      asset.mimeType,
    )
  } catch {
    hydrated.previewUrl = asset.previewUrl ?? null
  }

  return hydrated
}

const hydrateWorkflow = async (projectRoot: string, workflow: CortexWorkflow): Promise<CortexWorkflow> => ({
  ...workflow,
  diagramSource: await hydrateWorkflowAsset(projectRoot, workflow.diagramSource),
  diagramPreview: await hydrateWorkflowAsset(projectRoot, workflow.diagramPreview),
  zipAsset: workflow.zipAsset ? await hydrateWorkflowAsset(projectRoot, workflow.zipAsset) : workflow.zipAsset ?? null,
})

export function createCortexRuntime(projectRoot: string, options: CortexRuntimeOptions = {}) {
  const normalizedProjectRoot = normalizeWindowsPath(projectRoot)
  let state: RuntimeState | null = null
  let businessState: BusinessDashboardSnapshot | null = null
  let activeConfig: CortexConfig | null = null
  let pulseTimer: NodeJS.Timeout | null = null
  let lastUsageRefreshAt = 0
  let usageRefreshPromise: Promise<boolean> | null = null
  const pendingVoiceActions = new Map<string, CortexVoiceActionPrepared>()
  const gatewayProbe = options.gatewayProbe ?? defaultGatewayProbe
  const usageProbe = options.usageProbe ?? fetchOverviewUsageIndicators
  const listeners = new Set<(event: CortexStreamEvent) => void>()

  const readGatewayState = async (): Promise<CortexGatewayState> => {
    try {
      return await gatewayProbe()
    } catch {
      return {
        ...DEFAULT_GATEWAY_STATE,
        status: 'unknown',
        lastCheckedAt: isoNow(),
      }
    }
  }

  const readWorkflowRecords = async (fallbackWorkflows: CortexWorkflow[]) => {
    if (!hasSupabaseDatabaseConfig()) {
      return fallbackWorkflows
    }

    try {
      const supabaseWorkflows = await listSupabaseWorkflows()
      if (!supabaseWorkflows.length) {
        await upsertSupabaseWorkflows(
          fallbackWorkflows.map((workflow) => stripWorkflowPreviewData(workflow)),
        )
        return fallbackWorkflows
      }

      return (
        await Promise.all(
          supabaseWorkflows.map((workflow) => hydrateWorkflow(normalizedProjectRoot, workflow)),
        )
      ).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    } catch (error) {
      console.warn(
        'Supabase workflow read failed. Falling back to local workflow fixtures.',
        error,
      )
      return fallbackWorkflows
    }
  }

  const ensureState = async () => {
    if (state) {
      return state
    }

    const config = await loadConfig(normalizedProjectRoot)
    activeConfig = config
    const seeded = createRuntimeState(config)

    seeded.missions = await readJsonFile(
      resolveProjectPath(normalizedProjectRoot, config.dataSources.missionsPath),
      seeded.missions,
    )
    seeded.approvals = await readJsonFile(
      resolveProjectPath(normalizedProjectRoot, config.dataSources.approvalsPath),
      seeded.approvals,
    )
    seeded.agentLanes = await readJsonFile(
      resolveProjectPath(normalizedProjectRoot, config.dataSources.lanesPath),
      seeded.agentLanes,
    )
    seeded.vaultEntries = await readJsonFile(
      resolveProjectPath(normalizedProjectRoot, config.dataSources.vaultPath),
      seeded.vaultEntries,
    )
    const fixtureWorkflows = (
      await Promise.all(
        (
          await readJsonFile(
            resolveProjectPath(normalizedProjectRoot, config.dataSources.workflowsPath),
            seeded.workflows,
          )
        ).map((workflow) => hydrateWorkflow(normalizedProjectRoot, workflow)),
      )
    ).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    seeded.workflows = await readWorkflowRecords(fixtureWorkflows)
    seeded.drops = await readJsonFile(
      resolveProjectPath(normalizedProjectRoot, config.dataSources.dropsPath),
      seeded.drops,
    )
    seeded.loreEntries = await readJsonFile(
      resolveProjectPath(normalizedProjectRoot, config.dataSources.lorePath),
      seeded.loreEntries,
    )
    seeded.studioAssets = await readJsonFile(
      resolveProjectPath(normalizedProjectRoot, config.dataSources.studioPath),
      seeded.studioAssets,
    )
    seeded.integrationMonitors = await readJsonFile(
      resolveProjectPath(normalizedProjectRoot, config.dataSources.integrationsPath),
      seeded.integrationMonitors,
    )
    seeded.auditEvents = await readJsonFile(
      resolveProjectPath(normalizedProjectRoot, config.dataSources.auditPath),
      seeded.auditEvents,
    )
    seeded.economyMetrics = await readJsonFile(
      resolveProjectPath(normalizedProjectRoot, config.dataSources.economyPath),
      seeded.economyMetrics,
    )
    seeded.communitySignals = await readJsonFile(
      resolveProjectPath(normalizedProjectRoot, config.dataSources.communityPath),
      seeded.communitySignals,
    )
    seeded.system = await readJsonFile(
      resolveProjectPath(normalizedProjectRoot, config.dataSources.systemPath),
      seeded.system,
    )
    state = seeded
    return seeded
  }

  const ensureBusinessState = async () => {
    if (businessState) {
      return businessState
    }

    const config = activeConfig ?? (await loadConfig(normalizedProjectRoot))
    activeConfig = config
    const seeded = createBusinessRuntimeState(config)
    const dashboard = await readJsonFile(
      resolveProjectPath(normalizedProjectRoot, config.dataSources.businessPath),
      seeded,
    )
    businessState = {
      ...seeded,
      ...dashboard,
      commands: dashboard.commands?.length ? dashboard.commands : seeded.commands,
      gateway: dashboard.gateway ?? seeded.gateway,
    }

    return businessState
  }

  const persistWorkflows = async (workflows: CortexWorkflow[]) => {
    const current = await ensureState()
    const config = activeConfig ?? (await loadConfig(normalizedProjectRoot))
    activeConfig = config

    current.workflows = workflows
      .slice()
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    await writeJsonFile(
      resolveProjectPath(normalizedProjectRoot, config.dataSources.workflowsPath),
      current.workflows.map((workflow) => stripWorkflowPreviewData(workflow)),
    )
    if (hasSupabaseDatabaseConfig()) {
      await upsertSupabaseWorkflows(
        current.workflows.map((workflow) => stripWorkflowPreviewData(workflow)),
      )
    }

    return current.workflows
  }

  const resolveWorkflowAssetRecord = (
    workflowId: string,
    assetKey: CortexWorkflowAssetDownloadRequest['assetKey'],
  ) => {
    const workflow = state?.workflows.find((item) => item.id === workflowId)
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} was not found.`)
    }

    if (assetKey === 'zipAsset') {
      if (!workflow.zipAsset) {
        throw new Error(`Workflow ${workflowId} has no ZIP asset.`)
      }

      return workflow.zipAsset
    }

    return workflow[assetKey]
  }

  const emit = (event: CortexStreamEvent) => {
    listeners.forEach((listener) => listener(event))
  }

  const refreshUsageIndicators = async (force = false) => {
    const current = await ensureState()
    const refreshIntervalMs = Math.max(
      15_000,
      Number(process.env.CORTEX_USAGE_REFRESH_MS ?? DEFAULT_USAGE_REFRESH_INTERVAL_MS) ||
        DEFAULT_USAGE_REFRESH_INTERVAL_MS,
    )

    if (!force && lastUsageRefreshAt > 0 && Date.now() - lastUsageRefreshAt < refreshIntervalMs) {
      return false
    }

    if (usageRefreshPromise) {
      return usageRefreshPromise
    }

    usageRefreshPromise = (async () => {
      current.usageIndicators = await usageProbe()
      lastUsageRefreshAt = Date.now()
      return true
    })()

    try {
      return await usageRefreshPromise
    } finally {
      usageRefreshPromise = null
    }
  }

  const countCortexEntities = (current: RuntimeState) =>
    current.missions.length +
    current.approvals.length +
    current.agentLanes.length +
    current.vaultEntries.length +
    current.workflows.length +
    current.drops.length +
    current.loreEntries.length +
    current.studioAssets.length +
    current.integrationMonitors.length +
    current.usageIndicators.length +
    current.auditEvents.length +
    current.economyMetrics.length +
    current.communitySignals.length +
    current.commands.length +
    1

  const countBusinessEntities = (current: BusinessDashboardSnapshot) =>
    current.metrics.length +
    current.relationships.length +
    current.queue.length +
    current.sections.length +
    current.commands.length +
    1

  const getDatabaseStatus = async (): Promise<CortexDatabaseStatus> => {
    const [current, business, supabaseStatus] = await Promise.all([
      ensureState(),
      ensureBusinessState(),
      readSupabaseConnectionStatus(),
    ])
    const source = supabaseStatus.configured ? 'mixed' : 'fixtures'

    return {
      configured: supabaseStatus.configured,
      connected: supabaseStatus.connected,
      source,
      checkedAt: supabaseStatus.checkedAt,
      error: supabaseStatus.error,
      workspaces: [
        {
          workspace: 'cortex',
          source,
          entityCount: countCortexEntities(current),
          stale: false,
        },
        {
          workspace: 'business',
          source: 'fixtures',
          entityCount: countBusinessEntities(business),
          stale: false,
        },
      ],
      tables: [
        {
          name: 'public.cortex_workflows',
          configured: supabaseStatus.configured,
          connected: supabaseStatus.connected,
          readOnly: true,
          recordCount: current.workflows.length,
          lastCheckedAt: supabaseStatus.checkedAt,
          error: supabaseStatus.error,
        },
        {
          name: 'fixtures.business_dashboard',
          configured: true,
          connected: true,
          readOnly: true,
          recordCount: countBusinessEntities(business),
          lastCheckedAt: isoNow(),
          error: null,
        },
      ],
    }
  }

  const makeVoiceActionId = () =>
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? `voice-action-${crypto.randomUUID()}`
      : `voice-action-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`

  const prepareVoiceAction = async (
    payload: CortexVoiceActionRequest,
  ): Promise<CortexVoiceActionPrepared> => {
    const expiresAt = new Date(Date.now() + VOICE_ACTION_TTL_MS).toISOString()
    const prepared: CortexVoiceActionPrepared = {
      actionId: makeVoiceActionId(),
      action: payload.action,
      workspace: payload.workspace,
      parameters: clone(payload.parameters),
      reason: payload.reason?.trim() || null,
      transcript: payload.transcript?.trim() || null,
      requiresConfirmation: true,
      expiresAt,
      summary: `${payload.action} prepared for ${payload.workspace}.`,
    }

    pendingVoiceActions.set(prepared.actionId, prepared)
    return prepared
  }

  const makeVoiceActionResult = (
    prepared: CortexVoiceActionPrepared,
    patch: Partial<CortexVoiceActionResult>,
  ): CortexVoiceActionResult => ({
    actionId: prepared.actionId,
    action: prepared.action,
    workspace: prepared.workspace,
    ok: false,
    confirmed: false,
    canceled: false,
    result: null,
    error: null,
    auditedAt: isoNow(),
    ...patch,
  })

  const executePreparedVoiceAction = async (
    prepared: CortexVoiceActionPrepared,
    api: {
      runWorkspaceCommand: (
        workspace: WorkspaceContext,
        commandId: string,
        context?: string,
      ) => Promise<CortexCommandResult>
      getWorkspaceSnapshot: (workspace: WorkspaceContext) => Promise<WorkspaceSnapshot>
      createWorkflow: (payload: CortexWorkflowCreateInput) => Promise<CortexWorkflow>
      updateWorkflow: (payload: CortexWorkflowUpdateInput) => Promise<CortexWorkflow>
      deleteWorkflow: (workflowId: string) => Promise<void>
    },
  ): Promise<unknown> => {
    switch (prepared.action) {
      case 'run_workspace_command': {
        const commandId =
          typeof prepared.parameters.commandId === 'string'
            ? prepared.parameters.commandId
            : ''
        const context =
          typeof prepared.parameters.context === 'string'
            ? prepared.parameters.context
            : prepared.reason ?? undefined
        if (!commandId) {
          throw new Error('run_workspace_command requires commandId.')
        }
        return api.runWorkspaceCommand(prepared.workspace, commandId, context)
      }
      case 'refresh_workspace':
        return api.getWorkspaceSnapshot(prepared.workspace)
      case 'create_workflow':
        if (prepared.workspace !== 'cortex') {
          throw new Error('create_workflow is only available in the Cortex workspace.')
        }
        return api.createWorkflow(prepared.parameters as CortexWorkflowCreateInput)
      case 'update_workflow':
        if (prepared.workspace !== 'cortex') {
          throw new Error('update_workflow is only available in the Cortex workspace.')
        }
        return api.updateWorkflow(prepared.parameters as CortexWorkflowUpdateInput)
      case 'delete_workflow': {
        if (prepared.workspace !== 'cortex') {
          throw new Error('delete_workflow is only available in the Cortex workspace.')
        }
        const workflowId =
          typeof prepared.parameters.workflowId === 'string'
            ? prepared.parameters.workflowId
            : ''
        if (!workflowId) {
          throw new Error('delete_workflow requires workflowId.')
        }
        await api.deleteWorkflow(workflowId)
        return {
          ok: true,
          workflowId,
        }
      }
      default:
        throw new Error(`Unsupported voice action: ${prepared.action}`)
    }
  }

  const runtime = {
    async getWorkspaceSnapshot(workspace: WorkspaceContext): Promise<WorkspaceSnapshot> {
      if (workspace === 'business') {
        const current = await ensureBusinessState()
        current.gateway = await readGatewayState()
        return {
          workspace,
          dashboard: clone(current),
        }
      }

      return {
        workspace,
        dashboard: await this.getDashboardSnapshot(),
      }
    },
    async getDashboardSnapshot(): Promise<CortexDashboardSnapshot> {
      const current = await ensureState()
      current.gateway = await readGatewayState()
      await refreshUsageIndicators()
      return clone({
        missions: current.missions,
        approvals: current.approvals,
        agentLanes: current.agentLanes,
        vaultEntries: current.vaultEntries,
        workflows: current.workflows,
        drops: current.drops,
        loreEntries: current.loreEntries,
        studioAssets: current.studioAssets,
        integrationMonitors: current.integrationMonitors,
        usageIndicators: current.usageIndicators,
        auditEvents: current.auditEvents,
        economyMetrics: current.economyMetrics,
        communitySignals: current.communitySignals,
        commands: current.commands,
        system: current.system,
        gateway: current.gateway,
      })
    },
    async getDatabaseStatus(): Promise<CortexDatabaseStatus> {
      return getDatabaseStatus()
    },
    async prepareVoiceAction(
      payload: CortexVoiceActionRequest,
    ): Promise<CortexVoiceActionPrepared> {
      const prepared = await prepareVoiceAction(payload)
      await this.recordRealtimeLog({
        channel: 'realtime',
        severity: 'info',
        message:
          `Prepared voice action ${prepared.action} (${prepared.actionId}) in ${prepared.workspace}. ` +
          `transcript=${compactAuditValue(prepared.transcript)}; ` +
          `parameters=${compactAuditValue(prepared.parameters)}.`,
        accent: 'cyan',
      })
      return clone(prepared)
    },
    async confirmVoiceAction(
      payload: CortexVoiceActionConfirmation,
    ): Promise<CortexVoiceActionResult> {
      const prepared = pendingVoiceActions.get(payload.actionId)
      if (!prepared) {
        return {
          actionId: payload.actionId,
          action: 'refresh_workspace',
          workspace: 'cortex',
          ok: false,
          confirmed: payload.confirmed,
          canceled: !payload.confirmed,
          result: null,
          error: 'Prepared voice action was not found or already resolved.',
          auditedAt: isoNow(),
        }
      }

      pendingVoiceActions.delete(payload.actionId)
      if (new Date(prepared.expiresAt).getTime() < Date.now()) {
        await this.recordRealtimeLog({
          channel: 'realtime',
          severity: 'warning',
          message:
            `Expired voice action ${prepared.action} (${prepared.actionId}) in ${prepared.workspace}. ` +
            `transcript=${compactAuditValue(payload.transcript ?? prepared.transcript)}; ` +
            `parameters=${compactAuditValue(prepared.parameters)}.`,
          accent: 'amber',
        })
        return makeVoiceActionResult(prepared, {
          ok: false,
          confirmed: payload.confirmed,
          canceled: true,
          error: 'Prepared voice action expired before confirmation.',
        })
      }

      if (!payload.confirmed) {
        await this.recordRealtimeLog({
          channel: 'realtime',
          severity: 'info',
          message:
            `Canceled voice action ${prepared.action} (${prepared.actionId}) in ${prepared.workspace}. ` +
            `transcript=${compactAuditValue(payload.transcript ?? prepared.transcript)}; ` +
            `parameters=${compactAuditValue(prepared.parameters)}.`,
          accent: 'amber',
        })
        return makeVoiceActionResult(prepared, {
          ok: true,
          confirmed: false,
          canceled: true,
        })
      }

      try {
        const result = await executePreparedVoiceAction(prepared, runtime)
        await this.recordRealtimeLog({
          channel: 'realtime',
          severity: 'success',
          message:
            `Confirmed voice action ${prepared.action} (${prepared.actionId}) in ${prepared.workspace}. ` +
            `transcript=${compactAuditValue(payload.transcript ?? prepared.transcript)}; ` +
            `parameters=${compactAuditValue(prepared.parameters)}; ` +
            `result=${compactAuditValue(result)}.`,
          accent: 'green',
        })
        return makeVoiceActionResult(prepared, {
          ok: true,
          confirmed: true,
          canceled: false,
          result,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Voice action failed.'
        await this.recordRealtimeLog({
          channel: 'realtime',
          severity: 'warning',
          message:
            `Voice action ${prepared.action} (${prepared.actionId}) failed in ${prepared.workspace}. ` +
            `transcript=${compactAuditValue(payload.transcript ?? prepared.transcript)}; ` +
            `parameters=${compactAuditValue(prepared.parameters)}; error=${message}.`,
          accent: 'amber',
        })
        return makeVoiceActionResult(prepared, {
          ok: false,
          confirmed: true,
          canceled: false,
          error: message,
        })
      }
    },
    async listAgents(): Promise<CortexAgentLane[]> {
      return clone((await ensureState()).agentLanes)
    },
    async listMemories(): Promise<CortexVaultEntry[]> {
      return clone((await ensureState()).vaultEntries)
    },
    async listWorkflows(): Promise<CortexWorkflow[]> {
      return clone((await ensureState()).workflows)
    },
    async listSchedules(): Promise<CortexDrop[]> {
      return clone((await ensureState()).drops)
    },
    async listLogs(): Promise<CortexAuditEvent[]> {
      return clone((await ensureState()).auditEvents)
    },
    async createWorkflow(payload: CortexWorkflowCreateInput): Promise<CortexWorkflow> {
      const current = await ensureState()
      const validated = validateWorkflowCreateInput(payload)
      const workflowId = makeWorkflowId(validated.title)
      const workflow: CortexWorkflow = {
        id: workflowId,
        title: validated.title,
        description: validated.description,
        toolsUsed: validated.toolsUsed,
        architecture: validated.architecture,
        diagramSource: await makeStoredWorkflowAsset(
          normalizedProjectRoot,
          workflowId,
          'diagram-source',
          validated.diagramSource,
        ),
        diagramPreview: await makeStoredWorkflowAsset(
          normalizedProjectRoot,
          workflowId,
          'diagram-preview',
          validated.diagramPreview,
        ),
        zipAsset: validated.zipAsset
          ? await makeStoredWorkflowAsset(normalizedProjectRoot, workflowId, 'zip', validated.zipAsset)
          : null,
        updatedAt: isoNow(),
        accent: 'cyan',
      }

      await persistWorkflows([workflow, ...current.workflows])
      return clone(workflow)
    },
    async updateWorkflow(payload: CortexWorkflowUpdateInput): Promise<CortexWorkflow> {
      const current = await ensureState()
      const validated = validateWorkflowUpdateInput(payload)
      const existing = current.workflows.find((workflow) => workflow.id === payload.id)
      if (!existing) {
        throw new Error(`Workflow ${payload.id} was not found.`)
      }

      let nextDiagramSource = existing.diagramSource
      let nextDiagramPreview = existing.diagramPreview
      let nextZipAsset = existing.zipAsset ?? null

      if (payload.diagramSource.mode === 'replace') {
        const prior = existing.diagramSource
        nextDiagramSource = await makeStoredWorkflowAsset(
          normalizedProjectRoot,
          existing.id,
          'diagram-source',
          payload.diagramSource,
        )
        if (prior.path !== nextDiagramSource.path) {
          await deleteWorkflowAssetIfPresent(normalizedProjectRoot, prior)
        }
      }

      if (payload.diagramPreview.mode === 'replace') {
        const prior = existing.diagramPreview
        nextDiagramPreview = await makeStoredWorkflowAsset(
          normalizedProjectRoot,
          existing.id,
          'diagram-preview',
          payload.diagramPreview,
        )
        if (prior.path !== nextDiagramPreview.path) {
          await deleteWorkflowAssetIfPresent(normalizedProjectRoot, prior)
        }
      }

      if (payload.zipAsset.mode === 'replace') {
        const prior = existing.zipAsset
        nextZipAsset = await makeStoredWorkflowAsset(
          normalizedProjectRoot,
          existing.id,
          'zip',
          payload.zipAsset,
        )
        if (prior?.path !== nextZipAsset.path) {
          await deleteWorkflowAssetIfPresent(normalizedProjectRoot, prior)
        }
      } else if (payload.zipAsset.mode === 'remove') {
        await deleteWorkflowAssetIfPresent(normalizedProjectRoot, existing.zipAsset)
        nextZipAsset = null
      }

      const updated: CortexWorkflow = {
        ...existing,
        title: validated.title,
        description: validated.description,
        toolsUsed: validated.toolsUsed,
        architecture: validated.architecture,
        diagramSource: nextDiagramSource,
        diagramPreview: nextDiagramPreview,
        zipAsset: nextZipAsset,
        updatedAt: isoNow(),
      }

      await persistWorkflows(
        current.workflows.map((workflow) => (workflow.id === existing.id ? updated : workflow)),
      )
      return clone(updated)
    },
    async deleteWorkflow(workflowId: string): Promise<void> {
      const current = await ensureState()
      const workflow = current.workflows.find((item) => item.id === workflowId)
      if (!workflow) {
        return
      }

      await deleteWorkflowAssetIfPresent(normalizedProjectRoot, workflow.diagramSource)
      await deleteWorkflowAssetIfPresent(normalizedProjectRoot, workflow.diagramPreview)
      await deleteWorkflowAssetIfPresent(normalizedProjectRoot, workflow.zipAsset)
      await fs.rm(path.join(getWorkflowAssetRoot(normalizedProjectRoot), workflowId), {
        recursive: true,
        force: true,
      })
      await persistWorkflows(current.workflows.filter((item) => item.id !== workflowId))
      if (hasSupabaseDatabaseConfig()) {
        await deleteSupabaseWorkflow(workflowId)
      }
    },
    async downloadWorkflowAsset(
      payload: CortexWorkflowAssetDownloadRequest,
      targetPath: string,
    ): Promise<string> {
      await ensureState()
      const asset = resolveWorkflowAssetRecord(payload.workflowId, payload.assetKey)
      const sourcePath = getWorkflowAssetAbsolutePath(normalizedProjectRoot, asset)
      await fs.mkdir(path.dirname(targetPath), { recursive: true })
      await fs.copyFile(sourcePath, targetPath)
      return targetPath
    },
    async runCommand(commandId: string, context?: string): Promise<CortexCommandResult> {
      const current = await ensureState()
      const command = current.commands.find((entry) => entry.id === commandId)

      if (!command) {
        return {
          commandId,
          ok: false,
          exitCode: 1,
          stdout: '',
          stderr: `Unknown command: ${commandId}`,
          ranAt: isoNow(),
          durationMs: 0,
          context,
        }
      }

      const startedAt = performance.now()
      const cwd = resolveProjectPath(normalizedProjectRoot, command.cwd ?? '.')

      const result = await new Promise<CortexCommandResult>((resolve) => {
        const child = spawn(command.command, [...command.args], {
          cwd,
          shell: false,
        })

        let stdout = ''
        let stderr = ''

        child.stdout?.on('data', (chunk) => {
          stdout += chunk.toString()
        })

        child.stderr?.on('data', (chunk) => {
          stderr += chunk.toString()
        })

        child.on('close', (exitCode) => {
          resolve({
            commandId,
            ok: exitCode === 0,
            exitCode: exitCode ?? 1,
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            ranAt: isoNow(),
            durationMs: Math.round(performance.now() - startedAt),
            context,
          })
        })

        child.on('error', (error) => {
          resolve({
            commandId,
            ok: false,
            exitCode: 1,
            stdout: '',
            stderr: error.message,
            ranAt: isoNow(),
            durationMs: Math.round(performance.now() - startedAt),
            context,
          })
        })
      })

      state = applyCommandMutation(current, commandId, result)
      emit({ kind: 'commandResult', result })
      emit({
        kind: 'log',
        log: state.auditEvents[0],
      })

      return result
    },
    async runWorkspaceCommand(
      workspace: WorkspaceContext,
      commandId: string,
      context?: string,
    ): Promise<CortexCommandResult> {
      if (workspace === 'business') {
        const current = await ensureBusinessState()
        const result: CortexCommandResult = {
          commandId,
          ok: true,
          exitCode: 0,
          stdout: `Business workspace command ${commandId} executed in placeholder mode.`,
          stderr: '',
          ranAt: isoNow(),
          durationMs: 90,
          context,
        }

        current.queue = current.queue.map((item, index) =>
          index === 0
            ? {
                ...item,
                status: item.status === 'blocked' ? 'active' : item.status,
              }
            : item,
        )
        current.system = applySystemDrift(current.system, 0.18)

        return result
      }

      return this.runCommand(commandId, context)
    },
    async recordRealtimeLog(entry: CortexRealtimeLogEntry) {
      const current = await ensureState()
      const auditEvent = makeAuditEvent({
        category: 'runtime',
        severity: entry.severity,
        title: entry.channel,
        message: entry.message,
        actor: entry.agentId ?? entry.channel,
        accent: entry.accent ?? 'cyan',
      })

      current.auditEvents = [auditEvent, ...current.auditEvents].slice(0, MAX_AUDIT_EVENTS)
      emit({ kind: 'log', log: auditEvent })
    },
    subscribeToEvents(listener: (event: CortexStreamEvent) => void) {
      listeners.add(listener)

      if (!pulseTimer) {
        pulseTimer = setInterval(async () => {
          const current = await ensureState()
          current.system = applySystemDrift(current.system, Math.sin(Date.now() / 5000) * 0.18)
          emit({ kind: 'systemPulse', snapshot: current.system })
          current.gateway = await readGatewayState()
          emit({ kind: 'gatewayPulse', gateway: current.gateway })
          if (await refreshUsageIndicators()) {
            emit({ kind: 'usagePulse', indicators: clone(current.usageIndicators) })
          }
        }, 6000)
      }

      return () => {
        listeners.delete(listener)
        if (!listeners.size && pulseTimer) {
          clearInterval(pulseTimer)
          pulseTimer = null
        }
      }
    },
  }

  return runtime
}
