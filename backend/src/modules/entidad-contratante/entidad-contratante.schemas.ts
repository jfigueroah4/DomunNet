import { z } from 'zod'

export const entidadContratanteSchema = z.object({
  nombre: z.string().min(2).max(150),
  nit: z.string().min(1).max(50),
  direccion: z.string().min(1).max(255),
  telefono: z.string().min(1).max(50),
  correo_institucional: z.string().email().max(255),
  activo: z.boolean().default(true),
  contacto: z.object({
    primer_nombre: z.string().min(1).max(100),
    segundo_nombre: z.string().optional().nullable(),
    primer_apellido: z.string().min(1).max(100),
    segundo_apellido: z.string().optional().nullable(),
    cargo: z.string().min(1).max(150),
    telefono: z.string().min(4).max(50),
    correo: z.string().email().max(255),
    username: z.string().min(3).max(100),
    password: z.string().min(8).optional(),
    fecha_nacimiento: z.string().min(10),
    direccion: z.string().min(1).max(255),
  }),
})

export type EntidadContratantePayload = z.infer<typeof entidadContratanteSchema>
