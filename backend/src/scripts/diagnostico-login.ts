import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'

dotenv.config()

const clienteSupabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  { auth: { persistSession: false, autoRefreshToken: false } }
)

const EMAIL = 'daniel.figueroa@domunnet.test'
const PASSWORD = 'mariobros25'

async function paso(nombre: string, fn: () => Promise<void>) {
  console.log(`\n=== ${nombre} ===`)
  try {
    await fn()
  } catch (error) {
    console.error('ERROR:', error)
    if (error && typeof error === 'object') {
      console.error('DETALLE JSON:', JSON.stringify(error, null, 2))
    }
  }
}

async function main() {
  await paso('1. signInWithPassword (Auth puro)', async () => {
    const { data, error } = await clienteSupabase.auth.signInWithPassword({
      email: EMAIL,
      password: PASSWORD,
    })

    if (error) {
      console.error('Supabase Auth error:', {
        message: error.message,
        status: error.status,
        name: error.name,
        stack: error.stack,
      })
      return
    }

    console.log('Auth OK:', {
      userId: data.user?.id,
      email: data.user?.email,
      emailConfirmed: !!data.user?.email_confirmed_at,
      session: !!data.session,
    })

    const authUserId = data.user!.id

    await paso('2. Consultar tabla usuario', async () => {
      const { data: usuario, error: errorUsuario } = await clienteSupabase
        .from('usuario')
        .select('id, auth_user_id, correo, rol_id, activo, dato_usuario(primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, telefono, avatar_url)')
        .or(`auth_user_id.eq.${authUserId},correo.eq.${EMAIL}`)
        .maybeSingle()

      if (errorUsuario) {
        console.error('Error usuario:', errorUsuario)
        return
      }

      console.log('usuario:', JSON.stringify(usuario, null, 2))

      if (!usuario) {
        console.error('usuario no encontrado')
        return
      }

      if (!usuario.activo) {
        console.error('usuario inactivo')
        return
      }

      if (!usuario.rol_id) {
        console.error('usuario sin rol_id')
        return
      }

      await paso('3. Consultar rol', async () => {
        const { data: rol, error: errorRol } = await clienteSupabase
          .from('rol')
          .select('*')
          .eq('id', usuario.rol_id)
          .maybeSingle()

        if (errorRol) {
          console.error('Error rol:', errorRol)
          return
        }

        console.log('rol:', JSON.stringify(rol, null, 2))

        await paso('4. Actualizar ultimo_acceso', async () => {
          const { error: errorAcceso } = await clienteSupabase
            .from('usuario')
            .update({ ultimo_acceso: new Date().toISOString() })
            .eq('id', usuario.id)

          if (errorAcceso) {
            console.error('Error ultimo_acceso:', errorAcceso)
            return
          }

          console.log('ultimo_acceso actualizado OK')
        })

        await paso('5. Insertar seguridad_log', async () => {
          const { error: errorLog } = await clienteSupabase.from('seguridad_log').insert({
            usuario_id: usuario.id,
            accion: 'login',
            ip: '127.0.0.1',
            user_agent: 'diagnostico-login',
            exitoso: true,
            detalles: {},
          })

          if (errorLog) {
            console.error('Error seguridad_log:', errorLog)
            return
          }

          console.log('seguridad_log insertado OK')
        })

        await paso('6. Firmar JWT', async () => {
          const jwtSecret = process.env.JWT_SECRET || 'domunnet-secret'
          const dato = Array.isArray(usuario.dato_usuario)
            ? usuario.dato_usuario[0]
            : usuario.dato_usuario
          const nombre = dato
            ? [dato.primer_nombre, dato.segundo_nombre, dato.primer_apellido, dato.segundo_apellido]
                .filter(Boolean)
                .join(' ')
            : 'Usuario'

          const permisos =
            rol?.permisos && Object.keys(rol.permisos || {}).length > 0
              ? Object.entries(rol.permisos).flatMap(([mod, acciones]) =>
                  (Array.isArray(acciones) ? acciones : []).map((a: string) => `${mod}.${a}`)
                )
              : []

          const token = jwt.sign(
            {
              sub: usuario.id,
              nombre,
              rol: rol?.nombre_rol,
              permisos,
            },
            jwtSecret,
            { expiresIn: '8h' }
          )

          console.log('JWT OK, length:', token.length)
        })
      })
    })
  })
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
