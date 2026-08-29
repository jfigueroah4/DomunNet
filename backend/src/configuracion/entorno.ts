import dotenv from 'dotenv'
import crypto from 'crypto'

dotenv.config()

const isProd = process.env.NODE_ENV === 'production'

const jwtSecret = isProd 
  ? process.env.JWT_SECRET || 'domunnet-secret'
  : crypto.randomBytes(32).toString('hex')

if (!isProd) {
  console.log('🔑 JWT_SECRET dinámico generado para esta sesión de desarrollo (las sesiones anteriores quedarán invalidadas)')
}

export const entorno = {
  puerto: Number(process.env.PORT || 3001),
  modo: process.env.NODE_ENV || 'development',
  origenCors: process.env.CORS_ORIGIN || 'http://localhost:3000',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  jwtSecret,
}

export function validarEntorno() {
  const faltantes: string[] = []

  if (!entorno.supabaseUrl) faltantes.push('SUPABASE_URL')
  if (!entorno.supabaseServiceRoleKey) faltantes.push('SUPABASE_SERVICE_ROLE_KEY')
  if (isProd && !process.env.JWT_SECRET) {
    console.warn('⚠️  ADVERTENCIA: JWT_SECRET no está definido en el archivo .env de producción.')
  }

  return faltantes
}
