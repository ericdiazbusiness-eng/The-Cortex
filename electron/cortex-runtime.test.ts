// @vitest-environment node

import { mkdtemp, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  applyCommandMutation,
  createCortexRuntime,
  loadConfig,
  type RuntimeState,
} from './cortex-runtime'
import { DEFAULT_FALLBACK_DATA } from '../src/shared/cortex'

const clone = <T,>(value: T) => JSON.parse(JSON.stringify(value)) as T

const cleanupPaths: string[] = []

afterEach(async () => {
  await Promise.all(
    cleanupPaths.splice(0).map(async (dir) => {
      await import('node:fs/promises').then(({ rm }) =>
        rm(dir, { recursive: true, force: true }),
      )
    }),
  )
})

describe('cortex runtime', () => {
  it('falls back to the default config when no file exists', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'cortex-config-'))
    cleanupPaths.push(dir)

    const config = await loadConfig(dir)

    expect(config.commands.length).toBeGreaterThan(0)
    expect(config.dataSources.agentsPath).toContain('fixtures/agents.json')
  })

  it('uses project config when cortex.config.json exists', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'cortex-config-'))
    cleanupPaths.push(dir)
    await writeFile(
      path.join(dir, 'cortex.config.json'),
      JSON.stringify({
        dataSources: {
          agentsPath: './custom-agents.json',
        },
      }),
      'utf8',
    )

    const config = await loadConfig(dir)

    expect(config.dataSources.agentsPath).toBe('./custom-agents.json')
    expect(config.dataSources.memoriesPath).toContain('fixtures/memories.json')
  })

  it('mutates runtime state after a command completes', () => {
    const state: RuntimeState = clone({
      ...DEFAULT_FALLBACK_DATA,
      commands: DEFAULT_FALLBACK_DATA.commands,
    })

    const next = applyCommandMutation(state, 'run-outreach-sync', {
      commandId: 'run-outreach-sync',
      ok: true,
      exitCode: 0,
      stdout: 'ok',
      stderr: '',
      ranAt: new Date().toISOString(),
      durationMs: 80,
      context: 'test',
    })

    const marketingLead = next.agents.find((agent) => agent.id === 'zib001')
    expect(marketingLead?.status).toBe('active')
    expect(next.logs[0]?.message).toMatch(/marketing lane refreshed/i)
  })

  it('records realtime logs into the existing log stream', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'cortex-runtime-'))
    cleanupPaths.push(dir)
    const runtime = createCortexRuntime(dir)

    await runtime.recordRealtimeLog({
      channel: 'realtime',
      severity: 'info',
      message: 'Realtime voice connected.',
      accent: 'green',
    })

    const logs = await runtime.listLogs()
    expect(logs[0]).toMatchObject({
      channel: 'realtime',
      message: 'Realtime voice connected.',
      severity: 'info',
      accent: 'green',
    })
  })
})
