interface OptiGlowSettings {
  brightScreenBrightness: number
  darkScreenBrightness:   number
  autoStart:              boolean
  engineEnabled:          boolean
  transitionSpeed:        number
}

interface OptiGlowStatus {
  running:           boolean
  currentBrightness: number
  targetBrightness:  number
  lastLuminance:     number   // 0-100
}

interface OptiGlowAPI {
  getSettings:     ()                            => Promise<OptiGlowSettings>
  setSetting:      (key: string, value: unknown) => Promise<OptiGlowSettings>
  getEngineStatus: ()                            => Promise<OptiGlowStatus>
  getVersion:      ()                            => Promise<string>
  minimizeWindow:  ()                            => void
  closeWindow:     ()                            => void
}

declare global {
  interface Window {
    optiglow: OptiGlowAPI
  }
}

export {}
