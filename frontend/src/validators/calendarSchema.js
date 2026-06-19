import { z } from 'zod'

export const calendarEventSchema = z.object({
  title: z.string().min(2, 'El título debe tener al menos 2 caracteres').max(150),
  type: z.string().default('otro'),
  date: z.string().min(1, 'La fecha es obligatoria'),
  amount: z.coerce.number().min(0).optional(),
  crop: z.string().optional().or(z.literal('')),
  notes: z.string().optional(),
  completed: z.boolean().default(false),
})
