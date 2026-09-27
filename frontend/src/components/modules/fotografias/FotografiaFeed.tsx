'use client'

import React, { memo, useState } from 'react'
import {
  FolderOpen,
  ClipboardList,
  MapPin,
  ChevronRight,
  Image as ImageIcon,
} from 'lucide-react'
import { Fotografia } from '@/types/fotografia'
import { FotografiaTipoBadge } from './FotografiaTipoBadge'

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

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex gap-3 cursor-pointer hover:shadow-md transition-all focus:outline-none"
      onClick={onClick}
    >
      {/* Imagen */}
      <div className="w-24 h-20 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
        {!imgError && foto.urlMiniatura ? (
          <img
            src={foto.urlMiniatura}
            alt={foto.titulo || 'Fotografía'}
            loading="lazy"
            decoding="async"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <ImageIcon size={20} className="text-gray-300" />
        )}
      </div>

      {/* Centro */}
      <div className="flex-1 min-w-0">
        {/* Tipo y etiquetas */}
        <div className="flex items-center gap-1.5 flex-wrap mb-1">
          <FotografiaTipoBadge tipo={foto.tipo} />
          {(foto.etiquetas ?? []).map((tag) => (
            <span
              key={tag}
              className="bg-gray-100 text-gray-500 text-[9px] px-1.5 py-0.5 rounded-full whitespace-nowrap"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Título */}
        <h3 className="text-xs font-semibold text-gray-800 line-clamp-1">
          {foto.titulo}
        </h3>

        {/* Descripción */}
        <p className="text-[10px] text-gray-400 line-clamp-2 mt-0.5">
          {foto.descripcion}
        </p>

        {/* Metadata */}
        <div className="flex items-center gap-3 mt-2 text-[9px] text-gray-400 flex-wrap">
          <div className="flex items-center gap-1 min-w-0">
            <FolderOpen size={11} className="shrink-0" />
            <span className="truncate">{foto.proyectoNombre}</span>
          </div>
          <div className="flex items-center gap-1 min-w-0">
            <ClipboardList size={11} className="shrink-0" />
            <span className="truncate">{foto.bitacoraTitulo}</span>
          </div>
          <div className="flex items-center gap-1 min-w-0">
            <MapPin size={11} className="shrink-0" />
            <span className="truncate">{foto.ubicacionObra}</span>
          </div>
        </div>
      </div>

      {/* Derecha */}
      <div className="flex flex-col items-end justify-between shrink-0">
        <div className="text-right">
          <p className="text-[9px] text-gray-400">{foto.fecha}</p>
          <p className="text-[10px] font-medium text-gray-600">{foto.hora}</p>
          <p className="text-[9px] text-gray-400 mt-1">{foto.autor}</p>
        </div>
        <ChevronRight size={12} className="text-gray-400" />
      </div>
    </div>
  )
})

export const FotografiaFeed = memo(function FotografiaFeed({
  fotos,
  onFotoClick,
}: FotografiaFeedProps) {
  return (
    <div className="flex flex-col gap-3">
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

