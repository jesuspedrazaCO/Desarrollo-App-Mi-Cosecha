import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { incomeSchema } from '../../validators/incomeSchema'
import { toInputDate } from '../../utils/formatDate'
import { INCOME_TYPES } from '../../utils/constants'
import Input from '../common/Input'
import Textarea from '../common/Textarea'
import Button from '../common/Button'

export default function IncomeForm({ defaultValues, crops = [], cropId, onSubmit, onCancel, loading }) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(incomeSchema),
    defaultValues: defaultValues
      ? { ...defaultValues, date: toInputDate(defaultValues.date) }
      : {
          crop: cropId || '',
          date: toInputDate(new Date()),
          type: 'venta_cosecha',
          unit: 'kg',
        },
  })

  const qty = watch('quantitySold')
  const price = watch('salePrice')
  const estimated = qty > 0 && price > 0 ? (Number(qty) * Number(price)) : null

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Cultivo */}
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
            {errors.crop && <p className="mt-1.5 text-xs text-red-500">{errors.crop.message}</p>}
          </div>
        )}

        {cropId && <input type="hidden" value={cropId} {...register('crop')} />}

        <Input
          label="Fecha" required type="date"
          error={errors.date?.message}
          {...register('date')}
        />

        <div>
          <label className="block text-[13px] font-semibold text-stone-700 mb-1.5">Tipo de ingreso</label>
          <select
            className="w-full border border-stone-200 rounded-2xl px-4 py-2.5 text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-400/40"
            {...register('type')}
          >
            {INCOME_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <Input
          label="Cliente (opcional)"
          placeholder="Nombre del comprador"
          error={errors.client?.message}
          className="sm:col-span-2"
          {...register('client')}
        />

        <Input
          label="Cantidad vendida" type="number" min="0" step="0.1"
          placeholder="Ej: 500"
          error={errors.quantitySold?.message}
          {...register('quantitySold')}
        />

        <Input
          label="Unidad"
          placeholder="kg, unidades, toneladas..."
          error={errors.unit?.message}
          {...register('unit')}
        />

        <Input
          label="Precio unitario ($)" type="number" min="0" step="100"
          placeholder="0"
          error={errors.salePrice?.message}
          {...register('salePrice')}
        />

        <div>
          <Input
            label="Valor total ($)" type="number" min="0" step="100"
            placeholder={estimated ? `Calculado: $${estimated.toLocaleString('es-CO')}` : '0'}
            error={errors.totalAmount?.message}
            {...register('totalAmount')}
          />
          {estimated && (
            <p className="mt-1 text-xs text-primary-600 font-medium">
              💡 Calculado: ${estimated.toLocaleString('es-CO')}
            </p>
          )}
        </div>

        <Textarea
          label="Observaciones"
          placeholder="Notas sobre la venta..."
          rows={2}
          className="sm:col-span-2"
          {...register('observations')}
        />
      </div>

      <div className="flex gap-3 justify-end pt-2 border-t border-stone-100">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={loading}>
          {defaultValues ? 'Guardar cambios' : 'Registrar ingreso'}
        </Button>
      </div>
    </form>
  )
}
