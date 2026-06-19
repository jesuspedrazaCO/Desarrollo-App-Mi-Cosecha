import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { calendarEventSchema } from '../../validators/calendarSchema'
import { toInputDate } from '../../utils/formatDate'
import { EVENT_TYPES } from '../../utils/constants'
import Input from '../common/Input'
import Textarea from '../common/Textarea'
import Button from '../common/Button'

export default function EventForm({ defaultValues, crops = [], onSubmit, onCancel, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(calendarEventSchema),
    defaultValues: defaultValues
      ? { ...defaultValues, date: toInputDate(defaultValues.date), crop: defaultValues.crop?._id || '' }
      : { date: toInputDate(new Date()), type: 'otro', completed: false },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Título" required
          placeholder="Ej: Cosecha de piña"
          error={errors.title?.message}
          className="sm:col-span-2"
          {...register('title')}
        />

        <div>
          <label className="block text-[13px] font-semibold text-stone-700 mb-1.5">Tipo de evento</label>
          <select
            className="w-full border border-stone-200 rounded-2xl px-4 py-2.5 text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-400/40"
            {...register('type')}
          >
            {Object.entries(EVENT_TYPES).map(([key, val]) => (
              <option key={key} value={key}>{val.icon} {val.label}</option>
            ))}
          </select>
        </div>

        <Input
          label="Fecha" required type="date"
          error={errors.date?.message}
          {...register('date')}
        />

        <div>
          <label className="block text-[13px] font-semibold text-stone-700 mb-1.5">Cultivo relacionado</label>
          <select
            className="w-full border border-stone-200 rounded-2xl px-4 py-2.5 text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-400/40"
            {...register('crop')}
          >
            <option value="">Sin cultivo</option>
            {crops.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>

        <Input
          label="Valor asociado ($)" type="number" min="0" step="100"
          placeholder="0 (opcional)"
          error={errors.amount?.message}
          {...register('amount')}
        />

        <Textarea
          label="Notas"
          placeholder="Detalles del evento..."
          rows={3}
          className="sm:col-span-2"
          {...register('notes')}
        />

        {defaultValues && (
          <div className="flex items-center gap-3 sm:col-span-2">
            <input type="checkbox" id="completed" className="w-4 h-4 accent-primary-600" {...register('completed')} />
            <label htmlFor="completed" className="text-sm font-medium text-stone-700">Marcar como completado</label>
          </div>
        )}
      </div>

      <div className="flex gap-3 justify-end pt-2 border-t border-stone-100">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={loading}>
          {defaultValues ? 'Guardar cambios' : 'Crear evento'}
        </Button>
      </div>
    </form>
  )
}
