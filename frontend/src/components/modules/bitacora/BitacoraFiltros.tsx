'use client'

import { Search, X } from 'lucide-react'
import { EstadoBitacora } from '@/types/bitacora'
import { useEffect, useState, useMemo } from 'react'
import { apiGetDeduplicado } from '@/lib/api/cliente'

interface BitacoraFiltrosProps {
  busqueda: string
  onBusquedaChange: (busqueda: string) => void
  tipo: string
  onTipoChange: (tipo: string) => void
  proyectoId: string
  onProyectoChange: (id: string) => void
  estado: EstadoBitacora | 'todos'
  onEstadoChange: (estado: EstadoBitacora | 'todos') => void
  fechaDesde: string
  onFechaDesdeChange: (fecha: string) => void
  fechaHasta: string
  onFechaHastaChange: (fecha: string) => void
  rolFiltro: string
  onRolChange: (rol: string) => void
  usuarioFiltro: string
  onUsuarioChange: (usuario: string) => void
  onLimpiar?: () => void
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
  rolFiltro,
  onRolChange,
  usuarioFiltro,
  onUsuarioChange,
  onLimpiar,
}: BitacoraFiltrosProps) {
  const [proyectosActivos, setProyectosActivos] = useState<any[]>([])
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [renglonesDisponibles, setRenglonesDisponibles] = useState<any[]>([])

  useEffect(() => {
    if (!proyectoId) {
      setRenglonesDisponibles([])
      return
    }
    const cargarRenglonesProyecto = async () => {
      try {
        const res = await apiGetDeduplicado(`/proyectos/${proyectoId}`)
        if (res.data?.success && res.data.data) {
          const proy = res.data.data
          const rengs = proy.renglones_sabana || proy.renglones || []
          if (Array.isArray(rengs)) {
            setRenglonesDisponibles(rengs.map(r => r.codigoDGC ? `${r.codigoDGC} - ${r.descripcion}` : (r.descripcion || r.nombre || 'Renglón sin nombre')))
          }
        }
      } catch (error) {
        console.error('Error cargando renglones del proyecto:', error)
      }
    }
    cargarRenglonesProyecto()
  }, [proyectoId])

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [resProy, resUsu] = await Promise.all([
          apiGetDeduplicado('/proyectos'),
          apiGetDeduplicado('/usuarios'),
        ])
        if (resProy.data?.success) {
          setProyectosActivos(resProy.data.data.filter((p: any) => p.estado === 'activo' || p.estado_codigo === 'activo'))
        }
        if (resUsu.data?.success) {
          setUsuarios(resUsu.data.data.filter((u: any) => u.activo !== false && u.estado !== 'Desactivado'))
        }
      } catch (e) {
        console.error('Error cargando filtros:', e)
      }
    }
    cargarDatos()
    
    // Renglones hardcodeados para el desglose (idealmente vendrían del backend)
    setRenglonesDisponibles([
      'Descapote', 'Movimiento de tierras', 'Sub-base', 'Base granular',
      'Carpeta asfáltica', 'Cunetas', 'Alcantarillas', 'Señalización',
      'Acero de refuerzo', 'Concreto estructural'
    ])
  }, [])

  const usuariosFiltrados = useMemo(() => {
    if (!rolFiltro || rolFiltro === 'todos') return []
    return usuarios.filter((u) => {
      const uRol = (u.cargo || u.rol || '').toLowerCase()
      const searchRol = rolFiltro.toLowerCase()
      if (searchRol.includes('admin') && uRol.includes('admin')) return true
      if (searchRol.includes('residente') && (uRol.includes('residente') || uRol.includes('ingeniero'))) return true
      return uRol.includes(searchRol)
    })
  }, [usuarios, rolFiltro])

  return (
    <div className="w-full rounded-lg border border-gray-200 bg-white p-2 shadow-sm mb-4 font-[Poppins]">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {/* Buscador */}
        <div className="relative min-w-[200px] flex-1">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar registros de bitácora..."
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-md pl-8 pr-3 py-1.5 text-[11px] font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#9B0F06] focus:bg-white transition-colors"
          />
        </div>

        {/* Proyectos (Solo Activos) */}
        <select
          value={proyectoId}
          onChange={(e) => onProyectoChange(e.target.value)}
          className="h-[32px] w-[140px] rounded-md border border-gray-200 bg-white px-2 text-[11px] font-medium text-gray-800 focus:border-[#9B0F06] focus:outline-none cursor-pointer truncate"
        >
          <option value="">Proyectos Activos</option>
          {proyectosActivos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.codigo || 'PROY'} - {p.nombre || p.nombre_oficial}
            </option>
          ))}
        </select>

        {/* Rol */}
        <select
          value={rolFiltro}
          onChange={(e) => {
            onRolChange(e.target.value)
            onUsuarioChange('')
          }}
          className="h-[32px] w-[130px] rounded-md border border-gray-200 bg-white px-2 text-[11px] font-medium text-gray-800 focus:border-[#9B0F06] focus:outline-none cursor-pointer"
        >
          <option value="todos">Rol: Todos</option>
          <option value="Administrador">Administrador</option>
          <option value="Ingeniero Residente">Ingeniero Residente</option>
        </select>

        {/* Usuarios (Solo si hay rol seleccionado) */}
        {rolFiltro && rolFiltro !== 'todos' && (
          <select
            value={usuarioFiltro}
            onChange={(e) => onUsuarioChange(e.target.value)}
            className="h-[32px] w-[140px] rounded-md border border-gray-200 bg-white px-2 text-[11px] font-medium text-gray-800 focus:border-[#9B0F06] focus:outline-none cursor-pointer truncate"
          >
            <option value="">Usuarios ({rolFiltro})</option>
            {usuariosFiltrados.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre || `${u.primer_nombre || ''} ${u.primer_apellido || ''}`}
              </option>
            ))}
          </select>
        )}

        {/* Tipo (Renglón) */}
        <select
          value={tipo}
          onChange={(e) => onTipoChange(e.target.value)}
          className="h-[32px] w-[130px] rounded-md border border-gray-200 bg-white px-2 text-[11px] font-medium text-gray-800 focus:border-[#9B0F06] focus:outline-none cursor-pointer"
        >
          <option value="todos">Renglón: Todos</option>
          {renglonesDisponibles.map((r, i) => (
            <option key={i} value={r}>{r}</option>
          ))}
        </select>

        {/* Fecha Inicio */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-md px-2 h-[32px] focus-within:border-[#9B0F06]">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Desde:</span>
          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => onFechaDesdeChange(e.target.value)}
            className="border-none bg-transparent text-[11px] font-medium text-gray-700 focus:outline-none"
          />
        </div>

        {/* Fecha Fin */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-md px-2 h-[32px] focus-within:border-[#9B0F06]">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Hasta:</span>
          <input
            type="date"
            value={fechaHasta}
            min={fechaDesde || undefined}
            onChange={(e) => onFechaHastaChange(e.target.value)}
            className="border-none bg-transparent text-[11px] font-medium text-gray-700 focus:outline-none"
          />
        </div>

        {/* Estado */}
        <select
          value={estado}
          onChange={(e) => onEstadoChange(e.target.value as EstadoBitacora | 'todos')}
          className="h-[32px] w-[110px] rounded-md border border-gray-200 bg-white px-2 text-[11px] font-medium text-gray-800 focus:border-[#9B0F06] focus:outline-none cursor-pointer"
        >
          <option value="todos">Estado: Todos</option>
          <option value="pendiente">Pendiente</option>
          <option value="aprobado">Aprobado</option>
        </select>

        {/* Limpiar */}
        {(busqueda || tipo !== 'todos' || proyectoId || estado !== 'todos' || fechaDesde || fechaHasta || rolFiltro !== 'todos' || usuarioFiltro) && (
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
