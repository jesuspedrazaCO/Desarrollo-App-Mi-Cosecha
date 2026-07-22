import Spinner from './Spinner'
import EmptyState from './EmptyState'

export default function Table({ columns, data, loading, emptyMessage = 'No hay datos', emptyIcon = '📋' }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10" style={{ background: 'rgba(0,0,0,0.18)' }}>
            {columns.map((col) => (
              <th key={col.key}
                className={`px-5 py-3.5 text-left text-[10px] font-bold text-white/70 uppercase tracking-widest ${col.className || ''}`}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {loading ? (
            <tr><td colSpan={columns.length} className="py-14"><Spinner className="py-4" /></td></tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-4">
                <EmptyState icon={emptyIcon} title={emptyMessage} />
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={row._id || i}
                className="hover:bg-white/06 transition-colors duration-150 group">
                {columns.map((col) => (
                  <td key={col.key} className={`px-5 py-3.5 ${col.className || ''}`}>
                    {col.render ? col.render(row) : (
                      <span className="text-white/85 font-medium">{row[col.key]}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}