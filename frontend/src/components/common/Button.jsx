export default function Button({ children, variant = 'primary', size = 'md', loading, className = '', ...props }) {
  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white shadow-soft hover:shadow-card',
    secondary: 'bg-white/70 hover:bg-white text-stone-700 backdrop-blur-md border border-stone-200/80 hover:shadow-soft',
    accent: 'bg-accent-500 hover:bg-accent-600 text-white shadow-soft hover:shadow-card',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    ghost: 'text-stone-600 hover:bg-stone-100/70',
  }
  const sizes = {
    sm: 'px-3.5 py-1.5 text-[13px]',
    md: 'px-5 py-2.5 text-[14px]',
    lg: 'px-6 py-3 text-[15px]',
  }
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-semibold rounded-full transition-all duration-200 ease-smooth
        disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0
        ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  )
}
