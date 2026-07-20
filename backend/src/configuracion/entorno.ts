import dotenv from 'dotenv'

dotenv.config()

export const entorno = {
  puerto: Number(process.env.PORT || 3001),
  modo: process.env.NODE_ENV || 'development',
  origenCors: process.env.CORS_ORIGIN || 'http://localhost:3000',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  jwtSecret: process.env.JWT_SECRET || 'domunnet-secret',
}

export function validarEntorno() {
  const faltantes: string[] = []

  if (!entorno.supabaseUrl) faltantes.push('SUPABASE_URL')
  if (!entorno.supabaseServiceRoleKey) faltantes.push('SUPABASE_SERVICE_ROLE_KEY')

  return faltantes
}
