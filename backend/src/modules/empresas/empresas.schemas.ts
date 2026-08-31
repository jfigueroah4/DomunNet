import { z } from 'zod';

export const wizardEmpresaSchema = z.object({
  // Paso 1: Empresa
  nombre_empresa: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(200),
  nit: z.string().min(1, 'El NIT es obligatorio').max(50),
  direccion_empresa: z.string().min(1, 'La direccin es obligatoria').max(255),
  telefono_empresa: z.string().min(1, 'El telfono es obligatorio').max(50),
  correo_institucional: z.string().email('Debe ser un correo vlido').max(255),
  activo: z.boolean().default(true),

  // Paso 2: Usuario / Contacto
  usuario_id: z.string().uuid().optional(), // Si ya se cre en un intento fallido
  primer_nombre: z.string().min(1, 'El nombre es obligatorio').max(100),
  segundo_nombre: z.string().optional().nullable().or(z.literal('')),
  primer_apellido: z.string().min(1, 'El apellido es obligatorio').max(100),
  segundo_apellido: z.string().optional().nullable().or(z.literal('')),
  cargo: z.string().min(1, 'El cargo es obligatorio').max(150),
  telefono_contacto: z.string().min(1, 'El telfono del contacto es obligatorio').max(50),
  correo_contacto: z.string().email('Debe ser un correo vlido').max(255),
  username: z.string().min(1, 'El username es obligatorio').max(100),
  password: z.string().min(8, 'La contrasea debe tener al menos 8 caracteres'),
  diaNacimiento: z.string().min(1, 'Obligatorio'),
  mesNacimiento: z.string().min(1, 'Obligatorio'),
  anoNacimiento: z.string().length(4, 'Debe tener 4 dgitos'),
  direccion_contacto: z.string().min(1, 'La direccin del contacto es obligatoria'),
  rol_id: z.string().uuid('Rol invlido')
});

export type WizardEmpresaType = z.infer<typeof wizardEmpresaSchema>;
