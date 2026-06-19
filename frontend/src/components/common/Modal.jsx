import { useEffect } from 'react'

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

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
      <div
        className="absolute inset-0 bg-primary-900/30 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
        onClick={onClose}
      />
      <div
        className={`relative bg-white/90 backdrop-blur-2xl rounded-3xl shadow-elevated border border-white/60
          w-full ${sizes[size]} max-h-[90vh] flex flex-col animate-[modalIn_0.25s_cubic-bezier(0.4,0,0.2,1)]`}
      >
        <div className="flex items-center justify-between px-7 py-5 border-b border-stone-100 flex-shrink-0">
          <h2 className="text-[18px] font-bold text-stone-900 tracking-tight font-display">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors duration-150"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-7 py-5">
          {children}
        </div>
      </div>
    </div>
  )
}
