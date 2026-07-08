'use client'

import { ZoomIn, Camera, ImageOff } from 'lucide-react'
import { FotografiaProyecto } from '@/types/proyecto'

interface ProyectoFotografiasProps {
  fotografias: FotografiaProyecto[]
}

export default function ProyectoFotografias({ fotografias }: ProyectoFotografiasProps) {
  if (fotografias.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="bg-red-50 rounded-full p-4 mb-3">
          <ImageOff size={32} className="text-gray-300" />
        </div>
        <p className="text-sm font-medium text-gray-600">No hay fotografías</p>
        <p className="text-xs text-gray-400 mt-1">Las fotografías subidas aparecerán aquí</p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-800 mb-4">Fotografías del Proyecto</h3>
      <button className="bg-[#9B0F06] text-white text-xs px-3 py-1.5 rounded-lg hover:bg-[#5E0006] transition-colors flex items-center gap-2 mb-4">
        <Camera size={13} />
        Subir Fotografía
      </button>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {fotografias.map((foto) => (
          <div
            key={foto.id}
            className="relative group rounded-xl overflow-hidden bg-gray-100"
          >
            {/* Image */}
            <img
              src={foto.url}
              alt={foto.titulo}
              className="w-full h-36 object-cover"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
              <ZoomIn size={22} className="text-white" />
            </div>

            {/* Info Below */}
            <div className="mt-1">
              <p className="text-xs font-medium text-gray-700 line-clamp-1">{foto.titulo}</p>
              <p className="text-[10px] text-gray-400">{foto.fecha}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
