import {
  CatalogoGrupo,
  ConfiguracionGeneral,
  NotificacionesSistema,
  RolRegistro,
  UsuarioRegistro,
} from '@/shared/types/api.types'

export const permisosBasePorRol: Record<string, string[]> = {
  Administrador: [
    'usuarios.read',
    'usuarios.write',
    'roles.read',
    'roles.write',
    'configuracion.read',
    'configuracion.write',
    'catalogos.read',
    'catalogos.write',
    'backup.read',
    'backup.write',
  ],
  Supervisor: ['usuarios.read', 'roles.read', 'configuracion.read', 'catalogos.read', 'backup.read'],
  Inspector: ['usuarios.read', 'configuracion.read', 'catalogos.read'],
  Contratante: ['usuarios.read', 'roles.read', 'configuracion.read'],
  Contratista: ['usuarios.read', 'configuracion.read'],
  Gerencia: ['usuarios.read', 'roles.read', 'configuracion.read', 'catalogos.read', 'backup.read'],
  Campo: ['usuarios.read', 'configuracion.read', 'catalogos.read'],
  Proveedor: ['usuarios.read', 'configuracion.read'],
}

export const usuariosIniciales: UsuarioRegistro[] = [
  {
    id: 'usr-1',
    primer_nombre: 'Natalia',
    segundo_nombre: null,
    primer_apellido: 'Aguilar',
    segundo_apellido: null,
    username: 'naguilar',
    correo: 'natalia.aguilar@gmail.com',
    telefono: '2310-1401',
    rol: 'Administrador',
    estado: 'Activo',
    proyectosAsignados: ['DOM-VIAL-001', 'DOM-VIAL-002'],
    ultimoAcceso: '24/05/2026',
    fechaCreacion: '20/05/2026',
    contrasena: 'Admin123*',
  },
  {
    id: 'usr-2',
    primer_nombre: 'Marco',
    segundo_nombre: null,
    primer_apellido: 'Estrada',
    segundo_apellido: null,
    username: 'mestrada',
    correo: 'marco.estrada@outlook.com',
    telefono: '2310-1402',
    rol: 'Supervisor',
    estado: 'Activo',
    proyectosAsignados: ['DOM-VIAL-001'],
    ultimoAcceso: '24/05/2026',
    fechaCreacion: '22/05/2026',
    contrasena: 'Supervisor123*',
  },
]

export const rolesIniciales: RolRegistro[] = [
  {
    id: 'rol-1',
    nombre: 'Administrador',
    descripcion: 'Acceso total al sistema',
    color: '#9B0F06',
    permisos: permisosBasePorRol.Administrador,
    usuariosAsignados: ['usr-1'],
    estado: 'Activo',
  },
  {
    id: 'rol-2',
    nombre: 'Supervisor',
    descripcion: 'Supervisión operativa',
    color: '#2563EB',
    permisos: permisosBasePorRol.Supervisor,
    usuariosAsignados: ['usr-2'],
    estado: 'Activo',
  },
]

export const configuracionInicial: ConfiguracionGeneral = {
  empresa: 'DOMUN Guatemala',
  zonaHoraria: 'America/Guatemala',
  idioma: 'Español',
  tema: 'claro',
}

export const notificacionesIniciales: NotificacionesSistema = {
  bitacora: true,
  proyectos: true,
  fotografias: true,
  reportes: false,
  soporte: true,
  canales: {
    email: true,
    sms: false,
    inApp: true,
  },
}

export const catalogosIniciales: CatalogoGrupo[] = [
  {
    id: 'estados-proyecto',
    titulo: 'Estados de proyecto',
    descripcion: 'Borrador, activo, revisión y completado',
    items: [
      { id: 'cat-1', codigo: 'PRO-001', nombre: 'Borrador', descripcion: 'Proyecto recién creado', estado: 'Activo' },
      { id: 'cat-2', codigo: 'PRO-002', nombre: 'Activo', descripcion: 'Proyecto en ejecución', estado: 'Activo' },
      { id: 'cat-3', codigo: 'PRO-003', nombre: 'Revisión', descripcion: 'Pendiente de validación', estado: 'Activo' },
      { id: 'cat-4', codigo: 'PRO-004', nombre: 'Completado', descripcion: 'Proyecto finalizado', estado: 'Activo' },
    ],
  },
  {
    id: 'tipos-bitacora',
    titulo: 'Tipos de bitácora',
    descripcion: 'Eventos operativos y diarios de obra',
    items: [
      { id: 'cat-5', codigo: 'BIT-001', nombre: 'Actividad', descripcion: 'Registro diario de actividades', estado: 'Activo' },
      { id: 'cat-6', codigo: 'BIT-002', nombre: 'Incidente', descripcion: 'Evento o anomalía en obra', estado: 'Activo' },
      { id: 'cat-7', codigo: 'BIT-003', nombre: 'Visita', descripcion: 'Inspección o recorrido', estado: 'Activo' },
    ],
  },
]
