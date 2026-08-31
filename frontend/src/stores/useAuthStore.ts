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
  permisos?: string[]
  nivel_permisos?: number
}

interface AuthState {
  profile: UserProfile | null
  loading: boolean
  error: Error | null
  fetchProfile: (retries?: number) => Promise<void>
}

// Global promise to prevent duplicate concurrent fetches
let profilePromise: Promise<any> | null = null;

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  loading: true,
  error: null,
  fetchProfile: async (retries = 3) => {
    if (profilePromise) {
      try {
        const data = await profilePromise
        set({ profile: data, loading: false })
      } catch (err: any) {
        set({ profile: null, error: err, loading: false })
      }
      return
    }

    const fetchWithRetry = async (attemptsLeft: number): Promise<any> => {
      try {
        // Timeout de 15s para evitar que la petición quede colgada 
        // silenciosamente durante la compilación pesada de Next.js
        const res = await api.get('/auth/perfil', { timeout: 15000 })
        if (res.data?.success && res.data?.data) {
          return res.data.data
        }
        throw new Error('No profile data')
      } catch (err: any) {
        const status = err.response?.status
        const isAuthError = status === 401 || status === 403
        
        // Si no es un error de autenticación explícito (ej. timeout o network error)
        // y nos quedan reintentos, probamos de nuevo.
        if (!isAuthError && attemptsLeft > 0) {
          console.warn(`[fetchProfile] Network/Timeout error, reintentando... (${attemptsLeft} intentos restantes)`)
          return fetchWithRetry(attemptsLeft - 1)
        }
        throw err
      }
    }

    profilePromise = fetchWithRetry(retries)

    try {
      const data = await profilePromise
      set({ profile: data, loading: false })
    } catch (err: any) {
      set({ profile: null, error: err, loading: false })
    } finally {
      profilePromise = null // Reset the promise after it resolves/rejects
    }
  }
}))

