import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'
import { clienteSupabase } from '@/configuracion/cliente-supabase'
import { entorno } from '@/configuracion/entorno'
import { obtenerRolPorId } from '@/modules/roles/roles.servicio'

export type FilaUsuarioAutenticacion = {
  id: string
  auth_user_id: string | null
  correo: string
  rol_id: string | null
  activo: boolean
  dato_usuario: {
    primer_nombre: string
    segundo_nombre?: string | null
    primer_apellido: string
    segundo_apellido?: string | null
    telefono?: string | null
    avatar_url?: string | null
  } | {
    primer_nombre: string
    segundo_nombre?: string | null
    primer_apellido: string
    segundo_apellido?: string | null
    telefono?: string | null
    avatar_url?: string | null
  }[] | null
}

export function obtenerNombreCompleto(dato: FilaUsuarioAutenticacion['dato_usuario']) {
  const registro = Array.isArray(dato) ? dato[0] : dato
  if (!registro) return 'Usuario'
  const partes = [registro.primer_nombre, registro.segundo_nombre, registro.primer_apellido, registro.segundo_apellido]
  return partes.filter(Boolean).join(' ').trim() || 'Usuario'
}

export function esCorreo(identificador: string): boolean {
  return identificador.includes('@')
}

// NOTE: Session management and refresh tokens are delegated to Supabase Auth.
// We no longer persist `sesion_usuario` in the database.

export async function iniciarSesion(identificador: string, contrasena: string, ipAddress?: string, userAgent?: string) {
  let correo = identificador

  if (!esCorreo(identificador)) {
    // Buscar correo por username en dato_usuario, haciendo join con usuario
    const identificadorNormalizado = identificador.trim().toLowerCase()
    const { data: dato, error: errorBusqueda } = await clienteSupabase
      .from('dato_usuario')
      .select('username, usuario(correo)')
      .eq('username', identificadorNormalizado)
      .maybeSingle()

    if (errorBusqueda || !dato || !dato.usuario) {
      // Registrar intento fallido en seguridad_log
      await clienteSupabase.from('seguridad_log').insert({
        usuario_id: null,
        accion: 'login',
        ip: ipAddress || null,
        user_agent: userAgent || null,
        exitoso: false,
        detalles: { reason: 'Credenciales inválidas (username no encontrado)' },
      })
      return null
    }

    const usuarioDato = dato.usuario as any
    const correoEncontrado = Array.isArray(usuarioDato) ? usuarioDato[0]?.correo : usuarioDato?.correo
    
    if (!correoEncontrado) {
      return null
    }
    
    correo = correoEncontrado
  }

  const { data: accesoAuth, error: errorAuth } = await clienteSupabase.auth.signInWithPassword({
    email: correo,
    password: contrasena,
  })

  // Limpiar el contexto de auth después de signInWithPassword para que las consultas
  // posteriores usen service_role en lugar de authenticated
  await clienteSupabase.auth.signOut()

  if (errorAuth || !accesoAuth.user) {
    console.error('[autenticacion.servicio] signInWithPassword falló → retornando null', {
      identificador,
      correo,
      supabaseError: errorAuth
        ? {
            message: errorAuth.message,
            status: (errorAuth as any).status,
            name: errorAuth.name,
            code: (errorAuth as any).code,
            __isAuthError: (errorAuth as any).__isAuthError,
            toJSON: JSON.stringify(errorAuth),
          }
        : 'sin error pero sin user',
      hasUser: !!accesoAuth?.user,
    })

    // Registrar intento fallido en seguridad_log
    await clienteSupabase.from('seguridad_log').insert({
      usuario_id: null,
      accion: 'login',
      ip: ipAddress || null,
      user_agent: userAgent || null,
      exitoso: false,
      detalles: { reason: errorAuth?.message || 'Credenciales inválidas' },
    })

    return null
  }

  const { data: usuario, error } = await clienteSupabase
    .from('usuario')
    .select('id, auth_user_id, correo, rol_id, activo, dato_usuario(primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, telefono, avatar_url)')
    .or(`auth_user_id.eq.${accesoAuth.user.id},correo.eq.${accesoAuth.user.email || correo}`)
    .maybeSingle()

  if (error) {
    console.error('[autenticacion.servicio] Error consultando usuario tras Auth OK', {
      identificador,
      correo,
      authUserId: accesoAuth.user.id,
      supabaseError: {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      },
    })
    throw new Error(error.message)
  }

  const usuarioFila = usuario as FilaUsuarioAutenticacion | null
  if (!usuarioFila) {
    console.error('[autenticacion.servicio] Auth OK pero sin fila en tabla usuario → retornando null', {
      identificador,
      correo,
      authUserId: accesoAuth.user.id,
    })
    return null
  }

  if (!usuarioFila.activo) {
    console.error('[autenticacion.servicio] Usuario inactivo', {
      usuarioId: usuarioFila.id,
      correo: usuarioFila.correo,
    })
    return null
  }

  if (!usuarioFila.rol_id) {
    console.error('[autenticacion.servicio] Usuario sin rol_id', {
      usuarioId: usuarioFila.id,
      correo: usuarioFila.correo,
    })
    return null
  }

  let rol
  try {
    rol = await obtenerRolPorId(usuarioFila.rol_id)
  } catch (errorRol) {
    console.error('[autenticacion.servicio] Error obteniendo rol', {
      usuarioId: usuarioFila.id,
      rolId: usuarioFila.rol_id,
      error: errorRol,
    })
    throw errorRol
  }

  if (!rol) {
    console.error('[autenticacion.servicio] Rol no encontrado', {
      usuarioId: usuarioFila.id,
      rolId: usuarioFila.rol_id,
    })
    return null
  }

  const nombreCompleto = obtenerNombreCompleto(usuarioFila.dato_usuario)

  if (!usuarioFila.auth_user_id) {
    const { error: errorVinculo } = await clienteSupabase
      .from('usuario')
      .update({ auth_user_id: accesoAuth.user.id, updated_at: new Date().toISOString() })
      .eq('id', usuarioFila.id)

    if (errorVinculo) {
      console.error('[autenticacion.servicio] Error vinculando auth_user_id', {
        usuarioId: usuarioFila.id,
        authUserId: accesoAuth.user.id,
        supabaseError: {
          message: errorVinculo.message,
          code: errorVinculo.code,
          details: errorVinculo.details,
          hint: errorVinculo.hint,
        },
      })
      throw new Error(errorVinculo.message)
    }
  }

  const token = jwt.sign(
    {
      sub: usuarioFila.id,
      nombre: nombreCompleto,
      rol: rol.nombre,
      permisos: rol.permisos,
    },
    entorno.jwtSecret,
    { expiresIn: '8h' }
  )
  const { error: errorAcceso } = await clienteSupabase
    .from('usuario')
    .update({ ultimo_acceso: new Date().toISOString() })
    .eq('id', usuarioFila.id)

  if (errorAcceso) {
    console.error('[autenticacion.servicio] Error actualizando ultimo_acceso', {
      usuarioId: usuarioFila.id,
      supabaseError: {
        message: errorAcceso.message,
        code: errorAcceso.code,
        details: errorAcceso.details,
        hint: errorAcceso.hint,
      },
    })
    throw new Error(errorAcceso.message)
  }

  // Registrar evento de seguridad: login exitoso
  const { error: errorLog } = await clienteSupabase.from('seguridad_log').insert({
    usuario_id: usuarioFila.id,
    accion: 'login',
    ip: ipAddress || null,
    user_agent: userAgent || null,
    exitoso: true,
    detalles: {},
  })

  if (errorLog) {
    console.error('[autenticacion.servicio] Error insertando seguridad_log (login exitoso)', {
      usuarioId: usuarioFila.id,
      supabaseError: {
        message: errorLog.message,
        code: errorLog.code,
        details: errorLog.details,
        hint: errorLog.hint,
      },
    })
    throw new Error(errorLog.message)
  }

  return {
    token,
    usuario: {
      id: usuarioFila.id,
      nombre: nombreCompleto,
      correo: usuarioFila.correo,
      rol: rol.nombre,
      permisos: rol.permisos,
    },
  }
}
// refresco de sesión ahora debe delegarse a Supabase Auth desde el cliente.
