'use client'

import { EstadoReporte } from '@/types/reporte'

interface ReporteEstadoBadgeProps {
  estado: EstadoReporte
}

const estadoConfig: Record<
  EstadoReporte,
  { label: string; bg: string; text: string }
> = {
  generando: {
    label: 'Generando...',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
  },
  completado: {
    label: 'Completado',
    bg: 'bg-green-100',
    text: 'text-green-700',
  },
  error: {
    label: 'Error',
    bg: 'bg-red-100',
    text: 'text-[#9B0F06]',
  },
}

export function ReporteEstadoBadge({ estado }: ReporteEstadoBadgeProps) {
  const config = estadoConfig[estado]

  return (
    <span
      className={`${config.bg} ${config.text} text-[9px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap`}
    >
      {config.label}
    </span>
  )
}
