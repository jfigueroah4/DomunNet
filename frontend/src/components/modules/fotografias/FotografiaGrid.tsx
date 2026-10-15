'use client'

import React, { memo, useState } from 'react'
import { ZoomIn, FolderOpen, Image as ImageIcon } from 'lucide-react'
import { Fotografia } from '@/types/fotografia'

interface FotografiaGridProps {
  fotos: Fotografia[]
  onFotoClick: (foto: Fotografia, index: number) => void
  columnas?: 2 | 3 | 4
}

const FotografiaGridItem = memo(function FotografiaGridItem({
  foto,
  onClick,
  columnas = 2,
}: {
  foto: Fotografia
  onClick: () => void
  columnas?: 2 | 3 | 4
}) {
  const [imgError, setImgError] = useState(false)

  const renglonTexto =
    (foto as any).renglonNombre ||
    (foto as any).renglon_nombre ||
    (foto as any).renglon ||
    (foto.etiquetas && foto.etiquetas.find((e: string) => e !== 'Campo' && e !== 'Bitácora' && e !== 'Avance Físico')) ||
    (foto.tipo ? (foto.tipo.charAt(0).toUpperCase() + foto.tipo.slice(1)) : 'Renglón de Obra')

  const imgHeightClass =
    columnas === 4
      ? 'h-16 sm:h-20'
      : columnas === 3
        ? 'h-20 sm:h-26'
        : 'h-28 sm:h-32'

  return (
    <div
      className="relative group rounded-xl overflow-hidden cursor-pointer bg-white shadow-2xs border border-gray-200/90 hover:shadow-md hover:border-gray-300 transition-all focus:outline-none"
      onClick={onClick}
    >
      {/* Imagen compacta */}
      <div className={`w-full ${imgHeightClass} bg-slate-100 flex items-center justify-center overflow-hidden`}>
        {!imgError && (foto.urlMiniatura || foto.url) ? (
          <img
            src={foto.urlMiniatura || foto.url}
            alt={foto.titulo || 'Fotografía'}
            loading="lazy"
            decoding="async"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-300 gap-1 p-2">
            <ImageIcon size={columnas === 4 ? 16 : 22} />
          </div>
        )}
      </div>

      {/* Overlay al hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col items-center justify-center pointer-events-none p-1.5">
        <ZoomIn size={columnas === 4 ? 14 : 18} className="text-white mb-0.5" />
        <p className="text-white text-[8px] sm:text-[9.5px] font-semibold line-clamp-2 text-center leading-tight">
          {foto.titulo || foto.descripcion || renglonTexto}
        </p>
      </div>

      {/* Info debajo */}
      <div className={columnas === 4 ? 'p-1 px-1.5' : 'p-1.5 px-2'}>
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span
            title={renglonTexto}
            className={`font-bold text-gray-900 truncate inline-block ${
              columnas === 4
                ? 'text-[7.5px] max-w-[65px] sm:max-w-[80px]'
                : columnas === 3
                  ? 'text-[8px] max-w-[85px] sm:max-w-[105px]'
                  : 'text-[9px] max-w-[125px] sm:max-w-[140px]'
            }`}
          >
            {renglonTexto}
          </span>
          <span className={`font-mono text-gray-400 flex-shrink-0 ${columnas === 4 ? 'text-[7px]' : 'text-[8.5px]'}`}>
            {foto.fecha}
          </span>
        </div>
        <div className={`flex items-center gap-1 text-gray-500 line-clamp-1 ${columnas === 4 ? 'text-[7px]' : 'text-[8.5px]'}`}>
          <FolderOpen size={columnas === 4 ? 8 : 9} className="flex-shrink-0 text-gray-400" />
          <span className="truncate">{foto.ubicacionObra || foto.proyectoNombre || 'Obra'}</span>
        </div>
      </div>
    </div>
  )
})

export const FotografiaGrid = memo(function FotografiaGrid({
  fotos,
  onFotoClick,
  columnas = 2,
}: FotografiaGridProps) {
  const gridClasses =
    columnas === 4
      ? 'grid grid-cols-4 gap-1 sm:gap-2'
      : columnas === 3
        ? 'grid grid-cols-3 gap-1.5 sm:gap-2.5'
        : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-2.5'

  return (
    <div className={gridClasses}>
      {(fotos ?? []).map((foto, index) => (
        <FotografiaGridItem
          key={foto.id || index}
          foto={foto}
          columnas={columnas}
          onClick={() => onFotoClick(foto, index)}
        />
      ))}
    </div>
  )
})

