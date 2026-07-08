'use client'

import { EstadoUsuario } from '@/types/usuario'

interface UsuarioEstadoBadgeProps {
  estado: EstadoUsuario
}

const estadoConfig: Record<
  EstadoUsuario,
  { label: string; dotColor: string; textColor: string }
> = {
  Activo: {
    label: 'Activo',
    dotColor: 'bg-green-500',
    textColor: 'text-green-600',
  },
  Inactivo: {
    label: 'Inactivo',
    dotColor: 'bg-gray-400',
    textColor: 'text-gray-500',
  },
  Suspendido: {
    label: 'Suspendido',
    dotColor: 'bg-red-500',
    textColor: 'text-red-600',
  },
}

export function UsuarioEstadoBadge({ estado }: UsuarioEstadoBadgeProps) {
  const config = estadoConfig[estado]

  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-semibold ${config.textColor}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dotColor}`} />
      {config.label}
    </span>
  )
}
