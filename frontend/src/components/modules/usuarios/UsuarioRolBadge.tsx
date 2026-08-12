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
    bg: 'bg-[#FEF2F2]',
    text: 'text-[#9B0F06]',
  },
  Gerencia: {
    label: 'Gerencia',
    bg: 'bg-[#ECFDF5]',
    text: 'text-[#065F46]',
  },
  IngenieroResidente: {
    label: 'Ingeniero Residente',
    bg: 'bg-[#EFF6FF]',
    text: 'text-[#1E40AF]',
  },
  Laboratorista: {
    label: 'Laboratorista',
    bg: 'bg-[#F3E8FF]',
    text: 'text-[#5B21B6]',
  },
  AuxiliarDeCampo: {
    label: 'Auxiliar de Campo',
    bg: 'bg-[#FEF3C7]',
    text: 'text-[#92400E]',
  },
  Contratante: {
    label: 'Contratante',
    bg: 'bg-[#F3F4F6]',
    text: 'text-[#374151]',
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
