import { detectarNombreDispositivo } from '@/modules/autenticacion/autenticacion.servicio'
import { clienteSupabase } from '@/configuracion/cliente-supabase'

export interface FiltrosUsuarios {
  busqueda?: string
  rol?: string
  estado?: 'Activo' | 'Inactivo' | 'Suspendido' | 'Todos'
}

export interface DatosUsuario {
  primer_nombre: string
  segundo_nombre?: string | null
  primer_apellido: string
  segundo_apellido?: string | null
  correo: string
  telefono: string
  rol: string
  estado: 'Activo' | 'Inactivo' | 'Suspendido'
  contrasena?: string
  proyectosAsignados?: string[]
  username?: string | null
  fecha_nacimiento?: string | null
  direccion?: string | null
}

export type FilaUsuarioJoin = {
  id: string
  auth_user_id: string | null
  correo: string
  rol_id: string | null
  activo: boolean
  ultimo_acceso: string | null
  fecha_registro: string
  updated_at: string
  dato_usuario: {
    primer_nombre: string
    segundo_nombre?: string | null
    primer_apellido: string
    segundo_apellido?: string | null
    telefono: string | null
    avatar_url?: string | null
    username?: string | null
    fecha_nacimiento?: string | null
    direccion?: string | null
  } | {
    primer_nombre: string
    segundo_nombre?: string | null
    primer_apellido: string
    segundo_apellido?: string | null
    telefono: string | null
    avatar_url?: string | null
    username?: string | null
    fecha_nacimiento?: string | null
    direccion?: string | null
  }[] | null
}

type FilaRol = {
  id: string
  nombre_rol: string
}

export function normalizar(texto: string) {
  return texto.trim().replace(/\s+/g, ' ').toLowerCase()
}

export function capitalizarNombrePropio(texto?: string | null): string {
  if (!texto) return ''
  return texto.replace(/[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]+/g, (p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
}

export function formatearFecha(valor: string | null) {
  if (!valor) return 'Nunca'
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return valor
  return fecha.toLocaleDateString('es-GT')
}

export function mapearUsuario(fila: FilaUsuarioJoin, nombreRol: string | null, sesionesActivas: any[] = []) {
  const dato = Array.isArray(fila.dato_usuario) ? fila.dato_usuario[0] : fila.dato_usuario
  const primerNom = capitalizarNombrePropio(dato?.primer_nombre)
  const segundoNom = capitalizarNombrePropio(dato?.segundo_nombre)
  const primerApe = capitalizarNombrePropio(dato?.primer_apellido)
  const segundoApe = capitalizarNombrePropio(dato?.segundo_apellido)

  const nombreCompleto = dato
    ? [primerNom, segundoNom, primerApe, segundoApe]
        .map((p) => (p ?? '').trim())
        .filter(Boolean)
        .join(' ') || 'Sin Nombre'
    : 'Sin Nombre'

  let estadoCalculado: 'Activo' | 'Inactivo' | 'Suspendido' = 'Suspendido'
  if (fila.activo) {
    estadoCalculado = sesionesActivas.length > 0 ? 'Activo' : 'Inactivo'
  }

  return {
    id: fila.id,
    primer_nombre: primerNom,
    segundo_nombre: segundoNom,
    primer_apellido: primerApe,
    segundo_apellido: segundoApe,
    username: dato?.username || '',
    nombre: nombreCompleto,
    correo: fila.correo,
    telefono: dato?.telefono || '',
    direccion: dato?.direccion || '',
    fecha_nacimiento: dato?.fecha_nacimiento || null,
    rol: nombreRol || 'Sin asignar',
    estado: estadoCalculado,
    proyectosAsignados: [],
    sesionesActivasCount: sesionesActivas.length,
    dispositivosActivos: sesionesActivas,
    ultimoAcceso: formatearFecha(fila.ultimo_acceso),
    fechaCreacion: formatearFecha(fila.fecha_registro),
  }
}

async function obtenerRolPorNombre(nombre: string) {
  const { data, error } = await clienteSupabase
    .from('rol')
    .select('id, nombre_rol')
    .ilike('nombre_rol', nombre.trim())
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (data) return (data as FilaRol | null) || null

  // Fallback con normalización (sin espacios ni acentos, minúsculas)
  const norm = nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '')
  const { data: todosRoles, error: errTodos } = await clienteSupabase
    .from('rol')
    .select('id, nombre_rol')
  if (!errTodos && todosRoles) {
    const encontrado = todosRoles.find((r: any) => {
      const rNorm = String(r.nombre_rol || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '')
      return rNorm === norm
    })
    if (encontrado) return encontrado as FilaRol
  }

  return null
}

async function obtenerRolesPorId() {
  const { data, error } = await clienteSupabase.from('rol').select('id, nombre_rol')
  if (error) throw new Error(error.message)

  return new Map((data || []).map((rol: FilaRol) => [rol.id, rol.nombre_rol]))
}

async function obtenerUsuariosBase() {
  const { data, error } = await clienteSupabase
    .from('usuario')
    .select('id, auth_user_id, correo, rol_id, activo, ultimo_acceso, fecha_registro, updated_at, dato_usuario(primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, telefono, avatar_url, username, fecha_nacimiento, direccion)')
    .order('fecha_registro', { ascending: false })

  if (error) throw new Error(error.message)
  return data as FilaUsuarioJoin[]
}

export async function listarUsuarios(filtros: FiltrosUsuarios = {}) {
  const ochoHorasAtras = new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
  const [usuarios, mapaRoles, resLogs] = await Promise.all([
    obtenerUsuariosBase(),
    obtenerRolesPorId(),
    clienteSupabase
      .from('seguridad_log')
      .select('id, usuario_id, accion, exitoso, detalles, fecha_hora, ip, user_agent')
      .eq('exitoso', true)
      .in('accion', ['login', 'logout'])
      .gte('fecha_hora', ochoHorasAtras)
      .order('fecha_hora', { ascending: false }),
  ])

  const mapaLogs = new Map<string, any[]>()
  for (const l of resLogs.data || []) {
    if (!l.usuario_id) continue
    if (!mapaLogs.has(l.usuario_id)) mapaLogs.set(l.usuario_id, [])
    mapaLogs.get(l.usuario_id)!.push(l)
  }

  const mapaSesionesActivas = new Map<string, any[]>()
  for (const [uid, userLogs] of mapaLogs.entries()) {
    const devicesVistos = new Set<string>()
    const activas: any[] = []
    for (const l of userLogs) {
      const d = (l.detalles as any) || {}
      const devId = d.device_id || l.id
      if (devicesVistos.has(devId)) continue
      devicesVistos.add(devId)
      if (l.accion === 'login' && d.estado === 'activa') {
        activas.push({
          id: l.id,
          deviceId: devId,
          sessionId: d.session_id,
          dispositivo: d.dispositivo || detectarNombreDispositivo(l.user_agent),
          ip: l.ip || 'Red Local / Internet',
          fechaHora: l.fecha_hora,
        })
      }
    }
    mapaSesionesActivas.set(uid, activas)
  }

  const busqueda = normalizar(filtros.busqueda || '')

  return usuarios.filter((usuario) => {
    const dato = Array.isArray(usuario.dato_usuario) ? usuario.dato_usuario[0] : usuario.dato_usuario
    const nombreCompleto = dato ? `${dato.primer_nombre} ${dato.segundo_nombre || ''} ${dato.primer_apellido} ${dato.segundo_apellido || ''}`.replace(/\s+/g, ' ').trim() : ''
    const nombreRol = usuario.rol_id ? mapaRoles.get(usuario.rol_id) || 'Sin asignar' : 'Sin asignar'
    
    const sesiones = mapaSesionesActivas.get(usuario.id) || []
    let estadoStr: 'Activo' | 'Inactivo' | 'Suspendido' = 'Suspendido'
    if (usuario.activo) {
      estadoStr = sesiones.length > 0 ? 'Activo' : 'Inactivo'
    }

    const cumpleBusqueda =
      !busqueda ||
      normalizar(nombreCompleto).includes(busqueda) ||
      normalizar(usuario.correo).includes(busqueda) ||
      normalizar(nombreRol).includes(busqueda)

    const cumpleRol = !filtros.rol || filtros.rol === 'Todos' || nombreRol === filtros.rol
    const cumpleEstado = !filtros.estado || filtros.estado === 'Todos' || estadoStr === filtros.estado

    return cumpleBusqueda && cumpleRol && cumpleEstado
  }).map((usuario) => mapearUsuario(usuario, usuario.rol_id ? mapaRoles.get(usuario.rol_id) || null : null, mapaSesionesActivas.get(usuario.id) || []))
}

export async function obtenerUsuarioPorId(id: string) {
  const [resData, mapaRoles, sesiones] = await Promise.all([
    clienteSupabase
      .from('usuario')
      .select('id, correo, rol_id, activo, ultimo_acceso, fecha_registro, updated_at, dato_usuario(primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, telefono, avatar_url, username, fecha_nacimiento, direccion)')
      .eq('id', id)
      .maybeSingle(),
    obtenerRolesPorId(),
    obtenerSesionesActivasUsuario(id),
  ])

  if (resData.error) throw new Error(resData.error.message)
  if (!resData.data) return null

  const fila = resData.data as FilaUsuarioJoin
  return mapearUsuario(fila, fila.rol_id ? mapaRoles.get(fila.rol_id) || null : null, sesiones)
}

export async function obtenerSesionesActivasUsuario(usuarioId: string) {
  const ochoHorasAtras = new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
  const { data: logs, error } = await clienteSupabase
    .from('seguridad_log')
    .select('id, usuario_id, accion, exitoso, detalles, fecha_hora, ip, user_agent')
    .eq('usuario_id', usuarioId)
    .eq('exitoso', true)
    .in('accion', ['login', 'logout'])
    .gte('fecha_hora', ochoHorasAtras)
    .order('fecha_hora', { ascending: false })

  if (error || !logs) return []

  const mapaDispositivos = new Map<string, any>()
  const dispositivosCerrados = new Set<string>()

  for (const log of logs) {
    const d = (log.detalles as any) || {}
    const devId = d.device_id || `dev_${log.ip || 'ip'}_${(log.user_agent || '').substring(0, 20)}`

    if (log.accion === 'logout' || d.estado === 'cerrada' || d.estado === 'revocada') {
      dispositivosCerrados.add(devId)
      continue
    }

    if (log.accion === 'login' && d.estado === 'activa' && !dispositivosCerrados.has(devId)) {
      if (!mapaDispositivos.has(devId)) {
        mapaDispositivos.set(devId, {
          id: log.id,
          deviceId: devId,
          sessionId: d.session_id,
          dispositivo: d.dispositivo || detectarNombreDispositivo(log.user_agent),
          ip: log.ip || 'Red Local / Internet',
          fechaHora: log.fecha_hora,
          estado: 'activa',
        })
      }
    }
  }

  return Array.from(mapaDispositivos.values())
}

export async function cerrarSesionUsuarioRemota(
  usuarioId: string,
  opciones?: { deviceId?: string; sessionId?: string; cerrarTodas?: boolean; cerradoPor?: string }
) {
  const ochoHorasAtras = new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
  const { data: logs } = await clienteSupabase
    .from('seguridad_log')
    .select('id, detalles, usuario_id')
    .eq('usuario_id', usuarioId)
    .eq('accion', 'login')
    .eq('exitoso', true)
    .gte('fecha_hora', ochoHorasAtras)

  if (logs && logs.length > 0) {
    const idsACerrar: string[] = []
    for (const log of logs) {
      const d = (log.detalles as any) || {}
      if (d.estado !== 'cerrada' && d.estado !== 'revocada') {
        if (opciones?.cerrarTodas || (!opciones?.deviceId && !opciones?.sessionId)) {
          idsACerrar.push(log.id)
        } else if (opciones?.sessionId && d.session_id === opciones.sessionId) {
          idsACerrar.push(log.id)
        } else if (opciones?.deviceId && d.device_id === opciones.deviceId) {
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
            motivo: 'cierre_remoto_admin',
            cerrado_por: opciones?.cerradoPor || 'admin',
            cerrado_en: new Date().toISOString(),
          },
        })
        .in('id', idsACerrar)
    }
  }

  // Insertar evento logout en seguridad_log
  await clienteSupabase.from('seguridad_log').insert({
    usuario_id: usuarioId,
    accion: 'logout',
    exitoso: true,
    fecha_hora: new Date().toISOString(),
    detalles: {
      motivo: 'cierre_remoto_admin',
      cerrado_por: opciones?.cerradoPor || 'admin',
      device_id: opciones?.deviceId,
      session_id: opciones?.sessionId,
      cerrarTodas: Boolean(opciones?.cerrarTodas),
    },
  })

  // Broadcast realtime
  try {
    const channel = clienteSupabase.channel('domun_sesiones_control')
    await channel.send({
      type: 'broadcast',
      event: 'cierre_sesion',
      payload: {
        usuarioId,
        deviceId: opciones?.deviceId,
        sessionId: opciones?.sessionId,
        cerrarTodas: Boolean(opciones?.cerrarTodas),
        cerradoPor: opciones?.cerradoPor,
        timestamp: Date.now(),
      },
    })
  } catch (err) {
    console.warn('[cerrarSesionUsuarioRemota] Error enviando broadcast:', err)
  }

  return true
}

async function validarRolExiste(rol: string) {
  const encontrado = await obtenerRolPorNombre(rol)
  if (!encontrado) {
    throw new Error('El rol seleccionado no existe')
  }
  return encontrado
}

async function validarCorreoUnico(correo: string, idIgnorado?: string) {
  const { data, error } = await clienteSupabase.from('usuario').select('id, correo').ilike('correo', correo)
  if (error) throw new Error(error.message)

  const conflicto = (data || []).find(
    (registro: { id: string; correo: string }) => !idIgnorado || registro.id !== idIgnorado
  )
  if (conflicto) {
    throw new Error('Ya existe un usuario con ese correo')
  }
}

async function validarUsernameUnico(username: string, idUsuarioIgnorado?: string) {
  const usernameNormalizado = username.trim().toLowerCase()
  const { data, error } = await clienteSupabase
    .from('dato_usuario')
    .select('usuario_id, username')
    .ilike('username', usernameNormalizado)
  if (error) throw new Error(error.message)

  const conflicto = (data || []).find(
    (registro: { usuario_id: string; username: string }) => !idUsuarioIgnorado || registro.usuario_id !== idUsuarioIgnorado
  )
  if (conflicto) {
    throw new Error('Ya existe un usuario con ese username')
  }
}


export async function verificarCorreoDisponible(correo: string, excluirId?: string): Promise<boolean> {
  try {
    await validarCorreoUnico(correo, excluirId)
    return true
  } catch (error) {
    return false
  }
}

export async function verificarUsernameDisponible(username: string, excluirId?: string): Promise<boolean> {
  try {
    await validarUsernameUnico(username, excluirId)
    return true
  } catch (error) {
    return false
  }
}

async function obtenerCuentaUsuario(id: string) {
  const { data, error } = await clienteSupabase
    .from('usuario')
    .select('id, auth_user_id, correo')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data as { id: string; auth_user_id: string | null; correo: string } | null
}

export async function crearUsuario(datos: DatosUsuario) {
  const rol = await validarRolExiste(datos.rol)
  await validarCorreoUnico(datos.correo)

  let usernameUnico = datos.username?.trim().toLowerCase()
  if (usernameUnico) {
    await validarUsernameUnico(usernameUnico)
  } else {
    // Generar username único con fallback
    const inicialNombre = normalizar(datos.primer_nombre).charAt(0)
    const apellidoNormalizado = normalizar(datos.primer_apellido).replace(/\s+/g, '')
    const usernameBase = `${inicialNombre}${apellidoNormalizado}`

    usernameUnico = usernameBase
    let contador = 1
    let existe = true

    while (existe) {
      const { data, error } = await clienteSupabase
        .from('dato_usuario')
        .select('username')
        .eq('username', usernameUnico)
        .maybeSingle()

      if (error) throw new Error(error.message)

      if (data) {
        contador++
        usernameUnico = `${usernameBase}${contador}`
      } else {
        existe = false
      }
    }
  }

  const contrasena = datos.contrasena || 'Temporal123*'
  const { data: cuentaAuth, error: errorAuth } = await clienteSupabase.auth.admin.createUser({
    email: datos.correo,
    password: contrasena,
    email_confirm: true,
    user_metadata: {
      nombre: datos.primer_nombre,
      apellido: datos.primer_apellido,
      telefono: datos.telefono,
      rol: datos.rol,
    },
  })

  if (errorAuth || !cuentaAuth.user) {
    throw new Error(errorAuth?.message || 'No se pudo crear la cuenta de autenticación')
  }

  // 1. Insertar cuenta de usuario
  const { data: nuevoUsuario, error: errorUsuario } = await clienteSupabase
    .from('usuario')
    .insert({
      auth_user_id: cuentaAuth.user.id,
      correo: datos.correo,
      rol_id: rol.id,
      activo: datos.estado !== 'Suspendido',
    })
    .select('id')
    .single()

  if (errorUsuario) {
    await clienteSupabase.auth.admin.deleteUser(cuentaAuth.user.id)
    throw new Error(errorUsuario.message)
  }

  // 2. Insertar detalles del usuario en dato_usuario
  const { error: errorDato } = await clienteSupabase
    .from('dato_usuario')
    .insert({
      usuario_id: nuevoUsuario.id,
      primer_nombre: capitalizarNombrePropio(datos.primer_nombre),
      segundo_nombre: datos.segundo_nombre ? capitalizarNombrePropio(datos.segundo_nombre) : null,
      primer_apellido: capitalizarNombrePropio(datos.primer_apellido),
      segundo_apellido: datos.segundo_apellido ? capitalizarNombrePropio(datos.segundo_apellido) : null,
      telefono: datos.telefono,
      email: datos.correo,
      username: usernameUnico,
      password_hash: null, // explicit NULL
      fecha_nacimiento: datos.fecha_nacimiento || null,
      direccion: datos.direccion || null,
    })

  if (errorDato) {
    // Rollback manual de la cuenta de usuario para mantener consistencia
    await clienteSupabase.from('usuario').delete().eq('id', nuevoUsuario.id)
    await clienteSupabase.auth.admin.deleteUser(cuentaAuth.user.id)
    throw new Error(errorDato.message)
  }

  return obtenerUsuarioPorId(nuevoUsuario.id)
}

export async function actualizarUsuario(id: string, datos: DatosUsuario) {
  const usuarioExistente = await obtenerUsuarioPorId(id)
  if (!usuarioExistente) {
    throw new Error('Usuario no encontrado')
  }

  const cuentaUsuario = await obtenerCuentaUsuario(id)

  const rol = await validarRolExiste(datos.rol)
  await validarCorreoUnico(datos.correo, id)

  // Obtener dato_usuario actual para ver si ya tiene username, fecha_nacimiento y direccion
  const { data: datoActual } = await clienteSupabase
    .from('dato_usuario')
    .select('username, fecha_nacimiento, direccion')
    .eq('usuario_id', id)
    .maybeSingle()

  const fechaNacimientoFinal = datos.fecha_nacimiento !== undefined ? (datos.fecha_nacimiento || null) : (datoActual?.fecha_nacimiento || null)
  const direccionFinal = datos.direccion !== undefined ? (datos.direccion || null) : (datoActual?.direccion || null)

  let usernameFinal = datos.username?.trim().toLowerCase()
  if (usernameFinal) {
    if (usernameFinal !== datoActual?.username) {
      await validarUsernameUnico(usernameFinal, id)
    }
  } else {
    usernameFinal = datoActual?.username
    if (!usernameFinal) {
      // Generar username único con fallback
      const inicialNombre = normalizar(datos.primer_nombre).charAt(0)
      const apellidoNormalizado = normalizar(datos.primer_apellido).replace(/\s+/g, '')
      const usernameBase = `${inicialNombre}${apellidoNormalizado}`

      let usernameUnico = usernameBase
      let contador = 1
      let existe = true

      while (existe) {
        const { data, error } = await clienteSupabase
          .from('dato_usuario')
          .select('username')
          .eq('username', usernameUnico)
          .maybeSingle()

        if (error) throw new Error(error.message)

        if (data) {
          contador++
          usernameUnico = `${usernameBase}${contador}`
        } else {
          existe = false
        }
      }
      usernameFinal = usernameUnico
    }
  }

  const payloadUsuario: Record<string, unknown> = {
    correo: datos.correo,
    rol_id: rol.id,
    activo: datos.estado !== 'Suspendido',
    updated_at: new Date().toISOString()
  }

  if (cuentaUsuario?.auth_user_id) {
    const payloadAuth: Record<string, unknown> = {
      email: datos.correo,
      email_confirm: true,
    }

    if (datos.contrasena) {
      payloadAuth.password = datos.contrasena
    }

    const { error: errorAuth } = await clienteSupabase.auth.admin.updateUserById(
      cuentaUsuario.auth_user_id,
      payloadAuth
    )

    if (errorAuth) {
      throw new Error(errorAuth.message)
    }
  }

  // 1. Actualizar cuenta de usuario
  const { error: errorUsuario } = await clienteSupabase.from('usuario').update(payloadUsuario).eq('id', id)
  if (errorUsuario) throw new Error(errorUsuario.message)

  // 2. Actualizar o insertar dato_usuario
  const { error: errorDato } = await clienteSupabase
    .from('dato_usuario')
    .upsert({
      usuario_id: id,
      primer_nombre: capitalizarNombrePropio(datos.primer_nombre),
      segundo_nombre: datos.segundo_nombre ? capitalizarNombrePropio(datos.segundo_nombre) : null,
      primer_apellido: capitalizarNombrePropio(datos.primer_apellido),
      segundo_apellido: datos.segundo_apellido ? capitalizarNombrePropio(datos.segundo_apellido) : null,
      telefono: datos.telefono,
      email: datos.correo,
      username: usernameFinal,
      password_hash: null, // explicit NULL
      fecha_nacimiento: fechaNacimientoFinal,
      direccion: direccionFinal,
      updated_at: new Date().toISOString()
    }, { onConflict: 'usuario_id' })

  if (errorDato) throw new Error(errorDato.message)

  return obtenerUsuarioPorId(id)
}

export async function eliminarUsuario(id: string) {
  const usuario = await obtenerUsuarioPorId(id)
  if (!usuario) {
    throw new Error('Usuario no encontrado')
  }

  const cuentaUsuario = await obtenerCuentaUsuario(id)

  if (cuentaUsuario?.auth_user_id) {
    const { error: errorAuth } = await clienteSupabase.auth.admin.deleteUser(cuentaUsuario.auth_user_id)
    if (errorAuth) {
      throw new Error(errorAuth.message)
    }
  }

  const { error } = await clienteSupabase.from('usuario').delete().eq('id', id)
  if (error) throw new Error(error.message)

  return usuario
}

export async function listarDelegadosResidente(busqueda?: string) {
  const [rolIngRes, rolAdmin, mapaRoles] = await Promise.all([
    obtenerRolPorNombre('IngenieroResidente'),
    obtenerRolPorNombre('Administrador'),
    obtenerRolesPorId(),
  ])

  const rolIds: string[] = []
  if (rolIngRes?.id) rolIds.push(rolIngRes.id)
  if (rolAdmin?.id) rolIds.push(rolAdmin.id)

  if (rolIds.length === 0) return []

  const { data, error } = await clienteSupabase
    .from('usuario')
    .select('id, correo, rol_id, dato_usuario(primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, username)')
    .eq('activo', true)
    .in('rol_id', rolIds)

  if (error || !data) {
    console.error('Error al listar delegados residente:', error)
    return []
  }

  const busquedaNorm = normalizar(busqueda || '')

  return data
    .map((fila: any) => {
      const dato = Array.isArray(fila.dato_usuario) ? fila.dato_usuario[0] : fila.dato_usuario
      const nombreParts = dato
        ? [dato.primer_nombre, dato.segundo_nombre, dato.primer_apellido, dato.segundo_apellido]
            .map((p) => (p ?? '').trim())
            .filter(Boolean)
        : []
      const nombreCompleto = nombreParts.join(' ') || fila.correo

      const username = dato?.username?.trim()
      const emailPrefix = fila.correo ? fila.correo.split('@')[0] : ''
      const identificador = username || emailPrefix
      const rolNombre = fila.rol_id ? mapaRoles.get(fila.rol_id) || 'Residente' : 'Residente'

      const label = `${nombreCompleto} @${identificador} (${rolNombre})`

      return {
        id: fila.id,
        nombre: label,
        nombreCompleto,
        correo: fila.correo,
        username: identificador,
      }
    })
    .filter((u) => {
      if (!busquedaNorm) return true
      return (
        normalizar(u.nombreCompleto).includes(busquedaNorm) ||
        normalizar(u.correo).includes(busquedaNorm) ||
        normalizar(u.username).includes(busquedaNorm)
      )
    })
    .map((u) => ({
      id: u.id,
      nombre: u.nombre,
    }))
}
