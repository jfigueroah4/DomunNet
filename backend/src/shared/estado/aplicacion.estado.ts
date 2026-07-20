import {
  catalogosIniciales,
  configuracionInicial,
  notificacionesIniciales,
  permisosBasePorRol,
  rolesIniciales,
  usuariosIniciales,
} from '@/shared/datos/iniciales'
import {
  CatalogoGrupo,
  ConfiguracionGeneral,
  NotificacionesSistema,
  RolRegistro,
  UsuarioRegistro,
} from '@/shared/types/api.types'

export const estadoAplicacion = {
  usuarios: usuariosIniciales,
  roles: rolesIniciales,
  configuracionGeneral: configuracionInicial,
  notificaciones: notificacionesIniciales,
  catalogos: catalogosIniciales,
  permisosBasePorRol,
}

export function restaurarEstadoAplicacion() {
  estadoAplicacion.usuarios.splice(0, estadoAplicacion.usuarios.length, ...usuariosIniciales.map((usuario) => ({ ...usuario })))
  estadoAplicacion.roles.splice(0, estadoAplicacion.roles.length, ...rolesIniciales.map((rol) => ({ ...rol, permisos: [...rol.permisos], usuariosAsignados: [...rol.usuariosAsignados] })))
  estadoAplicacion.catalogos.splice(0, estadoAplicacion.catalogos.length, ...catalogosIniciales.map((grupo) => ({
    ...grupo,
    items: grupo.items.map((item) => ({ ...item })),
  })))
  estadoAplicacion.configuracionGeneral = { ...configuracionInicial }
  estadoAplicacion.notificaciones = {
    ...notificacionesIniciales,
    canales: { ...notificacionesIniciales.canales },
  }
}

export type EstadoAplicacion = {
  usuarios: UsuarioRegistro[]
  roles: RolRegistro[]
  configuracionGeneral: ConfiguracionGeneral
  notificaciones: NotificacionesSistema
  catalogos: CatalogoGrupo[]
}
