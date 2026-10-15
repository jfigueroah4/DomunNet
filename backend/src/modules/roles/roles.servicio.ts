import { clienteSupabase } from '@/configuracion/cliente-supabase'


export interface DatosRol {
  nombre: string
  descripcion: string
  nivel?: number
  permisos?: string[]
  estado?: 'Activo' | 'Inactivo'
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
    nivel_permisos: rol.nivel_permisos,
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

function extraerPermisosPlanos(filaPermisos: Record<string, string[]> | null): string[] {
  if (!filaPermisos || Object.keys(filaPermisos).length === 0) return []
  const result: string[] = []
  for (const [mod, acciones] of Object.entries(filaPermisos)) {
    for (const a of acciones || []) {
      if (a === '*' || a === '') {
        result.push(mod)
      } else {
        result.push(`${mod}.${a}`)
      }
    }
  }
  return result
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
  const permisos = extraerPermisosPlanos(fila.permisos)

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
    const permisos = extraerPermisosPlanos(rol.permisos)
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
    : []

  return mapearRolBase(fila, permisos, usuariosAsignados)
}

function agruparPermisos(permisosLista?: string[], nivel?: number): Record<string, string[]> {
  const permisosAgrupados: Record<string, string[]> = {}
  
  const esTotalAdmin = (nivel && nivel >= 100) ||
    permisosLista?.includes('*') ||
    permisosLista?.includes('*.*') ||
    permisosLista?.includes('Acceso completo') ||
    (permisosLista && permisosLista.length >= 20)

  if (esTotalAdmin) {
    permisosAgrupados['*'] = ['*']
    permisosAgrupados['usuarios'] = ['read', 'write', 'delete', '*']
    permisosAgrupados['roles'] = ['read', 'write', 'delete', '*']
    permisosAgrupados['proyectos'] = ['read', 'write', 'delete', 'crear', 'actualizar', 'eliminar', '*']
    permisosAgrupados['bitacora'] = ['read', 'write', 'crear', 'aprobar', 'firmar', '*']
    permisosAgrupados['evidencia_fotografica'] = ['read', 'write', '*']
    permisosAgrupados['reportes'] = ['read', 'write', 'generar', 'avanzado', '*']
    permisosAgrupados['configuracion'] = ['read', 'write', '*']
    permisosAgrupados['mantenimiento'] = ['read', 'write', '*']
    permisosAgrupados['catalogos'] = ['read', 'write', '*']
    permisosAgrupados['backup'] = ['read', 'write', '*']
    permisosAgrupados['notificaciones'] = ['read', 'write', '*']
    permisosAgrupados['hoja_sabana'] = ['leer', 'crear', 'aprobar', 'eliminar', '*']
    permisosAgrupados['pendientes'] = ['procesar', '*']
    permisosAgrupados['dashboard'] = ['completo', 'ejecutivo', 'limitado', '*']
  }

  if (permisosLista) {
    for (const p of permisosLista) {
      if (!p) continue
      const pNorm = p.trim().toLowerCase()

      if (p.includes('.')) {
        const parts = p.split('.')
        const mod = parts[0]
        const acc = parts[1] || '*'
        if (!permisosAgrupados[mod]) permisosAgrupados[mod] = []
        if (!permisosAgrupados[mod].includes(acc)) permisosAgrupados[mod].push(acc)
      } else {
        // Mapeo de nombres humanos a módulos técnicos
        if (pNorm.includes('proyecto')) {
          if (!permisosAgrupados['proyectos']) permisosAgrupados['proyectos'] = []
          if (pNorm.includes('ver')) permisosAgrupados['proyectos'].push('read')
          if (pNorm.includes('crear') || pNorm.includes('editar')) permisosAgrupados['proyectos'].push('write', 'actualizar', 'crear')
          if (pNorm.includes('eliminar')) permisosAgrupados['proyectos'].push('delete', 'eliminar')
          if (!pNorm.includes('ver') && !pNorm.includes('crear') && !pNorm.includes('eliminar')) permisosAgrupados['proyectos'].push('*')
        }
        if (pNorm.includes('bitacora') || pNorm.includes('bitácora')) {
          if (!permisosAgrupados['bitacora']) permisosAgrupados['bitacora'] = []
          if (pNorm.includes('crear')) permisosAgrupados['bitacora'].push('write', 'crear')
          if (pNorm.includes('aprobar')) permisosAgrupados['bitacora'].push('aprobar', 'write')
          if (pNorm.includes('firma')) permisosAgrupados['bitacora'].push('firmar', 'write')
          if (!pNorm.includes('crear') && !pNorm.includes('aprobar') && !pNorm.includes('firma')) permisosAgrupados['bitacora'].push('*')
        }
        if (pNorm.includes('foto') || pNorm.includes('evidencia')) {
          if (!permisosAgrupados['evidencia_fotografica']) permisosAgrupados['evidencia_fotografica'] = []
          permisosAgrupados['evidencia_fotografica'].push('read', 'write', '*')
        }
        if (pNorm.includes('usuario')) {
          if (!permisosAgrupados['usuarios']) permisosAgrupados['usuarios'] = []
          permisosAgrupados['usuarios'].push('read', 'write', 'delete', '*')
        }
        if (pNorm.includes('rol')) {
          if (!permisosAgrupados['roles']) permisosAgrupados['roles'] = []
          permisosAgrupados['roles'].push('read', 'write', 'delete', '*')
        }
        if (pNorm.includes('reporte') || pNorm.includes('costos')) {
          if (!permisosAgrupados['reportes']) permisosAgrupados['reportes'] = []
          permisosAgrupados['reportes'].push('read', 'write', 'generar', 'avanzado', '*')
        }
        if (pNorm.includes('mantenimiento') || pNorm.includes('tabla')) {
          if (!permisosAgrupados['mantenimiento']) permisosAgrupados['mantenimiento'] = []
          permisosAgrupados['mantenimiento'].push('read', 'write', '*')
        }
        if (pNorm.includes('configuraci')) {
          if (!permisosAgrupados['configuracion']) permisosAgrupados['configuracion'] = []
          permisosAgrupados['configuracion'].push('read', 'write', '*')
        }
        if (pNorm.includes('catálogo') || pNorm.includes('catalogo')) {
          if (!permisosAgrupados['catalogos']) permisosAgrupados['catalogos'] = []
          permisosAgrupados['catalogos'].push('read', 'write', '*')
        }
        if (pNorm.includes('hoja') || pNorm.includes('sabana') || pNorm.includes('sábana') || pNorm.includes('analítico') || pNorm.includes('analitico')) {
          if (!permisosAgrupados['hoja_sabana']) permisosAgrupados['hoja_sabana'] = []
          permisosAgrupados['hoja_sabana'].push('leer', 'crear', 'aprobar', 'eliminar', '*')
        }
        if (pNorm.includes('ticket')) {
          if (!permisosAgrupados['tickets']) permisosAgrupados['tickets'] = []
          permisosAgrupados['tickets'].push('read', 'write', '*')
        }
        if (pNorm.includes('dashboard')) {
          if (!permisosAgrupados['dashboard']) permisosAgrupados['dashboard'] = []
          permisosAgrupados['dashboard'].push('*')
        }
        if (pNorm.includes('notificaci') || pNorm.includes('alerta')) {
          if (!permisosAgrupados['notificaciones']) permisosAgrupados['notificaciones'] = []
          permisosAgrupados['notificaciones'].push('read', 'write', '*')
        }

        // Conservar el literal descriptivo
        if (!permisosAgrupados[p]) permisosAgrupados[p] = []
        if (!permisosAgrupados[p].includes('*')) permisosAgrupados[p].push('*')
      }
    }
  }
  return permisosAgrupados
}

export async function crearRol(datos: DatosRol) {
  const { data: existente } = await clienteSupabase
    .from('rol')
    .select('id')
    .ilike('nombre_rol', datos.nombre)
    .maybeSingle()

  if (existente) {
    throw new Error('Ya existe un rol con ese nombre')
  }

  const nivelFinal = (datos.permisos && datos.permisos.length >= 20) || datos.nivel === 100 ? 100 : (datos.nivel || 0)
  const permisosAgrupados = agruparPermisos(datos.permisos, nivelFinal)

  const esActivo = datos.estado ? datos.estado === 'Activo' : datos.activo !== false

  const { data: nuevoRol, error: errorInsercion } = await clienteSupabase
    .from('rol')
    .insert({
      nombre_rol: datos.nombre,
      descripcion: datos.descripcion,
      nivel_permisos: nivelFinal,
      permisos: permisosAgrupados,
      activo: esActivo,
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

  const nivelFinal = (datos.permisos && datos.permisos.length >= 20) || datos.nivel === 100 ? 100 : (datos.nivel || 0)
  const permisosAgrupados = agruparPermisos(datos.permisos, nivelFinal)

  const esActivo = datos.estado ? datos.estado === 'Activo' : datos.activo !== false
  const { error } = await clienteSupabase
    .from('rol')
    .update({
      nombre_rol: datos.nombre,
      descripcion: datos.descripcion,
      nivel_permisos: nivelFinal,
      permisos: permisosAgrupados,
      activo: esActivo,
    })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  // Actualizar estado de los usuarios asignados al rol según el nuevo estado del rol
  await clienteSupabase
    .from('usuario')
    .update({ activo: esActivo, updated_at: new Date().toISOString() })
    .eq('rol_id', id)

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
  return []
}

export async function obtenerPermisosRolPorId(id: string) {
  const rol = await obtenerRolCompletoPorId(id)
  return rol?.permisos || []
}
