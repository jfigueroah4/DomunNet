import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Helper para añadir cabeceras de seguridad HTTPS
  const setSecurityHeaders = (res: NextResponse) => {
    res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
    res.headers.set('X-Content-Type-Options', 'nosniff')
    res.headers.set('X-Frame-Options', 'SAMEORIGIN')
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    return res
  }

  // Rutas públicas - permitir sin autenticación
  const publicRoutes = [
    '/login',
    '/aviso-legal',
    '/privacidad',
    '/cookies',
    '/sitemap.xml',
    '/robots.txt',
    '/api',
    '/_next',
    '/public',
    '/favicon.ico',
    '/icon.svg',
    '/logo.ico',
  ]
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route) || pathname === route)
  
  if (isPublicRoute || pathname.endsWith('.png') || pathname.endsWith('.jpg') || pathname.endsWith('.svg') || pathname.endsWith('.ico')) {
    return setSecurityHeaders(NextResponse.next())
  }

  // Verificar cookie JWT (backend de DomunNet usa 'token')
  const token = request.cookies.get('token')?.value || null

  if (!token) {
    // No hay token - redirigir a login
    return setSecurityHeaders(NextResponse.redirect(new URL('/login', request.url)))
  }

  // Decodificar y verificar expiración manualmente (Edge friendly)
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    const now = Math.floor(Date.now() / 1000)
    
    if (payload.exp && payload.exp < now) {
      // Token expirado
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('token')
      return setSecurityHeaders(response)
    }
  } catch (error) {
    // Error al decodificar - considerar inválido
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('token')
    return setSecurityHeaders(response)
  }

  // Token válido - permitir acceso
  if (pathname === '/') {
    return setSecurityHeaders(NextResponse.redirect(new URL('/dashboard', request.url)))
  }
  return setSecurityHeaders(NextResponse.next())
}

export const config = {
  matcher: [
    // Proteger todas las rutas
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
