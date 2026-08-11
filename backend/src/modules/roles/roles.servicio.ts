import { clienteSupabase } from '@/configuracion/cliente-supabase'
import { permisosDeRol } from '@/middlewares/permisos.middleware'

export interface DatosRol {
  nombre: string
  descripcion: string
  nivel?: number
  permisos?: string[]
  activo?: boolean
  usuariosAsignados?: string[]
}

type FilaRol = {
  id: string
  nombre_rol: string
  descripcion: string | null
  nivel_permisos: number
  permisos: Record<string, string[]> | null
  activo: boolean
  created_at: string
}

function mapearRolBase(
  rol: FilaRol,
  permisos: string[],
  usuariosAsignados: string[]
) {
  return {
    id: rol.id,
    nombre: rol.nombre_rol,
    descripcion: rol.descripcion || '',
    color: '#6d28d9', // Color por defecto para UI ya que se eliminó el campo físico
    permisos,
    usuariosAsignados,
    estado: rol.activo ? 'Activo' : 'Inactivo',
    totalUsuarios: usuariosAsignados.length,
    createdAt: rol.created_at,
    updatedAt: rol.created_at, // O usando created_at como fallback
  }
}

async function obtenerUsuariosIdsDeRol(rolId: string) {
  const { data, error } = await clienteSupabase.from('usuario').select('id').eq('rol_id', rolId)
  if (error) {
    throw new Error(error.message)
  }

  return (data || []).map((registro: { id: string }) => registro.id)
}

async function obtenerMapaUsuariosPorRol() {
  const { data, error } = await clienteSupabase.from('usuario').select('id, rol_id')
  if (error) {
    throw new Error(error.message)
  }

  const mapa = new Map<string, string[]>()
  for (const registro of data || []) {
    if (!registro.rol_id) continue
    const lista = mapa.get(registro.rol_id) || []
    lista.push(registro.id)
    mapa.set(registro.rol_id, lista)
  }

  return mapa
}

async function obtenerRolCompletoPorId(rolId: string) {
  const { data: rol, error } = await clienteSupabase.from('rol').select('*').eq('id', rolId).maybeSingle()
  if (error) {
    throw new Error(error.message)
  }
  if (!rol) {
    return null
  }

  const usuariosAsignados = await obtenerUsuariosIdsDeRol(rolId)
  const fila = rol as FilaRol
  // Si la columna JSONB `permisos` existe, convertirla a lista plana 'modulo.accion'
  const permisos = (fila.permisos && Object.keys(fila.permisos || {}).length > 0)
    ? Object.entries(fila.permisos).flatMap(([mod, acciones]) => (acciones || []).map((a) => `${mod}.${a}`))
    : permisosDeRol(fila.nombre_rol)

  return mapearRolBase(fila, permisos, usuariosAsignados)
}

export async function listarRoles() {
  const [rolesRespuesta, mapaUsuarios] = await Promise.all([
    clienteSupabase.from('rol').select('*').order('nombre_rol', { ascending: true }),
    obtenerMapaUsuariosPorRol(),
  ])

  if (rolesRespuesta.error) {
    throw new Error(rolesRespuesta.error.message)
  }

  return (rolesRespuesta.data || []).map((rol: FilaRol) => {
    const usuariosAsignados = mapaUsuarios.get(rol.id) || []
    const permisos = (rol.permisos && Object.keys(rol.permisos || {}).length > 0)
      ? Object.entries(rol.permisos).flatMap(([mod, acciones]) => (acciones || []).map((a) => `${mod}.${a}`))
      : permisosDeRol(rol.nombre_rol)
    return mapearRolBase(rol, permisos, usuariosAsignados)
  })
}

export async function obtenerRolPorId(id: string) {
  return obtenerRolCompletoPorId(id)
}

export async function obtenerRolPorNombre(nombre: string) {
  const { data, error } = await clienteSupabase.from('rol').select('*').ilike('nombre_rol', nombre).maybeSingle()
  if (error) {
    throw new Error(error.message)
  }
  if (!data) {
    return null
  }

  const usuariosAsignados = await obtenerUsuariosIdsDeRol(data.id)
  const fila = data as FilaRol
  const permisos = (fila.permisos && Object.keys(fila.permisos || {}).length > 0)
    ? Object.entries(fila.permisos).flatMap(([mod, acciones]) => (acciones || []).map((a) => `${mod}.${a}`))
    : permisosDeRol(fila.nombre_rol)

  return mapearRolBase(fila, permisos, usuariosAsignados)
}

export async function crearRol(datos: DatosRol) {
  const { data: existentes, error: errorExistentes } = await clienteSupabase
    .from('rol')
    .select('id, nombre_rol')
    .ilike('nombre_rol', datos.nombre)

  if (errorExistentes) {
    throw new Error(errorExistentes.message)
  }
  if ((existentes || []).length > 0) {
    throw new Error('Ya existe un rol con ese nombre')
  }

  // Agrupar permisos de modulo.accion a Record<string, string[]>
  const permisosAgrupados: Record<string, string[]> = {}
  if (datos.permisos) {
    for (const p of datos.permisos) {
      const parts = p.split('.')
      const mod = parts[0]
      const acc = parts[1] || '*'
      if (!permisosAgrupados[mod]) {
        permisosAgrupados[mod] = []
      }
      permisosAgrupados[mod].push(acc)
    }
  }

  const { data: nuevoRol, error: errorInsercion } = await clienteSupabase
    .from('rol')
    .insert({
      nombre_rol: datos.nombre,
      descripcion: datos.descripcion,
      nivel_permisos: datos.nivel || 0,
      permisos: permisosAgrupados,
      activo: datos.activo !== false,
    })
    .select('*')
    .single()

  if (errorInsercion) {
    throw new Error(errorInsercion.message)
  }

  if (datos.usuariosAsignados?.length) {
    await asignarUsuariosRol(nuevoRol.id, datos.usuariosAsignados)
  }

  return obtenerRolCompletoPorId(nuevoRol.id)
}

export async function actualizarRol(id: string, datos: DatosRol) {
  const rolExistente = await obtenerRolCompletoPorId(id)
  if (!rolExistente) {
    throw new Error('Rol no encontrado')
  }

  const { data: duplicados, error: errorDuplicados } = await clienteSupabase
    .from('rol')
    .select('id, nombre_rol')
    .ilike('nombre_rol', datos.nombre)

  if (errorDuplicados) {
    throw new Error(errorDuplicados.message)
  }

  const conflicto = (duplicados || []).find((registro: { id: string }) => registro.id !== id)
  if (conflicto) {
    throw new Error('Ya existe un rol con ese nombre')
  }

  // Agrupar permisos de modulo.accion a Record<string, string[]>
  const permisosAgrupados: Record<string, string[]> = {}
  if (datos.permisos) {
    for (const p of datos.permisos) {
      const parts = p.split('.')
      const mod = parts[0]
      const acc = parts[1] || '*'
      if (!permisosAgrupados[mod]) {
        permisosAgrupados[mod] = []
      }
      permisosAgrupados[mod].push(acc)
    }
  }

  const { error } = await clienteSupabase
    .from('rol')
    .update({
      nombre_rol: datos.nombre,
      descripcion: datos.descripcion,
      nivel_permisos: datos.nivel || 0,
      permisos: permisosAgrupados,
      activo: datos.activo !== false,
    })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  if (datos.usuariosAsignados) {
    await asignarUsuariosRol(id, datos.usuariosAsignados)
  }

  return obtenerRolCompletoPorId(id)
}

export async function eliminarRol(id: string) {
  const { count, error: errorConteo } = await clienteSupabase
    .from('usuario')
    .select('id', { count: 'exact', head: true })
    .eq('rol_id', id)

  if (errorConteo) {
    throw new Error(errorConteo.message)
  }
  if ((count || 0) > 0) {
    throw new Error('No se puede eliminar un rol con usuarios asignados')
  }

  const rol = await obtenerRolCompletoPorId(id)
  if (!rol) {
    throw new Error('Rol no encontrado')
  }

  const { error } = await clienteSupabase.from('rol').delete().eq('id', id)
  if (error) {
    throw new Error(error.message)
  }

  return rol
}

export async function asignarUsuariosRol(id: string, usuariosAsignados: string[]) {
  const rol = await obtenerRolCompletoPorId(id)
  if (!rol) {
    throw new Error('Rol no encontrado')
  }

  const usuariosUnicos = Array.from(new Set(usuariosAsignados))

  const { data: usuariosActuales, error: errorActuales } = await clienteSupabase
    .from('usuario')
    .select('id')
    .eq('rol_id', id)

  if (errorActuales) {
    throw new Error(errorActuales.message)
  }

  const idsActuales = (usuariosActuales || []).map((registro: { id: string }) => registro.id)
  const idsAEliminar = idsActuales.filter((usuarioId) => !usuariosUnicos.includes(usuarioId))
  const idsAAgregar = usuariosUnicos

  if (idsAAgregar.length > 0) {
    const { error: errorActualizar } = await clienteSupabase
      .from('usuario')
      .update({ rol_id: id })
      .in('id', idsAAgregar)
    if (errorActualizar) {
      throw new Error(errorActualizar.message)
    }
  }

  if (idsAEliminar.length > 0) {
    // Al desasignar, se les puede poner un rol por defecto o dejarlos en nulo. Como es un NOT NULL, lanzará error si no hay un rol id.
    // Busquemos el rol "Residente" por defecto para asignarles
    const { data: rolDefecto } = await clienteSupabase.from('rol').select('id').ilike('nombre_rol', 'Residente').maybeSingle()
    const fallbackRolId = rolDefecto?.id || id // Si no hay, los dejamos en el mismo para evitar violación de FK.

    if (fallbackRolId !== id) {
      const { error: errorLiberar } = await clienteSupabase
        .from('usuario')
        .update({ rol_id: fallbackRolId })
        .in('id', idsAEliminar)
      if (errorLiberar) {
        throw new Error(errorLiberar.message)
      }
    }
  }

  return obtenerRolCompletoPorId(id)
}

export async function obtenerPermisosRolPorNombre(nombre: string) {
  return permisosDeRol(nombre)
}

export async function obtenerPermisosRolPorId(id: string) {
  const rol = await obtenerRolCompletoPorId(id)
  return rol?.permisos || []
}
