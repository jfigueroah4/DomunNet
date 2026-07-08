'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import Image from 'next/image'
import {
  Home,
  FolderOpen,
  ClipboardList,
  Camera,
  BarChart2,
  Users,
  Settings,
  Shield,
  LogOut,
  ChevronDown,
  Eye,
  Package,
} from 'lucide-react'

interface SidebarProps {
  collapsed?: boolean
}

export default function Sidebar({ collapsed = false }: SidebarProps) {
  const pathname = usePathname()
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/' || pathname === '/dashboard'
    }

    return pathname === path || pathname.startsWith(`${path}/`)
  }

  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    )
  }

  const navSections = [
    {
      label: 'GENERAL',
      items: [
        { name: 'Home', icon: Home, href: '/', label: 'Inicio' },
      ],
    },
    {
      label: 'OPERACIONES',
      items: [
        {
          name: 'FolderOpen',
          icon: FolderOpen,
          href: '/proyectos',
          label: 'Proyectos',
          submenu: [
            { name: 'Supervision', icon: Eye, href: '/proyectos/supervision', label: 'Supervisión' },
            { name: 'Recursos', icon: Package, href: '/proyectos/recursos', label: 'Recursos' },
          ],
        },
        { name: 'ClipboardList', icon: ClipboardList, href: '/bitacora', label: 'Bitácora' },
        { name: 'Camera', icon: Camera, href: '/fotografias', label: 'Fotografías' },
        { name: 'BarChart2', icon: BarChart2, href: '/reportes', label: 'Reportes' },
      ],
    },
    {
      label: 'ADMINISTRACIÓN',
      items: [
        { name: 'Users', icon: Users, href: '/usuarios', label: 'Usuarios' },
        { name: 'Roles', icon: Shield, href: '/roles', label: 'Roles' },
      ],
    },
    {
      label: 'AJUSTES',
      items: [
        { name: 'Settings', icon: Settings, href: '/configuracion', label: 'Configuración' },
      ],
    },
  ]

  return (
    <aside className={`hidden md:flex ${collapsed ? 'w-[76px]' : 'w-[188px]'} flex-col border-r border-gray-100 bg-white shadow-[2px_0_12px_rgba(15,23,42,0.06)] transition-all duration-300`}>
      <div className="flex items-center justify-center border-b border-gray-100 px-3 py-3">
        <Link href="/" className="inline-flex items-center justify-center" aria-label="Ir al inicio">
          <Image
            src="/logo.png"
            alt="Domun"
            width={34}
            height={34}
            className="object-contain"
            priority
          />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navSections.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <h3 className="mb-1 mt-5 px-3 text-[9px] font-semibold uppercase tracking-[0.24em] text-gray-400">
                {section.label}
              </h3>
            )}

            {section.items.map((item: any) => {
              const Icon = item.icon
              const active = isActive(item.href)
              const isExpanded = expandedMenus.includes(item.href)
              const hasSubmenu = item.submenu && item.submenu.length > 0

              return (
                <div key={item.href}>
                  <div
                    className={`group flex items-center gap-1 rounded-lg ${active ? 'bg-red-50' : ''}`}
                  >
                    <Link
                      href={item.href}
                      className={`flex flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] transition-colors ${collapsed ? 'justify-center' : ''} ${
                        active
                          ? 'font-medium text-[#9B0F06]'
                          : 'text-gray-500 hover:bg-gray-100'
                      }`}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon size={15} color={active ? '#9B0F06' : '#6B7280'} />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>

                    {hasSubmenu && !collapsed && (
                      <button
                        onClick={() => toggleMenu(item.href)}
                        className={`mr-1 flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 ${
                          isExpanded ? 'bg-gray-100 text-gray-600' : ''
                        }`}
                        aria-label={`${isExpanded ? 'Colapsar' : 'Expandir'} ${item.label}`}
                        aria-expanded={isExpanded}
                      >
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </button>
                    )}
                  </div>

                  {hasSubmenu && isExpanded && !collapsed && (
                    <div className="ml-4 mt-1 space-y-1 border-l border-gray-100 pl-2">
                      {item.submenu.map((subitem: any) => {
                        const SubIcon = subitem.icon
                        const subActive = isActive(subitem.href)

                        return (
                          <Link
                            key={subitem.href}
                            href={subitem.href}
                            className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[10px] transition-colors ${
                              subActive
                                ? 'bg-red-50 font-medium text-[#9B0F06]'
                                : 'text-gray-500 hover:bg-gray-100'
                            }`}
                          >
                            <SubIcon size={13} color={subActive ? '#9B0F06' : '#6B7280'} />
                            <span>{subitem.label}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-gray-100 p-3">
        <button
          onClick={() => {
            window.location.href = '/login'
          }}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#D53E0F] py-2 text-[11px] font-medium text-white transition-colors hover:bg-[#B53000]"
          title={collapsed ? 'Cerrar sesión' : undefined}
        >
          <LogOut size={13} />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  )
}
