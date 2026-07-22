import { useDashboard } from '../hooks/useDashboard'
import StatsCard from '../components/dashboard/StatsCard'
import StatsCarousel from '../components/dashboard/StatsCarousel'
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

  const statsCards = [
    <StatsCard
      title="Total invertido"
      value={summary?.totalInvested}
      icon="💰"
      color="accent"
      subtitle="En todos tus cultivos"
    />,
    <StatsCard
      title="Total vendido"
      value={summary?.totalIncome}
      icon="📈"
      color="green"
      subtitle="Ingresos por ventas"
    />,
    <StatsCard
      title="Ganancia neta"
      value={summary?.totalProfit}
      icon={summary?.totalProfit >= 0 ? '✅' : '⚠️'}
      color={summary?.totalProfit >= 0 ? 'green' : 'red'}
      subtitle="Inversión vs. ventas"
    />,
    <StatsCard
      title="Gastos del hogar"
      value={summary?.householdTotalMonth}
      icon="🏠"
      color="blue"
      subtitle="Este mes"
    />,
  ]

  return (
    <div className="space-y-6 animate-float-up">
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0 lg:hidden"
          style={{ background: 'linear-gradient(135deg, #258a4e, #1a6e3c)' }}
        >
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            user?.name?.[0]?.toUpperCase()
          )}
        </div>
        <div>
          <h1 className="page-title">Hola, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-white/45 text-sm mt-1 capitalize">{formatDateLong(new Date())}</p>
        </div>
      </div>

      {/* Estadísticas — carrusel en móvil, grid en escritorio */}
      <div className="lg:hidden">
        <StatsCarousel>{statsCards}</StatsCarousel>
      </div>
      <div className="hidden lg:grid lg:grid-cols-4 gap-4">
        {statsCards.map((card, i) => (
          <div key={i}>{card}</div>
        ))}
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