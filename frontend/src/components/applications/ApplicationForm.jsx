import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { applicationSchema } from '../../validators/applicationSchema'
import { toInputDate } from '../../utils/formatDate'
import { APPLICATION_TYPES, APPLICATION_UNIT_SUGGESTIONS, TANK_UNIT_SUGGESTIONS } from '../../utils/constants'
import Input from '../common/Input'
import Select from '../common/Select'
import Textarea from '../common/Textarea'
import Button from '../common/Button'

function buildDefaultValues(defaultValues, cropId) {
  if (!defaultValues) {
    return {
      crop: cropId || '',
      date: toInputDate(new Date()),
      type: 'fertilizacion',
      product: '',
      quantity: '',
      unit: 'bultos',
      tankVolume: '',
      tankUnit: 'L',
      observations: '',
    }
  }

  // El backend devuelve `crop` como objeto populado ({ _id, name, type }).
  const cropValue = cropId || defaultValues.crop?._id || defaultValues.crop || ''

  return {
    ...defaultValues,
    crop: cropValue,
    date: toInputDate(defaultValues.date),
    tankVolume: defaultValues.tankVolume ?? '',
  }
}

export default function ApplicationForm({ defaultValues, crops = [], cropId, onSubmit, onCancel, loading }) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(applicationSchema),
    defaultValues: buildDefaultValues(defaultValues, cropId),
  })

  const type = watch('type')
  const isFumigacion = type === 'fumigacion'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {!cropId && (
          <div className="sm:col-span-2">
            <label className="block text-[13px] font-semibold text-stone-700 mb-1.5">
              Cultivo <span className="text-accent-500">*</span>
            </label>
            <select
              className="w-full border border-stone-200 rounded-2xl px-4 py-2.5 text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-400/40"
              {...register('crop')}
            >
              <option value="">Seleccionar cultivo</option>
              {crops.map(c => <option key={c._id} value={c._id}>{c.name} — {c.type}</option>)}
            </select>
          </div>
        )}

        {cropId && <input type="hidden" {...register('crop')} />}

        {errors.crop && <p className="sm:col-span-2 -mt-2 text-xs text-red-400">{errors.crop.message}</p>}

        <Input
          label="Fecha" required type="date"
          error={errors.date?.message}
          {...register('date')}
        />

        <Select
          label="Tipo de labor"
          options={APPLICATION_TYPES.map(t => ({ value: t.value, label: `${t.icon} ${t.label}` }))}
          {...register('type')}
        />

        <Input
          label="Producto"
          required
          placeholder="Ej: Abono Triple 15"
          error={errors.product?.message}
          className="sm:col-span-2"
          {...register('product')}
        />

        <Input
          label="Cantidad aplicada" required type="number" min="0" step="0.1"
          placeholder="Ej: 5"
          error={errors.quantity?.message}
          {...register('quantity')}
        />

        <Input
          label="Unidad"
          required
          list="application-unit-suggestions"
          placeholder="Ej: bultos"
          error={errors.unit?.message}
          {...register('unit')}
        />

        {isFumigacion && (
          <>
            <Input
              label="Volumen del tanque/caneca (opcional)"
              type="number" min="0" step="1"
              placeholder="Ej: 200"
              hint="Para calcular la dosis, ej: 200 L o 1000 L"
              error={errors.tankVolume?.message}
              {...register('tankVolume')}
            />
            <Input
              label="Unidad del tanque"
              list="tank-unit-suggestions"
              placeholder="L"
              error={errors.tankUnit?.message}
              {...register('tankUnit')}
            />
          </>
        )}
      </div>

      <datalist id="application-unit-suggestions">
        {APPLICATION_UNIT_SUGGESTIONS.map(u => <option key={u} value={u} />)}
      </datalist>
      <datalist id="tank-unit-suggestions">
        {TANK_UNIT_SUGGESTIONS.map(u => <option key={u} value={u} />)}
      </datalist>

      <Textarea
        label="Observaciones"
        placeholder="Ej: se aplicó en la tarde, el cultivo se veía con hojas amarillas..."
        rows={2}
        {...register('observations')}
      />

      <div className="flex gap-3 justify-end pt-2 border-t border-white/10">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={loading}>
          {defaultValues ? 'Guardar cambios' : 'Registrar insumo'}
        </Button>
      </div>
    </form>
  )
}