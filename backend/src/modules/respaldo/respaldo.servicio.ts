import { clienteSupabase } from '@/configuracion/cliente-supabase'

const db: any = clienteSupabase

type FilaUsuarioRespaldo = {
  id: string
  nombre: string
  correo: string
  telefono: string
  estado: 'Activo' | 'Inactivo'
  departamento: string
  proyectos_asignados: string[] | null
  ultimo_acceso: string | null
  created_at: string
  rol_id: string | null
  contrasena_hash: string
  contrasena_salt: string
}

type FilaRolRespaldo = {
  id: string
  nombre: string
  descripcion: string
  color: string
  estado: 'Activo' | 'Inactivo'
  created_at: string
  updated_at: string
}

type FilaCatalogoGrupo = {
  id: string
  clave: string
  titulo: string
  descripcion: string
  estado: 'Activo' | 'Inactivo'
  created_at: string
  updated_at: string
}

type FilaCatalogoItem = {
  id: string
  grupo_id: string
  codigo: string
  nombre: string
  descripcion: string
  estado: 'Activo' | 'Inactivo'
  orden: number
}

export async function generarRespaldoSistema(generadoPor: string) {
  const [
    usuariosRespuesta,
    rolesRespuesta,
    permisosRespuesta,
    relacionesRespuesta,
    configuracionGeneralRespuesta,
    notificacionesRespuesta,
    gruposRespuesta,
    itemsRespuesta,
  ] = await Promise.all([
    clienteSupabase.from('usuarios').select('*'),
    clienteSupabase.from('roles').select('*'),
    clienteSupabase.from('permisos').select('id, clave, descripcion, categoria'),
    clienteSupabase.from('rol_permisos').select('rol_id, permiso_id'),
    clienteSupabase.from('configuracion_general').select('*').eq('id', 'principal').maybeSingle(),
    clienteSupabase.from('configuracion_notificaciones').select('*').eq('id', 'principal').maybeSingle(),
    clienteSupabase.from('catalogos_grupos').select('*'),
    clienteSupabase.from('catalogos_items').select('*'),
  ])

  const errores = [
    usuariosRespuesta.error,
    rolesRespuesta.error,
    permisosRespuesta.error,
    relacionesRespuesta.error,
    configuracionGeneralRespuesta.error,
    notificacionesRespuesta.error,
    gruposRespuesta.error,
    itemsRespuesta.error,
  ].filter(Boolean)

  if (errores.length > 0) {
    throw new Error((errores[0] as { message: string }).message)
  }

  const mapaPermisos = new Map(
    (permisosRespuesta.data || []).map((permiso: { id: string; clave: string; descripcion: string; categoria: string }) => [
      permiso.id,
      permiso.clave,
    ])
  )

  const permisosPorRol = new Map<string, string[]>()
  for (const relacion of relacionesRespuesta.data || []) {
    const clave = mapaPermisos.get((relacion as { permiso_id: string }).permiso_id)
    if (!clave) continue
    const lista = permisosPorRol.get((relacion as { rol_id: string }).rol_id) || []
    lista.push(clave)
    permisosPorRol.set((relacion as { rol_id: string }).rol_id, lista)
  }

  const mapaRoles = new Map(
    (rolesRespuesta.data || []).map((rol: FilaRolRespaldo) => [rol.id, rol.nombre])
  )

  const usuarios = (usuariosRespuesta.data || []).map((usuario: FilaUsuarioRespaldo) => ({
    id: usuario.id,
    nombre: usuario.nombre,
    correo: usuario.correo,
    telefono: usuario.telefono,
    estado: usuario.estado,
    departamento: usuario.departamento,
    proyectosAsignados: usuario.proyectos_asignados || [],
    ultimoAcceso: usuario.ultimo_acceso,
    fechaCreacion: usuario.created_at,
    rol: usuario.rol_id ? mapaRoles.get(usuario.rol_id) || 'Sin asignar' : 'Sin asignar',
    contrasenaHash: usuario.contrasena_hash,
    contrasenaSalt: usuario.contrasena_salt,
  }))

  const roles = (rolesRespuesta.data || []).map((rol: FilaRolRespaldo) => ({
    id: rol.id,
    nombre: rol.nombre,
    descripcion: rol.descripcion,
    color: rol.color,
    estado: rol.estado,
    permisos: permisosPorRol.get(rol.id) || [],
    usuariosAsignados: usuarios.filter((usuario) => usuario.rol === rol.nombre).map((usuario) => usuario.id),
    createdAt: rol.created_at,
    updatedAt: rol.updated_at,
  }))

  const grupos = (gruposRespuesta.data || []).map((grupo: FilaCatalogoGrupo) => ({
    id: grupo.id,
    clave: grupo.clave,
    titulo: grupo.titulo,
    descripcion: grupo.descripcion,
    estado: grupo.estado,
    items: (itemsRespuesta.data || [])
      .filter((item: FilaCatalogoItem) => item.grupo_id === grupo.id)
      .map((item: FilaCatalogoItem) => ({
        id: item.id,
        codigo: item.codigo,
        nombre: item.nombre,
        descripcion: item.descripcion,
        estado: item.estado,
      })),
    totalItems: (itemsRespuesta.data || []).filter((item: FilaCatalogoItem) => item.grupo_id === grupo.id).length,
  }))

  const respaldo = {
    generadoEn: new Date().toISOString(),
    generadoPor,
    usuarios,
    roles,
    configuracionGeneral: configuracionGeneralRespuesta.data
      ? {
          empresa: configuracionGeneralRespuesta.data.empresa,
          zonaHoraria: configuracionGeneralRespuesta.data.zona_horaria,
          idioma: configuracionGeneralRespuesta.data.idioma,
          tema: configuracionGeneralRespuesta.data.tema,
        }
      : null,
    notificaciones: notificacionesRespuesta.data
      ? {
          bitacora: notificacionesRespuesta.data.bitacora,
          proyectos: notificacionesRespuesta.data.proyectos,
          fotografias: notificacionesRespuesta.data.fotografias,
          reportes: notificacionesRespuesta.data.reportes,
          soporte: notificacionesRespuesta.data.soporte,
          canales: {
            email: notificacionesRespuesta.data.canal_email,
            sms: notificacionesRespuesta.data.canal_sms,
            inApp: notificacionesRespuesta.data.canal_in_app,
          },
        }
      : null,
    catalogos: grupos,
  }

  const { error: errorGuardar } = await db.from('respaldos').insert({
    nombre: `Respaldo ${new Date().toLocaleDateString('es-GT')}`,
    generado_por_nombre: generadoPor,
    payload: respaldo,
  })
  if (errorGuardar) {
    throw new Error(errorGuardar.message)
  }

  return respaldo
}

async function limpiarTablas() {
  const { error: errorUsuarios } = await db.from('usuarios').delete().not('id', 'is', null)
  if (errorUsuarios) throw new Error(errorUsuarios.message)

  const { error: errorRelaciones } = await db.from('rol_permisos').delete().not('rol_id', 'is', null)
  if (errorRelaciones) throw new Error(errorRelaciones.message)

  const { error: errorRoles } = await db.from('roles').delete().not('id', 'is', null)
  if (errorRoles) throw new Error(errorRoles.message)

  const { error: errorItems } = await db.from('catalogos_items').delete().not('id', 'is', null)
  if (errorItems) throw new Error(errorItems.message)

  const { error: errorGrupos } = await db.from('catalogos_grupos').delete().not('id', 'is', null)
  if (errorGrupos) throw new Error(errorGrupos.message)
}

async function mapearPermisosPorClave() {
  const { data, error } = await clienteSupabase.from('permisos').select('id, clave')
  if (error) throw new Error(error.message)

  return new Map((data || []).map((permiso: { id: string; clave: string }) => [permiso.clave, permiso.id]))
}

export async function restaurarRespaldoSistema(respaldo: any) {
  await limpiarTablas()
  const permisosPorClave = await mapearPermisosPorClave()

  const rolesInsertados: Record<string, string> = {}

  for (const rol of respaldo.roles || []) {
    const { data, error } = await db
      .from('roles')
      .insert({
        nombre: rol.nombre,
        descripcion: rol.descripcion,
        color: rol.color,
        estado: rol.estado,
      } as any)
      .select('id, nombre')
      .single()

    if (error) throw new Error(error.message)
    rolesInsertados[rol.nombre] = data.id
  }

  for (const rol of respaldo.roles || []) {
    const rolId = rolesInsertados[rol.nombre]
    const filas = (rol.permisos || [])
      .map((clave: string) => permisosPorClave.get(clave))
      .filter(Boolean)
      .map((permisoId: string) => ({ rol_id: rolId, permiso_id: permisoId }))

    if (filas.length > 0) {
      const { error } = await db.from('rol_permisos').insert(filas as any)
      if (error) throw new Error(error.message)
    }
  }

  const usuariosInsertar = (respaldo.usuarios || []).map((usuario: any) => ({
    nombre: usuario.nombre,
    correo: usuario.correo,
    telefono: usuario.telefono,
    rol_id: rolesInsertados[usuario.rol] || null,
    estado: usuario.estado,
    departamento: usuario.departamento,
    proyectos_asignados: usuario.proyectosAsignados || [],
    contrasena_hash: usuario.contrasenaHash,
    contrasena_salt: usuario.contrasenaSalt,
    ultimo_acceso: usuario.ultimoAcceso || null,
  }))

  if (usuariosInsertar.length > 0) {
    const { error } = await db.from('usuarios').insert(usuariosInsertar as any)
    if (error) throw new Error(error.message)
  }

  if (respaldo.configuracionGeneral) {
    const { error } = await db.from('configuracion_general').upsert({
      id: 'principal',
      empresa: respaldo.configuracionGeneral.empresa,
      zona_horaria: respaldo.configuracionGeneral.zonaHoraria,
      idioma: respaldo.configuracionGeneral.idioma,
      tema: respaldo.configuracionGeneral.tema,
    })
    if (error) throw new Error(error.message)
  }

  if (respaldo.notificaciones) {
    const { error } = await db.from('configuracion_notificaciones').upsert({
      id: 'principal',
      bitacora: respaldo.notificaciones.bitacora,
      proyectos: respaldo.notificaciones.proyectos,
      fotografias: respaldo.notificaciones.fotografias,
      reportes: respaldo.notificaciones.reportes,
      soporte: respaldo.notificaciones.soporte,
      canal_email: respaldo.notificaciones.canales.email,
      canal_sms: respaldo.notificaciones.canales.sms,
      canal_in_app: respaldo.notificaciones.canales.inApp,
    })
    if (error) throw new Error(error.message)
  }

  for (const grupo of respaldo.catalogos || []) {
    const { data, error } = await db
      .from('catalogos_grupos')
      .insert({
        clave: grupo.clave || grupo.titulo,
        titulo: grupo.titulo,
        descripcion: grupo.descripcion,
        estado: grupo.estado || 'Activo',
      } as any)
      .select('id, clave')
      .single()
    if (error) throw new Error(error.message)

    const items = (grupo.items || []).map((item: any, indice: number) => ({
      grupo_id: data.id,
      codigo: item.codigo,
      nombre: item.nombre,
      descripcion: item.descripcion,
      estado: item.estado,
      orden: indice,
    }))

    if (items.length > 0) {
      const { error: errorItems } = await db.from('catalogos_items').insert(items as any)
      if (errorItems) throw new Error(errorItems.message)
    }
  }

  return {
    usuarios: (respaldo.usuarios || []).length,
    roles: (respaldo.roles || []).length,
    catalogos: (respaldo.catalogos || []).length,
  }
}

export async function obtenerResumenRespaldoSistema() {
  const [{ count: totalUsuarios }, { count: totalRoles }, { count: totalCatalogos }, { data: ultimoRespaldo }] =
    await Promise.all([
      clienteSupabase.from('usuarios').select('id', { count: 'exact', head: true }),
      clienteSupabase.from('roles').select('id', { count: 'exact', head: true }),
      clienteSupabase.from('catalogos_grupos').select('id', { count: 'exact', head: true }),
      clienteSupabase.from('respaldos').select('created_at').order('created_at', { ascending: false }).limit(1),
    ])

  return {
    ultimaGeneracion: ultimoRespaldo?.[0]?.created_at || null,
    totalUsuarios: totalUsuarios || 0,
    totalRoles: totalRoles || 0,
    totalCatalogos: totalCatalogos || 0,
  }
}
