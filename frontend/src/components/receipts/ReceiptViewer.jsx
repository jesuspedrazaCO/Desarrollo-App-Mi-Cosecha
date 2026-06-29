export default function ReceiptViewer({ receipt, onClose }) {
  if (!receipt) return null
  const isImage = receipt.fileType?.startsWith('image/')
  const fileUrl = receipt.fileUrl || receipt.fileName

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl overflow-hidden"
        style={{ background: 'rgba(12,32,18,0.94)', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 24px 80px rgba(0,0,0,0.65)' }}>
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.09)' }}>
          <div>
            <p className="font-bold text-white">{receipt.description || receipt.originalName}</p>
            <p className="text-xs text-white/40">{receipt.category} {receipt.crop ? `· ${receipt.crop.name}` : ''}</p>
          </div>
          <div className="flex gap-2">
            <a href={fileUrl} download={receipt.originalName} target="_blank" rel="noopener noreferrer"
              className="px-4 py-1.5 text-sm font-semibold text-white rounded-full transition-all"
              style={{ background: 'linear-gradient(135deg,#258a4e,#1a6e3c)' }}>
              ⬇️ Descargar
            </a>
            <button onClick={onClose}
              className="p-1.5 rounded-full transition-all text-white/40 hover:text-white hover:bg-white/10">
              ✕
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto flex items-center justify-center p-4">
          {isImage
            ? <img src={fileUrl} alt={receipt.originalName} className="max-w-full max-h-[70vh] rounded-2xl object-contain" />
            : <iframe src={fileUrl} title={receipt.originalName} className="w-full h-[70vh] rounded-2xl border-0" />
          }
        </div>
      </div>
    </div>
  )
}
