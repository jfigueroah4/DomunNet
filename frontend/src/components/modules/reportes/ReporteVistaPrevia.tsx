'use client'

import { Reporte, FilaAvance, FilaBitacora } from '@/types/reporte'
import { ReporteTablaAvance } from './ReporteTablaAvance'
import { ReporteTablaBitacora } from './ReporteTablaBitacora'

interface ReporteVistaPreviaProps {
  reporte: Reporte
}

export function ReporteVistaPrevia({ reporte }: ReporteVistaPreviaProps) {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
      {/* Encabezado del documento */}
      <div className="bg-[#9B0F06] px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-white text-sm font-bold">{reporte.titulo}</p>
          <p className="text-white/70 text-[10px] mt-0.5">
            {reporte.proyectoNombre} • {reporte.fechaDesde} al {reporte.fechaHasta}
          </p>
        </div>
        <div className="text-right">
          <p className="text-white/60 text-[9px]">Generado por</p>
          <p className="text-white text-[10px] font-medium">{reporte.generadoPor}</p>
          <p className="text-white/60 text-[9px] mt-0.5">{reporte.creadoEn}</p>
        </div>
      </div>

      {/* Franja de color crema */}
      <div className="bg-[#EED9B9]/20 px-6 py-2 flex items-center gap-4 border-b border-[#EED9B9]/40">
        <span className="text-[9px] text-gray-500 uppercase tracking-wide font-semibold">
          {reporte.tipo === 'avance_proyecto'
            ? 'Reporte de Avance de Proyecto'
            : 'Reporte de Actividades de Bitácora'}
        </span>
        <span className="text-[9px] text-gray-400">•</span>
        <span className="text-[9px] text-gray-500">{reporte.paginas} páginas</span>
      </div>

      {/* Contenido — secciones incluidas */}
      <div className="p-5 flex flex-col gap-4">
        {reporte.secciones
          .filter((s) => s.incluido)
          .map((seccion, i) => (
            <div key={i}>
              {/* Título de sección */}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 bg-[#9B0F06] rounded-full" />
                <p className="text-xs font-semibold text-gray-700">
                  {seccion.titulo}
                </p>
              </div>

              {/* Contenido según tipo de sección */}
              {seccion.titulo.includes('Tabla') ||
              seccion.titulo.includes('Actividades') ||
              seccion.titulo.includes('Avance') ? (
                reporte.tipo === 'avance_proyecto' ? (
                  <ReporteTablaAvance
                    filas={reporte.tablaDatos as FilaAvance[]}
                  />
                ) : (
                  <ReporteTablaBitacora
                    filas={reporte.tablaDatos as FilaBitacora[]}
                  />
                )
              ) : (
                /* Secciones de texto — resumen/observaciones */
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="space-y-2">
                    <div className="h-2 bg-gray-200 rounded w-full" />
                    <div className="h-2 bg-gray-200 rounded w-4/5" />
                    <div className="h-2 bg-gray-200 rounded w-3/4" />
                    <div className="h-2 bg-gray-200 rounded w-full mt-3" />
                    <div className="h-2 bg-gray-200 rounded w-2/3" />
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>

      {/* Pie de página del documento */}
      <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50">
        <p className="text-[9px] text-gray-400">DOMUN — Control de Obra</p>
        <p className="text-[9px] text-gray-400">
          Página 1 de {reporte.paginas}
        </p>
      </div>
    </div>
  )
}
