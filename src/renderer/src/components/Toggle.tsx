import React from 'react'

interface ToggleProps {
  checked:   boolean
  onChange:  (val: boolean) => void
  disabled?: boolean
  size?:     'sm' | 'md'
}

export function Toggle({ checked, onChange, disabled = false, size = 'md' }: ToggleProps) {
  const isSmall = size === 'sm'

  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        position:        'relative',
        display:         'inline-flex',
        alignItems:      'center',
        borderRadius:    '9999px',
        border:          'none',
        cursor:          disabled ? 'not-allowed' : 'pointer',
        opacity:         disabled ? 0.4 : 1,
        width:           isSmall ? '32px' : '44px',
        height:          isSmall ? '16px' : '24px',
        backgroundColor: checked ? '#7c6af7' : '#333',
        transition:      'background-color 0.2s',
        flexShrink:      0,
        outline:         'none',
      }}
    >
      <span
        style={{
          display:         'inline-block',
          borderRadius:    '9999px',
          backgroundColor: '#fff',
          boxShadow:       '0 1px 3px rgba(0,0,0,0.4)',
          width:           isSmall ? '12px' : '16px',
          height:          isSmall ? '12px' : '16px',
          transform:       checked
            ? isSmall ? 'translateX(18px)' : 'translateX(22px)'
            : 'translateX(2px)',
          transition:      'transform 0.2s',
        }}
      />
    </button>
  )
}
