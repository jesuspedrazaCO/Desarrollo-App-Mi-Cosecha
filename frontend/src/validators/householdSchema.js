import { z } from 'zod'

export const householdSchema = z.object({
  date: z.string().min(1, 'La fecha es obligatoria'),
  category: z.string().min(1, 'Selecciona una categoría'),
  description: z.string().min(2, 'La descripción es obligatoria').max(200),
  amount: z.coerce.number().positive('El valor debe ser mayor a 0'),
  paymentMethod: z.string().default('efectivo'),
  observations: z.string().optional(),
})
