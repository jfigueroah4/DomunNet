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
  loading: boolean
  cargar: (tipo: 'entidad' | 'contratista') => Promise<void>
}

const endpoint = (tipo: 'entidad' | 'contratista') => tipo === 'entidad' ? '/entidades-contratantes' : '/empresas-contratistas'

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
    nombre: 'SERVICIOS DE INGENIERIA - SERINGE',
    nit: '4567890-2',
    direccion: 'Avenida Las Américas, 24-70 Zona 13, Ciudad de Guatemala',
    telefono: '2212-9675',
    correo_institucional: 'supervision@seringe.com',
    activo: true,
    contactos: [],
    proyectos_vinculados: 3,
  },
]

export const useEmpresasRelacionadasStore = create<State>((set, get) => ({
  entidades: [],
  contratistas: [],
  loading: false,
  cargar: async (tipo) => {
    set({ loading: true })
    try {
      const response = await api.get(endpoint(tipo))
      const data = response.data?.data
      if (Array.isArray(data) && data.length > 0) {
        set(tipo === 'entidad' ? { entidades: data, loading: false } : { contratistas: data, loading: false })
      } else {
        // Si el backend devuelve arreglo vacío, usar fallback para mostrar información inicial
        const current = tipo === 'entidad' ? get().entidades : get().contratistas
        if (current.length === 0) {
          set(tipo === 'entidad' ? { entidades: MOCK_ENTIDADES_FALLBACK, loading: false } : { contratistas: MOCK_CONTRATISTAS_FALLBACK, loading: false })
        } else {
          set({ loading: false })
        }
      }
    } catch (err) {
      console.warn(`[useEmpresasRelacionadasStore] No se pudo conectar al endpoint (${endpoint(tipo)}):`, err)
      const current = tipo === 'entidad' ? get().entidades : get().contratistas
      if (current.length === 0) {
        set(tipo === 'entidad' ? { entidades: MOCK_ENTIDADES_FALLBACK, loading: false } : { contratistas: MOCK_CONTRATISTAS_FALLBACK, loading: false })
      } else {
        set({ loading: false })
      }
    } finally {
      set({ loading: false })
    }
  },
}))
