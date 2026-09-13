import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cropSchema } from '../../validators/cropSchema'
import { toInputDate } from '../../utils/formatDate'
import { LAND_SIZE_UNITS } from '../../utils/constants'
import Input from '../common/Input'
import Textarea from '../common/Textarea'
import Select from '../common/Select'
import Button from '../common/Button'

const BASE_CROP_TYPES = [
  'Piña', 'Tabaco', 'Tomate', 'Patilla', 'Mango', 'Maíz', 'Yuca',
  'Papa', 'Café', 'Cacao', 'Aguacate', 'Plátano', 'Arroz', 'Otro',
]

// Si la fecha viene null/undefined/vacía, o si toInputDate falla por
// cualquier razón, devolvemos '' en vez de tronar toda la pantalla.
const safeToInputDate = (date) => {
  if (!date) return ''
  try {
    return toInputDate(date)
  } catch {
    return ''
  }
}

export default function CropForm({ defaultValues, onSubmit, onCancel, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(cropSchema),
    defaultValues: defaultValues
      ? {
          ...defaultValues,
          startDate: safeToInputDate(defaultValues.startDate),
          estimatedHarvestDate: safeToInputDate(defaultValues.estimatedHarvestDate),
        }
      : { status: 'activo', landSizeUnit: 'hectáreas' },
  })

  // Si el cultivo que se está editando tiene un tipo que no está en la lista
  // fija (ej: se escribió distinto o es un tipo poco común), lo agregamos
  // dinámicamente para que el campo no quede en blanco al abrir "Editar".
  const cropTypes = defaultValues?.type && !BASE_CROP_TYPES.includes(defaultValues.type)
    ? [defaultValues.type, ...BASE_CROP_TYPES]
    : BASE_CROP_TYPES

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Nombre del cultivo" required
          placeholder="Ej: Piña Lote 1"
          error={errors.name?.message}
          className="sm:col-span-2"
          {...register('name')}
        />

        <div>
          <label className="block text-[13px] font-semibold text-stone-700 mb-1.5">
            Tipo de cultivo <span className="text-accent-500">*</span>
          </label>
          <select
            className="w-full border border-stone-200 rounded-2xl px-4 py-2.5 text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-400/40 focus:border-primary-400"
            {...register('type')}
          >
            <option value="">Seleccionar tipo</option>
            {cropTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {errors.type && <p className="mt-1.5 text-xs text-red-500">{errors.type.message}</p>}
        </div>

        <Select
          label="Estado"
          options={[
            { value: 'activo', label: 'Activo' },
            { value: 'finalizado', label: 'Finalizado' },
            { value: 'suspendido', label: 'Suspendido' },
          ]}
          {...register('status')}
        />

        <Input
          label="Fecha de inicio" required type="date"
          error={errors.startDate?.message}
          {...register('startDate')}
        />

        <Input
          label="Fecha estimada de cosecha" type="date"
          error={errors.estimatedHarvestDate?.message}
          {...register('estimatedHarvestDate')}
        />

        <Input
          label="Tamaño del terreno" type="number" min="0" step="0.1"
          placeholder="Ej: 2.5"
          error={errors.landSize?.message}
          {...register('landSize')}
        />

        <Select
          label="Unidad"
          options={LAND_SIZE_UNITS}
          {...register('landSizeUnit')}
        />

        <Input
          label="Ubicación / Finca"
          placeholder="Ej: Lote norte, Finca La Esperanza"
          error={errors.location?.message}
          className="sm:col-span-2"
          {...register('location')}
        />

        <Textarea
          label="Observaciones"
          placeholder="Notas sobre el cultivo..."
          rows={3}
          className="sm:col-span-2"
          {...register('observations')}
        />
      </div>

      <div className="flex gap-3 justify-end pt-2 border-t border-stone-100">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={loading}>
          {defaultValues ? 'Guardar cambios' : 'Registrar cultivo'}
        </Button>
      </div>
    </form>
  )
}