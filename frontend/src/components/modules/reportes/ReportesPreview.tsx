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
  bitacoraFiltrada,
  bitacoraParaReporte,
  registrosSeleccionados,
  toggleRegistroSeleccionado,
  fotosFiltradas,
  fotosParaReporte,
  fotosSeleccionadas,
  toggleFotoSeleccionada,
}: ReportesPreviewProps) {
  return (
    <div className="mt-4 w-full">
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
        <div className="mb-3 flex items-center justify-between border-b border-gray-200/60 pb-3">
          <div>
            <p className="text-xs font-bold text-gray-800">Vista previa unificada de registros de bitácora</p>
            <p className="text-[10px] text-gray-500">
              {bitacoraParaReporte.length} de {bitacoraFiltrada.length} registros seleccionados • {fotosParaReporte.length} de {fotosFiltradas.length} fotografías incluidas
            </p>
          </div>
          <div className="flex items-center gap-2 text-[#9B0F06]">
            <ClipboardList size={16} />
          </div>
        </div>

        <div className="max-h-[500px] space-y-3 overflow-y-auto pr-1">
          {bitacoraFiltrada.length === 0 ? (
            <p className="rounded-lg bg-white p-4 text-[11px] text-gray-400 text-center">
              No hay registros de bitácora para el rango o filtros seleccionados.
            </p>
          ) : (
            bitacoraFiltrada.map((registro) => {
              const checked = registrosSeleccionados.includes(registro.id)
              const fotosDelRegistro = fotosFiltradas.filter((foto) => foto.bitacoraId === registro.id)

              return (
                <div
                  key={registro.id}
                  className={`rounded-xl border bg-white p-3.5 transition-all shadow-2xs ${
                    checked ? 'border-gray-200 ring-1 ring-[#9B0F06]/10' : 'border-gray-100 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleRegistroSeleccionado(registro.id)}
                      className="mt-1 h-4 w-4 accent-[#9B0F06] cursor-pointer"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <p className="text-[12px] font-bold text-gray-800">{registro.titulo}</p>
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[8.5px] font-bold uppercase text-gray-600">
                            {registro.tipo}
                          </span>
                        </div>
                        <span className="text-[9.5px] text-gray-400 font-medium">{registro.fecha}</span>
                      </div>

                      <p className="mt-0.5 text-[9.5px] font-semibold text-[#9B0F06]">
                        {registro.proyectoNombre || 'Proyecto Domun'}
                      </p>
                      <p className="mt-1 text-[11px] text-gray-600 leading-relaxed">{registro.descripcion}</p>

                      {/* Fotografías adjuntas al registro en la misma fila/tarjeta */}
                      {fotosDelRegistro.length > 0 && (
                        <div className="mt-3 border-t border-gray-100 pt-2.5">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Camera size={12} className="text-gray-500" />
                            <span className="text-[9.5px] font-bold text-gray-700 uppercase tracking-wide">
                              Fotografías adjuntas ({fotosDelRegistro.length})
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {fotosDelRegistro.map((foto) => {
                              const fotoChecked = checked && fotosSeleccionadas.includes(foto.id)
                              return (
                                <label
                                  key={foto.id}
                                  className={`flex items-center gap-2.5 p-2 rounded-lg border transition-all ${
                                    checked ? 'cursor-pointer hover:border-[#9B0F06]/30' : 'cursor-not-allowed opacity-50'
                                  } ${fotoChecked ? 'border-emerald-200 bg-emerald-50/20' : 'border-gray-100 bg-gray-50/50'}`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={fotoChecked}
                                    disabled={!checked}
                                    onChange={() => toggleFotoSeleccionada(foto.id)}
                                    className="h-3.5 w-3.5 accent-[#9B0F06] disabled:cursor-not-allowed"
                                  />
                                  <img
                                    src={foto.urlMiniatura || foto.url}
                                    alt={foto.titulo}
                                    className="h-12 w-14 flex-shrink-0 rounded-md object-cover border border-gray-200"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="line-clamp-1 text-[10px] font-bold text-gray-800">{foto.titulo}</p>
                                    <p className="text-[8.5px] text-gray-400">{foto.fecha} {foto.hora}</p>
                                  </div>
                                </label>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
