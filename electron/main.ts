import { app, BrowserWindow, ipcMain, session } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createCortexRuntime } from './cortex-runtime'
import type { CortexStreamEvent } from '../src/shared/cortex'
import type {
  CortexAudioTranscriptionRequest,
  CortexRealtimeLogEntry,
  CortexSpeechSynthesisRequest,
  CortexRealtimeSessionRequest,
  CortexToolVoiceResponseRequest,
} from '../src/shared/cortex'
import {
  attachMediaPermissionHandlers,
  createRealtimeCallAnswer,
} from './realtime-session'
import {
  createToolVoiceResponse,
  synthesizeSpeech,
  transcribeAudioInput,
} from './tool-voice-openai'
import { loadProjectEnv } from './load-project-env'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')

if (process.env.VITE_DEV_SERVER_URL) {
  const sessionId = process.env.CORTEX_DEV_SESSION_ID?.trim() || 'default'
  app.setPath('userData', path.join(projectRoot, '.vite-electron', 'user-data', sessionId))
}

loadProjectEnv(projectRoot)
const runtime = createCortexRuntime(projectRoot)
const unsubscribe = runtime.subscribeToEvents((event: CortexStreamEvent) => {
  BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents.send('cortex:event', event)
  })
})

const createWindow = async () => {
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

  if (process.env.VITE_DEV_SERVER_URL) {
    await window.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    await window.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(async () => {
  attachMediaPermissionHandlers(session.defaultSession)

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

  await createWindow()

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  unsubscribe()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
