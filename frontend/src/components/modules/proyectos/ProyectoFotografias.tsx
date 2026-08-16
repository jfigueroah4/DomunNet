'use client'

import { ZoomIn, Camera, ImageOff } from 'lucide-react'
import { FotografiaProyecto } from '@/types/proyecto'

interface ProyectoFotografiasProps {
  fotografias: FotografiaProyecto[]
}

export default function ProyectoFotografias({ fotografias }: ProyectoFotografiasProps) {
  if (fotografias.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white py-12 shadow-sm">
        <div className="mb-3 rounded-full bg-red-50 p-4">
          <ImageOff size={32} className="text-gray-300" />
        </div>
        <p className="text-sm font-semibold text-gray-700">No hay fotografías</p>
        <p className="mt-1 text-xs text-gray-400">Las fotografías subidas aparecerán aquí</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-extrabold text-[#07152B]">Fotografías del Proyecto</h3>
          <p className="mt-0.5 text-[11px] text-[#9AA2B5]">Galería técnica y evidencia de obra</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-[#A80F08] px-3 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-[#8F0C06]">
          <Camera size={13} />
          Subir Fotografía
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {fotografias.map((foto) => (
          <div key={foto.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="relative group bg-gray-100">
              <img src={foto.url} alt={foto.titulo} className="h-44 w-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center rounded-t-2xl bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                <ZoomIn size={22} className="text-white" />
              </div>
            </div>
            <div className="p-3">
              <p className="line-clamp-1 text-[12px] font-semibold text-[#07152B]">{foto.titulo}</p>
              <p className="mt-0.5 text-[10px] text-[#9AA2B5]">{foto.fecha}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
