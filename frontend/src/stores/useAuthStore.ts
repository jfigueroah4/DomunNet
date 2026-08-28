import { create } from 'zustand'
import { api } from '@/lib/api/cliente'

interface UserProfile {
  id: string
  correo: string
  activo: boolean
  ultimoAcceso: string | null
  fechaRegistro: string
  fechaNacimiento: string | null
  nombre: string
  apellido: string
  username: string
  primerNombre: string
  segundoNombre: string
  primerApellido: string
  segundoApellido: string
  telefono: string
  direccion: string
  cargo: string
  rol: string
}

interface AuthState {
  profile: UserProfile | null
  loading: boolean
  error: Error | null
  fetchProfile: () => Promise<void>
}

// Global promise to prevent duplicate concurrent fetches
let profilePromise: Promise<any> | null = null;

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  loading: true,
  error: null,
  fetchProfile: async () => {
    if (profilePromise) {
      try {
        const data = await profilePromise
        set({ profile: data, loading: false })
      } catch (err: any) {
        set({ error: err, loading: false })
      }
      return
    }

    profilePromise = api.get('/auth/perfil')
      .then(res => {
        if (res.data?.success && res.data?.data) {
          return res.data.data
        }
        throw new Error('No profile data')
      })

    try {
      const data = await profilePromise
      set({ profile: data, loading: false })
    } catch (err: any) {
      set({ error: err, loading: false })
    } finally {
      profilePromise = null // Reset the promise after it resolves/rejects
    }
  }
}))
