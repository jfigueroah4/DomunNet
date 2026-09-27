'use client'

import { Search, X } from 'lucide-react'
import { EstadoBitacora } from '@/types/bitacora'
import { useEffect, useState, useMemo } from 'react'
import { apiGetDeduplicado } from '@/lib/api/cliente'
import { Combobox } from '@/components/ui/Combobox'

import { useAuthStore } from '@/stores/useAuthStore'

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
  rolFiltro?: string
  onRolChange?: (rol: string) => void
  esRolCampoRestringido?: boolean
  onLimpiar?: () => void
  registrosBitacora?: any[]
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
  rolFiltro = 'todos',
  onRolChange,
  esRolCampoRestringido = false,
  onLimpiar,
  registrosBitacora = [],
}: BitacoraFiltrosProps) {
  const [proyectosActivos, setProyectosActivos] = useState<any[]>([])
  const [proyectoSeleccionadoObj, setProyectoSeleccionadoObj] = useState<any>(null)

  const user = useAuthStore((s) => s.profile)
  const rolUsuario = (user?.rol || '').toLowerCase()
  const esAdmin = rolUsuario.includes('admin') || rolUsuario.includes('director')
  const esResidente = rolUsuario.includes('residente')
  const esRestringido = esRolCampoRestringido || (!esAdmin && !esResidente)

  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        const [resProy, resPU] = await Promise.all([
          apiGetDeduplicado('/proyectos'),
          apiGetDeduplicado('/mantenimiento/proyecto_usuario').catch(() => ({ data: { data: [] } }))
        ])

        if (resProy.data?.success && Array.isArray(resProy.data.data)) {
          let activos = resProy.data.data.filter(
            (p: any) =>
              (p.estado === 'activo' || p.estado_codigo === 'activo') &&
              p.estado !== 'borrador' &&
              p.estado_codigo !== 'borrador'
          )

          if (esRestringido && user?.id) {
            const puList = Array.isArray(resPU.data?.data) ? resPU.data.data : []
            const asignadosIds = new Set<string>()

            puList.forEach((pu: any) => {
              if (String(pu.usuario_id || pu.usuarioId) === String(user.id)) {
                asignadosIds.add(String(pu.proyecto_id || pu.proyectoId))
              }
            })

            activos = activos.filter((p: any) => {
              const pIdStr = String(p.id)
              if (asignadosIds.has(pIdStr)) return true
              if (String(p.responsable_id || p.responsableId) === String(user.id)) return true
              if (String(p.delegado_residente_id) === String(user.id)) return true
              if (Array.isArray(p.equipo) && p.equipo.some((eq: any) => String(eq.usuario_id || eq.id) === String(user.id))) return true
              return false
            })
          }

          setProyectosActivos(activos)
          if (activos.length > 0) {
            if (!proyectoId || !activos.some((p: any) => String(p.id) === String(proyectoId))) {
              onProyectoChange(activos[0].id)
            }
          } else {
            onProyectoChange('')
          }
        }
      } catch (e) {
        console.error('Error cargando filtros de bitácora:', e)
      }
    }
    cargarDatosIniciales()
  }, [user, esRestringido])

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

  // Identificar si existe un proyecto activo y seleccionado válidamente
  const hayProyecto = useMemo(() => {
    return Boolean(
      proyectoId &&
      proyectosActivos.length > 0 &&
      proyectosActivos.some((p: any) => String(p.id) === String(proyectoId))
    )
  }, [proyectoId, proyectosActivos])

  // 1. Opciones Proyectos Combobox
  const opcionesProyectos = useMemo(() => {
    if (proyectosActivos.length === 0) {
      return [{ value: '', label: 'No hay proyectos registrados' }]
    }
    return proyectosActivos.map((p: any) => ({
      value: String(p.id),
      label: p.codigo ? `${p.codigo} - ${p.nombre || p.nombre_oficial}` : (p.nombre || p.nombre_oficial),
    }))
  }, [proyectosActivos])

  // 2. Opciones Roles: Únicamente roles que tengan AL MENOS 1 usuario asignado al proyecto seleccionado
  const opcionesRoles = useMemo(() => {
    if (!hayProyecto || !proyectoSeleccionadoObj) {
      return [{ value: 'todos', label: 'Todos los Roles' }]
    }

    const equipoList =
      proyectoSeleccionadoObj.equipo ||
      proyectoSeleccionadoObj.proyecto_usuario ||
      proyectoSeleccionadoObj.equipoRows ||
      []

    if (!Array.isArray(equipoList) || equipoList.length === 0) {
      return [{ value: 'todos', label: 'Todos los Roles' }]
    }

    const rolesSet = new Set<string>()

    equipoList.forEach((item: any) => {
      const r = (
        item.rol_proyecto ||
        item.rol ||
        item.cargo ||
        item.rol_nombre ||
        item.usuario?.rol ||
        ''
      ).trim()

      if (r) {
        rolesSet.add(r)
      }
    })

    const rolesResult = Array.from(rolesSet).map((r) => ({ value: r, label: r }))
    return [{ value: 'todos', label: 'Todos los Roles' }, ...rolesResult]
  }, [hayProyecto, proyectoSeleccionadoObj])

  // 3. Opciones Usuarios: Únicamente usuarios asignados al proyecto (filtrados opcionalmente por rol)
  const opcionesUsuarios = useMemo(() => {
    if (!hayProyecto || !proyectoSeleccionadoObj) {
      return [{ value: '', label: 'Todos los Usuarios' }]
    }

    let equipoList =
      proyectoSeleccionadoObj.equipo ||
      proyectoSeleccionadoObj.proyecto_usuario ||
      proyectoSeleccionadoObj.equipoRows ||
      []

    if (!Array.isArray(equipoList)) equipoList = []

    if (rolFiltro && rolFiltro !== 'todos') {
      const targetRol = rolFiltro.toLowerCase()
      equipoList = equipoList.filter((item: any) => {
        const itemRol = (
          item.rol_proyecto ||
          item.rol ||
          item.cargo ||
          item.rol_nombre ||
          item.usuario?.rol ||
          ''
        ).toLowerCase()
        return itemRol.includes(targetRol) || targetRol.includes(itemRol)
      })
    }

    const res = equipoList.map((item: any) => {
      const du = item.usuario?.dato_usuario || (Array.isArray(item.usuario?.dato_usuario) ? item.usuario?.dato_usuario[0] : null) || {}
      const nombre = item.nombre || (du.primer_nombre ? `${du.primer_nombre} ${du.primer_apellido || ''}`.trim() : '') || item.usuario?.correo || item.correo || 'Usuario'
      const rol = item.rol_proyecto || item.rol || item.cargo || 'Miembro'
      const id = item.usuario_id || item.usuario?.id || item.id || nombre

      return {
        value: String(id),
        label: `${nombre} - ${rol}`,
      }
    })

    return [{ value: '', label: 'Todos los Usuarios' }, ...res]
  }, [hayProyecto, proyectoSeleccionadoObj, rolFiltro])

  // 4. Opciones Renglones: Únicamente renglones que tengan AL MENOS 1 registro de bitácora en el proyecto seleccionado
  const opcionesRenglones = useMemo(() => {
    if (!hayProyecto || !proyectoId) {
      return [{ value: 'todos', label: 'Todos los Renglones' }]
    }

    const bitacorasDelProyecto = (registrosBitacora || []).filter(
      (b: any) => String(b.proyecto_id || b.proyectoId) === String(proyectoId)
    )

    const renglonesMap = new Map<string, { cod: string; desc: string }>()

    bitacorasDelProyecto.forEach((b: any) => {
      if (b.renglon) {
        const cod = b.renglon.codigo || b.renglon.codigoDGC || b.renglon.id || b.renglon
        const desc = b.renglon.descripcion || b.renglon.nombre || cod
        renglonesMap.set(String(cod), { cod: String(cod), desc: String(desc) })
      }
      if (Array.isArray(b.etiquetas)) {
        b.etiquetas.forEach((e: string) => {
          if (!renglonesMap.has(e)) {
            renglonesMap.set(e, { cod: e, desc: e })
          }
        })
      }
    })

    if (renglonesMap.size === 0) {
      return [{ value: 'todos', label: 'Todos los Renglones' }]
    }

    const res = Array.from(renglonesMap.values()).map((r) => ({
      value: r.cod,
      label: r.cod === r.desc ? r.cod : `[${r.cod}] ${r.desc}`,
    }))

    return [{ value: 'todos', label: 'Todos los Renglones' }, ...res]
  }, [hayProyecto, proyectoId, registrosBitacora])

  return (
    <div className="w-full rounded-lg border border-gray-200 bg-white p-2 shadow-sm mb-4 font-[Poppins]">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {/* Buscador */}
        <div className="relative min-w-[180px] flex-1">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            disabled={!hayProyecto}
            placeholder="Buscar registros de bitácora..."
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
            className={`w-full border rounded-md pl-8 pr-3 py-1.5 text-[11px] font-medium placeholder:text-gray-400 focus:outline-none focus:border-[#9B0F06] transition-colors ${!hayProyecto ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-50 border-gray-200 text-gray-800 focus:bg-white'}`}
          />
        </div>

        {/* 1. Proyecto (Combobox) */}
        <div className="w-[190px]">
          <Combobox
            options={opcionesProyectos}
            value={proyectoId}
            onChange={(val) => onProyectoChange(val)}
            placeholder={proyectosActivos.length > 0 ? "Seleccionar Proyecto..." : "No hay proyectos registrados"}
            allowNumbers={true}
          />
        </div>

        {/* 2. Rol (Combobox) */}
        {!esRestringido && onRolChange && (
          <div className="w-[160px]">
            <Combobox
              disabled={!hayProyecto}
              options={opcionesRoles}
              value={rolFiltro}
              onChange={(val) => onRolChange(val)}
              placeholder="Todos los Roles"
              allowNumbers={true}
            />
          </div>
        )}

        {/* 3. Usuario (Combobox) */}
        {!esRestringido && (
          <div className="w-[180px]">
            <Combobox
              disabled={!hayProyecto}
              options={opcionesUsuarios}
              value={usuarioFiltro}
              onChange={(val) => onUsuarioChange(val)}
              placeholder="Todos los Usuarios"
              allowNumbers={true}
            />
          </div>
        )}

        {/* 4. Renglón (Combobox) - Antes de las Fechas */}
        <div className="w-[180px]">
          <Combobox
            disabled={!hayProyecto}
            options={opcionesRenglones}
            value={tipo}
            onChange={(val) => onTipoChange(val)}
            placeholder="Todos los Renglones"
            allowNumbers={true}
          />
        </div>

        {/* Fecha Inicio */}
        <div className={`flex items-center gap-1 border rounded-md px-2 h-[34px] ${!hayProyecto ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-70' : 'bg-white border-gray-200 focus-within:border-[#9B0F06]'}`}>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Desde:</span>
          <input
            type="date"
            disabled={!hayProyecto}
            value={fechaDesde}
            onChange={(e) => onFechaDesdeChange(e.target.value)}
            className="border-none bg-transparent text-[11px] font-medium text-gray-700 focus:outline-none disabled:cursor-not-allowed"
          />
        </div>

        {/* Fecha Fin */}
        <div className={`flex items-center gap-1 border rounded-md px-2 h-[34px] ${!hayProyecto ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-70' : 'bg-white border-gray-200 focus-within:border-[#9B0F06]'}`}>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Hasta:</span>
          <input
            type="date"
            disabled={!hayProyecto}
            value={fechaHasta}
            min={fechaDesde || undefined}
            onChange={(e) => onFechaHastaChange(e.target.value)}
            className="border-none bg-transparent text-[11px] font-medium text-gray-700 focus:outline-none disabled:cursor-not-allowed"
          />
        </div>

        {/* Estado */}
        <select
          disabled={!hayProyecto}
          value={estado}
          onChange={(e) => onEstadoChange(e.target.value as EstadoBitacora | 'todos')}
          className={`h-[34px] w-[110px] rounded-md border px-2 text-[11px] font-medium focus:border-[#9B0F06] focus:outline-none ${!hayProyecto ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white border-gray-200 text-gray-800 cursor-pointer'}`}
        >
          <option value="todos">Estado: Todos</option>
          <option value="pendiente">Pendiente</option>
          <option value="aprobado">Aprobado</option>
        </select>

        {/* Limpiar */}
        {hayProyecto && (busqueda || (tipo && tipo !== 'todos') || (estado && estado !== 'todos') || fechaDesde || fechaHasta || usuarioFiltro || (rolFiltro && rolFiltro !== 'todos')) && (
          <button
            type="button"
            onClick={onLimpiar}
            className="inline-flex shrink-0 items-center gap-1 rounded-md bg-gray-100 px-3 h-[34px] text-[10px] font-bold text-gray-600 transition-colors hover:bg-gray-200 cursor-pointer"
          >
            <X size={12} />
            Limpiar
          </button>
        )}
      </div>
    </div>
  )
}
