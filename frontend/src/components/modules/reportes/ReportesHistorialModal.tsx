'use client'

import React, { useState, useMemo } from 'react'
import {
  X,
  History,
  Search,
  Trash2,
  Calendar,
  FileType,
  FileText,
  CheckCircle2,
  Info,
  Camera,
  Clock,
  Layers,
  Filter,
} from 'lucide-react'
import { Portal } from '@/components/ui/Portal'
import type { ReporteGeneradoRegistro } from './ReportesView'

interface ReportesHistorialModalProps {
  isOpen: boolean
  onClose: () => void
  historial: ReporteGeneradoRegistro[]
  onEliminar: (id: string) => void
}

export function ReportesHistorialModal({
  isOpen,
  onClose,
  historial,
  onEliminar,
}: ReportesHistorialModalProps) {
  const [busqueda, setBusqueda] = useState('')
  const [formatoFiltro, setFormatoFiltro] = useState<string>('todos')
  const [fechaFiltro, setFechaFiltro] = useState<string>('')

  // Métricas estadísticas del historial
  const metricas = useMemo(() => {
    const total = historial.length
    const pdfs = historial.filter((r) => r.formato === 'pdf').length
    const words = historial.filter((r) => r.formato === 'word').length
    const totalRegistros = historial.reduce((acc, r) => acc + (r.cantidadRegistros || 0), 0)
    const totalFotos = historial.reduce((acc, r) => acc + (r.cantidadFotos || 0), 0)
    return { total, pdfs, words, totalRegistros, totalFotos }
  }, [historial])

  const registrosFiltrados = useMemo(() => {
    return historial.filter((rep) => {
      const q = busqueda.toLowerCase().trim()
      const matchBusqueda =
        !q ||
        rep.titulo.toLowerCase().includes(q) ||
        rep.proyectoNombre.toLowerCase().includes(q) ||
        rep.generadoPor.toLowerCase().includes(q)

      const matchFormato =
        formatoFiltro === 'todos' || rep.formato === formatoFiltro

      let matchFecha = true
      if (fechaFiltro) {
        const fechaReporte = (rep.fechaIso || rep.fechaCreacion || '').slice(0, 10)
        matchFecha = fechaReporte.includes(fechaFiltro) || rep.fechaCreacion.includes(fechaFiltro)
      }

      return matchBusqueda && matchFormato && matchFecha
    })
  }, [historial, busqueda, formatoFiltro, fechaFiltro])

  if (!isOpen) return null

  return (
    <Portal>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 font-[Poppins]">
        {/* Backdrop click to close */}
        <div className="fixed inset-0" onClick={onClose} />

        <div className="relative w-full max-w-[96vw] lg:max-w-6xl xl:max-w-7xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden z-10 animate-in zoom-in-95 duration-150 font-[Poppins]">
          {/* Header del Modal */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-gray-200 bg-gray-50/90 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-red-50 text-[#9B0F06] shrink-0 border border-red-100/80 shadow-2xs">
                <History size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-gray-900 leading-tight truncate">
                    Historial de Reportes Realizados
                  </h2>
                  <span className="hidden sm:inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-[#9B0F06] border border-red-100">
                    Auditoría Oficial
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-gray-500 font-medium truncate mt-0.5">
                  Registro de auditoría y control de exportaciones con trazabilidad de responsable
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200/70 transition-colors cursor-pointer shrink-0 ml-2"
              title="Cerrar modal"
            >
              <X size={18} />
            </button>
          </div>

          {/* Tarjetas KPI de Resumen Estadístico */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 px-4 sm:px-6 py-3 bg-gray-50/50 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2.5 rounded-xl border border-gray-200/80 bg-white p-2.5 shadow-2xs">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-[#9B0F06] shrink-0">
                <FileText size={16} />
              </div>
              <div className="min-w-0">
                <span className="block text-[9px] font-bold uppercase tracking-wider text-gray-400">Total Reportes</span>
                <span className="text-xs sm:text-sm font-extrabold text-gray-900">{metricas.total} generados</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-xl border border-gray-200/80 bg-white p-2.5 shadow-2xs">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
                <FileType size={16} />
              </div>
              <div className="min-w-0">
                <span className="block text-[9px] font-bold uppercase tracking-wider text-gray-400">Por Formato</span>
                <span className="text-xs sm:text-sm font-extrabold text-gray-900">
                  {metricas.pdfs} PDF <span className="text-gray-300 font-normal">/</span> {metricas.words} Word
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-xl border border-gray-200/80 bg-white p-2.5 shadow-2xs">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                <Layers size={16} />
              </div>
              <div className="min-w-0">
                <span className="block text-[9px] font-bold uppercase tracking-wider text-gray-400">Regs. Bitácora</span>
                <span className="text-xs sm:text-sm font-extrabold text-gray-900">{metricas.totalRegistros} incluidos</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-xl border border-gray-200/80 bg-white p-2.5 shadow-2xs">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 shrink-0">
                <Camera size={16} />
              </div>
              <div className="min-w-0">
                <span className="block text-[9px] font-bold uppercase tracking-wider text-gray-400">Fotografías</span>
                <span className="text-xs sm:text-sm font-extrabold text-gray-900">{metricas.totalFotos} evidencias</span>
              </div>
            </div>
          </div>

          {/* Barra de Filtros y Búsqueda */}
          <div className="px-4 sm:px-6 py-2.5 border-b border-gray-100 bg-white flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="relative flex-1 min-w-[200px] sm:min-w-[280px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por proyecto, responsable o título..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-3 py-1.5 text-xs text-gray-800 placeholder:text-gray-400 focus:border-[#9B0F06] focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Filtro por Fecha */}
              <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1">
                <Calendar size={13} className="text-gray-400" />
                <input
                  type="date"
                  value={fechaFiltro}
                  onChange={(e) => setFechaFiltro(e.target.value)}
                  className="text-xs text-gray-700 bg-transparent focus:outline-none"
                  title="Filtrar por fecha específica"
                />
                {fechaFiltro && (
                  <button
                    type="button"
                    onClick={() => setFechaFiltro('')}
                    className="text-gray-400 hover:text-gray-600 text-xs px-0.5"
                    title="Limpiar fecha"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Filtro por Formato */}
              <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1">
                <Filter size={13} className="text-gray-400" />
                <select
                  value={formatoFiltro}
                  onChange={(e) => setFormatoFiltro(e.target.value)}
                  className="text-xs font-medium text-gray-700 bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value="todos">Todos los formatos</option>
                  <option value="pdf">Solo PDF</option>
                  <option value="word">Solo Word</option>
                </select>
              </div>

              <span className="rounded-full bg-gray-100 border border-gray-200/80 px-2.5 py-1 text-[11px] font-bold text-gray-700 whitespace-nowrap">
                {registrosFiltrados.length} {registrosFiltrados.length === 1 ? 'reporte' : 'reportes'}
              </span>
            </div>
          </div>

          {/* Cuerpo: Tabla de Registros Ampliada con Información Completa */}
          <div className="flex-1 overflow-x-auto overflow-y-auto p-3 sm:p-5">
            {registrosFiltrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center text-gray-400 font-[Poppins]">
                <History size={36} className="text-gray-300 mb-2 stroke-[1.5]" />
                <p className="text-sm font-semibold text-gray-700">No se encontraron reportes</p>
                <p className="text-xs text-gray-400 mt-1 max-w-sm">
                  {busqueda || fechaFiltro || formatoFiltro !== 'todos'
                    ? 'No hay registros que coincidan con los filtros aplicados. Intenta restablecer los filtros.'
                    : 'Los reportes exportados en PDF o Word quedarán registrados aquí con trazabilidad completa.'}
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xs font-[Poppins]">
                <table className="w-full border-collapse text-left text-xs font-[Poppins]">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/90 text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-gray-500 font-[Poppins]">
                      <th className="px-3 sm:px-4 py-2.5 whitespace-nowrap">Fecha / Hora</th>
                      <th className="px-3 sm:px-4 py-2.5 whitespace-nowrap">Formato</th>
                      <th className="px-3 sm:px-4 py-2.5 min-w-[260px]">Proyecto y Título</th>
                      <th className="px-3 sm:px-4 py-2.5 whitespace-nowrap">Período Auditado</th>
                      <th className="px-3 sm:px-4 py-2.5 whitespace-nowrap">Contenido Incluido</th>
                      <th className="px-3 sm:px-4 py-2.5 min-w-[150px]">Responsable</th>
                      <th className="px-3 sm:px-4 py-2.5 text-center whitespace-nowrap">Estado</th>
                      <th className="px-3 sm:px-4 py-2.5 text-center whitespace-nowrap">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-[Poppins]">
                    {registrosFiltrados.map((rep) => {
                      const esPdf = rep.formato === 'pdf'

                      return (
                        <tr key={rep.id} className="hover:bg-gray-50/80 transition-colors">
                          {/* Fecha / Hora */}
                          <td className="px-3 sm:px-4 py-2.5 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 font-mono text-[11px] text-gray-800">
                              <Calendar size={13} className="text-[#9B0F06] shrink-0" />
                              <span className="font-semibold">{rep.fechaCreacion}</span>
                            </div>
                          </td>

                          {/* Formato */}
                          <td className="px-3 sm:px-4 py-2.5 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                                esPdf
                                  ? 'bg-red-50 text-red-700 border-red-200/80'
                                  : 'bg-blue-50 text-blue-700 border-blue-200/80'
                              }`}
                            >
                              {esPdf ? <FileType size={13} className="text-red-600" /> : <FileText size={13} className="text-blue-600" />}
                              <span>{rep.formato}</span>
                            </span>
                          </td>

                          {/* Proyecto y Título */}
                          <td className="px-3 sm:px-4 py-2.5 min-w-[260px]">
                            <div className="space-y-0.5">
                              <p className="font-bold text-gray-900 text-xs sm:text-[12.5px] leading-snug">
                                {rep.proyectoNombre}
                              </p>
                              {rep.titulo && rep.titulo !== `Reporte Formal de Obra - ${rep.proyectoNombre}` && (
                                <p className="text-[10.5px] text-gray-500 font-medium">
                                  {rep.titulo}
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Período */}
                          <td className="px-3 sm:px-4 py-2.5 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 text-[10.5px] font-medium text-gray-600 bg-gray-50 border border-gray-200/80 px-2 py-0.5 rounded-md">
                              <Clock size={11} className="text-gray-400" />
                              <span>{rep.periodo || 'Periodo Completo'}</span>
                            </span>
                          </td>

                          {/* Contenido (Registros y Fotos) */}
                          <td className="px-3 sm:px-4 py-2.5 whitespace-nowrap">
                            <div className="flex items-center gap-2 text-[11px]">
                              <span className="inline-flex items-center gap-1 font-semibold text-gray-700 bg-gray-100/80 px-2 py-0.5 rounded-md border border-gray-200/60">
                                <FileText size={12} className="text-[#9B0F06]" />
                                <span>{rep.cantidadRegistros} reg.</span>
                              </span>
                              <span className="inline-flex items-center gap-1 font-semibold text-gray-700 bg-gray-100/80 px-2 py-0.5 rounded-md border border-gray-200/60">
                                <Camera size={12} className="text-purple-600" />
                                <span>{rep.cantidadFotos} fotos</span>
                              </span>
                            </div>
                          </td>

                          {/* Responsable */}
                          <td className="px-3 sm:px-4 py-2.5 min-w-[150px]">
                            <div className="flex items-center gap-2 text-gray-800 font-semibold text-xs">
                              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-[#9B0F06] text-[9.5px] font-bold">
                                {(rep.generadoPor || 'U').slice(0, 2).toUpperCase()}
                              </div>
                              <span className="truncate">{rep.generadoPor}</span>
                            </div>
                          </td>

                          {/* Estado */}
                          <td className="px-3 sm:px-4 py-2.5 text-center whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
                              <CheckCircle2 size={12} className="text-emerald-600" />
                              <span>Registrado</span>
                            </span>
                          </td>

                          {/* Acción (Eliminar del log) */}
                          <td className="px-3 sm:px-4 py-2.5 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => onEliminar(rep.id)}
                              className="inline-flex items-center justify-center rounded-lg p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Eliminar este registro de auditoría"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer del Modal */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 border-t border-gray-200 bg-gray-50/90 shrink-0 font-[Poppins]">
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <Info size={14} className="text-gray-400 shrink-0" />
              <span>Este registro es de solo auditoría y control de operaciones de reportes oficiales.</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-gray-200 hover:bg-gray-300 px-4 py-1.5 text-xs font-bold text-gray-800 transition-colors cursor-pointer shadow-2xs"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
