import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'
import { defineConfig } from 'vitest/config'

const rootDir = fileURLToPath(new URL('.', import.meta.url))
const devArgv = ['.', '--no-sandbox']

export default defineConfig(() => {
  const isTest =
    process.env.VITEST === 'true' ||
    process.env.NODE_ENV === 'test' ||
    process.argv.some((arg) => arg.toLowerCase().includes('vitest'))

  return {
    resolve: {
      alias: {
        '@': path.resolve(rootDir, 'src'),
      },
    },
    plugins: [
      react(),
      ...(isTest
        ? []
        : [
            electron({
              main: {
                entry: 'electron/main.ts',
                async onstart({ startup }) {
                  await startup(devArgv, {
                    cwd: rootDir,
                    env: {
                      ...process.env,
                      CORTEX_DEV_SESSION_ID: String(process.pid),
                    },
                  })
                },
              },
              preload: {
                input: 'electron/preload.ts',
              },
            }),
          ]),
    ],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
    },
  }
})
