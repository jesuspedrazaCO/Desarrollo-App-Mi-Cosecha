import { forwardRef } from 'react'

const Select = forwardRef(function Select({ label, error, required, options = [], placeholder, className = '', ...props }, ref) {
  const style = {
    backgroundColor: error ? '#fef2f2' : 'rgba(255,255,255,0.88)',
    color: error ? '#991b1b' : '#1c1917',
    border: error ? '1px solid #fca5a5' : '1px solid rgba(200,200,200,0.55)',
    borderRadius: '14px',
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: '500',
    width: '100%',
    outline: 'none',
    appearance: 'none',
    WebkitAppearance: 'none',
    transition: 'all 0.2s',
    cursor: 'pointer',
  }

  return (
    <div className={className} style={{ position: 'relative' }}>
      {label && (
        <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
          {label} {required && <span style={{ color: '#fb923c' }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <select
          ref={ref}
          style={style}
          onFocus={e => { e.target.style.border = '1px solid rgba(37,138,78,0.7)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,138,78,0.18)' }}
          onBlur={e => { e.target.style.border = error ? '1px solid #fca5a5' : '1px solid rgba(200,200,200,0.55)'; e.target.style.boxShadow = 'none' }}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
          {props.children}
        </select>
        {/* Chevron */}
        <svg style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#6b7280', pointerEvents: 'none' }}
          fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {error && <p style={{ marginTop: '6px', fontSize: '11px', color: '#f87171' }}>{error}</p>}
    </div>
  )
})

export default Select
