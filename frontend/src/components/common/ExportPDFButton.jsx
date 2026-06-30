import { useState } from 'react'

export default function ExportPDFButton({ onExport, label = 'Exportar PDF', size = 'md' }) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      await onExport()
    } finally {
      // Pequeño delay para que se note el feedback visual
      setTimeout(() => setLoading(false), 400)
    }
  }

  const sizes = {
    sm: 'px-3.5 py-1.5 text-[12px]',
    md: 'px-5 py-2.5 text-[13px]',
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex items-center gap-2 font-semibold rounded-full transition-all duration-200
        hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-wait ${sizes[size]}`}
      style={{
        background: 'rgba(255,255,255,0.10)',
        color: 'rgba(255,255,255,0.90)',
        border: '1px solid rgba(255,255,255,0.20)',
      }}
    >
      {loading ? (
        <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )}
      {loading ? 'Generando...' : label}
    </button>
  )
}
