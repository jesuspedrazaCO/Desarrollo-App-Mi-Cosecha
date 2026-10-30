import { useState } from 'react'
import { formatDate } from '../../utils/formatDate'
import { formatCurrency } from '../../utils/formatCurrency'
import ReceiptViewer from './ReceiptViewer'
import Button from '../common/Button'
import EmptyState from '../common/EmptyState'
import { SkeletonGallery } from '../common/Skeleton'

export default function ReceiptGallery({ receipts, loading, onDelete }) {
  const [viewing, setViewing] = useState(null)

  if (loading) return <SkeletonGallery />

  if (receipts.length === 0) {
    return (
      <EmptyState
        icon="🧾"
        title="No hay comprobantes"
        description="Sube facturas, recibos o fotos de tus comprobantes de pago"
      />
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {receipts.map((receipt) => {
          const isRecibo = receipt.kind === 'recibo'
          const isImage = receipt.fileType?.startsWith('image/')
          // Usar fileUrl de Cloudinary si existe, sino fallback
          const fileUrl = receipt.fileUrl || receipt.fileName

          return (
            <div key={receipt._id}
              className="rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 group"
              style={{ background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.14)', boxShadow: '0 4px 16px rgba(0,0,0,0.20)' }}>

              {isRecibo ? (
                <div className="h-36 px-3 py-2 overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">🧾</span>
                    <span className="text-sm font-bold text-orange-300">{formatCurrency(receipt.amount)}</span>
                  </div>
                  <ul className="mt-1.5 space-y-0.5">
                    {(receipt.items || []).slice(0, 4).map((it, i) => (
                      <li key={i} className="text-[10px] text-white/60 truncate">• {it.description}</li>
                    ))}
                    {(receipt.items || []).length > 4 && <li className="text-[10px] text-white/35">+{receipt.items.length - 4} más</li>}
                  </ul>
                </div>
              ) : (
              /* Preview */
              <div className="h-36 flex items-center justify-center cursor-pointer overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.05)' }}
                onClick={() => setViewing(receipt)}>
                {isImage ? (
                  <img src={fileUrl} alt={receipt.originalName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="flex flex-col items-center gap-2" style={{ color: 'rgba(255,255,255,0.40)' }}>
                    <span className="text-4xl">📄</span>
                    <span className="text-xs font-medium">PDF</span>
                  </div>
                )}
              </div>
              )}

              {/* Info */}
              <div className="p-3">
                <p className="text-xs font-semibold text-white/85 truncate">{receipt.description || receipt.originalName}</p>
                <p className="text-[10px] text-white/40 mt-0.5">{formatDate(receipt.date)}</p>
                {receipt.category && <p className="text-[10px] text-emerald-400 font-medium mt-0.5">{receipt.category}</p>}
                {receipt.crop && <p className="text-[10px] text-orange-300 font-medium truncate">{receipt.crop.name}</p>}
                <div className="flex gap-1 mt-2">
                  {isRecibo ? (
                    <span className="flex-1 py-1 text-center rounded-full text-[11px] font-semibold text-emerald-300" style={{ background: 'rgba(16,185,129,0.12)' }}>
                      ✅ Pagado{receipt.paymentMethod ? ` · ${receipt.paymentMethod}` : ''}
                    </span>
                  ) : (
                  <button onClick={() => setViewing(receipt)}
                    className="flex-1 py-1 rounded-full text-[11px] font-semibold text-white/70 transition-all"
                    style={{ background: 'rgba(255,255,255,0.10)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.10)'}>
                    Ver
                  </button>
                  )}
                  <button onClick={() => onDelete(receipt)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm transition-all"
                    style={{ color: 'rgba(255,255,255,0.45)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.18)'; e.currentTarget.style.color = '#f87171' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)' }}>
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {viewing && <ReceiptViewer receipt={viewing} onClose={() => setViewing(null)} />}
    </>
  )
}
