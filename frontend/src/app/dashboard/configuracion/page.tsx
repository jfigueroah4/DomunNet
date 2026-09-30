'use client'

import Link from 'next/link'
import {
  Settings, Database, RefreshCw, HardDrive, RotateCcw, ChevronRight
} from 'lucide-react'

const CONFIG_MODULES = [
  {
    key: 'general',
    name: 'General',
    description: 'Configuración general del sistema',
    icon: Settings,
    bgColor: 'bg-gradient-to-br from-[#059669] to-[#34D399]',
    href: '/dashboard/configuracion/general',
  },
  {
    key: 'tablas',
    name: 'Mantenimiento de Tablas',
    description: 'Catálogos del sistema',
    icon: Database,
    bgColor: 'bg-gradient-to-br from-[#B45309] to-[#F59E0B]',
    href: '/dashboard/configuracion/mantenimiento-tablas',
  },
  {
    key: 'reinicio',
    name: 'Reinicio de Datos',
    description: 'Restablecer datos del sistema o por módulos',
    icon: RefreshCw,
    bgColor: 'bg-gradient-to-br from-[#9B0F06] to-[#DC2626]',
    href: '/dashboard/configuracion/reinicio',
  },
  {
    key: 'backup',
    name: 'Backup',
    description: 'Generador de copias de seguridad',
    icon: HardDrive,
    bgColor: 'bg-gradient-to-br from-[#2563EB] to-[#60A5FA]',
    href: '/dashboard/configuracion/backup',
  },
  {
    key: 'restauracion',
    name: 'Restauración',
    description: 'Restaura una copia de seguridad',
    icon: RotateCcw,
    bgColor: 'bg-gradient-to-br from-[#7C3AED] to-[#A78BFA]',
    href: '/dashboard/configuracion/restauracion',
  },
]

export default function ConfiguracionPage() {
  return (
    <div className="space-y-4 p-2 md:p-3 font-[Poppins]">
      <style>{`
        .config-module-card {
          transition: transform 0.28s ease, box-shadow 0.28s ease, filter 0.28s ease;
        }
        .config-module-card:hover {
          transform: translateY(-4px) scale(1.01);
          box-shadow: 0 16px 32px rgba(155, 15, 6, 0.18);
          filter: saturate(1.02);
        }
        .config-module-card:hover .config-module-icon {
          transform: scale(1.08) rotate(-4deg);
          opacity: 0.28;
        }
        .config-module-card:hover .config-module-link {
          transform: translateX(3px);
          opacity: 1;
        }
      `}</style>

      <div className="mb-2">
        <h1 className="text-[24px] font-bold tracking-tight text-gray-900">Configuración</h1>
        <p className="mt-1 text-[11px] text-gray-500">Preferencias y ajustes del sistema</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {CONFIG_MODULES.map((module) => {
          const Icon = module.icon

          return (
            <Link
              key={module.key}
              href={module.href}
              className={`${module.bgColor} config-module-card relative flex min-h-[164px] flex-col justify-between overflow-hidden rounded-[20px] p-5 text-white`}
            >
              <div className="config-module-icon absolute -bottom-2 -right-2 opacity-20 transition-transform duration-300">
                <Icon size={104} color="white" />
              </div>

              <div className="relative z-10 flex items-center justify-between">
                <Icon size={24} color="white" className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" />
                <div className="config-module-link flex items-center gap-1 text-[11px] font-bold tracking-wide opacity-90 transition-all duration-200">
                  <span>Ir a la sección</span>
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
