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
    pausado: {
      bg: 'bg-amber-100',
      text: 'text-amber-800',
      label: 'Pausado',
    },
    modificacion: {
      bg: 'bg-amber-100',
      text: 'text-amber-800',
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
