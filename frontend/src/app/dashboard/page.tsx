'use client'

import Link from 'next/link'
import {
  FolderOpen,
  ClipboardList,
  Camera,
  BarChart2,
  ChevronRight,
  Users,
  Settings2,
} from 'lucide-react'
import { tienePermiso, RUTAS_PERMISOS } from '@/lib/rutas-permisos'
import { useAuthStore } from '@/stores/useAuthStore'
import { useMemo } from 'react'

export default function DashboardPage() {

  const { profile } = useAuthStore()

  const modules = useMemo(() => {
    const rawModules = [
      {
        name: 'Proyectos',
        icon: FolderOpen,
        bgColor: 'bg-gradient-to-br from-[#B91C1C] to-[#E57373]',
        href: '/dashboard/proyectos',
        description: 'Gestión y control integral de obras viales',
      },
      {
        name: 'Bitácora',
        icon: ClipboardList,
        bgColor: 'bg-gradient-to-br from-[#E2542F] to-[#E87070]',
        href: '/dashboard/bitacora',
        description: 'Registro diario de avances de campo y eventos',
      },
      {
        name: 'Fotografías',
        icon: Camera,
        bgColor: 'bg-gradient-to-br from-[#E86B2A] to-[#F4A460]',
        href: '/dashboard/fotografias',
        description: 'Galería técnica y evidencia fotográfica',
      },
      {
        name: 'Reportes',
        icon: BarChart2,
        bgColor: 'bg-gradient-to-br from-[#E26B00] to-[#E8A000]',
        href: '/dashboard/reportes',
        description: 'Dashboard ejecutivo, alertas y analíticas',
      },
      {
        name: 'Usuarios',
        icon: Users,
        bgColor: 'bg-gradient-to-br from-[#6b7280] to-[#9ca3af]',
        href: '/dashboard/usuarios',
        description: 'Gestión de accesos y roles del sistema',
      },
      {
        name: 'Configuración',
        icon: Settings2,
        bgColor: 'bg-gradient-to-br from-[#4b5563] to-[#6b7280]',
        href: '/dashboard/configuracion',
        description: 'Ajustes globales y catálogos maestros',
      },
    ]

    const permisos = profile?.permisos || []
    
    return rawModules.filter(mod => {
      const permisoRequerido = RUTAS_PERMISOS[mod.href]
      if (!permisoRequerido) return true
      return tienePermiso(permisos, permisoRequerido)
    })
  }, [profile?.permisos])

  return (
    <div className="space-y-4 p-2 md:p-3">
      <style>{`
        .dashboard-module-card {
          transition: transform 0.28s ease, box-shadow 0.28s ease, filter 0.28s ease;
        }
        .dashboard-module-card:hover {
          transform: translateY(-4px) scale(1.01);
          box-shadow: 0 16px 32px rgba(155, 15, 6, 0.18);
          filter: saturate(1.02);
        }
        .dashboard-module-card:hover .dashboard-module-icon {
          transform: scale(1.08) rotate(-4deg);
          opacity: 0.28;
        }
        .dashboard-module-card:hover .dashboard-module-link {
          transform: translateX(3px);
          opacity: 1;
        }
      `}</style>

      <div className="mb-2">
        <h1 className="text-[24px] font-bold tracking-tight text-gray-900">Panel Principal</h1>
        <p className="mt-1 text-[11px] text-gray-500">Acceso rápido y estado general del sistema DomunNet</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => {
          const Icon = module.icon

          return (
            <Link
              key={module.name}
              href={module.href}
              className={`${module.bgColor} dashboard-module-card relative flex min-h-[164px] flex-col justify-between overflow-hidden rounded-[20px] p-5 text-white`}
            >
              <div className="dashboard-module-icon absolute -bottom-2 -right-2 opacity-20 transition-transform duration-300">
                <Icon size={104} color="white" />
              </div>

              <div className="relative z-10 flex items-center justify-between">
                <Icon size={24} color="white" className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" />
                <div className="dashboard-module-link flex items-center gap-1 text-[11px] font-bold tracking-wide opacity-90 transition-all duration-200">
                  <span>Ir a módulo</span>
                  <ChevronRight size={12} className="opacity-80" />
                </div>
              </div>

              <div className="relative z-10">
                <h3 className="text-[20px] font-bold leading-tight">{module.name}</h3>
                <p className="mt-1 text-[13px] leading-snug text-white/90">{module.description}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
