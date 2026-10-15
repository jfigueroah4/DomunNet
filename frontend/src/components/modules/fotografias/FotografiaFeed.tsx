'use client'

import React, { memo, useState } from 'react'
import {
  FolderOpen,
  MapPin,
  ChevronRight,
  Image as ImageIcon,
} from 'lucide-react'
import { Fotografia } from '@/types/fotografia'

interface FotografiaFeedProps {
  fotos: Fotografia[]
  onFotoClick: (foto: Fotografia) => void
}

const FotografiaFeedItem = memo(function FotografiaFeedItem({
  foto,
  onClick,
}: {
  foto: Fotografia
  onClick: () => void
}) {
  const [imgError, setImgError] = useState(false)

  const renglonTexto =
    (foto as any).renglonNombre ||
    (foto as any).renglon_nombre ||
    (foto as any).renglon ||
    (foto.etiquetas && foto.etiquetas.find((e: string) => e !== 'Campo' && e !== 'Bitácora' && e !== 'Avance Físico')) ||
    (foto.tipo ? (foto.tipo.charAt(0).toUpperCase() + foto.tipo.slice(1)) : 'Renglón de Obra')

  return (
    <div
      className="bg-white rounded-xl shadow-2xs border border-gray-200/90 p-2 px-3 flex items-center gap-3 cursor-pointer hover:shadow-xs hover:border-gray-300 transition-all focus:outline-none"
      onClick={onClick}
    >
      {/* Imagen compacta */}
      <div className="w-16 h-12 sm:w-20 sm:h-14 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
        {!imgError && (foto.urlMiniatura || foto.url) ? (
          <img
            src={foto.urlMiniatura || foto.url}
            alt={foto.titulo || 'Fotografía'}
            loading="lazy"
            decoding="async"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <ImageIcon size={18} className="text-gray-300" />
        )}
      </div>

      {/* Centro */}
      <div className="flex-1 min-w-0 space-y-0.5">
        {/* Renglón y Etiquetas sin fondos pesados */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[9px] font-bold text-gray-900 truncate max-w-[200px] sm:max-w-[320px]">
            {renglonTexto}
          </span>
          {foto.tipo && foto.tipo !== 'general' && (
            <span className="text-[8.5px] font-semibold text-gray-400 capitalize">
              • {foto.tipo}
            </span>
          )}
        </div>

        {/* Título */}
        <h3 className="text-[11px] font-bold text-gray-800 truncate">
          {foto.titulo || renglonTexto}
        </h3>

        {/* Descripción */}
        <p className="text-[9.5px] text-gray-500 truncate">
          {foto.descripcion || 'Sin descripción adicional'}
        </p>

        {/* Metadata */}
        <div className="flex items-center gap-3 text-[8.5px] text-gray-400 flex-wrap pt-0.5">
          <div className="flex items-center gap-1 min-w-0">
            <FolderOpen size={10} className="shrink-0 text-[#9B0F06]" />
            <span className="truncate max-w-[150px]">{foto.proyectoNombre}</span>
          </div>
          <div className="flex items-center gap-1 min-w-0">
            <MapPin size={10} className="shrink-0" />
            <span className="truncate max-w-[180px]">{foto.ubicacionObra}</span>
          </div>
        </div>
      </div>

      {/* Derecha */}
      <div className="flex flex-col items-end justify-between shrink-0 pl-2">
        <div className="text-right">
          <p className="text-[9px] font-mono text-gray-400">{foto.fecha}</p>
          <p className="text-[9px] font-semibold text-gray-600 truncate max-w-[90px]">{foto.autor}</p>
        </div>
        <ChevronRight size={13} className="text-gray-300 mt-1" />
      </div>
    </div>
  )
})

export const FotografiaFeed = memo(function FotografiaFeed({
  fotos,
  onFotoClick,
}: FotografiaFeedProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {(fotos ?? []).map((foto, index) => (
        <FotografiaFeedItem
          key={foto.id || index}
          foto={foto}
          onClick={() => onFotoClick(foto)}
        />
      ))}
    </div>
  )
})

