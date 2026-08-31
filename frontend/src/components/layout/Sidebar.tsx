'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useMemo } from 'react'
import { tienePermiso, RUTAS_PERMISOS } from '@/lib/rutas-permisos'
import { useAuthStore } from '@/stores/useAuthStore'
import Image from 'next/image'
import {
  Home,
  FolderOpen,
  ClipboardList,
  Camera,
  BarChart2,
  Users,
  Settings,
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
    if (path === '/') return pathname === '/' || pathname === '/dashboard'
    return pathname === path || pathname.startsWith(`${path}/`)
  }


  const { profile } = useAuthStore()

  const navSections = useMemo(() => {
    const rawSections = [
      {
        label: 'GENERAL',
        items: [{ icon: Home, href: '/dashboard', label: 'Inicio' }],
      },
      {
        label: 'OPERACIONES',
        items: [
          {
            icon: FolderOpen,
            href: '/dashboard/proyectos',
            label: 'Proyectos',
            submenu: [{ icon: Eye, href: '/dashboard/proyectos/supervision', label: 'Hoja Sábana' }],
          },
          {
            icon: ClipboardList,
            href: '/dashboard/bitacora',
            label: 'Bitácora',
            submenu: [
              { icon: Package, href: '/dashboard/bitacora?tab=laboratorio', label: 'Laboratorio' },
              { icon: Package, href: '/dashboard/bitacora?tab=campo', label: 'Campo de Trabajo' },
            ],
          },
          { icon: Camera, href: '/dashboard/fotografias', label: 'Fotografías' },
          {
            icon: BarChart2,
            href: '/dashboard/reportes',
            label: 'Reportes',
            submenu: [{ icon: Package, href: '/dashboard/reportes', label: 'Documentos formales' }],
          },
        ],
      },
      {
        label: 'ADMINISTRACIÓN',
        items: [
          {
            icon: Users,
            href: '/dashboard/usuarios',
            label: 'Usuarios',
            submenu: [{ icon: Package, href: '/dashboard/roles', label: 'Roles' }],
          },
        ],
      },
      {
        label: 'AJUSTES',
        items: [{ icon: Settings, href: '/dashboard/configuracion', label: 'Ajustes' }],
      },
    ]

    const permisos = profile?.permisos || []
    
    // Filter sections based on permissions
    return rawSections.map(section => {
      const filteredItems = section.items.filter(item => {
        // Strip query params for checking
        const basePath = item.href.split('?')[0]
        const permisoRequerido = RUTAS_PERMISOS[basePath]
        if (!permisoRequerido) return true // No permission required
        return tienePermiso(permisos, permisoRequerido)
      }).map(item => {
        if (!item.submenu) return item
        // Filter submenus
        const filteredSubmenu = item.submenu.filter(sub => {
          const subBasePath = sub.href.split('?')[0]
          // If submenu path is same as parent, it requires same perm, or check RUTAS_PERMISOS
          const req = RUTAS_PERMISOS[subBasePath] || RUTAS_PERMISOS[item.href.split('?')[0]]
          if (!req) return true
          return tienePermiso(permisos, req)
        })
        return { ...item, submenu: filteredSubmenu }
      })
      return { ...section, items: filteredItems }
    }).filter(section => section.items.length > 0)
  }, [profile?.permisos])

  return (
    <aside
      className={`hidden md:flex ${collapsed ? 'w-[72px]' : 'w-[185px]'} flex-col border-r border-gray-100 bg-white shadow-[2px_0_16px_-4px_rgba(0,0,0,0.08)] transition-all duration-300 relative z-30`}
    >
      <div className="flex items-center justify-center border-b border-gray-100 px-3 py-4">
        <Link href="/" className="inline-flex items-center justify-center" aria-label="Ir al inicio">
          <Image src="/logo.png" alt="Domun" width={38} height={38} className="object-contain" priority />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navSections.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <h3 className="mb-1 mt-4 px-2 text-[9px] font-semibold uppercase tracking-[0.08em] text-gray-400 font-[Poppins]">
                {section.label}
              </h3>
            )}

            {section.items.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              const hasSubmenu = Boolean(item.submenu?.length)
              const isExpanded = expandedMenus.includes(item.href)

              const toggleMenu = (e: React.MouseEvent) => {
                e.preventDefault()
                e.stopPropagation()
                setExpandedMenus((prev) =>
                  prev.includes(item.href) ? prev.filter((id) => id !== item.href) : [...prev, item.href]
                )
              }

              return (
                <div key={item.href} className="mb-0.5">
                  <div className={`group flex items-center justify-between rounded-lg transition-colors duration-150 ${active ? 'bg-[rgba(155,15,6,0.08)]' : 'hover:bg-gray-50'}`}>
                    <Link
                      href={item.href}
                      className={`flex flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] transition-colors font-[Poppins] ${
                        collapsed ? 'justify-center' : ''
                      } ${active ? 'font-medium text-[#9B0F06]' : 'font-normal text-gray-600'}`}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon size={15} color={active ? '#9B0F06' : '#6B7280'} strokeWidth={1.9} className="flex-shrink-0" />
                      {!collapsed && <span className="whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>}
                    </Link>

                    {hasSubmenu && !collapsed && (
                      <button
                        onClick={toggleMenu}
                        className={`mr-1 flex h-6 w-6 items-center justify-center rounded text-gray-400 transition-colors hover:bg-[rgba(0,0,0,0.06)] hover:text-gray-700`}
                        aria-label={`${isExpanded ? 'Colapsar' : 'Expandir'} ${item.label}`}
                        aria-expanded={isExpanded}
                      >
                        <ChevronDown size={13} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : '-rotate-90'}`} />
                      </button>
                    )}
                  </div>

                  {hasSubmenu && !collapsed && (
                    <div className={`grid transition-all duration-200 ease-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                      <div className="overflow-hidden">
                        <div className="ml-3.5 mt-1 space-y-1 pl-2 border-l border-gray-100">
                          {item.submenu!.map((subitem) => {
                            const subActive = isActive(subitem.href.split('?')[0])
                            return (
                              <Link
                                key={subitem.href}
                                href={subitem.href}
                                className={`flex items-center rounded-lg px-2 py-1.5 text-[10.5px] transition-colors font-[Poppins] ${
                                  subActive ? 'bg-[rgba(155,15,6,0.04)] font-medium text-[#9B0F06]' : 'text-gray-500 hover:text-gray-800'
                                }`}
                              >
                                <div className={`w-1 h-1 rounded-full mr-2 ${subActive ? 'bg-[#9B0F06]' : 'bg-gray-300'}`} />
                                <span>{subitem.label}</span>
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-gray-100 p-2.5">
        <button
          onClick={() => {
            window.location.href = '/login'
          }}
          className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#D53E0F] py-2.5 text-[11px] font-medium text-white transition-colors hover:bg-[#B53000]"
          title={collapsed ? 'Cerrar sesión' : undefined}
        >
          <LogOut size={13} />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  )
}
