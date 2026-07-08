'use client'

import { RolUsuario } from '@/types/usuario'

interface UsuarioRolBadgeProps {
  rol: RolUsuario
}

const rolConfig: Record<
  RolUsuario,
  { label: string; bg: string; text: string }
> = {
  Administrador: {
    label: 'Administrador',
    bg: 'bg-red-50',
    text: 'text-[#9B0F06]',
  },
  Supervisor: {
    label: 'Supervisor',
    bg: 'bg-blue-50',
    text: 'text-[#0066CC]',
  },
  Inspector: {
    label: 'Inspector',
    bg: 'bg-orange-50',
    text: 'text-[#D53E0F]',
  },
}

export function UsuarioRolBadge({ rol }: UsuarioRolBadgeProps) {
  const config = rolConfig[rol]

  return (
    <span className={`${config.bg} ${config.text} text-[9px] font-semibold px-2 py-0.5 rounded-md`}>
      {config.label}
    </span>
  )
}
