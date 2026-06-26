import { formatCurrencyCompact } from '../../utils/formatCurrency'

const palettes = {
  green:  { from: '#258a4e', to: '#1a6e3c', glow: 'rgba(37,138,78,0.45)', soft: 'rgba(74,222,128,0.08)' },
  accent: { from: '#e37038', to: '#c8541e', glow: 'rgba(200,84,30,0.40)', soft: 'rgba(227,112,56,0.08)' },
  blue:   { from: '#3b82f6', to: '#1d4ed8', glow: 'rgba(59,130,246,0.40)', soft: 'rgba(96,165,250,0.08)' },
  red:    { from: '#ef4444', to: '#b91c1c', glow: 'rgba(239,68,68,0.40)',  soft: 'rgba(248,113,113,0.08)' },
}

export default function StatsCard({ title, value, subtitle, icon, color = 'green', isCurrency = true, trend }) {
  const pal = palettes[color] || palettes.green
  const displayValue = isCurrency ? formatCurrencyCompact(value) : (value ?? '—')

  return (
    <div className="relative overflow-hidden rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1 group"
      style={{
        background: 'rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 4px 24px -4px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.14)',
      }}
    >
      {/* Glow de fondo */}
      <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-60 transition-all duration-500 group-hover:scale-125 group-hover:opacity-80 pointer-events-none"
        style={{ background: pal.soft }} />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg text-white flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${pal.from} 0%, ${pal.to} 100%)`,
              boxShadow: `0 4px 16px ${pal.glow}`,
            }}>
            {icon}
          </div>
          {trend !== undefined && (
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              trend >= 0 ? 'text-mint-400 bg-mint-400/10' : 'text-red-400 bg-red-400/10'
            }`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
          )}
        </div>
        <p className="text-[12px] font-semibold text-white/50 uppercase tracking-wider">{title}</p>
        <p className="text-[24px] font-bold text-white mt-0.5 font-display tracking-tight">{displayValue}</p>
        {subtitle && <p className="text-[11px] text-white/35 mt-1">{subtitle}</p>}
      </div>
    </div>
  )
}
