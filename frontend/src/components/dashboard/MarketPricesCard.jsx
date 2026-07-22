import { useState } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, RefreshCw, ArrowUp, ArrowDown } from 'lucide-react'
import { useMarketPriceSummary } from '../../hooks/useMarketPrices'
import { fetchRealtimePrices } from '../../services/marketPriceService'
import { formatDate } from '../../utils/formatDate'
import toast from 'react-hot-toast'

const formatCOP = (val) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val || 0)

export default function MarketPricesCard() {
  const { data, loading } = useMarketPriceSummary()
  const [realtimeItems, setRealtimeItems] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const trending = realtimeItems || data?.trending || []
  const visible = expanded ? trending : trending.slice(0, 4)
  const isRealtime = !!realtimeItems

  const handleRefresh = async () => {
    setRefreshing(true)
    const toastId = toast.loading('Consultando Centroabastos...')
    try {
      // Scrapea solo la página 1 para el card del dashboard (rápido)
      const result = await fetchRealtimePrices(1)
      if (result.success && result.products.length > 0) {
        const withVariation = result.products.filter(p => p.trend !== 'igual').slice(0, 8)
        setRealtimeItems(withVariation.length > 0 ? withVariation : result.products.slice(0, 6))
        toast.success('Precios actualizados', { id: toastId })
      } else {
        toast.error('No se pudo conectar', { id: toastId })
      }
    } catch {
      toast.error('Error al actualizar', { id: toastId })
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="rounded-3xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.09)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.14)',
        boxShadow: '0 4px 24px -4px rgba(0,0,0,0.22)',
      }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.09)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
            style={{ background: 'linear-gradient(135deg,#258a4e,#1a6e3c)' }}>
            <TrendingUp size={16} strokeWidth={2.2} />
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-white/90">Precios Centroabastos BGA</h3>
            <p className="text-[10px]" style={{ color: isRealtime ? '#4ade80' : 'rgba(255,255,255,0.30)' }}>
              {isRealtime ? '● Tiempo real' : data?.lastUpdated ? `Actualizado: ${formatDate(data.lastUpdated)}` : 'Datos del seed'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Botón actualizar */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: refreshing ? 'rgba(255,255,255,0.30)' : 'rgba(255,255,255,0.65)',
              cursor: refreshing ? 'wait' : 'pointer',
            }}
            title="Actualizar precios en tiempo real"
            onMouseEnter={e => !refreshing && (e.currentTarget.style.background = 'rgba(255,255,255,0.16)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
          >
            <RefreshCw size={13} strokeWidth={2.2} className={refreshing ? 'animate-spin' : ''} />
          </button>

          <Link to="/market-prices"
            className="text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.60)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#4ade80'; e.currentTarget.style.background = 'rgba(255,255,255,0.12)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.60)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}>
            Ver todos →
          </Link>
        </div>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : trending.length === 0 ? (
        <div className="px-5 py-6 text-center">
          <p className="text-white/40 text-sm">Sin datos de precios</p>
          <button onClick={handleRefresh}
            className="mt-2 text-emerald-400 text-xs font-semibold hover:text-emerald-300 transition-colors">
            → Actualizar ahora
          </button>
        </div>
      ) : (
        <>
          <div className="px-5 pt-3 pb-1">
            <p className="text-[10px] text-white/30 uppercase tracking-wider font-bold">
              {isRealtime ? 'Precios actuales con variación' : 'Variaciones recientes'}
            </p>
          </div>

          <div>
            {visible.map((item, i) => (
              <div key={i}
                className="flex items-center justify-between px-5 py-2.5 transition-colors"
                style={{
                  borderBottom: i < visible.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  borderLeft: item.trend === 'subio'
                    ? '3px solid rgba(248,113,113,0.50)'
                    : item.trend === 'bajo'
                    ? '3px solid rgba(74,222,128,0.50)'
                    : '3px solid transparent',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-white/88 truncate">{item.product}</p>
                  <p className="text-[10px] text-white/35 truncate">{item.presentation}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  <div className="text-right">
                    <p className="text-[13px] font-bold"
                      style={{ color: item.trend === 'subio' ? '#fca5a5' : item.trend === 'bajo' ? '#86efac' : 'rgba(255,255,255,0.88)' }}>
                      {formatCOP(item.pricePerKg > 0 ? item.pricePerKg : item.currentPrice)}
                      <span className="text-[10px] text-white/30">/kg</span>
                    </p>
                  </div>
                  {item.trend !== 'igual' && (
                    <div className="flex flex-col items-center w-9"
                      style={{ color: item.trend === 'subio' ? '#f87171' : '#4ade80' }}>
                      {item.trend === 'subio'
                        ? <ArrowUp size={13} strokeWidth={2.5} />
                        : <ArrowDown size={13} strokeWidth={2.5} />}
                      <div className="text-[10px] font-bold">{item.variationPct}%</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {trending.length > 4 && (
            <button onClick={() => setExpanded(!expanded)}
              className="w-full py-2.5 text-[11px] font-semibold text-white/35 hover:text-white/60 transition-colors"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {expanded ? '▲ Ver menos' : `▼ Ver ${trending.length - 4} más`}
            </button>
          )}
        </>
      )}

      {/* Footer */}
      {data?.total > 0 && (
        <div className="px-5 py-2.5 flex items-center justify-between"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
          <span className="text-[10px] text-white/25">{data.total} productos en base de datos</span>
          <span className="text-[10px] text-white/20">preciosnub.centroabastos.com</span>
        </div>
      )}
    </div>
  )
}