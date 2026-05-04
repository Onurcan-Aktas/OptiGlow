import { dialog, shell, app } from 'electron'
import * as path from 'path'
import * as fs from 'fs'

const FLAG_PATH = path.join(app.getPath('userData'), '.first-run-complete')

export function isFirstRun(): boolean {
  return !fs.existsSync(FLAG_PATH)
}

export function markFirstRunComplete(): void {
  fs.writeFileSync(FLAG_PATH, '1', 'utf-8')
}

export async function showFirstRunDialog(): Promise<void> {
  const { response } = await dialog.showMessageBox({
    type:    'info',
    title:   'Welcome to OptiGlow',
    message: 'OptiGlow needs two permissions to work:',
    detail: [
      '1. Screen Recording — to read pixel brightness from your display.',
      '2. Monitor Control (WMI/DDC) — to adjust hardware brightness.',
      '',
      'Both requests will appear shortly. Please click Allow / Yes on each.',
      '',
      'OptiGlow never records, stores, or transmits your screen content.',
    ].join('\n'),
    buttons:   ['Get Started', 'Quit'],
    defaultId: 0,
    cancelId:  1,
    noLink:    true,
  })

  if (response === 1) {
    app.quit()
  }
}
