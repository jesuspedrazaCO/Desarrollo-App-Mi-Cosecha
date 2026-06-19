import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { formatCurrency, formatCurrencyCompact } from '../../utils/formatCurrency'
import { HOUSEHOLD_CATEGORIES, CHART_COLORS } from '../../utils/constants'
import { formatMonthLabel } from '../../utils/formatDate'

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-elevated border border-white/60 px-4 py-3">
      <p className="text-sm font-bold text-stone-800">{payload[0].name || payload[0].payload?.month}</p>
      <p className="text-sm font-semibold text-accent-600">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

export default function HouseholdSummary({ byCategory = [], byMonth = [], totalAmount = 0 }) {
  const getCatLabel = (key) => {
    const cat = HOUSEHOLD_CATEGORIES.find(c => c.value === key)
    return cat ? `${cat.icon} ${cat.label}` : key
  }

  const monthlyData = byMonth.map(m => ({
    ...m,
    label: formatMonthLabel(m.month),
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Total del mes */}
      <div className="lg:col-span-2 bg-accent-50/80 backdrop-blur-sm rounded-3xl p-5 border border-accent-100">
        <p className="text-xs font-bold text-accent-600 uppercase tracking-wider">🏠 Total en el período</p>
        <p className="text-3xl font-bold text-accent-900 mt-1 font-display">{formatCurrency(totalAmount)}</p>
      </div>

      {/* Pie chart por categoría */}
      {byCategory.length > 0 && (
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-card border border-white/60 p-5">
          <h4 className="section-title mb-4">Por categoría</h4>
          <div className="flex flex-col items-center gap-4">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={byCategory} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  paddingAngle={3} dataKey="total" nameKey="category">
                  {byCategory.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 w-full">
              {byCategory.map((cat, i) => (
                <div key={cat.category} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-stone-700 truncate">{getCatLabel(cat.category)}</p>
                    <p className="text-xs text-stone-400">{formatCurrencyCompact(cat.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bar chart por mes */}
      {monthlyData.length > 0 && (
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-card border border-white/60 p-5">
          <h4 className="section-title mb-4">Por mes</h4>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e2dc" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#79766b' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatCurrencyCompact} tick={{ fontSize: 10, fill: '#79766b' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(204,98,40,0.05)' }} />
              <Bar dataKey="total" fill="#df7e42" radius={[8, 8, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
