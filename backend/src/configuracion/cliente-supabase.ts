import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { entorno, validarEntorno } from './entorno'

const faltantes = validarEntorno()
if (faltantes.length > 0) {
  console.warn(`Variables faltantes para Supabase: ${faltantes.join(', ')}`)
}

export type BaseDeDatos = SupabaseClient

export const clienteSupabase: BaseDeDatos = createClient(
  entorno.supabaseUrl || 'https://placeholder.supabase.co',
  entorno.supabaseServiceRoleKey || 'placeholder-service-role-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
)
