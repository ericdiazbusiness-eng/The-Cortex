const { spawn } = require('node:child_process')
const path = require('node:path')

const stripWindowsDevicePrefix = (value) =>
  process.platform === 'win32' && value.startsWith('\\\\?\\')
    ? value.slice(4)
    : value

const resolveRoot = () =>
  stripWindowsDevicePrefix(process.env.INIT_CWD || process.cwd())

const runCommand = (cwd, binPath, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [binPath, ...args], {
      cwd,
      stdio: 'inherit',
      shell: false,
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(`Command failed with exit code ${code ?? 1}`))
    })

    child.on('error', reject)
  })

const runners = {
  async dev(root) {
    await runCommand(root, path.join(root, 'node_modules', 'vite', 'bin', 'vite.js'), [])
  },
  async build(root) {
    await runCommand(root, path.join(root, 'node_modules', 'typescript', 'bin', 'tsc'), ['-b'])
    await runCommand(root, path.join(root, 'node_modules', 'vite', 'bin', 'vite.js'), ['build'])
  },
  async typecheck(root) {
    await runCommand(root, path.join(root, 'node_modules', 'typescript', 'bin', 'tsc'), ['-b'])
  },
  async lint(root) {
    await runCommand(root, path.join(root, 'node_modules', 'eslint', 'bin', 'eslint.js'), ['.'])
  },
  async preview(root) {
    await runCommand(root, path.join(root, 'node_modules', 'vite', 'bin', 'vite.js'), ['preview'])
  },
  async test(root) {
    await runCommand(root, path.join(root, 'node_modules', 'vitest', 'vitest.mjs'), ['run'])
  },
}

exports.run = async (task) => {
  const root = resolveRoot()
  const runner = runners[task]

  if (!runner) {
    throw new Error(`Unknown task: ${task}`)
  }

  try {
    await runner(root)
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}
