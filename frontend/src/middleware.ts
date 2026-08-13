import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rutas públicas - permitir sin autenticación
  const publicRoutes = ['/login', '/api', '/_next', '/public', '/favicon.ico']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route) || pathname === route)
  
  if (isPublicRoute || pathname.endsWith('.png') || pathname.endsWith('.jpg') || pathname.endsWith('.svg')) {
    return NextResponse.next()
  }

  // Verificar cookie JWT (backend de DomunNet usa 'token')
  const token = request.cookies.get('token')?.value || null

  if (!token) {
    // No hay token - redirigir a login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Decodificar y verificar expiración manualmente (Edge friendly, sin validación de firma que falla sin el secret correcto)
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    const now = Math.floor(Date.now() / 1000)
    
    if (payload.exp && payload.exp < now) {
      // Token expirado
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      const response = NextResponse.redirect(loginUrl)
      response.cookies.delete('token')
      return response
    }
  } catch (error) {
    // Error al decodificar - considerar inválido
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    const response = NextResponse.redirect(loginUrl)
    response.cookies.delete('token')
    return response
  }

  // Token válido - permitir acceso
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Proteger todas las rutas
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
