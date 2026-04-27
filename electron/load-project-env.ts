import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const resolveEnvFiles = () => {
  const mode =
    process.env.VITE_DEV_SERVER_URL?.trim()
      ? 'development'
      : process.env.NODE_ENV?.trim() || null

  const files = ['.env.local', '.env']

  if (!mode) {
    return files
  }

  return [`.env.${mode}.local`, '.env.local', `.env.${mode}`, '.env']
}

const stripWrappingQuotes = (value: string) => {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }

  return value
}

const parseEnvContents = (contents: string) => {
  const values: Record<string, string> = {}

  for (const rawLine of contents.split(/\r?\n/u)) {
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

    if (key) {
      values[key] = value
    }
  }

  return values
}

export const loadProjectEnv = (projectRoot: string) => {
  for (const fileName of resolveEnvFiles()) {
    const envPath = path.resolve(projectRoot, fileName)
    if (!existsSync(envPath)) {
      continue
    }

    const values = parseEnvContents(readFileSync(envPath, 'utf8'))
    for (const [key, value] of Object.entries(values)) {
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  }
}

export const __private__ = {
  parseEnvContents,
  resolveEnvFiles,
}
