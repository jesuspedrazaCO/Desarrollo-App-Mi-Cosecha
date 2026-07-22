import { BarChart3 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { formatCurrencyCompact, formatCurrency } from '../../utils/formatCurrency'
import EmptyState from '../common/EmptyState'

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  return (
    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-elevated border border-white/60 px-4 py-3">
      <p className="text-sm font-bold text-stone-800">{data.name}</p>
      <p className="text-xs text-stone-500 mt-1">Invertido: <span className="font-semibold text-accent-600">{formatCurrency(data.totalInvested)}</span></p>
      <p className="text-xs text-stone-500">Vendido: <span className="font-semibold text-primary-600">{formatCurrency(data.totalSold)}</span></p>
      <p className="text-xs text-stone-500">Ganancia: <span className={`font-semibold ${data.netProfit >= 0 ? 'text-primary-600' : 'text-red-500'}`}>{formatCurrency(data.netProfit)}</span></p>
    </div>
  )
}

export default function QuickChart({ crops = [] }) {
  if (crops.length === 0) {
    return (
      <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-card border border-white/60">
        <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-2">
          <BarChart3 size={18} className="text-stone-500" strokeWidth={2} />
          <h3 className="section-title">Inversión vs. Ventas por cultivo</h3>
        </div>
        <EmptyState icon={<BarChart3 size={32} strokeWidth={1.75} />} title="Sin datos suficientes" description="Registra gastos e ingresos para ver este gráfico" />
      </div>
    )
  }

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-card border border-white/60 p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={18} className="text-stone-500" strokeWidth={2} />
        <h3 className="section-title">Inversión vs. Ventas por cultivo</h3>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={crops} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e2dc" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#79766b' }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={formatCurrencyCompact} tick={{ fontSize: 11, fill: '#79766b' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(45,111,67,0.05)' }} />
          <Bar dataKey="totalInvested" name="Invertido" fill="#df7e42" radius={[8, 8, 0, 0]} maxBarSize={36} />
          <Bar dataKey="totalSold" name="Vendido" fill="#2d6f43" radius={[8, 8, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 justify-center mt-2">
        <div className="flex items-center gap-1.5 text-xs text-stone-500"><span className="w-3 h-3 rounded-full bg-accent-500" /> Invertido</div>
        <div className="flex items-center gap-1.5 text-xs text-stone-500"><span className="w-3 h-3 rounded-full bg-primary-600" /> Vendido</div>
      </div>
    </div>
  )
}