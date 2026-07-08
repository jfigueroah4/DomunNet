'use client'

import { Search } from 'lucide-react'
import { EstadoProyecto } from '@/types/proyecto'

interface ProyectoFiltrosProps {
  busqueda: string
  setBusqueda: (valor: string) => void
  estadoFiltro: EstadoProyecto | 'todos'
  setEstadoFiltro: (valor: EstadoProyecto | 'todos') => void
  resultados: number
}

export default function ProyectoFiltros({
  busqueda,
  setBusqueda,
  estadoFiltro,
  setEstadoFiltro,
  resultados,
}: ProyectoFiltrosProps) {
  const estados: Array<{ value: EstadoProyecto | 'todos'; label: string }> = [
    { value: 'todos', label: 'Todos' },
    { value: 'borrador', label: 'Borrador' },
    { value: 'activo', label: 'Activo' },
    { value: 'en_revision', label: 'En Revision' },
    { value: 'completado', label: 'Completado' },
    { value: 'cancelado', label: 'Cancelado' },
  ]

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-[230px]">
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <Search size={15} className="text-[#9AA2B5]" />
        </div>
        <input
          type="text"
          placeholder="Buscar proyectos..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="h-[36px] w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-[11px] font-medium text-[#07152B] placeholder:text-[#9AA2B5] focus:border-[#9B0F06] focus:outline-none focus:ring-1 focus:ring-[#9B0F06]"
        />
      </div>

      <select
        value={estadoFiltro}
        onChange={(e) => setEstadoFiltro(e.target.value as EstadoProyecto | 'todos')}
        className="h-[36px] w-36 rounded-lg border border-gray-200 bg-white px-4 text-[11px] font-medium text-[#07152B] focus:border-[#9B0F06] focus:outline-none focus:ring-1 focus:ring-[#9B0F06]"
      >
        {estados.map((estado) => (
          <option key={estado.value} value={estado.value}>
            {estado.label}
          </option>
        ))}
      </select>

      <span className="whitespace-nowrap text-[11px] font-medium text-[#969DB5]">
        {resultados} proyectos encontrados
      </span>
    </div>
  )
}
