import { RegistroBitacora } from '@/types/bitacora'

export const BITACORA_MOCK: RegistroBitacora[] = [
  {
    id: 'bit-1',
    titulo: 'Inspeccion de acero en muro lateral',
    descripcion:
      'Se verifico armado de acero, recubrimiento, traslapes y limpieza de fondo previo a fundicion de muro de contencion.',
    tipo: 'inspeccion',
    estado: 'aprobado',
    etiquetas: ['Muro', 'Acero', 'Calidad'],
    proyectoId: '1',
    proyectoNombre: 'Paso Inferior Boulevard Vista Hermosa',
    autor: 'Ing. Carlos Mendoza',
    ubicacion: 'Muro lateral norte, paso inferior',
    fecha: '2026-05-17',
    hora: '14:30',
    subcontratistas: [
      {
        empresa: 'Estructuras Viales del Valle S.A.',
        tarea: 'Armado y limpieza de muro de contencion',
        estado: 'completado',
        observaciones: 'Se corrigio separacion de estribos en dos puntos',
      },
    ],
    historial: [
      {
        usuario: 'Ing. Carlos Mendoza',
        campo: 'descripcion',
        antes: 'Revision de acero pendiente de limpieza.',
        despues: 'Se verifico armado de acero, recubrimiento y limpieza de fondo antes de fundicion.',
        fecha: '2026-05-17T14:40:00Z',
      },
    ],
    adjuntos: [
      { id: 'adj-1', nombre: 'muro_lateral.jpg', tipo: 'imagen', url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=300&h=200&fit=crop', tamanio: '2.3 MB' },
      { id: 'adj-2', nombre: 'checklist_acero_muro.pdf', tipo: 'pdf', url: 'https://placehold.co/100x100', tamanio: '1.1 MB' },
    ],
    creadoEn: '2026-05-17T14:35:00Z',
  },
  {
    id: 'bit-2',
    titulo: 'Recepcion de dovelas y canastillas',
    descripcion:
      'Ingreso de acero para transferencia de carga entre losas de pavimento. Se reviso certificado de calidad, diametros y almacenamiento.',
    tipo: 'material',
    estado: 'aprobado',
    etiquetas: ['Dovelas', 'Pavimento', 'Acero'],
    proyectoId: '2',
    proyectoNombre: 'Rehabilitacion Calzada Roosevelt',
    autor: 'Sup. Roberto Lopez',
    ubicacion: 'Acopio junto a carril intervenido',
    fecha: '2026-05-17',
    hora: '10:15',
    adjuntos: [
      { id: 'adj-3', nombre: 'remision_dovelas.pdf', tipo: 'pdf', url: 'https://placehold.co/100x100', tamanio: '0.8 MB' },
    ],
    creadoEn: '2026-05-17T10:20:00Z',
  },
  {
    id: 'bit-3',
    titulo: 'Incidente por escorrentia en rampa',
    descripcion:
      'Se reporto escorrentia sobre rampa de trabajo durante lluvia. No hubo lesion grave. Se instalo bombeo temporal y senalizacion.',
    tipo: 'incidente',
    estado: 'en_revision',
    etiquetas: ['Seguridad vial', 'Lluvia'],
    proyectoId: '1',
    proyectoNombre: 'Paso Inferior Boulevard Vista Hermosa',
    autor: 'Sup. Roberto Lopez',
    ubicacion: 'Rampa de acceso a excavacion',
    fecha: '2026-05-17',
    hora: '09:45',
    adjuntos: [],
    creadoEn: '2026-05-17T09:50:00Z',
  },
  {
    id: 'bit-4',
    titulo: 'Visita de supervision de transito',
    descripcion:
      'Personal municipal reviso cierre de carril, protecciones peatonales, conos y manejo de flujo vehicular. No se emitieron hallazgos mayores.',
    tipo: 'visita',
    estado: 'aprobado',
    etiquetas: ['Transito', 'Permisos', 'Senalizacion'],
    proyectoId: '2',
    proyectoNombre: 'Rehabilitacion Calzada Roosevelt',
    autor: 'Arq. Sandra Diaz',
    ubicacion: 'Carril derecho, tramo Roosevelt',
    fecha: '2026-05-16',
    hora: '15:00',
    subcontratistas: [
      { empresa: 'Control Municipal de Transito', tarea: 'Revision de cierre vial', estado: 'completado' },
    ],
    adjuntos: [
      { id: 'adj-4', nombre: 'acta_visita_transito.pdf', tipo: 'pdf', url: 'https://placehold.co/100x100', tamanio: '0.5 MB' },
    ],
    creadoEn: '2026-05-16T15:30:00Z',
  },
  {
    id: 'bit-5',
    titulo: 'Conformacion de subrasante',
    descripcion:
      'Se completo perfilado de subrasante en rampa de conexion. Se programo compactacion y prueba de densidades para la siguiente jornada.',
    tipo: 'actividad',
    estado: 'aprobado',
    etiquetas: ['Subrasante', 'Terraceria'],
    proyectoId: '4',
    proyectoNombre: 'Ampliacion de Acceso Carretera Interamericana',
    autor: 'Sup. Sandra Diaz',
    ubicacion: 'Rampa de acceso poniente',
    fecha: '2026-05-16',
    hora: '11:20',
    subcontratistas: [
      {
        empresa: 'Terraceria Metropolitana',
        tarea: 'Perfilado de subrasante',
        estado: 'completado',
        observaciones: 'Se mantuvo humedad de compactacion dentro de rango',
      },
    ],
    adjuntos: [
      { id: 'adj-5', nombre: 'subrasante_rampa.jpg', tipo: 'imagen', url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=300&h=200&fit=crop', tamanio: '3.1 MB' },
    ],
    creadoEn: '2026-05-16T11:30:00Z',
  },
  {
    id: 'bit-6',
    titulo: 'Observacion de drenaje pluvial',
    descripcion:
      'Se detecto pendiente insuficiente hacia caja pluvial. Se solicito revisar niveles antes de colocar tuberia transversal bajo carretera.',
    tipo: 'observacion',
    estado: 'borrador',
    etiquetas: ['Drenaje', 'C�9 Sur'],
    proyectoId: '5',
    proyectoNombre: 'Mejoramiento de Drenaje Pluvial C�9 Sur',
    autor: 'Ing. Nelson Paz',
    ubicacion: 'Drenaje transversal, C�9 Sur',
    fecha: '2026-05-15',
    hora: '08:30',
    adjuntos: [],
    creadoEn: '2026-05-15T08:45:00Z',
  },
  {
    id: 'bit-7',
    titulo: 'Aplicacion de hidrosiembra en talud',
    descripcion:
      'Se aplico capa vegetal proyectada sobre talud protegido con geotextil. Se verifico cobertura y continuidad de cuneta provisional.',
    tipo: 'actividad',
    estado: 'aprobado',
    etiquetas: ['Talud', 'Hidrosiembra'],
    proyectoId: '3',
    proyectoNombre: 'Estabilizacion de Taludes Ruta a El Salvador',
    autor: 'Ing. Alejandra Moreno',
    ubicacion: 'Talud derecho, rampa de acceso',
    fecha: '2026-05-14',
    hora: '16:00',
    adjuntos: [
      { id: 'adj-7', nombre: 'hidrosiembra_talud.jpg', tipo: 'imagen', url: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=300&h=200&fit=crop', tamanio: '2.8 MB' },
    ],
    creadoEn: '2026-05-14T16:15:00Z',
  },
]

