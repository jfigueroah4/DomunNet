'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, Check } from 'lucide-react'
import { TipoReporte, Reporte } from '@/types/reporte'
import { PROYECTOS_MOCK } from '@/data/proyectos.mock'
import { ReporteVistaPrevia } from '@/components/modules/reportes/ReporteVistaPrevia'

function NuevoReporteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tipoInitial = (searchParams.get('tipo') || '') as TipoReporte | ''

  const [paso, setPaso] = useState(1)
  const [tipo, setTipo] = useState<TipoReporte | ''>(tipoInitial)
  const [proyectoId, setProyectoId] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [secciones, setSecciones] = useState<Record<string, boolean>>({
    'sec-1': true,
    'sec-2': true,
    'sec-3': true,
    'sec-4': true,
  })

  // Crear reporte de vista previa
  const crearReportePrevia = (): Reporte | null => {
    if (!tipo || !proyectoId || !fechaDesde || !fechaHasta) return null

    const proyecto = PROYECTOS_MOCK.find((p) => p.id === proyectoId)
    if (!proyecto) return null

    return {
      id: 'prev-000',
      titulo: `Reporte de ${tipo === 'avance_proyecto' ? 'Avance' : 'Actividades'} — ${new Date().toLocaleDateString('es-GT')}`,
      tipo,
      estado: 'completado',
      proyectoId,
      proyectoNombre: proyecto.nombre,
      fechaDesde,
      fechaHasta,
      generadoPor: 'Usuario Actual',
      creadoEn: new Date().toLocaleDateString('es-GT'),
      paginas: 6,
      secciones: [
        { id: 'sec-1', titulo: 'Resumen Ejecutivo', incluido: secciones['sec-1'] },
        { id: 'sec-2', titulo: tipo === 'avance_proyecto' ? 'Tabla de Avance por Proyecto' : 'Tabla de Actividades', incluido: secciones['sec-2'] },
        { id: 'sec-3', titulo: tipo === 'avance_proyecto' ? 'Resumen de Estados' : 'Tabla de Incidentes', incluido: secciones['sec-3'] },
        { id: 'sec-4', titulo: 'Conclusiones', incluido: secciones['sec-4'] },
      ],
      tablaDatos: [],
    }
  }

  const reportePrevia = paso === 3 ? crearReportePrevia() : null

  const handleGenerar = () => {
    console.log('Generar reporte:', { tipo, proyectoId, fechaDesde, fechaHasta, secciones })
    router.push('/reportes')
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => (paso === 1 ? router.back() : setPaso(paso - 1))}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={16} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-base font-bold text-gray-800">Nuevo Reporte</h1>
          <p className="text-[10px] text-gray-400">Paso {paso} de 3</p>
        </div>
      </div>

      {/* Indicador de progreso */}
      <div className="flex gap-2">
        {[1, 2, 3].map((p) => (
          <button
            key={p}
            onClick={() => p < paso && setPaso(p)}
            className={`flex-1 h-1.5 rounded-full transition-colors ${
              p <= paso ? 'bg-[#9B0F06]' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Contenido del paso */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 lg:col-span-1">
          {/* PASO 1: Configuración */}
          {paso === 1 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
              <h2 className="text-xs font-semibold text-gray-800">
                Paso 1: Configuración
              </h2>

              <div>
                <label className="text-[10px] font-medium text-gray-600 block mb-1.5">
                  Tipo de Reporte
                </label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as TipoReporte)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[10px] text-gray-700 bg-white focus:outline-none focus:border-[#9B0F06]"
                >
                  <option value="">Seleccionar tipo...</option>
                  <option value="avance_proyecto">Avance de Proyecto</option>
                  <option value="bitacora_actividades">Bitácora de Actividades</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-medium text-gray-600 block mb-1.5">
                  Proyecto
                </label>
                <select
                  value={proyectoId}
                  onChange={(e) => setProyectoId(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[10px] text-gray-700 bg-white focus:outline-none focus:border-[#9B0F06]"
                >
                  <option value="">Seleccionar proyecto...</option>
                  {PROYECTOS_MOCK.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-medium text-gray-600 block mb-1.5">
                  Fecha Desde
                </label>
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[10px] bg-white focus:outline-none focus:border-[#9B0F06]"
                />
              </div>

              <div>
                <label className="text-[10px] font-medium text-gray-600 block mb-1.5">
                  Fecha Hasta
                </label>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[10px] bg-white focus:outline-none focus:border-[#9B0F06]"
                />
              </div>

              <button
                onClick={() => setPaso(2)}
                disabled={!tipo || !proyectoId || !fechaDesde || !fechaHasta}
                className="w-full bg-[#9B0F06] text-white text-[10px] font-medium py-2 rounded-lg hover:bg-[#5E0006] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente →
              </button>
            </div>
          )}

          {/* PASO 2: Secciones */}
          {paso === 2 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
              <h2 className="text-xs font-semibold text-gray-800">
                Paso 2: Secciones
              </h2>

              <p className="text-[10px] text-gray-500">
                Selecciona qué secciones incluir en el reporte
              </p>

              <div className="space-y-2">
                {['sec-1', 'sec-2', 'sec-3', 'sec-4'].map((sec) => {
                  const labels: Record<string, string> = {
                    'sec-1': 'Resumen Ejecutivo',
                    'sec-2':
                      tipo === 'avance_proyecto'
                        ? 'Tabla de Avance por Proyecto'
                        : 'Tabla de Actividades',
                    'sec-3':
                      tipo === 'avance_proyecto'
                        ? 'Resumen de Estados'
                        : 'Tabla de Incidentes',
                    'sec-4': 'Conclusiones',
                  }

                  return (
                    <label
                      key={sec}
                      className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={secciones[sec]}
                        onChange={(e) =>
                          setSecciones({ ...secciones, [sec]: e.target.checked })
                        }
                        className="w-3 h-3 rounded border-gray-300 text-[#9B0F06]"
                      />
                      <span className="text-[10px] font-medium text-gray-700">
                        {labels[sec]}
                      </span>
                    </label>
                  )
                })}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setPaso(1)}
                  className="flex-1 border border-gray-200 text-gray-700 text-[10px] font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  ← Anterior
                </button>
                <button
                  onClick={() => setPaso(3)}
                  className="flex-1 bg-[#9B0F06] text-white text-[10px] font-medium py-2 rounded-lg hover:bg-[#5E0006] transition-colors"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}

          {/* PASO 3: Vista Previa */}
          {paso === 3 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
              <h2 className="text-xs font-semibold text-gray-800">
                Paso 3: Revisar
              </h2>

              <div className="space-y-2 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tipo:</span>
                  <span className="font-medium text-gray-700">
                    {tipo === 'avance_proyecto'
                      ? 'Avance de Proyecto'
                      : 'Bitácora de Actividades'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Proyecto:</span>
                  <span className="font-medium text-gray-700">
                    {PROYECTOS_MOCK.find((p) => p.id === proyectoId)?.nombre}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Período:</span>
                  <span className="font-medium text-gray-700">
                    {fechaDesde} a {fechaHasta}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <span className="text-gray-500">Secciones incluidas:</span>
                  <div className="mt-1.5 space-y-1">
                    {['sec-1', 'sec-2', 'sec-3', 'sec-4'].map((sec) => {
                      const labels: Record<string, string> = {
                        'sec-1': 'Resumen Ejecutivo',
                        'sec-2':
                          tipo === 'avance_proyecto'
                            ? 'Tabla de Avance'
                            : 'Tabla de Actividades',
                        'sec-3':
                          tipo === 'avance_proyecto'
                            ? 'Resumen de Estados'
                            : 'Tabla de Incidentes',
                        'sec-4': 'Conclusiones',
                      }
                      return secciones[sec] ? (
                        <div
                          key={sec}
                          className="flex items-center gap-1.5 text-gray-700"
                        >
                          <Check size={11} className="text-green-600" />
                          {labels[sec]}
                        </div>
                      ) : null
                    })}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setPaso(2)}
                  className="flex-1 border border-gray-200 text-gray-700 text-[10px] font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  ← Anterior
                </button>
                <button
                  onClick={handleGenerar}
                  className="flex-1 bg-[#9B0F06] text-white text-[10px] font-medium py-2 rounded-lg hover:bg-[#5E0006] transition-colors"
                >
                  Generar Reporte
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Vista Previa */}
        {paso === 3 && reportePrevia && (
          <div className="col-span-2 lg:col-span-1">
            <h2 className="text-xs font-semibold text-gray-800 mb-3">
              Vista Previa
            </h2>
            <ReporteVistaPrevia reporte={reportePrevia} />
          </div>
        )}
      </div>
    </div>
  )
}

export default function NuevoReportePage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <NuevoReporteContent />
    </Suspense>
  )
}
