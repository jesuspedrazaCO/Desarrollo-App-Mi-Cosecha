import { forwardRef } from 'react'

const Input = forwardRef(function Input({ label, error, required, hint, className = '', ...props }, ref) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-[12px] font-bold text-white/60 uppercase tracking-wider mb-1.5">
          {label} {required && <span className="text-accent-400">*</span>}
        </label>
      )}
      <input
        ref={ref}
        className={`w-full rounded-2xl px-4 py-2.5 text-sm font-medium
          transition-all duration-200 focus:outline-none focus:ring-2
          ${error
            ? 'bg-red-50/90 border border-red-300 text-red-900 placeholder-red-300 focus:ring-red-400/30'
            : 'bg-white/80 border border-white/40 text-stone-800 placeholder-stone-400 focus:ring-primary-400/40 focus:border-primary-400/60 hover:border-white/60'
          }`}
        {...props}
      />
      {hint && !error && <p className="mt-1.5 text-[11px] text-white/40">{hint}</p>}
      {error && <p className="mt-1.5 text-[11px] text-red-400">{error}</p>}
    </div>
  )
})

export default Input
