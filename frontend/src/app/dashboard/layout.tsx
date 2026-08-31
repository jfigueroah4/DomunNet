'use client'

import { useMemo, useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import BottomNavbar from '@/components/layout/BottomNavbar'
import { useAuthStore } from '@/stores/useAuthStore'
import { Loader2 } from 'lucide-react'
import { tienePermiso, RUTAS_PERMISOS } from '@/lib/rutas-permisos'
import AccessDenied from '@/components/layout/AccessDenied'

function getSectionTitle(pathname: string) {
  if (pathname === '/dashboard') return 'INICIO'
  if (pathname.startsWith('/dashboard/proyectos/') && pathname.includes('/editar')) return 'EDITAR PROYECTO'
  if (pathname.startsWith('/dashboard/proyectos/')) return 'DETALLE PROYECTO'
  if (pathname.startsWith('/dashboard/proyectos')) return 'PROYECTOS'
  if (pathname.startsWith('/dashboard/bitacora')) return 'BITÁCORA'
  if (pathname.startsWith('/dashboard/fotografias')) return 'FOTOGRAFÍAS'
  if (pathname.startsWith('/dashboard/reportes')) return 'REPORTES'
  if (pathname.startsWith('/dashboard/usuarios')) return 'USUARIOS'
  if (pathname.startsWith('/dashboard/roles')) return 'ROLES'
  if (pathname.startsWith('/dashboard/configuracion')) return 'CONFIGURACIÓN'
  if (pathname.startsWith('/dashboard/perfil')) return 'PERFIL'
  if (pathname.startsWith('/dashboard/soporte')) return 'SOPORTE'
  return 'INICIO'
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  
  const { profile, loading, fetchProfile } = useAuthStore()

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  useEffect(() => {
    if (!loading && profile === null) {
      router.replace('/login')
    }
  }, [loading, profile, router])

  
  const autorizado = useMemo(() => {
    if (!profile) return false
    // Match the exact path or its base path
        // Find the longest matching prefix in RUTAS_PERMISOS
    const matches = Object.keys(RUTAS_PERMISOS).filter(p => pathname === p || pathname.startsWith(`${p}/`))
    if (matches.length === 0) return true // Unprotected or implicit
    
    // Check if user has permission for the most specific matched route
    const mostSpecific = matches.sort((a, b) => b.length - a.length)[0]
    const permiso = RUTAS_PERMISOS[mostSpecific]
    return tienePermiso(profile.permisos || [], permiso)
  }, [pathname, profile])

  const section = useMemo(() => getSectionTitle(pathname), [pathname])

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F3F4F7]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-[#9B0F06]" />
          <span className="text-sm font-semibold text-gray-500 uppercase tracking-widest">
            Validando sesión...
          </span>
        </div>
      </div>
    )
  }

  if (!loading && profile === null) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-[#F3F4F7]">
      <Sidebar collapsed={collapsed} />
      <main className="flex min-w-0 flex-1 flex-col bg-[#F3F4F7]">
        <TopBar section={section} onToggle={() => setCollapsed(!collapsed)} />
        <div className="flex-1 overflow-auto px-4 pt-4 pb-20 md:pb-4 xl:px-5">
          <div className="mx-auto w-full max-w-[1600px]">
            {autorizado ? children : <AccessDenied />}
          </div>
        </div>
      </main>
      <BottomNavbar />
    </div>
  )
}
