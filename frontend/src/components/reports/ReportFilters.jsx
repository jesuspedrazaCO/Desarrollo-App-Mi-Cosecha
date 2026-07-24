import Button from '../common/Button'

export default function ReportFilters({ crops = [], onFilter }) {
  const inputStyle = { background: 'rgba(255,255,255,0.85)', color: '#1c1917' }
  const inputClass = 'w-full rounded-2xl px-4 py-2.5 text-sm outline-none'

  const handleSubmit = (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    const params = {}
    if (fd.get('startDate')) params.startDate = fd.get('startDate')
    if (fd.get('endDate')) params.endDate = fd.get('endDate')
    if (fd.get('crop')) params.crop = fd.get('crop')
    onFilter(params)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl p-5 flex flex-col sm:flex-row gap-3 items-end"
      style={{ background: 'rgba(255,255,255,0.09)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.14)' }}
    >
      <div className="flex-1 w-full">
        <label className="block text-[13px] font-semibold text-white/70 mb-1.5">Fecha inicio</label>
        <input type="date" name="startDate" style={inputStyle} className={inputClass} />
      </div>

      <div className="flex-1 w-full">
        <label className="block text-[13px] font-semibold text-white/70 mb-1.5">Fecha fin</label>
        <input type="date" name="endDate" style={inputStyle} className={inputClass} />
      </div>

      <div className="flex-1 w-full">
        <label className="block text-[13px] font-semibold text-white/70 mb-1.5">Cultivo</label>
        <select name="crop" style={inputStyle} className={inputClass}>
          <option value="">Todos los cultivos</option>
          {crops.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>

      <Button type="submit" className="flex-shrink-0 w-full sm:w-auto">🔍 Generar reporte</Button>
    </form>
  )
}