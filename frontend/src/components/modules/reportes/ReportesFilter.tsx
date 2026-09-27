'use client'

import React from 'react'
import { Filter } from 'lucide-react'
import { PROYECTOS_MOCK } from '@/data/proyectos.mock'

interface ReportesFilterProps {
  proyectoId: string
  handleCambiarProyecto: (val: string) => void
  fechaDesde: string
  setFechaDesde: (val: string) => void
  fechaHasta: string
  setFechaHasta: (val: string) => void
  renglonFiltro: string
  setRenglonFiltro: (val: string) => void
  renglonesProyectoActual: { cod: string; desc: string }[]
  todayStr: string
  seleccionarTodo: () => void
  limpiarSeleccion: () => void
  proyectosList?: any[]
}

export function ReportesFilter({
  seleccionarTodo, limpiarSeleccion
}: ReportesFilterProps) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Filter size={14} className="text-[#9B0F06]" />
        <div>
          <p className="text-sm font-semibold text-gray-800">Exportación de Documentos Formales</p>
          <p className="text-[10px] text-gray-400">Primero revisa y marca registros/fotos, luego elige formato.</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={seleccionarTodo} className="h-8 rounded-md border border-gray-200 px-3 text-[10px] font-semibold text-gray-600 transition-colors hover:border-[#9B0F06] hover:text-[#9B0F06]">
          Marcar todo
        </button>
        <button onClick={limpiarSeleccion} className="h-8 rounded-md border border-gray-200 px-3 text-[10px] font-semibold text-gray-600 transition-colors hover:border-[#9B0F06] hover:text-[#9B0F06]">
          Limpiar
        </button>
      </div>
    </div>
  )
}

export function ReportesSelects({
  proyectoId, handleCambiarProyecto, fechaDesde, setFechaDesde,
  fechaHasta, setFechaHasta, renglonFiltro, setRenglonFiltro,
  renglonesProyectoActual, todayStr, proyectosList = PROYECTOS_MOCK
}: ReportesFilterProps) {
  const listaProyectosValidos = (proyectosList || PROYECTOS_MOCK).filter(
    (p: any) => p.estado !== 'borrador' && p.estado_codigo !== 'borrador'
  )

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
      <label className="text-[10px] font-semibold text-gray-500 flex flex-col min-w-0">
        Proyecto
        <select
          value={proyectoId}
          onChange={(event) => handleCambiarProyecto(event.target.value)}
          className="mt-1 h-8 w-full rounded-md border border-gray-200 px-2 text-[10px] text-gray-800 outline-none focus:border-[#9B0F06] font-medium cursor-pointer"
        >
          {listaProyectosValidos.map((proyecto: any) => (
            <option key={proyecto.id} value={proyecto.id}>
              {proyecto.codigo || 'PROY'} · {proyecto.nombre || proyecto.nombre_oficial}
            </option>
          ))}
        </select>
      </label>

      <label className="text-[10px] font-semibold text-gray-500 flex flex-col min-w-0">
        Fecha Inicio
        <input
          type="date"
          value={fechaDesde}
          min={PROYECTOS_MOCK.find((p) => p.id === proyectoId)?.fechaInicio || '2025-01-20'}
          onChange={(event) => {
            const val = event.target.value
            const minFecha = PROYECTOS_MOCK.find((p) => p.id === proyectoId)?.fechaInicio || '2025-01-20'
            if (val >= minFecha) {
              setFechaDesde(val)
            }
          }}
          className="mt-1 h-8 w-full min-w-0 box-border overflow-hidden rounded-md border border-gray-200 px-2 text-[10px] text-gray-800 outline-none focus:border-[#9B0F06]"
        />
      </label>

      <label className="text-[10px] font-semibold text-gray-500 flex flex-col min-w-0">
        Fecha Fin
        <input
          type="date"
          value={fechaHasta}
          min={fechaDesde}
          max={todayStr}
          onChange={(event) => {
            const val = event.target.value
            if (val >= fechaDesde && val <= todayStr) {
              setFechaHasta(val)
            }
          }}
          className="mt-1 h-8 w-full min-w-0 box-border overflow-hidden rounded-md border border-gray-200 px-2 text-[10px] text-gray-800 outline-none focus:border-[#9B0F06]"
        />
      </label>

      <label className="text-[10px] font-semibold text-gray-500 flex flex-col min-w-0">
        Renglones
        <select
          value={renglonFiltro}
          onChange={(event) => setRenglonFiltro(event.target.value)}
          className="mt-1 h-8 w-full rounded-md border border-gray-200 px-2 text-[10px] text-gray-800 outline-none focus:border-[#9B0F06] cursor-pointer"
        >
          <option value="todos">Renglones: Todos</option>
          {renglonesProyectoActual.map((r) => (
            <option key={r.cod} value={r.cod}>
              {r.cod} - {r.desc}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
