'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  FolderOpen,
  ClipboardList,
  Camera,
  BarChart2,
  ChevronRight,
  TrendingUp,
  FileText,
  Users,
  Settings2,
  Search,
  Filter,
  MessageCircle,
} from 'lucide-react'

export default function DashboardPage() {
  const [chatHovered, setChatHovered] = useState(false)

  const modules = [
    {
      name: 'Proyectos',
      icon: FolderOpen,
      bgColor: 'bg-gradient-to-br from-[#9B0F06] to-[#E57373]',
      href: '/proyectos',
    },
    {
      name: 'Bitácora',
      icon: ClipboardList,
      bgColor: 'bg-gradient-to-br from-[#D53E0F] to-[#e87070]',
      href: '/bitacora',
    },
    {
      name: 'Fotografías',
      icon: Camera,
      bgColor: 'bg-gradient-to-br from-[#D53E0F] to-[#f4a460]',
      href: '/fotografias',
    },
    {
      name: 'Reportes',
      icon: BarChart2,
      bgColor: 'bg-gradient-to-br from-[#D53E0F] to-[#E8A000]',
      href: '/reportes',
    },
    {
      name: 'Usuarios',
      icon: Users,
      bgColor: 'bg-gradient-to-br from-[#e87070] to-[#EED9B9]',
      textColor: 'text-white',
      href: '/usuarios',
    },
    {
      name: 'Configuración',
      icon: Settings2,
      bgColor: 'bg-stone-500',
      href: '/configuracion',
    },
  ]

  const stats = [
    {
      label: 'PROYECTOS ACTIVOS',
      value: 0,
      icon: TrendingUp,
      borderColor: 'border-[#9B0F06]',
      iconColor: '#9B0F06',
    },
    {
      label: 'REGISTROS HOY',
      value: 0,
      icon: ClipboardList,
      borderColor: 'border-[#E85D04]',
      iconColor: '#E85D04',
    },
    {
      label: 'FOTOS SUBIDAS',
      value: 0,
      icon: Camera,
      borderColor: 'border-amber-600',
      iconColor: '#b45309',
    },
    {
      label: 'REPORTES GEN.',
      value: 0,
      icon: FileText,
      borderColor: 'border-stone-500',
      iconColor: '#78716c',
    },
  ]

  return (
    <div className="space-y-3 p-3">
      {/* Page Header */}
      <div className="mb-2">
        <h1 className="text-base font-bold text-gray-800">Panel Principal</h1>
        <p className="text-[10px] text-gray-400 mt-1">Acceso rápido y estado general del sistema</p>
      </div>

      {/* Section A - Module Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {modules.map((module: any) => {
          const Icon = module.icon
          const textColorClass = module.textColor || 'text-white'
          return (
            <Link
              key={module.name}
              href={module.href}
              className={`${module.bgColor} min-h-[100px] rounded-2xl p-3 cursor-pointer transition-all duration-300 ease-out hover:brightness-95 hover:scale-[1.02] relative overflow-hidden flex flex-col justify-between group`}
            >
              {/* Decorative background icon */}
              <div className="absolute bottom-0 right-0 opacity-20">
                <Icon size={70} color={module.textColor === 'text-white' ? 'white' : '#5E0006'} />
              </div>

              {/* Content */}
              <div className="relative z-10 flex-1 flex flex-col justify-end">
                <div className={`flex items-center gap-1 ${textColorClass}`}>
                  <h3 className="text-xs font-bold">{module.name}</h3>
                  <ChevronRight size={12} className="opacity-80" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Section B - Metrics Cards */}
      <div className="grid grid-cols-4 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className={`bg-white rounded-xl shadow-sm p-2.5 border-l-[3px] ${stat.borderColor}`}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-[9px] text-gray-400 uppercase tracking-widest font-semibold">
                  {stat.label}
                </h4>
                <Icon size={12} color={stat.iconColor} className="opacity-60" />
              </div>

              <p className="text-xl font-bold text-gray-800 mb-1">{stat.value}</p>

              <div className="flex items-center gap-1">
                <TrendingUp size={12} className="text-green-500" />
                <span className="text-[9px] text-green-500">+0% vs ayer</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Section C - Bottom Row */}
      <div className="grid grid-cols-3 gap-3">
        {/* Recent Activity - 2/3 width */}
        <div className="col-span-2 bg-white rounded-2xl shadow-sm p-4 max-h-[220px]">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xs font-semibold text-gray-800">Actividad Reciente</h2>
              <p className="text-[9px] text-gray-400 mt-1">Últimos registros del sistema</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-gray-100 rounded-full px-3 py-1">
                <Search size={14} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar registros..."
                  className="bg-transparent outline-none text-[9px] ml-2 w-32 placeholder-gray-400"
                />
              </div>
              <button className="flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-[9px] hover:bg-gray-200 transition-colors">
                <Filter size={12} />
                <span>Filtrar</span>
              </button>
            </div>
          </div>

          {/* Empty State */}
          <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-red-50 rounded-full p-3 mb-3">
              <ClipboardList size={20} className="text-[#9B0F06]" />
            </div>
            <p className="text-xs font-medium text-gray-600">No hay registros recientes</p>
            <p className="text-[9px] text-gray-400 mt-1">Los registros de bitácora aparecerán aquí</p>
          </div>
        </div>

        {/* Active Projects - 1/3 width */}
        <div className="bg-white rounded-2xl shadow-sm p-4 max-h-[220px] overflow-auto">
          <div>
            <h2 className="text-xs font-semibold text-gray-800">Proyectos Más Activos</h2>
            <p className="text-[9px] text-gray-400 mt-1">Por actividad reciente</p>
          </div>

          {/* Empty State */}
          <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-red-50 rounded-full p-3 mb-3">
              <FolderOpen size={20} className="text-[#9B0F06]" />
            </div>
            <p className="text-xs font-medium text-gray-600">No hay proyectos recientes</p>
            <p className="text-[9px] text-gray-400 mt-1">Los proyectos activos aparecerán aquí</p>
          </div>
        </div>
      </div>

      {/* Section D - Floating Chatbot Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Notification Badge */}
        <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-white text-[8px] font-bold">
          1
        </div>

        {/* Tooltip */}
        {chatHovered && (
          <div className="absolute bottom-14 right-0 bg-gray-800 text-white text-[8px] rounded-lg px-3 py-1 whitespace-nowrap mb-2">
            Asistente IA
          </div>
        )}

        {/* Button */}
        <button
          onMouseEnter={() => setChatHovered(true)}
          onMouseLeave={() => setChatHovered(false)}
          className="w-11 h-11 bg-[#E85D04] rounded-full flex items-center justify-center shadow-lg hover:bg-[#C94E03] transition-all duration-200 hover:scale-110"
        >
          <MessageCircle size={18} className="text-white" />
        </button>
      </div>
    </div>
  )
}
