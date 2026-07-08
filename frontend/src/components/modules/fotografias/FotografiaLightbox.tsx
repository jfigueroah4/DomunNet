'use client'

import { useEffect } from 'react'
import { ChevronLeft, ChevronRight, X, Calendar, User, MapPin } from 'lucide-react'
import { Fotografia } from '@/types/fotografia'
import { FotografiaTipoBadge } from './FotografiaTipoBadge'

interface FotografiaLightboxProps {
  foto: Fotografia | null
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

export function FotografiaLightbox({
  foto,
  onClose,
  onPrev,
  onNext,
}: FotografiaLightboxProps) {
  useEffect(() => {
    if (!foto) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [foto, onClose, onPrev, onNext])

  if (!foto) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center transition-opacity duration-200">
      <div className="flex gap-4 max-w-5xl w-full mx-4 items-center">
        {/* Botón anterior */}
        <button
          onClick={onPrev}
          className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors text-white flex-shrink-0"
          aria-label="Fotografía anterior"
        >
          <ChevronLeft size={24} />
        </button>

        {/* Bloque central */}
        <div className="flex-1 flex flex-col items-center gap-3">
          <img
            src={foto.url}
            alt={foto.titulo}
            className="max-h-[70vh] max-w-full object-contain rounded-xl"
          />

          <div className="w-full text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <FotografiaTipoBadge tipo={foto.tipo} />
              <h2 className="text-white text-sm font-semibold">{foto.titulo}</h2>
            </div>
            <p className="text-white/70 text-xs">{foto.descripcion}</p>
          </div>

          <div className="flex items-center justify-center gap-4 text-white/60 text-[10px]">
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              {foto.fecha}
            </div>
            <div className="flex items-center gap-1">
              <User size={12} />
              {foto.autor}
            </div>
            <div className="flex items-center gap-1">
              <MapPin size={12} />
              {foto.ubicacionObra}
            </div>
          </div>
        </div>

        {/* Botón siguiente */}
        <button
          onClick={onNext}
          className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors text-white flex-shrink-0"
          aria-label="Siguiente fotografía"
        >
          <ChevronRight size={24} />
        </button>

        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors text-white/60 hover:text-white"
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  )
}
