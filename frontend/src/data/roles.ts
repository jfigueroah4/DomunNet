export interface Role {
  id: string
  name: string
  email: string
  descripcion: string
  permisos: string[]
  color: string
}

export const DEMO_ROLES: Role[] = [
  {
    id: 'admin',
    name: 'Administrador',
    email: 'natalia.aguilar@gmail.com',
    descripcion: 'Acceso total al sistema y configuración general.',
    permisos: ['Dashboard completo', 'Gestionar usuarios', 'Gestionar roles', 'Reportes avanzados'],
    color: '#9B0F06',
  },
  {
    id: 'residente',
    name: 'Residente',
    email: 'marco.estrada@outlook.com',
    descripcion: 'Responsable técnico con control de avance diario.',
    permisos: ['Proyectos asignados', 'Crear bitácoras', 'Subir fotografías', 'Ver reportes'],
    color: '#1D4ED8',
  },
  {
    id: 'supervisor',
    name: 'Supervisor',
    email: 'valeria.cifuentes@gmail.com',
    descripcion: 'Supervisión operativa y seguimiento de campo.',
    permisos: ['Ver proyectos asignados', 'Editar avances', 'Crear bitácoras', 'Revisar fotos'],
    color: '#7C3AED',
  },
  {
    id: 'inspector',
    name: 'Inspector',
    email: 'diego.salazar@outlook.com',
    descripcion: 'Inspección técnica, evidencias y validaciones.',
    permisos: ['Crear inspecciones', 'Subir evidencias', 'Ver bitácoras', 'Consultar reportes'],
    color: '#D97706',
  },
  {
    id: 'contratante',
    name: 'Contratante',
    email: 'sofia.montenegro@gmail.com',
    descripcion: 'Consulta de avances, autorizaciones y seguimiento.',
    permisos: ['Dashboard limitado', 'Proyectos asignados', 'Reportes autorizados'],
    color: '#0F766E',
  },
  {
    id: 'contratista',
    name: 'Contratista',
    email: 'andres.lemus@outlook.com',
    descripcion: 'Ejecución operativa y soporte de recursos.',
    permisos: ['Proyectos asignados', 'Recursos operativos', 'Reportes asignados'],
    color: '#0891B2',
  },
  {
    id: 'gerencia',
    name: 'Gerencia',
    email: 'paola.barrios@gmail.com',
    descripcion: 'Visión ejecutiva de proyectos y reportes.',
    permisos: ['Dashboard ejecutivo', 'Reportes', 'Supervisión'],
    color: '#4F46E5',
  },
  {
    id: 'campo',
    name: 'Campo',
    email: 'luis.arriaga@outlook.com',
    descripcion: 'Registro operativo en campo y fotografías.',
    permisos: ['Bitácora asignada', 'Fotografías', 'Crear tickets'],
    color: '#16A34A',
  },
  {
    id: 'proveedor',
    name: 'Proveedor',
    email: 'claudia.rosales@gmail.com',
    descripcion: 'Consulta de suministros, entregas y solicitudes.',
    permisos: ['Recursos asignados', 'Crear tickets', 'Ver órdenes'],
    color: '#EA580C',
  },
]
