import axios from 'axios'

export const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true, // Requerido para enviar cookies httpOnly automáticamente
  headers: {
    'Content-Type': 'application/json',
  },
})

let estaRefrescando = false
let suscriptoresAlToken: ((token: string) => void)[] = []

function suscribirARefresco(callback: (token: string) => void) {
  suscriptoresAlToken.push(callback)
}

function notificarSuscriptores(nuevoToken: string) {
  suscriptoresAlToken.forEach((callback) => callback(nuevoToken))
  suscriptoresAlToken = []
}

// Interceptor de respuesta para manejar auto-refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const peticionOriginal = error.config

    if (error.response?.status === 401 && !peticionOriginal._retry) {
      if (estaRefrescando) {
        return new Promise((resolve) => {
          suscribirARefresco(() => {
            // El backend maneja las cookies, por lo que reintentar la llamada enviará la nueva cookie automáticamente
            resolve(api(peticionOriginal))
          })
        })
      }

      peticionOriginal._retry = true
      estaRefrescando = true

      try {
        // Llamar al endpoint de refresco silencioso en el backend
        await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true })
        
        estaRefrescando = false
        notificarSuscriptores('ok') // Indicar que el refresco fue correcto
        
        return api(peticionOriginal)
      } catch (errorRefresco) {
        estaRefrescando = false
        suscriptoresAlToken = []
        
        // Si falla el refresco, redirigir al login en el cliente
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        return Promise.reject(errorRefresco)
      }
    }

    return Promise.reject(error)
  }
)
