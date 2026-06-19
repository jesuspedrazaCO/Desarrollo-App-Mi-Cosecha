import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { formatCurrency, formatCurrencyCompact } from '../../utils/formatCurrency'
import { formatMonthLabel } from '../../utils/formatDate'
import EmptyState from '../common/EmptyState'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-elevated border border-white/60 px-4 py-3">
      <p className="text-sm font-bold text-stone-800 mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-xs" style={{ color: p.color }}>
          {p.name}: <strong>{formatCurrency(p.value)}</strong>
        </p>
      ))}
    </div>
  )
}

export default function MonthlyTrendChart({ expensesByMonth = [], incomeByMonth = [], title = 'Tendencia mensual' }) {
  const allMonths = [...new Set([
    ...expensesByMonth.map(m => m.month),
    ...incomeByMonth.map(m => m.month),
  ])].sort()

  if (allMonths.length === 0) {
    return <EmptyState icon="📈" title="Sin datos de tendencia" description="Registra gastos o ingresos para ver la evolución mensual" />
  }

  const data = allMonths.map(month => ({
    label: formatMonthLabel(month),
    gastos: expensesByMonth.find(m => m.month === month)?.total || 0,
    ingresos: incomeByMonth.find(m => m.month === month)?.total || 0,
  }))

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-card border border-white/60 p-5">
      <h3 className="section-title mb-4">📈 {title}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e2dc" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#79766b' }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={formatCurrencyCompact} tick={{ fontSize: 11, fill: '#79766b' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
          <Line type="monotone" dataKey="gastos" name="Gastos" stroke="#df7e42" strokeWidth={2.5} dot={{ r: 4, fill: '#df7e42' }} />
          <Line type="monotone" dataKey="ingresos" name="Ingresos" stroke="#2d6f43" strokeWidth={2.5} dot={{ r: 4, fill: '#2d6f43' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
