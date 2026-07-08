'use client'

import Link from 'next/link'
import { RegistroBitacora, TipoRegistro } from '@/types/bitacora'
import { BitacoraEstadoBadge, BitacoraTipoBadge } from './BitacoraEstadoBadge'
import { User, MapPin, Paperclip, FolderOpen, ChevronRight } from 'lucide-react'

interface BitacoraCardProps {
  registro: RegistroBitacora
}

const getTipoColor = (tipo: TipoRegistro): string => {
  const colors = {
    actividad: 'bg-[#9B0F06]',
    incidente: 'bg-red-500',
    visita: 'bg-blue-400',
    inspeccion: 'bg-purple-400',
    observacion: 'bg-amber-400',
    material: 'bg-green-400',
  }
  return colors[tipo]
}

export default function BitacoraCard({ registro }: BitacoraCardProps) {
  return (
    <Link href={`/bitacora/${registro.id}`}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 hover:shadow-md transition-all cursor-pointer flex items-start gap-3">
        {/* Indicador de tipo - barra vertical */}
        <div className={`w-1 self-stretch rounded-full ${getTipoColor(registro.tipo)}`}></div>

        {/* Contenido central */}
        <div className="flex-1 min-w-0">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <BitacoraTipoBadge tipo={registro.tipo} />
            <BitacoraEstadoBadge estado={registro.estado} />
            {registro.etiquetas.map((etiqueta) => (
              <span
                key={etiqueta}
                className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full"
              >
                {etiqueta}
              </span>
            ))}
          </div>

          {/* Título */}
          <h3 className="text-xs font-semibold text-gray-800 mt-1 line-clamp-1">{registro.titulo}</h3>

          {/* Meta info primera fila */}
          <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
            <div className="flex items-center gap-1">
              <FolderOpen size={11} className="flex-shrink-0" />
              <span className="truncate">{registro.proyectoNombre}</span>
            </div>
          </div>

          {/* Meta info segunda fila */}
          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400 flex-wrap">
            <div className="flex items-center gap-1">
              <User size={11} className="flex-shrink-0" />
              <span>{registro.autor}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin size={11} className="flex-shrink-0" />
              <span className="truncate">{registro.ubicacion}</span>
            </div>
            {registro.adjuntos.length > 0 && (
              <div className="flex items-center gap-1">
                <Paperclip size={11} className="flex-shrink-0" />
                <span>{registro.adjuntos.length}</span>
              </div>
            )}
          </div>
        </div>

        {/* Derecha - Fecha y hora */}
        <div className="flex flex-col items-end text-right flex-shrink-0">
          <p className="text-[10px] text-gray-400">{registro.fecha}</p>
          <p className="text-[10px] font-medium text-gray-600">{registro.hora}</p>
          <ChevronRight size={13} className="text-gray-300 mt-auto" />
        </div>
      </div>
    </Link>
  )
}
