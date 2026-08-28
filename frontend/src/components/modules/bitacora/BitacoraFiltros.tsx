'use client'

import { Search } from 'lucide-react'
import { TipoBitacora, EstadoBitacora } from '@/types/bitacora'
import { PROYECTOS_MOCK } from '@/data/proyectos.mock'

interface BitacoraFiltrosProps {
  busqueda: string
  onBusquedaChange: (busqueda: string) => void
  tipo: TipoBitacora | 'todos'
  onTipoChange: (tipo: TipoBitacora | 'todos') => void
  proyectoId: string
  onProyectoChange: (id: string) => void
  estado: EstadoBitacora | 'todos'
  onEstadoChange: (estado: EstadoBitacora | 'todos') => void
  fechaDesde: string
  onFechaDesdeChange: (fecha: string) => void
  fechaHasta: string
  onFechaHastaChange: (fecha: string) => void
}

export function BitacoraFiltros({
  busqueda,
  onBusquedaChange,
  tipo,
  onTipoChange,
  proyectoId,
  onProyectoChange,
  estado,
  onEstadoChange,
  fechaDesde,
  onFechaDesdeChange,
  fechaHasta,
  onFechaHastaChange,
}: BitacoraFiltrosProps) {
  return (
    <div className="w-full rounded-lg border border-gray-200 bg-white p-2 shadow-2xs mb-4 font-[Poppins]">
      {/* Barra de Filtros en una sola línea horizontal */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {/* Buscador */}
        <div className="relative min-w-[200px] flex-1">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar registros de bitácora..."
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-md pl-8 pr-2.5 py-1.5 text-[11px] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#9B0F06] focus:bg-white"
          />
        </div>

        {/* Tipo */}
        <select
          value={tipo}
          onChange={(e) => onTipoChange(e.target.value as TipoBitacora | 'todos')}
          className="bg-white border border-gray-200 rounded-md px-2 py-1.5 text-[11px] text-gray-800 focus:outline-none focus:border-[#9B0F06] cursor-pointer"
        >
          <option value="todos">Tipo: Todos</option>
          <option value="actividad">Actividad</option>
          <option value="incidente">Incidente</option>
          <option value="visita">Visita</option>
          <option value="inspeccion">Inspección</option>
          <option value="material">Material</option>
          <option value="observacion">Observación</option>
        </select>

        {/* Proyecto */}
        <select
          value={proyectoId}
          onChange={(e) => onProyectoChange(e.target.value)}
          className="bg-white border border-gray-200 rounded-md px-2 py-1.5 text-[11px] text-gray-800 focus:outline-none focus:border-[#9B0F06] cursor-pointer max-w-[200px] truncate"
        >
          <option value="">Todos los proyectos</option>
          {PROYECTOS_MOCK.map((proyecto) => (
            <option key={proyecto.id} value={proyecto.id}>
              {proyecto.codigo} · {proyecto.nombre}
            </option>
          ))}
        </select>

        {/* Fecha Desde */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-gray-500 font-medium">Desde:</span>
          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => onFechaDesdeChange(e.target.value)}
            className="bg-white border border-gray-200 rounded-md px-2 py-1 text-[11px] text-gray-800 focus:outline-none focus:border-[#9B0F06]"
          />
        </div>

        {/* Fecha Hasta */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-gray-500 font-medium">Hasta:</span>
          <input
            type="date"
            value={fechaHasta}
            onChange={(e) => onFechaHastaChange(e.target.value)}
            className="bg-white border border-gray-200 rounded-md px-2 py-1 text-[11px] text-gray-800 focus:outline-none focus:border-[#9B0F06]"
          />
        </div>

        {/* Estado */}
        <select
          value={estado}
          onChange={(e) => onEstadoChange(e.target.value as EstadoBitacora | 'todos')}
          className="bg-white border border-gray-200 rounded-md px-2 py-1.5 text-[11px] text-gray-800 focus:outline-none focus:border-[#9B0F06] cursor-pointer"
        >
          <option value="todos">Estado: Todos</option>
          <option value="pendiente">Pendiente</option>
          <option value="en_revision">En Revisión</option>
          <option value="aprobado">Aprobado</option>
          <option value="archivado">Archivado</option>
        </select>
      </div>
    </div>
  )
}
