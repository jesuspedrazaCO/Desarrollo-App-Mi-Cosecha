import { formatDate } from '../../utils/formatDate'
import Spinner from '../common/Spinner'
import EmptyState from '../common/EmptyState'

// El "contador": cuánto se ha usado de cada producto en total en este cultivo,
// para saber por ejemplo "15 bultos de Abono Triple 15" sin tener que sumar
// a mano cada aplicación.
export default function ApplicationSummary({ summary, loading }) {
  if (loading) return <Spinner className="py-8" />
  if (!summary || summary.length === 0) {
    return <EmptyState icon="🧮" title="Aún no hay insumos registrados para contar" />
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {summary.map((item) => (
        <div
          key={`${item.product}-${item.unit}`}
          className="rounded-3xl p-4"
          style={{ background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.14)' }}
        >
          <p className="text-sm font-bold text-white/90 truncate">{item.product}</p>
          <p className="text-2xl font-bold text-emerald-300 mt-2">
            {item.totalQuantity.toLocaleString('es-CO')} <span className="text-sm font-semibold text-white/50">{item.unit}</span>
          </p>
          <p className="text-xs text-white/40 mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            {item.applicationsCount} {item.applicationsCount === 1 ? 'aplicación' : 'aplicaciones'} · última: {formatDate(item.lastDate)}
          </p>
        </div>
      ))}
    </div>
  )
}