import { useDashboard } from '../hooks/useDashboard'
import StatsCard from '../components/dashboard/StatsCard'
import AlertsPanel from '../components/dashboard/AlertsPanel'
import CropsSummary from '../components/dashboard/CropsSummary'
import UpcomingEvents from '../components/dashboard/UpcomingEvents'
import QuickChart from '../components/dashboard/QuickChart'
import MarketPricesCard from '../components/dashboard/MarketPricesCard'
import Spinner from '../components/common/Spinner'
import { formatDateLong } from '../utils/formatDate'
import { useAuth } from '../hooks/useAuth'

export default function DashboardPage() {
  const { data, loading } = useDashboard()
  const { user } = useAuth()

  if (loading) return <Spinner size="lg" className="mt-20" />

  const { summary, cropsSummary, upcomingEvents, alerts } = data || {}

  return (
    <div className="space-y-6 animate-float-up">
      {/* Encabezado */}
      <div>
        <h1 className="page-title">Hola, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-white/45 text-sm mt-1 capitalize">{formatDateLong(new Date())}</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total invertido"
          value={summary?.totalInvested}
          icon="💰"
          color="accent"
          subtitle="En todos tus cultivos"
        />
        <StatsCard
          title="Total vendido"
          value={summary?.totalIncome}
          icon="📈"
          color="green"
          subtitle="Ingresos por ventas"
        />
        <StatsCard
          title="Ganancia neta"
          value={summary?.totalProfit}
          icon={summary?.totalProfit >= 0 ? '✅' : '⚠️'}
          color={summary?.totalProfit >= 0 ? 'green' : 'red'}
          subtitle="Inversión vs. ventas"
        />
        <StatsCard
          title="Gastos del hogar"
          value={summary?.householdTotalMonth}
          icon="🏠"
          color="blue"
          subtitle="Este mes"
        />
      </div>

      {/* Gráfico + cultivos activos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickChart crops={cropsSummary} />
        <CropsSummary crops={cropsSummary} />
      </div>

      {/* Precios de mercado — ocupa todo el ancho */}
      <MarketPricesCard />

      {/* Eventos y alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingEvents events={upcomingEvents} />
        <AlertsPanel alerts={alerts} />
      </div>
    </div>
  )
}
