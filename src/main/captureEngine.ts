import { desktopCapturer, screen } from 'electron'
import { store } from './store'
import { setBrightness, getBrightness } from './brightnessCtrl'

// ── Constants ──────────────────────────────────────────────────────────
const CAPTURE_INTERVAL_MS      = 500   // How often we sample the screen
const THUMBNAIL_WIDTH          = 320   // Low-res capture for performance
const THUMBNAIL_HEIGHT         = 180
const LUMINANCE_HIGH_THRESHOLD = 0.65  // Above this → "bright screen"
const LUMINANCE_LOW_THRESHOLD  = 0.35  // Below this → "dark screen"

// ── State ──────────────────────────────────────────────────────────────
let captureLoop: ReturnType<typeof setInterval> | null = null
let currentBrightness = 50
let targetBrightness  = 50
let transitionLoop: ReturnType<typeof setInterval> | null = null
let lastLuminance = 0.5

// ── Luminance Calculator ───────────────────────────────────────────────
// Takes raw RGBA pixel buffer, returns average perceptual luminance 0.0–1.0
function calcLuminance(buffer: Buffer, width: number, height: number): number {
  const totalPixels = width * height
  if (totalPixels === 0) return 0.5

  let luminanceSum = 0

  for (let i = 0; i < buffer.length; i += 4) {
    const r = buffer[i]     / 255
    const g = buffer[i + 1] / 255
    const b = buffer[i + 2] / 255

    // Linearize sRGB channels
    const rLin = r <= 0.04045 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4)
    const gLin = g <= 0.04045 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4)
    const bLin = b <= 0.04045 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4)

    // ITU-R BT.709 coefficients — human eye luminance perception
    luminanceSum += 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin
  }

  return luminanceSum / totalPixels
}

// ── Smooth Brightness Transition ──────────────────────────────────────
function startTransition(target: number): void {
  targetBrightness = Math.round(Math.max(0, Math.min(100, target)))

  if (transitionLoop) return  // Already running — just update the target

  const settings = store.get()
  const stepIntervalMs = settings.transitionSpeed

  transitionLoop = setInterval(() => {
    if (currentBrightness === targetBrightness) {
      clearInterval(transitionLoop!)
      transitionLoop = null
      return
    }

    const diff = targetBrightness - currentBrightness
    const step = diff > 0 ? Math.min(2, diff) : Math.max(-2, diff)

    currentBrightness += step
    setBrightness(currentBrightness)
  }, stepIntervalMs)
}

// ── Core Capture + Analysis Tick ──────────────────────────────────────
async function tick(): Promise<void> {
  const settings = store.get()
  if (!settings.engineEnabled) return

  try {
    // Grab primary display source
    const primaryDisplay = screen.getPrimaryDisplay()
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: {
        width:  THUMBNAIL_WIDTH,
        height: THUMBNAIL_HEIGHT
      }
    })

    const primary = sources.find(s =>
      s.display_id === String(primaryDisplay.id)
    ) ?? sources[0]

    if (!primary) return

    // thumbnail is a NativeImage — get raw RGBA buffer
    const bitmap = primary.thumbnail
    const size   = bitmap.getSize()
    const buffer = bitmap.getBitmap()  // raw RGBA

    const luminance = calcLuminance(buffer, size.width, size.height)
    lastLuminance = luminance

    // Decide target brightness based on luminance thresholds
    let newTarget: number

    if (luminance >= LUMINANCE_HIGH_THRESHOLD) {
      newTarget = settings.brightScreenBrightness  // Screen is bright → dim monitor
    } else if (luminance <= LUMINANCE_LOW_THRESHOLD) {
      newTarget = settings.darkScreenBrightness    // Screen is dark → brighten monitor
    } else {
      // Mid-range: interpolate linearly between the two user settings
      const t = (luminance - LUMINANCE_LOW_THRESHOLD) /
                (LUMINANCE_HIGH_THRESHOLD - LUMINANCE_LOW_THRESHOLD)
      newTarget = Math.round(
        settings.darkScreenBrightness +
        t * (settings.brightScreenBrightness - settings.darkScreenBrightness)
      )
    }

    // Only trigger a transition if target changed meaningfully (±2 avoids jitter)
    if (Math.abs(newTarget - targetBrightness) >= 2) {
      startTransition(newTarget)
    }

  } catch (err) {
    console.error('[CaptureEngine] Tick error:', err)
  }
}

// ── Public API ─────────────────────────────────────────────────────────
export function startEngine(): void {
  if (captureLoop) return
  currentBrightness = getBrightness()
  targetBrightness  = currentBrightness
  captureLoop = setInterval(tick, CAPTURE_INTERVAL_MS)
  console.log('[CaptureEngine] Started')
}

export function stopEngine(): void {
  if (captureLoop) {
    clearInterval(captureLoop)
    captureLoop = null
  }
  if (transitionLoop) {
    clearInterval(transitionLoop)
    transitionLoop = null
  }
  console.log('[CaptureEngine] Stopped')
}

export function getEngineStatus() {
  return {
    running:          captureLoop !== null,
    currentBrightness,
    targetBrightness,
    lastLuminance:    Math.round(lastLuminance * 100)  // 0-100 for UI display
  }
}
