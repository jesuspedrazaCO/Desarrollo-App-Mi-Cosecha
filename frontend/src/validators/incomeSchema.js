import { z } from 'zod'

export const incomeSchema = z.object({
  crop: z.string().min(1, 'Selecciona un cultivo'),
  date: z.string().min(1, 'La fecha es obligatoria'),
  type: z.string().default('venta_cosecha'),
  client: z.string().optional(),
  quantitySold: z.coerce.number().min(0, 'La cantidad no puede ser negativa').optional(),
  unit: z.string().optional(),
  salePrice: z.coerce.number().min(0, 'El precio no puede ser negativo').optional(),
  totalAmount: z.coerce.number().min(0.01, 'El valor total debe ser mayor a 0').optional(),
  observations: z.string().optional(),
}).refine((data) => {
  const hasManual = data.totalAmount && data.totalAmount > 0
  const hasCalc = data.quantitySold > 0 && data.salePrice > 0
  return hasManual || hasCalc
}, {
  message: 'Indica el valor total, o la cantidad y el precio para calcularlo',
  path: ['totalAmount'],
})
