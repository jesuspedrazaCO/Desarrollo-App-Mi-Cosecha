import { forwardRef } from 'react'

const Input = forwardRef(function Input({ label, error, required, hint, className = '', ...props }, ref) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-[12px] font-bold text-white/55 uppercase tracking-wider mb-1.5">
          {label} {required && <span className="text-accent-400">*</span>}
        </label>
      )}
      <input
        ref={ref}
        className={`w-full rounded-2xl px-4 py-2.5 text-sm text-white placeholder-white/30
          transition-all duration-200 focus:outline-none focus:ring-2
          backdrop-blur-sm
          ${error
            ? 'bg-red-500/10 border border-red-400/40 focus:ring-red-400/30 focus:border-red-400/60'
            : 'bg-white/07 border border-white/13 focus:ring-mint-400/35 focus:border-mint-400/50 hover:border-white/22'
          }`}
        {...props}
      />
      {hint && !error && <p className="mt-1.5 text-[11px] text-white/35">{hint}</p>}
      {error && <p className="mt-1.5 text-[11px] text-red-400">{error}</p>}
    </div>
  )
})

export default Input
