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
  Gerencia: {
    label: 'Gerencia',
    bg: 'bg-purple-50',
    text: 'text-[#7C3AED]',
  },
  IngenieroResidente: {
    label: 'Ingeniero Residente',
    bg: 'bg-blue-50',
    text: 'text-[#0066CC]',
  },
  Laboratorista: {
    label: 'Laboratorista',
    bg: 'bg-orange-50',
    text: 'text-[#D53E0F]',
  },
  AuxiliarDeCampo: {
    label: 'Auxiliar de Campo',
    bg: 'bg-emerald-50',
    text: 'text-[#059669]',
  },
  Contratante: {
    label: 'Contratante',
    bg: 'bg-indigo-50',
    text: 'text-[#4F46E5]',
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
