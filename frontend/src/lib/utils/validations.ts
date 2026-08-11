/**
 * Funciones de validación puras para reutilizar en el prototipo Figma
 * No dependen de React, Next.js ni el DOM
 */

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_.-]{3,30}$/
  return usernameRegex.test(username)
}

export function validateLoginInput(
  identificador: string,
  password: string
): { valid: boolean; error?: string } {
  if (!identificador || identificador.trim().length === 0) {
    return { valid: false, error: 'Ingrese su usuario' }
  }

  if (!password || password.length === 0) {
    return { valid: false, error: 'Ingrese su contraseña' }
  }

  return { valid: true }
}
