export default function Button({ children, variant = 'primary', size = 'md', loading, className = '', ...props }) {
  const variants = {
    primary:   'bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-[0_0_0_1px_rgba(66,166,106,0.3),0_4px_16px_-4px_rgba(37,138,78,0.5)] hover:shadow-[0_0_0_1px_rgba(74,222,128,0.4),0_8px_24px_-4px_rgba(37,138,78,0.6)]',
    secondary: 'bg-white/10 hover:bg-white/16 text-white/90 border border-white/18',
    accent:    'bg-gradient-to-br from-accent-400 to-accent-600 text-white shadow-[0_4px_16px_-4px_rgba(200,84,30,0.45)]',
    danger:    'bg-red-500/80 hover:bg-red-500 text-white backdrop-blur-sm',
    ghost:     'text-white/65 hover:text-white hover:bg-white/10 border border-transparent',
  }
  const sizes = {
    sm: 'px-3.5 py-1.5 text-[12px]',
    md: 'px-5 py-2.5 text-[13px]',
    lg: 'px-6 py-3 text-[14px]',
  }
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-semibold rounded-full
        transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]
        disabled:opacity-40 disabled:cursor-not-allowed
        hover:-translate-y-0.5 active:translate-y-0
        ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  )
}
