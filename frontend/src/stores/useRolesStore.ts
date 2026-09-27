import { create } from 'zustand'
import { apiGetDeduplicado } from '@/lib/api/cliente'

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
  fetchRoles: (options?: { bypassCache?: boolean }) => Promise<void>
}

let rolesPromise: Promise<any> | null = null

export const useRolesStore = create<RolesState>((set) => ({
  roles: [],
  loading: false,
  error: null,

  fetchRoles: async (options) => {
    if (rolesPromise) {
      await rolesPromise
      return
    }

    set({ loading: true, error: null })

    rolesPromise = apiGetDeduplicado('/roles', options)
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

