import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMarketPriceSummary } from '../../hooks/useMarketPrices'
import { formatDate } from '../../utils/formatDate'

const formatCOP = (val) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val || 0)

const TrendBadge = ({ trend, variation }) => {
  if (trend === 'subio') return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: 'rgba(185,28,28,0.20)', color: '#f87171', border: '1px solid rgba(248,113,113,0.30)' }}>
      ↑ {variation}%
    </span>
  )
  if (trend === 'bajo') return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: 'rgba(21,128,61,0.20)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.30)' }}>
      ↓ {variation}%
    </span>
  )
  return null
}

export default function MarketPricesCard() {
  const { data, loading } = useMarketPriceSummary()
  const [expanded, setExpanded] = useState(false)

  const trending = data?.trending || []
  const visible = expanded ? trending : trending.slice(0, 4)

  return (
    <div className="rounded-3xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.09)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.14)', boxShadow: '0 4px 24px -4px rgba(0,0,0,0.22)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.09)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
            style={{ background: 'linear-gradient(135deg,#258a4e,#1a6e3c)' }}>
            📈
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-white/90">Precios Centroabastos BGA</h3>
            {data?.lastUpdated && (
              <p className="text-[10px] text-white/35">
                Actualizado: {formatDate(data.lastUpdated)}
              </p>
            )}
          </div>
        </div>
        <Link to="/market-prices"
          className="text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all"
          style={{ background: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.70)' }}
          onMouseEnter={e => e.currentTarget.style.color = '#4ade80'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.70)'}>
          Ver todos →
        </Link>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : trending.length === 0 ? (
        <div className="px-5 py-6 text-center">
          <p className="text-white/40 text-sm">No hay datos de precios disponibles</p>
          <p className="text-white/25 text-xs mt-1">Ejecuta el seed de precios en el backend</p>
        </div>
      ) : (
        <>
          {/* Subtítulo */}
          <div className="px-5 pt-3 pb-1">
            <p className="text-[11px] text-white/35 uppercase tracking-wider font-bold">
              Variaciones recientes
            </p>
          </div>

          {/* Lista de productos con variación */}
          <div>
            {visible.map((item, i) => (
              <div key={item._id} className="flex items-center justify-between px-5 py-2.5 transition-colors"
                style={{ borderBottom: i < visible.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-white/88 truncate">{item.product}</p>
                  <p className="text-[10px] text-white/38 truncate">{item.presentation}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  <div className="text-right">
                    <p className="text-[13px] font-bold text-white/90">{formatCOP(item.pricePerKg)}<span className="text-[10px] text-white/35">/kg</span></p>
                  </div>
                  <TrendBadge trend={item.trend} variation={item.variationPct} />
                </div>
              </div>
            ))}
          </div>

          {/* Ver más / menos */}
          {trending.length > 4 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full py-2.5 text-[11px] font-semibold text-white/40 hover:text-white/70 transition-colors"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {expanded ? '▲ Ver menos' : `▼ Ver ${trending.length - 4} más`}
            </button>
          )}
        </>
      )}

      {/* Footer: total de productos */}
      {data?.total > 0 && (
        <div className="px-5 py-3 flex items-center justify-between"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)' }}>
          <span className="text-[10px] text-white/30">{data.total} productos monitoreados</span>
          <span className="text-[10px] text-white/30">Fuente: preciosnub.centroabastos.com</span>
        </div>
      )}
    </div>
  )
}
