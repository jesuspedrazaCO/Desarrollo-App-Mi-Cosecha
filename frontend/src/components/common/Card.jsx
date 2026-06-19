export default function Card({ children, className = '', solid = false, ...props }) {
  const base = solid
    ? 'bg-white rounded-3xl shadow-card border border-stone-100'
    : 'bg-white/70 backdrop-blur-xl rounded-3xl shadow-card border border-white/60'
  return (
    <div className={`${base} ${className}`} {...props}>
      {children}
    </div>
  )
}
