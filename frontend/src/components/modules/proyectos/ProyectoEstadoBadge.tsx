'use client'

import { EstadoProyecto } from '@/types/proyecto'

interface ProyectoEstadoBadgeProps {
  estado: EstadoProyecto
}

export default function ProyectoEstadoBadge({ estado }: ProyectoEstadoBadgeProps) {
  const estadoConfig = {
    borrador: {
      bg: 'bg-gray-100 border border-gray-200',
      text: 'text-gray-700 font-bold',
      label: 'Borrador',
    },
    activo: {
      bg: 'bg-emerald-600 border border-emerald-700 shadow-2xs',
      text: 'text-white font-bold',
      label: 'Activo',
    },
    en_revision: {
      bg: 'bg-red-50 border border-red-200',
      text: 'text-[#9B0F06] font-bold',
      label: 'En Revisión',
    },
    completado: {
      bg: 'bg-slate-100 border border-slate-200',
      text: 'text-slate-700 font-bold',
      label: 'Completado',
    },
    pausado: {
      bg: 'bg-amber-50 border border-amber-200',
      text: 'text-amber-800 font-bold',
      label: 'Pausado',
    },
    modificacion: {
      bg: 'bg-amber-50 border border-amber-200',
      text: 'text-amber-800 font-bold',
      label: 'En Modificación',
    },
  }

  const config = estadoConfig[estado] || {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    label: String(estado || 'Borrador'),
  }

  return (
    <span className={`${config.bg} ${config.text} text-[10px] font-semibold px-2 py-0.5 rounded-full`}>
      {config.label}
    </span>
  )
}
