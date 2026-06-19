import { z } from 'zod'

export const cropSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'El nombre es demasiado largo'),
  type: z.string().min(2, 'El tipo de cultivo es obligatorio').max(100, 'El tipo es demasiado largo'),
  startDate: z.string().min(1, 'La fecha de inicio es obligatoria'),
  estimatedHarvestDate: z.string().optional().or(z.literal('')),
  location: z.string().optional(),
  landSize: z.coerce.number().min(0, 'El tamaño debe ser un número positivo').optional(),
  landSizeUnit: z.enum(['hectáreas', 'metros2', 'cuadras', 'fanegadas']).default('hectáreas'),
  status: z.enum(['activo', 'finalizado', 'suspendido']).default('activo'),
  observations: z.string().optional(),
})
