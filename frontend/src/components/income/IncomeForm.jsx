import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { incomeSchema } from '../../validators/incomeSchema'
import { toInputDate } from '../../utils/formatDate'
import { INCOME_TYPES } from '../../utils/constants'
import Input from '../common/Input'
import Textarea from '../common/Textarea'
import Button from '../common/Button'

const emptyItem = { variety: '', quantitySold: '', unit: 'kg', crates: '', salePrice: '' }
const COMMON_VARIETIES = ['Piña gruesa', 'Piña pareja', 'Pipo', 'Riche', 'Racha']

function buildDefaultValues(defaultValues, cropId) {
  if (!defaultValues) {
    return {
      crop: cropId || '',
      date: toInputDate(new Date()),
      type: 'venta_cosecha',
      client: '',
      items: [emptyItem],
      observations: '',
    }
  }

  const hasItems = Array.isArray(defaultValues.items) && defaultValues.items.length > 0
  return {
    ...defaultValues,
    date: toInputDate(defaultValues.date),
    items: hasItems
      ? defaultValues.items
      : [{
          variety: 'Venta',
          quantitySold: defaultValues.quantitySold || '',
          unit: defaultValues.unit || 'kg',
          crates: '',
          salePrice: defaultValues.salePrice || '',
        }],
  }
}

export default function IncomeForm({ defaultValues, crops = [], cropId, onSubmit, onCancel, loading }) {
  const { register, control, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(incomeSchema),
    defaultValues: buildDefaultValues(defaultValues, cropId),
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const items = watch('items')

  const total = (items || []).reduce((sum, it) => {
    const qty = Number(it?.quantitySold) || 0
    const price = Number(it?.salePrice) || 0
    return sum + qty * price
  }, 0)

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
      </div>

      {/* Desglose de productos vendidos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-[13px] font-semibold text-white/90">
              Productos vendidos <span className="text-accent-400">*</span>
            </h3>
            <p className="text-xs text-white/40 mt-0.5">Agrega cada variedad o producto de esta venta</p>
          </div>
          <button
            type="button"
            onClick={() => append(emptyItem)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.14)',
              color: 'rgba(255,255,255,0.85)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
          >
            <Plus size={14} strokeWidth={2.5} />
            Agregar producto
          </button>
        </div>

        {errors.items?.message && (
          <p className="mb-2 text-xs text-red-400">{errors.items.message}</p>
        )}

        <div className="space-y-2.5">
          {fields.map((field, index) => {
            const qty = Number(items?.[index]?.quantitySold) || 0
            const price = Number(items?.[index]?.salePrice) || 0
            const subtotal = qty * price

            return (
              <div
                key={field.id}
                className="rounded-2xl p-3.5"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.10)',
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white/60 mt-1"
                    style={{ background: 'rgba(255,255,255,0.08)' }}
                  >
                    {index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      <div className="col-span-2 sm:col-span-1">
                        <Input
                          label="Producto / variedad"
                          list="variety-suggestions"
                          placeholder="Piña gruesa..."
                          error={errors.items?.[index]?.variety?.message}
                          {...register(`items.${index}.variety`)}
                        />
                      </div>
                      <Input
                        label="Cantidad" type="number" min="0" step="0.1"
                        placeholder="Ej: 195"
                        error={errors.items?.[index]?.quantitySold?.message}
                        {...register(`items.${index}.quantitySold`)}
                      />
                      <Input
                        label="Unidad"
                        placeholder="kg"
                        error={errors.items?.[index]?.unit?.message}
                        {...register(`items.${index}.unit`)}
                      />
                      <Input
                        label="Canastillas"
                        type="number" min="0" step="1"
                        placeholder="Ej: 8"
                        error={errors.items?.[index]?.crates?.message}
                        {...register(`items.${index}.crates`)}
                      />
                      <Input
                        label="Precio/unidad ($)" type="number" min="0" step="1"
                        placeholder="Ej: 2600"
                        error={errors.items?.[index]?.salePrice?.message}
                        {...register(`items.${index}.salePrice`)}
                      />
                    </div>

                    <div className="flex items-center justify-between mt-2.5 pt-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                      <p className="text-xs text-white/45">
                        Subtotal: <span className="font-semibold text-emerald-300">${subtotal.toLocaleString('es-CO')}</span>
                      </p>
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="flex items-center gap-1 text-xs text-white/40 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={13} />
                          Quitar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <datalist id="variety-suggestions">
          {COMMON_VARIETIES.map(v => <option key={v} value={v} />)}
        </datalist>

        <div
          className="mt-3 flex items-center justify-between rounded-2xl px-4 py-3"
          style={{
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.18)',
          }}
        >
          <span className="text-sm text-white/60">Total de la venta</span>
          <span className="text-lg font-bold text-emerald-300">${total.toLocaleString('es-CO')}</span>
        </div>
      </div>

      <Textarea
        label="Observaciones"
        placeholder="Notas sobre la venta..."
        rows={2}
        {...register('observations')}
      />

      <div className="flex gap-3 justify-end pt-2 border-t border-white/10">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={loading}>
          {defaultValues ? 'Guardar cambios' : 'Registrar ingreso'}
        </Button>
      </div>
    </form>
  )
}