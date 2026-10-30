import { z } from 'zod'

const applicationItemSchema = z.object({
  product: z.string().min(1, 'Indica el producto'),
  quantity: z.coerce.number().positive('La cantidad debe ser mayor a 0'),
  unit: z.string().min(1, 'Indica la unidad').default('bultos'),
  perTank: z.any().optional(),
})

export const applicationSchema = z.object({
  crop: z.string().min(1, 'Selecciona un cultivo'),
  date: z.string().min(1, 'La fecha es obligatoria'),
  type: z.string().default('fertilizacion'),
  // Campo opcional: "" (vacío, cuando no se usa tanque) se trata como "no definido"
  // en vez de intentar convertirlo a 0, para no guardar un volumen falso.
  tankVolume: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : v),
    z.coerce.number().min(0, 'El volumen no puede ser negativo').optional()
  ),
  tankUnit: z.string().optional(),
  // Cuántas canecas se gastaron; vacío = 1
  tankCount: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? 1 : v),
    z.coerce.number().int('Debe ser un número entero').min(1, 'Mínimo 1 caneca').max(1000, 'Máximo 1000')
  ),
  items: z.array(applicationItemSchema).min(1, 'Agrega al menos un producto'),
  observations: z.string().optional(),
})