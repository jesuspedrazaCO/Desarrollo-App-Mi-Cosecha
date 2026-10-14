import { z } from 'zod'

export const applicationSchema = z.object({
  crop: z.string().min(1, 'Selecciona un cultivo'),
  date: z.string().min(1, 'La fecha es obligatoria'),
  type: z.string().default('fertilizacion'),
  product: z.string().min(1, 'Indica el producto'),
  quantity: z.coerce.number().positive('La cantidad debe ser mayor a 0'),
  unit: z.string().min(1, 'Indica la unidad').default('bultos'),
  // Campo opcional: "" (vacío, cuando no se usa tanque) se trata como "no definido"
  // en vez de intentar convertirlo a 0, para no guardar un volumen falso.
  tankVolume: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : v),
    z.coerce.number().min(0, 'El volumen no puede ser negativo').optional()
  ),
  tankUnit: z.string().optional(),
  observations: z.string().optional(),
})