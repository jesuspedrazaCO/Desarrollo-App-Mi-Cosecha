import Input from '../common/Input'
import Button from '../common/Button'

export default function ReportFilters({ crops = [], onFilter }) {
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
    <form onSubmit={handleSubmit}
      className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-soft border border-white/60 p-5
      flex flex-col sm:flex-row gap-3 items-end">
      <Input label="Fecha inicio" type="date" name="startDate" className="flex-1" />
      <Input label="Fecha fin" type="date" name="endDate" className="flex-1" />
      <div className="flex-1">
        <label className="block text-[13px] font-semibold text-stone-700 mb-1.5">Cultivo</label>
        <select name="crop"
          className="w-full border border-stone-200 rounded-2xl px-4 py-2.5 text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-400/40">
          <option value="">Todos los cultivos</option>
          {crops.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>
      <Button type="submit" className="flex-shrink-0">🔍 Generar reporte</Button>
    </form>
  )
}
