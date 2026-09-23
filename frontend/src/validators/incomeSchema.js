import { z } from 'zod'

const incomeItemSchema = z.object({
  variety: z.string().min(1, 'Indica el producto o variedad'),
  quantitySold: z.coerce.number().positive('La cantidad debe ser mayor a 0'),
  unit: z.string().min(1, 'Indica la unidad').default('kg'),
  crates: z.coerce.number().min(0, 'Las canastillas no pueden ser negativas').optional(),
  salePrice: z.coerce.number().positive('El precio debe ser mayor a 0'),
})

export const incomeSchema = z.object({
  crop: z.string().min(1, 'Selecciona un cultivo'),
  date: z.string().min(1, 'La fecha es obligatoria'),
  type: z.string().default('venta_cosecha'),
  client: z.string().optional(),
  items: z.array(incomeItemSchema).min(1, 'Agrega al menos un producto vendido'),
  observations: z.string().optional(),
})