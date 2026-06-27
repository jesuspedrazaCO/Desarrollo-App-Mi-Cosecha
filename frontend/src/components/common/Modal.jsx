import { useEffect } from 'react'

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose() }
    if (isOpen) window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        style={{ animation: 'fadeIn 0.2s ease-out' }}
        onClick={onClose}
      />

      {/* Modal box */}
      <div
        className={`relative w-full ${sizes[size]} flex flex-col`}
        style={{
          maxHeight: '88vh',
          background: 'rgba(12,32,18,0.94)',
          backdropFilter: 'blur(48px) saturate(180%)',
          WebkitBackdropFilter: 'blur(48px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 24px 80px -12px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.12)',
          borderRadius: '24px',
          animation: 'scaleIn 0.22s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {/* Header fijo */}
        <div className="flex items-center justify-between px-7 py-5 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.09)' }}>
          <h2 className="text-[17px] font-bold text-white tracking-tight font-display">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full transition-all duration-150"
            style={{ color: 'rgba(255,255,255,0.45)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body con scroll */}
        <div className="px-7 py-5 overflow-y-auto flex-1"
          style={{ overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
