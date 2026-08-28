'use client'

import React from 'react'
import { ClipboardList, Camera } from 'lucide-react'

interface ReportesPreviewProps {
  bitacoraFiltrada: any[]
  bitacoraParaReporte: any[]
  registrosSeleccionados: string[]
  toggleRegistroSeleccionado: (id: string) => void
  fotosFiltradas: any[]
  fotosParaReporte: any[]
  fotosSeleccionadas: string[]
  toggleFotoSeleccionada: (id: string) => void
}

export function ReportesPreview({
  bitacoraFiltrada, bitacoraParaReporte, registrosSeleccionados, toggleRegistroSeleccionado,
  fotosFiltradas, fotosParaReporte, fotosSeleccionadas, toggleFotoSeleccionada
}: ReportesPreviewProps) {
  return (
    <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-800">Vista previa de registros</p>
            <p className="text-[10px] text-gray-400">{bitacoraParaReporte.length} de {bitacoraFiltrada.length} seleccionados</p>
          </div>
          <ClipboardList size={14} className="text-[#9B0F06]" />
        </div>
        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {bitacoraFiltrada.length === 0 ? (
            <p className="rounded-lg bg-white p-3 text-[10px] text-gray-400">No hay registros para el rango seleccionado.</p>
          ) : (
            bitacoraFiltrada.map((registro) => {
              const checked = registrosSeleccionados.includes(registro.id)
              const fotosRegistro = fotosFiltradas.filter((foto) => foto.bitacoraId === registro.id).length
              return (
                <label key={registro.id} className="flex cursor-pointer gap-3 rounded-lg border border-gray-100 bg-white p-3 transition-colors hover:border-[#9B0F06]/30">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleRegistroSeleccionado(registro.id)}
                    className="mt-0.5 h-4 w-4 accent-[#9B0F06]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="line-clamp-1 text-[11px] font-semibold text-gray-800">{registro.titulo}</p>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[8px] font-semibold uppercase text-gray-500">{registro.tipo}</span>
                    </div>
                    <p className="mt-1 text-[9px] text-gray-400">{registro.fecha} - {registro.proyectoNombre} - {fotosRegistro} fotos</p>
                    <p className="mt-1 line-clamp-2 text-[10px] text-gray-500">{registro.descripcion}</p>
                  </div>
                </label>
              )
            })
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-800">Vista previa de imagenes</p>
            <p className="text-[10px] text-gray-400">{fotosParaReporte.length} de {fotosFiltradas.length} seleccionadas</p>
          </div>
          <Camera size={14} className="text-[#9B0F06]" />
        </div>
        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {fotosFiltradas.length === 0 ? (
            <p className="rounded-lg bg-white p-3 text-[10px] text-gray-400">No hay imagenes vinculadas a los registros filtrados.</p>
          ) : (
            fotosFiltradas.map((foto) => {
              const registroIncluido = registrosSeleccionados.includes(foto.bitacoraId)
              const checked = registroIncluido && fotosSeleccionadas.includes(foto.id)
              return (
                <label key={foto.id} className={`flex cursor-pointer gap-3 rounded-lg border bg-white p-2 transition-colors ${registroIncluido ? 'border-gray-100 hover:border-[#9B0F06]/30' : 'border-gray-100 opacity-50'}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={!registroIncluido}
                    onChange={() => toggleFotoSeleccionada(foto.id)}
                    className="mt-1 h-4 w-4 accent-[#9B0F06] disabled:cursor-not-allowed"
                  />
                  <img src={foto.urlMiniatura || foto.url} alt={foto.titulo} className="h-16 w-20 flex-shrink-0 rounded-md object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-[11px] font-semibold text-gray-800">{foto.titulo}</p>
                    <p className="mt-1 text-[9px] text-gray-400">{foto.fecha} {foto.hora}</p>
                    <p className="mt-1 line-clamp-2 text-[10px] text-gray-500">{foto.bitacoraTitulo}</p>
                  </div>
                </label>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
