/**
 * Funciones de formateo puras para reutilizar en el prototipo Figma
 * No dependen de React, Next.js ni el DOM
 */

export function formatFullName(
  primerNombre: string,
  primerApellido: string,
  segundoNombre?: string | null,
  segundoApellido?: string | null
): string {
  const partes = [primerNombre, segundoNombre, primerApellido, segundoApellido]
  return partes.map((p) => (p ?? '').trim()).filter(Boolean).join(' ') || 'Usuario'
}
