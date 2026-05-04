import { ipcMain, app, BrowserWindow } from 'electron'
import { store, AppSettings } from './store'
import { startEngine, stopEngine, getEngineStatus } from './captureEngine'

export function registerIpcHandlers(): void {

  // ── Settings: read all ───────────────────────────────────────────────
  ipcMain.handle('settings:get', () => {
    return store.get()
  })

  // ── Settings: write one key ──────────────────────────────────────────
  ipcMain.handle('settings:set', (_event, key: keyof AppSettings, value: any) => {
    store.set(key, value)

    // Side effects that need to happen immediately
    if (key === 'engineEnabled') {
      if (value) startEngine()
      else        stopEngine()
    }

    if (key === 'autoStart') {
      applyAutoStart(value)
    }

    return store.get()
  })

  // ── Engine status: live luminance + brightness readback ──────────────
  ipcMain.handle('engine:status', () => {
    return getEngineStatus()
  })

  // ── App version ──────────────────────────────────────────────────────
  ipcMain.handle('app:version', () => app.getVersion())

  // ── Window controls ──────────────────────────────────────────────────
  ipcMain.on('window:minimize', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize()
  })

  ipcMain.on('window:close', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.hide()
  })
}

// ── Auto-start helper ────────────────────────────────────────────────
export function applyAutoStart(enable: boolean): void {
  app.setLoginItemSettings({
    openAtLogin: enable,
    openAsHidden: true,
    name: 'OptiGlow'
  })
  console.log(`[AutoStart] openAtLogin set to: ${enable}`)
}
