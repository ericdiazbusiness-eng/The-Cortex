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
  type CortexDashboardSnapshot,
  type CortexDrop,
  type CortexGatewayState,
  type CortexRealtimeLogEntry,
  type CortexStreamEvent,
  type CortexSystemSnapshot,
  type CortexVaultEntry,
  type CortexWorkflow,
  type CortexWorkflowAsset,
  type CortexWorkflowAssetDownloadRequest,
  type CortexWorkflowAssetUpload,
  type CortexWorkflowCreateInput,
  type CortexWorkflowUpdateInput,
  type WorkspaceContext,
  type WorkspaceSnapshot,
} from '../src/shared/cortex'

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
}

export type RuntimeState = CortexDashboardSnapshot & {
  gateway: CortexGatewayState
}

const CONFIG_FILE = 'cortex.config.json'
const MAX_AUDIT_EVENTS = 40
const DEFAULT_GATEWAY_PROCESS_TERMS = ['hermes', 'cortex profile gateway']
const DEFAULT_WORKFLOW_ASSET_ROOT = path.join('fixtures', 'workflow-assets')
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg'])

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const isoNow = () => new Date().toISOString()

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
  const gatewayProbe = options.gatewayProbe ?? defaultGatewayProbe
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
    seeded.workflows = (
      await Promise.all(
        (
          await readJsonFile(
            resolveProjectPath(normalizedProjectRoot, config.dataSources.workflowsPath),
            seeded.workflows,
          )
        ).map((workflow) => hydrateWorkflow(normalizedProjectRoot, workflow)),
      )
    ).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
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

  return {
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
        auditEvents: current.auditEvents,
        economyMetrics: current.economyMetrics,
        communitySignals: current.communitySignals,
        commands: current.commands,
        system: current.system,
        gateway: current.gateway,
      })
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
}
