export default function ReceiptViewer({ receipt, onClose }) {
  if (!receipt) return null
  const isImage = receipt.fileType?.startsWith('image/')
  const fileUrl = receipt.fileUrl || receipt.fileName

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl flex flex-col rounded-2xl overflow-hidden"
        style={{
          maxHeight: '92vh',
          background: 'rgba(12,32,18,0.96)',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.65)',
        }}>

        {/* Header — siempre visible arriba */}
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.09)', minHeight: '56px' }}>
          <div className="min-w-0 flex-1 mr-3">
            <p className="font-bold text-white text-sm truncate">{receipt.description || receipt.originalName}</p>
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
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-full transition-all"
              style={{ background: 'linear-gradient(135deg,#258a4e,#1a6e3c)', whiteSpace: 'nowrap' }}
            >
              ⬇️ Descargar
            </a>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0"
              style={{ color: 'rgba(255,255,255,0.50)', background: 'rgba(255,255,255,0.08)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; e.currentTarget.style.color = 'white' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.50)' }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Contenido — scrollable */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-3"
          style={{ minHeight: '200px' }}>
          {isImage ? (
            <img
              src={fileUrl}
              alt={receipt.originalName}
              className="max-w-full rounded-xl object-contain"
              style={{ maxHeight: 'calc(92vh - 80px)' }}
            />
          ) : (
            <iframe
              src={fileUrl}
              title={receipt.originalName}
              className="w-full rounded-xl border-0"
              style={{ height: 'calc(92vh - 80px)', minHeight: '300px' }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
