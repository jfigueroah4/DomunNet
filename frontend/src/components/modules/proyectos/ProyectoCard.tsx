'use client'

import Link from 'next/link'
import { MapPin, User, MoreVertical } from 'lucide-react'
import { Proyecto } from '@/types/proyecto'
import ProyectoEstadoBadge from './ProyectoEstadoBadge'

interface ProyectoCardProps {
  proyecto: Proyecto
}

export default function ProyectoCard({ proyecto }: ProyectoCardProps) {
  const getInitials = (nombre: string) =>
    nombre
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

  const equipoMostrado = proyecto.equipo.slice(0, 3)
  const equipoExcedente = Math.max(0, proyecto.equipo.length - 3)

  return (
    <Link href={`/proyectos/${proyecto.id}`}>
      <div className="cursor-pointer rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition-all duration-300 ease-out hover:shadow-md hover:-translate-y-0.5">
        <div className="mb-2 flex items-center justify-between">
          <ProyectoEstadoBadge estado={proyecto.estado} />
          <MoreVertical size={13} className="text-gray-300" />
        </div>

        <h3 className="mb-1 mt-2 line-clamp-2 text-[11px] font-semibold text-gray-800">
          {proyecto.nombre}
        </h3>

        <div className="mb-2 flex items-center gap-1">
          <MapPin size={11} className="flex-shrink-0 text-gray-400" />
          <span className="text-[9px] text-gray-400">{proyecto.ubicacion}</span>
        </div>

        <div className="mb-3 flex items-center gap-1">
          <User size={11} className="flex-shrink-0 text-gray-400" />
          <span className="text-[9px] text-gray-400">{proyecto.responsable}</span>
        </div>

        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[8px] text-gray-500">Avance</span>
            <span className="text-[8px] font-semibold text-gray-700">{Math.round(proyecto.avance)}%</span>
          </div>
          <div className="h-1 rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-[#9B0F06] transition-all"
              style={{ width: `${proyecto.avance}%` }}
            />
          </div>
        </div>

        <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-3">
          <span className="text-[9px] font-semibold text-gray-700">
            Q {Number(proyecto.presupuesto).toLocaleString('es-GT')}
          </span>
          <span className="text-[8px] text-gray-400">
            {proyecto.fechaInicio} al {proyecto.fechaFin}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {equipoMostrado.map((miembro) => (
            <div
              key={miembro.id}
              className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-white bg-red-50 text-[8px] font-semibold text-[#9B0F06]"
              title={miembro.nombre}
            >
              {getInitials(miembro.nombre)}
            </div>
          ))}

          {equipoExcedente > 0 && (
            <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-[8px] font-semibold text-gray-500">
              +{equipoExcedente}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
