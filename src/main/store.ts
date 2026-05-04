import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

export interface AppSettings {
  brightScreenBrightness: number   // 0-100: monitor brightness when screen content is bright
  darkScreenBrightness: number     // 0-100: monitor brightness when screen content is dark
  autoStart: boolean               // run on Windows boot
  engineEnabled: boolean           // master on/off for dynamic adjustment
  transitionSpeed: number          // ms per step in smooth transition (lower = faster)
}

const DEFAULTS: AppSettings = {
  brightScreenBrightness: 30,
  darkScreenBrightness: 80,
  autoStart: true,
  engineEnabled: true,
  transitionSpeed: 50
}

const SETTINGS_PATH = path.join(app.getPath('userData'), 'settings.json')

function load(): AppSettings {
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      const raw = fs.readFileSync(SETTINGS_PATH, 'utf-8')
      return { ...DEFAULTS, ...JSON.parse(raw) }
    }
  } catch {
    // Corrupted file — fall back to defaults
  }
  return { ...DEFAULTS }
}

function save(settings: AppSettings): void {
  try {
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf-8')
  } catch (err) {
    console.error('[Store] Failed to save settings:', err)
  }
}

// In-memory singleton — loaded once at startup
let _settings: AppSettings = load()

export const store = {
  get(): AppSettings {
    return { ..._settings }
  },

  set<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    _settings[key] = value
    save(_settings)
  },

  setAll(partial: Partial<AppSettings>): void {
    _settings = { ..._settings, ...partial }
    save(_settings)
  }
}
