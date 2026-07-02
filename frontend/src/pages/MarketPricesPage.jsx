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
  frutas: '🍎 Frutas',
  verduras: '🥦 Verduras',
  tuberculos: '🥔 Tubérculos',
  granos: '🌾 Granos',
  lacteos: '🥛 Lácteos',
  carnes: '🥩 Carnes',
  pescados: '🐟 Pescados',
  procesados: '🛒 Procesados',
  otros: '📦 Otros',
}

const TrendIcon = ({ trend, variation }) => {
  if (trend === 'subio') return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="text-[18px] leading-none">↑</span>
      <span className="text-[10px] font-bold" style={{ color: '#f87171' }}>{variation}%</span>
    </div>
  )
  if (trend === 'bajo') return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="text-[18px] leading-none">↓</span>
      <span className="text-[10px] font-bold" style={{ color: '#4ade80' }}>{variation}%</span>
    </div>
  )
  return <span className="text-[16px] text-white/20">—</span>
}

export default function MarketPricesPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [categories, setCategories] = useState([])
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const { prices, total, lastUpdated, loading } = useMarketPrices(
    category || debouncedSearch ? { search: debouncedSearch, category } : {}
  )

  // Debounce de búsqueda
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

  const catOrder = ['frutas', 'verduras', 'tuberculos', 'granos', 'carnes', 'pescados', 'lacteos', 'procesados', 'otros']

  return (
    <div className="space-y-6 animate-float-up">
      {/* Header */}
      <div>
        <h1 className="page-title">Precios de mercado 📈</h1>
        <p className="text-white/50 text-sm mt-1">
          Centroabastos Bucaramanga
          {lastUpdated && <> · Actualizado: <strong className="text-white/70">{formatDate(lastUpdated)}</strong></>}
          {total > 0 && <> · {total} productos</>}
        </p>
      </div>

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

      {/* Leyenda de tendencias */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-white/50">
          <span style={{ color: '#f87171', fontWeight: 700 }}>↑ Subió</span> precio vs. última actualización
        </div>
        <div className="flex items-center gap-1.5 text-xs text-white/50">
          <span style={{ color: '#4ade80', fontWeight: 700 }}>↓ Bajó</span> precio vs. última actualización
        </div>
        <div className="flex items-center gap-1.5 text-xs text-white/50">
          <span className="text-white/30">— Sin cambio</span>
        </div>
      </div>

      {/* Contenido */}
      {loading ? (
        <Spinner size="lg" className="mt-16" />
      ) : prices.length === 0 ? (
        <EmptyState
          icon="📈"
          title="No se encontraron productos"
          description={search ? `No hay resultados para "${search}"` : 'No hay datos de precios disponibles'}
        />
      ) : (
        <div className="space-y-6">
          {catOrder
            .filter(cat => grouped[cat] && (category === '' || category === cat))
            .map(cat => (
              <div key={cat}>
                {/* Encabezado de categoría */}
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-[13px] font-bold text-white/60 uppercase tracking-wider">
                    {CATEGORY_LABELS[cat] || cat}
                  </h2>
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <span className="text-[11px] text-white/30">{grouped[cat].length} productos</span>
                </div>

                {/* Grid de productos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {grouped[cat].map(item => (
                    <div
                      key={item._id}
                      className="rounded-2xl px-4 py-3 flex items-center justify-between gap-3 transition-all duration-200"
                      style={{
                        background: 'rgba(255,255,255,0.07)',
                        border: '1px solid rgba(255,255,255,0.10)',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.11)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                    >
                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold text-white/90 truncate">{item.product}</p>
                        <p className="text-[11px] text-white/40 truncate">{item.presentation}</p>
                        {item.previousPrice > 0 && item.previousPrice !== item.currentPrice && (
                          <p className="text-[10px] text-white/30 mt-0.5">
                            Anterior: {formatCOP(item.previousPrice)}
                          </p>
                        )}
                      </div>

                      {/* Precio y tendencia */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-[14px] font-bold" style={{
                            color: item.trend === 'subio' ? '#fca5a5' : item.trend === 'bajo' ? '#86efac' : 'rgba(255,255,255,0.88)'
                          }}>
                            {formatCOP(item.currentPrice)}
                          </p>
                          <p className="text-[10px] text-white/35">{formatCOP(item.pricePerKg)}/kg</p>
                        </div>
                        <div style={{ color: item.trend === 'subio' ? '#f87171' : item.trend === 'bajo' ? '#4ade80' : 'rgba(255,255,255,0.20)' }}>
                          <TrendIcon trend={item.trend} variation={item.variationPct} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Nota de fuente */}
      <p className="text-[11px] text-white/25 text-center pb-2">
        Fuente: preciosnub.centroabastos.com · Los precios pueden variar según oferta y demanda
      </p>
    </div>
  )
}
