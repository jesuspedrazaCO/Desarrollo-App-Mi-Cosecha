import Button from './Button'

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, loading }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm p-7 animate-scale-in rounded-3xl"
        style={{
          background: 'rgba(12,32,18,0.95)',
          backdropFilter: 'blur(48px)',
          border: '1px solid rgba(255,255,255,0.14)',
          boxShadow: '0 24px 80px -12px rgba(0,0,0,0.65)',
        }}>
        <div className="flex flex-col items-center text-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-white text-[16px] tracking-tight font-display">{title}</h3>
            <p className="text-sm text-white/55 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button variant="danger" onClick={onConfirm} loading={loading} className="flex-1">Eliminar</Button>
        </div>
      </div>
    </div>
  )
}
