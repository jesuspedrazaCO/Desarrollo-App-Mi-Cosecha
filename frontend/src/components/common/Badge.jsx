const BADGE_STYLES = {
  green:   { background: '#15803d', color: '#ffffff', border: '#16a34a' },
  amber:   { background: '#92400e', color: '#ffffff', border: '#b45309' },
  red:     { background: '#b91c1c', color: '#ffffff', border: '#dc2626' },
  blue:    { background: '#1d4ed8', color: '#ffffff', border: '#2563eb' },
  gray:    { background: '#374151', color: '#ffffff', border: '#4b5563' },
  accent:  { background: '#9a3412', color: '#ffffff', border: '#c2410c' },
  purple:  { background: '#6d28d9', color: '#ffffff', border: '#7c3aed' },
}

export default function Badge({ color = 'gray', children, className = '' }) {
  const s = BADGE_STYLES[color] || BADGE_STYLES.gray
  return (
    <span
      className={`inline-flex items-center gap-1 font-bold ${className}`}
      style={{
        background: s.background,
        color: s.color,
        border: `1px solid ${s.border}`,
        padding: '3px 10px',
        borderRadius: '99px',
        fontSize: '11px',
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}
