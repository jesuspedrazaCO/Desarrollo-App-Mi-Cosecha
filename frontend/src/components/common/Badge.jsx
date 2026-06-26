const classes = {
  green:   'badge-green',
  amber:   'badge-amber',
  red:     'badge-red',
  blue:    'badge-blue',
  gray:    'badge-gray',
  accent:  'badge-accent',
  purple:  'badge-purple',
}

export default function Badge({ color = 'gray', children, className = '' }) {
  return (
    <span className={`${classes[color] || classes.gray} ${className}`}>
      {children}
    </span>
  )
}
