import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { formatCurrency, formatCurrencyCompact } from '../../utils/formatCurrency'
import EmptyState from '../common/EmptyState'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-elevated border border-white/60 px-4 py-3 min-w-[180px]">
      <p className="text-sm font-bold text-stone-800 mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-xs" style={{ color: p.color }}>
          {p.name}: <strong>{formatCurrency(p.value)}</strong>
        </p>
      ))}
    </div>
  )
}

export default function CropComparisonChart({ crops = [] }) {
  if (crops.length === 0) {
    return <EmptyState icon="📊" title="Sin datos para comparar" description="Registra gastos e ingresos en tus cultivos para ver este reporte" />
  }

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-card border border-white/60 p-5">
      <h3 className="section-title mb-4">📊 Comparación de cultivos</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={crops} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e2dc" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#79766b' }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={formatCurrencyCompact} tick={{ fontSize: 11, fill: '#79766b' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(45,111,67,0.05)' }} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
          <Bar dataKey="totalInvested" name="Invertido" fill="#df7e42" radius={[6, 6, 0, 0]} maxBarSize={32} />
          <Bar dataKey="totalSold" name="Vendido" fill="#2d6f43" radius={[6, 6, 0, 0]} maxBarSize={32} />
          <Bar dataKey="netProfit" name="Ganancia" fill="#5dab74" radius={[6, 6, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
