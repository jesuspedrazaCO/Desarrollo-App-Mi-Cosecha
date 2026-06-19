import { formatDate } from '../../utils/formatDate'
import { formatCurrency } from '../../utils/formatCurrency'
import EmptyState from '../common/EmptyState'

export default function AlertsPanel({ alerts = [] }) {
  const icons = { pago: '💸', cosecha: '🌾' }
  const colors = { pago: 'bg-red-50 text-red-600', cosecha: 'bg-amber-50 text-amber-700' }

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-card border border-white/60">
      <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-2">
        <span className="text-lg">🔔</span>
        <h3 className="section-title">Alertas importantes</h3>
      </div>
      <div className="divide-y divide-stone-50">
        {alerts.length === 0 ? (
          <EmptyState icon="✅" title="Todo bajo control" description="No tienes alertas pendientes por ahora" />
        ) : (
          alerts.map((alert, i) => (
            <div key={i} className="px-5 py-3.5 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${colors[alert.type] || 'bg-stone-100'}`}>
                {icons[alert.type] || '📌'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-800 truncate">{alert.message}</p>
                <p className="text-xs text-stone-400">
                  {formatDate(alert.date)}
                  {alert.amount > 0 && <> · {formatCurrency(alert.amount)}</>}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}