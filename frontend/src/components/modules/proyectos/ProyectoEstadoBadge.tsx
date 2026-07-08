'use client'

import { EstadoProyecto } from '@/types/proyecto'

interface ProyectoEstadoBadgeProps {
  estado: EstadoProyecto
}

export default function ProyectoEstadoBadge({ estado }: ProyectoEstadoBadgeProps) {
  const estadoConfig = {
    borrador: {
      bg: 'bg-gray-100',
      text: 'text-gray-600',
      label: 'Borrador',
    },
    activo: {
      bg: 'bg-orange-100',
      text: 'text-[#D53E0F]',
      label: 'Activo',
    },
    en_revision: {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      label: 'En Revisión',
    },
    completado: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      label: 'Completado',
    },
    cancelado: {
      bg: 'bg-red-100',
      text: 'text-[#9B0F06]',
      label: 'Cancelado',
    },
  }

  const config = estadoConfig[estado]

  return (
    <span className={`${config.bg} ${config.text} text-[10px] font-semibold px-2 py-0.5 rounded-full`}>
      {config.label}
    </span>
  )
}
