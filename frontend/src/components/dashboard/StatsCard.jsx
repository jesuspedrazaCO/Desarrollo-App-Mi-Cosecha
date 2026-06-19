import { formatCurrencyCompact } from '../../utils/formatCurrency'

const palettes = {
  green:  { bg: 'from-primary-500 to-primary-700', soft: 'bg-primary-50' },
  accent: { bg: 'from-accent-500 to-accent-700', soft: 'bg-accent-50' },
  blue:   { bg: 'from-blue-500 to-blue-700', soft: 'bg-blue-50' },
  red:    { bg: 'from-red-500 to-red-600', soft: 'bg-red-50' },
}

export default function StatsCard({ title, value, subtitle, icon, color = 'green', isCurrency = true, trend }) {
  const palette = palettes[color] || palettes.green
  const displayValue = isCurrency ? formatCurrencyCompact(value) : (value ?? '—')

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-card border border-white/60 p-5 relative overflow-hidden
      hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-300 ease-smooth group">
      <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full ${palette.soft} opacity-60 blur-2xl group-hover:scale-125 transition-transform duration-500`} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${palette.bg} flex items-center justify-center text-xl shadow-soft text-white`}>
            {icon}
          </div>
          {trend !== undefined && (
            <span className={`text-xs font-bold ${trend >= 0 ? 'text-primary-600' : 'text-red-500'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
          )}
        </div>
        <p className="text-sm text-stone-500 font-medium">{title}</p>
        <p className="text-[26px] font-bold text-stone-900 mt-0.5 font-display tracking-tight">{displayValue}</p>
        {subtitle && <p className="text-xs text-stone-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  )
}