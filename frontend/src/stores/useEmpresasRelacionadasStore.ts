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

export const useEmpresasRelacionadasStore = create<State>((set) => ({
  entidades: [], contratistas: [], loading: false,
  cargar: async (tipo) => {
    set({ loading: true })
    try {
      const response = await api.get(endpoint(tipo))
      set(tipo === 'entidad' ? { entidades: response.data?.data || [], loading: false } : { contratistas: response.data?.data || [], loading: false })
    } finally { set({ loading: false }) }
  },
}))
