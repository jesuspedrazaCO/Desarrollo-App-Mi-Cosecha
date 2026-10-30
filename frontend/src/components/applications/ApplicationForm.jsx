import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { applicationSchema } from '../../validators/applicationSchema'
import { toInputDate } from '../../utils/formatDate'
import { APPLICATION_TYPES, APPLICATION_UNIT_SUGGESTIONS, TANK_UNIT_SUGGESTIONS } from '../../utils/constants'
import Input from '../common/Input'
import Select from '../common/Select'
import Textarea from '../common/Textarea'
import Button from '../common/Button'

const fmt = (n) => Number(n).toLocaleString('es-CO', { maximumFractionDigits: 2 })

const buildEmptyItem = () => ({ product: '', quantity: '', unit: 'bultos' })

function buildDefaultValues(defaultValues, cropId) {
  if (!defaultValues) {
    return {
      crop: cropId || '',
      date: toInputDate(new Date()),
      type: 'fertilizacion',
      tankVolume: '',
      tankUnit: 'L',
      tankCount: 1,
      items: [buildEmptyItem()],
      observations: '',
    }
  }

  // El backend devuelve `crop` como objeto populado ({ _id, name, type }).
  const cropValue = cropId || defaultValues.crop?._id || defaultValues.crop || ''

  // Registros antiguos (un producto por registro) se muestran como una sola línea.
  const hasItems = Array.isArray(defaultValues.items) && defaultValues.items.length > 0
  const items = hasItems
    ? defaultValues.items.map(({ product, quantity, unit, perTank }) => ({
        product,
        // Si se gastaron varias canecas, el formulario trabaja con lo de UNA caneca
        quantity: (defaultValues.tankCount > 1) ? (perTank ?? Math.round((quantity / defaultValues.tankCount) * 10000) / 10000) : quantity,
        unit,
      }))
    : [{
        product: defaultValues.product || '',
        quantity: defaultValues.quantity || '',
        unit: defaultValues.unit || 'bultos',
      }]

  return {
    crop: cropValue,
    date: toInputDate(defaultValues.date),
    type: defaultValues.type || 'fertilizacion',
    tankVolume: defaultValues.tankVolume ?? '',
    tankUnit: defaultValues.tankUnit || 'L',
    tankCount: defaultValues.tankCount || 1,
    items,
    observations: defaultValues.observations || '',
  }
}

export default function ApplicationForm({ defaultValues, crops = [], cropId, onSubmit, onCancel, loading }) {
  const { register, control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(applicationSchema),
    defaultValues: buildDefaultValues(defaultValues, cropId),
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  // Para mostrar al instante cuánto da en total (sin que el usuario haga cuentas)
  const watched = useWatch({ control })
  const count = Math.max(1, Math.floor(Number(watched.tankCount) || 1))
  const multi = count > 1
  const tankVolume = Number(watched.tankVolume) || 0
  const tankUnit = (watched.tankUnit || 'L').trim()

  // Con varias canecas, lo que se escribe es "por caneca" y aquí se convierte al total.
  const submit = (values) => {
    const n = Math.max(1, Math.floor(Number(values.tankCount) || 1))
    const items = values.items.map((it) => {
      const per = Number(it.quantity) || 0
      return n > 1
        ? { ...it, perTank: per, quantity: Math.round(per * n * 10000) / 10000 }
        : { product: it.product, quantity: per, unit: it.unit }
    })
    return onSubmit({ ...values, tankCount: n, items })
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
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
          label="Tamaño de la caneca/tanque (opcional)"
          type="number" min="0" step="1"
          placeholder="Ej: 200"
          hint="Si mezclaste todo en una caneca, ej: 200 o 1000"
          error={errors.tankVolume?.message}
          {...register('tankVolume')}
        />
        <Input
          label="Unidad de la caneca"
          list="tank-unit-suggestions"
          placeholder="L"
          error={errors.tankUnit?.message}
          {...register('tankUnit')}
        />
        <Input
          label="¿Cuántas canecas se gastaron?"
          type="number" min="1" step="1" inputMode="numeric"
          placeholder="1"
          hint="Si hiciste la misma mezcla varias veces, pon cuántas. Abajo escribes lo de UNA caneca y se calcula el total."
          error={errors.tankCount?.message}
          className="sm:col-span-2"
          {...register('tankCount')}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-[13px] font-semibold text-white/90">
              Productos aplicados <span className="text-accent-400">*</span>
            </h3>
            <p className="text-xs text-white/40 mt-0.5">Agrega todos los productos que fueron en esta caneca o aplicación</p>
          </div>
          <button
            type="button"
            onClick={() => append(buildEmptyItem())}
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
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="rounded-2xl p-3.5"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white/60 mt-1"
                  style={{ background: 'rgba(255,255,255,0.08)' }}
                >
                  {index + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div className="col-span-2 sm:col-span-1">
                      <Input
                        label="Producto"
                        placeholder="Ej: Verdín"
                        error={errors.items?.[index]?.product?.message}
                        {...register(`items.${index}.product`)}
                      />
                    </div>
                    <Input
                      label={multi ? 'Cantidad por caneca' : 'Cantidad'} type="number" min="0" step="0.01"
                      placeholder="Ej: 200"
                      error={errors.items?.[index]?.quantity?.message}
                      {...register(`items.${index}.quantity`)}
                    />
                    <Input
                      label="Unidad"
                      list="application-unit-suggestions"
                      placeholder="Ej: ml"
                      error={errors.items?.[index]?.unit?.message}
                      {...register(`items.${index}.unit`)}
                    />
                  </div>

                  {multi && Number(watched.items?.[index]?.quantity) > 0 && (
                    <p className="mt-2 text-xs text-emerald-300">
                      Total: {fmt(Number(watched.items[index].quantity) * count)} {watched.items[index].unit} ({count} canecas × {fmt(watched.items[index].quantity)})
                    </p>
                  )}

                  {fields.length > 1 && (
                    <div className="flex justify-end mt-2.5 pt-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="flex items-center gap-1 text-xs text-white/40 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={13} />
                        Quitar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <datalist id="application-unit-suggestions">
          {APPLICATION_UNIT_SUGGESTIONS.map(u => <option key={u} value={u} />)}
        </datalist>
        <datalist id="tank-unit-suggestions">
          {TANK_UNIT_SUGGESTIONS.map(u => <option key={u} value={u} />)}
        </datalist>
      </div>

      {multi && (
        <div className="rounded-2xl px-4 py-3 text-sm" style={{ background: 'rgba(22,163,74,0.14)', border: '1px solid rgba(74,222,128,0.30)' }}>
          <p className="font-bold text-white/90">🪣 {count} canecas{tankVolume > 0 ? ` de ${fmt(tankVolume)} ${tankUnit}` : ''}</p>
          {tankVolume > 0 && <p className="text-white/75 mt-0.5">Total de mezcla: <strong className="text-emerald-300">{fmt(tankVolume * count)} {tankUnit}</strong></p>}
          <ul className="mt-1 text-white/75">
            {(watched.items || []).filter((it) => it?.product && Number(it.quantity) > 0).map((it, i) => (
              <li key={i}>{it.product}: <strong className="text-emerald-300">{fmt(Number(it.quantity) * count)} {it.unit}</strong></li>
            ))}
          </ul>
        </div>
      )}

      <Textarea
        label="Observaciones"
        placeholder="Ej: se aplicó en la tarde, el cultivo se veía con hojas amarillas..."
        rows={2}
        {...register('observations')}
      />

      <div className="flex gap-3 justify-end pt-2 border-t border-white/10">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={loading}>
          {defaultValues ? 'Guardar cambios' : 'Registrar aplicación'}
        </Button>
      </div>
    </form>
  )
}