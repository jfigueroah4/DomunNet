import { clienteSupabase } from '@/configuracion/cliente-supabase'

export interface FiltrosUsuarios {
  busqueda?: string
  rol?: string
  estado?: 'Activo' | 'Inactivo' | 'Todos'
}

export interface DatosUsuario {
  primer_nombre: string
  segundo_nombre?: string | null
  primer_apellido: string
  segundo_apellido?: string | null
  correo: string
  telefono: string
  rol: string
  estado: 'Activo' | 'Inactivo'
  contrasena?: string
  proyectosAsignados?: string[]
  username?: string | null
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
  } | {
    primer_nombre: string
    segundo_nombre?: string | null
    primer_apellido: string
    segundo_apellido?: string | null
    telefono: string | null
    avatar_url?: string | null
    username?: string | null
  }[] | null
}

type FilaRol = {
  id: string
  nombre_rol: string
}

export function normalizar(texto: string) {
  return texto.trim().replace(/\s+/g, ' ').toLowerCase()
}

export function formatearFecha(valor: string | null) {
  if (!valor) return 'Nunca'
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return valor
  return fecha.toLocaleDateString('es-GT')
}

export function mapearUsuario(fila: FilaUsuarioJoin, nombreRol: string | null) {
  const dato = Array.isArray(fila.dato_usuario) ? fila.dato_usuario[0] : fila.dato_usuario
  const nombreCompleto = dato
    ? [`${dato.primer_nombre}`, dato.segundo_nombre, `${dato.primer_apellido}`, dato.segundo_apellido]
        .map((p) => (p ?? '').trim())
        .filter(Boolean)
        .join(' ') || 'Sin Nombre'
    : 'Sin Nombre'
  return {
    id: fila.id,
    primer_nombre: dato?.primer_nombre || '',
    segundo_nombre: dato?.segundo_nombre || '',
    primer_apellido: dato?.primer_apellido || '',
    segundo_apellido: dato?.segundo_apellido || '',
    username: dato?.username || '',
    nombre: nombreCompleto,
    correo: fila.correo,
    telefono: dato?.telefono || '',
    rol: nombreRol || 'Sin asignar',
    estado: fila.activo ? 'Activo' : 'Inactivo',
    proyectosAsignados: [],
    ultimoAcceso: formatearFecha(fila.ultimo_acceso),
    fechaCreacion: formatearFecha(fila.fecha_registro),
  }
}

async function obtenerRolPorNombre(nombre: string) {
  const { data, error } = await clienteSupabase
    .from('rol')
    .select('id, nombre_rol')
    .ilike('nombre_rol', nombre)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return (data as FilaRol | null) || null
}

async function obtenerRolesPorId() {
  const { data, error } = await clienteSupabase.from('rol').select('id, nombre_rol')
  if (error) throw new Error(error.message)

  return new Map((data || []).map((rol: FilaRol) => [rol.id, rol.nombre_rol]))
}

async function obtenerUsuariosBase() {
  const { data, error } = await clienteSupabase
    .from('usuario')
    .select('id, auth_user_id, correo, rol_id, activo, ultimo_acceso, fecha_registro, updated_at, dato_usuario(primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, telefono, avatar_url, username)')
    .order('fecha_registro', { ascending: false })

  if (error) throw new Error(error.message)
  return data as FilaUsuarioJoin[]
}

export async function listarUsuarios(filtros: FiltrosUsuarios = {}) {
  const [usuarios, mapaRoles] = await Promise.all([obtenerUsuariosBase(), obtenerRolesPorId()])
  const busqueda = normalizar(filtros.busqueda || '')

  return usuarios.filter((usuario) => {
    const dato = Array.isArray(usuario.dato_usuario) ? usuario.dato_usuario[0] : usuario.dato_usuario
    const nombreCompleto = dato ? `${dato.primer_nombre} ${dato.segundo_nombre || ''} ${dato.primer_apellido} ${dato.segundo_apellido || ''}`.replace(/\s+/g, ' ').trim() : ''
    const nombreRol = usuario.rol_id ? mapaRoles.get(usuario.rol_id) || 'Sin asignar' : 'Sin asignar'
    const estadoStr = usuario.activo ? 'Activo' : 'Inactivo'

    const cumpleBusqueda =
      !busqueda ||
      normalizar(nombreCompleto).includes(busqueda) ||
      normalizar(usuario.correo).includes(busqueda) ||
      normalizar(nombreRol).includes(busqueda)

    const cumpleRol = !filtros.rol || filtros.rol === 'Todos' || nombreRol === filtros.rol
    const cumpleEstado = !filtros.estado || filtros.estado === 'Todos' || estadoStr === filtros.estado

    return cumpleBusqueda && cumpleRol && cumpleEstado
  }).map((usuario) => mapearUsuario(usuario, usuario.rol_id ? mapaRoles.get(usuario.rol_id) || null : null))
}

export async function obtenerUsuarioPorId(id: string) {
  const { data, error } = await clienteSupabase
    .from('usuario')
    .select('id, correo, rol_id, activo, ultimo_acceso, fecha_registro, updated_at, dato_usuario(primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, telefono, avatar_url, username)')
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  const mapaRoles = await obtenerRolesPorId()
  const fila = data as FilaUsuarioJoin
  return mapearUsuario(fila, fila.rol_id ? mapaRoles.get(fila.rol_id) || null : null)
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
      activo: datos.estado === 'Activo',
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
      primer_nombre: datos.primer_nombre,
      segundo_nombre: datos.segundo_nombre || null,
      primer_apellido: datos.primer_apellido,
      segundo_apellido: datos.segundo_apellido || null,
      telefono: datos.telefono,
      email: datos.correo,
      username: usernameUnico,
      password_hash: null, // explicit NULL
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

  // Obtener dato_usuario actual para ver si ya tiene username
  const { data: datoActual } = await clienteSupabase
    .from('dato_usuario')
    .select('username')
    .eq('usuario_id', id)
    .maybeSingle()

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
    activo: datos.estado === 'Activo',
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
      primer_nombre: datos.primer_nombre,
      segundo_nombre: datos.segundo_nombre || null,
      primer_apellido: datos.primer_apellido,
      segundo_apellido: datos.segundo_apellido || null,
      telefono: datos.telefono,
      email: datos.correo,
      username: usernameFinal,
      password_hash: null, // explicit NULL
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
