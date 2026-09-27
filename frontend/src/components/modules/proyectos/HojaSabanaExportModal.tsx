'use client'

import { useState } from 'react'
import { FileText, FileSpreadsheet, X, CheckSquare, Square, Layers, Calculator, Banknote } from 'lucide-react'
import { exportarSabanaPDF, exportarSabanaExcel, SabanaExportOptions } from '@/lib/export/sabanaExportEngine'
import { RenglonDetalladoSabana, MedicionAnaliticaCampo } from './HojaSabanaView'

interface HojaSabanaExportModalProps {
  isOpen: boolean
  onClose: () => void
  proyecto: any
  renglones: RenglonDetalladoSabana[]
  medicionesAnaliticas?: MedicionAnaliticaCampo[]
  modoVistaSabana: 'planificacion' | 'actual'
  estimacionActiva?: any
}

export function HojaSabanaExportModal({
  isOpen,
  onClose,
  proyecto,
  renglones,
  medicionesAnaliticas = [],
  modoVistaSabana,
  estimacionActiva,
}: HojaSabanaExportModalProps) {
  const [incluirSabana, setIncluirSabana] = useState(true)
  const [incluirAnalitico, setIncluirAnalitico] = useState(modoVistaSabana === 'actual')
  const [incluirResumen, setIncluirResumen] = useState(true)

  if (!isOpen) return null

  const ningunSeleccionado = !incluirSabana && !incluirAnalitico && !incluirResumen

  const getExportOptions = (): SabanaExportOptions => ({
    incluirSabana,
    incluirAnalitico: modoVistaSabana === 'actual' ? incluirAnalitico : false,
    incluirResumen,
    proyecto,
    renglones,
    medicionesAnaliticas,
    modoVistaSabana,
    estimacionActiva,
  })

  const handleExportarPDF = () => {
    if (ningunSeleccionado) return
    exportarSabanaPDF(getExportOptions())
    onClose()
  }

  const handleExportarExcel = () => {
    if (ningunSeleccionado) return
    exportarSabanaExcel(getExportOptions())
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs font-[Poppins]">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150 space-y-4">
        {/* Encabezado */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <FileSpreadsheet className="text-[#9B0F06]" size={18} />
              <span>Exportar Plan de Trabajo de Proyecto</span>
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Seleccione los componentes a incluir en el reporte ({modoVistaSabana.toUpperCase()})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Panel Checklist */}
        <div className="space-y-2.5">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-600 block">
            Panel de Selección de Secciones
          </label>

          <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50/60 p-3">
            {/* Check 1: Hoja Sábana */}
            <div
              onClick={() => setIncluirSabana(!incluirSabana)}
              className={`flex items-center justify-between rounded-lg border p-2.5 cursor-pointer transition-all ${
                incluirSabana
                  ? 'border-[#9B0F06] bg-red-50/40 text-gray-900 shadow-2xs'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className={incluirSabana ? 'text-[#9B0F06]' : 'text-gray-400'} size={16} />
                <div>
                  <span className="text-xs font-bold block">Hoja Sábana Digital</span>
                  <span className="text-[10px] text-gray-500">
                    Matriz completa de renglones, cantidades y subtotales por capítulo ({renglones.length} partidas)
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setIncluirSabana(!incluirSabana)
                }}
                className="p-1 rounded hover:bg-black/5 transition-colors cursor-pointer"
              >
                {incluirSabana ? (
                  <CheckSquare size={18} className="text-[#9B0F06]" />
                ) : (
                  <Square size={18} className="text-gray-300" />
                )}
              </button>
            </div>

            {/* Check 2: Analítico (Memoria de Cálculo) */}
            {modoVistaSabana === 'actual' && (
              <div
                onClick={() => setIncluirAnalitico(!incluirAnalitico)}
                className={`flex items-center justify-between rounded-lg border p-2.5 cursor-pointer transition-all ${
                  incluirAnalitico
                    ? 'border-[#9B0F06] bg-red-50/40 text-gray-900 shadow-2xs'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Calculator className={incluirAnalitico ? 'text-[#9B0F06]' : 'text-gray-400'} size={16} />
                  <div>
                    <span className="text-xs font-bold block">Analítico (Memoria de Cálculo)</span>
                    <span className="text-[10px] text-gray-500">
                      Desglose de mediciones reales de campo (estaciones, dimensiones L × A × H)
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIncluirAnalitico(!incluirAnalitico)
                  }}
                  className="p-1 rounded hover:bg-black/5 transition-colors cursor-pointer"
                >
                  {incluirAnalitico ? (
                    <CheckSquare size={18} className="text-[#9B0F06]" />
                  ) : (
                    <Square size={18} className="text-gray-300" />
                  )}
                </button>
              </div>
            )}

            {/* Check 3: Resumen Financiero */}
            <div
              onClick={() => setIncluirResumen(!incluirResumen)}
              className={`flex items-center justify-between rounded-lg border p-2.5 cursor-pointer transition-all ${
                incluirResumen
                  ? 'border-[#9B0F06] bg-red-50/40 text-gray-900 shadow-2xs'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Banknote className={incluirResumen ? 'text-[#9B0F06]' : 'text-gray-400'} size={16} />
                <div>
                  <span className="text-xs font-bold block">Resumen Financiero y Liquidación</span>
                  <span className="text-[10px] text-gray-500">
                    Estado contable DGC (Directo, 45% indirectos, 20% anticipo, 5% garantía, líquido neto)
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setIncluirResumen(!incluirResumen)
                }}
                className="p-1 rounded hover:bg-black/5 transition-colors cursor-pointer"
              >
                {incluirResumen ? (
                  <CheckSquare size={18} className="text-[#9B0F06]" />
                ) : (
                  <Square size={18} className="text-gray-300" />
                )}
              </button>
            </div>
          </div>

          {ningunSeleccionado && (
            <p className="text-[10px] text-red-600 font-semibold text-center pt-1">
              Debe seleccionar al menos una sección para poder exportar.
            </p>
          )}
        </div>

        {/* Pie de modal con botones de acción */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          {/* Botón Exportar PDF (Rojo con icono de PDF) */}
          <button
            type="button"
            disabled={ningunSeleccionado}
            onClick={handleExportarPDF}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#9B0F06] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#7A0C0D] transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <FileText size={14} />
            <span>Exportar como PDF</span>
          </button>

          {/* Botón Exportar Excel (Verde con icono de Excel) */}
          <button
            type="button"
            disabled={ningunSeleccionado}
            onClick={handleExportarExcel}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#059669] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#047857] transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <FileSpreadsheet size={14} />
            <span>Exportar Excel</span>
          </button>
        </div>
      </div>
    </div>
  )
}
