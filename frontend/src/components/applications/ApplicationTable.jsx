import { formatDate } from '../../utils/formatDate'
import { APPLICATION_TYPES } from '../../utils/constants'
import Badge from '../common/Badge'
import Button from '../common/Button'
import EmptyState from '../common/EmptyState'
import { SkeletonCards } from '../common/Skeleton'

const fmt = (n) => Number(n).toLocaleString('es-CO', { maximumFractionDigits: 2 })

// Historial en tarjetas: cada tarjeta es UNA aplicación (ej: una caneca de 200 L)
// con todos los productos que llevó adentro. (El nombre del archivo se conserva
// para no cambiar los imports existentes.)
export default function ApplicationTable({ applications, loading, onEdit, onDelete }) {
  const getTypeInfo = (val) => APPLICATION_TYPES.find(t => t.value === val) || APPLICATION_TYPES[3]

  // Registros antiguos (un producto por registro) se muestran como una sola línea.
  const getItems = (a) => {
    if (Array.isArray(a.items) && a.items.length > 0) return a.items
    if (a.product) return [{ product: a.product, quantity: a.quantity, unit: a.unit }]
    return []
  }

  if (loading) return <SkeletonCards count={2} />
  if (!applications || applications.length === 0) {
    return <EmptyState icon="🧪" title="No hay aplicaciones registradas" />
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 p-3">
      {applications.map((a) => {
        const info = getTypeInfo(a.type)
        const items = getItems(a)
        return (
          <div
            key={a._id}
            className="rounded-3xl p-4 flex flex-col"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-white/90">{formatDate(a.date)}</span>
                  <Badge color="green">{info.icon} {info.label}</Badge>
                </div>
                {a.tankVolume ? (
                  <p className="text-xs text-white/55 mt-1.5">
                    🪣 {a.tankCount > 1
                      ? <><strong className="text-white/80">{a.tankCount} canecas</strong> de {fmt(a.tankVolume)} {a.tankUnit} = <strong className="text-white/80">{fmt(a.tankVolume * a.tankCount)} {a.tankUnit}</strong></>
                      : <>Caneca de <strong className="text-white/80">{fmt(a.tankVolume)} {a.tankUnit}</strong></>}
                  </p>
                ) : a.tankCount > 1 ? (
                  <p className="text-xs text-white/55 mt-1.5">🪣 <strong className="text-white/80">{a.tankCount} canecas</strong></p>
                ) : null}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <Button size="sm" variant="ghost" onClick={() => onEdit(a)}>✏️</Button>
                <Button size="sm" variant="ghost" onClick={() => onDelete(a)}>🗑️</Button>
              </div>
            </div>

            <ul className="mt-3 space-y-1.5">
              {items.map((it, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm"
                  style={{ background: 'rgba(0,0,0,0.18)' }}
                >
                  <span className="text-white/85 font-medium truncate">{it.product}</span>
                  <span className="text-emerald-300 font-semibold flex-shrink-0 text-right">
                    {fmt(it.quantity)} {it.unit}
                    {a.tankCount > 1 && it.perTank > 0 && (
                      <span className="block text-[10px] font-normal text-white/40">{fmt(it.perTank)} {it.unit} por caneca</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>

            {a.observations && (
              <p className="text-xs text-white/45 mt-3 pt-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                {a.observations}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}