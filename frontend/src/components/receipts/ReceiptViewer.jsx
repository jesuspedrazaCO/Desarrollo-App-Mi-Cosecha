export default function ReceiptViewer({ receipt, onClose }) {
  if (!receipt) return null
  const isImage = receipt.fileType?.startsWith('image/')
  const fileUrl = receipt.fileUrl || receipt.fileName

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ padding: '60px 12px 12px' }}
    >
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal centrado */}
      <div
        className="relative mx-auto w-full max-w-2xl flex flex-col rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(12,32,18,0.96)',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.65)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.09)' }}
        >
          <div className="min-w-0 flex-1 mr-3">
            <p className="font-bold text-white text-sm truncate">
              {receipt.description || receipt.originalName || 'Comprobante'}
            </p>
            <p className="text-xs text-white/40 truncate">
              {[receipt.category, receipt.crop?.name].filter(Boolean).join(' · ')}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href={fileUrl}
              download={receipt.originalName}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-full"
              style={{ background: 'linear-gradient(135deg,#258a4e,#1a6e3c)', whiteSpace: 'nowrap' }}
            >
              ⬇️ Descargar
            </a>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.70)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.20)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.10)'}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Imagen o PDF */}
        <div className="p-4 flex items-center justify-center">
          {isImage ? (
            <img
              src={fileUrl}
              alt={receipt.originalName}
              className="w-full rounded-xl object-contain"
              style={{ maxHeight: '70vh' }}
            />
          ) : (
            <iframe
              src={fileUrl}
              title={receipt.originalName}
              className="w-full rounded-xl border-0"
              style={{ height: '70vh' }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
