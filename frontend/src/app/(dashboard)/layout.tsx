'use client'

import { useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import BottomNavbar from '@/components/layout/BottomNavbar'

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

  const section = useMemo(() => getSectionTitle(pathname), [pathname])

  return (
    <div className="flex min-h-screen bg-[#F3F4F7]">
      <Sidebar collapsed={collapsed} />
      <main className="flex min-w-0 flex-1 flex-col bg-[#F3F4F7]">
        <TopBar section={section} onToggle={() => setCollapsed(!collapsed)} />
        <div className="flex-1 overflow-auto px-4 pt-4 pb-20 md:pb-4 xl:px-5">
          <div className="mx-auto w-full max-w-[1600px]">
            {children}
          </div>
        </div>
      </main>
      <BottomNavbar />
    </div>
  )
}
