import axios from 'axios'

const defaultBackendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'https://domunnet-backend.onrender.com'
const cleanBackendUrl = defaultBackendUrl.replace(/\/api\/?v1\/?$/, '').replace(/\/$/, '')

/**
 * Determina la URL base de la API.
 * En el navegador, si estamos en producción (Cloudflare Pages *.pages.dev o dominio público)
 * o si se activó el modo directo por 429 de Cloudflare, apunta DIRECTAMENTE al backend en Render.
 */
function getClientBaseUrl(): string {
  if (typeof window === 'undefined') {
    return `${cleanBackendUrl}/api/v1`
  }
  try {
    const host = window.location.hostname
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.')
    const useDirect = sessionStorage.getItem('domun_use_direct_backend') === 'true'
    // En producción (Cloudflare Pages u otros dominios públicos) o si Cloudflare agotó cuota:
    if (!isLocal || useDirect) {
      return `${cleanBackendUrl}/api/v1`
    }
  } catch (_) {}
  return '/api/v1'
}

export const api = axios.create({
  baseURL: getClientBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
  },
})

// Interceptor de Petición (Client y SSR)
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    try {
      const host = window.location.hostname
      const isLocal = host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.')
      const useDirect = sessionStorage.getItem('domun_use_direct_backend') === 'true'

      if ((!isLocal || useDirect) && (config.baseURL === '/api/v1' || !config.baseURL)) {
        config.baseURL = `${cleanBackendUrl}/api/v1`
      }

      const devId = localStorage.getItem('domun_device_id')
      if (devId) {
        config.headers = config.headers || {}
        config.headers['x-device-id'] = devId
      }

      // Adjuntar Authorization Bearer si hay token guardado
      let token = localStorage.getItem('domun_auth_token')
      if (!token && typeof document !== 'undefined') {
        const match = document.cookie.match(/(?:^|;\s*)token=([^;]+)/)
        if (match) token = decodeURIComponent(match[1])
      }
      if (token) {
        config.headers = config.headers || {}
        if (!config.headers['Authorization']) {
          config.headers['Authorization'] = `Bearer ${token}`
        }
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
  async (error) => {
    const originalConfig = error.config
    // Si recibimos 429 de Cloudflare Pages Functions o fallo de proxy, reintentar DIRECTO a Render
    if (
      typeof window !== 'undefined' &&
      error.response?.status === 429 &&
      originalConfig &&
      !(originalConfig as any)._retriedDirect
    ) {
      ;(originalConfig as any)._retriedDirect = true
      try {
        sessionStorage.setItem('domun_use_direct_backend', 'true')
        api.defaults.baseURL = `${cleanBackendUrl}/api/v1`
      } catch (_) {}

      // Normalizar la URL para apuntar a Render directamente
      let targetUrl = originalConfig.url || ''
      if (!targetUrl.startsWith('http')) {
        if (!targetUrl.startsWith('/api/v1')) {
          targetUrl = `/api/v1${targetUrl.startsWith('/') ? '' : '/'}${targetUrl}`
        }
        targetUrl = `${cleanBackendUrl}${targetUrl}`
      }
      originalConfig.baseURL = undefined
      originalConfig.url = targetUrl

      // Asegurar cabeceras de autorización y dispositivo
      try {
        const devId = localStorage.getItem('domun_device_id')
        if (devId) {
          originalConfig.headers = originalConfig.headers || {}
          originalConfig.headers['x-device-id'] = devId
        }
        let token = localStorage.getItem('domun_auth_token')
        if (!token && typeof document !== 'undefined') {
          const match = document.cookie.match(/(?:^|;\s*)token=([^;]+)/)
          if (match) token = decodeURIComponent(match[1])
        }
        if (token) {
          originalConfig.headers = originalConfig.headers || {}
          originalConfig.headers['Authorization'] = `Bearer ${token}`
        }
      } catch (_) {}

      return api(originalConfig)
    }

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
