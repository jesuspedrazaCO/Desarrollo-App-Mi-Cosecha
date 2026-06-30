import { useState, useEffect } from 'react'
import { useReports } from '../hooks/useReports'
import { useDashboard } from '../hooks/useDashboard'
import { getCrops } from '../services/cropService'
import ReportFilters from '../components/reports/ReportFilters'
import CropComparisonChart from '../components/reports/CropComparisonChart'
import MonthlyTrendChart from '../components/reports/MonthlyTrendChart'
import CategoryPieChart from '../components/reports/CategoryPieChart'
import Spinner from '../components/common/Spinner'
import Tabs from '../components/common/Tabs'
import ExportPDFButton from '../components/common/ExportPDFButton'
import { formatCurrency } from '../utils/formatCurrency'
import { exportResumenGeneral, exportHouseholdReport } from '../utils/pdfExport'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

const TABS = [
  { key: 'crops', label: '🌾 Cultivos' },
  { key: 'household', label: '🏠 Hogar' },
]

export default function ReportsPage() {
  const { comparison, agroExpenses, agroIncome, householdReport, loading, fetchAll } = useReports()
  const { data: dashboardData } = useDashboard()
  const { user } = useAuth()
  const [crops, setCrops] = useState([])
  const [activeTab, setActiveTab] = useState('crops')

  useEffect(() => {
    getCrops().then(r => setCrops(r.data)).catch(() => {})
    fetchAll()
  }, [])

  const handleFilter = async (params) => { await fetchAll(params) }

  const handleExportGeneral = () => {
    if (!dashboardData) {
      toast.error('Espera a que carguen los datos')
      return
    }
    exportResumenGeneral(dashboardData, user)
    toast.success('PDF generado correctamente')
  }

  const handleExportHousehold = () => {
    if (!householdReport) {
      toast.error('No hay datos del hogar para exportar')
      return
    }
    exportHouseholdReport(householdReport.items || [], householdReport.total || 0, user)
    toast.success('PDF generado correctamente')
  }

  return (
    <div className="space-y-6 animate-float-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Reportes y estadísticas 📊</h1>
          <p className="text-white/50 text-sm mt-1">Analiza el desempeño financiero de tu finca</p>
        </div>
        <ExportPDFButton
          onExport={activeTab === 'crops' ? handleExportGeneral : handleExportHousehold}
          label={activeTab === 'crops' ? 'Exportar resumen general' : 'Exportar gastos del hogar'}
        />
      </div>

      <ReportFilters crops={crops} onFilter={handleFilter} />
      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {loading ? (
        <Spinner size="lg" className="mt-16" />
      ) : (
        <>
          {activeTab === 'crops' && (
            <div className="space-y-5">
              {agroExpenses && agroIncome && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="rounded-3xl p-5" style={{ background: 'rgba(194,65,12,0.15)', border: '1px solid rgba(194,65,12,0.3)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#fb923c' }}>💰 Total gastado</p>
                    <p className="text-xl font-bold mt-1 font-display text-white">{formatCurrency(agroExpenses.total)}</p>
                    <p className="text-xs text-white/40 mt-1">{agroExpenses.count} registros</p>
                  </div>
                  <div className="rounded-3xl p-5" style={{ background: 'rgba(21,128,61,0.15)', border: '1px solid rgba(21,128,61,0.3)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#4ade80' }}>📈 Total vendido</p>
                    <p className="text-xl font-bold mt-1 font-display text-white">{formatCurrency(agroIncome.total)}</p>
                    <p className="text-xs text-white/40 mt-1">{agroIncome.count} ventas</p>
                  </div>
                  <div className="rounded-3xl p-5" style={{
                    background: agroIncome.total - agroExpenses.total >= 0 ? 'rgba(21,128,61,0.15)' : 'rgba(185,28,28,0.15)',
                    border: `1px solid ${agroIncome.total - agroExpenses.total >= 0 ? 'rgba(21,128,61,0.3)' : 'rgba(185,28,28,0.3)'}`,
                  }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: agroIncome.total - agroExpenses.total >= 0 ? '#4ade80' : '#f87171' }}>
                      {agroIncome.total - agroExpenses.total >= 0 ? '✅' : '⚠️'} Ganancia neta
                    </p>
                    <p className="text-xl font-bold mt-1 font-display text-white">{formatCurrency(agroIncome.total - agroExpenses.total)}</p>
                  </div>
                  <div className="rounded-3xl p-5" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">🌱 Cultivos</p>
                    <p className="text-xl font-bold mt-1 font-display text-white">{comparison.length}</p>
                    <p className="text-xs text-white/40 mt-1">analizados</p>
                  </div>
                </div>
              )}

              <CropComparisonChart crops={comparison} />

              {agroExpenses && agroIncome && (
                <MonthlyTrendChart
                  expensesByMonth={agroExpenses.byMonth}
                  incomeByMonth={agroIncome.byMonth}
                  title="Tendencia de gastos e ingresos agrícolas"
                />
              )}

              {agroExpenses?.byCategory?.length > 0 && (
                <CategoryPieChart data={agroExpenses.byCategory} type="expense" title="🥧 Gastos agrícolas por categoría" />
              )}
            </div>
          )}

          {activeTab === 'household' && (
            <div className="space-y-5">
              {householdReport && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-3xl p-5" style={{ background: 'rgba(194,65,12,0.15)', border: '1px solid rgba(194,65,12,0.3)' }}>
                      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#fb923c' }}>🏠 Total gastos hogar</p>
                      <p className="text-xl font-bold mt-1 font-display text-white">{formatCurrency(householdReport.total)}</p>
                      <p className="text-xs text-white/40 mt-1">{householdReport.count} registros</p>
                    </div>
                    <div className="rounded-3xl p-5" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)' }}>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">📅 Promedio mensual</p>
                      <p className="text-xl font-bold mt-1 font-display text-white">
                        {householdReport.byMonth.length > 0 ? formatCurrency(householdReport.total / householdReport.byMonth.length) : '$0'}
                      </p>
                    </div>
                  </div>

                  <MonthlyTrendChart expensesByMonth={householdReport.byMonth} incomeByMonth={[]} title="Evolución de gastos del hogar" />
                  <CategoryPieChart data={householdReport.byCategory} type="household" title="🥧 Gastos del hogar por categoría" />
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
