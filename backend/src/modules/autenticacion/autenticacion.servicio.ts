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

export class LimiteDispositivosError extends Error {
  dispositivosActivos: Array<{
    id: string
    dispositivo: string
    ip: string
    fechaHora: string
  }>

  constructor(dispositivos: Array<{ id: string; dispositivo: string; ip: string; fechaHora: string }>) {
    super('LIMITE_DISPOSITIVOS_ALCANZADO')
    this.name = 'LimiteDispositivosError'
    this.dispositivosActivos = dispositivos
  }
}

export function detectarNombreDispositivo(userAgent?: string): string {
  if (!userAgent) return 'Dispositivo Desconocido'
  const ua = userAgent.toLowerCase()
  let so = 'Dispositivo'
  if (ua.includes('iphone')) so = 'iPhone'
  else if (ua.includes('ipad')) so = 'iPad'
  else if (ua.includes('android')) so = 'Android'
  else if (ua.includes('windows nt 10.0') || ua.includes('windows')) so = 'Windows PC'
  else if (ua.includes('macintosh') || ua.includes('mac os')) so = 'Mac'
  else if (ua.includes('linux')) so = 'Linux'

  let nav = 'Navegador Web'
  if (ua.includes('edg/')) nav = 'Edge'
  else if (ua.includes('chrome/')) nav = 'Chrome'
  else if (ua.includes('firefox/')) nav = 'Firefox'
  else if (ua.includes('safari/')) nav = 'Safari'

  return `${so} (${nav})`
}

export function esCorreo(identificador: string): boolean {
  return identificador.includes('@')
}

export async function iniciarSesion(
  identificador: string,
  contrasena: string,
  ipAddress?: string,
  userAgent?: string,
  opcionesDispositivo?: {
    deviceId?: string
    nombreDispositivo?: string
    cerrarOtrasSesiones?: boolean
  }
) {
  let correo = identificador

  if (!esCorreo(identificador)) {
    // correo por username 
    const identificadorNormalizado = identificador.trim().toLowerCase()
    const { data: dato, error: errorBusqueda } = await clienteSupabase
      .from('dato_usuario')
      .select('username, usuario(correo)')
      .eq('username', identificadorNormalizado)
      .maybeSingle()

    if (errorBusqueda || !dato || !dato.usuario) {
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
    console.error('[autenticacion.servicio] Usuario inactivo / desactivado', {
      usuarioId: usuarioFila.id,
      correo: usuarioFila.correo,
    })
    throw new Error('DESACTIVADO')
  }

  // Consultar Rol y Logs de Concurrencia en paralelo para reducir el tiempo de respuesta a la mitad
  const cuatroHorasAtras = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
  const [resRol, resLogs] = await Promise.all([
    usuarioFila.rol_id
      ? clienteSupabase
          .from('rol')
          .select('nombre_rol, permisos, nivel_permisos')
          .eq('id', usuarioFila.rol_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    clienteSupabase
      .from('seguridad_log')
      .select('id, ip, user_agent, exitoso, detalles, fecha_hora, accion')
      .eq('usuario_id', usuarioFila.id)
      .in('accion', ['login', 'logout'])
      .gte('fecha_hora', cuatroHorasAtras)
      .order('fecha_hora', { ascending: false }),
  ])

  let rol: { nombre: string; permisos: string[]; nivel_permisos: number } = { nombre: 'Sin rol asignado', permisos: [], nivel_permisos: 0 }
  if (resRol?.data) {
    const dbRol = resRol.data as any
    const permisosMap = (dbRol.permisos || {}) as Record<string, string[]>
    const permisosPlanos: string[] = []
    for (const [mod, acciones] of Object.entries(permisosMap)) {
      for (const a of acciones || []) {
        if (a === '*' || a === '') permisosPlanos.push(mod)
        else permisosPlanos.push(`${mod}.${a}`)
      }
    }
    rol = {
      nombre: dbRol.nombre_rol || 'Sin rol asignado',
      permisos: permisosPlanos,
      nivel_permisos: dbRol.nivel_permisos ?? 0,
    }
  }

  const logsRecientes = resLogs?.data || []

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
        supabaseError: errorVinculo,
      })
      throw new Error(errorVinculo.message)
    }
  }

  const sessionId = randomUUID()
  const deviceIdActual = (opcionesDispositivo?.deviceId || '').trim() || `dev_${ipAddress || 'local'}_${(userAgent || '').substring(0, 30)}`
  const nombreDispositivo = opcionesDispositivo?.nombreDispositivo || detectarNombreDispositivo(userAgent)

  const token = jwt.sign(
    {
      sub: usuarioFila.id,
      nombre: nombreCompleto,
      rol: rol.nombre,
      permisos: rol.permisos,
      nivel_permisos: rol.nivel_permisos,
      deviceId: deviceIdActual,
      sessionId,
    },
    entorno.jwtSecret,
    { expiresIn: '8h' }
  )

  // Actualizar último acceso de forma no bloqueante en segundo plano
  clienteSupabase
    .from('usuario')
    .update({ ultimo_acceso: new Date().toISOString() })
    .eq('id', usuarioFila.id)
    .then(({ error: errAcceso }) => {
      if (errAcceso) console.error('[autenticacion.servicio] Error actualizando ultimo_acceso en background:', errAcceso.message)
    })

  // Rastrear dispositivos que cerraron sesión o están fuera
  const dispositivosCerrados = new Set<string>()
  for (const log of logsRecientes) {
    if (log.accion === 'logout') {
      const d = (log.detalles as any) || {}
      const devId = d.device_id || `legacy_${log.ip || 'ip'}_${(log.user_agent || '').substring(0, 30)}`
      dispositivosCerrados.add(devId)
    }
  }

  // Agrupar por device_id los dispositivos actualmente activos
  const mapaDispositivosActivos = new Map<string, { id: string; dispositivo: string; ip: string; fechaHora: string }>()
  for (const log of logsRecientes || []) {
    if (log.accion !== 'login') continue
    const d = (log.detalles as any) || {}
    const estado = d.estado
    const devId = d.device_id || `legacy_${log.ip || 'ip'}_${(log.user_agent || '').substring(0, 30)}`
    const esActivo = log.exitoso && estado !== 'cerrada' && estado !== 'revocada' && !dispositivosCerrados.has(devId)
    if (esActivo) {
      if (!mapaDispositivosActivos.has(devId)) {
        mapaDispositivosActivos.set(devId, {
          id: log.id,
          dispositivo: d.dispositivo || detectarNombreDispositivo(log.user_agent),
          ip: log.ip || 'Desconocida',
          fechaHora: log.fecha_hora,
        })
      }
    }
  }

  const esMismoDispositivo = mapaDispositivosActivos.has(deviceIdActual)
  const otrosDispositivosActivos = Array.from(mapaDispositivosActivos.entries())
    .filter(([devId]) => devId !== deviceIdActual)
    .map(([_, info]) => info)

  // Si ya existen 2 o más otros dispositivos con sesión abierta y este es un nuevo dispositivo:
  if (!esMismoDispositivo && otrosDispositivosActivos.length >= 2) {
    if (!opcionesDispositivo?.cerrarOtrasSesiones) {
      throw new LimiteDispositivosError(otrosDispositivosActivos)
    }

    // Si el usuario autorizó cerrar las otras sesiones para ingresar en este equipo
    const idsARevocar = (logsRecientes || [])
      .filter((l) => {
        const d = (l.detalles as any) || {}
        return l.exitoso && d.estado !== 'cerrada' && d.estado !== 'revocada'
      })
      .map((l) => l.id)

    if (idsARevocar.length > 0) {
      await clienteSupabase
        .from('seguridad_log')
        .update({
          exitoso: false,
          detalles: {
            estado: 'revocada',
            motivo: 'cierre_remoto_por_limite_dispositivos',
            cerrado_en: new Date().toISOString(),
          },
        })
        .in('id', idsARevocar)
    }
  }

  // Si es el mismo dispositivo, marcar sesiones anteriores de este mismo equipo como renovadas
  if (esMismoDispositivo) {
    const idsMismoDispositivo = (logsRecientes || [])
      .filter((l) => {
        const d = (l.detalles as any) || {}
        return l.exitoso && d.device_id === deviceIdActual
      })
      .map((l) => l.id)
    if (idsMismoDispositivo.length > 0) {
      await clienteSupabase
        .from('seguridad_log')
        .update({
          detalles: {
            estado: 'cerrada',
            motivo: 'renovacion_sesion_mismo_dispositivo',
            cerrado_en: new Date().toISOString(),
          },
        })
        .in('id', idsMismoDispositivo)
    }
  }

  const { error: errorLog } = await clienteSupabase.from('seguridad_log').insert({
    usuario_id: usuarioFila.id,
    accion: 'login',
    ip: ipAddress || null,
    user_agent: userAgent || null,
    exitoso: true,
    fecha_hora: new Date().toISOString(),
    detalles: {
      device_id: deviceIdActual,
      dispositivo: nombreDispositivo,
      session_id: sessionId,
      estado: 'activa',
      limite_sesiones: 'max_2_equipos',
    },
  })

  if (errorLog) {
    console.error('[autenticacion.servicio] Error insertando seguridad_log (login exitoso)', {
      usuarioId: usuarioFila.id,
      supabaseError: errorLog,
    })
  }

  return {
    token,
    usuario: {
      id: usuarioFila.id,
      nombre: nombreCompleto,
      correo: usuarioFila.correo,
      rol: rol.nombre,
      permisos: rol.permisos,
      nivel_permisos: rol.nivel_permisos,
    },
  }
}

export async function cerrarSesionUsuario(usuarioId?: string, deviceId?: string, sessionId?: string) {
  try {
    const cuatroHorasAtras = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
    let query = clienteSupabase
      .from('seguridad_log')
      .select('id, detalles, usuario_id')
      .eq('accion', 'login')
      .eq('exitoso', true)
      .gte('fecha_hora', cuatroHorasAtras)

    if (usuarioId) {
      query = query.eq('usuario_id', usuarioId)
    }

    const { data: logs } = await query

    if (logs && logs.length > 0) {
      const idsACerrar: string[] = []
      for (const log of logs) {
        const d = (log.detalles as any) || {}
        if (d.estado !== 'cerrada' && d.estado !== 'revocada') {
          if (!deviceId && !sessionId) {
            idsACerrar.push(log.id)
          } else if (sessionId && d.session_id === sessionId) {
            idsACerrar.push(log.id)
          } else if (deviceId && d.device_id === deviceId) {
            idsACerrar.push(log.id)
          }
        }
      }
      if (idsACerrar.length > 0) {
        await clienteSupabase
          .from('seguridad_log')
          .update({
            detalles: {
              estado: 'cerrada',
              motivo: 'cierre_sesion_usuario',
              cerrado_en: new Date().toISOString(),
            },
          })
          .in('id', idsACerrar)
      }
    }

    if (usuarioId) {
      await clienteSupabase.from('seguridad_log').insert({
        usuario_id: usuarioId,
        accion: 'logout',
        exitoso: true,
        fecha_hora: new Date().toISOString(),
        detalles: { device_id: deviceId, session_id: sessionId },
      })
    }
  } catch (error) {
    console.error('[autenticacion.servicio] Error en cerrarSesionUsuario:', error)
  }
}

export async function liberarDispositivo(deviceId: string) {
  try {
    if (!deviceId) return
    const cuatroHorasAtras = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
    const { data: logs } = await clienteSupabase
      .from('seguridad_log')
      .select('id, detalles')
      .eq('accion', 'login')
      .eq('exitoso', true)
      .gte('fecha_hora', cuatroHorasAtras)

    if (logs && logs.length > 0) {
      const idsACerrar: string[] = []
      for (const log of logs) {
        const d = (log.detalles as any) || {}
        if (d.device_id === deviceId && d.estado !== 'cerrada' && d.estado !== 'revocada') {
          idsACerrar.push(log.id)
        }
      }
      if (idsACerrar.length > 0) {
        await clienteSupabase
          .from('seguridad_log')
          .update({
            detalles: {
              estado: 'cerrada',
              motivo: 'dispositivo_en_login',
              cerrado_en: new Date().toISOString(),
            },
          })
          .in('id', idsACerrar)
      }
    }
  } catch (error) {
    console.warn('[autenticacion.servicio] Error en liberarDispositivo:', error)
  }
}

