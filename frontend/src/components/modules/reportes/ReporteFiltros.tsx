'use client'

import { Search, X } from 'lucide-react'

interface ReporteFiltrosProps {
  busqueda: string
  tipo: string
  estado: string
  onBusquedaChange: (value: string) => void
  onTipoChange: (value: string) => void
  onEstadoChange: (value: string) => void
  onLimpiar: () => void
  totalReportes: number
}

export function ReporteFiltros({
  busqueda,
  tipo,
  estado,
  onBusquedaChange,
  onTipoChange,
  onEstadoChange,
  onLimpiar,
  totalReportes,
}: ReporteFiltrosProps) {
  const hayFiltrosActivos = busqueda || tipo !== '' || estado !== ''

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Buscador */}
      <div className="relative">
        <Search
          size={12}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Buscar reporte..."
          value={busqueda}
          onChange={(e) => onBusquedaChange(e.target.value)}
          className="pl-7 pr-3 py-1.5 border border-gray-200 rounded-lg text-[10px] text-gray-700 placeholder:text-gray-400 bg-white w-44 focus:outline-none focus:border-[#9B0F06]"
        />
      </div>

      {/* Select tipo */}
      <select
        value={tipo}
        onChange={(e) => onTipoChange(e.target.value)}
        className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-[10px] text-gray-700 bg-white focus:outline-none focus:border-[#9B0F06] w-44"
      >
        <option value="">Todos los tipos</option>
        <option value="avance_proyecto">Avance de Proyecto</option>
        <option value="bitacora_actividades">Bitácora de Actividades</option>
      </select>

      {/* Select estado */}
      <select
        value={estado}
        onChange={(e) => onEstadoChange(e.target.value)}
        className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-[10px] text-gray-700 bg-white focus:outline-none focus:border-[#9B0F06] w-36"
      >
        <option value="">Todos los estados</option>
        <option value="completado">Completado</option>
        <option value="generando">Generando</option>
        <option value="error">Error</option>
      </select>

      {/* Contador */}
      <span className="text-[10px] text-gray-400">
        {totalReportes} reporte{totalReportes !== 1 ? 's' : ''}
      </span>

      {/* Botón limpiar */}
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
