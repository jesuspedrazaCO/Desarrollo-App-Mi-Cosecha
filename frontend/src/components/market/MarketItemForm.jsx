import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { marketItemSchema } from '../../validators/marketSchema'
import Input from '../common/Input'
import Button from '../common/Button'

export default function MarketItemForm({ defaultValues, onSubmit, onCancel, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(marketItemSchema),
    defaultValues: defaultValues || { quantity: 1, unit: 'unidad', estimatedPrice: 0 },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Nombre del producto" required
        placeholder="Ej: Arroz, Aceite, Jabón..."
        error={errors.name?.message}
        {...register('name')}
      />
      <div className="grid grid-cols-3 gap-3">
        <Input
          label="Cantidad" type="number" min="0" step="0.5"
          error={errors.quantity?.message}
          {...register('quantity')}
        />
        <Input
          label="Unidad"
          placeholder="kg, lt, und..."
          error={errors.unit?.message}
          {...register('unit')}
        />
        <Input
          label="Precio est. ($)" type="number" min="0" step="100"
          placeholder="0"
          error={errors.estimatedPrice?.message}
          {...register('estimatedPrice')}
        />
      </div>
      <div className="flex gap-3 justify-end pt-2 border-t border-stone-100">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={loading}>
          {defaultValues ? 'Guardar' : 'Agregar producto'}
        </Button>
      </div>
    </form>
  )
}
