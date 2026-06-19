import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { marketListSchema } from '../../validators/marketSchema'
import Input from '../common/Input'
import Textarea from '../common/Textarea'
import Button from '../common/Button'

export default function MarketListForm({ defaultValues, onSubmit, onCancel, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(marketListSchema),
    defaultValues: defaultValues || {},
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Nombre de la lista" required
        placeholder="Ej: Mercado de la semana"
        error={errors.name?.message}
        {...register('name')}
      />
      <Textarea
        label="Observaciones"
        placeholder="Notas sobre esta lista..."
        rows={3}
        {...register('observations')}
      />
      <div className="flex gap-3 justify-end pt-2 border-t border-stone-100">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={loading}>
          {defaultValues ? 'Guardar cambios' : 'Crear lista'}
        </Button>
      </div>
    </form>
  )
}
