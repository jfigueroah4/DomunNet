'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'
import { Home, FolderOpen, ClipboardList, Camera, BarChart2, Users, Settings } from 'lucide-react'
import { useAuthStore } from '@/stores/useAuthStore'
import { tienePermiso, RUTAS_PERMISOS } from '@/lib/rutas-permisos'

export default function BottomNavbar() {
  const pathname = usePathname()
  const { profile } = useAuthStore()

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/'
    }
    return pathname === path || pathname.startsWith(`${path}/`)
  }

  const navItems = useMemo(() => {
    const rawItems = [
      { label: 'Proyectos', icon: FolderOpen, href: '/dashboard/proyectos' },
      { label: 'Bitácora', icon: ClipboardList, href: '/dashboard/bitacora' },
      { label: 'Fotos', icon: Camera, href: '/dashboard/fotografias' },
      { label: 'Inicio', icon: Home, href: '/dashboard' },
      { label: 'Reportes', icon: BarChart2, href: '/dashboard/reportes' },
      { label: 'Usuarios', icon: Users, href: '/dashboard/usuarios' },
      { label: 'Ajustes', icon: Settings, href: '/dashboard/configuracion' },
    ]

    const permisos = profile?.permisos || []
    return rawItems.filter((item) => {
      const basePath = item.href.split('?')[0]
      const permisoRequerido = RUTAS_PERMISOS[basePath]
      if (!permisoRequerido) return true
      return tienePermiso(permisos, permisoRequerido, profile?.rol)
    })
  }, [profile?.permisos, profile?.rol])

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[999] flex h-14 border-t border-gray-200 bg-white/95 backdrop-blur-md shadow-[0_-2px_10px_rgba(15,23,42,0.08)] md:hidden px-1 items-center">
      {navItems.map((item) => {
        const active = isActive(item.href)
        const Icon = item.icon
        const esDestacado = (item as any).esDestacado

        return (
          <Link
            key={item.label}
            href={item.href}
            className="relative flex flex-1 flex-col items-center justify-center py-1 transition-colors min-w-0"
          >
            <div
              className={`p-1 rounded-full transition-all ${
                esDestacado
                  ? 'bg-red-50 text-[#9B0F06] ring-2 ring-[#9B0F06]/40 shadow-xs scale-105'
                  : ''
              }`}
            >
              <Icon
                size={17}
                className={`transition-colors shrink-0 ${
                  active || esDestacado ? 'text-[#9B0F06]' : 'text-[#8E96AE]'
                }`}
              />
            </div>
            <span
              className={`text-[8.5px] font-semibold transition-colors truncate max-w-full px-0.5 ${
                active || esDestacado ? 'text-[#9B0F06] font-extrabold' : 'text-[#8E96AE]'
              }`}
            >
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
