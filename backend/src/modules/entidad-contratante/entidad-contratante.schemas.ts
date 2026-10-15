import { z } from 'zod'

export const contactoPayloadSchema = z.object({
  primer_nombre: z.string().min(1, 'El primer nombre es obligatorio').max(100),
  segundo_nombre: z.string().optional().nullable().or(z.literal('')),
  primer_apellido: z.string().min(1, 'El primer apellido es obligatorio').max(100),
  segundo_apellido: z.string().optional().nullable().or(z.literal('')),
  cargo: z.string().min(1, 'El cargo es obligatorio').max(150),
  telefono: z.string().min(4, 'Teléfono debe tener al menos 4 caracteres').max(50),
  correo: z.string().email('Correo electrónico inválido').max(255),
  username: z.string().min(3, 'El username debe tener al menos 3 caracteres').max(100),
  password: z.string().min(6).optional().nullable().or(z.literal('')),
  fecha_nacimiento: z.string().optional().nullable().or(z.literal('')),
  direccion: z.string().optional().nullable().or(z.literal('')),
})

export type ContactoPayload = z.infer<typeof contactoPayloadSchema>

export const entidadContratanteSchema = z.object({
  nombre: z.string().min(2).max(150),
  nit: z.string().min(1).max(50),
  direccion: z.string().min(1).max(255),
  telefono: z.string().min(1).max(50),
  correo_institucional: z.string().email().max(255),
  activo: z.boolean().default(true),
  contacto: contactoPayloadSchema.optional().nullable(),
})

export type EntidadContratantePayload = z.infer<typeof entidadContratanteSchema>
