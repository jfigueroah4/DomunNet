import { create } from 'zustand'
import { api } from '@/lib/api/cliente'

export interface ContactoRelacionado {
  id: string
  cargo?: string
  usuario_id?: string
  usuario?: { dato_usuario?: any; correo?: string; rol_id?: string }
}

export interface EmpresaRelacionada {
  id: string
  nombre: string
  nit?: string
  direccion?: string
  telefono?: string
  correo_institucional?: string
  activo: boolean
  contactos: ContactoRelacionado[]
  proyectos_vinculados?: number
}

interface State {
  entidades: EmpresaRelacionada[]
  contratistas: EmpresaRelacionada[]
  ejecutoras: EmpresaRelacionada[]
  supervisoras: EmpresaRelacionada[]
  loading: boolean
  cargar: (tipo: 'entidad' | 'contratista' | 'ejecutora' | 'supervisora') => Promise<void>
}

const endpoint = (tipo: 'entidad' | 'contratista' | 'ejecutora' | 'supervisora') => {
  if (tipo === 'entidad') return '/entidades-contratantes'
  if (tipo === 'supervisora') return '/empresas'
  return '/empresas-contratistas'
}

const MOCK_ENTIDADES_FALLBACK: EmpresaRelacionada[] = [
  {
    id: 'ent-1',
    nombre: 'Ministerio de Comunicaciones, Infraestructura y Vivienda (CIV)',
    nit: '1234567-8',
    direccion: '8va Avenida y 15 Calle, Zona 13, Ciudad de Guatemala',
    telefono: '2321-4500',
    correo_institucional: 'contacto@civ.gob.gt',
    activo: true,
    contactos: [
      {
        id: 'cont-1',
        cargo: 'Director de Infraestructura',
        usuario: {
          correo: 'director@civ.gob.gt',
          dato_usuario: {
            primer_nombre: 'Ing. Roberto',
            primer_apellido: 'García',
            telefono: '5555-1234',
          },
        },
      },
    ],
    proyectos_vinculados: 3,
  },
  {
    id: 'ent-2',
    nombre: 'Dirección General de Caminos (DGC)',
    nit: '7654321-0',
    direccion: 'Finca La Aurora, Zona 13, Ciudad de Guatemala',
    telefono: '2475-3000',
    correo_institucional: 'info@caminos.gob.gt',
    activo: true,
    contactos: [
      {
        id: 'cont-2',
        cargo: 'Jefe de Supervisión',
        usuario: {
          correo: 'supervision@caminos.gob.gt',
          dato_usuario: {
            primer_nombre: 'Ing. Carlos',
            primer_apellido: 'Méndez',
            telefono: '5555-5678',
          },
        },
      },
    ],
    proyectos_vinculados: 2,
  },
  {
    id: 'ent-3',
    nombre: 'Fondo Social de Solidaridad (FSS)',
    nit: '9876543-2',
    direccion: 'Avenida Hincapié 21-72 Zona 13, Ciudad de Guatemala',
    telefono: '2245-8800',
    correo_institucional: 'proyectos@fss.gob.gt',
    activo: true,
    contactos: [],
    proyectos_vinculados: 1,
  },
]

const MOCK_CONTRATISTAS_FALLBACK: EmpresaRelacionada[] = [
  {
    id: 'cont-emp-1',
    nombre: 'Constructora Nacional de Pavimentos S.A.',
    nit: '3456789-1',
    direccion: 'Km 14.5 Carretera a El Salvador, Guatemala',
    telefono: '2388-9000',
    correo_institucional: 'contacto@pavimentos.com.gt',
    activo: true,
    contactos: [
      {
        id: 'cont-3',
        cargo: 'Gerente de Operaciones',
        usuario: {
          correo: 'operaciones@pavimentos.com.gt',
          dato_usuario: {
            primer_nombre: 'Lic. Fernando',
            primer_apellido: 'Morales',
            telefono: '4444-1122',
          },
        },
      },
    ],
    proyectos_vinculados: 4,
  },
  {
    id: 'cont-emp-2',
    nombre: 'CYMCO S.A.',
    nit: '8912345-6',
    direccion: 'Calzada Roosevelt 22-43 Zona 11, Ciudad de Guatemala',
    telefono: '2470-8800',
    correo_institucional: 'info@cymco.com',
    activo: true,
    contactos: [
      {
        id: 'cont-4',
        cargo: 'Director Técnico',
        usuario: {
          correo: 'tecnico@cymco.com',
          dato_usuario: {
            primer_nombre: 'Ing. Alejandro',
            primer_apellido: 'Castillo',
            telefono: '4444-3344',
          },
        },
      },
    ],
    proyectos_vinculados: 2,
  },
  {
    id: 'cont-emp-3',
    nombre: 'Constructora y Pavimentos del Norte S.A.',
    nit: '4567890-2',
    direccion: 'Avenida Las Américas, 24-70 Zona 13, Ciudad de Guatemala',
    telefono: '2212-9675',
    correo_institucional: 'proyectos@pavimentosnorte.com.gt',
    activo: true,
    contactos: [],
    proyectos_vinculados: 3,
  },
]

const MOCK_SUPERVISORAS_FALLBACK: EmpresaRelacionada[] = [
  {
    id: 'sup-emp-1',
    nombre: 'Consorcio de Ingeniería y Supervisión Vial R.L.',
    nit: '5566778-9',
    direccion: 'Boulevard Los Próceres 24-69 Zona 10, Edificio Empresarial, Nivel 8',
    telefono: '2333-8899',
    correo_institucional: 'contacto@consorciosupervision.com.gt',
    activo: true,
    contactos: [
      {
        id: 'cont-sup-1',
        cargo: 'Supervisor General de Obras',
        usuario: {
          correo: 'supervisor.general@consorciosupervision.com.gt',
          dato_usuario: {
            primer_nombre: 'Ing. Carlos',
            primer_apellido: 'Mendoza',
            telefono: '5555-9988',
          },
        },
      },
    ],
    proyectos_vinculados: 3,
  },
  {
    id: 'sup-emp-2',
    nombre: 'Supervisión Técnica y Control de Calidad S.A.',
    nit: '9988776-5',
    direccion: '12 Calle 1-25 Zona 10, Edificio Géminis 10, Ciudad de Guatemala',
    telefono: '2335-4422',
    correo_institucional: 'operaciones@supervisioncalidad.com.gt',
    activo: true,
    contactos: [
      {
        id: 'cont-sup-2',
        cargo: 'Director de Aseguramiento de Calidad',
        usuario: {
          correo: 'calidad@supervisioncalidad.com.gt',
          dato_usuario: {
            primer_nombre: 'Inga. Patricia',
            primer_apellido: 'Morales',
            telefono: '5555-7766',
          },
        },
      },
    ],
    proyectos_vinculados: 2,
  },
  {
    id: 'sup-emp-3',
    nombre: 'SERVICIOS DE INGENIERIA Y SUPERVISION VIAL - SERINGE',
    nit: '4567890-2',
    direccion: 'Avenida Las Américas, 24-70 Zona 13, Ciudad de Guatemala',
    telefono: '2212-9675',
    correo_institucional: 'supervision@seringe.com.gt',
    activo: true,
    contactos: [],
    proyectos_vinculados: 1,
  },
]

export const useEmpresasRelacionadasStore = create<State>((set, get) => ({
  entidades: [],
  contratistas: [],
  ejecutoras: [],
  supervisoras: [],
  loading: false,
  cargar: async (tipo) => {
    set({ loading: true })
    try {
      const response = await api.get(endpoint(tipo))
      const data = response.data?.data
      if (Array.isArray(data) && data.length > 0) {
        if (tipo === 'entidad') {
          set({ entidades: data, loading: false })
        } else if (tipo === 'supervisora') {
          set({ supervisoras: data, loading: false })
        } else {
          set({ contratistas: data, ejecutoras: data, loading: false })
        }
      } else {
        // Si el backend devuelve arreglo vacío, usar fallback para mostrar información inicial
        if (tipo === 'entidad') {
          const current = get().entidades
          set({ entidades: current.length > 0 ? current : MOCK_ENTIDADES_FALLBACK, loading: false })
        } else if (tipo === 'supervisora') {
          const current = get().supervisoras
          set({ supervisoras: current.length > 0 ? current : MOCK_SUPERVISORAS_FALLBACK, loading: false })
        } else {
          const current = get().contratistas
          const list = current.length > 0 ? current : MOCK_CONTRATISTAS_FALLBACK
          set({ contratistas: list, ejecutoras: list, loading: false })
        }
      }
    } catch (err) {
      console.warn(`[useEmpresasRelacionadasStore] No se pudo conectar al endpoint (${endpoint(tipo)}):`, err)
      if (tipo === 'entidad') {
        const current = get().entidades
        set({ entidades: current.length > 0 ? current : MOCK_ENTIDADES_FALLBACK, loading: false })
      } else if (tipo === 'supervisora') {
        const current = get().supervisoras
        set({ supervisoras: current.length > 0 ? current : MOCK_SUPERVISORAS_FALLBACK, loading: false })
      } else {
        const current = get().contratistas
        const list = current.length > 0 ? current : MOCK_CONTRATISTAS_FALLBACK
        set({ contratistas: list, ejecutoras: list, loading: false })
      }
    } finally {
      set({ loading: false })
    }
  },
}))
