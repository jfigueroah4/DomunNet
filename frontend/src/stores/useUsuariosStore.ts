import { create } from 'zustand'
import { api } from '@/lib/api/cliente'
import { Usuario } from '@/types/usuario'

interface UsuariosState {
  usuarios: Usuario[]
  loading: boolean
  error: Error | null
  cargarUsuarios: () => Promise<void>
}

let usuariosPromise: Promise<any> | null = null;

export const useUsuariosStore = create<UsuariosState>((set) => ({
  usuarios: [],
  loading: true,
  error: null,
  cargarUsuarios: async () => {
    if (usuariosPromise) {
      try {
        const data = await usuariosPromise
        set({ usuarios: data, loading: false })
      } catch (err: any) {
        set({ usuarios: [], error: err, loading: false })
      }
      return
    }

    const fetchUsuarios = async () => {
      const res = await api.get('/usuarios')
      if (res.data?.success) {
        return res.data.data || []
      }
      throw new Error('Error al cargar usuarios')
    }

    usuariosPromise = fetchUsuarios()

    try {
      const data = await usuariosPromise
      set({ usuarios: data, loading: false, error: null })
    } catch (err: any) {
      set({ usuarios: [], error: err, loading: false })
    } finally {
      usuariosPromise = null
    }
  }
}))
