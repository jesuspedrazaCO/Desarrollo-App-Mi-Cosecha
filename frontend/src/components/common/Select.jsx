import { forwardRef } from 'react'

const Select = forwardRef(function Select({ label, error, required, options = [], placeholder, className = '', ...props }, ref) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-[13px] font-semibold text-stone-700 mb-1.5">
          {label} {required && <span className="text-accent-500">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={`w-full border rounded-2xl px-4 py-2.5 text-sm bg-white/80 backdrop-blur-sm
          focus:outline-none focus:ring-2 transition-all duration-200 ease-smooth appearance-none
          ${error
            ? 'border-red-300 focus:ring-red-400/30 focus:border-red-400'
            : 'border-stone-200 focus:ring-primary-400/40 focus:border-primary-400'
          }`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  )
})

export default Select
