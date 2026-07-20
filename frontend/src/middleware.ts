import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const { pathname } = request.nextUrl

  // Definir rutas protegidas del dashboard
  const isProtected = 
    pathname === '/' ||
    pathname.startsWith('/usuarios') ||
    pathname.startsWith('/roles') ||
    pathname.startsWith('/configuracion') ||
    pathname.startsWith('/proyectos') ||
    pathname.startsWith('/bitacora') ||
    pathname.startsWith('/fotografias') ||
    pathname.startsWith('/reportes')

  if (isProtected) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'domunnet-secret')
      await jwtVerify(token, secret)
      return NextResponse.next()
    } catch (error) {
      // Redirigir y borrar cookie inválida
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('token')
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
