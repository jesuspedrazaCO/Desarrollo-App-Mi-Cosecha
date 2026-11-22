import { useState } from 'react'
import { Wallet, TrendingUp, CheckCircle2, AlertTriangle, Home } from 'lucide-react'
import { useDashboard } from '../hooks/useDashboard'
import StatsCard from '../components/dashboard/StatsCard'
import StatsCarousel from '../components/dashboard/StatsCarousel'
import AlertsPanel from '../components/dashboard/AlertsPanel'
import CropsSummary from '../components/dashboard/CropsSummary'
import UpcomingEvents from '../components/dashboard/UpcomingEvents'
import QuickChart from '../components/dashboard/QuickChart'
import MarketPricesCard from '../components/dashboard/MarketPricesCard'
import { formatDateLong } from '../utils/formatDate'
import { useAuth } from '../hooks/useAuth'
import { SkeletonDashboard } from '../components/common/Skeleton'

const SCOPE_KEY = 'dashboardScope'
const readScope = () => {
  try { return localStorage.getItem(SCOPE_KEY) === 'all' ? 'all' : 'active' } catch { return 'active' }
}

export default function DashboardPage() {
  const [scope, setScope] = useState(readScope)
  const { data, loading, switching } = useDashboard(scope)
  const changeScope = (value) => {
    setScope(value)
    try { localStorage.setItem(SCOPE_KEY, value) } catch { /* sin almacenamiento: no pasa nada */ }
  }
  const { user } = useAuth()

  if (loading) return <SkeletonDashboard />

  const { summary, cropsSummary, upcomingEvents, alerts } = data || {}
  const isProfit = summary?.totalProfit >= 0

  const statsCards = [
    <StatsCard
      title="Total invertido"
      value={summary?.totalInvested}
      icon={<Wallet size={20} strokeWidth={2} />}
      color="accent"
      subtitle={scope === 'active' ? 'En cultivos activos' : 'En todos tus cultivos'}
    />,
    <StatsCard
      title="Total vendido"
      value={summary?.totalIncome}
      icon={<TrendingUp size={20} strokeWidth={2} />}
      color="green"
      subtitle="Ingresos por ventas"
    />,
    <StatsCard
      title="Ganancia neta"
      value={summary?.totalProfit}
      icon={isProfit ? <CheckCircle2 size={20} strokeWidth={2} /> : <AlertTriangle size={20} strokeWidth={2} />}
      color={isProfit ? 'green' : 'red'}
      subtitle="Inversión vs. ventas"
    />,
    <StatsCard
      title="Gastos del hogar"
      value={summary?.householdTotalMonth}
      icon={<Home size={20} strokeWidth={2} />}
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

      {/* Interruptor: totales de todos los cultivos o solo de los activos (gastos del hogar no cambian) */}
      <div className="flex items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Qué cultivos se cuentan en los totales"
          className="inline-flex rounded-full p-1"
          style={{ background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.14)' }}
        >
          {[{ value: 'active', label: 'Solo activos' }, { value: 'all', label: 'Todo' }].map((o) => (
            <button
              key={o.value}
              type="button"
              aria-pressed={scope === o.value}
              onClick={() => changeScope(o.value)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                scope === o.value ? 'bg-primary-600 text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-white/40 text-right">
          {scope === 'active' ? 'Sin cultivos finalizados ni suspendidos' : 'Incluye cultivos finalizados y suspendidos'}
        </p>
      </div>

      {/* Estadísticas — carrusel en móvil, grid en escritorio */}
      <div className={`space-y-6 transition-opacity ${switching ? 'opacity-60' : ''}`}>
        <div className="lg:hidden">
          <StatsCarousel>{statsCards}</StatsCarousel>
        </div>
        <div className="hidden lg:grid lg:grid-cols-4 gap-4">
          {statsCards.map((card, i) => (
            <div key={i}>{card}</div>
          ))}
        </div>
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