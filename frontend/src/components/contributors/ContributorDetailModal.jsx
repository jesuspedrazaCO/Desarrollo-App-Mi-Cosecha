import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Modal from '../common/Modal'
import { SkeletonList } from '../common/Skeleton'
import { getContributorDetail } from '../../services/contributorService'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'

export default function ContributorDetailModal({ contributor, onClose, scope = 'all' }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!contributor) return
    let cancelled = false
    setDetail(null)
    setLoading(true)
    getContributorDetail(contributor.contributorId, scope)
      .then((res) => { if (!cancelled) setDetail(res.data.data) })
      .catch(() => { if (!cancelled) toast.error('Error al cargar el detalle') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [contributor, scope])

  return (
    <Modal isOpen={!!contributor} onClose={onClose} title={contributor ? `Aportes de ${contributor.name}` : ''} size="md">
      {loading || !detail ? (
        <SkeletonList rows={3} />
      ) : detail.crops.length === 0 ? (
        <p className="text-white/40 text-sm">
          {scope === 'active' ? 'Esta persona no tiene aportes en cultivos activos.' : 'Esta persona aún no tiene aportes registrados.'}
        </p>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/50">
              Total aportado · {scope === 'active' ? 'cultivos activos' : 'todos los cultivos'}
            </span>
            <span className="text-base font-bold text-emerald-300">{formatCurrency(detail.totalPaid)}</span>
          </div>

          {detail.crops.map((crop) => (
            <div
              key={crop.cropId || 'general'}
              className="rounded-2xl p-3"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-white/85">{crop.cropName}</span>
                <span className="text-sm font-bold text-emerald-300">{formatCurrency(crop.total)}</span>
              </div>
              <div className="space-y-1">
                {crop.items.map((item) => (
                  <div key={item.expenseId} className="flex items-center gap-2 text-[12px]">
                    <span className="text-white/40 w-[72px] flex-shrink-0">{formatDate(item.date)}</span>
                    <span className="text-white/60 flex-1 truncate">{item.description}</span>
                    <span className="text-white/80 font-medium flex-shrink-0">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}