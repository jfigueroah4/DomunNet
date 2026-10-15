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

export interface ValidacionFechaResultado {
  valida: boolean
  edad?: number
  mensaje?: string
  mensajeError?: string
}

export function validarFechaNacimiento(
  dia: string | number,
  mes: string | number,
  anio: string | number
): ValidacionFechaResultado {
  const dStr = String(dia ?? '').trim()
  const mStr = String(mes ?? '').trim()
  const yStr = String(anio ?? '').trim()

  if (!dStr && !mStr && !yStr) {
    return { valida: false, mensajeError: 'Fecha no ingresada' }
  }

  if (!dStr || !mStr || yStr.length !== 4) {
    return { valida: false, mensajeError: 'Formato: DD / MM / YYYY' }
  }

  const d = parseInt(dStr, 10)
  const m = parseInt(mStr, 10)
  const y = parseInt(yStr, 10)

  if (isNaN(d) || isNaN(m) || isNaN(y)) {
    return { valida: false, mensajeError: 'Valores numéricos no válidos' }
  }

  if (d < 1 || d > 31) {
    return { valida: false, mensajeError: 'Día debe ser entre 1 y 31' }
  }

  if (m < 1 || m > 12) {
    return { valida: false, mensajeError: 'Mes debe ser entre 1 y 12' }
  }

  const hoy = new Date()
  if (y > hoy.getFullYear()) {
    return { valida: false, mensajeError: 'Año de nacimiento no válido' }
  }

  const dateObj = new Date(y, m - 1, d)
  if (dateObj.getFullYear() !== y || dateObj.getMonth() !== m - 1 || dateObj.getDate() !== d) {
    return { valida: false, mensajeError: 'Fecha no existe en el calendario' }
  }

  let edad = hoy.getFullYear() - y
  const mesActual = hoy.getMonth() + 1
  if (mesActual < m || (mesActual === m && hoy.getDate() < d)) {
    edad--
  }

  if (edad < 18) {
    return { valida: false, edad, mensajeError: 'El usuario debe ser mayor de 18 años' }
  }

  if (edad > 100) {
    return { valida: false, edad, mensajeError: 'La edad no puede exceder los 100 años' }
  }

  return {
    valida: true,
    edad,
    mensaje: `Fecha válida (${edad} años, mayor de edad)`,
  }
}
