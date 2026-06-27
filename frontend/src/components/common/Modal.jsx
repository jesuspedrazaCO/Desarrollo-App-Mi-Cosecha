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
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[5vh] overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className={`relative w-full ${sizes[size]} my-auto animate-scale-in`}
        style={{
          background: 'rgba(12,32,18,0.92)',
          backdropFilter: 'blur(48px) saturate(180%)',
          WebkitBackdropFilter: 'blur(48px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.14)',
          boxShadow: '0 24px 80px -12px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.12)',
          borderRadius: '24px',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 className="text-[17px] font-bold text-white tracking-tight font-display">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/40 hover:text-white/80 hover:bg-white/10 transition-all duration-150"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Body — scrollable si el contenido es largo */}
        <div className="px-7 py-5 overflow-y-auto" style={{ maxHeight: '75vh' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
