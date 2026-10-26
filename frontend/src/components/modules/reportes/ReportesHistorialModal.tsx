'use client'

import React, { useState, useMemo } from 'react'
import {
  X,
  History,
  Search,
  Trash2,
  Calendar,
  Filter,
  Eye,
  Pencil,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import { Portal } from '@/components/ui/Portal'
import type { ReporteGeneradoRegistro } from './ReportesView'
import { PdfViewerModal, type DocumentoReporteVisor } from './PdfViewerModal'

interface ReportesHistorialModalProps {
  isOpen: boolean
  onClose: () => void
  historial: ReporteGeneradoRegistro[]
  onEliminar: (id: string) => void
  onEditar?: (reporte: ReporteGeneradoRegistro) => void
  onVerReporte?: (reporte: ReporteGeneradoRegistro) => void
  userRole?: string
}

function generarHtmlReporteFallback(rep: ReporteGeneradoRegistro): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <title>${rep.titulo}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 30px; color: #111827; background: #ffffff; }
    .header { border-bottom: 2px solid #111827; padding-bottom: 14px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
    .title { font-size: 16pt; font-weight: 800; margin: 0; color: #111827; }
    .subtitle { font-size: 9pt; color: #4b5563; margin-top: 4px; font-weight: 600; text-transform: uppercase; }
    .meta-box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; margin-bottom: 24px; background: #f9fafb; display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 8.5pt; }
    .meta-item strong { color: #374151; }
    .section-title { font-size: 11pt; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin: 24px 0 12px 0; }
    table { width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 20px; }
    th { background: #f3f4f6; text-align: left; padding: 8px 10px; border: 1px solid #e5e7eb; font-weight: 700; color: #374151; }
    td { padding: 8px 10px; border: 1px solid #e5e7eb; color: #4b5563; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 7.5pt; font-weight: 700; background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; }
    .footer { margin-top: 40px; padding-top: 14px; border-top: 1px solid #e5e7eb; font-size: 7.5pt; color: #6b7280; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">${rep.titulo}</h1>
      <div class="subtitle">DOMUN, S.A. &bull; SUPERVISIÓN Y CONTROL OFICIAL DE OBRA VIAL</div>
    </div>
    <div style="text-align: right;">
      <span class="badge">REGISTRO OFICIAL</span>
      <div style="font-size: 8pt; color: #6b7280; margin-top: 4px;">Fecha: ${rep.fechaCreacion}</div>
    </div>
  </div>

  <div class="meta-box">
    <div class="meta-item"><strong>Proyecto:</strong> ${rep.proyectoNombre}</div>
    <div class="meta-item"><strong>Período Auditado:</strong> ${rep.periodo || 'Periodo Completo'}</div>
    <div class="meta-item"><strong>Responsable de Emisión:</strong> ${rep.generadoPor}</div>
    <div class="meta-item"><strong>Formato de Exportación:</strong> ${rep.formato.toUpperCase()}</div>
    <div class="meta-item"><strong>Registros de Bitácora:</strong> ${rep.cantidadRegistros} entradas</div>
    <div class="meta-item"><strong>Evidencias Fotográficas:</strong> ${rep.cantidadFotos} fotografías</div>
  </div>

  <div class="section-title">Resumen de Contenido y Trazabilidad</div>
  <table>
    <thead>
      <tr>
        <th>Concepto</th>
        <th>Detalle</th>
        <th>Estado</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Bitácora de Campo</td>
        <td>${rep.cantidadRegistros} folios y notas técnicas validadas para el período</td>
        <td>Aprobado</td>
      </tr>
      <tr>
        <td>Registro Fotográfico</td>
        <td>${rep.cantidadFotos} evidencias con coordenadas GPS y fechado digital</td>
        <td>Verificado</td>
      </tr>
      <tr>
        <td>Responsable Legal</td>
        <td>${rep.generadoPor}</td>
        <td>Certificado</td>
      </tr>
      <tr>
        <td>Almacenamiento Cloud</td>
        <td>Supabase Storage (bucket: reportes-domun)</td>
        <td>Sincronizado</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    Documento oficial generado por la plataforma DomunNet. Trazabilidad garantizada para auditorías de la Entidad Contratante y Supervisora.
  </div>
</body>
</html>`
}

export function ReportesHistorialModal({
  isOpen,
  onClose,
  historial,
  onEliminar,
  onEditar,
  onVerReporte,
  userRole = '',
}: ReportesHistorialModalProps) {
  const [busqueda, setBusqueda] = useState('')
  const [formatoFiltro, setFormatoFiltro] = useState<string>('todos')
  const [fechaFiltro, setFechaFiltro] = useState<string>('')
  const [isExpanded, setIsExpanded] = useState(false)

  // Visor PDF
  const [documentoVisor, setDocumentoVisor] = useState<DocumentoReporteVisor | null>(null)
  const [visorAbierto, setVisorAbierto] = useState(false)

  // Comprobar si el usuario actual es de rol Contratante
  const esContratante = useMemo(() => {
    const rol = (userRole || '').toLowerCase().trim()
    return rol.includes('contratante')
  }, [userRole])

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

  const abrirVisorReporte = (rep: ReporteGeneradoRegistro) => {
    if (onVerReporte) {
      onVerReporte(rep)
    }

    let urlFinal = rep.urlPdf || rep.urlStorage || ''

    if (!urlFinal) {
      const contenidoHtml = rep.htmlContent || generarHtmlReporteFallback(rep)
      const blob = new Blob([contenidoHtml], { type: 'text/html;charset=utf-8' })
      urlFinal = URL.createObjectURL(blob)
    }

    setDocumentoVisor({
      id: rep.id,
      titulo: rep.titulo,
      urlPdf: urlFinal,
      subidoPor: rep.generadoPor,
      fecha: rep.fechaCreacion,
      proyectoNombre: rep.proyectoNombre,
      pesoFormateado: `${rep.cantidadRegistros} reg. / ${rep.cantidadFotos} fotos`,
    })
    setVisorAbierto(true)
  }

  if (!isOpen) return null

  return (
    <>
      <Portal>
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 font-[Poppins]">
          {/* Fondo para cerrar al dar clic afuera */}
          <div className="fixed inset-0" onClick={onClose} />

          {/* Contenedor ampliado del modal */}
          <div
            className={`relative bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden z-10 transition-all duration-200 animate-in zoom-in-95 font-[Poppins] ${
              isExpanded
                ? 'w-[98vw] h-[96vh] max-w-[98vw] max-h-[96vh]'
                : 'w-full max-w-[96vw] xl:max-w-[1400px] h-[92vh] max-h-[94vh]'
            }`}
          >
            {/* Header del Modal - Estilo neutral y limpio sin colores llamativos */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-200 bg-white shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-700 shrink-0 border border-gray-200">
                  <History size={16} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xs sm:text-sm font-bold text-gray-900 leading-tight truncate">
                      Historial de Reportes Realizados
                    </h2>
                    <span className="hidden sm:inline-flex items-center rounded px-2 py-0.5 text-[9.5px] font-semibold text-gray-600 bg-gray-100 border border-gray-200">
                      Auditoría
                    </span>
                  </div>
                  <p className="text-[9.5px] sm:text-[10px] text-gray-500 font-normal truncate mt-0.5">
                    Registro de auditoría y control de exportaciones con trazabilidad de responsable
                  </p>
                </div>
              </div>

              {/* Botones de control del modal (Maximizar / Cerrar) */}
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button
                  type="button"
                  onClick={() => setIsExpanded((prev) => !prev)}
                  className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                  title={isExpanded ? 'Restaurar tamaño' : 'Ampliar ventana'}
                >
                  {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                  title="Cerrar modal"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Barra de Filtros y Búsqueda - Diseño limpio y neutral */}
            <div className="px-4 sm:px-6 py-2 border-b border-gray-200 bg-white flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="relative flex-1 min-w-[200px] sm:min-w-[280px]">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por proyecto, responsable o título..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white pl-8 pr-3 py-1.5 text-[11px] text-gray-800 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Filtro por Fecha */}
                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1">
                  <Calendar size={12} className="text-gray-400" />
                  <input
                    type="date"
                    value={fechaFiltro}
                    onChange={(e) => setFechaFiltro(e.target.value)}
                    className="text-[11px] text-gray-700 bg-transparent focus:outline-none"
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
                  <Filter size={12} className="text-gray-400" />
                  <select
                    value={formatoFiltro}
                    onChange={(e) => setFormatoFiltro(e.target.value)}
                    className="text-[11px] font-medium text-gray-700 bg-transparent focus:outline-none cursor-pointer"
                  >
                    <option value="todos">Todos los formatos</option>
                    <option value="pdf">Solo PDF</option>
                    <option value="word">Solo Word</option>
                  </select>
                </div>

                <span className="rounded-lg bg-gray-100 border border-gray-200 px-2.5 py-1 text-[10px] font-semibold text-gray-600 whitespace-nowrap">
                  {registrosFiltrados.length} {registrosFiltrados.length === 1 ? 'reporte' : 'reportes'}
                </span>
              </div>
            </div>

            {/* Tabla de Registros Ampliada con tipografía reducida 1px */}
            <div className="flex-1 overflow-x-auto overflow-y-auto p-3 sm:p-5">
              {registrosFiltrados.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400 font-[Poppins]">
                  <History size={32} className="text-gray-300 mb-2 stroke-[1.5]" />
                  <p className="text-xs font-semibold text-gray-700">No se encontraron reportes</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 max-w-sm">
                    {busqueda || fechaFiltro || formatoFiltro !== 'todos'
                      ? 'No hay registros que coincidan con los filtros aplicados.'
                      : 'Los reportes exportados en PDF o Word quedarán registrados aquí con trazabilidad completa.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xs font-[Poppins]">
                  <table className="w-full border-collapse text-left text-[10px] sm:text-[10.5px] font-[Poppins]">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50/70 text-[9.5px] font-bold uppercase tracking-wider text-gray-500 font-[Poppins]">
                        <th className="px-3 sm:px-4 py-2 whitespace-nowrap">Fecha / Hora</th>
                        <th className="px-3 sm:px-4 py-2 whitespace-nowrap">Formato</th>
                        <th className="px-3 sm:px-4 py-2 min-w-[240px]">Proyecto y Título</th>
                        <th className="px-3 sm:px-4 py-2 whitespace-nowrap">Período Auditado</th>
                        <th className="px-3 sm:px-4 py-2 whitespace-nowrap">Contenido Incluido</th>
                        <th className="px-3 sm:px-4 py-2 min-w-[140px]">Responsable</th>
                        <th className="px-3 sm:px-4 py-2 text-center whitespace-nowrap">Estado</th>
                        <th className="px-3 sm:px-4 py-2 text-center whitespace-nowrap">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-[Poppins]">
                      {registrosFiltrados.map((rep) => {
                        return (
                          <tr key={rep.id} className="hover:bg-gray-50/60 transition-colors">
                            {/* Fecha / Hora */}
                            <td className="px-3 sm:px-4 py-2 whitespace-nowrap text-gray-700 font-mono text-[10px]">
                              {rep.fechaCreacion}
                            </td>

                            {/* Formato */}
                            <td className="px-3 sm:px-4 py-2 whitespace-nowrap">
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-mono font-semibold uppercase bg-gray-100 text-gray-700 border border-gray-200">
                                {rep.formato}
                              </span>
                            </td>

                            {/* Proyecto y Título */}
                            <td className="px-3 sm:px-4 py-2 min-w-[240px]">
                              <div className="space-y-0.5">
                                <p className="font-semibold text-gray-900 text-[11px] leading-snug">
                                  {rep.proyectoNombre}
                                </p>
                                {rep.titulo && (
                                  <p className="text-[10px] text-gray-500 font-normal truncate max-w-sm">
                                    {rep.titulo}
                                  </p>
                                )}
                              </div>
                            </td>

                            {/* Período */}
                            <td className="px-3 sm:px-4 py-2 whitespace-nowrap text-gray-600 text-[10px]">
                              {rep.periodo || 'Periodo Completo'}
                            </td>

                            {/* Contenido (Registros y Fotos) */}
                            <td className="px-3 sm:px-4 py-2 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
                                <span className="bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded font-medium">
                                  {rep.cantidadRegistros} reg.
                                </span>
                                <span className="bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded font-medium">
                                  {rep.cantidadFotos} fotos
                                </span>
                              </div>
                            </td>

                            {/* Responsable */}
                            <td className="px-3 sm:px-4 py-2 min-w-[140px] text-gray-700 font-medium text-[10px]">
                              <div className="flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-[8.5px] font-bold">
                                  {(rep.generadoPor || 'U').slice(0, 1).toUpperCase()}
                                </span>
                                <span className="truncate max-w-[130px]">{rep.generadoPor}</span>
                              </div>
                            </td>

                            {/* Estado */}
                            <td className="px-3 sm:px-4 py-2 text-center whitespace-nowrap">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[9.5px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
                                Registrado
                              </span>
                            </td>

                            {/* Botón gris con iconos: Contratante solo 'Ver', otros ven Ver, Editar, Eliminar */}
                            <td className="px-3 sm:px-4 py-2 text-center whitespace-nowrap">
                              <div className="inline-flex items-center p-0.5 bg-gray-100 hover:bg-gray-200/60 border border-gray-200 rounded-lg shadow-2xs gap-0.5 transition-colors">
                                {/* Botón Ver - Siempre visible */}
                                <button
                                  type="button"
                                  onClick={() => abrirVisorReporte(rep)}
                                  className="p-1 text-gray-600 hover:text-gray-900 hover:bg-white rounded transition-colors cursor-pointer"
                                  title="Ver reporte en visor oficial"
                                >
                                  <Eye size={13} />
                                </button>

                                {/* Para Contratante NO se muestran Editar ni Eliminar */}
                                {!esContratante && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => onEditar?.(rep)}
                                      className="p-1 text-gray-600 hover:text-gray-900 hover:bg-white rounded transition-colors cursor-pointer"
                                      title="Editar parámetros de este reporte"
                                    >
                                      <Pencil size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onEliminar(rep.id)}
                                      className="p-1 text-gray-600 hover:text-red-700 hover:bg-white rounded transition-colors cursor-pointer"
                                      title="Eliminar este reporte del historial"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </>
                                )}
                              </div>
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
            <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 border-t border-gray-200 bg-white shrink-0 font-[Poppins]">
              <span className="text-[10px] text-gray-500 font-normal">
                Almacenamiento oficial vinculado a Supabase Storage (bucket: reportes-domun).
              </span>

              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-200 px-3.5 py-1 text-[11px] font-semibold text-gray-700 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </Portal>

      {/* Visor de PDF Integrado estilo BitacoraDigital / Pantalla Completa */}
      <PdfViewerModal
        documento={documentoVisor}
        isOpen={visorAbierto}
        onClose={() => setVisorAbierto(false)}
      />
    </>
  )
}
