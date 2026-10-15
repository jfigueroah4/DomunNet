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
import { useUIStore } from '@/stores/useUIStore'

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

function getSectionDisplayTitle(pathname: string): string {
  if (pathname === '/dashboard') return 'Inicio'
  if (pathname.startsWith('/dashboard/proyectos/') && pathname.includes('/hoja-sabana')) return 'Hoja Sábana'
  if (pathname.startsWith('/dashboard/proyectos/') && pathname.includes('/editar')) return 'Editar Proyecto'
  if (pathname.startsWith('/dashboard/proyectos/nuevo')) return 'Nuevo Proyecto'
  if (pathname.startsWith('/dashboard/proyectos/empresas')) return 'Empresas'
  if (pathname.startsWith('/dashboard/proyectos/renglones')) return 'Renglones'
  if (pathname.startsWith('/dashboard/proyectos/supervision')) return 'Supervisión'
  if (pathname.startsWith('/dashboard/proyectos/recursos')) return 'Recursos'
  if (pathname.startsWith('/dashboard/proyectos/detalles') || (pathname.startsWith('/dashboard/proyectos/') && !pathname.endsWith('/proyectos'))) return 'Detalle de Proyecto'
  if (pathname.startsWith('/dashboard/proyectos')) return 'Proyectos'
  if (pathname.startsWith('/dashboard/bitacora')) return 'Bitácora'
  if (pathname.startsWith('/dashboard/fotografias/nueva')) return 'Nueva Fotografía'
  if (pathname.startsWith('/dashboard/fotografias')) return 'Fotografías'
  if (pathname.startsWith('/dashboard/reportes/nuevo')) return 'Nuevo Reporte'
  if (pathname.startsWith('/dashboard/reportes')) return 'Reportes'
  if (pathname.startsWith('/dashboard/estadisticas')) return 'Estadísticas'
  if (pathname.startsWith('/dashboard/usuarios')) return 'Usuarios'
  if (pathname.startsWith('/dashboard/roles')) return 'Roles'
  if (pathname.startsWith('/dashboard/configuracion/mantenimiento-tablas')) return 'Mantenimiento de Tablas'
  if (pathname.startsWith('/dashboard/configuracion/backup')) return 'Respaldos'
  if (pathname.startsWith('/dashboard/configuracion/restauracion')) return 'Restauración'
  if (pathname.startsWith('/dashboard/configuracion/reinicio')) return 'Reinicio'
  if (pathname.startsWith('/dashboard/configuracion/notificaciones')) return 'Notificaciones'
  if (pathname.startsWith('/dashboard/configuracion/general')) return 'Configuración General'
  if (pathname.startsWith('/dashboard/configuracion/tablas')) return 'Tablas'
  if (pathname.startsWith('/dashboard/configuracion')) return 'Configuración'
  if (pathname.startsWith('/dashboard/perfil')) return 'Perfil'
  if (pathname.startsWith('/dashboard/tickets')) return 'Tickets'
  if (pathname.startsWith('/dashboard/soporte')) return 'Soporte'
  if (pathname.startsWith('/dashboard/renglones')) return 'Renglones DGC'
  return 'Inicio'
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  
  const { profile, loading, fetchProfile } = useAuthStore()
  const ocultarBottomNav = useUIStore((s) => s.ocultarBottomNav)

  useEffect(() => {
    setMounted(true)
    fetchProfile()
  }, [fetchProfile])

  useEffect(() => {
    if (!loading && profile === null) {
      router.replace('/login')
    }
  }, [loading, profile, router])

  useEffect(() => {
    const sectionName = getSectionDisplayTitle(pathname)
    document.title = `${sectionName} - DOMUN`
  }, [pathname])

  
  const autorizado = useMemo(() => {
    if (!profile) return false
    // Match the exact path or its base path
        // Find the longest matching prefix in RUTAS_PERMISOS
    const matches = Object.keys(RUTAS_PERMISOS).filter(p => pathname === p || pathname.startsWith(`${p}/`))
    if (matches.length === 0) return true // Unprotected or implicit
    
    // Check if user has permission for the most specific matched route
    const mostSpecific = matches.sort((a, b) => b.length - a.length)[0]
    const permiso = RUTAS_PERMISOS[mostSpecific]
    return tienePermiso(profile.permisos || [], permiso, profile.rol)
  }, [pathname, profile])

  const section = useMemo(() => getSectionTitle(pathname), [pathname])

  if (!mounted || loading) {
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

  if (profile === null) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F3F4F7]">
      <Sidebar collapsed={collapsed} />
      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden bg-[#F3F4F7]">
        <TopBar section={section} onToggle={() => setCollapsed(!collapsed)} />
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3.5 sm:px-4 pt-3.5 sm:pt-4 pb-20 sm:pb-24 md:pb-6 xl:px-5 overscroll-y-contain">
          <div className="mx-auto w-full max-w-[1600px] min-w-0">
            {autorizado ? children : <AccessDenied />}
          </div>
        </main>
        {!ocultarBottomNav && <BottomNavbar />}
      </div>
    </div>
  )
}
