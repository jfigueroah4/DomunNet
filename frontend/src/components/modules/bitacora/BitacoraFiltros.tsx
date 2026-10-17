'use client'

import { Search, Trash2, X, SlidersHorizontal } from 'lucide-react'
import { EstadoBitacora } from '@/types/bitacora'
import { useEffect, useState, useMemo } from 'react'
import { apiGetDeduplicado } from '@/lib/api/cliente'
import { Combobox } from '@/components/ui/Combobox'

import { useAuthStore } from '@/stores/useAuthStore'
import { useUIStore } from '@/stores/useUIStore'
import { esProyectoNoBorrador } from '@/lib/proyectos/estado'

interface BitacoraFiltrosProps {
  busqueda: string
  onBusquedaChange: (busqueda: string) => void
  tipo: string
  onTipoChange: (tipo: string) => void
  proyectoId: string
  onProyectoChange: (id: string) => void
  estado: EstadoBitacora | 'todos'
  onEstadoChange: (estado: EstadoBitacora | 'todos') => void
  fechaDesde?: string
  onFechaDesdeChange?: (fecha: string) => void
  fechaHasta?: string
  onFechaHastaChange?: (fecha: string) => void
  usuarioFiltro: string
  onUsuarioChange: (usuario: string) => void
  rolFiltro?: string
  onRolChange?: (rol: string) => void
  esRolCampoRestringido?: boolean
  onLimpiar?: () => void
  registrosBitacora?: any[]
  modoSeleccion?: boolean
  setModoSeleccion?: (valor: boolean | ((prev: boolean) => boolean)) => void
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
  usuarioFiltro,
  onUsuarioChange,
  rolFiltro = 'todos',
  onRolChange,
  esRolCampoRestringido = false,
  onLimpiar,
  registrosBitacora = [],
  modoSeleccion = false,
  setModoSeleccion,
}: BitacoraFiltrosProps) {
  const [proyectosActivos, setProyectosActivos] = useState<any[]>([])
  const [proyectoSeleccionadoObj, setProyectoSeleccionadoObj] = useState<any>(null)
  const [sheetFiltrosAbierto, setSheetFiltrosAbierto] = useState<boolean>(false)

  const setOcultarBottomNav = useUIStore((s) => s.setOcultarBottomNav)

  const abrirSheetFiltros = () => {
    setSheetFiltrosAbierto(true)
    setOcultarBottomNav(true)
  }

  const cerrarSheetFiltros = () => {
    setSheetFiltrosAbierto(false)
    setOcultarBottomNav(false)
  }

  // Si el componente se desmonta mientras el sheet está abierto, restaurar bottom nav
  useEffect(() => {
    return () => {
      setOcultarBottomNav(false)
    }
  }, [setOcultarBottomNav])

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
          esRestringido && user?.id
            ? apiGetDeduplicado('/mantenimiento/proyecto_usuario').catch(() => ({ data: { data: [] } }))
            : Promise.resolve({ data: { data: [] } })
        ])

        if (resProy.data?.success && Array.isArray(resProy.data.data)) {
          let activos = resProy.data.data.filter(
            (p: any) =>
              (p.estado === 'activo' || p.estado_codigo === 'activo') &&
              esProyectoNoBorrador(p)
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

  // 1. Opciones Proyectos Combobox (Únicamente nombre del proyecto)
  const opcionesProyectos = useMemo(() => {
    if (proyectosActivos.length === 0) {
      return [{ value: '', label: 'No hay proyectos registrados' }]
    }
    return proyectosActivos.map((p: any) => ({
      value: String(p.id),
      label: p.nombre || p.nombre_oficial || p.codigo || 'Proyecto sin nombre',
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

  // 3. Opciones Usuarios: Usuarios asignados al proyecto + Autores reales con bitácoras en este proyecto
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

    const usuariosMap = new Map<string, { id: string; nombre: string; rol: string }>()

    // 1. Usuarios del equipo del proyecto
    equipoList.forEach((item: any) => {
      const du = item.usuario?.dato_usuario || (Array.isArray(item.usuario?.dato_usuario) ? item.usuario?.dato_usuario[0] : null) || {}
      const nombre = item.nombre || (du.primer_nombre ? `${du.primer_nombre} ${du.primer_apellido || ''}`.trim() : '') || item.usuario?.correo || item.correo || 'Usuario'
      const rol = item.rol_proyecto || item.rol || item.cargo || 'Miembro'
      const id = item.usuario_id || item.usuario?.id || item.id || nombre
      usuariosMap.set(String(id), { id: String(id), nombre, rol })
    })

    // 2. Autores reales de bitácoras del proyecto
    const bitacorasDelProyecto = (registrosBitacora || []).filter(
      (b: any) => String(b.proyecto_id || b.proyectoId) === String(proyectoId)
    )
    bitacorasDelProyecto.forEach((b: any) => {
      if (b.autor) {
        const autorNombre = String(b.autor).trim()
        const autorId = String(b.autor_id || b.autorId || b.usuario_id || autorNombre)
        const autorRol = b.rol || b.creadorRol || 'Autor'
        if (!usuariosMap.has(autorId) && !Array.from(usuariosMap.values()).some((u) => u.nombre.toLowerCase() === autorNombre.toLowerCase())) {
          usuariosMap.set(autorId, { id: autorId, nombre: autorNombre, rol: autorRol })
        }
      }
    })

    let userList = Array.from(usuariosMap.values())
    if (rolFiltro && rolFiltro !== 'todos') {
      const targetRol = rolFiltro.toLowerCase()
      userList = userList.filter((u) => u.rol.toLowerCase().includes(targetRol) || targetRol.includes(u.rol.toLowerCase()))
    }

    const res = userList.map((u) => ({
      value: u.id,
      label: `${u.nombre} - ${u.rol}`,
    }))

    return [{ value: '', label: 'Todos los Usuarios' }, ...res]
  }, [hayProyecto, proyectoSeleccionadoObj, rolFiltro, registrosBitacora, proyectoId])

  // 4. Opciones Renglones: Renglones registrados en bitácoras + Renglones del Plan de Trabajo
  const opcionesRenglones = useMemo(() => {
    if (!hayProyecto || !proyectoId) {
      return [{ value: 'todos', label: 'Todos los Renglones' }]
    }

    const bitacorasDelProyecto = (registrosBitacora || []).filter(
      (b: any) => String(b.proyecto_id || b.proyectoId) === String(proyectoId)
    )

    const renglonesMap = new Map<string, { cod: string; desc: string }>()

    // 1. Extraer renglones presentes en los registros de bitácora
    bitacorasDelProyecto.forEach((b: any) => {
      const rNombre = b.renglon_nombre || b.renglonNombre || b.categoriaTrabajo
      if (rNombre) {
        const cod = rNombre.split('-')[0]?.trim() || rNombre
        renglonesMap.set(cod, { cod, desc: rNombre })
      }
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

    // 2. Extraer renglones del catálogo/plan del proyecto
    const plan =
      proyectoSeleccionadoObj?.planTrabajo ||
      proyectoSeleccionadoObj?.renglones ||
      proyectoSeleccionadoObj?.renglones_sabana ||
      []
    if (Array.isArray(plan)) {
      plan.forEach((item: any) => {
        const cod = String(item.codigoDGC || item.codigo || item.id || '')
        const desc = item.descripcion || item.desc || item.nombre || cod
        if (cod && !renglonesMap.has(cod)) {
          renglonesMap.set(cod, { cod, desc: cod === desc ? cod : `${cod} - ${desc}` })
        }
      })
    }

    if (renglonesMap.size === 0) {
      return [{ value: 'todos', label: 'Todos los Renglones' }]
    }

    const res = Array.from(renglonesMap.values()).map((r) => ({
      value: r.cod,
      label: r.cod === r.desc ? r.cod : `[${r.cod}] ${r.desc}`,
    }))

    return [{ value: 'todos', label: 'Todos los Renglones' }, ...res]
  }, [hayProyecto, proyectoId, registrosBitacora, proyectoSeleccionadoObj])

  // Contar cuántos filtros secundarios activos existen
  const cantidadFiltrosActivos = useMemo(() => {
    let cant = 0
    if (tipo && tipo !== 'todos') cant++
    if (estado && estado !== 'todos') cant++
    if (rolFiltro && rolFiltro !== 'todos') cant++
    if (usuarioFiltro && usuarioFiltro !== 'todos') cant++
    return cant
  }, [tipo, estado, rolFiltro, usuarioFiltro])

  return (
    <>
      {/* =========================================================================
          1. VISTA MÓVIL (< sm): Barra compacta (Búsqueda + Proyecto + Icono Filtro)
          ========================================================================= */}
      <div className="sm:hidden w-full rounded-xl border border-gray-200 bg-white p-2 shadow-2xs mb-2 font-[Poppins] relative z-30">
        <div className="flex items-center gap-1.5 w-full">
          {/* Barra de Búsqueda */}
          <div className="relative flex-1 min-w-0">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              disabled={!hayProyecto}
              placeholder="Buscar..."
              value={busqueda}
              onChange={(e) => onBusquedaChange(e.target.value)}
              className={`filtro-control w-full h-[32px] border rounded-lg pl-7 pr-2 text-[11px] font-normal placeholder:text-gray-400 focus:outline-none focus:border-[#9B0F06] transition-colors ${
                !hayProyecto ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-50 border-gray-200 text-gray-700 focus:bg-white'
              }`}
            />
          </div>

          {/* Selector de Proyecto Combobox */}
          <div className="w-[155px] shrink-0">
            <Combobox
              options={opcionesProyectos}
              value={proyectoId}
              onChange={(val) => onProyectoChange(val)}
              placeholder={proyectosActivos.length > 0 ? "Proyecto..." : "Sin proyectos"}
              allowNumbers={true}
              inputClassName="filtro-control h-[32px] text-[10px] sm:text-[11px] !py-0 !rounded-lg font-normal pr-5"
              dropdownClassName="z-50 shadow-2xl min-w-[260px] max-w-[290px] w-max"
            />
          </div>

          {/* Botón de Filtro (Abre Bottom Sheet Modal) */}
          <button
            type="button"
            onClick={abrirSheetFiltros}
            className={`relative flex items-center justify-center h-[32px] w-[34px] shrink-0 rounded-lg border transition-all cursor-pointer shadow-2xs active:scale-95 ${
              cantidadFiltrosActivos > 0
                ? 'bg-[#9B0F06] border-[#9B0F06] text-white'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
            title="Abrir filtros"
          >
            <SlidersHorizontal size={14} className="stroke-[2.2]" />
            {cantidadFiltrosActivos > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white text-[#9B0F06] text-[9px] font-black border border-[#9B0F06] flex items-center justify-center">
                {cantidadFiltrosActivos}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. BOTTOM SHEET MODAL PARA MÓVIL (Slide de abajo hacia arriba)
          ========================================================================= */}
      {sheetFiltrosAbierto && (
        <div className="fixed inset-0 z-[9999] sm:hidden font-[Poppins]">
          {/* Backdrop con blur */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={cerrarSheetFiltros}
          />

          {/* Sheet deslizable de abajo hacia arriba con mayor amplitud horizontal */}
          <div className="fixed inset-x-0 bottom-0 w-full max-w-lg mx-auto max-h-[86vh] rounded-t-2xl bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-bottom duration-300">
            {/* Header estilo modal iOS/Img de referencia */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <button
                type="button"
                onClick={cerrarSheetFiltros}
                className="text-[11px] font-medium text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <div className="text-center">
                <h3 className="text-xs font-bold text-gray-900 leading-tight">Filtros de bitácora</h3>
                <span className="text-[9.5px] text-gray-400 font-normal">Personalizar visualización</span>
              </div>

              <button
                type="button"
                onClick={cerrarSheetFiltros}
                className="text-[11px] font-bold text-[#9B0F06] hover:text-[#7D0C05] transition-colors cursor-pointer"
              >
                Listo
              </button>
            </div>

            {/* Contenido scrolleable del Bottom Sheet con mayor anchura */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              {/* Sección Renglón */}
              <div className="space-y-1.5">
                <label data-filtro-label="true" className="filtro-label !text-[9.5px] font-bold text-gray-400 uppercase tracking-wider block">
                  Renglón de Trabajo
                </label>
                <Combobox
                  disabled={!hayProyecto}
                  options={opcionesRenglones}
                  value={tipo}
                  onChange={(val) => onTipoChange(val)}
                  placeholder="Todos los Renglones"
                  allowNumbers={true}
                  inputClassName="filtro-control h-[34px] text-[11px] !py-0 !rounded-lg font-normal pr-5"
                  dropdownClassName="z-50 shadow-2xl min-w-full w-full max-w-[92vw]"
                />
              </div>

              {/* Sección Estado */}
              <div className="space-y-1.5">
                <label data-filtro-label="true" className="filtro-label !text-[9.5px] font-bold text-gray-400 uppercase tracking-wider block">
                  Estado del Registro
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'todos', label: 'Todos' },
                    { id: 'pendiente', label: 'Pendiente' },
                    { id: 'aprobado', label: 'Aprobado' },
                  ].map((item) => {
                    const activo = estado === item.id
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onEstadoChange(item.id as EstadoBitacora | 'todos')}
                        className={`h-[34px] rounded-lg border text-[11px] font-medium flex items-center justify-center transition-all cursor-pointer ${
                          activo
                            ? 'bg-[#9B0F06] border-[#9B0F06] text-white shadow-xs font-bold'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span>{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Sección Roles (si aplica) */}
              {!esRestringido && onRolChange && (
                <div className="space-y-1.5">
                  <label data-filtro-label="true" className="filtro-label !text-[9.5px] font-bold text-gray-400 uppercase tracking-wider block">
                    Rol Asignado
                  </label>
                  <Combobox
                    disabled={!hayProyecto}
                    options={opcionesRoles}
                    value={rolFiltro}
                    onChange={(val) => onRolChange(val)}
                    placeholder="Todos los Roles"
                    allowNumbers={true}
                    inputClassName="filtro-control h-[34px] text-[11px] !py-0 !rounded-lg font-normal pr-5"
                    dropdownClassName="z-50 shadow-2xl min-w-full w-full max-w-[92vw]"
                  />
                </div>
              )}

              {/* Sección Usuario (si aplica) */}
              {!esRestringido && (
                <div className="space-y-1.5">
                  <label data-filtro-label="true" className="filtro-label !text-[9.5px] font-bold text-gray-400 uppercase tracking-wider block">
                    Usuario / Autor
                  </label>
                  <Combobox
                    disabled={!hayProyecto}
                    options={opcionesUsuarios}
                    value={usuarioFiltro}
                    onChange={(val) => onUsuarioChange(val)}
                    placeholder="Todos los Usuarios"
                    allowNumbers={true}
                    inputClassName="filtro-control h-[34px] text-[11px] !py-0 !rounded-lg font-normal pr-5"
                    dropdownClassName="z-50 shadow-2xl min-w-full w-full max-w-[92vw]"
                  />
                </div>
              )}

              {/* Acciones Adicionales en el Sheet */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-3">
                {onLimpiar && (
                  <button
                    type="button"
                    disabled={!hayProyecto || cantidadFiltrosActivos === 0}
                    onClick={() => {
                      onLimpiar()
                    }}
                    className="flex-1 h-[36px] rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <X size={13} />
                    <span>Limpiar filtros</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={!hayProyecto}
                  onClick={() => {
                    setModoSeleccion?.((prev) => !prev)
                    cerrarSheetFiltros()
                  }}
                  className={`flex-1 h-[36px] rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    modoSeleccion
                      ? 'bg-[#9B0F06] text-white hover:bg-[#7D0C05]'
                      : 'border border-gray-200 bg-white text-gray-700 hover:bg-red-50 hover:text-[#9B0F06]'
                  }`}
                >
                  <Trash2 size={13} />
                  <span>{modoSeleccion ? 'Desactivar selección' : 'Modo selección'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          3. VISTA ESCRITORIO (>= sm): Barra horizontal completa habitual
          ========================================================================= */}
      <div className="hidden sm:block w-full rounded-xl border border-gray-200 bg-white p-1.5 px-2 shadow-2xs mb-2 font-[Poppins] relative z-40 overflow-visible">
        <div className="flex items-center gap-1.5 text-xs flex-wrap w-full py-0.5 overflow-visible">
          {/* Buscador extendido */}
          <div className="relative flex-1 min-w-[160px] max-w-[240px] shrink-0">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              disabled={!hayProyecto}
              placeholder="Buscar..."
              value={busqueda}
              onChange={(e) => onBusquedaChange(e.target.value)}
              className={`filtro-control w-full h-[28px] border rounded-lg pl-6 pr-2 text-xs font-normal placeholder:text-gray-400 focus:outline-none focus:border-[#9B0F06] transition-colors ${!hayProyecto ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-50 border-gray-200 text-gray-700 focus:bg-white'}`}
            />
          </div>

          {/* 1. Proyecto (Combobox) */}
          <div className="w-[160px] xl:w-[190px] 2xl:w-[220px] shrink-0">
            <Combobox
              options={opcionesProyectos}
              value={proyectoId}
              onChange={(val) => onProyectoChange(val)}
              placeholder={proyectosActivos.length > 0 ? "Seleccionar Proyecto..." : "No hay proyectos"}
              allowNumbers={true}
              inputClassName="filtro-control h-[28px] text-xs !py-0 !rounded-lg font-normal pr-5"
              dropdownClassName="z-50 shadow-2xl min-w-full w-max max-w-[340px]"
            />
          </div>

          {/* 2. Rol (Combobox) */}
          {!esRestringido && onRolChange && (
            <div className="w-[110px] xl:w-[125px] 2xl:w-[140px] shrink-0">
              <Combobox
                disabled={!hayProyecto}
                options={opcionesRoles}
                value={rolFiltro}
                onChange={(val) => onRolChange(val)}
                placeholder="Todos los Roles"
                allowNumbers={true}
                inputClassName="filtro-control h-[28px] text-xs !py-0 !rounded-lg font-normal pr-5"
                dropdownClassName="z-50 shadow-2xl min-w-full w-max max-w-[300px]"
              />
            </div>
          )}

          {/* 3. Usuario (Combobox) */}
          {!esRestringido && (
            <div className="w-[115px] xl:w-[130px] 2xl:w-[145px] shrink-0">
              <Combobox
                disabled={!hayProyecto}
                options={opcionesUsuarios}
                value={usuarioFiltro}
                onChange={(val) => onUsuarioChange(val)}
                placeholder="Todos los Usuarios"
                allowNumbers={true}
                inputClassName="filtro-control h-[28px] text-xs !py-0 !rounded-lg font-normal pr-5"
                dropdownClassName="z-50 shadow-2xl min-w-full w-max max-w-[340px]"
              />
            </div>
          )}

          {/* 4. Renglón (Combobox) */}
          <div className="w-[130px] xl:w-[150px] 2xl:w-[170px] shrink-0">
            <Combobox
              disabled={!hayProyecto}
              options={opcionesRenglones}
              value={tipo}
              onChange={(val) => onTipoChange(val)}
              placeholder="Todos los Renglones"
              allowNumbers={true}
              inputClassName="filtro-control h-[28px] text-xs !py-0 !rounded-lg font-normal pr-5"
              dropdownClassName="z-50 shadow-2xl min-w-full w-max max-w-[400px]"
            />
          </div>

          {/* Estado */}
          <div className="shrink-0">
            <select
              disabled={!hayProyecto}
              value={estado}
              onChange={(e) => onEstadoChange(e.target.value as EstadoBitacora | 'todos')}
              className={`filtro-control h-[28px] w-[115px] rounded-lg border px-2 text-xs font-normal focus:border-[#9B0F06] focus:outline-none ${!hayProyecto ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white border-gray-200 text-gray-700 cursor-pointer shadow-2xs'}`}
            >
              <option value="todos">Estado: Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="aprobado">Aprobado</option>
            </select>
          </div>

          {/* Botón Limpiar Filtros */}
          {onLimpiar && (
            <button
              type="button"
              disabled={!hayProyecto}
              onClick={onLimpiar}
              className={`inline-flex shrink-0 items-center justify-center rounded-lg border w-[28px] h-[28px] transition-colors cursor-pointer shadow-2xs ${
                hayProyecto
                  ? 'border-gray-200 bg-white hover:bg-gray-100 text-gray-400 hover:text-gray-700'
                  : 'border-gray-200 bg-gray-100 text-gray-300 cursor-not-allowed'
              }`}
              title="Limpiar filtros"
            >
              <X size={14} />
            </button>
          )}

          {/* Botón de Basurero para activar/desactivar selección múltiple para eliminar */}
          <button
            type="button"
            disabled={!hayProyecto}
            onClick={() => setModoSeleccion?.((prev) => !prev)}
            title={modoSeleccion ? 'Desactivar modo selección' : 'Activar selección para eliminar registros'}
            className={`inline-flex shrink-0 items-center justify-center rounded-lg h-[28px] text-xs font-medium transition-all cursor-pointer shadow-2xs ${
              !hayProyecto
                ? 'border border-gray-200 bg-gray-100 text-gray-300 cursor-not-allowed'
                : modoSeleccion
                ? 'bg-[#9B0F06] text-white hover:bg-[#5E0006] px-2.5 gap-1.5'
                : 'border border-gray-200 bg-white hover:bg-red-50 text-gray-400 hover:text-[#9B0F06] w-[28px]'
            }`}
          >
            {modoSeleccion ? (
              <>
                <X size={13} />
                <span>Cancelar</span>
              </>
            ) : (
              <Trash2 size={13} />
            )}
          </button>
        </div>
      </div>
    </>
  )
}
