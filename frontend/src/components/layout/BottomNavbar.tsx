'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'
import { Home, FolderOpen, ClipboardList, Camera, BarChart2 } from 'lucide-react'
import { useAuthStore } from '@/stores/useAuthStore'
import { tienePermiso, RUTAS_PERMISOS } from '@/lib/rutas-permisos'
import { useUIStore } from '@/stores/useUIStore'

export default function BottomNavbar() {
  const pathname = usePathname()
  const { profile } = useAuthStore()
  const ocultarBottomNav = useUIStore((s) => s.ocultarBottomNav)

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
      { label: 'Inicio', icon: Home, href: '/dashboard' },
      { label: 'Fotos', icon: Camera, href: '/dashboard/fotografias' },
      { label: 'Reportes', icon: BarChart2, href: '/dashboard/reportes' },
    ]

    const permisos = profile?.permisos || []
    return rawItems.filter((item) => {
      const basePath = item.href.split('?')[0]
      const permisoRequerido = RUTAS_PERMISOS[basePath]
      if (!permisoRequerido) return true
      return tienePermiso(permisos, permisoRequerido, profile?.rol)
    })
  }, [profile?.permisos, profile?.rol])

  if (ocultarBottomNav) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[999] flex h-[54px] sm:h-[58px] md:h-16 pb-safe border-t border-gray-200/80 bg-white/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(15,23,42,0.08)] md:hidden px-2 items-center justify-around select-none">
      {navItems.map((item) => {
        const active = isActive(item.href)
        const Icon = item.icon
        const esDestacado = (item as any).esDestacado

        return (
          <Link
            key={item.label}
            href={item.href}
            prefetch={true}
            className="relative flex flex-1 flex-col items-center justify-center py-1 transition-all min-w-0 active:scale-95 group"
          >
            {/* Pill de fondo para el elemento activo estilo iOS/Material You */}
            <div
              className={`flex items-center justify-center px-3.5 py-0.5 sm:px-4 sm:py-1 rounded-full transition-all ${
                active
                  ? 'bg-red-50 text-[#9B0F06]'
                  : esDestacado
                  ? 'bg-red-50/70 text-[#9B0F06]'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Icon
                size={18}
                className={`transition-colors shrink-0 sm:w-[20px] sm:h-[20px] ${
                  active || esDestacado ? 'text-[#9B0F06] stroke-[2.3]' : 'text-gray-400 group-hover:text-gray-700 stroke-[1.8]'
                }`}
              />
            </div>
            <span
              className={`text-[9.5px] sm:text-[10px] tracking-tight transition-colors truncate max-w-full px-0.5 mt-0.5 leading-none ${
                active || esDestacado
                  ? 'text-[#9B0F06] font-bold'
                  : 'text-gray-500 font-medium group-hover:text-gray-800'
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
