'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { TipoRegistro, EstadoRegistro } from '@/types/bitacora'

interface BitacoraFiltrosProps {
  onSearch?: (query: string) => void
  onTipoChange?: (tipo: TipoRegistro | 'todos') => void
  onEstadoChange?: (estado: EstadoRegistro | 'todos') => void
  onProyectoChange?: (proyecto: string | 'todos') => void
  totalRegistros: number
}

const proyectos = [
  'Edificio Residencial Las Palmas',
  'Remodelación Hospital General',
  'Torre Empresarial Norte',
  'Centro Comercial Zona 4',
  'Urbanización Los Pinos',
  'Puente Vehicular Km 45',
]

export default function BitacoraFiltros({
  onSearch,
  onTipoChange,
  onEstadoChange,
  onProyectoChange,
  totalRegistros,
}: BitacoraFiltrosProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    onSearch?.(value)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-3 flex items-center gap-4 mb-4 border border-gray-100">
      {/* Search */}
      <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5 flex-1 max-w-xs">
        <Search size={12} className="text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Buscar registros..."
          className="bg-transparent outline-none text-[10px] w-full placeholder-gray-400"
        />
      </div>

      {/* Tipo */}
      <select
        onChange={(e) => onTipoChange?.(e.target.value as TipoRegistro | 'todos')}
        className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-[10px] text-gray-600 focus:outline-none focus:border-[#9B0F06]"
      >
        <option value="todos">Todos los tipos</option>
        <option value="actividad">Actividad</option>
        <option value="incidente">Incidente</option>
        <option value="visita">Visita</option>
        <option value="inspeccion">Inspección</option>
        <option value="observacion">Observación</option>
        <option value="material">Material</option>
      </select>

      {/* Estado */}
      <select
        onChange={(e) => onEstadoChange?.(e.target.value as EstadoRegistro | 'todos')}
        className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-[10px] text-gray-600 focus:outline-none focus:border-[#9B0F06]"
      >
        <option value="todos">Todos los estados</option>
        <option value="pendiente">Pendiente</option>
        <option value="en_proceso">En Proceso</option>
        <option value="resuelto">Resuelto</option>
        <option value="cerrado">Cerrado</option>
      </select>

      {/* Proyecto */}
      <select
        onChange={(e) => onProyectoChange?.(e.target.value)}
        className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-[10px] text-gray-600 focus:outline-none focus:border-[#9B0F06]"
      >
        <option value="todos">Todos los proyectos</option>
        {proyectos.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      {/* Contador */}
      <div className="ml-auto text-[10px] text-gray-400 font-medium">
        {totalRegistros} {totalRegistros === 1 ? 'registro' : 'registros'}
      </div>
    </div>
  )
}
