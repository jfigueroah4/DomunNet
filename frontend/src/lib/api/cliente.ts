import axios from 'axios'

const defaultBackendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'https://domunnet-backend.onrender.com'
const cleanBackendUrl = defaultBackendUrl.replace(/\/api\/?v1\/?$/, '').replace(/\/$/, '')

export const api = axios.create({
  baseURL: typeof window === 'undefined' ? `${cleanBackendUrl}/api/v1` : '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
  },
})

// Interceptor de Petición (Client y SSR)
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    try {
      const devId = localStorage.getItem('domun_device_id')
      if (devId) {
        config.headers = config.headers || {}
        config.headers['x-device-id'] = devId
      }
    } catch (_) {}
  } else {
    const serverOrigin = cleanBackendUrl
    if (config.url && !config.url.startsWith('http')) {
      let relativePath = config.url
      if (relativePath.startsWith('/api/v1')) {
        relativePath = relativePath.replace('/api/v1', '')
      }
      config.url = `${serverOrigin}/api/v1${relativePath.startsWith('/') ? '' : '/'}${relativePath}`
    }
    try {
      // Forward auth cookies from Next.js request context to backend
      const { cookies } = require('next/headers')
      const cookieHeader = cookies().toString()
      if (cookieHeader) {
        config.headers = config.headers || {}
        config.headers.Cookie = cookieHeader
      }
    } catch (e) {
      // Ignore if called outside request lifecycle
    }
  }
  return config
})

// Interceptor para manejar errores globales e invalidar caché tras mutaciones
api.interceptors.response.use(
  (response) => {
    const method = (response.config?.method || '').toLowerCase()
    if (['post', 'put', 'patch', 'delete'].includes(method)) {
      limpiarCacheMemoria()
    }
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
)

const peticionesEnVuelo = new Map<string, Promise<any>>()
const cacheMemoria = new Map<string, { data: any; timestamp: number }>()
const STORAGE_PREFIX = 'domun_api_cache:'
const TTL_CACHE_MS = 10 * 60 * 1000 // 10 minutos de cache

/**
 * Realiza una petición GET deduplicando peticiones en vuelo y guardando en caché de memoria y sessionStorage.
 * Si se invoca múltiples veces o al recargar la pantalla, devuelve la respuesta
 * almacenada sin emitir llamadas HTTP redundantes al backend.
 */
export function apiGetDeduplicado<T = any>(url: string, opciones?: { bypassCache?: boolean }) {
  const ahora = Date.now()
  const storageKey = `${STORAGE_PREFIX}${url}`

  const esServidor = typeof window === 'undefined'

  // 1. Servir desde caché de memoria RAM si es válido y no se solicitó bypass (solo en navegador)
  if (!esServidor && !opciones?.bypassCache && cacheMemoria.has(url)) {
    const item = cacheMemoria.get(url)!
    if (ahora - item.timestamp < TTL_CACHE_MS) {
      return Promise.resolve(item.data as T)
    }
  }

  // 2. Servir desde sessionStorage si existe y es válido (solo en navegador)
  if (!esServidor && !opciones?.bypassCache) {
    try {
      const raw = sessionStorage.getItem(storageKey)
      if (raw) {
        const item = JSON.parse(raw)
        if (ahora - item.timestamp < TTL_CACHE_MS && item.data) {
          cacheMemoria.set(url, { data: item.data, timestamp: item.timestamp })
          return Promise.resolve(item.data as T)
        } else {
          sessionStorage.removeItem(storageKey)
        }
      }
    } catch {}
  }

  // 3. Si ya hay una petición idéntica en vuelo, reutilizar la misma Promesa
  if (peticionesEnVuelo.has(url)) {
    return peticionesEnVuelo.get(url)! as Promise<T>
  }

  // 4. Petición de red real y almacenamiento en memoria + sessionStorage
  const promesa = api.get<T>(url)
    .then((res) => {
      if (!esServidor) {
        cacheMemoria.set(url, { data: res, timestamp: Date.now() })
        try {
          const cachePayload = {
            data: res.data,
            status: res.status,
            statusText: res.statusText,
          }
          sessionStorage.setItem(storageKey, JSON.stringify({
            data: cachePayload,
            timestamp: Date.now(),
          }))
        } catch {}
      }
      return res
    })
    .finally(() => {
      peticionesEnVuelo.delete(url)
    })

  peticionesEnVuelo.set(url, promesa)
  return promesa
}

/**
 * Invalida una URL específica o limpia todo el caché en memoria y sessionStorage (ej. tras crear o editar un registro).
 */
export function limpiarCacheMemoria(url?: string) {
  if (url) {
    cacheMemoria.delete(url)
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(`${STORAGE_PREFIX}${url}`)
      } catch {}
    }
  } else {
    cacheMemoria.clear()
    if (typeof window !== 'undefined') {
      try {
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
          const k = sessionStorage.key(i)
          if (k && k.startsWith(STORAGE_PREFIX)) {
            sessionStorage.removeItem(k)
          }
        }
        sessionStorage.removeItem('domun_proyectos_cache')
        sessionStorage.removeItem('domun_fotografias_cache')
        sessionStorage.removeItem('domun_bitacora_cache')
      } catch {}
    }
  }
}
