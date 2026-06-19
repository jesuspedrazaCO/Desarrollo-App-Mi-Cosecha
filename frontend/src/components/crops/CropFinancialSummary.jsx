import { formatCurrency } from '../../utils/formatCurrency'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { EXPENSE_CATEGORIES, CHART_COLORS } from '../../utils/constants'

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-elevated border border-white/60 px-4 py-3">
      <p className="text-sm font-bold text-stone-800">{payload[0].name}</p>
      <p className="text-sm text-accent-600 font-semibold">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

export default function CropFinancialSummary({ summary, expenses = [] }) {
  if (!summary) return null

  const { totalInvested, totalSold, netProfit, profitability, isProfit } = summary

  // Agrupar gastos por categoría para el pie chart
  const byCategory = expenses.reduce((acc, e) => {
    const existing = acc.find(a => a.name === e.category)
    if (existing) existing.value += e.amount
    else acc.push({ name: e.category, value: e.amount })
    return acc
  }, [])

  const getCategoryLabel = (key) =>
    EXPENSE_CATEGORIES.find(c => c.value === key)?.label || key

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total invertido */}
      <div className="bg-accent-50/80 backdrop-blur-sm rounded-3xl p-5 border border-accent-100">
        <p className="text-xs font-bold text-accent-600 uppercase tracking-wider">💰 Total invertido</p>
        <p className="text-2xl font-bold text-accent-800 mt-1 font-display">{formatCurrency(totalInvested)}</p>
      </div>

      {/* Total vendido */}
      <div className="bg-primary-50/80 backdrop-blur-sm rounded-3xl p-5 border border-primary-100">
        <p className="text-xs font-bold text-primary-600 uppercase tracking-wider">📈 Total vendido</p>
        <p className="text-2xl font-bold text-primary-800 mt-1 font-display">{formatCurrency(totalSold)}</p>
      </div>

      {/* Ganancia neta */}
      <div className={`${isProfit ? 'bg-green-50/80 border-green-100' : 'bg-red-50/80 border-red-100'} backdrop-blur-sm rounded-3xl p-5 border`}>
        <p className={`text-xs font-bold uppercase tracking-wider ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
          {isProfit ? '✅' : '⚠️'} Ganancia neta
        </p>
        <p className={`text-2xl font-bold mt-1 font-display ${isProfit ? 'text-green-800' : 'text-red-700'}`}>
          {formatCurrency(netProfit)}
        </p>
        <p className="text-xs text-stone-500 mt-1">
          Rentabilidad: <strong>{profitability}%</strong>
        </p>
      </div>

      {/* Pie chart de gastos por categoría */}
      {byCategory.length > 0 && (
        <div className="md:col-span-3 bg-white/70 backdrop-blur-xl rounded-3xl shadow-card border border-white/60 p-5">
          <h4 className="section-title mb-4">Gastos por categoría</h4>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie data={byCategory} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {byCategory.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 grid grid-cols-2 gap-2">
              {byCategory.map((cat, i) => (
                <div key={cat.name} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-stone-700 capitalize truncate">{getCategoryLabel(cat.name)}</p>
                    <p className="text-xs text-stone-400">{formatCurrency(cat.value)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
