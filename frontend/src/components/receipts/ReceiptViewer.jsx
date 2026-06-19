const UPLOADS_URL = import.meta.env.VITE_UPLOADS_URL || 'http://localhost:5000'

export default function ReceiptViewer({ receipt, onClose }) {
  if (!receipt) return null
  const isImage = receipt.fileType?.startsWith('image/')
  const fileUrl = `${UPLOADS_URL}/uploads/${receipt.fileName}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white/90 backdrop-blur-2xl rounded-3xl shadow-elevated border border-white/60 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <div>
            <p className="font-bold text-stone-900">{receipt.description || receipt.originalName}</p>
            <p className="text-xs text-stone-400">{receipt.category} · {receipt.crop?.name}</p>
          </div>
          <div className="flex gap-2">
            <a
              href={fileUrl}
              download={receipt.originalName}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 text-sm font-semibold bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors"
            >
              ⬇️ Descargar
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto flex items-center justify-center p-4">
          {isImage ? (
            <img src={fileUrl} alt={receipt.originalName} className="max-w-full max-h-[70vh] rounded-2xl object-contain" />
          ) : (
            <iframe src={fileUrl} title={receipt.originalName} className="w-full h-[70vh] rounded-2xl border-0" />
          )}
        </div>
      </div>
    </div>
  )
}
