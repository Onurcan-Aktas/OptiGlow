import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Slider } from './components/Slider'
import { Toggle } from './components/Toggle'

interface Settings {
  brightScreenBrightness: number
  darkScreenBrightness:   number
  autoStart:              boolean
  engineEnabled:          boolean
  transitionSpeed:        number
}

interface EngineStatus {
  running:           boolean
  currentBrightness: number
  targetBrightness:  number
  lastLuminance:     number
}

function luminanceColor(lum: number): string {
  if (lum < 30) return '#60a5fa'
  if (lum < 60) return '#a78bfa'
  return '#fbbf24'
}

function LuminanceLabel(lum: number): string {
  if (lum < 30) return 'Dark content'
  if (lum < 60) return 'Mixed content'
  return 'Bright content'
}

const S: Record<string, React.CSSProperties> = {
  root: {
    display:         'flex',
    flexDirection:   'column',
    height:          '100vh',
    backgroundColor: '#141414',
    color:           '#f0f0f0',
    overflow:        'hidden',
    fontFamily:      "-apple-system, 'Segoe UI', system-ui, sans-serif",
  },
  titlebar: {
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'space-between',
    padding:         '10px 16px',
    backgroundColor: '#141414',
    borderBottom:    '1px solid #222',
    // @ts-ignore
    WebkitAppRegion: 'drag',
    flexShrink:      0,
  },
  titleLeft: {
    display:    'flex',
    alignItems: 'center',
    gap:        '8px',
  },
  logo: {
    width:           '22px',
    height:          '22px',
    borderRadius:    '50%',
    backgroundColor: '#7c6af7',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    fontSize:        '9px',
    fontWeight:      700,
    color:           '#fff',
    flexShrink:      0,
  },
  titleText: {
    fontSize:    '13px',
    fontWeight:  600,
    letterSpacing: '0.02em',
    color:       '#fff',
  },
  version: {
    fontSize:    '10px',
    color:       '#444',
    fontFamily:  'monospace',
  },
  winButtons: {
    display:    'flex',
    gap:        '6px',
    // @ts-ignore
    WebkitAppRegion: 'no-drag',
  },
  winBtn: {
    width:           '18px',
    height:          '18px',
    borderRadius:    '50%',
    backgroundColor: '#2a2a2a',
    border:          'none',
    cursor:          'pointer',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    fontSize:        '9px',
    color:           '#888',
    transition:      'background-color 0.15s',
    padding:         0,
  },
  scroll: {
    flex:        1,
    overflowY:   'auto',
    padding:     '14px 14px',
    display:     'flex',
    flexDirection: 'column',
    gap:         '10px',
  },
  card: {
    padding:         '14px 16px',
    borderRadius:    '12px',
    backgroundColor: '#1e1e1e',
    border:          '1px solid #2a2a2a',
  },
  cardAccent: {
    padding:         '14px 16px',
    borderRadius:    '12px',
    backgroundColor: 'rgba(124,106,247,0.08)',
    border:          '1px solid rgba(124,106,247,0.3)',
  },
  sectionLabel: {
    fontSize:      '10px',
    fontWeight:    600,
    color:         '#444',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    padding:       '2px 2px 0',
  },
  row: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  rowLeft: {
    display:    'flex',
    alignItems: 'center',
    gap:        '10px',
  },
  icon: { fontSize: '18px' },
  labelMain: {
    fontSize:   '13px',
    fontWeight: 600,
    color:      '#fff',
    margin:     0,
  },
  labelSub: {
    fontSize:  '11px',
    color:     '#888',
    margin:    0,
    marginTop: '2px',
  },
  footer: {
    padding:        '10px 16px',
    borderTop:      '1px solid #1e1e1e',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    flexShrink:     0,
  },
  footerText: {
    fontSize: '10px',
    color:    '#3a3a3a',
  },
  dot: (active: boolean): React.CSSProperties => ({
    display:         'inline-block',
    width:           '6px',
    height:          '6px',
    borderRadius:    '50%',
    backgroundColor: active ? '#7c6af7' : '#333',
    marginRight:     '5px',
    verticalAlign:   'middle',
  }),
}

export default function App() {
  const [settings,  setSettings]  = useState<Settings | null>(null)
  const [status,    setStatus]    = useState<EngineStatus | null>(null)
  const [version,   setVersion]   = useState('–')
  const [saving,    setSaving]    = useState(false)
  const statusTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Initial load ───────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const [s, v] = await Promise.all([
        window.optiglow.getSettings(),
        window.optiglow.getVersion(),
      ])
      setSettings(s)
      setVersion(v)
    }
    init()
  }, [])

  // ── Status polling every 600ms ─────────────────────────────────────
  useEffect(() => {
    async function poll() {
      const s = await window.optiglow.getEngineStatus()
      setStatus(s)
    }
    poll()
    statusTimer.current = setInterval(poll, 600)
    return () => { if (statusTimer.current) clearInterval(statusTimer.current) }
  }, [])

  const updateSetting = useCallback(async (key: keyof Settings, value: unknown) => {
    setSaving(true)
    const updated = await window.optiglow.setSetting(key, value)
    setSettings(updated)
    setTimeout(() => setSaving(false), 600)
  }, [])

  // ── Loading state ──────────────────────────────────────────────────
  if (!settings) {
    return (
      <div style={{ ...S.root, alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '50%',
          border: '2px solid #7c6af7', borderTopColor: 'transparent',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ fontSize: '12px', color: '#555' }}>Loading OptiGlow…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  const lum = status?.lastLuminance ?? 50
  const isActive = settings.engineEnabled && (status?.running ?? false)

  return (
    <div style={S.root}>

      {/* ── Titlebar ─────────────────────────────────────────────────── */}
      <div style={S.titlebar}>
        <div style={S.titleLeft}>
          <div style={S.logo}>OG</div>
          <span style={S.titleText}>OptiGlow</span>
          <span style={S.version}>v{version}</span>
        </div>
        <div style={S.winButtons}>
          <button
            style={S.winBtn}
            title="Minimise"
            onClick={() => window.optiglow.minimizeWindow()}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#3a3a3a')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#2a2a2a')}
          >–</button>
          <button
            style={S.winBtn}
            title="Hide to tray"
            onClick={() => window.optiglow.closeWindow()}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#7f1d1d')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#2a2a2a')}
          >✕</button>
        </div>
      </div>

      {/* ── Scrollable content ───────────────────────────────────────── */}
      <div style={S.scroll}>

        {/* Master toggle */}
        <div style={settings.engineEnabled ? S.cardAccent : S.card}>
          <div style={S.row}>
            <div style={S.rowLeft}>
              <span style={S.icon}>{settings.engineEnabled ? '⚡' : '⏸'}</span>
              <div>
                <p style={S.labelMain}>Adaptive Brightness</p>
                <p style={S.labelSub}>
                  {settings.engineEnabled
                    ? 'Monitoring screen in real-time'
                    : 'Paused — manual brightness active'}
                </p>
              </div>
            </div>
            <Toggle
              checked={settings.engineEnabled}
              onChange={val => updateSetting('engineEnabled', val)}
            />
          </div>
        </div>

        {/* Live status */}
        {status && (
          <div style={S.card}>
            <p style={{ ...S.sectionLabel, marginBottom: '10px' }}>Live Status</p>

            {/* Luminance bar */}
            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ fontSize: '11px', color: '#666' }}>
                  Screen Luminance — <span style={{ color: luminanceColor(lum) }}>{LuminanceLabel(lum)}</span>
                </span>
                <span style={{ fontSize: '11px', color: '#888', fontVariantNumeric: 'tabular-nums', fontFamily: 'monospace' }}>
                  {lum}%
                </span>
              </div>
              <div style={{ height: '6px', backgroundColor: '#222', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  height:          '100%',
                  width:           `${lum}%`,
                  backgroundColor: luminanceColor(lum),
                  borderRadius:    '3px',
                  transition:      'width 0.5s, background-color 0.5s',
                }} />
              </div>
            </div>

            {/* Brightness row */}
            <div style={S.row}>
              <span style={{ fontSize: '11px', color: '#666' }}>Monitor Brightness</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {status.currentBrightness !== status.targetBrightness && (
                  <span style={{ fontSize: '10px', color: '#555' }}>
                    → {status.targetBrightness}%
                  </span>
                )}
                <span style={{
                  fontSize:          '15px',
                  fontWeight:        700,
                  fontVariantNumeric:'tabular-nums',
                  color:             '#fff',
                }}>
                  {status.currentBrightness}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Brightness sliders */}
        <p style={S.sectionLabel}>Brightness Targets</p>

        <Slider
          label="Bright / White Screens"
          sublabel="Documents, browsers, white UIs"
          icon="☀️"
          value={settings.brightScreenBrightness}
          disabled={!settings.engineEnabled}
          onChange={val => updateSetting('brightScreenBrightness', val)}
        />

        <Slider
          label="Dark / Black Screens"
          sublabel="Video, dark mode apps, games"
          icon="🌙"
          value={settings.darkScreenBrightness}
          disabled={!settings.engineEnabled}
          onChange={val => updateSetting('darkScreenBrightness', val)}
        />

        {/* Transition speed */}
        <p style={S.sectionLabel}>Behaviour</p>

        <div style={S.card}>
          <div style={{ ...S.row, marginBottom: '12px' }}>
            <div style={S.rowLeft}>
              <span style={S.icon}>🎚</span>
              <div>
                <p style={S.labelMain}>Transition Speed</p>
                <p style={S.labelSub}>How quickly brightness fades</p>
              </div>
            </div>
            <span style={{ fontSize: '12px', color: '#7c6af7', fontWeight: 600 }}>
              {settings.transitionSpeed <= 30
                ? 'Fast'
                : settings.transitionSpeed <= 80
                  ? 'Normal'
                  : 'Slow'}
            </span>
          </div>

          {/* Speed slider */}
          <div style={{ position: 'relative', height: '20px', display: 'flex', alignItems: 'center' }}>
            <div style={{ position: 'absolute', width: '100%', height: '6px', borderRadius: '3px', backgroundColor: '#2a2a2a' }} />
            <div style={{
              position:        'absolute',
              width:           `${((settings.transitionSpeed - 20) / 180) * 100}%`,
              height:          '6px',
              borderRadius:    '3px',
              backgroundColor: '#7c6af7',
            }} />
            <input
              type="range" min={20} max={200} step={10}
              value={settings.transitionSpeed}
              onChange={e => updateSetting('transitionSpeed', Number(e.target.value))}
              style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, zIndex: 1, cursor: 'pointer', margin: 0 }}
            />
            <div style={{
              position:        'absolute',
              left:            `calc(${((settings.transitionSpeed - 20) / 180) * 100}% - 7px)`,
              width:           '14px',
              height:          '14px',
              borderRadius:    '50%',
              backgroundColor: '#fff',
              border:          '2px solid #7c6af7',
              pointerEvents:   'none',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
            <span style={{ fontSize: '10px', color: '#444' }}>Faster</span>
            <span style={{ fontSize: '10px', color: '#444' }}>Slower</span>
          </div>
        </div>

        {/* System */}
        <p style={S.sectionLabel}>System</p>

        <div style={S.card}>
          <div style={S.row}>
            <div style={S.rowLeft}>
              <span style={S.icon}>🚀</span>
              <div>
                <p style={S.labelMain}>Launch at Login</p>
                <p style={S.labelSub}>Start OptiGlow when Windows boots</p>
              </div>
            </div>
            <Toggle
              checked={settings.autoStart}
              onChange={val => updateSetting('autoStart', val)}
            />
          </div>
        </div>

        {/* Bottom padding */}
        <div style={{ height: '4px' }} />
      </div>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <div style={S.footer}>
        <span style={S.footerText}>
          {saving ? '💾 Saving…' : '✓ All changes saved'}
        </span>
        <span style={S.footerText}>
          <span style={S.dot(isActive)} />
          {isActive ? 'Active' : 'Paused'}
        </span>
      </div>

    </div>
  )
}
