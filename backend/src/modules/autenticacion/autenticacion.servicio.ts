import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'
import { clienteSupabase } from '@/configuracion/cliente-supabase'
import { entorno } from '@/configuracion/entorno'
import { obtenerRolPorId } from '@/modules/roles/roles.servicio'

type FilaUsuarioAutenticacion = {
  id: string
  auth_user_id: string | null
  correo: string
  rol_id: string | null
  activo: boolean
  dato_usuario: {
    nombre: string
    apellido: string
  } | {
    nombre: string
    apellido: string
  }[] | null
}

function obtenerNombreCompleto(dato: FilaUsuarioAutenticacion['dato_usuario']) {
  const registro = Array.isArray(dato) ? dato[0] : dato
  return registro ? `${registro.nombre} ${registro.apellido}`.trim() : 'Usuario'
}

export async function registrarSesion(usuarioId: string, ipAddress?: string, userAgent?: string) {
  const refreshToken = randomUUID()

  const { error } = await clienteSupabase
    .from('sesion_usuario')
    .upsert({
      usuario_id: usuarioId,
      refresh_token: refreshToken,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      ultimo_acceso: new Date().toISOString(),
      creado_en: new Date().toISOString()
    }, { onConflict: 'usuario_id' })

  if (error) {
    throw new Error(`Error registrando sesión: ${error.message}`)
  }

  return refreshToken
}

export async function iniciarSesion(correo: string, contrasena: string, ipAddress?: string, userAgent?: string) {
  const { data: accesoAuth, error: errorAuth } = await clienteSupabase.auth.signInWithPassword({
    email: correo,
    password: contrasena,
  })

  if (errorAuth || !accesoAuth.user) {
    return null
  }

  const { data: usuario, error } = await clienteSupabase
    .from('usuario')
    .select('id, auth_user_id, correo, rol_id, activo, dato_usuario(nombre, apellido)')
    .or(`auth_user_id.eq.${accesoAuth.user.id},correo.eq.${accesoAuth.user.email || correo}`)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  const usuarioFila = usuario as FilaUsuarioAutenticacion | null
  if (!usuarioFila) {
    return null
  }

  if (!usuarioFila.activo) {
    return null
  }

  if (!usuarioFila.rol_id) {
    return null
  }

  const rol = await obtenerRolPorId(usuarioFila.rol_id)
  if (!rol) {
    return null
  }

  const nombreCompleto = obtenerNombreCompleto(usuarioFila.dato_usuario)

  if (!usuarioFila.auth_user_id) {
    const { error: errorVinculo } = await clienteSupabase
      .from('usuario')
      .update({ auth_user_id: accesoAuth.user.id, updated_at: new Date().toISOString() })
      .eq('id', usuarioFila.id)

    if (errorVinculo) {
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

  // Registrar sesión única en la base de datos (con refresh token)
  const refreshToken = await registrarSesion(usuarioFila.id, ipAddress, userAgent)

  const { error: errorAcceso } = await clienteSupabase
    .from('usuario')
    .update({ ultimo_acceso: new Date().toISOString() })
    .eq('id', usuarioFila.id)

  if (errorAcceso) {
    throw new Error(errorAcceso.message)
  }

  return {
    token,
    refreshToken,
    usuario: {
      id: usuarioFila.id,
      nombre: nombreCompleto,
      correo: usuarioFila.correo,
      rol: rol.nombre,
      permisos: rol.permisos,
    },
  }
}

export async function refrescarSesion(refreshTokenActual: string, ipAddress?: string, userAgent?: string) {
  const { data: sesion, error: errorSesion } = await clienteSupabase
    .from('sesion_usuario')
    .select('usuario_id, refresh_token')
    .eq('refresh_token', refreshTokenActual)
    .maybeSingle()

  if (errorSesion || !sesion) {
    return null
  }

  const { data: usuario, error: errorUsuario } = await clienteSupabase
    .from('usuario')
    .select('id, correo, rol_id, activo, dato_usuario(nombre, apellido)')
    .eq('id', sesion.usuario_id)
    .maybeSingle()

  if (errorUsuario || !usuario) {
    return null
  }

  const rol = usuario.rol_id ? await obtenerRolPorId(usuario.rol_id) : null
  if (!rol) {
    return null
  }

  if (!usuario.activo) {
    return null
  }

  const nombreCompleto = obtenerNombreCompleto(usuario.dato_usuario)

  const token = jwt.sign(
    {
      sub: usuario.id,
      nombre: nombreCompleto,
      rol: rol.nombre,
      permisos: rol.permisos,
    },
    entorno.jwtSecret,
    { expiresIn: '8h' }
  )

  const nuevoRefreshToken = await registrarSesion(usuario.id, ipAddress, userAgent)

  return {
    token,
    refreshToken: nuevoRefreshToken,
    usuario: {
      id: usuario.id,
      nombre: nombreCompleto,
      correo: usuario.correo,
      rol: rol.nombre,
      permisos: rol.permisos,
    },
  }
}
