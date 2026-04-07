import { contextBridge, ipcRenderer } from 'electron'
import type {
  CortexBridge,
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
  createToolVoiceResponse: (payload) =>
    ipcRenderer.invoke('cortex:createToolVoiceResponse', payload),
  synthesizeSpeech: (payload) => ipcRenderer.invoke('cortex:synthesizeSpeech', payload),
  recordRealtimeLog: (entry) => ipcRenderer.invoke('cortex:recordRealtimeLog', entry),
  subscribeToEvents: (listener) => {
    const wrapped = (_event: Electron.IpcRendererEvent, payload: CortexStreamEvent) =>
      listener(payload)

    ipcRenderer.on('cortex:event', wrapped)
    return () => {
      ipcRenderer.removeListener('cortex:event', wrapped)
    }
  },
}

contextBridge.exposeInMainWorld('cortexApi', cortexApi)
