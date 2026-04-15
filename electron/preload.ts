import { contextBridge, ipcRenderer } from 'electron'
import type {
  CortexBridge,
  CortexRealtimeDebugEntry,
  CortexStreamEvent,
} from '../src/shared/cortex'

const cortexApi: CortexBridge = {
  getDashboardSnapshot: () => ipcRenderer.invoke('cortex:getDashboardSnapshot'),
  listAgents: () => ipcRenderer.invoke('cortex:listAgents'),
  listMemories: () => ipcRenderer.invoke('cortex:listMemories'),
  listSchedules: () => ipcRenderer.invoke('cortex:listSchedules'),
  listLogs: () => ipcRenderer.invoke('cortex:listLogs'),
  runCommand: (commandId, context) =>
    ipcRenderer.invoke('cortex:runCommand', commandId, context),
  createRealtimeCall: (offerSdp, payload) =>
    ipcRenderer.invoke('cortex:createRealtimeCall', offerSdp, payload),
  transcribeAudio: (payload) => ipcRenderer.invoke('cortex:transcribeAudio', payload),
  createRealtimeTranscriptionToken: (payload) =>
    ipcRenderer.invoke('cortex:createRealtimeTranscriptionToken', payload),
  createToolVoiceResponse: (payload) =>
    ipcRenderer.invoke('cortex:createToolVoiceResponse', payload),
  synthesizeSpeech: (payload) => ipcRenderer.invoke('cortex:synthesizeSpeech', payload),
  abortVoiceTurn: (payload) => ipcRenderer.invoke('cortex:abortVoiceTurn', payload),
  recordRealtimeLog: (entry) => ipcRenderer.invoke('cortex:recordRealtimeLog', entry),
  getRealtimeDebugEntries: () => ipcRenderer.invoke('cortex:getRealtimeDebugEntries'),
  recordRealtimeDebug: (entry) => ipcRenderer.invoke('cortex:recordRealtimeDebug', entry),
  subscribeToEvents: (listener) => {
    const wrapped = (_event: Electron.IpcRendererEvent, payload: CortexStreamEvent) =>
      listener(payload)

    ipcRenderer.on('cortex:event', wrapped)
    return () => {
      ipcRenderer.removeListener('cortex:event', wrapped)
    }
  },
  subscribeToRealtimeDebug: (listener) => {
    const wrapped = (_event: Electron.IpcRendererEvent, payload: CortexRealtimeDebugEntry) =>
      listener(payload)

    ipcRenderer.on('cortex:realtime-debug', wrapped)
    return () => {
      ipcRenderer.removeListener('cortex:realtime-debug', wrapped)
    }
  },
}

contextBridge.exposeInMainWorld('cortexApi', cortexApi)
