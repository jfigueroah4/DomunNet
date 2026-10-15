'use client'

import { TipoFotografia } from '@/types/fotografia'

interface FotografiaTipoBadgeProps {
  tipo?: TipoFotografia | string
}

const tipoConfig: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  avance: {
    label: 'Avance',
    bg: 'bg-[#9B0F06]/10',
    text: 'text-[#9B0F06]',
  },
  campo: {
    label: 'Campo',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
  },
  laboratorio: {
    label: 'Laboratorio',
    bg: 'bg-indigo-100',
    text: 'text-indigo-700',
  },
  actividad: {
    label: 'Actividad',
    bg: 'bg-amber-100',
    text: 'text-amber-800',
  },
  evidencia: {
    label: 'Evidencia',
    bg: 'bg-teal-100',
    text: 'text-teal-700',
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
  const clave = (tipo ? String(tipo).toLowerCase().trim() : 'general')
  const config =
    tipoConfig[clave] ||
    tipoConfig['general'] || {
      label: tipo ? String(tipo).charAt(0).toUpperCase() + String(tipo).slice(1) : 'General',
      bg: 'bg-gray-100',
      text: 'text-gray-600',
    }

  return (
    <span
      className={`${config.bg || 'bg-gray-100'} ${config.text || 'text-gray-600'} text-[9px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap`}
    >
      {config.label || 'General'}
    </span>
  )
}

