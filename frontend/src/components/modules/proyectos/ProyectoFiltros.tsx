'use client'

import { Search, X } from 'lucide-react'
import { EstadoProyecto } from '@/types/proyecto'
import { useMemo, useState, useEffect } from 'react'
import { api } from '@/lib/api/cliente'

interface Departamento {
  id: string
  nombre: string
}

interface Municipio {
  id: string
  nombre: string
  departamento_id: string
}

interface ProyectoFiltrosProps {
  busqueda: string
  setBusqueda: (valor: string) => void
  estadoFiltro: EstadoProyecto | 'todos'
  setEstadoFiltro: (valor: EstadoProyecto | 'todos') => void
  filtroDepa: string
  setFiltroDepa: (valor: string) => void
  filtroMuni: string
  setFiltroMuni: (valor: string) => void
  filtroFechaInicio: string
  setFiltroFechaInicio: (valor: string) => void
  filtroFechaFin: string
  setFiltroFechaFin: (valor: string) => void
  onLimpiar: () => void
}

export default function ProyectoFiltros({
  busqueda,
  setBusqueda,
  estadoFiltro,
  setEstadoFiltro,
  filtroDepa,
  setFiltroDepa,
  filtroMuni,
  setFiltroMuni,
  filtroFechaInicio,
  setFiltroFechaInicio,
  filtroFechaFin,
  setFiltroFechaFin,
  onLimpiar,
}: ProyectoFiltrosProps) {
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [municipiosData, setMunicipiosData] = useState<Municipio[]>([])

  useEffect(() => {
    const controller = new AbortController()
    const fetchLocations = async () => {
      try {
        const [resDep, resMun] = await Promise.all([
          api.get('/mantenimiento/departamento?limite=500', { signal: controller.signal }),
          api.get('/mantenimiento/municipio?limite=1000', { signal: controller.signal })
        ])
        if (resDep.data?.success) setDepartamentos(resDep.data.data)
        if (resMun.data?.success) setMunicipiosData(resMun.data.data)
      } catch (error: any) {
        if (error.name !== 'CanceledError') {
          console.error('Error fetching locations:', error)
        }
      }
    }
    fetchLocations()
    return () => controller.abort()
  }, [])

  const estados: Array<{ value: EstadoProyecto | 'todos'; label: string }> = [
    { value: 'todos', label: 'Todos' },
    { value: 'borrador', label: 'Borradores' },
    { value: 'activo', label: 'Activo' },
    { value: 'en_revision', label: 'En Revisión' },
    { value: 'completado', label: 'Completado' },
    { value: 'cancelado', label: 'Cancelado' },
  ]

  const municipios = useMemo(() => {
    if (!filtroDepa) return []
    const dep = departamentos.find(d => d.nombre === filtroDepa)
    if (!dep) return []
    return municipiosData.filter(m => m.departamento_id === dep.id)
  }, [filtroDepa, departamentos, municipiosData])

  return (
    <div className="w-full rounded-lg border border-gray-200 bg-white p-2 shadow-sm font-[Poppins]">
      <div className="flex flex-wrap items-center gap-2">
        {/* Búsqueda */}
        <div className="relative min-w-[200px] flex-1">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar proyectos..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-md pl-8 pr-3 py-1.5 text-[11px] font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#9B0F06] focus:bg-white transition-colors"
          />
        </div>

        {/* Estado Dropdown */}
        <select
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value as EstadoProyecto | 'todos')}
          className="h-[32px] w-[140px] rounded-md border border-gray-200 bg-white px-2 text-[11px] font-medium text-gray-800 focus:border-[#9B0F06] focus:outline-none cursor-pointer"
        >
          {estados.map((estado) => (
            <option key={estado.value} value={estado.value}>{estado.label}</option>
          ))}
        </select>

        {/* Departamento Dropdown */}
        <select
          value={filtroDepa}
          onChange={(e) => {
            setFiltroDepa(e.target.value)
            setFiltroMuni('')
          }}
          className="h-[32px] w-[140px] rounded-md border border-gray-200 bg-white px-2 text-[11px] font-medium text-gray-800 focus:border-[#9B0F06] focus:outline-none cursor-pointer"
        >
          <option value="">Departamento ▼</option>
          {departamentos.map(d => (
            <option key={d.id} value={d.nombre}>{d.nombre}</option>
          ))}
        </select>

        {/* Municipio Dropdown */}
        <select
          value={filtroMuni}
          onChange={(e) => setFiltroMuni(e.target.value)}
          disabled={!filtroDepa}
          className="h-[32px] w-[140px] rounded-md border border-gray-200 bg-white px-2 text-[11px] font-medium text-gray-800 focus:border-[#9B0F06] focus:outline-none disabled:bg-gray-100 disabled:opacity-50 cursor-pointer"
        >
          <option value="">Municipio ▼</option>
          {municipios.map(m => (
            <option key={m.id} value={m.nombre}>{m.nombre}</option>
          ))}
        </select>

        {/* Fecha Inicio */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-md px-2 h-[32px] focus-within:border-[#9B0F06]">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Desde:</span>
          <input
            type="date"
            value={filtroFechaInicio}
            onChange={(e) => setFiltroFechaInicio(e.target.value)}
            className="border-none bg-transparent text-[11px] font-medium text-gray-700 focus:outline-none"
          />
        </div>

        {/* Fecha Fin */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-md px-2 h-[32px] focus-within:border-[#9B0F06]">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Hasta:</span>
          <input
            type="date"
            value={filtroFechaFin}
            onChange={(e) => setFiltroFechaFin(e.target.value)}
            className="border-none bg-transparent text-[11px] font-medium text-gray-700 focus:outline-none"
          />
        </div>

        {/* Limpiar */}
        <button
          type="button"
          onClick={onLimpiar}
          className="inline-flex shrink-0 items-center gap-1 rounded-md bg-gray-100 px-3 h-[32px] text-[10px] font-bold text-gray-600 transition-colors hover:bg-gray-200"
        >
          <X size={12} />
          Limpiar
        </button>
      </div>
    </div>
  )
}
