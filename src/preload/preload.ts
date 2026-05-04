import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('optiglow', {

  // ── Settings ───────────────────────────────────────────────────────
  getSettings: () =>
    ipcRenderer.invoke('settings:get'),

  setSetting: (key: string, value: unknown) =>
    ipcRenderer.invoke('settings:set', key, value),

  // ── Engine status ──────────────────────────────────────────────────
  getEngineStatus: () =>
    ipcRenderer.invoke('engine:status'),

  // ── App info ───────────────────────────────────────────────────────
  getVersion: () =>
    ipcRenderer.invoke('app:version'),

  // ── Window controls ────────────────────────────────────────────────
  minimizeWindow: () =>
    ipcRenderer.send('window:minimize'),

  closeWindow: () =>
    ipcRenderer.send('window:close'),
})

export {}
