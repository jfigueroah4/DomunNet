'use client'

import { useState } from 'react'
import { ZoomIn, Camera, ImageOff, X, Maximize2 } from 'lucide-react'
import { FotografiaProyecto } from '@/types/proyecto'

interface ProyectoFotografiasProps {
  fotografias: FotografiaProyecto[]
}

export default function ProyectoFotografias({ fotografias }: ProyectoFotografiasProps) {
  const [fotoSeleccionada, setFotoSeleccionada] = useState<FotografiaProyecto | null>(null)

  if (fotografias.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white py-12 shadow-sm">
        <div className="mb-3 rounded-full bg-red-50 p-4">
          <ImageOff size={32} className="text-gray-300" />
        </div>
        <p className="text-base sm:text-sm font-semibold text-gray-700">No hay fotografías</p>
        <p className="mt-1 text-sm sm:text-xs text-gray-400">Las fotografías subidas aparecerán aquí</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-[15px] font-extrabold text-[#07152B]">Fotografías del Proyecto</h3>
          <p className="mt-0.5 text-xs sm:text-[11px] text-[#9AA2B5]">Galería técnica y evidencia de obra</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-[#9B0F06] px-3.5 py-2 text-xs sm:text-[11px] font-semibold text-white transition-colors hover:bg-[#8F0C06] cursor-pointer">
          <Camera size={14} />
          <span>Subir Fotografía</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {fotografias.map((foto) => (
          <div
            key={foto.id}
            onClick={() => setFotoSeleccionada(foto)}
            className="overflow-hidden rounded-xl sm:rounded-2xl border border-gray-100 bg-white shadow-2xs hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="relative bg-gray-100">
              <img
                src={foto.url}
                alt={foto.titulo}
                className="h-28 sm:h-44 w-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
              <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-black/60 backdrop-blur-xs text-white p-1 rounded-md sm:rounded-lg">
                <Maximize2 size={12} className="sm:w-3.5 sm:h-3.5" />
              </div>
              <div className="absolute inset-0 hidden sm:flex items-center justify-center bg-black/25 opacity-0 transition-opacity group-hover:opacity-100">
                <ZoomIn size={22} className="text-white" />
              </div>
            </div>
            <div className="p-2 sm:p-3">
              <p className="line-clamp-1 text-xs sm:text-[12px] font-bold text-[#07152B]">{foto.titulo}</p>
              <p className="mt-0.5 text-[11px] sm:text-[10px] text-[#9AA2B5]">{foto.fecha}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Lightbox para ampliar fotografía en pantalla completa */}
      {fotoSeleccionada && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setFotoSeleccionada(null)}
        >
          <div className="relative max-w-4xl w-full flex flex-col items-center">
            <button
              type="button"
              onClick={() => setFotoSeleccionada(null)}
              className="absolute -top-12 right-0 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors cursor-pointer"
              title="Cerrar imagen"
            >
              <X size={24} />
            </button>
            <img
              src={fotoSeleccionada.url}
              alt={fotoSeleccionada.titulo}
              className="max-h-[82vh] max-w-full object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <div
              className="mt-3 bg-black/70 backdrop-blur-md px-4 py-2 rounded-xl text-white text-center max-w-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="font-bold text-sm">{fotoSeleccionada.titulo}</p>
              <p className="text-xs text-gray-300 mt-0.5">{fotoSeleccionada.fecha}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
