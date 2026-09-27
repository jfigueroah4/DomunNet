'use client'

import { Search, X } from 'lucide-react'
import { TipoFotografia } from '@/types/fotografia'
import { useMemo } from 'react'

export interface RenglonOpcion {
  codigo?: string
  id: string
  descripcion: string
}

export interface UsuarioOpcion {
  id: string
  nombre: string
  rol?: string
}

interface FotografiaFiltrosProps {
  busqueda: string
  tipo: string
  renglonFiltro: string
  rolFiltro: string
  usuarioFiltro: string
  fechaDesde: string
  fechaHasta: string
  onBusquedaChange: (value: string) => void
  onTipoChange: (value: string) => void
  onRenglonChange: (value: string) => void
  onRolChange: (value: string) => void
  onUsuarioChange: (value: string) => void
  onFechaDesdeChange: (value: string) => void
  onFechaHastaChange: (value: string) => void
  onLimpiar: () => void
  totalFotos: number
  tiposDisponibles?: TipoFotografia[]
  renglonesDisponibles?: RenglonOpcion[]
  usuariosDisponibles?: UsuarioOpcion[]
  rolesDisponibles?: string[]
}

export function FotografiaFiltros({
  busqueda,
  tipo,
  renglonFiltro,
  rolFiltro,
  usuarioFiltro,
  fechaDesde,
  fechaHasta,
  onBusquedaChange,
  onTipoChange,
  onRenglonChange,
  onRolChange,
  onUsuarioChange,
  onFechaDesdeChange,
  onFechaHastaChange,
  onLimpiar,
  totalFotos,
  tiposDisponibles = ['avance', 'incidente', 'material', 'inspeccion', 'antes_despues', 'general'],
  renglonesDisponibles = [],
  usuariosDisponibles = [],
  rolesDisponibles = [],
}: FotografiaFiltrosProps) {
  const hayFiltrosActivos =
    busqueda !== '' ||
    tipo !== '' ||
    renglonFiltro !== '' ||
    rolFiltro !== '' ||
    usuarioFiltro !== '' ||
    fechaDesde !== '' ||
    fechaHasta !== ''

  // Filtrar usuarios según el rol seleccionado
  const usuariosFiltrados = useMemo(() => {
    if (!rolFiltro) return usuariosDisponibles
    return usuariosDisponibles.filter((u) => {
      const uRol = (u.rol || '').toLowerCase()
      return uRol.includes(rolFiltro.toLowerCase())
    })
  }, [usuariosDisponibles, rolFiltro])

  const handleFechaDesdeChangeInternal = (val: string) => {
    onFechaDesdeChange(val)
    if (fechaHasta && val && new Date(fechaHasta) < new Date(val)) {
      onFechaHastaChange('')
    }
  }

  const handleFechaHastaChangeInternal = (val: string) => {
    if (fechaDesde && val && new Date(val) < new Date(fechaDesde)) {
      onFechaHastaChange(fechaDesde)
      return
    }
    onFechaHastaChange(val)
  }

  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm font-[Poppins] relative z-20">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-bold text-gray-400 shrink-0 px-1">
          {totalFotos} foto{totalFotos !== 1 ? 's' : ''}
        </span>

        {/* Buscador */}
        <div className="relative min-w-[170px] flex-1">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Buscar fotografía o etiqueta..."
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-md pl-8 pr-3 py-1.5 text-[11px] font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#9B0F06] focus:bg-white transition-colors"
          />
        </div>

        {/* Select Tipo */}
        <select
          value={tipo}
          onChange={(e) => onTipoChange(e.target.value)}
          className="h-[32px] rounded-md border border-gray-200 bg-white px-2 text-[11px] font-medium text-gray-800 focus:border-[#9B0F06] focus:outline-none cursor-pointer min-w-[125px]"
        >
          <option value="">Todos los tipos</option>
          {(tiposDisponibles ?? []).map((t) => {
            const labels: Record<TipoFotografia, string> = {
              avance: 'Avance',
              incidente: 'Incidente',
              material: 'Material',
              inspeccion: 'Inspección',
              antes_despues: 'Antes / Después',
              general: 'General',
            }
            return (
              <option key={t} value={t}>
                {labels[t] || t}
              </option>
            )
          })}
        </select>

        {/* Select Renglón según el proyecto */}
        <select
          value={renglonFiltro}
          onChange={(e) => onRenglonChange(e.target.value)}
          className="h-[32px] rounded-md border border-gray-200 bg-white px-2 text-[11px] font-medium text-gray-800 focus:border-[#9B0F06] focus:outline-none cursor-pointer max-w-[190px]"
        >
          <option value="">Todos los renglones</option>
          {renglonesDisponibles.map((r) => (
            <option key={r.id || r.codigo} value={r.codigo || r.id}>
              {r.codigo ? `${r.codigo} - ` : ''}{r.descripcion}
            </option>
          ))}
        </select>

        {/* Select Rol */}
        <select
          value={rolFiltro}
          onChange={(e) => {
            onRolChange(e.target.value)
            onUsuarioChange('') // reset usuario si cambia rol
          }}
          className="h-[32px] rounded-md border border-gray-200 bg-white px-2 text-[11px] font-medium text-gray-800 focus:border-[#9B0F06] focus:outline-none cursor-pointer min-w-[130px]"
        >
          <option value="">Todos los roles</option>
          {rolesDisponibles.map((rol) => (
            <option key={rol} value={rol}>
              {rol}
            </option>
          ))}
        </select>

        {/* Select Usuario (depende del rol) */}
        <select
          value={usuarioFiltro}
          onChange={(e) => onUsuarioChange(e.target.value)}
          className="h-[32px] rounded-md border border-gray-200 bg-white px-2 text-[11px] font-medium text-gray-800 focus:border-[#9B0F06] focus:outline-none cursor-pointer min-w-[140px]"
        >
          <option value="">Todos los usuarios</option>
          {usuariosFiltrados.map((u) => (
            <option key={u.id} value={u.nombre || u.id}>
              {u.nombre}
            </option>
          ))}
        </select>

        {/* Rango de fechas — Desde */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-md px-2 h-[32px] focus-within:border-[#9B0F06] transition-colors">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Desde:</span>
          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => handleFechaDesdeChangeInternal(e.target.value)}
            className="border-none bg-transparent text-[11px] font-medium text-gray-700 focus:outline-none"
          />
        </div>

        {/* Rango de fechas — Hasta */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-md px-2 h-[32px] focus-within:border-[#9B0F06] transition-colors">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Hasta:</span>
          <input
            type="date"
            value={fechaHasta}
            min={fechaDesde || undefined}
            onChange={(e) => handleFechaHastaChangeInternal(e.target.value)}
            className="border-none bg-transparent text-[11px] font-medium text-gray-700 focus:outline-none"
          />
        </div>

        {/* Botón limpiar */}
        {hayFiltrosActivos && (
          <button
            type="button"
            onClick={onLimpiar}
            className="inline-flex shrink-0 items-center gap-1 rounded-md bg-gray-100 px-3 h-[32px] text-[10px] font-bold text-gray-600 transition-colors hover:bg-gray-200 cursor-pointer"
          >
            <X size={12} />
            Limpiar
          </button>
        )}
      </div>
    </div>
  )
}
