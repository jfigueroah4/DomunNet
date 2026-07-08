'use client'

import { ZoomIn } from 'lucide-react'
import { FolderOpen } from 'lucide-react'
import { Fotografia } from '@/types/fotografia'
import { FotografiaTipoBadge } from './FotografiaTipoBadge'

interface FotografiaGridProps {
  fotos: Fotografia[]
  onFotoClick: (foto: Fotografia, index: number) => void
}

export function FotografiaGrid({ fotos, onFotoClick }: FotografiaGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {fotos.map((foto, index) => (
        <div
          key={foto.id}
          className="relative group rounded-xl overflow-hidden cursor-pointer bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          onClick={() => onFotoClick(foto, index)}
        >
          {/* Imagen */}
          <img
            src={foto.urlMiniatura}
            alt={foto.titulo}
            className="w-full h-40 object-cover"
          />

          {/* Overlay al hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col items-center justify-center">
            <ZoomIn size={20} className="text-white mb-2" />
            <p className="text-white text-[10px] font-semibold line-clamp-1 px-2 text-center">
              {foto.titulo}
            </p>
          </div>

          {/* Info debajo */}
          <div className="px-2 pt-1.5 pb-2">
            <div className="flex items-center justify-between gap-1 mb-1">
              <FotografiaTipoBadge tipo={foto.tipo} />
              <span className="text-[9px] text-gray-400 flex-shrink-0">
                {foto.fecha}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[9px] text-gray-400 line-clamp-1">
              <FolderOpen size={10} className="flex-shrink-0" />
              <span className="truncate">{foto.proyectoNombre}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
