// @vitest-environment node

import { __private__ } from './load-project-env'

describe('load-project-env helpers', () => {
  it('parses dotenv-style files and ignores comments', () => {
    const values = __private__.parseEnvContents(`
# comment
OPENAI_API_KEY=test-key
OPENAI_REALTIME_MODEL="gpt-realtime-1.5"
OPENAI_REALTIME_VOICE='marin'
`)

    expect(values).toEqual({
      OPENAI_API_KEY: 'test-key',
      OPENAI_REALTIME_MODEL: 'gpt-realtime-1.5',
      OPENAI_REALTIME_VOICE: 'marin',
    })
  })

  it('prefers development-specific env files when the dev server is active', () => {
    process.env.VITE_DEV_SERVER_URL = 'http://localhost:5173'

    expect(__private__.resolveEnvFiles()).toEqual([
      '.env.development.local',
      '.env.local',
      '.env.development',
      '.env',
    ])

    delete process.env.VITE_DEV_SERVER_URL
  })
})
