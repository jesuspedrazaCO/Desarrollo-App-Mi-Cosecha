export default function SearchBar({ value, onChange, placeholder = 'Buscar...', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35 pointer-events-none"
        fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-11 pr-4 py-2.5 bg-white/08 border border-white/13 rounded-full text-sm
          text-white placeholder-white/30
          focus:outline-none focus:ring-2 focus:ring-mint-400/35 focus:border-mint-400/45
          transition-all duration-200 backdrop-blur-sm"
      />
    </div>
  )
}
