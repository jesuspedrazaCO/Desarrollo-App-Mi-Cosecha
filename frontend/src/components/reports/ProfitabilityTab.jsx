import { useEffect, useState } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts'
import toast from 'react-hot-toast'
import { getProfitabilityReport } from '../../services/reportService'
import { formatCurrency, formatCurrencyCompact } from '../../utils/formatCurrency'
import { exportProfitabilityReport } from '../../utils/pdfExport'
import Spinner from '../common/Spinner'
import EmptyState from '../common/EmptyState'
import ExportPDFButton from '../common/ExportPDFButton'

const card = { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)' }
const good = { background: 'rgba(21,128,61,0.15)', border: '1px solid rgba(21,128,61,0.3)' }
const bad = { background: 'rgba(185,28,28,0.15)', border: '1px solid rgba(185,28,28,0.3)' }
const warn = { background: 'rgba(194,65,12,0.15)', border: '1px solid rgba(194,65,12,0.3)' }

const monthLabel = (m) => {
  const [y, mo] = String(m).split('-')
  return new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString('es-CO', { month: 'short', year: '2-digit' })
}
const pct = (v) => (v === null || v === undefined ? '—' : `${Number(v).toLocaleString('es-CO')}%`)
const catLabel = (c) => String(c || 'otros').replace(/_/g, ' ')

// Frase corta y clara sobre cómo va el cultivo.
const verdictText = (c) => {
  switch (c.verdict) {
    case 'muy_rentable':
      return { tone: good, icon: '🚀', text: `Muy rentable: por cada $1.000 invertidos quedaron ${formatCurrency(c.roi * 10)} de ganancia.` }
    case 'rentable':
      return { tone: good, icon: '✅', text: `Rentable: ya recuperaste la inversión y por cada $1.000 invertidos quedaron ${formatCurrency(c.roi * 10)} de ganancia.` }
    case 'por_recuperar':
      return { tone: warn, icon: '⏳', text: `Aún faltan ${formatCurrency(Math.abs(c.netProfit))} para recuperar lo invertido.` }
    case 'sin_ventas':
      return { tone: warn, icon: '🌱', text: `Todavía sin ventas: llevas ${formatCurrency(c.totalInvested)} invertidos.` }
    default:
      return { tone: card, icon: '📝', text: 'Aún no hay gastos ni ventas registrados en este cultivo.' }
  }
}

function Kpi({ label, value, hint, tone = card, valueColor = '#fff' }) {
  return (
    <div className="rounded-3xl p-5" style={tone}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">{label}</p>
      <p className="text-xl font-bold mt-1 font-display" style={{ color: valueColor }}>{value}</p>
      {hint && <p className="text-xs text-white/40 mt-1">{hint}</p>}
    </div>
  )
}

function CumulativeTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const m = payload[0].payload
  return (
    <div className="rounded-2xl px-3 py-2 text-xs" style={{ background: 'rgba(15,30,20,0.92)', border: '1px solid rgba(255,255,255,0.18)', color: '#fff' }}>
      <p className="font-bold mb-1">{monthLabel(label)}</p>
      <p>Gastos: {formatCurrency(m.expenses)}</p>
      <p>Ventas: {formatCurrency(m.income)}</p>
      <p className="font-bold mt-1">Acumulado: {formatCurrency(m.cumulative)}</p>
    </div>
  )
}

export default function ProfitabilityTab({ crops = [], user = null }) {
  const [cropId, setCropId] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    getProfitabilityReport(cropId ? { crop: cropId } : {})
      .then((res) => alive && setData(res.data))
      .catch(() => alive && toast.error('No se pudo cargar la rentabilidad'))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [cropId])

  const single = cropId && data?.crops?.length === 1 ? data.crops[0] : null

  const handleExport = () => {
    if (!data?.crops?.length) return toast.error('No hay datos para exportar')
    exportProfitabilityReport(data, user)
    toast.success('PDF generado correctamente')
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-end justify-between">
        <div className="w-full sm:max-w-xs">
          <label className="block text-[13px] font-semibold text-white/70 mb-1.5">Cultivo</label>
          <select
            value={cropId}
            onChange={(e) => setCropId(e.target.value)}
            style={{ background: 'rgba(255,255,255,0.85)', color: '#1c1917' }}
            className="w-full rounded-2xl px-4 py-2.5 text-sm outline-none"
          >
            <option value="">Todos los cultivos</option>
            {crops.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
        <ExportPDFButton onExport={handleExport} label="Informe de rentabilidad (PDF)" />
      </div>

      {loading ? (
        <Spinner size="lg" className="mt-10" />
      ) : !data?.crops?.length ? (
        <EmptyState icon="💹" title="Sin cultivos para analizar" description="Crea un cultivo y registra sus gastos y ventas para ver su rentabilidad" />
      ) : single ? (
        <CropDetail c={single} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Kpi label="💰 Total invertido" value={formatCurrency(data.totals.totalInvested)} tone={warn} valueColor="#fff" />
            <Kpi label="📈 Total vendido" value={formatCurrency(data.totals.totalSold)} tone={good} />
            <Kpi label={data.totals.netProfit >= 0 ? '✅ Ganancia neta' : '⚠️ Resultado neto'} value={formatCurrency(data.totals.netProfit)} tone={data.totals.netProfit >= 0 ? good : bad} />
            <Kpi label="📊 Rentabilidad (ROI)" value={pct(data.totals.roi)} hint="ganancia sobre lo invertido" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.crops.map((c) => {
              const v = verdictText(c)
              return (
                <button
                  key={c.crop._id}
                  type="button"
                  onClick={() => setCropId(c.crop._id)}
                  className="text-left rounded-3xl p-5 transition-all hover:-translate-y-0.5"
                  style={v.tone}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-white">{c.crop.name}</p>
                      <p className="text-xs text-white/50">{c.crop.type}{c.hectares ? ` · ${c.hectares} ha` : ''}</p>
                    </div>
                    <p className="text-lg font-bold font-display text-white">{pct(c.roi)}</p>
                  </div>
                  <p className="text-sm text-white/80 mt-3">{v.icon} {v.text}</p>
                  <p className="text-xs text-white/45 mt-2">
                    Invertido {formatCurrencyCompact(c.totalInvested)} · Vendido {formatCurrencyCompact(c.totalSold)}
                    {c.costPerKg ? ` · Costo ${formatCurrency(c.costPerKg)}/kg` : ''}
                  </p>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function CropDetail({ c }) {
  const v = verdictText(c)
  return (
    <div className="space-y-5">
      <div className="rounded-3xl p-5" style={v.tone}>
        <p className="text-white font-semibold">{v.icon} {v.text}</p>
        {c.recoveredMonth && <p className="text-xs text-white/60 mt-1">Recuperaste la inversión en {monthLabel(c.recoveredMonth)}.</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="💰 Invertido" value={formatCurrency(c.totalInvested)} hint={`${c.expenseCount} gastos`} tone={warn} />
        <Kpi label="📈 Vendido" value={formatCurrency(c.totalSold)} hint={`${c.saleCount} ventas`} tone={good} />
        <Kpi label={c.netProfit >= 0 ? '✅ Ganancia neta' : '⚠️ Resultado neto'} value={formatCurrency(c.netProfit)} tone={c.netProfit >= 0 ? good : bad} />
        <Kpi label="📊 ROI" value={pct(c.roi)} hint={c.margin !== null ? `margen ${pct(c.margin)} sobre ventas` : 'ganancia sobre lo invertido'} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Costo de producir 1 kg" value={c.costPerKg ? formatCurrency(c.costPerKg) : '—'} hint={c.kgSold ? `${c.kgSold.toLocaleString('es-CO')} kg vendidos` : 'registra ventas en kg'} />
        <Kpi label="Precio promedio de venta" value={c.avgPricePerKg ? formatCurrency(c.avgPricePerKg) : '—'} hint="por kg" />
        <Kpi label="Punto de equilibrio" value={c.breakEvenKg ? `${c.breakEvenKg.toLocaleString('es-CO')} kg` : '—'} hint="kilos para cubrir lo invertido" />
        <Kpi label="Ganancia por hectárea" value={c.perHectare ? formatCurrency(c.perHectare.netProfit) : '—'} hint={c.hectares ? `${c.hectares} ha` : 'agrega el tamaño del terreno'} />
      </div>

      {c.monthly.length > 0 && (
        <div className="rounded-3xl p-5" style={card}>
          <h3 className="text-white font-bold mb-1">Cómo va la plata mes a mes</h3>
          <p className="text-xs text-white/50 mb-3">Cuando la línea cruza el cero, ya recuperaste lo invertido.</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={c.monthly} margin={{ top: 8, right: 12, left: -4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.12)" vertical={false} />
              <XAxis dataKey="month" tickFormatter={monthLabel} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.6)' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatCurrencyCompact} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.6)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CumulativeTooltip />} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.5)" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="cumulative" stroke="#4ade80" strokeWidth={2.5} dot={{ r: 3 }} name="Acumulado" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {c.byCategory.length > 0 && (
        <div className="rounded-3xl p-5" style={card}>
          <h3 className="text-white font-bold mb-3">En qué se fue la inversión</h3>
          <div className="space-y-3">
            {c.byCategory.map((k) => (
              <div key={k.category}>
                <div className="flex justify-between text-sm text-white/85">
                  <span className="capitalize">{catLabel(k.category)}</span>
                  <span>{formatCurrency(k.total)} · {k.percent}%</span>
                </div>
                <div className="h-2 rounded-full mt-1" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <div className="h-2 rounded-full" style={{ width: `${Math.min(100, k.percent)}%`, background: '#fb923c' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {c.products.length > 0 && (
        <div className="rounded-3xl p-5" style={card}>
          <h3 className="text-white font-bold mb-3">Qué se vendió</h3>
          <div className="space-y-2">
            {c.products.map((p) => (
              <div key={`${p.variety}-${p.unit}`} className="flex justify-between text-sm text-white/85">
                <span>{p.variety} · {p.quantity.toLocaleString('es-CO')} {p.unit}</span>
                <span className="font-semibold">{formatCurrency(p.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}