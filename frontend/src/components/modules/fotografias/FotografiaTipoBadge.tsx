'use client'

import { TipoFotografia } from '@/types/fotografia'

interface FotografiaTipoBadgeProps {
  tipo: TipoFotografia
}

const tipoConfig: Record<
  TipoFotografia,
  { label: string; bg: string; text: string }
> = {
  avance: {
    label: 'Avance',
    bg: 'bg-[#9B0F06]/10',
    text: 'text-[#9B0F06]',
  },
  incidente: {
    label: 'Incidente',
    bg: 'bg-red-100',
    text: 'text-red-600',
  },
  material: {
    label: 'Material',
    bg: 'bg-green-100',
    text: 'text-green-700',
  },
  inspeccion: {
    label: 'Inspección',
    bg: 'bg-purple-100',
    text: 'text-purple-700',
  },
  antes_despues: {
    label: 'Antes/Después',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
  },
  general: {
    label: 'General',
    bg: 'bg-gray-100',
    text: 'text-gray-600',
  },
}

export function FotografiaTipoBadge({ tipo }: FotografiaTipoBadgeProps) {
  const config = tipoConfig[tipo]

  return (
    <span
      className={`${config.bg} ${config.text} text-[9px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap`}
    >
      {config.label}
    </span>
  )
}
