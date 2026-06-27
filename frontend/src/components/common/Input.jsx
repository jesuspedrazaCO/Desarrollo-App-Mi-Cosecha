import { forwardRef } from 'react'

const inputStyle = {
  backgroundColor: 'rgba(255,255,255,0.88)',
  color: '#1c1917',
  border: '1px solid rgba(200,200,200,0.55)',
  borderRadius: '14px',
  padding: '10px 16px',
  fontSize: '14px',
  fontWeight: '500',
  width: '100%',
  outline: 'none',
  transition: 'all 0.2s',
}

const inputErrorStyle = {
  ...inputStyle,
  backgroundColor: '#fef2f2',
  border: '1px solid #fca5a5',
  color: '#991b1b',
}

const Input = forwardRef(function Input({ label, error, required, hint, className = '', ...props }, ref) {
  return (
    <div className={className}>
      {label && (
        <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
          {label} {required && <span style={{ color: '#fb923c' }}>*</span>}
        </label>
      )}
      <input
        ref={ref}
        style={error ? inputErrorStyle : inputStyle}
        onFocus={e => { e.target.style.border = '1px solid rgba(37,138,78,0.7)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,138,78,0.18)' }}
        onBlur={e => { e.target.style.border = error ? '1px solid #fca5a5' : '1px solid rgba(200,200,200,0.55)'; e.target.style.boxShadow = 'none' }}
        {...props}
      />
      {hint && !error && <p style={{ marginTop: '6px', fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{hint}</p>}
      {error && <p style={{ marginTop: '6px', fontSize: '11px', color: '#f87171' }}>{error}</p>}
    </div>
  )
})

export default Input
