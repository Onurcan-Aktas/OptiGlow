import React from 'react'

interface SliderProps {
  label:     string
  sublabel?: string
  value:     number
  min?:      number
  max?:      number
  icon:      string
  disabled?: boolean
  onChange:  (val: number) => void
}

export function Slider({
  label,
  sublabel,
  value,
  min = 0,
  max = 100,
  icon,
  disabled = false,
  onChange
}: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div style={{
      display:         'flex',
      flexDirection:   'column',
      gap:             '10px',
      padding:         '16px',
      borderRadius:    '12px',
      backgroundColor: '#1e1e1e',
      border:          '1px solid #2a2a2a',
      opacity:         disabled ? 0.4 : 1,
    }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>{icon}</span>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#fff', margin: 0 }}>{label}</p>
            {sublabel && (
              <p style={{ fontSize: '11px', color: '#888', margin: 0, marginTop: '2px' }}>{sublabel}</p>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
          <span style={{ fontSize: '18px', fontWeight: 700, color: '#7c6af7', fontVariantNumeric: 'tabular-nums' }}>
            {value}
          </span>
          <span style={{ fontSize: '11px', color: '#555' }}>%</span>
        </div>
      </div>

      {/* Slider */}
      <div style={{ position: 'relative', height: '20px', display: 'flex', alignItems: 'center' }}>
        {/* BG track */}
        <div style={{
          position:        'absolute',
          width:           '100%',
          height:          '6px',
          borderRadius:    '3px',
          backgroundColor: '#2a2a2a',
        }} />
        {/* Fill track */}
        <div style={{
          position:        'absolute',
          width:           `${pct}%`,
          height:          '6px',
          borderRadius:    '3px',
          backgroundColor: '#7c6af7',
          transition:      'width 0.05s',
        }} />
        {/* Native range (invisible, interactive) */}
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          disabled={disabled}
          onChange={e => onChange(Number(e.target.value))}
          style={{
            position: 'absolute',
            width:    '100%',
            height:   '100%',
            opacity:  0,
            zIndex:   1,
            cursor:   disabled ? 'not-allowed' : 'pointer',
            margin:   0,
          }}
        />
        {/* Custom thumb */}
        <div style={{
          position:        'absolute',
          left:            `calc(${pct}% - 7px)`,
          width:           '14px',
          height:          '14px',
          borderRadius:    '50%',
          backgroundColor: '#fff',
          border:          '2px solid #7c6af7',
          boxShadow:       '0 1px 4px rgba(0,0,0,0.5)',
          transition:      'left 0.05s',
          pointerEvents:   'none',
        }} />
      </div>
    </div>
  )
}
