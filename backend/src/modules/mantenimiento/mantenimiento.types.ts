export interface Empresa {
  id: string
  nombre: string
  nit: string
  direccion: string | null
  telefono: string | null
  correo: string | null
  logo_url: string | null
  marca_agua_url: string | null
  updated_at: string
}

export type CrearEmpresa = Omit<Empresa, 'id' | 'updated_at'>
export type ActualizarEmpresa = Partial<CrearEmpresa>

export type TablaMantenimiento = 'empresa' // Se añadirán más aquí
