import { readFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import type { CortexUsageIndicator } from '../src/shared/cortex'

const ELEVENLABS_SUBSCRIPTION_URL = 'https://api.elevenlabs.io/v1/user/subscription'
const CODEX_USAGE_URL = 'https://chatgpt.com/backend-api/wham/usage'
const numberFormatter = new Intl.NumberFormat('en-US')

type CodexUsageWindow = {
  used_percent?: number
  reset_at?: number | string | null
}

type CodexUsageResponse = {
  plan_type?: string | null
  rate_limit?: {
    primary_window?: CodexUsageWindow | null
    secondary_window?: CodexUsageWindow | null
  } | null
}

type ElevenLabsSubscription = {
  character_count?: number
  character_limit?: number
  next_character_count_reset_unix?: number | null
}

const clampPercent = (value: number) => Math.max(0, Math.min(100, Math.round(value)))

const formatResetAt = (value: number | string | null | undefined) => {
  if (value == null || value === '') {
    return 'reset unknown'
  }

  const date =
    typeof value === 'number'
      ? new Date(value * 1000)
      : typeof value === 'string'
        ? new Date(value)
        : null

  if (!date || Number.isNaN(date.getTime())) {
    return 'reset unknown'
  }

  return `resets ${new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)}`
}

const makeUnavailableIndicator = (
  indicator: Pick<CortexUsageIndicator, 'id' | 'label' | 'symbol' | 'tone'>,
  detail: string,
): CortexUsageIndicator => ({
  ...indicator,
  detail,
  value: 0,
  source: 'unavailable',
  refreshedAt: new Date().toISOString(),
})

const buildCodexIndicator = (
  id: 'codex_session' | 'codex_weekly',
  label: string,
  symbol: string,
  tone: 'cyan' | 'green',
  window: CodexUsageWindow | null | undefined,
): CortexUsageIndicator => {
  const usedPercent = typeof window?.used_percent === 'number' ? window.used_percent : null
  if (usedPercent == null) {
    return makeUnavailableIndicator(
      { id, label, symbol, tone },
      'Codex usage window is unavailable right now.',
    )
  }

  const remainingPercent = clampPercent(100 - usedPercent)
  return {
    id,
    label,
    symbol,
    tone,
    value: remainingPercent,
    detail: `${remainingPercent}% remaining · ${formatResetAt(window?.reset_at)}`,
    source: 'live',
    refreshedAt: new Date().toISOString(),
  }
}

const parseCodexAuth = async () => {
  const authPath =
    process.env.CORTEX_CODEX_AUTH_PATH?.trim() || path.join(os.homedir(), '.codex', 'auth.json')
  const raw = await readFile(authPath, 'utf8')
  const auth = JSON.parse(raw) as {
    tokens?: {
      access_token?: string
      account_id?: string
    }
  }

  return {
    accessToken: auth.tokens?.access_token?.trim() || null,
    accountId: auth.tokens?.account_id?.trim() || null,
  }
}

const fetchElevenLabsIndicator = async (): Promise<CortexUsageIndicator> => {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim()
  if (!apiKey) {
    return makeUnavailableIndicator(
      { id: 'elevenlabs', label: 'ElevenLabs', symbol: 'E', tone: 'magenta' },
      'Set ELEVENLABS_API_KEY in .env.local to track characters remaining.',
    )
  }

  const response = await fetch(ELEVENLABS_SUBSCRIPTION_URL, {
    headers: {
      'xi-api-key': apiKey,
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`ElevenLabs usage request failed (${response.status}).`)
  }

  const subscription = (await response.json()) as ElevenLabsSubscription
  const characterLimit = Math.max(0, Number(subscription.character_limit ?? 0))
  const characterCount = Math.max(0, Number(subscription.character_count ?? 0))

  if (!characterLimit) {
    return makeUnavailableIndicator(
      { id: 'elevenlabs', label: 'ElevenLabs', symbol: 'E', tone: 'magenta' },
      'ElevenLabs returned no subscription limit for this account.',
    )
  }

  const remainingCharacters = Math.max(0, characterLimit - characterCount)
  const remainingPercent = clampPercent((remainingCharacters / characterLimit) * 100)

  return {
    id: 'elevenlabs',
    label: 'ElevenLabs',
    symbol: 'E',
    tone: 'magenta',
    value: remainingPercent,
    detail: `${numberFormatter.format(remainingCharacters)} / ${numberFormatter.format(characterLimit)} characters remaining · ${formatResetAt(subscription.next_character_count_reset_unix)}`,
    source: 'live',
    refreshedAt: new Date().toISOString(),
  }
}

const fetchCodexIndicators = async (): Promise<CortexUsageIndicator[]> => {
  const { accessToken, accountId } = await parseCodexAuth()
  if (!accessToken) {
    return [
      makeUnavailableIndicator(
        { id: 'codex_session', label: 'Codex Session', symbol: 'S', tone: 'cyan' },
        'Codex auth is missing. Sign in with Codex on this machine first.',
      ),
      makeUnavailableIndicator(
        { id: 'codex_weekly', label: 'Codex Weekly', symbol: 'W', tone: 'green' },
        'Codex auth is missing. Sign in with Codex on this machine first.',
      ),
    ]
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json',
    'User-Agent': 'codex-cli',
  }
  if (accountId) {
    headers['ChatGPT-Account-Id'] = accountId
  }

  const response = await fetch(process.env.CORTEX_CODEX_USAGE_URL?.trim() || CODEX_USAGE_URL, {
    headers,
  })

  if (!response.ok) {
    throw new Error(`Codex usage request failed (${response.status}).`)
  }

  const payload = (await response.json()) as CodexUsageResponse
  return [
    buildCodexIndicator('codex_session', 'Codex Session', 'S', 'cyan', payload.rate_limit?.primary_window),
    buildCodexIndicator('codex_weekly', 'Codex Weekly', 'W', 'green', payload.rate_limit?.secondary_window),
  ]
}

export const fetchOverviewUsageIndicators = async (): Promise<CortexUsageIndicator[]> => {
  const [elevenlabsResult, codexResult] = await Promise.allSettled([
    fetchElevenLabsIndicator(),
    fetchCodexIndicators(),
  ])

  const elevenlabsIndicator =
    elevenlabsResult.status === 'fulfilled'
      ? elevenlabsResult.value
      : makeUnavailableIndicator(
          { id: 'elevenlabs', label: 'ElevenLabs', symbol: 'E', tone: 'magenta' },
          elevenlabsResult.reason instanceof Error
            ? elevenlabsResult.reason.message
            : 'ElevenLabs usage is unavailable right now.',
        )

  const codexIndicators =
    codexResult.status === 'fulfilled'
      ? codexResult.value
      : [
          makeUnavailableIndicator(
            { id: 'codex_session', label: 'Codex Session', symbol: 'S', tone: 'cyan' },
            codexResult.reason instanceof Error
              ? codexResult.reason.message
              : 'Codex session usage is unavailable right now.',
          ),
          makeUnavailableIndicator(
            { id: 'codex_weekly', label: 'Codex Weekly', symbol: 'W', tone: 'green' },
            codexResult.reason instanceof Error
              ? codexResult.reason.message
              : 'Codex weekly usage is unavailable right now.',
          ),
        ]

  return [elevenlabsIndicator, ...codexIndicators]
}
