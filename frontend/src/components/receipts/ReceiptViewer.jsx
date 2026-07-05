import { useEffect } from 'react'

export default function ReceiptViewer({ receipt, onClose }) {
  if (!receipt) return null
  const isImage = receipt.fileType?.startsWith('image/')
  const fileUrl = receipt.fileUrl || receipt.fileName

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ padding: '16px' }}>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      {/* Modal — ocupa el espacio disponible */}
      <div
        className="relative mx-auto w-full max-w-3xl flex flex-col rounded-2xl overflow-hidden"
        style={{
          height: '100%',
          maxHeight: '100%',
          background: 'rgba(12,32,18,0.97)',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.65)',
        }}
      >
        {/* Header — siempre arriba, tamaño fijo */}
        <div
          className="flex items-center justify-between px-5 py-3 flex-shrink-0"
          style={{
            borderBottom: '1px solid rgba(255,255,255,0.09)',
            minHeight: '56px',
            background: 'rgba(12,32,18,0.99)',
          }}
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
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all"
              style={{ background: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.80)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.10)'}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Contenido — ocupa el resto del espacio */}
        <div
          className="flex-1 overflow-auto flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.20)' }}
        >
          {isImage ? (
            <img
              src={fileUrl}
              alt={receipt.originalName}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: '12px',
              }}
            />
          ) : (
            <iframe
              src={fileUrl}
              title={receipt.originalName}
              style={{
                width: '100%',
                height: '100%',
                minHeight: '300px',
                border: 'none',
                borderRadius: '12px',
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
