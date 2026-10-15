import { create } from 'zustand'
import { apiGetDeduplicado } from '@/lib/api/cliente'
import { formatearNombrePropio } from '@/lib/utils/formatters'

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
  fetchProfile: (retries?: number, force?: boolean) => Promise<void>
}

// Global promise to prevent duplicate concurrent fetches
let profilePromise: Promise<any> | null = null;

const PERFIL_STORAGE_KEY = 'domun_user_profile'

function normalizarPerfil(p: any): UserProfile | null {
  if (!p) return null
  return {
    ...p,
    nombre: formatearNombrePropio(p.nombre),
    apellido: formatearNombrePropio(p.apellido),
    primerNombre: formatearNombrePropio(p.primerNombre),
    segundoNombre: formatearNombrePropio(p.segundoNombre),
    primerApellido: formatearNombrePropio(p.primerApellido),
    segundoApellido: formatearNombrePropio(p.segundoApellido),
  }
}

function getInitialProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(PERFIL_STORAGE_KEY)
    if (raw) return normalizarPerfil(JSON.parse(raw))
  } catch (_) {}
  return null
}

const initialProfile = getInitialProfile()

export const useAuthStore = create<AuthState>((set, get) => ({
  profile: initialProfile,
  loading: !initialProfile,
  error: null,
  fetchProfile: async (retries = 3, force = false) => {
    // Si ya tenemos perfil en memoria/storage y no es forzado, no bloqueamos la interfaz
    if (!force && get().profile) {
      set({ loading: false })
      // Validamos en background silenciosamente si no hay promesa previa
      if (!profilePromise) {
        profilePromise = (async () => {
          try {
            const res = await apiGetDeduplicado('/auth/perfil', { bypassCache: false })
            if (res.data?.success && res.data?.data) {
              const freshData = normalizarPerfil(res.data.data)!
              try { localStorage.setItem(PERFIL_STORAGE_KEY, JSON.stringify(freshData)) } catch (_) {}
              set({ profile: freshData, loading: false })
            }
          } catch (err: any) {
            if (err.response?.status === 401 || err.response?.status === 403) {
              try { localStorage.removeItem(PERFIL_STORAGE_KEY) } catch (_) {}
              set({ profile: null, loading: false })
            }
          } finally {
            profilePromise = null
          }
        })()
      }
      return
    }

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
        const res = await apiGetDeduplicado('/auth/perfil', { bypassCache: force })
        if (res.data?.success && res.data?.data) {
          const freshData = normalizarPerfil(res.data.data)!
          try { localStorage.setItem(PERFIL_STORAGE_KEY, JSON.stringify(freshData)) } catch (_) {}
          return freshData
        }
        throw new Error('No profile data')
      } catch (err: any) {
        const status = err.response?.status
        const isAuthError = status === 401 || status === 403
        
        if (!isAuthError && attemptsLeft > 0) {
          console.warn(`[fetchProfile] Network/Timeout error, reintentando... (${attemptsLeft} intentos restantes)`)
          return fetchWithRetry(attemptsLeft - 1)
        }
        if (isAuthError) {
          try {
            localStorage.removeItem(PERFIL_STORAGE_KEY)
            localStorage.removeItem('domun_notificaciones_borradas')
            sessionStorage.removeItem('domun_notificaciones_borradas')
          } catch (_) {}
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
      profilePromise = null
    }
  }
}))

