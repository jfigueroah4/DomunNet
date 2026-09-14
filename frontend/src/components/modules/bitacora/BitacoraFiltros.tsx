'use client'

import { Search, X } from 'lucide-react'
import { EstadoBitacora } from '@/types/bitacora'
import { useEffect, useState, useMemo } from 'react'
import { apiGetDeduplicado } from '@/lib/api/cliente'
import { Combobox } from '@/components/ui/Combobox'

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
  usuarioFiltro,
  onUsuarioChange,
  onLimpiar,
}: BitacoraFiltrosProps) {
  const [proyectosActivos, setProyectosActivos] = useState<any[]>([])
  const [todosUsuarios, setTodosUsuarios] = useState<any[]>([])
  const [todosRenglonesSistema, setTodosRenglonesSistema] = useState<any[]>([])
  const [proyectoSeleccionadoObj, setProyectoSeleccionadoObj] = useState<any>(null)

  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        const [resProy, resUsu, resReng] = await Promise.all([
          apiGetDeduplicado('/proyectos'),
          apiGetDeduplicado('/usuarios'),
          apiGetDeduplicado('/mantenimiento/renglon_trabajo_catalogo?limite=300'),
        ])
        if (resProy.data?.success) {
          setProyectosActivos(resProy.data.data.filter((p: any) => p.estado === 'activo' || p.estado_codigo === 'activo'))
        }
        if (resUsu.data?.success) {
          setTodosUsuarios(resUsu.data.data.filter((u: any) => u.activo !== false && u.estado !== 'Desactivado'))
        }
        if (resReng.data?.data) {
          setTodosRenglonesSistema(resReng.data.data)
        }
      } catch (e) {
        console.error('Error cargando filtros de bitácora:', e)
      }
    }
    cargarDatosIniciales()
  }, [])

  useEffect(() => {
    if (!proyectoId) {
      setProyectoSeleccionadoObj(null)
      return
    }
    apiGetDeduplicado(`/proyectos/${proyectoId}`).then((res) => {
      if (res.data?.success && res.data.data) {
        setProyectoSeleccionadoObj(res.data.data)
      }
    }).catch(() => {})
  }, [proyectoId])

  // Renglones disponibles: del proyecto seleccionado si existe, o del sistema completo
  const opcionesRenglones = useMemo(() => {
    if (proyectoSeleccionadoObj) {
      const list = proyectoSeleccionadoObj.renglones_sabana || proyectoSeleccionadoObj.renglones || []
      if (Array.isArray(list) && list.length > 0) {
        return list.map((r: any) => ({
          value: r.codigoDGC || r.codigo || r.descripcion,
          label: `[${r.codigoDGC || r.codigo || 'R'}] ${r.descripcion || r.nombre}`
        }))
      }
    }
    return todosRenglonesSistema.map((r: any) => ({
      value: r.codigo || r.codigoDGC || r.descripcion,
      label: `[${r.codigo || r.codigoDGC || 'R'}] ${r.descripcion}`
    }))
  }, [proyectoSeleccionadoObj, todosRenglonesSistema])

  // Usuarios disponibles: equipo del proyecto si hay proyecto seleccionado, o todos los usuarios
  const opcionesUsuarios = useMemo(() => {
    if (proyectoSeleccionadoObj && Array.isArray(proyectoSeleccionadoObj.equipo) && proyectoSeleccionadoObj.equipo.length > 0) {
      return proyectoSeleccionadoObj.equipo.map((m: any) => ({
        value: m.id || m.nombre,
        label: `${m.nombre} (${m.rol || 'Equipo'})`
      }))
    }
    return todosUsuarios.map((u: any) => {
      const nombre = u.nombre || `${u.primer_nombre || ''} ${u.primer_apellido || ''}`.trim() || u.correo
      const rol = u.cargo || u.rol || 'Usuario'
      return {
        value: u.id,
        label: `${nombre} - ${rol}`
      }
    })
  }, [proyectoSeleccionadoObj, todosUsuarios])

  return (
    <div className="w-full rounded-lg border border-gray-200 bg-white p-2 shadow-sm mb-4 font-[Poppins]">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {/* Buscador */}
        <div className="relative min-w-[180px] flex-1">
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
          className="h-[32px] w-[150px] rounded-md border border-gray-200 bg-white px-2 text-[11px] font-medium text-gray-800 focus:border-[#9B0F06] focus:outline-none cursor-pointer truncate"
        >
          <option value="">Proyectos Activos</option>
          {proyectosActivos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.codigo || 'PROY'} - {p.nombre || p.nombre_oficial}
            </option>
          ))}
        </select>

        {/* Usuario Combobox */}
        <div className="w-[180px]">
          <Combobox
            options={opcionesUsuarios}
            value={usuarioFiltro}
            onChange={(val) => onUsuarioChange(val)}
            placeholder={proyectoId ? "Usuario del Proyecto..." : "Buscar Usuario..."}
          />
        </div>

        {/* Renglón Combobox */}
        <div className="w-[180px]">
          <Combobox
            options={opcionesRenglones}
            value={tipo}
            onChange={(val) => onTipoChange(val)}
            placeholder={proyectoId ? "Renglón del Proyecto..." : "Buscar Renglón..."}
          />
        </div>

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
        {(busqueda || (tipo && tipo !== 'todos') || proyectoId || (estado && estado !== 'todos') || fechaDesde || fechaHasta || usuarioFiltro) && (
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
