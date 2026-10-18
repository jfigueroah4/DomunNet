import { z } from 'zod'

export const contactoPayloadSchema = z.object({
  usuario_id: z.string().optional().nullable(),
  primer_nombre: z.string().max(100).optional().nullable(),
  segundo_nombre: z.string().optional().nullable().or(z.literal('')),
  primer_apellido: z.string().max(100).optional().nullable(),
  segundo_apellido: z.string().optional().nullable().or(z.literal('')),
  cargo: z.string().max(150).optional().nullable(),
  telefono: z.string().max(50).optional().nullable(),
  correo: z.string().max(255).optional().nullable(),
  username: z.string().max(100).optional().nullable(),
  password: z.string().min(6).optional().nullable().or(z.literal('')),
  fecha_nacimiento: z.string().optional().nullable().or(z.literal('')),
  direccion: z.string().optional().nullable().or(z.literal('')),
})

export type ContactoPayload = z.infer<typeof contactoPayloadSchema>

export const empresaContratistaSchema = z.object({
  nombre: z.string().min(2).max(150),
  nit: z.string().min(1).max(50),
  direccion: z.string().min(1).max(255),
  telefono: z.string().min(1).max(50),
  correo_institucional: z.string().email().max(255),
  activo: z.boolean().default(true),
  contacto: contactoPayloadSchema.optional().nullable(),
})

export type EmpresaContratistaPayload = z.infer<typeof empresaContratistaSchema>
