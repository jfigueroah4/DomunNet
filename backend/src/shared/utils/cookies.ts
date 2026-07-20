export function obtenerCookie(cookieHeader: string | undefined, nombre: string): string | null {
  if (!cookieHeader) return null
  const cookies = cookieHeader.split(';')
  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split('=')
    if (key === nombre) return decodeURIComponent(value)
  }
  return null
}
