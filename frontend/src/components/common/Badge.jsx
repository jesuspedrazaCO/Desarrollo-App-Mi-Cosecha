const colors = {
  green:   'bg-primary-100 text-primary-700',
  amber:   'bg-amber-100 text-amber-700',
  red:     'bg-red-100 text-red-600',
  blue:    'bg-blue-100 text-blue-700',
  gray:    'bg-stone-100 text-stone-600',
  accent:  'bg-accent-100 text-accent-700',
  purple:  'bg-purple-100 text-purple-700',
}

export default function Badge({ color = 'gray', children, className = '' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold tracking-tight ${colors[color]} ${className}`}>
      {children}
    </span>
  )
}
