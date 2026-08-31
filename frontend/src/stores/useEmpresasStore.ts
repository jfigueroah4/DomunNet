import { create } from 'zustand'
import { api } from '@/lib/api/cliente'

export interface ContactoMinimo {
  id: string
  nombre: string
  cargo?: string
  telefono?: string
  correo?: string
}

export interface EmpresaMinima {
  id: string
  nombre: string
  nit?: string
  direccion?: string
  telefono?: string
  correo_institucional?: string
  activo: boolean
  contactos: ContactoMinimo[]
  proyectos_vinculados?: number
}

interface EmpresasState {
  empresas: EmpresaMinima[]
  loading: boolean
  error: Error | null
  fetchEmpresas: () => Promise<void>
}

export const useEmpresasStore = create<EmpresasState>((set) => ({
  empresas: [],
  loading: false,
  error: null,

  fetchEmpresas: async () => {
    set({ loading: true, error: null })
    try {
      const response = await api.get(`/empresas`)
      set({ empresas: response.data?.data || [], loading: false })
    } catch (error: any) {
      set({ error: error as Error, loading: false })
    }
  }
}))
