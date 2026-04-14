import { app, BrowserWindow, ipcMain, session } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createCortexRuntime } from './cortex-runtime'
import type { CortexStreamEvent } from '../src/shared/cortex'
import type {
  CortexAbortVoiceTurnRequest,
  CortexAudioTranscriptionRequest,
  CortexRealtimeDebugEntry,
  CortexRealtimeDebugEntryInput,
  CortexAbortVoiceTurnResult,
  CortexRealtimeLogEntry,
  CortexSpeechSynthesisRequest,
  CortexRealtimeSessionRequest,
  CortexToolVoiceResponseRequest,
} from '../src/shared/cortex'
import {
  attachMediaPermissionHandlers,
  createRealtimeCallAnswer,
  setRealtimeDebugReporter,
} from './realtime-session'
import {
  abortActiveVoiceTurn,
  createToolVoiceResponse,
  setToolVoiceDebugReporter,
  synthesizeSpeech,
  transcribeAudioInput,
} from './tool-voice-openai'
import { loadProjectEnv } from './load-project-env'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const MAX_REALTIME_DEBUG_ENTRIES = 400

let mainWindow: BrowserWindow | null = null
let realtimeDebugWindow: BrowserWindow | null = null
let realtimeDebugBuffer: CortexRealtimeDebugEntry[] = []

if (process.env.VITE_DEV_SERVER_URL) {
  const sessionId = process.env.CORTEX_DEV_SESSION_ID?.trim() || 'default'
  app.setPath('userData', path.join(projectRoot, '.vite-electron', 'user-data', sessionId))
}

loadProjectEnv(projectRoot)
const runtime = createCortexRuntime(projectRoot)

const isRealtimeDebugWindowEnabled = () =>
  process.env.CORTEX_REALTIME_DEBUG?.trim() === 'true' ||
  process.env.VITE_CORTEX_REALTIME_DEBUG?.trim() === 'true'

const broadcastRealtimeDebugEntry = (entry: CortexRealtimeDebugEntry) => {
  BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents.send('cortex:realtime-debug', entry)
  })
}

const recordRealtimeDebugEntry = (input: CortexRealtimeDebugEntryInput) => {
  const entry: CortexRealtimeDebugEntry = {
    id:
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `rt-debug-${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...input,
  }

  realtimeDebugBuffer = [entry, ...realtimeDebugBuffer].slice(0, MAX_REALTIME_DEBUG_ENTRIES)
  broadcastRealtimeDebugEntry(entry)
}

const isVoiceTurnAbortError = (error: unknown) =>
  error instanceof Error && error.message.startsWith('VOICE_TURN_ABORTED:')

const unsubscribe = runtime.subscribeToEvents((event: CortexStreamEvent) => {
  BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents.send('cortex:event', event)
  })
})

const createMainWindow = async () => {
  const window = new BrowserWindow({
    width: 1640,
    height: 1024,
    minWidth: 1180,
    minHeight: 760,
    backgroundColor: '#040813',
    autoHideMenuBar: true,
    title: 'The Cortex',
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow = window
  window.on('closed', () => {
    if (mainWindow === window) {
      mainWindow = null
    }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    await window.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    await window.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

const createRealtimeDebugWindow = async () => {
  const window = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#02060f',
    autoHideMenuBar: true,
    title: 'The Cortex Debug',
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  realtimeDebugWindow = window
  window.on('closed', () => {
    if (realtimeDebugWindow === window) {
      realtimeDebugWindow = null
    }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    await window.loadURL(`${process.env.VITE_DEV_SERVER_URL}#/debug`)
  } else {
    await window.loadFile(path.join(__dirname, '../dist/index.html'), {
      hash: 'debug',
    })
  }
}

app.whenReady().then(async () => {
  attachMediaPermissionHandlers(session.defaultSession)
  setRealtimeDebugReporter(recordRealtimeDebugEntry)
  setToolVoiceDebugReporter(recordRealtimeDebugEntry)

  ipcMain.handle('cortex:getDashboardSnapshot', () => runtime.getDashboardSnapshot())
  ipcMain.handle('cortex:listAgents', () => runtime.listAgents())
  ipcMain.handle('cortex:listMemories', () => runtime.listMemories())
  ipcMain.handle('cortex:listSchedules', () => runtime.listSchedules())
  ipcMain.handle('cortex:listLogs', () => runtime.listLogs())
  ipcMain.handle('cortex:runCommand', (_event, commandId: string, context?: string) =>
    runtime.runCommand(commandId, context),
  )
  ipcMain.handle(
    'cortex:createRealtimeCall',
    async (_event, offerSdp: string, payload: CortexRealtimeSessionRequest) => {
      try {
        return await createRealtimeCallAnswer(offerSdp, payload)
      } catch (error) {
        await runtime.recordRealtimeLog({
          channel: 'realtime',
          severity: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Realtime voice session failed to initialize.',
          accent: 'red',
        })
        throw error
      }
    },
  )
  ipcMain.handle('cortex:transcribeAudio', async (_event, payload: CortexAudioTranscriptionRequest) => {
    try {
      return await transcribeAudioInput(payload)
    } catch (error) {
      if (isVoiceTurnAbortError(error)) {
        throw error
      }
      await runtime.recordRealtimeLog({
        channel: 'realtime',
        severity: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Tool voice transcription failed to initialize.',
        accent: 'red',
      })
      throw error
    }
  })
  ipcMain.handle(
    'cortex:createToolVoiceResponse',
    async (_event, payload: CortexToolVoiceResponseRequest) => {
    try {
      return await createToolVoiceResponse(payload)
    } catch (error) {
      if (isVoiceTurnAbortError(error)) {
        throw error
      }
      await runtime.recordRealtimeLog({
        channel: 'realtime',
        severity: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Tool voice response generation failed.',
        accent: 'red',
      })
      throw error
    }
    },
  )
  ipcMain.handle('cortex:synthesizeSpeech', async (_event, payload: CortexSpeechSynthesisRequest) => {
    try {
      return await synthesizeSpeech(payload)
    } catch (error) {
      if (isVoiceTurnAbortError(error)) {
        throw error
      }
      await runtime.recordRealtimeLog({
        channel: 'realtime',
        severity: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Tool voice speech synthesis failed.',
        accent: 'red',
      })
      throw error
    }
  })
  ipcMain.handle('cortex:recordRealtimeLog', async (_event, entry: CortexRealtimeLogEntry) => {
    await runtime.recordRealtimeLog(entry)
  })
  ipcMain.handle(
    'cortex:abortVoiceTurn',
    async (_event, payload: CortexAbortVoiceTurnRequest): Promise<CortexAbortVoiceTurnResult> =>
      abortActiveVoiceTurn(payload),
  )
  ipcMain.handle('cortex:getRealtimeDebugEntries', async () => realtimeDebugBuffer)
  ipcMain.handle('cortex:recordRealtimeDebug', async (_event, entry: CortexRealtimeDebugEntryInput) => {
    recordRealtimeDebugEntry(entry)
  })

  await createMainWindow()
  if (isRealtimeDebugWindowEnabled()) {
    await createRealtimeDebugWindow()
  }

  app.on('activate', async () => {
    if (!mainWindow) {
      await createMainWindow()
    }

    if (isRealtimeDebugWindowEnabled() && !realtimeDebugWindow) {
      await createRealtimeDebugWindow()
    }
  })
})

app.on('window-all-closed', () => {
  setRealtimeDebugReporter(null)
  setToolVoiceDebugReporter(null)
  unsubscribe()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
