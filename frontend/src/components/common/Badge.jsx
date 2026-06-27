const styles = {
  green:   { bg: 'rgba(22,163,74,0.90)',   text: '#ffffff', border: 'rgba(22,163,74,0.5)' },
  amber:   { bg: 'rgba(180,120,0,0.90)',   text: '#ffffff', border: 'rgba(180,120,0,0.5)' },
  red:     { bg: 'rgba(220,38,38,0.90)',   text: '#ffffff', border: 'rgba(220,38,38,0.5)' },
  blue:    { bg: 'rgba(37,99,235,0.90)',   text: '#ffffff', border: 'rgba(37,99,235,0.5)' },
  gray:    { bg: 'rgba(80,80,80,0.75)',    text: '#ffffff', border: 'rgba(120,120,120,0.4)' },
  accent:  { bg: 'rgba(194,65,12,0.90)',   text: '#ffffff', border: 'rgba(194,65,12,0.5)' },
  purple:  { bg: 'rgba(109,40,217,0.90)',  text: '#ffffff', border: 'rgba(109,40,217,0.5)' },
}

export default function Badge({ color = 'gray', children, className = '' }) {
  const s = styles[color] || styles.gray
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide ${className}`}
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}
    >
      {children}
    </span>
  )
}
