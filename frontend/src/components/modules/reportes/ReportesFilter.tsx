'use client'

import React, { useState, useEffect } from 'react'
import { Search, SlidersHorizontal, RotateCcw } from 'lucide-react'
import { PROYECTOS_MOCK } from '@/data/proyectos.mock'
import { Combobox } from '@/components/ui/Combobox'
import { useUIStore } from '@/stores/useUIStore'
import { esProyectoNoBorrador } from '@/lib/proyectos/estado'

interface ReportesSelectsProps {
  proyectoId: string
  handleCambiarProyecto: (val: string) => void
  fechaDesde: string
  setFechaDesde: (val: string) => void
  fechaHasta: string
  setFechaHasta: (val: string) => void
  renglonFiltro: string
  setRenglonFiltro: (val: string) => void
  renglonesProyectoActual: { cod: string; desc: string }[]
  todayStr?: string
  proyectosList?: any[]
  busqueda?: string
  setBusqueda?: (val: string) => void
}

export function ReportesSelects({
  proyectoId,
  handleCambiarProyecto,
  fechaDesde,
  setFechaDesde,
  fechaHasta,
  setFechaHasta,
  renglonFiltro,
  setRenglonFiltro,
  renglonesProyectoActual,
  proyectosList = PROYECTOS_MOCK,
  busqueda = '',
  setBusqueda,
}: ReportesSelectsProps) {
  const [sheetFiltrosAbierto, setSheetFiltrosAbierto] = useState(false)
  const setOcultarBottomNav = useUIStore((s) => s.setOcultarBottomNav)

  const abrirSheetFiltros = () => {
    setSheetFiltrosAbierto(true)
    setOcultarBottomNav(true)
  }

  const cerrarSheetFiltros = () => {
    setSheetFiltrosAbierto(false)
    setOcultarBottomNav(false)
  }

  useEffect(() => {
    return () => {
      setOcultarBottomNav(false)
    }
  }, [setOcultarBottomNav])

  const listaProyectosValidos = (proyectosList || PROYECTOS_MOCK).filter(esProyectoNoBorrador)

  const opcionesProyectos = [
    { value: 'todos', label: `Todos los proyectos (${listaProyectosValidos.length})` },
    ...listaProyectosValidos.map((p: any) => ({
      value: String(p.id),
      label: p.nombre || p.nombre_oficial || p.codigo || 'Proyecto',
    })),
  ]

  const opcionesRenglones = [
    { value: 'todos', label: 'Renglones: Todos' },
    ...renglonesProyectoActual.map((r) => ({
      value: r.cod,
      label: `${r.cod} - ${r.desc}`,
    })),
  ]

  // Contar filtros activos distintos a los valores por defecto
  const cantidadFiltrosActivos =
    (fechaDesde ? 1 : 0) + (fechaHasta ? 1 : 0) + (renglonFiltro !== 'todos' ? 1 : 0)

  const limpiarFiltrosSecundarios = () => {
    setFechaDesde('')
    setFechaHasta('')
    setRenglonFiltro('todos')
  }

  return (
    <div className="w-full font-[Poppins]">
      {/* =========================================================================
          1. BARRA DE FILTROS SUPERIOR MÓVIL (Estilo Bitácora / Img 2 de referencia)
          ========================================================================= */}
      <div className="sm:hidden mb-2.5">
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white border border-gray-200/80 shadow-2xs">
          {/* Input de Búsqueda */}
          <div className="relative flex-1 min-w-0">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Buscar..."
              value={busqueda}
              onChange={(e) => setBusqueda && setBusqueda(e.target.value)}
              className="filtro-control w-full h-[32px] border border-gray-200 rounded-lg pl-7 pr-2 text-[11px] font-normal placeholder:text-gray-400 bg-gray-50 focus:bg-white focus:outline-none focus:border-[#9B0F06] transition-colors"
            />
          </div>

          {/* Selector de Proyecto Combobox */}
          <div className="w-[145px] shrink-0">
            <Combobox
              options={opcionesProyectos}
              value={proyectoId}
              onChange={(val) => handleCambiarProyecto(val)}
              placeholder="Proyecto..."
              allowNumbers={true}
              inputClassName="filtro-control h-[32px] text-[10px] sm:text-[11px] !py-0 !rounded-lg font-normal pr-5 bg-white border-gray-200"
              dropdownClassName="z-50 shadow-2xl min-w-[260px] w-max max-w-[85vw]"
            />
          </div>

          {/* Botón de Filtros (Abre Drawer / Bottom Sheet) */}
          <button
            type="button"
            onClick={abrirSheetFiltros}
            className={`relative flex items-center justify-center h-[32px] w-[34px] shrink-0 rounded-lg border transition-all cursor-pointer shadow-2xs active:scale-95 ${
              cantidadFiltrosActivos > 0
                ? 'bg-[#9B0F06] border-[#9B0F06] text-white'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
            title="Abrir filtros de fecha y renglón"
          >
            <SlidersHorizontal size={14} className="stroke-[2.2]" />
            {cantidadFiltrosActivos > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white text-[#9B0F06] text-[9px] font-black border border-[#9B0F06] flex items-center justify-center shadow-xs">
                {cantidadFiltrosActivos}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. BOTTOM SHEET MODAL PARA MÓVIL (Slide de abajo hacia arriba)
          ========================================================================= */}
      {sheetFiltrosAbierto && (
        <div className="fixed inset-0 z-[9999] sm:hidden font-[Poppins]">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={cerrarSheetFiltros}
          />

          <div className="fixed inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-bottom duration-300">
            {/* Header del Sheet */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <button
                type="button"
                onClick={cerrarSheetFiltros}
                className="text-[11px] font-medium text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <div className="text-center">
                <h3 className="text-xs font-bold text-gray-900 leading-tight">Filtros de Reporte</h3>
                <span className="text-[9.5px] text-gray-400 font-normal">Personalizar fechas y renglones</span>
              </div>

              <button
                type="button"
                onClick={cerrarSheetFiltros}
                className="text-[11px] font-bold text-[#9B0F06] hover:text-[#7D0C05] transition-colors cursor-pointer"
              >
                Listo
              </button>
            </div>

            {/* Contenido scrolleable del Bottom Sheet */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              {/* Selector de Fechas */}
              <div className="space-y-1.5">
                <label data-filtro-label="true" className="filtro-label !text-[9.5px] font-bold text-gray-400 uppercase tracking-wider block">
                  Rango de Fechas
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[9.5px] text-gray-500 font-medium block mb-1">Fecha Inicio</span>
                    <div className="relative">
                      <input
                        type="date"
                        value={fechaDesde}
                        onChange={(e) => setFechaDesde(e.target.value)}
                        className="filtro-control w-full h-[34px] rounded-lg border border-gray-200 px-2 text-[10.5px] text-gray-800 bg-gray-50 focus:bg-white focus:border-[#9B0F06] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-[9.5px] text-gray-500 font-medium block mb-1">Fecha Fin</span>
                    <div className="relative">
                      <input
                        type="date"
                        value={fechaHasta}
                        onChange={(e) => setFechaHasta(e.target.value)}
                        className="filtro-control w-full h-[34px] rounded-lg border border-gray-200 px-2 text-[10.5px] text-gray-800 bg-gray-50 focus:bg-white focus:border-[#9B0F06] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Selector de Renglón */}
              <div className="space-y-1.5">
                <label data-filtro-label="true" className="filtro-label !text-[9.5px] font-bold text-gray-400 uppercase tracking-wider block">
                  Renglón de Trabajo
                </label>
                <Combobox
                  options={opcionesRenglones}
                  value={renglonFiltro}
                  onChange={(val) => setRenglonFiltro(val)}
                  placeholder="Renglones: Todos"
                  allowNumbers={true}
                  inputClassName="filtro-control h-[34px] text-[11px] !py-0 !rounded-lg font-normal pr-5 bg-gray-50 border-gray-200"
                  dropdownClassName="z-50 shadow-2xl min-w-full w-max max-w-[85vw]"
                />
              </div>

              {/* Botón para resetear filtros secundarios */}
              {cantidadFiltrosActivos > 0 && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={limpiarFiltrosSecundarios}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-600 hover:bg-gray-100 hover:text-red-700 transition-colors cursor-pointer"
                  >
                    <RotateCcw size={12} />
                    <span>Restablecer filtros secundarios</span>
                  </button>
                </div>
              )}
            </div>

            {/* Footer con botón de aplicar */}
            <div className="p-3 border-t border-gray-100 bg-gray-50/80">
              <button
                type="button"
                onClick={cerrarSheetFiltros}
                className="w-full py-2.5 rounded-xl bg-[#9B0F06] text-white text-xs font-bold hover:bg-[#7D0C05] transition-colors shadow-2xs active:scale-95 cursor-pointer text-center"
              >
                Aplicar Filtros ({cantidadFiltrosActivos} activos)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          3. VISTA EN ESCRITORIO (Grid estándar para pantallas medianas y grandes)
          ========================================================================= */}
      <div className="hidden sm:grid grid-cols-1 gap-2 sm:gap-2.5 sm:grid-cols-2 lg:grid-cols-4 overflow-visible">
        <div className="text-[11px] sm:text-[10px] font-semibold text-gray-600 sm:text-gray-500 flex flex-col min-w-0 font-[Poppins]">
          <span>Proyecto</span>
          <div className="mt-1">
            <Combobox
              options={opcionesProyectos}
              value={proyectoId}
              onChange={(val) => handleCambiarProyecto(val)}
              placeholder="Seleccionar proyecto..."
              allowNumbers={true}
              inputClassName="h-9 sm:h-8 w-full !rounded-lg sm:!rounded-md text-xs sm:text-[10.5px] font-medium bg-white border-gray-200 pr-5"
              dropdownClassName="z-50 shadow-2xl min-w-[280px] max-w-[420px]"
            />
          </div>
        </div>

        <label className="text-[11px] sm:text-[10px] font-semibold text-gray-600 sm:text-gray-500 flex flex-col min-w-0 font-[Poppins]">
          Fecha Inicio
          <input
            type="date"
            value={fechaDesde}
            onChange={(event) => setFechaDesde(event.target.value)}
            className="mt-1 h-9 sm:h-8 w-full min-w-0 box-border overflow-hidden rounded-lg sm:rounded-md border border-gray-200 px-2.5 sm:px-2 text-xs sm:text-[10.5px] text-gray-800 outline-none focus:border-[#9B0F06] bg-white"
          />
        </label>

        <label className="text-[11px] sm:text-[10px] font-semibold text-gray-600 sm:text-gray-500 flex flex-col min-w-0 font-[Poppins]">
          Fecha Fin
          <input
            type="date"
            value={fechaHasta}
            onChange={(event) => setFechaHasta(event.target.value)}
            className="mt-1 h-9 sm:h-8 w-full min-w-0 box-border overflow-hidden rounded-lg sm:rounded-md border border-gray-200 px-2.5 sm:px-2 text-xs sm:text-[10.5px] text-gray-800 outline-none focus:border-[#9B0F06] bg-white"
          />
        </label>

        <label className="text-[11px] sm:text-[10px] font-semibold text-gray-600 sm:text-gray-500 flex flex-col min-w-0 font-[Poppins]">
          Renglones
          <select
            value={renglonFiltro}
            onChange={(event) => setRenglonFiltro(event.target.value)}
            className="mt-1 h-9 sm:h-8 w-full rounded-lg sm:rounded-md border border-gray-200 px-2.5 sm:px-2 text-xs sm:text-[10.5px] text-gray-800 outline-none focus:border-[#9B0F06] cursor-pointer bg-white"
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
    </div>
  )
}
