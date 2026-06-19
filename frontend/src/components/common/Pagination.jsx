export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="px-4 py-1.5 text-[13px] font-semibold rounded-full border border-stone-200 bg-white/70
          disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white transition-colors duration-150"
      >
        Anterior
      </button>
      <span className="text-[13px] text-stone-500 px-2 font-medium">
        {page} de {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="px-4 py-1.5 text-[13px] font-semibold rounded-full border border-stone-200 bg-white/70
          disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white transition-colors duration-150"
      >
        Siguiente
      </button>
    </div>
  )
}
