import axios from 'axios'

export const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
  },
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

/**
 * Realiza una petición GET deduplicando peticiones idénticas en vuelo.
 * Si se invoca múltiples veces antes de que la primera finalice (ej. React StrictMode),
 * reutiliza la misma Promesa sin emitir peticiones HTTP duplicadas al servidor.
 */
export function apiGetDeduplicado<T = any>(url: string) {
  if (peticionesEnVuelo.has(url)) {
    return peticionesEnVuelo.get(url)! as Promise<T>
  }

  const promesa = api.get<T>(url).finally(() => {
    peticionesEnVuelo.delete(url)
  })

  peticionesEnVuelo.set(url, promesa)
  return promesa
}
