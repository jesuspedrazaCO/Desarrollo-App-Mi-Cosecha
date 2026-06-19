import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { householdSchema } from '../../validators/householdSchema'
import { toInputDate } from '../../utils/formatDate'
import { HOUSEHOLD_CATEGORIES, PAYMENT_METHODS } from '../../utils/constants'
import Input from '../common/Input'
import Textarea from '../common/Textarea'
import Button from '../common/Button'

export default function HouseholdExpenseForm({ defaultValues, onSubmit, onCancel, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(householdSchema),
    defaultValues: defaultValues
      ? { ...defaultValues, date: toInputDate(defaultValues.date) }
      : { date: toInputDate(new Date()), paymentMethod: 'efectivo' },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Fecha" required type="date"
          error={errors.date?.message}
          {...register('date')}
        />

        <div>
          <label className="block text-[13px] font-semibold text-stone-700 mb-1.5">
            Categoría <span className="text-accent-500">*</span>
          </label>
          <select
            className="w-full border border-stone-200 rounded-2xl px-4 py-2.5 text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-400/40"
            {...register('category')}
          >
            <option value="">Seleccionar categoría</option>
            {HOUSEHOLD_CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
            ))}
          </select>
          {errors.category && <p className="mt-1.5 text-xs text-red-500">{errors.category.message}</p>}
        </div>

        <Input
          label="Descripción" required
          placeholder="Ej: Factura de energía agosto"
          error={errors.description?.message}
          className="sm:col-span-2"
          {...register('description')}
        />

        <Input
          label="Valor ($)" required type="number" min="0" step="100"
          placeholder="0"
          error={errors.amount?.message}
          {...register('amount')}
        />

        <div>
          <label className="block text-[13px] font-semibold text-stone-700 mb-1.5">Método de pago</label>
          <select
            className="w-full border border-stone-200 rounded-2xl px-4 py-2.5 text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-400/40"
            {...register('paymentMethod')}
          >
            {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>

        <Textarea
          label="Observaciones"
          placeholder="Notas adicionales..."
          rows={2}
          className="sm:col-span-2"
          {...register('observations')}
        />
      </div>

      <div className="flex gap-3 justify-end pt-2 border-t border-stone-100">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={loading}>
          {defaultValues ? 'Guardar cambios' : 'Registrar gasto'}
        </Button>
      </div>
    </form>
  )
}
