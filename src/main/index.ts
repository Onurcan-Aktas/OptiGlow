import {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage
} from 'electron'
import * as path from 'path'
import { store } from './store'
import { initBrightnessCtrl } from './brightnessCtrl'
import { startEngine, stopEngine } from './captureEngine'
import { registerIpcHandlers, applyAutoStart } from './ipcHandlers'
import { isFirstRun, markFirstRunComplete, showFirstRunDialog } from './firstRun'

// ── Paths ──────────────────────────────────────────────────────────────
const ICON_PATH = path.join(__dirname, '../../resources/icon.ico')
const isDev     = !app.isPackaged

// ── Globals ────────────────────────────────────────────────────────────
let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

// ── Extend app type for custom flag ────────────────────────────────────
declare module 'electron' {
  interface App { isQuitting: boolean }
}
app.isQuitting = false

// ── Single Instance Lock ───────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

// ── Create Main Window ─────────────────────────────────────────────────
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width:           420,
    height:          580,
    minWidth:        380,
    minHeight:       520,
    resizable:       true,
    frame:           false,
    transparent:     false,
    backgroundColor: '#141414',
    icon:            ICON_PATH,
    show:            false,
    webPreferences: {
      preload:          path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
      sandbox:          false
    }
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    const launchedAsHidden = process.argv.includes('--hidden')
    if (!launchedAsHidden) {
      mainWindow?.show()
    }
  })

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ── Create System Tray ─────────────────────────────────────────────────
function createTray(): void {
  let icon: Electron.NativeImage
  try {
    icon = nativeImage.createFromPath(ICON_PATH)
    if (icon.isEmpty()) throw new Error('empty')
  } catch {
    // Fallback: create a simple colored icon programmatically
    icon = nativeImage.createEmpty()
  }

  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon.resize({ width: 16, height: 16 }))
  tray.setToolTip('OptiGlow — Adaptive Brightness')
  updateTrayMenu()

  tray.on('click', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow?.show()
      mainWindow?.focus()
    }
  })
}

// ── Tray Context Menu ──────────────────────────────────────────────────
function updateTrayMenu(): void {
  if (!tray) return
  const settings = store.get()

  const contextMenu = Menu.buildFromTemplate([
    {
      label:   'OptiGlow',
      enabled: false
    },
    { type: 'separator' },
    {
      label: settings.engineEnabled ? '⏸  Pause Adjustment' : '▶  Resume Adjustment',
      click: () => {
        const next = !settings.engineEnabled
        store.set('engineEnabled', next)
        if (next) startEngine()
        else       stopEngine()
        updateTrayMenu()
      }
    },
    { type: 'separator' },
    {
      label: '🪟  Open OptiGlow',
      click: () => {
        mainWindow?.show()
        mainWindow?.focus()
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true
        stopEngine()
        app.quit()
      }
    }
  ])

  tray.setContextMenu(contextMenu)
}

// ── App Ready ──────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  // 1. Register all IPC handlers before any window loads
  registerIpcHandlers()

  // 2. Initialise brightness hardware layer
  initBrightnessCtrl()

  // 3. First run welcome dialog
  if (isFirstRun()) {
    await showFirstRunDialog()
    markFirstRunComplete()
  }

  // 4. Apply auto-start setting
  const settings = store.get()
  applyAutoStart(settings.autoStart)

  // 5. Create UI window + tray
  createWindow()
  createTray()

  // 6. Start the engine if enabled
  if (settings.engineEnabled) {
    startEngine()
  }

  console.log('[App] OptiGlow ready ✓')
})

// ── macOS re-activate ──────────────────────────────────────────────────
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// ── Keep alive in tray ─────────────────────────────────────────────────
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' && !app.isQuitting) {
    // Keep the app running in the tray — do not quit
  }
})

// ── Clean shutdown ─────────────────────────────────────────────────────
app.on('before-quit', () => {
  app.isQuitting = true
  stopEngine()
})
