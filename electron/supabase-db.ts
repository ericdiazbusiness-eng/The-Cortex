import pg from 'pg'
import type { CortexWorkflow } from '../src/shared/cortex'

const { Pool } = pg

let pool: pg.Pool | null = null

const getDatabaseUrl = () =>
  process.env.SUPABASE_DATABASE_URL?.trim() ||
  process.env.DATABASE_URL?.trim() ||
  null

export const hasSupabaseDatabaseConfig = () => Boolean(getDatabaseUrl())

export const getSupabaseDatabasePool = () => {
  const connectionString = getDatabaseUrl()
  if (!connectionString) {
    throw new Error('SUPABASE_DATABASE_URL is not configured.')
  }

  pool ??= new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 3,
  })

  return pool
}

export const closeSupabaseDatabasePool = async () => {
  const currentPool = pool
  pool = null
  await currentPool?.end()
}

export const readSupabaseConnectionStatus = async () => {
  if (!hasSupabaseDatabaseConfig()) {
    return {
      configured: false,
      connected: false,
      checkedAt: new Date().toISOString(),
      error: null,
    }
  }

  try {
    const result = await getSupabaseDatabasePool().query<{
      checked_at: string | Date
    }>('select now() as checked_at')
    const checkedAt = result.rows[0]?.checked_at
    return {
      configured: true,
      connected: true,
      checkedAt:
        checkedAt instanceof Date
          ? checkedAt.toISOString()
          : checkedAt
            ? new Date(checkedAt).toISOString()
            : new Date().toISOString(),
      error: null,
    }
  } catch (error) {
    return {
      configured: true,
      connected: false,
      checkedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Supabase connection check failed.',
    }
  }
}

const WORKFLOW_TABLE_SQL = `
  create table if not exists public.cortex_workflows (
    id text primary key,
    title text not null,
    description text not null,
    tools_used jsonb not null default '[]'::jsonb,
    architecture text not null,
    diagram_source jsonb not null,
    diagram_preview jsonb not null,
    zip_asset jsonb,
    accent text not null default 'cyan',
    updated_at timestamptz not null,
    created_at timestamptz not null default now(),
    synced_at timestamptz not null default now()
  )
`

const WORKFLOW_INDEX_SQL = `
  create index if not exists cortex_workflows_updated_at_idx
  on public.cortex_workflows (updated_at desc)
`

type CortexWorkflowRow = {
  id: string
  title: string
  description: string
  tools_used: string[] | string
  architecture: string
  diagram_source: CortexWorkflow['diagramSource'] | string
  diagram_preview: CortexWorkflow['diagramPreview'] | string
  zip_asset: CortexWorkflow['zipAsset'] | string | null
  accent: CortexWorkflow['accent']
  updated_at: string | Date
}

const parseJsonColumn = <T>(value: T | string): T =>
  typeof value === 'string' ? JSON.parse(value) as T : value

const normalizeWorkflowRow = (row: CortexWorkflowRow): CortexWorkflow => ({
  id: row.id,
  title: row.title,
  description: row.description,
  toolsUsed: parseJsonColumn<string[]>(row.tools_used),
  architecture: row.architecture,
  diagramSource: parseJsonColumn<CortexWorkflow['diagramSource']>(row.diagram_source),
  diagramPreview: parseJsonColumn<CortexWorkflow['diagramPreview']>(row.diagram_preview),
  zipAsset: row.zip_asset
    ? parseJsonColumn<NonNullable<CortexWorkflow['zipAsset']>>(row.zip_asset)
    : null,
  updatedAt:
    row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : new Date(row.updated_at).toISOString(),
  accent: row.accent,
})

export const ensureSupabaseWorkflowSchema = async () => {
  const client = await getSupabaseDatabasePool().connect()

  try {
    await client.query(WORKFLOW_TABLE_SQL)
    await client.query(WORKFLOW_INDEX_SQL)
  } finally {
    client.release()
  }
}

export const listSupabaseWorkflows = async (): Promise<CortexWorkflow[]> => {
  await ensureSupabaseWorkflowSchema()
  const result = await getSupabaseDatabasePool().query<CortexWorkflowRow>(`
    select
      id,
      title,
      description,
      tools_used,
      architecture,
      diagram_source,
      diagram_preview,
      zip_asset,
      accent,
      updated_at
    from public.cortex_workflows
    order by updated_at desc
  `)

  return result.rows.map(normalizeWorkflowRow)
}

export const upsertSupabaseWorkflows = async (workflows: CortexWorkflow[]) => {
  await ensureSupabaseWorkflowSchema()
  const client = await getSupabaseDatabasePool().connect()

  try {
    await client.query('begin')
    for (const workflow of workflows) {
      await client.query(
        `
          insert into public.cortex_workflows (
            id,
            title,
            description,
            tools_used,
            architecture,
            diagram_source,
            diagram_preview,
            zip_asset,
            accent,
            updated_at,
            synced_at
          )
          values ($1, $2, $3, $4::jsonb, $5, $6::jsonb, $7::jsonb, $8::jsonb, $9, $10::timestamptz, now())
          on conflict (id) do update set
            title = excluded.title,
            description = excluded.description,
            tools_used = excluded.tools_used,
            architecture = excluded.architecture,
            diagram_source = excluded.diagram_source,
            diagram_preview = excluded.diagram_preview,
            zip_asset = excluded.zip_asset,
            accent = excluded.accent,
            updated_at = excluded.updated_at,
            synced_at = now()
        `,
        [
          workflow.id,
          workflow.title,
          workflow.description,
          JSON.stringify(workflow.toolsUsed),
          workflow.architecture,
          JSON.stringify(workflow.diagramSource),
          JSON.stringify(workflow.diagramPreview),
          workflow.zipAsset ? JSON.stringify(workflow.zipAsset) : null,
          workflow.accent,
          workflow.updatedAt,
        ],
      )
    }
    await client.query('commit')
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    client.release()
  }
}

export const deleteSupabaseWorkflow = async (workflowId: string) => {
  await ensureSupabaseWorkflowSchema()
  await getSupabaseDatabasePool().query(
    'delete from public.cortex_workflows where id = $1',
    [workflowId],
  )
}

export const writeSupabaseConnectionCheck = async (
  metadata: Record<string, unknown> = {},
) => {
  const client = await getSupabaseDatabasePool().connect()

  try {
    await client.query(`
      create table if not exists public.cortex_connection_checks (
        id bigint generated by default as identity primary key,
        checked_at timestamptz not null default now(),
        source text not null,
        metadata jsonb not null default '{}'::jsonb
      )
    `)

    const result = await client.query<{
      id: string
      checked_at: string
      source: string
    }>(
      `
        insert into public.cortex_connection_checks (source, metadata)
        values ($1, $2::jsonb)
        returning id::text, checked_at::text, source
      `,
      ['the-cortex', JSON.stringify(metadata)],
    )

    return result.rows[0]
  } finally {
    client.release()
  }
}
