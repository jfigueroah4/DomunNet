import { create } from 'zustand'
import { api } from '@/lib/api/cliente'

interface Delegado {
  id: string
  nombre: string
  rol: string
}

interface DelegadoStore {
  delegados: Delegado[]
  loading: boolean
  error: Error | null
  cargarDelegados: () => Promise<void>
}

export const useDelegadosResidenteStore = create<DelegadoStore>((set) => ({
  delegados: [],
  loading: false,
  error: null,
  cargarDelegados: async () => {
    set({ loading: true, error: null })
    try {
      const res = await api.get('/delegados_residente')
      if (res.data?.success) {
        set({ delegados: res.data.data || [] })
      } else {
        throw new Error('Failed to load delegados')
      }
    } catch (e: any) {
      set({ error: e })
    } finally {
      set({ loading: false })
    }
  },
}))
