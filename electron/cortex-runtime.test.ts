// @vitest-environment node

import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  applyCommandMutation,
  createCortexRuntime,
  loadConfig,
  type RuntimeState,
} from './cortex-runtime'
import {
  DEFAULT_FALLBACK_DATA,
  DEFAULT_GATEWAY_STATE,
  type CortexStreamEvent,
} from '../src/shared/cortex'

const clone = <T,>(value: T) => JSON.parse(JSON.stringify(value)) as T

const cleanupPaths: string[] = []

afterEach(async () => {
  await Promise.all(
    cleanupPaths.splice(0).map(async (dir) => {
      await import('node:fs/promises').then(({ rm }) => rm(dir, { recursive: true, force: true }))
    }),
  )
})

describe('cortex runtime', () => {
  it('falls back to the default config when no file exists', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'cortex-config-'))
    cleanupPaths.push(dir)

    const config = await loadConfig(dir)

    expect(config.commands.length).toBeGreaterThan(0)
    expect(config.dataSources.missionsPath).toContain('fixtures/missions.json')
    expect(config.dataSources.workflowsPath).toContain('fixtures/workflows.json')
  })

  it('uses project config when cortex.config.json exists', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'cortex-config-'))
    cleanupPaths.push(dir)
    await writeFile(
      path.join(dir, 'cortex.config.json'),
      JSON.stringify({
        dataSources: {
          missionsPath: './custom-missions.json',
          workflowsPath: './custom-workflows.json',
        },
      }),
      'utf8',
    )

    const config = await loadConfig(dir)

    expect(config.dataSources.missionsPath).toBe('./custom-missions.json')
    expect(config.dataSources.workflowsPath).toBe('./custom-workflows.json')
    expect(config.dataSources.vaultPath).toContain('fixtures/vault.json')
  })

  it('mutates runtime state after a mission command completes', () => {
    const state: RuntimeState = clone({
      ...DEFAULT_FALLBACK_DATA,
      commands: DEFAULT_FALLBACK_DATA.commands,
      gateway: DEFAULT_GATEWAY_STATE,
    })

    const next = applyCommandMutation(state, 'sync-drop-lane', {
      commandId: 'sync-drop-lane',
      ok: true,
      exitCode: 0,
      stdout: 'ok',
      stderr: '',
      ranAt: new Date().toISOString(),
      durationMs: 80,
      context: 'test',
    })

    expect(next.agentLanes.find((lane) => lane.id === 'ops_agent')?.status).toBe('active')
    expect(next.auditEvents[0]?.message).toMatch(/drop planner refreshed/i)
  })

  it('records realtime logs into the audit stream', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'cortex-runtime-'))
    cleanupPaths.push(dir)
    const runtime = createCortexRuntime(dir, {
      gatewayProbe: vi.fn().mockResolvedValue(DEFAULT_GATEWAY_STATE),
    })

    await runtime.recordRealtimeLog({
      channel: 'realtime',
      severity: 'info',
      message: 'Realtime voice connected.',
      accent: 'green',
    })

    const logs = await runtime.listLogs()
    expect(logs[0]).toMatchObject({
      category: 'runtime',
      title: 'realtime',
      message: 'Realtime voice connected.',
      severity: 'info',
      accent: 'green',
    })
  })

  it('persists created workflows and downloads workflow assets', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'cortex-workflows-'))
    cleanupPaths.push(dir)
    await mkdir(path.join(dir, 'fixtures'), { recursive: true })
    await writeFile(
      path.join(dir, 'cortex.config.json'),
      JSON.stringify({
        dataSources: {
          workflowsPath: './fixtures/workflows.json',
        },
      }),
      'utf8',
    )

    const runtime = createCortexRuntime(dir)
    const created = await runtime.createWorkflow({
      title: 'Nightly Export',
      description: 'Exports workflow data every night.',
      toolsUsed: ['Exporter', 'Audit log'],
      architecture: 'Cron start, normalize records, then archive output.',
      diagramSource: {
        fileName: 'nightly-export.excalidraw',
        mimeType: 'application/vnd.excalidraw+json',
        dataBase64: Buffer.from('{"type":"excalidraw"}').toString('base64'),
      },
      diagramPreview: {
        fileName: 'nightly-export.svg',
        mimeType: 'image/svg+xml',
        dataBase64: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>').toString('base64'),
      },
      zipAsset: null,
    })

    expect(created.title).toBe('Nightly Export')
    const workflowsFile = JSON.parse(
      await readFile(path.join(dir, 'fixtures', 'workflows.json'), 'utf8'),
    )
    expect(workflowsFile[0].title).toBe('Nightly Export')

    const reloadedRuntime = createCortexRuntime(dir)
    const reloaded = await reloadedRuntime.listWorkflows()
    expect(reloaded[0]?.diagramPreview.previewUrl).toMatch(/^data:image\/svg\+xml;base64,/)

    const downloadPath = path.join(dir, 'downloads', 'nightly-export.excalidraw')
    await reloadedRuntime.downloadWorkflowAsset(
      {
        workflowId: created.id,
        assetKey: 'diagramSource',
      },
      downloadPath,
    )

    expect(await readFile(downloadPath, 'utf8')).toContain('"type":"excalidraw"')
  })

  it('includes the business dashboard fixture path in runtime config', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'cortex-business-config-'))
    cleanupPaths.push(dir)

    const config = await loadConfig(dir)

    expect(config.dataSources.businessPath).toContain('fixtures/business-dashboard.json')
  })

  it('includes gateway heartbeat state in snapshots and gateway pulse events', async () => {
    vi.useFakeTimers()
    try {
      const dir = await mkdtemp(path.join(os.tmpdir(), 'cortex-runtime-'))
      cleanupPaths.push(dir)
      const gateway = {
        status: 'on' as const,
        processName: 'hermes',
        lastCheckedAt: '2026-04-15T00:00:00.000Z',
      }
      const runtime = createCortexRuntime(dir, {
        gatewayProbe: vi.fn().mockResolvedValue(gateway),
      })

      const snapshot = await runtime.getDashboardSnapshot()
      expect(snapshot.gateway).toEqual(gateway)

      const events: CortexStreamEvent[] = []
      const unsubscribe = runtime.subscribeToEvents((event) => {
        events.push(event)
      })

      await vi.advanceTimersByTimeAsync(6000)
      await Promise.resolve()

      expect(events).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            kind: 'gatewayPulse',
            gateway,
          }),
        ]),
      )

      unsubscribe()
    } finally {
      vi.useRealTimers()
    }
  })
})
