import { z } from 'zod'

export const marketListSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  observations: z.string().optional(),
})

export const marketItemSchema = z.object({
  name: z.string().min(1, 'El nombre del producto es obligatorio').max(100),
  quantity: z.coerce.number().min(0, 'La cantidad no puede ser negativa').default(1),
  unit: z.string().max(20).default('unidad'),
  estimatedPrice: z.coerce.number().min(0).default(0),
})
