import { z } from 'zod'

export const expenseSchema = z.object({
  crop: z.string().min(1, 'Selecciona un cultivo'),
  date: z.string().min(1, 'La fecha es obligatoria'),
  description: z.string().min(2, 'La descripción es obligatoria').max(200, 'La descripción es demasiado larga'),
  category: z.string().min(1, 'Selecciona una categoría'),
  amount: z.coerce.number().positive('El valor debe ser mayor a 0'),
  paymentMethod: z.string().default('efectivo'),
  observations: z.string().optional(),
})
