'use client'

import { EstadoBitacora } from '@/types/bitacora'

interface BitacoraEstadoBadgeProps {
  estado: EstadoBitacora
}

export function BitacoraEstadoBadge({ estado }: BitacoraEstadoBadgeProps) {
  const estadoConfig: Record<
    EstadoBitacora,
    { bg: string; text: string; label: string; border: string }
  > = {
    borrador: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200', label: 'Borrador' },
    en_revision: { bg: 'bg-blue-100/80', text: 'text-blue-800', border: 'border-blue-200', label: 'En Revisión' },
    aprobado: { bg: 'bg-[#059669]/10', text: 'text-[#059669]', border: 'border-[#059669]/20', label: 'Aprobado' },
    publicado: { bg: 'bg-purple-100/80', text: 'text-purple-800', border: 'border-purple-200', label: 'Publicado' },
  }

  const config = estadoConfig[estado] || estadoConfig['borrador']

  return (
    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${config.bg} ${config.text} ${config.border}`}>
      {config.label}
    </span>
  )
}

export function BitacoraTipoBadge({ tipo }: { tipo: string }) { return <span className="badge">{tipo}</span> }

