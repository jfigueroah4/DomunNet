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
      { label: 'Inicio', icon: Home, href: '/dashboard', isCenter: true },
      { label: 'Reportes', icon: BarChart2, href: '/dashboard/reportes' },
      { label: 'Usuarios', icon: Users, href: '/dashboard/usuarios' },
      { label: 'Ajustes', icon: Settings, href: '/dashboard/configuracion' },
    ]

    const permisos = profile?.permisos || []
    return rawItems.filter((item) => {
      const permisoRequerido = RUTAS_PERMISOS[item.href]
      if (!permisoRequerido) return true
      return tienePermiso(permisos, permisoRequerido)
    })
  }, [profile?.permisos])

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[999] flex h-14 border-t border-gray-200 bg-white/95 backdrop-blur-md shadow-[0_-2px_10px_rgba(15,23,42,0.08)] md:hidden px-1 items-end pb-1">
      {navItems.map((item) => {
        const active = isActive(item.href)
        const Icon = item.icon

        if (item.isCenter) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-1 flex-col items-center justify-center transition-colors min-w-0 -mt-4 pb-0.5"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-full bg-[#9B0F06] text-white shadow-lg border-2 border-white transition-all ${
                  active ? 'scale-105 ring-2 ring-[#9B0F06]/40' : 'hover:scale-105'
                }`}
              >
                <Icon size={20} className="text-white shrink-0" />
              </div>
              <span className="text-[9px] font-bold text-[#9B0F06] truncate max-w-full px-0.5 mt-0.5">
                {item.label}
              </span>
            </Link>
          )
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className="relative flex flex-1 flex-col items-center justify-center py-1 transition-colors min-w-0"
          >
            {active && (
              <div className="absolute top-0 left-1 right-1 h-[3px] rounded-b-md bg-[#9B0F06]" />
            )}

            <Icon
              size={17}
              className={`mb-0.5 transition-colors shrink-0 ${
                active ? 'text-[#9B0F06]' : 'text-[#8E96AE]'
              }`}
            />
            <span
              className={`text-[8.5px] font-semibold transition-colors truncate max-w-full px-0.5 ${
                active ? 'text-[#9B0F06]' : 'text-[#8E96AE]'
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
