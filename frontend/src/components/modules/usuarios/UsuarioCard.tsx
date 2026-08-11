'use client'

import { RolUsuario } from '@/types/usuario'
import { Shield, CheckCircle, Eye } from 'lucide-react'
import { LucideIcon } from 'lucide-react'

interface UsuarioCardProps {
  rol: RolUsuario
  cantidad: number
}

const rolConfig: Record<
  RolUsuario,
  {
    label: string
    color: string
    icono: LucideIcon
  }
> = {
  Administrador: {
    label: 'Administradores',
    color: '#9B0F06',
    icono: Shield,
  },
  Gerencia: {
    label: 'Gerencia',
    color: '#7C3AED',
    icono: Shield,
  },
  IngenieroResidente: {
    label: 'Ingeniero Residente',
    color: '#0066CC',
    icono: CheckCircle,
  },
  Laboratorista: {
    label: 'Laboratorista',
    color: '#D53E0F',
    icono: Eye,
  },
  AuxiliarDeCampo: {
    label: 'Auxiliar de Campo',
    color: '#059669',
    icono: Shield,
  },
  Contratante: {
    label: 'Contratante',
    color: '#4F46E5',
    icono: CheckCircle,
  },
}

export function UsuarioCard({ rol, cantidad }: UsuarioCardProps) {
  const config = rolConfig[rol]
  const Icono = config.icono

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-1.5 mb-2 text-gray-400">
        <Icono size={12} style={{ color: config.color }} className="opacity-80" />
        <span className="text-[9px] font-medium tracking-wide text-gray-400 capitalize">
          {config.label}
        </span>
      </div>
      <p className="text-[24px] font-bold leading-none" style={{ color: config.color }}>
        {cantidad}
      </p>
    </div>
  )
}
