import { execSync } from 'child_process'

// ── DDC/CI (external monitors via physical hardware protocol) ─────────
let ddcci: any = null

function loadDdcci(): boolean {
  try {
    ddcci = require('node-ddcci')
    return true
  } catch {
    console.warn('[Brightness] node-ddcci unavailable, using WMI fallback only')
    return false
  }
}

// ── WMI / PowerShell (internal/laptop displays) ───────────────────────
function setWmiBrightness(level: number): void {
  const clamped = Math.round(Math.max(0, Math.min(100, level)))
  const ps = `$m = Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods; if ($m) { $m.WmiSetBrightness(0, ${clamped}) }`
  try {
    execSync(`powershell -NoProfile -NonInteractive -Command "${ps}"`, {
      windowsHide: true,
      timeout: 3000
    })
  } catch (err) {
    console.error('[Brightness] WMI set failed:', err)
  }
}

function getWmiBrightness(): number {
  try {
    const ps = `(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightness).CurrentBrightness`
    const result = execSync(`powershell -NoProfile -NonInteractive -Command "${ps}"`, {
      windowsHide: true,
      timeout: 3000
    }).toString().trim()
    const val = parseInt(result, 10)
    return isNaN(val) ? 50 : val
  } catch {
    return 50
  }
}

// ── DDC/CI helpers ─────────────────────────────────────────────────────
function getDdcciMonitors(): string[] {
  if (!ddcci) return []
  try {
    return ddcci.getMonitorList() as string[]
  } catch {
    return []
  }
}

function setDdcciBrightness(level: number): boolean {
  const monitors = getDdcciMonitors()
  if (monitors.length === 0) return false
  const clamped = Math.round(Math.max(0, Math.min(100, level)))
  let anySuccess = false
  for (const monitor of monitors) {
    try {
      ddcci.setVCP(monitor, 0x10, clamped) // VCP code 0x10 = Brightness
      anySuccess = true
    } catch {
      // This monitor may not support DDC/CI — continue to next
    }
  }
  return anySuccess
}

// ── Public API ─────────────────────────────────────────────────────────
let ddcciAvailable = false

export function initBrightnessCtrl(): void {
  ddcciAvailable = loadDdcci()
  console.log(`[Brightness] DDC/CI available: ${ddcciAvailable}`)
  console.log(`[Brightness] Current WMI brightness: ${getWmiBrightness()}%`)
}

export function setBrightness(level: number): void {
  const clamped = Math.round(Math.max(0, Math.min(100, level)))

  // Try DDC/CI first (works for external monitors)
  if (ddcciAvailable) {
    const ok = setDdcciBrightness(clamped)
    if (ok) return
  }

  // Fallback: WMI for internal/laptop displays
  setWmiBrightness(clamped)
}

export function getBrightness(): number {
  return getWmiBrightness()
}
