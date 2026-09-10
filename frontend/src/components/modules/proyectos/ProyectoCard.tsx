'use client'

import Link from 'next/link'
import { MapPin, User, MoreVertical, Calendar, Building2, ChevronRight } from 'lucide-react'
import { Proyecto } from '@/types/proyecto'
import ProyectoEstadoBadge from './ProyectoEstadoBadge'

interface ProyectoCardProps {
  proyecto: Proyecto
  modoSeleccion?: boolean
  isSelected?: boolean
  onToggleSelect?: () => void
}

export default function ProyectoCard({
  proyecto,
  modoSeleccion = false,
  isSelected = false,
  onToggleSelect,
}: ProyectoCardProps) {
  const getInitials = (nombre: string) =>
    (nombre || 'U')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

  const equipoMostrado = (proyecto.equipo || []).slice(0, 3)
  const equipoExcedente = Math.max(0, (proyecto.equipo || []).length - 3)

  const depMuniTexto = proyecto.departamentoNombre && proyecto.municipioNombre
    ? `${proyecto.departamentoNombre}, ${proyecto.municipioNombre}`
    : proyecto.departamentoNombre || proyecto.municipioNombre || null

  const content = (
    <div
      onClick={(e) => {
        if (modoSeleccion) {
          e.preventDefault()
          e.stopPropagation()
          onToggleSelect?.()
        }
      }}
      className={`group relative flex flex-col justify-between rounded-2xl border bg-white p-4 shadow-2xs transition-all duration-300 ease-out hover:shadow-md hover:-translate-y-0.5 font-[Poppins] ${
        isSelected ? 'border-gray-400 bg-gray-100/70 ring-1 ring-gray-300' : 'border-gray-200 hover:border-red-200'
      }`}
    >
      <div>
        {/* Header Badges */}
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {modoSeleccion && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation()
                  onToggleSelect?.()
                }}
                className="h-4 w-4 rounded border-gray-300 text-[#9B0F06] focus:ring-[#9B0F06] cursor-pointer"
              />
            )}
            <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[9px] font-bold text-gray-700 border border-gray-200">
              {proyecto.codigo || 'PROY'}
            </span>
            <ProyectoEstadoBadge estado={proyecto.estado} />
          </div>
          <MoreVertical size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
        </div>

        {/* Título & Descripción */}
        <h3 className="mb-1 text-xs font-black text-gray-900 leading-tight group-hover:text-[#9B0F06] transition-colors line-clamp-1">
          {proyecto.nombre}
        </h3>

        {proyecto.descripcion && (
          <p className="mb-2.5 line-clamp-2 text-[10px] text-gray-500 font-normal leading-relaxed">
            {proyecto.descripcion}
          </p>
        )}

        {/* Ubicación, Depto/Muni y Responsable */}
        <div className="mb-3 space-y-1.5 border-t border-gray-100 pt-2.5 text-[10.5px]">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-1.5 text-gray-600">
              <MapPin size={12} className="flex-shrink-0 mt-0.5 text-[#9B0F06]" />
              <span className="line-clamp-1 font-medium">{proyecto.ubicacion || 'Ubicación General'}</span>
            </div>
            {depMuniTexto && (
              <span className="shrink-0 rounded bg-red-50 px-1.5 py-0.5 text-[9px] font-bold text-[#9B0F06] border border-red-100">
                {depMuniTexto}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-gray-500">
            <div className="flex items-center gap-1.5">
              <User size={12} className="flex-shrink-0 text-gray-400" />
              <span className="font-medium">
                {proyecto.delegadoResidente || (proyecto.responsable && proyecto.responsable !== 'No asignado' ? proyecto.responsable : 'No asignado')}
              </span>
            </div>
            {proyecto.entidadContratante && (
              <div className="flex items-center gap-1 text-[9.5px] font-semibold text-gray-700 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                <Building2 size={10} className="text-gray-400" />
                <span className="truncate max-w-[100px]">{proyecto.entidadContratante}</span>
              </div>
            )}
          </div>
        </div>

        {/* Barra de Avance */}
        <div className="mb-3 rounded-lg bg-gray-50/80 p-2 border border-gray-100">
          <div className="mb-1 flex items-center justify-between text-[9.5px]">
            <span className="font-bold uppercase tracking-wider text-gray-400">Avance de Obra</span>
            <span className="font-black text-[#9B0F06]">{Math.round(proyecto.avance || 0)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-200/70">
            <div
              className="h-full rounded-full bg-[#9B0F06] transition-all duration-500"
              style={{ width: `${proyecto.avance || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer Metrics */}
      <div className="border-t border-gray-100 pt-2.5">
        {/* Fechas de Ejecución */}
        <div className="mb-2.5 rounded-lg bg-gray-50 p-2 border border-gray-100 flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-1.5 text-gray-600 font-semibold">
            <Calendar size={12} className="text-[#9B0F06]" />
            <span>Fechas de Ejecución:</span>
          </div>
          <span className="font-bold text-gray-900 font-mono text-[9.5px]">
            {proyecto.fechaInicio && proyecto.fechaFin
              ? `${proyecto.fechaInicio} — ${proyecto.fechaFin}`
              : proyecto.fechaInicio
              ? `Desde ${proyecto.fechaInicio}`
              : 'Por definir'}
          </span>
        </div>

        <div className="mb-2.5 flex items-center justify-between text-[10px]">
          <div>
            <span className="block text-[8px] font-bold uppercase tracking-wider text-gray-400">Monto Contractual</span>
            <span className="font-black text-gray-900">
              Q {Number(proyecto.presupuesto || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
            </span>
          </div>
          {proyecto.departamentoNombre && (
            <div className="text-right">
              <span className="block text-[8px] font-bold uppercase tracking-wider text-gray-400">Ubicación Región</span>
              <span className="font-bold text-gray-700 text-[9.5px]">
                {proyecto.departamentoNombre}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {equipoMostrado.map((miembro) => (
              <div
                key={miembro.id}
                className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-white bg-red-100 text-[8px] font-bold text-[#9B0F06]"
                title={`${miembro.nombre} (${miembro.rol})`}
              >
                {getInitials(miembro.nombre)}
              </div>
            ))}

            {equipoExcedente > 0 && (
              <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-white bg-gray-100 text-[8px] font-bold text-gray-600">
                +{equipoExcedente}
              </div>
            )}
          </div>

          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#9B0F06] group-hover:translate-x-0.5 transition-transform">
            Ver detalle <ChevronRight size={12} />
          </span>
        </div>
      </div>
    </div>
  )

  if (modoSeleccion) {
    return content
  }

  return <Link href={`/dashboard/proyectos/detalles?slug=${proyecto.id}`}>{content}</Link>
}
