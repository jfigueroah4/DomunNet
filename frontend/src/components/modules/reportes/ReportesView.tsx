'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart2, FileType, FileText, FileSpreadsheet } from 'lucide-react'
import { BITACORA_MOCK } from '@/data/bitacora.mock'
import { FOTOGRAFIAS_MOCK } from '@/data/fotografias.mock'
import { PROYECTOS_MOCK } from '@/data/proyectos.mock'
import { ReportesFilter, ReportesSelects } from './ReportesFilter'
import { ReportesPreview } from './ReportesPreview'
import { exportReport, buildFormalReportHtml } from './ReportesExport'

export default function ReportesView() {
  const router = useRouter()
  const proyectoInicialId = PROYECTOS_MOCK[0]?.id || '1'
  const proyectoInicial = PROYECTOS_MOCK[0]

  const todayStr = new Date().toISOString().split('T')[0]

  const [proyectoId, setProyectoId] = useState<string>(proyectoInicialId)
  const [fechaDesde, setFechaDesde] = useState<string>(proyectoInicial?.fechaInicio || '2025-01-20')
  const [fechaHasta, setFechaHasta] = useState<string>(todayStr)
  const [renglonFiltro, setRenglonFiltro] = useState<string>('todos')

  const [registrosSeleccionados, setRegistrosSeleccionados] = useState<string[]>([])
  const [fotosSeleccionadas, setFotosSeleccionadas] = useState<string[]>([])

  // Renglones disponibles según el proyecto seleccionado
  const renglonesProyectoActual = useMemo(() => {
    return [
      { cod: '101.01', desc: 'Mantenimiento del tránsito y desvíos' },
      { cod: '102.03', desc: 'Clechado, chapeo y destronque' },
      { cod: '201.01', desc: 'Excavación no clasificada para corte' },
      { cod: '201.03(b)', desc: 'Excavación en roca por voladura' },
      { cod: '301.01', desc: 'Reacondicionamiento de subrasante' },
      { cod: '304.01', desc: 'Subbase granular tipo B' },
      { cod: '401.01', desc: 'Base granular tipo B' },
      { cod: '551.03', desc: 'Pavimento de concreto hidráulico' },
      { cod: '601.01', desc: 'Alcantarilla tubular de concreto 36"' },
      { cod: '608.01', desc: 'Cuneta de concreto revestida' },
    ]
  }, [proyectoId])

  const handleCambiarProyecto = (newProyId: string) => {
    setProyectoId(newProyId)
    const proy = PROYECTOS_MOCK.find((p) => p.id === newProyId)
    if (proy?.fechaInicio) {
      setFechaDesde(proy.fechaInicio)
    }
    setRenglonFiltro('todos')
  }

  const bitacoraFiltrada = useMemo(() => {
    return BITACORA_MOCK.filter((registro) => {
      const registroFecha = new Date(`${registro.fecha}T00:00:00`)
      const matchDesde = !fechaDesde || registroFecha >= new Date(`${fechaDesde}T00:00:00`)
      const matchHasta = !fechaHasta || registroFecha <= new Date(`${fechaHasta}T23:59:59`)
      const matchProyecto = registro.proyectoId === proyectoId
      const matchRenglon = renglonFiltro === 'todos' || registro.etiquetas.some((e) => e.toLowerCase().includes(renglonFiltro.toLowerCase()))
      return matchDesde && matchHasta && matchProyecto && matchRenglon
    })
  }, [renglonFiltro, fechaDesde, fechaHasta, proyectoId])

  const fotosFiltradas = useMemo(() => {
    const bitacoraIds = new Set(bitacoraFiltrada.map((registro) => registro.id))

    return FOTOGRAFIAS_MOCK
      .filter((foto) => bitacoraIds.has(foto.bitacoraId))
      .sort((a, b) => `${a.fecha}T${a.hora}`.localeCompare(`${b.fecha}T${b.hora}`))
  }, [bitacoraFiltrada])

  useEffect(() => {
    setRegistrosSeleccionados(bitacoraFiltrada.map((registro) => registro.id))
    setFotosSeleccionadas(fotosFiltradas.map((foto) => foto.id))
  }, [bitacoraFiltrada, fotosFiltradas])

  const bitacoraParaReporte = useMemo(
    () => bitacoraFiltrada.filter((registro) => registrosSeleccionados.includes(registro.id)),
    [bitacoraFiltrada, registrosSeleccionados]
  )

  const fotosParaReporte = useMemo(() => {
    const registroIds = new Set(bitacoraParaReporte.map((registro) => registro.id))
    return fotosFiltradas.filter((foto) => registroIds.has(foto.bitacoraId) && fotosSeleccionadas.includes(foto.id))
  }, [bitacoraParaReporte, fotosFiltradas, fotosSeleccionadas])

  const toggleRegistroSeleccionado = (id: string) => {
    setRegistrosSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleFotoSeleccionada = (id: string) => {
    setFotosSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const seleccionarTodo = () => {
    setRegistrosSeleccionados(bitacoraFiltrada.map((registro) => registro.id))
    setFotosSeleccionadas(fotosFiltradas.map((foto) => foto.id))
  }

  const limpiarSeleccion = () => {
    setRegistrosSeleccionados([])
    setFotosSeleccionadas([])
  }

  const handleExport = (format: 'pdf' | 'word' | 'excel') => {
    const html = buildFormalReportHtml(
      proyectoId,
      fechaDesde,
      fechaHasta,
      renglonFiltro,
      bitacoraParaReporte,
      fotosParaReporte
    )
    exportReport(format, html)
  }

  const filterProps = {
    proyectoId, handleCambiarProyecto, fechaDesde, setFechaDesde,
    fechaHasta, setFechaHasta, renglonFiltro, setRenglonFiltro,
    renglonesProyectoActual, todayStr, seleccionarTodo, limpiarSeleccion
  }

  return (
    <div className="min-h-0 space-y-4 overflow-y-auto font-[Poppins]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-gray-800">Reportes y Documentos Formales</h1>
          <p className="text-[10px] text-gray-400">Generación y exportación de expediente oficial de obra vial</p>
        </div>

        <button
          type="button"
          onClick={() => router.push('/dashboard/estadisticas')}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#9B0F06] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#5E0006] transition-colors shadow-2xs cursor-pointer"
        >
          <BarChart2 size={13} />
          <span>Estadísticas y Análisis</span>
        </button>
      </div>

      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <ReportesFilter {...filterProps} />
        <ReportesSelects {...filterProps} />
        
        <ReportesPreview
          bitacoraFiltrada={bitacoraFiltrada}
          bitacoraParaReporte={bitacoraParaReporte}
          registrosSeleccionados={registrosSeleccionados}
          toggleRegistroSeleccionado={toggleRegistroSeleccionado}
          fotosFiltradas={fotosFiltradas}
          fotosParaReporte={fotosParaReporte}
          fotosSeleccionadas={fotosSeleccionadas}
          toggleFotoSeleccionada={toggleFotoSeleccionada}
        />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
          <p className="text-[10px] text-gray-400">
            Se exportaran {bitacoraParaReporte.length} registros y {fotosParaReporte.length} imagenes.
          </p>
          <div className="flex flex-wrap gap-2">
            <button disabled={bitacoraParaReporte.length === 0} onClick={() => handleExport('pdf')} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-gray-200 px-3 text-[10px] font-semibold text-gray-600 transition-colors hover:border-[#9B0F06] hover:text-[#9B0F06] disabled:cursor-not-allowed disabled:opacity-40">
              <FileType size={12} /> PDF
            </button>
            <button disabled={bitacoraParaReporte.length === 0} onClick={() => handleExport('word')} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-gray-200 px-3 text-[10px] font-semibold text-gray-600 transition-colors hover:border-[#9B0F06] hover:text-[#9B0F06] disabled:cursor-not-allowed disabled:opacity-40">
              <FileText size={12} /> Word
            </button>
            <button disabled={bitacoraParaReporte.length === 0} onClick={() => handleExport('excel')} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#9B0F06] px-3 text-[10px] font-semibold text-white transition-colors hover:bg-[#5E0006] disabled:cursor-not-allowed disabled:opacity-40">
              <FileSpreadsheet size={12} /> Excel
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
