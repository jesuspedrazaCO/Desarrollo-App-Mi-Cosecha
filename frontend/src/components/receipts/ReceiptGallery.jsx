import { useState } from 'react'
import { formatDate } from '../../utils/formatDate'
import ReceiptViewer from './ReceiptViewer'
import Button from '../common/Button'
import EmptyState from '../common/EmptyState'
import Spinner from '../common/Spinner'

const UPLOADS_URL = import.meta.env.VITE_UPLOADS_URL || 'http://localhost:5000'

export default function ReceiptGallery({ receipts, loading, onDelete }) {
  const [viewing, setViewing] = useState(null)

  if (loading) return <Spinner size="lg" className="mt-16" />

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
          const isImage = receipt.fileType?.startsWith('image/')
          const fileUrl = `${UPLOADS_URL}/uploads/${receipt.fileName}`

          return (
            <div
              key={receipt._id}
              className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-soft border border-white/60 overflow-hidden
                hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 group"
            >
              {/* Preview */}
              <div
                className="h-36 bg-stone-50 flex items-center justify-center cursor-pointer overflow-hidden"
                onClick={() => setViewing(receipt)}
              >
                {isImage ? (
                  <img
                    src={fileUrl}
                    alt={receipt.originalName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-stone-400">
                    <span className="text-4xl">📄</span>
                    <span className="text-xs font-medium">PDF</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="text-xs font-semibold text-stone-700 truncate">{receipt.description || receipt.originalName}</p>
                <p className="text-[10px] text-stone-400 mt-0.5">{formatDate(receipt.date)}</p>
                {receipt.category && (
                  <p className="text-[10px] text-primary-600 font-medium mt-0.5">{receipt.category}</p>
                )}
                {receipt.crop && (
                  <p className="text-[10px] text-accent-600 font-medium truncate">{receipt.crop.name}</p>
                )}
                <div className="flex gap-1 mt-2">
                  <Button size="sm" variant="ghost" onClick={() => setViewing(receipt)} className="flex-1 text-[11px]">
                    Ver
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onDelete(receipt)} className="text-red-400">
                    🗑️
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {viewing && (
        <ReceiptViewer receipt={viewing} onClose={() => setViewing(null)} />
      )}
    </>
  )
}
