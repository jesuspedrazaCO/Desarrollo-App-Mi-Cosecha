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
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className={`relative w-full ${sizes[size]} max-h-[90vh] flex flex-col
        animate-scale-in rounded-3xl overflow-hidden
        bg-[rgba(12,32,18,0.85)] backdrop-blur-[48px] border border-white/14
        shadow-[0_24px_80px_-12px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.12)]`}
      >
        <div className="flex items-center justify-between px-7 py-5 border-b border-white/08 flex-shrink-0">
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
        <div className="overflow-y-auto flex-1 px-7 py-5">
          {children}
        </div>
      </div>
    </div>
  )
}
