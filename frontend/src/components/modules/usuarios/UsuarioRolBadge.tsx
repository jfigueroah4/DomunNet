'use client'

import { RolUsuario } from '@/types/usuario'

interface UsuarioRolBadgeProps {
  rol: RolUsuario
}

const rolLabels: Record<RolUsuario, string> = {
  Administrador: 'Administrador',
  Gerencia: 'Gerencia',
  IngenieroResidente: 'Ingeniero Residente',
  Laboratorista: 'Laboratorista',
  AuxiliarDeCampo: 'Auxiliar de Campo',
  Contratante: 'Contratante',
}

export function UsuarioRolBadge({ rol }: UsuarioRolBadgeProps) {
  const label = rolLabels[rol] || rol

  return (
    <span className="text-gray-600 font-medium">
      {label}
    </span>
  )
}
