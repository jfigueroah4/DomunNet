import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { entorno, validarEntorno } from './entorno'

const faltantes = validarEntorno()
if (faltantes.length > 0) {
  console.warn(`Variables faltantes para Supabase: ${faltantes.join(', ')}`)
}

export type BaseDeDatos = SupabaseClient

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || entorno.supabaseUrl || 'https://thpnjsfmfoxcupywisqu.supabase.co'
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || entorno.supabaseServiceRoleKey || ''

export const clienteSupabase: BaseDeDatos = createClient(
  url,
  key,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
)
