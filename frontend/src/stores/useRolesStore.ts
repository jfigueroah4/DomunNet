import { create } from 'zustand'
import { api } from '@/lib/api/cliente'

export interface RolMinimo {
  id: string
  nombre: string
  estado: string
  nivel_permisos?: number
}

interface RolesState {
  roles: RolMinimo[]
  loading: boolean
  error: Error | null
  fetchRoles: () => Promise<void>
}

let rolesPromise: Promise<any> | null = null

export const useRolesStore = create<RolesState>((set) => ({
  roles: [],
  loading: false,
  error: null,

  fetchRoles: async () => {
    if (rolesPromise) {
      await rolesPromise
      return
    }

    set({ loading: true, error: null })

    rolesPromise = api.get('/roles')
      .then(response => {
        set({ roles: response.data?.data || [], loading: false })
      })
      .catch(error => {
        set({ error: error as Error, loading: false })
      })
      .finally(() => {
        rolesPromise = null
      })

    await rolesPromise
  },
}))

