import { formatDate } from '../../utils/formatDate'
import { formatCurrency } from '../../utils/formatCurrency'
import EmptyState from '../common/EmptyState'

export default function RecentTransactions({ transactions = [] }) {
  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-card border border-white/60">
      <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-2">
        <span className="text-lg">💳</span>
        <h3 className="section-title">Transacciones recientes</h3>
      </div>
      <div className="divide-y divide-stone-50">
        {transactions.length === 0 ? (
          <EmptyState icon="💳" title="Sin transacciones" description="Registra gastos e ingresos para verlos aquí" />
        ) : (
          transactions.map((t, i) => (
            <div key={i} className="px-5 py-3.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-stone-800 truncate">{t.description}</p>
                <p className="text-xs text-stone-400">{formatDate(t.date)}</p>
              </div>
              <span className={`text-sm font-bold flex-shrink-0 ${t.type === 'income' ? 'text-primary-600' : 'text-accent-700'}`}>
                {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}