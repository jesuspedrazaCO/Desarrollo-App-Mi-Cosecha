import { Users } from 'lucide-react'
import { formatCurrency } from '../../utils/formatCurrency'
import EmptyState from '../common/EmptyState'

export default function ContributorSummary({ data = [], loading, title = 'Aportantes' }) {
  const withPayments = data.filter((d) => d.totalPaid > 0)
  const maxAmount = Math.max(...withPayments.map((d) => d.totalPaid), 1)
  const total = withPayments.reduce((sum, d) => sum + d.totalPaid, 0)

  if (loading) {
    return (
      <div className="rounded-3xl p-5" style={{ background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.14)' }}>
        <p className="text-white/40 text-sm">Cargando aportantes...</p>
      </div>
    )
  }

  return (
    <div className="rounded-3xl p-5" style={{ background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.14)' }}>
      <div className="flex items-center gap-2 mb-4">
        <Users size={18} className="text-emerald-400" strokeWidth={2} />
        <h3 className="text-[15px] font-bold text-white/90">{title}</h3>
      </div>

      {withPayments.length === 0 ? (
        <EmptyState
          icon={<Users size={32} strokeWidth={1.75} />}
          title="Sin aportantes registrados"
          description="Cuando registres un gasto, puedes marcar quién lo pagó."
        />
      ) : (
        <div className="space-y-3">
          {withPayments
            .sort((a, b) => b.totalPaid - a.totalPaid)
            .map((c) => {
              const pct = Math.round((c.totalPaid / maxAmount) * 100)
              const pctOfTotal = total > 0 ? Math.round((c.totalPaid / total) * 100) : 0
              return (
                <div key={c.contributorId}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-white/85">{c.name}</span>
                    <span className="text-sm font-bold text-emerald-300">{formatCurrency(c.totalPaid)}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.10)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #258a4e, #4ade80)' }}
                    />
                  </div>
                  <p className="text-[11px] text-white/35 mt-1">{pctOfTotal}% del total invertido</p>
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}