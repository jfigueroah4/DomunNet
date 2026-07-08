'use client'

import { EstadoRegistro, TipoRegistro } from '@/types/bitacora'
import {
  Activity,
  AlertTriangle,
  Users,
  Eye,
  MessageSquare,
  Package,
} from 'lucide-react'

interface BitacoraEstadoBadgeProps {
  estado: EstadoRegistro
}

interface BitacoraTipoBadgeProps {
  tipo: TipoRegistro
}

export function BitacoraEstadoBadge({ estado }: BitacoraEstadoBadgeProps) {
  const config = {
    pendiente: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pendiente' },
    en_proceso: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'En Proceso' },
    resuelto: { bg: 'bg-green-100', text: 'text-green-700', label: 'Resuelto' },
    cerrado: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Cerrado' },
  }

  const { bg, text, label } = config[estado]

  return (
    <span className={`${bg} ${text} text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block`}>
      {label}
    </span>
  )
}

export function BitacoraTipoBadge({ tipo }: BitacoraTipoBadgeProps) {
  const config = {
    actividad: { icon: Activity, color: 'text-[#9B0F06]', label: 'Actividad' },
    incidente: { icon: AlertTriangle, color: 'text-red-600', label: 'Incidente' },
    visita: { icon: Users, color: 'text-blue-500', label: 'Visita' },
    inspeccion: { icon: Eye, color: 'text-purple-500', label: 'Inspección' },
    observacion: { icon: MessageSquare, color: 'text-amber-600', label: 'Observación' },
    material: { icon: Package, color: 'text-green-600', label: 'Material' },
  }

  const { color, label } = config[tipo]

  return (
    <span className={`${color} text-[9px] bg-gray-100 px-1.5 py-0.5 rounded-full inline-block`}>
      {label}
    </span>
  )
}
