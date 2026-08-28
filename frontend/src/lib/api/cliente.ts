import axios from 'axios'

export const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true, // Requerido para enviar cookies httpOnly automÃ¡ticamente
  headers: {
    'Content-Type': 'application/json',
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

