'use client'

import { ChevronLeft, Download, RefreshCw, Share2 } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { REPORTES_MOCK } from '@/data/reportes.mock'
import { ReporteVistaPrevia } from '@/components/modules/reportes/ReporteVistaPrevia'
import { ReporteEstadoBadge } from '@/components/modules/reportes/ReporteEstadoBadge'

export default function ReporteDetallePage() {
  const router = useRouter()
  const params = useParams()
  const reporteId = params.id as string

  const reporte = REPORTES_MOCK.find((r) => r.id === reporteId)

  if (!reporte) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <p className="text-[10px] text-gray-400">Reporte no encontrado</p>
      </div>
    )
  }

  const handleDescargar = () => {
    toast.info('Descargando reporte como PDF...')
  }

  const handleRegenerar = () => {
    toast.info('Regenerando reporte...')
  }

  const handleCompartir = () => {
    toast.info('Compartiendo reporte...')
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={16} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-base font-bold text-gray-800">{reporte.titulo}</h1>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {reporte.proyectoNombre}
            </p>
          </div>
        </div>

        <div className="flex gap-1.5">
          {reporte.estado === 'completado' && (
            <>
              <button
                onClick={handleDescargar}
                className="bg-white border border-gray-200 text-gray-700 text-[10px] px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5"
              >
                <Download size={12} />
                Descargar
              </button>
              <button
                onClick={handleCompartir}
                className="bg-white border border-gray-200 text-gray-700 text-[10px] px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5"
              >
                <Share2 size={12} />
                Compartir
              </button>
            </>
          )}
          {reporte.estado === 'completado' && (
            <button
              onClick={handleRegenerar}
              className="bg-white border border-gray-200 text-gray-700 text-[10px] px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw size={12} />
              Regenerar
            </button>
          )}
        </div>
      </div>

      {/* Grid: Preview + Info */}
      <div className="grid grid-cols-3 gap-4">
        {/* Preview — 2 columnas */}
        <div className="col-span-2">
          <ReporteVistaPrevia reporte={reporte} />
        </div>

        {/* Info — 1 columna */}
        <div className="space-y-3">
          {/* Status Card */}
          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 space-y-2">
            <p className="text-[9px] uppercase text-gray-400 font-semibold tracking-widest">
              Estado
            </p>
            <ReporteEstadoBadge estado={reporte.estado} />
          </div>

          {/* Tipo */}
          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
            <p className="text-[9px] uppercase text-gray-400 font-semibold tracking-widest mb-1.5">
              Tipo
            </p>
            <p className="text-[10px] font-medium text-gray-800">
              {reporte.tipo === 'avance_proyecto'
                ? 'Avance de Proyecto'
                : 'Bitácora de Actividades'}
            </p>
          </div>

          {/* Proyecto */}
          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
            <p className="text-[9px] uppercase text-gray-400 font-semibold tracking-widest mb-1.5">
              Proyecto
            </p>
            <p className="text-[10px] font-medium text-gray-800 line-clamp-2">
              {reporte.proyectoNombre}
            </p>
          </div>

          {/* Período */}
          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
            <p className="text-[9px] uppercase text-gray-400 font-semibold tracking-widest mb-1.5">
              Período
            </p>
            <p className="text-[10px] font-medium text-gray-800">
              {reporte.fechaDesde}
            </p>
            <p className="text-[10px] text-gray-600">a {reporte.fechaHasta}</p>
          </div>

          {/* Autor */}
          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
            <p className="text-[9px] uppercase text-gray-400 font-semibold tracking-widest mb-1.5">
              Generado Por
            </p>
            <p className="text-[10px] font-medium text-gray-800">
              {reporte.generadoPor}
            </p>
          </div>

          {/* Fecha */}
          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
            <p className="text-[9px] uppercase text-gray-400 font-semibold tracking-widest mb-1.5">
              Fecha Creación
            </p>
            <p className="text-[10px] font-medium text-gray-800">
              {reporte.creadoEn}
            </p>
          </div>

          {/* Secciones */}
          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
            <p className="text-[9px] uppercase text-gray-400 font-semibold tracking-widest mb-1.5">
              Secciones
            </p>
            <div className="space-y-1">
              {reporte.secciones
                .filter((s) => s.incluido)
                .map((s) => (
                  <p key={s.id} className="text-[10px] text-gray-700">
                    • {s.titulo}
                  </p>
                ))}
            </div>
          </div>

          {/* Páginas */}
          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
            <p className="text-[9px] uppercase text-gray-400 font-semibold tracking-widest mb-1.5">
              Tamaño
            </p>
            <p className="text-[10px] font-medium text-gray-800">
              {reporte.paginas} página{reporte.paginas !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
