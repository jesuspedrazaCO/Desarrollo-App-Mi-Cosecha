import { useState, useEffect } from 'react'
import { useMarketPrices } from '../hooks/useMarketPrices'
import { getMarketPriceCategories } from '../services/marketPriceService'
import SearchBar from '../components/common/SearchBar'
import Spinner from '../components/common/Spinner'
import EmptyState from '../components/common/EmptyState'
import { formatDate } from '../utils/formatDate'

const formatCOP = (val) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val || 0)

const CATEGORY_LABELS = {
  frutas:     '🍎 Frutas',
  verduras:   '🥦 Verduras',
  tuberculos: '🥔 Tubérculos',
  granos:     '🌾 Granos',
  lacteos:    '🥛 Lácteos y Huevos',
  carnes:     '🥩 Carnes',
  pescados:   '🐟 Pescados',
  procesados: '🛒 Procesados',
  otros:      '📦 Otros',
}

const catOrder = ['frutas', 'verduras', 'tuberculos', 'granos', 'carnes', 'pescados', 'lacteos', 'procesados', 'otros']

export default function MarketPricesPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [categories, setCategories] = useState([])
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const {
    prices, total, lastUpdated, loading, refreshing, isRealtime,
    params, setParams, refreshRealtime,
  } = useMarketPrices(
    category || debouncedSearch ? { search: debouncedSearch, category } : {}
  )

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    getMarketPriceCategories().then(r => setCategories(r.data)).catch(() => {})
  }, [])

  // Agrupar por categoría
  const grouped = prices.reduce((acc, p) => {
    const cat = p.category || 'otros'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(p)
    return acc
  }, {})

  return (
    <div className="space-y-5 animate-float-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="page-title">Precios de mercado 📈</h1>
          <p className="text-white/45 text-sm mt-1">
            Centroabastos Bucaramanga
            {lastUpdated && (
              <> · <span className={isRealtime ? 'text-emerald-400' : 'text-white/45'}>
                {isRealtime ? '🟢 Tiempo real' : `Actualizado: ${formatDate(lastUpdated)}`}
              </span></>
            )}
            {total > 0 && <> · <strong className="text-white/60">{total} productos</strong></>}
          </p>
        </div>

        {/* Botón de actualizar en tiempo real */}
        <button
          onClick={refreshRealtime}
          disabled={refreshing}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-[13px] transition-all duration-200 flex-shrink-0"
          style={{
            background: refreshing
              ? 'rgba(255,255,255,0.08)'
              : 'linear-gradient(135deg,#258a4e,#1a6e3c)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.15)',
            cursor: refreshing ? 'wait' : 'pointer',
            opacity: refreshing ? 0.7 : 1,
          }}
        >
          {refreshing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Consultando Centroabastos...
            </>
          ) : (
            <>
              🔄 Actualizar precios ahora
            </>
          )}
        </button>
      </div>

      {/* Aviso de tiempo real */}
      {isRealtime && (
        <div className="rounded-2xl px-4 py-3 flex items-center gap-2"
          style={{ background: 'rgba(21,128,61,0.15)', border: '1px solid rgba(74,222,128,0.25)' }}>
          <span className="text-emerald-400 text-lg">✅</span>
          <p className="text-sm text-emerald-300 font-medium">
            Precios actualizados en tiempo real desde preciosnub.centroabastos.com
          </p>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Buscar producto..."
          className="flex-1 max-w-sm"
        />
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          style={{
            background: 'rgba(255,255,255,0.85)',
            color: '#1c1917',
            border: '1px solid rgba(200,200,200,0.5)',
            borderRadius: '99px',
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: '600',
          }}
        >
          <option value="">Todas las categorías</option>
          {catOrder.filter(c => categories.includes(c)).map(c => (
            <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>
          ))}
        </select>
      </div>

      {/* Leyenda */}
      <div className="flex gap-4 flex-wrap text-xs text-white/40">
        <span><strong style={{ color: '#f87171' }}>↑ Subió</strong> vs. última actualización</span>
        <span><strong style={{ color: '#4ade80' }}>↓ Bajó</strong> vs. última actualización</span>
        <span className="text-white/25">— Sin cambio</span>
      </div>

      {/* Contenido */}
      {loading ? (
        <Spinner size="lg" className="mt-16" />
      ) : prices.length === 0 ? (
        <EmptyState
          icon="📈"
          title="No se encontraron productos"
          description={search ? `No hay resultados para "${search}"` : 'Haz clic en "Actualizar precios ahora" para cargar datos en tiempo real'}
          action={
            <button onClick={refreshRealtime} disabled={refreshing}
              className="px-5 py-2.5 rounded-full text-white text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg,#258a4e,#1a6e3c)' }}>
              🔄 Actualizar ahora
            </button>
          }
        />
      ) : (
        <div className="space-y-6">
          {catOrder
            .filter(cat => grouped[cat] && (category === '' || category === cat))
            .map(cat => (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-[12px] font-bold text-white/55 uppercase tracking-wider">
                    {CATEGORY_LABELS[cat] || cat}
                  </h2>
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <span className="text-[11px] text-white/25">{grouped[cat].length} productos</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {grouped[cat].map((item, idx) => (
                    <div key={idx}
                      className="rounded-2xl px-4 py-3 flex items-center justify-between gap-3 transition-all duration-150"
                      style={{
                        background: 'rgba(255,255,255,0.07)',
                        border: `1px solid ${
                          item.trend === 'subio' ? 'rgba(248,113,113,0.20)' :
                          item.trend === 'bajo'  ? 'rgba(74,222,128,0.20)' :
                          'rgba(255,255,255,0.09)'
                        }`,
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.11)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-white/88 truncate">{item.product}</p>
                        <p className="text-[10px] text-white/38 truncate">{item.presentation}</p>
                        {item.previousPrice > 0 && item.previousPrice !== item.currentPrice && (
                          <p className="text-[10px] text-white/28 mt-0.5">
                            Anterior: {formatCOP(item.previousPrice)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-[14px] font-bold" style={{
                            color: item.trend === 'subio' ? '#fca5a5' :
                                   item.trend === 'bajo'  ? '#86efac' :
                                   'rgba(255,255,255,0.88)'
                          }}>
                            {formatCOP(item.currentPrice)}
                          </p>
                          {item.pricePerKg > 0 && item.pricePerKg !== item.currentPrice && (
                            <p className="text-[10px] text-white/30">{formatCOP(item.pricePerKg)}/kg</p>
                          )}
                        </div>
                        {item.trend !== 'igual' && (
                          <div className="text-center w-10"
                            style={{ color: item.trend === 'subio' ? '#f87171' : '#4ade80' }}>
                            <div className="text-[16px] leading-none">{item.trend === 'subio' ? '↑' : '↓'}</div>
                            <div className="text-[10px] font-bold">{item.variationPct}%</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      <p className="text-[11px] text-white/20 text-center pb-2">
        Fuente: preciosnub.centroabastos.com · Los precios pueden variar según oferta y demanda
      </p>
    </div>
  )
}
