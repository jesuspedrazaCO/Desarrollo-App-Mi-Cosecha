import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '../../utils/formatCurrency'
import { EXPENSE_CATEGORIES, HOUSEHOLD_CATEGORIES, CHART_COLORS } from '../../utils/constants'
import EmptyState from '../common/EmptyState'

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-elevated border border-white/60 px-4 py-3">
      <p className="text-sm font-bold text-stone-800">{payload[0].name}</p>
      <p className="text-sm font-semibold text-accent-600">{formatCurrency(payload[0].value)}</p>
      <p className="text-xs text-stone-400">{payload[0].payload.percent?.toFixed(1)}%</p>
    </div>
  )
}

export default function CategoryPieChart({ data = [], type = 'expense', title }) {
  if (data.length === 0) {
    return <EmptyState icon="🥧" title="Sin datos por categoría" description="Registra gastos para ver la distribución por categoría" />
  }

  const getCategoryLabel = (key) => {
    const all = [...EXPENSE_CATEGORIES, ...HOUSEHOLD_CATEGORIES]
    const found = all.find(c => c.value === key)
    return found ? `${found.icon} ${found.label}` : key
  }

  const total = data.reduce((sum, d) => sum + (d.total || d.value || 0), 0)
  const chartData = data.map(d => ({
    name: getCategoryLabel(d.category || d.name),
    value: d.total || d.value || 0,
    percent: total > 0 ? ((d.total || d.value || 0) / total) * 100 : 0,
  }))

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-card border border-white/60 p-5">
      <h3 className="section-title mb-4">{title || '🥧 Por categoría'}</h3>
      <div className="flex flex-col md:flex-row items-center gap-6">
        <ResponsiveContainer width={200} height={200}>
          <PieChart>
            <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
              paddingAngle={3} dataKey="value">
              {chartData.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {chartData.map((item, i) => (
            <div key={item.name} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-stone-700 truncate">{item.name}</p>
                <p className="text-xs text-stone-400">{formatCurrency(item.value)} · {item.percent.toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
