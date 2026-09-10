import axios from 'axios'

export const api = axios.create({
  baseURL: typeof window === 'undefined' ? (process.env.BACKEND_URL || 'http://localhost:3001/api/v1') : '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
  },
})

// Interceptor de Petición para SSR (Node.js Server Components en Next.js)
api.interceptors.request.use((config) => {
  if (typeof window === 'undefined') {
    const serverOrigin = process.env.BACKEND_URL || 'http://localhost:3001'
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

// Interceptor para manejar errores globales (ej. JWT expirado)
api.interceptors.response.use(
  (response) => response,
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
const TTL_CACHE_MS = 5 * 60 * 1000 // 5 minutos de cache en memoria

/**
 * Realiza una petición GET deduplicando peticiones en vuelo y guardando en caché de memoria.
 * Si se invoca múltiples veces o al navegar de nuevo a la pantalla, devuelve la respuesta
 * almacenada en memoria sin emitir llamadas HTTP redundantes al backend.
 */
export function apiGetDeduplicado<T = any>(url: string, opciones?: { bypassCache?: boolean }) {
  // 1. Servir desde caché de memoria si es válido y no se solicitó bypass
  if (!opciones?.bypassCache && cacheMemoria.has(url)) {
    const item = cacheMemoria.get(url)!
    if (Date.now() - item.timestamp < TTL_CACHE_MS) {
      return Promise.resolve(item.data as T)
    }
  }

  // 2. Si ya hay una petición idéntica en vuelo, reutilizar la misma Promesa
  if (peticionesEnVuelo.has(url)) {
    return peticionesEnVuelo.get(url)! as Promise<T>
  }

  // 3. Petición de red real y almacenamiento en memoria
  const promesa = api.get<T>(url)
    .then((res) => {
      cacheMemoria.set(url, { data: res, timestamp: Date.now() })
      return res
    })
    .finally(() => {
      peticionesEnVuelo.delete(url)
    })

  peticionesEnVuelo.set(url, promesa)
  return promesa
}

/**
 * Invalida una URL específica o limpia todo el caché en memoria (ej. tras crear o editar un registro).
 */
export function limpiarCacheMemoria(url?: string) {
  if (url) {
    cacheMemoria.delete(url)
  } else {
    cacheMemoria.clear()
  }
}
