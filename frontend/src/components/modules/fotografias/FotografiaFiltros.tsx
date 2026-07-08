'use client'

import { Search, X, Calendar } from 'lucide-react'
import { TipoFotografia } from '@/types/fotografia'

interface FotografiaFiltrosProps {
  busqueda: string
  tipo: string
  proyecto: string
  bitacora: string
  fechaDesde: string
  fechaHasta: string
  onBusquedaChange: (value: string) => void
  onTipoChange: (value: string) => void
  onProyectoChange: (value: string) => void
  onBitacoraChange: (value: string) => void
  onFechaDesdeChange: (value: string) => void
  onFechaHastaChange: (value: string) => void
  onLimpiar: () => void
  totalFotos: number
  tiposDisponibles: TipoFotografia[]
  proyectosDisponibles: string[]
  bitacorasDisponibles: string[]
}

export function FotografiaFiltros({
  busqueda,
  tipo,
  proyecto,
  bitacora,
  fechaDesde,
  fechaHasta,
  onBusquedaChange,
  onTipoChange,
  onProyectoChange,
  onBitacoraChange,
  onFechaDesdeChange,
  onFechaHastaChange,
  onLimpiar,
  totalFotos,
  tiposDisponibles,
  proyectosDisponibles,
  bitacorasDisponibles,
}: FotografiaFiltrosProps) {
  const hayFiltrosActivos =
    busqueda ||
    tipo !== '' ||
    proyecto !== 'todos' ||
    bitacora !== '' ||
    fechaDesde ||
    fechaHasta

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[10px] font-semibold text-gray-500">
        {totalFotos} foto{totalFotos !== 1 ? 's' : ''}
      </span>

      {/* Buscador */}
      <div className="relative">
        <Search
          size={12}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Buscar fotografía..."
          value={busqueda}
          onChange={(e) => onBusquedaChange(e.target.value)}
          className="pl-7 pr-3 py-1.5 border border-gray-200 rounded-lg text-[10px] text-gray-700 placeholder:text-gray-400 bg-white w-44 focus:outline-none focus:border-[#9B0F06]"
        />
      </div>

      {/* Select tipo */}
      <select
        value={tipo}
        onChange={(e) => onTipoChange(e.target.value)}
        className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-[10px] text-gray-700 bg-white focus:outline-none focus:border-[#9B0F06] w-36"
      >
        <option value="">Todos los tipos</option>
        {tiposDisponibles.map((t) => {
          const labels: Record<TipoFotografia, string> = {
            avance: 'Avance',
            incidente: 'Incidente',
            material: 'Material',
            inspeccion: 'Inspección',
            antes_despues: 'Antes/Después',
            general: 'General',
          }
          return (
            <option key={t} value={t}>
              {labels[t]}
            </option>
          )
        })}
      </select>

      {/* Select proyecto */}
      <select
        value={proyecto}
        onChange={(e) => onProyectoChange(e.target.value)}
        className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-[10px] text-gray-700 bg-white focus:outline-none focus:border-[#9B0F06] w-44"
      >
        <option value="todos">Todos los proyectos</option>
        {proyectosDisponibles.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      {/* Select bitácora */}
      <select
        value={bitacora}
        onChange={(e) => onBitacoraChange(e.target.value)}
        className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-[10px] text-gray-700 bg-white focus:outline-none focus:border-[#9B0F06] w-44"
      >
        <option value="">Todas las bitácoras</option>
        {bitacorasDisponibles.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </select>

      {/* Rango de fechas — Desde */}
      <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white">
        <Calendar size={11} className="text-gray-400 flex-shrink-0" />
        <span className="text-[9px] text-gray-400">Desde</span>
        <input
          type="date"
          value={fechaDesde}
          onChange={(e) => onFechaDesdeChange(e.target.value)}
          className="text-[10px] text-gray-700 bg-transparent focus:outline-none w-28"
        />
      </div>

      {/* Rango de fechas — Hasta */}
      <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white">
        <Calendar size={11} className="text-gray-400 flex-shrink-0" />
        <span className="text-[9px] text-gray-400">Hasta</span>
        <input
          type="date"
          value={fechaHasta}
          onChange={(e) => onFechaHastaChange(e.target.value)}
          className="text-[10px] text-gray-700 bg-transparent focus:outline-none w-28"
        />
      </div>

      {/* Botón limpiar — solo si hay filtros activos */}
      {hayFiltrosActivos && (
        <button
          onClick={onLimpiar}
          className="flex items-center gap-1 text-[9px] text-gray-400 hover:text-[#9B0F06] transition-colors"
        >
          <X size={11} />
          Limpiar
        </button>
      )}
    </div>
  )
}
