import {
  DEFAULT_BUSINESS_FALLBACK_DATA,
  DEFAULT_FALLBACK_DATA,
  DEFAULT_GATEWAY_STATE,
  getRealtimeModeProfile,
  type CortexBridge,
  type CortexAuditEvent,
  type CortexCommandResult,
  type CortexDashboardSnapshot,
  type CortexWorkflow,
  type CortexWorkflowAsset,
  type CortexWorkflowAssetDownloadRequest,
  type CortexWorkflowAssetDownloadResult,
  type CortexWorkflowAssetUpload,
  type CortexWorkflowCreateInput,
  type CortexWorkflowUpdateInput,
  type CortexRealtimeDebugEntry,
  type CortexRealtimeDebugEntryInput,
  type CortexRealtimeLogEntry,
  type CortexStreamEvent,
  type WorkspaceContext,
  type WorkspaceSnapshot,
} from '@/shared/cortex'

const clone = <T,>(value: T) => JSON.parse(JSON.stringify(value)) as T

const isoNow = () => new Date().toISOString()

const bytesFromBase64 = (value: string) => {
  try {
    return atob(value).length
  } catch {
    return 0
  }
}

const asDataUrl = (asset: CortexWorkflowAssetUpload) =>
  asset.mimeType.startsWith('image/')
    ? `data:${asset.mimeType};base64,${asset.dataBase64}`
    : null

const makeWorkflowAsset = (
  workflowId: string,
  assetType: 'diagram-source' | 'diagram-preview' | 'zip',
  asset: CortexWorkflowAssetUpload,
): CortexWorkflowAsset => ({
  path: `fixtures/workflow-assets/${workflowId}/${assetType}-${asset.fileName}`,
  fileName: asset.fileName,
  mimeType: asset.mimeType,
  sizeBytes: bytesFromBase64(asset.dataBase64),
  uploadedAt: isoNow(),
  previewUrl: asDataUrl(asset),
})

const normalizeToolsUsed = (toolsUsed: string[]) =>
  toolsUsed
    .map((tool) => tool.trim())
    .filter(Boolean)

const buildWorkflow = (payload: CortexWorkflowCreateInput): CortexWorkflow => {
  const workflowId =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? `workflow-${crypto.randomUUID()}`
      : `workflow-${Date.now()}`

  return {
    id: workflowId,
    title: payload.title.trim(),
    description: payload.description.trim(),
    toolsUsed: normalizeToolsUsed(payload.toolsUsed),
    architecture: payload.architecture.trim(),
    diagramSource: makeWorkflowAsset(workflowId, 'diagram-source', payload.diagramSource),
    diagramPreview: makeWorkflowAsset(workflowId, 'diagram-preview', payload.diagramPreview),
    zipAsset: payload.zipAsset ? makeWorkflowAsset(workflowId, 'zip', payload.zipAsset) : null,
    updatedAt: isoNow(),
    accent: 'cyan',
  }
}

const updateWorkflowRecord = (
  current: CortexWorkflow,
  payload: CortexWorkflowUpdateInput,
): CortexWorkflow => ({
  ...current,
  title: payload.title.trim(),
  description: payload.description.trim(),
  toolsUsed: normalizeToolsUsed(payload.toolsUsed),
  architecture: payload.architecture.trim(),
  diagramSource:
    payload.diagramSource.mode === 'replace'
      ? makeWorkflowAsset(current.id, 'diagram-source', payload.diagramSource)
      : current.diagramSource,
  diagramPreview:
    payload.diagramPreview.mode === 'replace'
      ? makeWorkflowAsset(current.id, 'diagram-preview', payload.diagramPreview)
      : current.diagramPreview,
  zipAsset:
    payload.zipAsset.mode === 'replace'
      ? makeWorkflowAsset(current.id, 'zip', payload.zipAsset)
      : payload.zipAsset.mode === 'remove'
        ? null
        : current.zipAsset ?? null,
  updatedAt: isoNow(),
})

const resolveWorkflowAsset = (
  workflow: CortexWorkflow | undefined,
  payload: CortexWorkflowAssetDownloadRequest,
) => {
  if (!workflow) {
    return null
  }

  if (payload.assetKey === 'zipAsset') {
    return workflow.zipAsset ?? null
  }

  return workflow[payload.assetKey]
}

export const createBrowserFallbackApi = (): CortexBridge => {
  let snapshot: CortexDashboardSnapshot = clone(DEFAULT_FALLBACK_DATA)
  let businessSnapshot = clone(DEFAULT_BUSINESS_FALLBACK_DATA)
  let realtimeDebugEntries: CortexRealtimeDebugEntry[] = []
  snapshot = {
    ...snapshot,
    gateway: {
      ...DEFAULT_GATEWAY_STATE,
      status: 'off',
      lastCheckedAt: isoNow(),
    },
  }
  businessSnapshot = {
    ...businessSnapshot,
    gateway: {
      ...DEFAULT_GATEWAY_STATE,
      status: 'off',
      lastCheckedAt: isoNow(),
    },
  }

  const getWorkspaceSnapshot = async (
    workspace: WorkspaceContext,
  ): Promise<WorkspaceSnapshot> =>
    workspace === 'business'
      ? {
          workspace,
          dashboard: clone(businessSnapshot),
        }
      : {
          workspace,
          dashboard: clone(snapshot),
        }

  return {
    async getWorkspaceSnapshot(workspace) {
      return getWorkspaceSnapshot(workspace)
    },
    async getDashboardSnapshot() {
      return clone(snapshot)
    },
    async listAgents() {
      return clone(snapshot.agentLanes)
    },
    async listMemories() {
      return clone(snapshot.vaultEntries)
    },
    async listWorkflows() {
      return clone(snapshot.workflows)
    },
    async listSchedules() {
      return clone(snapshot.drops)
    },
    async listLogs() {
      return clone(snapshot.auditEvents)
    },
    async createWorkflow(payload) {
      const workflow = buildWorkflow(payload)
      snapshot = {
        ...snapshot,
        workflows: [workflow, ...snapshot.workflows],
      }

      return clone(workflow)
    },
    async updateWorkflow(payload) {
      const current = snapshot.workflows.find((workflow) => workflow.id === payload.id)
      if (!current) {
        throw new Error(`Unknown workflow: ${payload.id}`)
      }

      const updated = updateWorkflowRecord(current, payload)
      snapshot = {
        ...snapshot,
        workflows: snapshot.workflows.map((workflow) =>
          workflow.id === payload.id ? updated : workflow,
        ),
      }

      return clone(updated)
    },
    async deleteWorkflow(workflowId) {
      snapshot = {
        ...snapshot,
        workflows: snapshot.workflows.filter((workflow) => workflow.id !== workflowId),
      }
    },
    async downloadWorkflowAsset(payload): Promise<CortexWorkflowAssetDownloadResult> {
      const asset = resolveWorkflowAsset(
        snapshot.workflows.find((workflow) => workflow.id === payload.workflowId),
        payload,
      )

      if (!asset) {
        throw new Error(`Workflow asset not found for ${payload.workflowId}`)
      }

      return {
        ok: true,
        canceled: false,
        filePath: asset.path,
      }
    },
    async runCommand(commandId, context) {
      const result: CortexCommandResult = {
        commandId,
        ok: true,
        exitCode: 0,
        stdout: `Browser fallback executed ${commandId}.`,
        stderr: '',
        ranAt: isoNow(),
        durationMs: 140,
        context,
      }

      const log: CortexAuditEvent = {
        id: `browser-${Date.now()}`,
        timestamp: isoNow(),
        category: 'runtime',
        severity: 'info',
        title: 'Browser fallback command',
        message: `Simulated command ${commandId} executed in browser fallback mode.`,
        actor: 'browser-fallback',
        accent: 'cyan',
      }

      snapshot = {
        ...snapshot,
        auditEvents: [log, ...snapshot.auditEvents].slice(0, 40),
        system: {
          ...snapshot.system,
          throughput: Math.min(99, snapshot.system.throughput + 1),
          runtimeSeconds: snapshot.system.runtimeSeconds + 1,
          lastUpdated: isoNow(),
        },
      }

      return result
    },
    async runWorkspaceCommand(workspace, commandId, context) {
      if (workspace === 'business') {
        return {
          commandId,
          ok: true,
          exitCode: 0,
          stdout: `Browser fallback executed ${commandId} for the business workspace.`,
          stderr: '',
          ranAt: isoNow(),
          durationMs: 120,
          context,
        }
      }

      return this.runCommand(commandId, context)
    },
    async createRealtimeCall() {
      throw new Error('Realtime voice requires the Electron runtime bridge.')
    },
    async transcribeAudio() {
      throw new Error('Tool voice transcription requires the Electron runtime bridge.')
    },
    async createRealtimeTranscriptionToken() {
      throw new Error('Realtime transcription requires the Electron runtime bridge.')
    },
    async createToolVoiceResponse() {
      return {
        id: `browser-response-${Date.now()}`,
        outputText:
          'Browser fallback tool voice is unavailable. Open the Electron app to use voice modes.',
        output: [
          {
            type: 'message',
            role: 'assistant',
            content: [
              {
                type: 'output_text',
                text:
                  'Browser fallback tool voice is unavailable. Open the Electron app to use voice modes.',
              },
            ],
          },
        ],
      }
    },
    async synthesizeSpeech(payload) {
      throw new Error(
        `Speech synthesis with ${payload.model ?? getRealtimeModeProfile('lean_voice').speechModel} requires the Electron runtime bridge.`,
      )
    },
    async abortVoiceTurn(payload) {
      return {
        ok: true,
        aborted: false,
        abortedStages: [],
        reason: payload.reason,
      }
    },
    async recordRealtimeLog(entry: CortexRealtimeLogEntry) {
      const log: CortexAuditEvent = {
        id: `realtime-${Date.now()}`,
        timestamp: isoNow(),
        category: 'runtime',
        severity: entry.severity,
        title: entry.channel,
        message: entry.message,
        actor: entry.agentId ?? entry.channel,
        accent: entry.accent ?? 'cyan',
      }

      snapshot = {
        ...snapshot,
        auditEvents: [log, ...snapshot.auditEvents].slice(0, 40),
      }
    },
    async getRealtimeDebugEntries() {
      return clone(realtimeDebugEntries)
    },
    async recordRealtimeDebug(entry: CortexRealtimeDebugEntryInput) {
      realtimeDebugEntries = [
        {
          id: `debug-${Date.now()}`,
          timestamp: isoNow(),
          ...entry,
        },
        ...realtimeDebugEntries,
      ].slice(0, 200)
    },
    subscribeToEvents(listener) {
      const timer = window.setInterval(() => {
        const pulse: CortexStreamEvent = {
          kind: 'systemPulse',
          snapshot: {
            ...snapshot.system,
            throughput: 76 + Math.round(Math.sin(Date.now() / 3000) * 6),
            neuralLoad: 72 + Math.round(Math.cos(Date.now() / 4000) * 6),
            lastUpdated: isoNow(),
            runtimeSeconds: snapshot.system.runtimeSeconds + 5,
          },
        }

        listener(pulse)
      }, 6000)

      return () => window.clearInterval(timer)
    },
    subscribeToRealtimeDebug() {
      return () => {}
    },
  }
}
