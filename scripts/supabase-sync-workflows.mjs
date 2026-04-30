import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import pg from 'pg'

const { Pool } = pg

const projectRoot = process.cwd()

const stripWrappingQuotes = (value) => {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }

  return value
}

const loadEnvFile = (fileName) => {
  const envPath = path.resolve(projectRoot, fileName)
  if (!existsSync(envPath)) {
    return
  }

  for (const rawLine of readFileSync(envPath, 'utf8').split(/\r?\n/u)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) {
      continue
    }

    const separatorIndex = line.indexOf('=')
    if (separatorIndex < 1) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    const value = stripWrappingQuotes(line.slice(separatorIndex + 1).trim())
    if (key && !process.env[key]) {
      process.env[key] = value
    }
  }
}

const readJson = (fileName) =>
  JSON.parse(readFileSync(path.resolve(projectRoot, fileName), 'utf8'))

loadEnvFile('.env.local')
loadEnvFile('.env')

const connectionString = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('SUPABASE_DATABASE_URL is not configured.')
}

const workflows = readJson('fixtures/workflows.json')
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 1,
})

try {
  const client = await pool.connect()
  try {
    await client.query('begin')
    await client.query(`
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
    `)
    await client.query(`
      create index if not exists cortex_workflows_updated_at_idx
      on public.cortex_workflows (updated_at desc)
    `)

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

    const count = await client.query('select count(*)::int as count from public.cortex_workflows')
    await client.query('commit')
    console.log(
      JSON.stringify(
        {
          ok: true,
          synced: workflows.length,
          total: count.rows[0].count,
        },
        null,
        2,
      ),
    )
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    client.release()
  }
} finally {
  await pool.end()
}
