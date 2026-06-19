import { forwardRef } from 'react'

const Textarea = forwardRef(function Textarea({ label, error, required, rows = 3, className = '', ...props }, ref) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-[13px] font-semibold text-stone-700 mb-1.5">
          {label} {required && <span className="text-accent-500">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={`w-full border rounded-2xl px-4 py-2.5 text-sm bg-white/80 backdrop-blur-sm placeholder-stone-400 resize-none
          focus:outline-none focus:ring-2 transition-all duration-200 ease-smooth
          ${error
            ? 'border-red-300 focus:ring-red-400/30 focus:border-red-400'
            : 'border-stone-200 focus:ring-primary-400/40 focus:border-primary-400'
          }`}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  )
})

export default Textarea
