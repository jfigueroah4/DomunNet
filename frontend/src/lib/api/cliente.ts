import axios from 'axios'

export const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true, // Requerido para enviar cookies httpOnly automáticamente
  headers: {
    'Content-Type': 'application/json',
  },
})

// NOTE: Session management and refresh tokens are delegated to Supabase Auth.
// No auto-refresh interceptor is needed since Supabase handles token refresh on the client side.
