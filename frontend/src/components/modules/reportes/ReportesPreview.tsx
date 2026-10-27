'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { CheckCheck, Eraser, Image as ImageIcon, Eye, ChevronLeft, ChevronRight, Search } from 'lucide-react'

interface ReportesPreviewProps {
  bitacoraFiltrada: any[]
  bitacoraParaReporte: any[]
  registrosSeleccionados: string[]
  toggleRegistroSeleccionado: (id: string) => void
  fotosFiltradas: any[]
  fotosParaReporte: any[]
  fotosSeleccionadas: string[]
  toggleFotoSeleccionada: (id: string) => void
  onVerDetalle: (registro: any) => void
  onVerFoto?: (url: string) => void
  seleccionarTodo: () => void
  limpiarSeleccion: () => void
}

export function ReportesPreview({
  bitacoraFiltrada,
  bitacoraParaReporte: _bitacoraParaReporte,
  registrosSeleccionados,
  toggleRegistroSeleccionado,
  fotosFiltradas,
  fotosParaReporte: _fotosParaReporte,
  fotosSeleccionadas,
  toggleFotoSeleccionada,
  onVerDetalle,
  onVerFoto,
  seleccionarTodo,
  limpiarSeleccion,
}: ReportesPreviewProps) {
  const tieneFotos = fotosFiltradas.length > 0
  const [paginaActual, setPaginaActual] = useState(1)
  const [busquedaDesktop, setBusquedaDesktop] = useState('')
  const itemsPorPagina = 4

  const listaBase = useMemo(() => {
    return tieneFotos ? fotosFiltradas : bitacoraFiltrada
  }, [tieneFotos, fotosFiltradas, bitacoraFiltrada])

  // Filtrar según la descripción (y título/renglón) ingresada en la barra de búsqueda desktop
  const listaCompleta = useMemo(() => {
    if (!busquedaDesktop.trim()) return listaBase
    const q = busquedaDesktop.toLowerCase().trim()
    return listaBase.filter((item: any) => {
      const regPadre = bitacoraFiltrada.find((b) => String(b.id) === String(item.bitacoraId))
      const desc = String(item.descripcion || item.nombre || regPadre?.descripcion || '').toLowerCase()
      const tit = String(item.titulo || regPadre?.titulo || '').toLowerCase()
      const renglon = String(item.renglon || regPadre?.renglon_nombre || regPadre?.renglon || '').toLowerCase()
      const estacion = `${item.estacionInicio || regPadre?.estacionInicio || ''} ${item.estacionFin || regPadre?.estacionFin || ''}`.toLowerCase()
      return desc.includes(q) || tit.includes(q) || renglon.includes(q) || estacion.includes(q)
    })
  }, [listaBase, busquedaDesktop, bitacoraFiltrada])

  const totalPaginas = Math.max(1, Math.ceil(listaCompleta.length / itemsPorPagina))

  // Asegurar que la página actual sea válida si cambia el filtro o la búsqueda
  useEffect(() => {
    if (paginaActual > totalPaginas) {
      setPaginaActual(1)
    }
  }, [totalPaginas, paginaActual])

  // Restablecer a la primera página al buscar
  useEffect(() => {
    setPaginaActual(1)
  }, [busquedaDesktop])

  // Obtener items de la página actual (4 por hoja de reporte)
  const itemsPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * itemsPorPagina
    return listaCompleta.slice(inicio, inicio + itemsPorPagina)
  }, [listaCompleta, paginaActual])

  return (
    <div className="mt-3 w-full font-[Poppins]">
      <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-3 sm:p-4">
        {/* Cabecera de la sección: Título a la izquierda, Buscador al centro (solo desktop) y Botones a la derecha */}
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-gray-200/60 pb-2.5">
          {/* Lado Izquierdo: Título y contador de seleccionadas */}
          <div className="shrink-0">
            <h3 className="text-xs font-bold text-gray-900 leading-tight">Vista previa de imágenes</h3>
            <p className="text-[10.5px] sm:text-[10px] text-gray-500 font-medium">
              {tieneFotos
                ? `${fotosSeleccionadas.length} de ${listaCompleta.length} seleccionadas`
                : `${registrosSeleccionados.length} de ${listaCompleta.length} seleccionados`}
              {busquedaDesktop.trim() && (
                <span className="text-gray-400 font-normal ml-1">
                  (de {listaBase.length})
                </span>
              )}
            </p>
          </div>

          {/* Centro: Barra de búsqueda SOLO EN DESKTOP */}
          <div className="hidden sm:flex flex-1 max-w-xs md:max-w-sm lg:max-w-md mx-2">
            <div className="relative w-full">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={busquedaDesktop}
                onChange={(e) => setBusquedaDesktop(e.target.value)}
                placeholder="Buscar por descripción..."
                className="w-full rounded-lg border border-gray-200 bg-white pl-8 pr-7 py-1 text-[11px] text-gray-800 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none transition-colors shadow-2xs"
                title="Buscar imágenes según la descripción o título"
              />
              {busquedaDesktop && (
                <button
                  type="button"
                  onClick={() => setBusquedaDesktop('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs px-0.5 cursor-pointer"
                  title="Limpiar búsqueda"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Lado Derecho: Botones de selección */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={seleccionarTodo}
              className="inline-flex h-7 items-center gap-1 rounded-md border border-gray-200 bg-white px-2 text-[11px] sm:text-[10px] font-semibold text-gray-700 transition-colors hover:border-[#9B0F06] hover:text-[#9B0F06] shadow-2xs cursor-pointer active:scale-95"
            >
              <CheckCheck size={13} className="sm:hidden" />
              Marcar todo
            </button>
            <button
              type="button"
              onClick={limpiarSeleccion}
              className="inline-flex h-7 items-center gap-1 rounded-md border border-gray-200 bg-white px-2 text-[11px] sm:text-[10px] font-semibold text-gray-700 transition-colors hover:border-[#9B0F06] hover:text-[#9B0F06] shadow-2xs cursor-pointer active:scale-95"
            >
              <Eraser size={13} className="sm:hidden" />
              Limpiar
            </button>
          </div>
        </div>

        {/* Listado de 4 elementos por página con Selección Persistente */}
        <div className="space-y-2.5 sm:space-y-2">
          {tieneFotos ? (
            itemsPaginados.length > 0 ? (
              itemsPaginados.map((foto: any) => {
                const checked = fotosSeleccionadas.includes(String(foto.id))
                const regPadre = bitacoraFiltrada.find((b) => String(b.id) === String(foto.bitacoraId))
                const fechaHora = [foto.fecha, foto.hora].filter(Boolean).join(' ') || regPadre?.fecha || ''
                const tituloMostrar = foto.titulo || regPadre?.titulo || 'Evidencia Fotográfica'
                const descripcionMostrar = foto.descripcion || regPadre?.descripcion || regPadre?.renglon_nombre || 'Evidencia de bitácora'
                const fotoUrl = foto.urlMiniatura || foto.url

                const registroCompleto = regPadre || {
                  id: foto.bitacoraId || foto.id,
                  titulo: tituloMostrar,
                  descripcion: descripcionMostrar,
                  fecha: foto.fecha || new Date().toISOString().slice(0, 10),
                  hora: foto.hora || '12:00',
                  adjuntos: [{ id: foto.id, url: foto.url, nombre: foto.titulo }],
                  proyectoNombre: foto.proyectoNombre || 'Proyecto Vial',
                  autor: foto.autor || 'Ingeniero Residente',
                  estacionInicio: foto.estacionInicio || '0+000',
                  estacionFin: foto.estacionFin || '0+500',
                  lado: foto.lado || 'Ambos',
                }

                return (
                  <div
                    key={foto.id}
                    onClick={() => toggleFotoSeleccionada(String(foto.id))}
                    className={`rounded-xl border bg-white p-2 sm:p-2.5 flex items-center gap-2 sm:gap-3 transition-all cursor-pointer shadow-2xs select-none ${
                      checked
                        ? 'border-gray-200 hover:border-gray-300'
                        : 'border-gray-100 opacity-60 bg-gray-50/50'
                    }`}
                  >
                    {/* Checkbox Rojo Corporativo */}
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        e.stopPropagation()
                        toggleFotoSeleccionada(String(foto.id))
                      }}
                      className="h-4 w-4 accent-[#9B0F06] cursor-pointer rounded shrink-0 ml-0.5"
                    />

                    {/* Miniatura Uniforme más compacta en móvil y que se expande al oprimirla */}
                    <div
                      onClick={(e) => {
                        if (fotoUrl && onVerFoto) {
                          e.stopPropagation()
                          onVerFoto(fotoUrl)
                        }
                      }}
                      title="Oprime para ampliar la imagen"
                      className="relative group/thumb h-11 w-14 sm:h-12 sm:w-16 rounded-lg overflow-hidden border border-gray-200 shrink-0 bg-gray-100 flex items-center justify-center cursor-zoom-in active:scale-95 transition-transform"
                    >
                      {fotoUrl ? (
                        <>
                          <img
                            src={fotoUrl}
                            alt={tituloMostrar}
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Eye size={12} />
                          </div>
                        </>
                      ) : (
                        <ImageIcon size={16} className="text-gray-400" />
                      )}
                    </div>

                    {/* Información Compacta y Legible */}
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-xs font-bold text-gray-900 truncate leading-snug">
                        {tituloMostrar}
                      </p>
                      {fechaHora && (
                        <p className="text-[10px] font-mono text-gray-500 font-medium">
                          {fechaHora}
                        </p>
                      )}
                      <p className="text-[10.5px] text-gray-600 line-clamp-1 leading-tight">
                        {descripcionMostrar}
                      </p>
                    </div>

                    {/* Icono de Ojo */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onVerDetalle(registroCompleto)
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-[#9B0F06] hover:bg-red-50 transition-colors shrink-0 cursor-pointer ml-auto active:scale-95"
                      title="Ver detalles completos de la bitácora"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                )
              })
            ) : (
              <div className="rounded-xl bg-white p-6 text-center space-y-1">
                <p className="text-xs text-gray-500 font-semibold">
                  No se encontraron imágenes que coincidan con &quot;{busquedaDesktop}&quot;
                </p>
                <button
                  type="button"
                  onClick={() => setBusquedaDesktop('')}
                  className="text-[11px] text-[#9B0F06] hover:underline font-medium cursor-pointer"
                >
                  Restablecer búsqueda
                </button>
              </div>
            )
          ) : (
            itemsPaginados.length > 0 ? (
              itemsPaginados.map((registro: any) => {
                const checked = registrosSeleccionados.includes(String(registro.id))
                const fechaHora = [registro.fecha, registro.hora].filter(Boolean).join(' ')
                const fotoUrl = registro.adjuntos?.[0]?.url || registro.fotos?.[0]?.url

                return (
                  <div
                    key={registro.id}
                    onClick={() => toggleRegistroSeleccionado(String(registro.id))}
                    className={`rounded-xl border bg-white p-2 sm:p-2.5 flex items-center gap-2 sm:gap-3 transition-all cursor-pointer shadow-2xs select-none ${
                      checked
                        ? 'border-gray-200 hover:border-gray-300'
                        : 'border-gray-100 opacity-60 bg-gray-50/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        e.stopPropagation()
                        toggleRegistroSeleccionado(String(registro.id))
                      }}
                      className="h-4 w-4 accent-[#9B0F06] cursor-pointer rounded shrink-0 ml-0.5"
                    />

                    <div
                      onClick={(e) => {
                        if (fotoUrl && onVerFoto) {
                          e.stopPropagation()
                          onVerFoto(fotoUrl)
                        }
                      }}
                      title={fotoUrl ? 'Oprime para ampliar la imagen' : undefined}
                      className={`relative group/thumb h-11 w-14 sm:h-12 sm:w-16 rounded-lg overflow-hidden border border-gray-200 shrink-0 bg-gray-100 flex items-center justify-center transition-transform ${
                        fotoUrl ? 'cursor-zoom-in active:scale-95' : ''
                      }`}
                    >
                      {fotoUrl ? (
                        <>
                          <img
                            src={fotoUrl}
                            alt={registro.titulo}
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Eye size={12} />
                          </div>
                        </>
                      ) : (
                        <ImageIcon size={16} className="text-gray-400" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-xs font-bold text-gray-900 truncate leading-snug">
                        {registro.titulo}
                      </p>
                      {fechaHora && (
                        <p className="text-[10px] font-mono text-gray-500 font-medium">
                          {fechaHora}
                        </p>
                      )}
                      <p className="text-[10.5px] text-gray-600 line-clamp-1 leading-tight">
                        {registro.descripcion || registro.renglon_nombre || 'Sin descripción'}
                      </p>
                    </div>

                    {/* Icono de Ojo */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onVerDetalle(registro)
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-[#9B0F06] hover:bg-red-50 transition-colors shrink-0 cursor-pointer ml-auto active:scale-95"
                      title="Ver detalles completos de la bitácora"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                )
              })
            ) : (
              <div className="rounded-xl bg-white p-6 text-center space-y-1">
                <p className="text-xs text-gray-500 font-semibold">
                  No se encontraron registros que coincidan con &quot;{busquedaDesktop}&quot;
                </p>
                <button
                  type="button"
                  onClick={() => setBusquedaDesktop('')}
                  className="text-[11px] text-[#9B0F06] hover:underline font-medium cursor-pointer"
                >
                  Restablecer búsqueda
                </button>
              </div>
            )
          )}
        </div>

        {/* Paginación de 4 por página (hoja de reporte) */}
        {listaCompleta.length > 0 && (
          <div className="paginacion-control mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-gray-200/70 pt-2 text-[9.5px] sm:text-[11px] text-gray-500 font-medium font-[Poppins]">
            <div className="flex items-center gap-1 text-[9.5px] sm:text-[11px]">
              <span>Vista:</span>
              <span className="font-bold text-gray-800">4</span>
              <span>reg/pág ({listaCompleta.length} tot.)</span>
            </div>
            <div className="flex items-center gap-1.5 text-[9.5px] sm:text-[11px]">
              <button
                type="button"
                disabled={paginaActual <= 1}
                onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                className="h-6 w-6 sm:h-6 sm:w-6 flex items-center justify-center rounded-md border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-gray-600 transition-colors shadow-2xs active:scale-95 text-[9.5px]"
                title="Página anterior"
              >
                <ChevronLeft size={13} />
              </button>
              <span className="font-mono text-[9.5px] sm:text-[10px] font-bold text-gray-700 px-1">
                {paginaActual} / {totalPaginas}
              </span>
              <button
                type="button"
                disabled={paginaActual >= totalPaginas}
                onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                className="h-6 w-6 sm:h-6 sm:w-6 flex items-center justify-center rounded-md border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-gray-600 transition-colors shadow-2xs active:scale-95 text-[9.5px]"
                title="Página siguiente"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
