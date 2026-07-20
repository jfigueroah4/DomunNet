import { clienteSupabase } from '@/configuracion/cliente-supabase'

export interface FiltrosUsuarios {
  busqueda?: string
  rol?: string
  estado?: 'Activo' | 'Inactivo' | 'Todos'
}

export interface DatosUsuario {
  nombre: string
  correo: string
  telefono: string
  rol: string
  estado: 'Activo' | 'Inactivo'
  departamento: string // Se mapeará como cargo en dato_usuario
  contrasena?: string
  proyectosAsignados?: string[]
}

type FilaUsuarioJoin = {
  id: string
  auth_user_id: string | null
  correo: string
  rol_id: string | null
  activo: boolean
  ultimo_acceso: string | null
  fecha_registro: string
  updated_at: string
  dato_usuario: {
    nombre: string
    apellido: string
    telefono: string | null
    cargo: string | null
  } | {
    nombre: string
    apellido: string
    telefono: string | null
    cargo: string | null
  }[] | null
}

type FilaRol = {
  id: string
  nombre_rol: string
}

function normalizar(texto: string) {
  return texto.trim().toLowerCase()
}

function formatearFecha(valor: string | null) {
  if (!valor) return 'Nunca'
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return valor
  return fecha.toLocaleDateString('es-GT')
}

function mapearUsuario(fila: FilaUsuarioJoin, nombreRol: string | null) {
  const dato = Array.isArray(fila.dato_usuario) ? fila.dato_usuario[0] : fila.dato_usuario
  const nombreCompleto = dato ? `${dato.nombre} ${dato.apellido}`.trim() : 'Sin Nombre'
  return {
    id: fila.id,
    nombre: nombreCompleto,
    correo: fila.correo,
    telefono: dato?.telefono || '',
    rol: nombreRol || 'Sin asignar',
    estado: fila.activo ? 'Activo' : 'Inactivo',
    departamento: dato?.cargo || '', // Usamos cargo para departamento
    proyectosAsignados: [],          // Se puede expandir en el futuro usando proyecto_usuario
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
    .select('id, auth_user_id, correo, rol_id, activo, ultimo_acceso, fecha_registro, updated_at, dato_usuario(nombre, apellido, telefono, cargo)')
    .order('fecha_registro', { ascending: false })

  if (error) throw new Error(error.message)
  return data as FilaUsuarioJoin[]
}

export async function listarUsuarios(filtros: FiltrosUsuarios = {}) {
  const [usuarios, mapaRoles] = await Promise.all([obtenerUsuariosBase(), obtenerRolesPorId()])
  const busqueda = normalizar(filtros.busqueda || '')

  return usuarios.filter((usuario) => {
    const dato = Array.isArray(usuario.dato_usuario) ? usuario.dato_usuario[0] : usuario.dato_usuario
    const nombreCompleto = dato ? `${dato.nombre} ${dato.apellido}`.trim() : ''
    const nombreRol = usuario.rol_id ? mapaRoles.get(usuario.rol_id) || 'Sin asignar' : 'Sin asignar'
    const estadoStr = usuario.activo ? 'Activo' : 'Inactivo'

    const cumpleBusqueda =
      !busqueda ||
      normalizar(nombreCompleto).includes(busqueda) ||
      normalizar(usuario.correo).includes(busqueda) ||
      normalizar(dato?.cargo || '').includes(busqueda) ||
      normalizar(nombreRol).includes(busqueda)

    const cumpleRol = !filtros.rol || filtros.rol === 'Todos' || nombreRol === filtros.rol
    const cumpleEstado = !filtros.estado || filtros.estado === 'Todos' || estadoStr === filtros.estado

    return cumpleBusqueda && cumpleRol && cumpleEstado
  }).map((usuario) => mapearUsuario(usuario, usuario.rol_id ? mapaRoles.get(usuario.rol_id) || null : null))
}

export async function obtenerUsuarioPorId(id: string) {
  const { data, error } = await clienteSupabase
    .from('usuario')
    .select('id, correo, rol_id, activo, ultimo_acceso, fecha_registro, updated_at, dato_usuario(nombre, apellido, telefono, cargo)')
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

  const partesNombre = datos.nombre.trim().split(/\s+/)
  const nombre = partesNombre[0] || ''
  const apellido = partesNombre.slice(1).join(' ') || ''

  const contrasena = datos.contrasena || 'Temporal123*'
  const { data: cuentaAuth, error: errorAuth } = await clienteSupabase.auth.admin.createUser({
    email: datos.correo,
    password: contrasena,
    email_confirm: true,
    user_metadata: {
      nombre,
      apellido,
      telefono: datos.telefono,
      cargo: datos.departamento,
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
      nombre,
      apellido,
      telefono: datos.telefono,
      cargo: datos.departamento,
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

  // Dividir nombre y apellido
  const partesNombre = datos.nombre.trim().split(/\s+/)
  const nombre = partesNombre[0] || ''
  const apellido = partesNombre.slice(1).join(' ') || ''

  // 2. Actualizar o insertar dato_usuario
  const { error: errorDato } = await clienteSupabase
    .from('dato_usuario')
    .upsert({
      usuario_id: id,
      nombre,
      apellido,
      telefono: datos.telefono,
      cargo: datos.departamento,
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
