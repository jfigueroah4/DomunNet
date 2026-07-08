'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, FolderOpen, ClipboardList, Camera, BarChart2 } from 'lucide-react'

export default function BottomNavbar() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/' || pathname === '/dashboard'
    }
    return pathname === path || pathname.startsWith(`${path}/`)
  }

  const navItems = [
    { label: 'Inicio', icon: Home, href: '/' },
    { label: 'Proyectos', icon: FolderOpen, href: '/proyectos' },
    { label: 'Bitácora', icon: ClipboardList, href: '/bitacora' },
    { label: 'Fotos', icon: Camera, href: '/fotografias' },
    { label: 'Reportes', icon: BarChart2, href: '/reportes' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-14 border-t border-gray-100 bg-white shadow-[0_-2px_10px_rgba(15,23,42,0.04)] md:hidden">
      {navItems.map((item) => {
        const active = isActive(item.href)
        const Icon = item.icon

        return (
          <Link
            key={item.href}
            href={item.href}
            className="relative flex flex-1 flex-col items-center justify-center py-1 transition-colors"
          >
            {/* Active top line indicator */}
            {active && (
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#9B0F06]" />
            )}

            <Icon
              size={18}
              className={`mb-0.5 transition-colors ${
                active ? 'text-[#9B0F06]' : 'text-[#8E96AE]'
              }`}
            />
            <span
              className={`text-[9px] font-semibold transition-colors ${
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
