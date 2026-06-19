import { useState, useEffect } from 'react'
import { useReports } from '../hooks/useReports'
import { getCrops } from '../services/cropService'
import ReportFilters from '../components/reports/ReportFilters'
import CropComparisonChart from '../components/reports/CropComparisonChart'
import MonthlyTrendChart from '../components/reports/MonthlyTrendChart'
import CategoryPieChart from '../components/reports/CategoryPieChart'
import Spinner from '../components/common/Spinner'
import Tabs from '../components/common/Tabs'
import { formatCurrency } from '../utils/formatCurrency'

const TABS = [
  { key: 'crops', label: '🌾 Cultivos' },
  { key: 'household', label: '🏠 Hogar' },
]

export default function ReportsPage() {
  const { comparison, agroExpenses, agroIncome, householdReport, loading, fetchAll } = useReports()
  const [crops, setCrops] = useState([])
  const [activeTab, setActiveTab] = useState('crops')
  const [generated, setGenerated] = useState(false)

  useEffect(() => {
    getCrops().then(r => setCrops(r.data)).catch(() => {})
    // Cargar reporte inicial al entrar
    fetchAll().then(() => setGenerated(true))
  }, [])

  const handleFilter = async (params) => {
    await fetchAll(params)
    setGenerated(true)
  }

  return (
    <div className="space-y-6 animate-float-up">
      {/* Header */}
      <div>
        <h1 className="page-title">Reportes y estadísticas 📊</h1>
        <p className="text-stone-500 text-sm mt-1">Analiza el desempeño financiero de tu finca</p>
      </div>

      {/* Filtros */}
      <ReportFilters crops={crops} onFilter={handleFilter} />

      {/* Tabs */}
      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {loading ? (
        <Spinner size="lg" className="mt-16" />
      ) : (
        <>
          {/* Tab: Cultivos */}
          {activeTab === 'crops' && (
            <div className="space-y-5">
              {/* Resumen general */}
              {agroExpenses && agroIncome && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-accent-50/80 backdrop-blur-sm rounded-3xl p-5 border border-accent-100">
                    <p className="text-[10px] font-bold text-accent-600 uppercase tracking-wider">💰 Total gastado</p>
                    <p className="text-xl font-bold text-accent-900 mt-1 font-display">
                      {formatCurrency(agroExpenses.total)}
                    </p>
                    <p className="text-xs text-stone-400 mt-1">{agroExpenses.count} registros</p>
                  </div>
                  <div className="bg-primary-50/80 backdrop-blur-sm rounded-3xl p-5 border border-primary-100">
                    <p className="text-[10px] font-bold text-primary-600 uppercase tracking-wider">📈 Total vendido</p>
                    <p className="text-xl font-bold text-primary-900 mt-1 font-display">
                      {formatCurrency(agroIncome.total)}
                    </p>
                    <p className="text-xs text-stone-400 mt-1">{agroIncome.count} ventas</p>
                  </div>
                  <div className={`backdrop-blur-sm rounded-3xl p-5 border ${
                    agroIncome.total - agroExpenses.total >= 0
                      ? 'bg-green-50/80 border-green-100'
                      : 'bg-red-50/80 border-red-100'
                  }`}>
                    <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                      {agroIncome.total - agroExpenses.total >= 0 ? '✅' : '⚠️'} Ganancia neta
                    </p>
                    <p className={`text-xl font-bold mt-1 font-display ${
                      agroIncome.total - agroExpenses.total >= 0 ? 'text-green-800' : 'text-red-700'
                    }`}>
                      {formatCurrency(agroIncome.total - agroExpenses.total)}
                    </p>
                  </div>
                  <div className="bg-stone-50/80 backdrop-blur-sm rounded-3xl p-5 border border-stone-100">
                    <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">🌱 Cultivos</p>
                    <p className="text-xl font-bold text-stone-800 mt-1 font-display">{comparison.length}</p>
                    <p className="text-xs text-stone-400 mt-1">analizados</p>
                  </div>
                </div>
              )}

              {/* Comparación de cultivos */}
              <CropComparisonChart crops={comparison} />

              {/* Tendencia mensual */}
              {agroExpenses && agroIncome && (
                <MonthlyTrendChart
                  expensesByMonth={agroExpenses.byMonth}
                  incomeByMonth={agroIncome.byMonth}
                  title="Tendencia de gastos e ingresos agrícolas"
                />
              )}

              {/* Gastos por categoría */}
              {agroExpenses?.byCategory?.length > 0 && (
                <CategoryPieChart
                  data={agroExpenses.byCategory}
                  type="expense"
                  title="🥧 Gastos agrícolas por categoría"
                />
              )}
            </div>
          )}

          {/* Tab: Hogar */}
          {activeTab === 'household' && (
            <div className="space-y-5">
              {householdReport && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-accent-50/80 backdrop-blur-sm rounded-3xl p-5 border border-accent-100">
                      <p className="text-[10px] font-bold text-accent-600 uppercase tracking-wider">🏠 Total gastos hogar</p>
                      <p className="text-xl font-bold text-accent-900 mt-1 font-display">
                        {formatCurrency(householdReport.total)}
                      </p>
                      <p className="text-xs text-stone-400 mt-1">{householdReport.count} registros</p>
                    </div>
                    <div className="bg-stone-50/80 backdrop-blur-sm rounded-3xl p-5 border border-stone-100">
                      <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">📅 Promedio mensual</p>
                      <p className="text-xl font-bold text-stone-800 mt-1 font-display">
                        {householdReport.byMonth.length > 0
                          ? formatCurrency(householdReport.total / householdReport.byMonth.length)
                          : '$0'}
                      </p>
                    </div>
                  </div>

                  <MonthlyTrendChart
                    expensesByMonth={householdReport.byMonth}
                    incomeByMonth={[]}
                    title="Evolución de gastos del hogar"
                  />

                  <CategoryPieChart
                    data={householdReport.byCategory}
                    type="household"
                    title="🥧 Gastos del hogar por categoría"
                  />
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
