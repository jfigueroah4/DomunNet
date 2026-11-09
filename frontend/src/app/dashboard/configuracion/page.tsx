'use client'

import Link from 'next/link'
import {
  Database, RefreshCw, HardDrive, RotateCcw, ChevronRight
} from 'lucide-react'

const CONFIG_MODULES = [
  {
    key: 'tablas',
    name: 'Mantenimiento de Tablas',
    description: 'Catálogos del sistema y tablas maestras',
    icon: Database,
    bgColor: 'bg-gradient-to-br from-[#4b5563] to-[#6b7280]',
    href: '/dashboard/configuracion/mantenimiento-tablas',
  },
  {
    key: 'reinicio',
    name: 'Reinicio de Datos',
    description: 'Restablecer datos del sistema o por módulos',
    icon: RefreshCw,
    bgColor: 'bg-gradient-to-br from-[#374151] to-[#4b5563]',
    href: '/dashboard/configuracion/reinicio',
  },
  {
    key: 'backup',
    name: 'Backup',
    description: 'Generador y descarga de copias de seguridad',
    icon: HardDrive,
    bgColor: 'bg-gradient-to-br from-[#B91C1C] to-[#E57373]',
    href: '/dashboard/configuracion/backup',
  },
  {
    key: 'restauracion',
    name: 'Restauración',
    description: 'Restaura una copia de seguridad del sistema',
    icon: RotateCcw,
    bgColor: 'bg-gradient-to-br from-[#E86B2A] to-[#F4A460]',
    href: '/dashboard/configuracion/restauracion',
  },
]

export default function ConfiguracionPage() {
  return (
    <div className="space-y-4 sm:space-y-5 p-2 sm:p-3 md:p-4 max-w-[1400px] mx-auto font-[Poppins]">
      <style>{`
        .config-module-card {
          transition: transform 0.28s ease, box-shadow 0.28s ease, filter 0.28s ease;
        }
        .config-module-card:hover {
          transform: translateY(-4px) scale(1.01);
          box-shadow: 0 16px 32px rgba(155, 15, 6, 0.18);
          filter: saturate(1.02);
        }
        .config-module-icon {
          opacity: 0.20;
          transition: transform 0.28s ease, opacity 0.28s ease;
        }
        .config-module-card:hover .config-module-icon {
          transform: scale(1.08) rotate(-4deg);
          opacity: 0.28;
        }
        .config-module-link {
          transition: transform 0.28s ease, opacity 0.28s ease;
        }
        .config-module-card:hover .config-module-link {
          transform: translateX(3px);
          opacity: 1;
        }
      `}</style>

      <div className="mb-2">
        <h1 className="text-xl sm:text-2xl md:text-[26px] font-bold tracking-tight text-gray-900">Configuración</h1>
        <p className="mt-1 text-xs sm:text-[13px] text-gray-500">Preferencias, catálogos y mantenimiento del sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 md:gap-5">
        {CONFIG_MODULES.map((module) => {
          const Icon = module.icon

          return (
            <Link
              key={module.key}
              href={module.href}
              prefetch={true}
              className={`${module.bgColor} config-module-card relative flex min-h-[155px] sm:min-h-[175px] md:min-h-[185px] flex-col justify-between overflow-hidden rounded-[22px] p-5 sm:p-6 md:p-7 text-white shadow-xs`}
            >
              <div className="config-module-icon absolute -bottom-3 -right-3 opacity-20 pointer-events-none">
                <Icon size={120} color="white" className="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] md:w-[135px] md:h-[135px]" />
              </div>

              <div className="relative z-10 flex items-center justify-between">
                <div className="p-2 sm:p-2.5 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center">
                  <Icon size={24} color="white" className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" />
                </div>
                <div className="config-module-link flex items-center gap-1 text-[11px] sm:text-xs font-bold tracking-wide opacity-90">
                  <span>Ir a la sección</span>
                  <ChevronRight size={13} className="opacity-80" />
                </div>
              </div>

              <div className="relative z-10 mt-3 sm:mt-4">
                <h3 className="text-[19px] sm:text-[21px] md:text-[22px] font-bold leading-tight tracking-tight">{module.name}</h3>
                <p className="mt-1 sm:mt-1.5 text-[12px] sm:text-[13px] md:text-[14px] leading-snug text-white/90 font-normal">{module.description}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
