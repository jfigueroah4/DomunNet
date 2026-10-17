'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  Filter,
  TrendingUp,
  BarChart2,
  Camera,
  Receipt,
  Search,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react'
import { PROYECTOS_MOCK } from '@/data/proyectos.mock'
import { FOTOGRAFIAS_MOCK } from '@/data/fotografias.mock'
import { Combobox } from '@/components/ui/Combobox'
import { useUIStore } from '@/stores/useUIStore'
import { EstadisticasPlanificacion } from './EstadisticasPlanificacion'
import { EstadisticasBitacora } from './EstadisticasBitacora'
import { EstadisticasRegistros } from './EstadisticasRegistros'
import { EstadisticasFinanzas } from './EstadisticasFinanzas'

export function EstadisticasView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const setOcultarBottomNav = useUIStore((s) => s.setOcultarBottomNav)

  const [proyectos, setProyectos] = useState<any[]>([])
  const [bitacoraBD, setBitacoraBD] = useState<any[]>([])
  const [fotosBD, setFotosBD] = useState<any[]>([])
  const [renglonesBD, setRenglonesBD] = useState<any[]>([])
  const [usuariosBD, setUsuariosBD] = useState<any[]>([])
  const [cargando, setCargando] = useState<boolean>(true)

  const [busqueda, setBusqueda] = useState<string>('')
  const [proyectoId, setProyectoId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const pUrl = searchParams?.get('proyectoId') || searchParams?.get('proyecto')
      if (pUrl && pUrl !== 'todos') return pUrl
      try {
        const stored = localStorage.getItem('domun_estadisticas_proyecto_id')
        if (stored && stored !== 'todos') return stored
      } catch {}
    }
    return ''
  })

  const [proyectoDetalle, setProyectoDetalle] = useState<any>(null)
  const [renglonesProyecto, setRenglonesProyecto] = useState<any[]>([])
  const [estimacionesProyecto, setEstimacionesProyecto] = useState<any[]>([])

  const [fechaDesde, setFechaDesde] = useState<string>('2026-01-01')
  const todayStr = new Date().toISOString().split('T')[0]
  const [fechaHasta, setFechaHasta] = useState<string>(todayStr)
  const [categoriaAnalisis, setCategoriaAnalisis] = useState<string>('todas')
  const [sheetFiltrosAbierto, setSheetFiltrosAbierto] = useState<boolean>(false)

  const [tabActivo, setTabActivo] = useState<'planificacion' | 'bitacora' | 'registros' | 'finanzas'>('planificacion')

  const abrirSheetFiltros = () => {
    setSheetFiltrosAbierto(true)
    setOcultarBottomNav(true)
  }

  const cerrarSheetFiltros = () => {
    setSheetFiltrosAbierto(false)
    setOcultarBottomNav(false)
  }

  useEffect(() => {
    return () => {
      setOcultarBottomNav(false)
    }
  }, [setOcultarBottomNav])

  // Cargar datos reales de la base de datos excluyendo proyectos en estado borrador
  useEffect(() => {
    let cancelado = false

    const cargarDatos = async () => {
      try {
        const { apiGetDeduplicado } = await import('@/lib/api/cliente')
        const [resProy, resBit, resFotos, resRenglones, resUsuarios] = await Promise.all([
          apiGetDeduplicado('/proyectos').catch(() => ({ data: { data: [] } })),
          apiGetDeduplicado('/mantenimiento/bitacora_entrada?limite=500').catch(() => ({ data: { data: [] } })),
          apiGetDeduplicado('/mantenimiento/evidencia_fotografica?limite=500').catch(() => ({ data: { data: [] } })),
          apiGetDeduplicado('/mantenimiento/renglon_trabajo?limite=500').catch(() => ({ data: { data: [] } })),
          apiGetDeduplicado('/usuarios').catch(() => ({ data: { data: [] } })),
        ])

        if (cancelado) return

        const listProy = resProy.data?.data || []
        // Filtrar proyectos excluyendo los que estén en estado 'borrador'
        const proyectosValidos = (listProy.length > 0 ? listProy : PROYECTOS_MOCK).filter((p: any) => {
          const estadoNorm = String(p.estado || p.estado_codigo || '').toLowerCase().trim()
          return estadoNorm !== 'borrador'
        })
        setProyectos(proyectosValidos)

        // Asignar primer proyecto si no hay ninguno seleccionado o si el actual ya no existe
        setProyectoId((prev) => {
          if (prev && prev !== 'todos' && proyectosValidos.some((p: any) => String(p.id) === String(prev))) {
            return prev
          }
          const defaultId = proyectosValidos[0] ? String(proyectosValidos[0].id) : ''
          try {
            if (defaultId) localStorage.setItem('domun_estadisticas_proyecto_id', defaultId)
          } catch {}
          return defaultId
        })

        // Hidratar bitácora desde base de datos y registros locales
        let listBit = resBit.data?.data || []
        try {
          const cachedBit = sessionStorage.getItem('domun_bitacora_cache')
          if (cachedBit) {
            const parsed = JSON.parse(cachedBit)
            if (Array.isArray(parsed) && parsed.length > 0) {
              const ids = new Set(listBit.map((x: any) => String(x.id)))
              parsed.forEach((item: any) => {
                if (item.id && !ids.has(String(item.id))) {
                  listBit.push(item)
                  ids.add(String(item.id))
                }
              })
            }
          }
        } catch {}
        try {
          const locales = JSON.parse(localStorage.getItem('domun_bitacora_locales') || '[]')
          if (Array.isArray(locales) && locales.length > 0) {
            const ids = new Set(listBit.map((x: any) => String(x.id)))
            locales.forEach((loc: any) => {
              if (loc.id && !ids.has(String(loc.id))) {
                listBit.unshift(loc)
                ids.add(String(loc.id))
              }
            })
          }
        } catch {}
        setBitacoraBD(listBit)

        const listFotos = resFotos.data?.data || []
        setFotosBD(listFotos.length > 0 ? listFotos : FOTOGRAFIAS_MOCK)

        const listRenglones = resRenglones.data?.data || []
        setRenglonesBD(listRenglones)

        const listUsuarios = resUsuarios.data?.data || []
        setUsuariosBD(listUsuarios)
      } catch (e) {
        console.error('Error cargando datos para estadísticas:', e)
        if (!cancelado) {
          const fallbackProys = PROYECTOS_MOCK.filter((p) => p.estado !== 'borrador')
          setProyectos(fallbackProys)
          setProyectoId(String(fallbackProys[0]?.id || ''))
          setBitacoraBD([])
          setFotosBD([])
        }
      } finally {
        if (!cancelado) {
          setCargando(false)
        }
      }
    }

    cargarDatos()
    return () => {
      cancelado = true
    }
  }, [])

  const proyectosDisponibles = useMemo(() => {
    return proyectos.filter((p) => {
      const estadoNorm = String(p.estado || p.estado_codigo || '').toLowerCase().trim()
      return estadoNorm !== 'borrador'
    })
  }, [proyectos])

  const proyectoSeleccionado = useMemo(() => {
    if (!proyectoId || proyectoId === 'todos') {
      return proyectosDisponibles[0] || null
    }
    return proyectosDisponibles.find((p) => String(p.id) === String(proyectoId)) || proyectosDisponibles[0] || null
  }, [proyectosDisponibles, proyectoId])

  // Cargar información profunda del proyecto seleccionado (Renglones reales, Estimaciones y detalles)
  useEffect(() => {
    if (!proyectoSeleccionado?.id) return
    let cancelado = false

    const cargarDetalleProyecto = async () => {
      try {
        const idProy = String(proyectoSeleccionado.id)

        // 1. Cargar renglones guardados de la Hoja Sábana
        let rengs: any[] = []
        try {
          const cachedSabana =
            localStorage.getItem(`sabana_renglones_${idProy}`) ||
            localStorage.getItem(`hoja_sabana_${idProy}`)
          if (cachedSabana) {
            const parsed = JSON.parse(cachedSabana)
            if (Array.isArray(parsed) && parsed.length > 0) {
              rengs = parsed
            }
          }
        } catch {}

        // 2. Cargar estimaciones guardadas
        let ests: any[] = []
        try {
          const cachedEsts = localStorage.getItem(`domun_estimaciones_manuales_${idProy}`)
          if (cachedEsts) {
            const parsed = JSON.parse(cachedEsts)
            if (Array.isArray(parsed) && parsed.length > 0) {
              ests = parsed
            }
          }
        } catch {}

        // 3. Obtener detalle de la API
        const { apiGetDeduplicado } = await import('@/lib/api/cliente')
        const res = await apiGetDeduplicado(`/proyectos/${idProy}`).catch(() => null)
        if (cancelado) return

        if (res?.data?.data) {
          setProyectoDetalle(res.data.data)
          if (rengs.length === 0 && Array.isArray(res.data.data.renglones) && res.data.data.renglones.length > 0) {
            rengs = res.data.data.renglones
          }
          if (ests.length === 0 && Array.isArray(res.data.data.estimaciones) && res.data.data.estimaciones.length > 0) {
            ests = res.data.data.estimaciones
          }
        }

        // 4. Si aún no hay renglones específicos, usar los de renglonesBD o los del objeto
        if (rengs.length === 0) {
          const deBD = renglonesBD.filter((r) => String(r.proyecto_id) === idProy)
          if (deBD.length > 0) {
            rengs = deBD
          } else if (Array.isArray(proyectoSeleccionado.renglones_sabana) && proyectoSeleccionado.renglones_sabana.length > 0) {
            rengs = proyectoSeleccionado.renglones_sabana
          }
        }

        if (!cancelado) {
          setRenglonesProyecto(rengs)
          setEstimacionesProyecto(ests)
        }
      } catch (err) {
        console.warn('Error al cargar detalle específico del proyecto:', err)
      }
    }

    cargarDetalleProyecto()
    return () => {
      cancelado = true
    }
  }, [proyectoSeleccionado?.id, renglonesBD])

  // Filtrado de bitácora por el proyecto seleccionado (sin mezclar)
  const bitacoraFiltrada = useMemo(() => {
    if (!proyectoSeleccionado) return []
    const pId = String(proyectoSeleccionado.id).toLowerCase()
    const pCod = String(proyectoSeleccionado.codigo || '').toLowerCase()
    const pNom = String(proyectoSeleccionado.nombre || proyectoSeleccionado.nombre_oficial || '').toLowerCase()

    return bitacoraBD.filter((b: any) => {
      const bPId = String(b.proyecto_id || b.proyectoId || '').toLowerCase()
      const bPCod = String(b.codigo_proyecto || '').toLowerCase()
      const bPNom = String(b.proyecto || b.proyectoNombre || '').toLowerCase()

      const matchProy =
        (bPId && bPId === pId) ||
        (bPCod && bPCod === pCod) ||
        (bPNom && pNom && (bPNom.includes(pNom) || pNom.includes(bPNom)))

      if (!matchProy) return false

      if (b.fecha) {
        if (fechaDesde && b.fecha < fechaDesde) return false
        if (fechaHasta && b.fecha > fechaHasta) return false
      }
      if (busqueda && busqueda.trim()) {
        const q = busqueda.toLowerCase().trim()
        const tit = String(b.titulo || '').toLowerCase()
        const desc = String(b.descripcion || '').toLowerCase()
        const reng = String(b.renglon_nombre || b.renglon || '').toLowerCase()
        if (!tit.includes(q) && !desc.includes(q) && !reng.includes(q)) return false
      }
      return true
    })
  }, [bitacoraBD, proyectoSeleccionado, fechaDesde, fechaHasta, busqueda])

  // Filtrado de fotografías por el proyecto seleccionado (sin mezclar)
  const fotosFiltradas = useMemo(() => {
    if (!proyectoSeleccionado) return []
    const pId = String(proyectoSeleccionado.id).toLowerCase()
    const pCod = String(proyectoSeleccionado.codigo || '').toLowerCase()
    const pNom = String(proyectoSeleccionado.nombre || proyectoSeleccionado.nombre_oficial || '').toLowerCase()

    return fotosBD.filter((f: any) => {
      const fPId = String(f.proyecto_id || f.proyectoId || '').toLowerCase()
      const fPCod = String(f.codigo_proyecto || '').toLowerCase()
      const fPNom = String(f.proyecto || f.proyectoNombre || '').toLowerCase()

      const matchProy =
        (fPId && fPId === pId) ||
        (fPCod && fPCod === pCod) ||
        (fPNom && pNom && (fPNom.includes(pNom) || pNom.includes(fPNom)))

      if (!matchProy && (f.proyecto_id || f.proyectoId)) return false

      if (busqueda && busqueda.trim()) {
        const q = busqueda.toLowerCase().trim()
        const desc = String(f.descripcion || f.titulo || '').toLowerCase()
        const reng = String(f.renglon || '').toLowerCase()
        if (!desc.includes(q) && !reng.includes(q)) return false
      }
      return true
    })
  }, [fotosBD, proyectoSeleccionado, busqueda])

  // Opciones de proyectos individuales (NUNCA 'todos los proyectos' porque no se pueden unir)
  const opcionesProyectos = useMemo(() => {
    return proyectosDisponibles.map((p) => ({
      value: String(p.id),
      label: `${p.codigo || 'PROY'} · ${p.nombre || p.nombre_oficial || p.nombreOficial}`,
    }))
  }, [proyectosDisponibles])

  const handleSeleccionarProyecto = (val: string) => {
    setProyectoId(val)
    try {
      localStorage.setItem('domun_estadisticas_proyecto_id', val)
    } catch {}
  }

  const cantidadFiltrosActivos =
    (fechaDesde !== '2026-01-01' ? 1 : 0) + (fechaHasta !== todayStr ? 1 : 0) + (categoriaAnalisis !== 'todas' ? 1 : 0)

  const limpiarFiltrosSecundarios = () => {
    setFechaDesde('2026-01-01')
    setFechaHasta(todayStr)
    setCategoriaAnalisis('todas')
  }

  return (
    <div className="space-y-3 font-[Poppins] p-1 pb-24 md:pb-6">
      {/* HEADER LIMPIO SIN BOTONES EXTRA Y FLECHA SIMPLE */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push('/dashboard/reportes')}
            className="p-1 -ml-1 text-gray-500 hover:text-[#9B0F06] transition-colors cursor-pointer"
            title="Volver a Reportes"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-1.5 text-[9.5px] text-gray-500 font-[Poppins]">
              <span>Reportes</span>
              <span>/</span>
              <span className="text-[#9B0F06] font-bold">Estadísticas y Análisis</span>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-gray-900 leading-tight font-[Poppins]">
              Estadísticas y Análisis de Obra Vial
            </h1>
          </div>
        </div>
      </div>

      {/* =========================================================================
          1. BARRA DE FILTROS SUPERIOR MÓVIL (Idéntica a Reportes / Bitácora)
          ========================================================================= */}
      <div className="sm:hidden">
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white border border-gray-200/80 shadow-2xs font-[Poppins]">
          {/* Input de Búsqueda */}
          <div className="relative flex-1 min-w-0">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Buscar..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="filtro-control w-full h-[32px] border border-gray-200 rounded-lg pl-7 pr-2 text-[11px] font-normal placeholder:text-gray-400 bg-gray-50 focus:bg-white focus:outline-none focus:border-[#9B0F06] transition-colors font-[Poppins]"
            />
          </div>

          {/* Selector de Proyecto Combobox */}
          <div className="w-[170px] shrink-0">
            <Combobox
              options={opcionesProyectos}
              value={proyectoId}
              onChange={(val) => setProyectoId(val)}
              placeholder="Proyecto..."
              allowNumbers={true}
              inputClassName="filtro-control h-[32px] text-[10px] sm:text-[11px] !py-0 !rounded-lg font-normal pr-5 bg-white border-gray-200"
              dropdownClassName="z-50 shadow-2xl min-w-[260px] w-max max-w-[85vw]"
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
            title="Abrir filtros de estadísticas"
          >
            <SlidersHorizontal size={14} className="stroke-[2.2]" />
            {cantidadFiltrosActivos > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white text-[#9B0F06] text-[9px] font-black border border-[#9B0F06] flex items-center justify-center shadow-xs">
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
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={cerrarSheetFiltros}
          />

          <div className="fixed inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-bottom duration-300 font-[Poppins]">
            {/* Header del Sheet */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <button
                type="button"
                onClick={cerrarSheetFiltros}
                className="text-[11px] font-medium text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <div className="text-center">
                <h3 className="text-xs font-bold text-gray-900 leading-tight font-[Poppins]">Filtros de Estadísticas</h3>
                <span className="text-[9.5px] text-gray-400 font-normal">Personalizar rango de fechas</span>
              </div>

              <button
                type="button"
                onClick={cerrarSheetFiltros}
                className="text-[11px] font-bold text-[#9B0F06] hover:text-[#7D0C05] transition-colors cursor-pointer"
              >
                Listo
              </button>
            </div>

            {/* Contenido scrolleable del Bottom Sheet */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              {/* Rango de Fechas */}
              <div className="space-y-1.5">
                <label data-filtro-label="true" className="filtro-label !text-[9.5px] font-bold text-gray-400 uppercase tracking-wider block font-[Poppins]">
                  Rango de Fechas
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[9.5px] text-gray-500 font-medium block mb-1">Desde</span>
                    <input
                      type="date"
                      value={fechaDesde}
                      onChange={(e) => setFechaDesde(e.target.value)}
                      className="filtro-control w-full h-[34px] rounded-lg border border-gray-200 px-2 text-[10.5px] text-gray-800 bg-gray-50 focus:bg-white focus:border-[#9B0F06] focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[9.5px] text-gray-500 font-medium block mb-1">Hasta</span>
                    <input
                      type="date"
                      value={fechaHasta}
                      onChange={(e) => setFechaHasta(e.target.value)}
                      className="filtro-control w-full h-[34px] rounded-lg border border-gray-200 px-2 text-[10.5px] text-gray-800 bg-gray-50 focus:bg-white focus:border-[#9B0F06] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Botón Restablecer */}
              {cantidadFiltrosActivos > 0 && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={limpiarFiltrosSecundarios}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-600 hover:bg-gray-100 hover:text-red-700 transition-colors cursor-pointer"
                  >
                    <RotateCcw size={12} />
                    <span>Restablecer filtros secundarios</span>
                  </button>
                </div>
              )}
            </div>

            {/* Footer con botón de aplicar */}
            <div className="p-3 border-t border-gray-100 bg-gray-50/80">
              <button
                type="button"
                onClick={cerrarSheetFiltros}
                className="w-full py-2.5 rounded-xl bg-[#9B0F06] text-white text-xs font-bold hover:bg-[#7D0C05] transition-colors shadow-2xs active:scale-95 cursor-pointer text-center"
              >
                Aplicar Filtros ({cantidadFiltrosActivos} activos)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          3. BARRA DE FILTROS EN ESCRITORIO
          ========================================================================= */}
      <div className="hidden sm:flex w-full rounded-xl border border-gray-200 bg-white p-2.5 shadow-2xs flex-wrap items-center justify-between gap-2 text-xs font-[Poppins]">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0 font-[Poppins]">
          <div className="flex items-center gap-1.5">
            <Filter size={13} className="text-[#9B0F06]" />
            <span className="font-semibold text-gray-700 text-[11px] font-[Poppins]">Filtros:</span>
          </div>

          {/* Selector de proyecto ampliado */}
          <select
            value={proyectoId}
            onChange={(e) => handleSeleccionarProyecto(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1 text-[11px] text-gray-800 focus:border-[#9B0F06] focus:outline-none cursor-pointer flex-1 min-w-[280px] max-w-[550px] truncate font-medium font-[Poppins]"
          >
            {proyectosDisponibles.map((p) => (
              <option key={p.id} value={p.id} className="font-[Poppins]">
                {p.codigo ? `${p.codigo} · ` : ''}{p.nombre || p.nombre_oficial}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 text-[10.5px] font-[Poppins] shrink-0">
            <span className="text-gray-500 font-[Poppins]">Desde:</span>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-md px-1.5 py-1 text-[10.5px] text-gray-800 focus:border-[#9B0F06] focus:outline-none font-[Poppins]"
            />
          </div>

          <div className="flex items-center gap-1 text-[10.5px] font-[Poppins] shrink-0">
            <span className="text-gray-500 font-[Poppins]">Hasta:</span>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-md px-1.5 py-1 text-[10.5px] text-gray-800 focus:border-[#9B0F06] focus:outline-none font-[Poppins]"
            />
          </div>
        </div>
      </div>

      {/* TABS INTERNOS (CON ICONOS ADECUADOS Y POPPINS) */}
      <div className="border-b border-gray-200 bg-white px-2 rounded-t-lg font-[Poppins]">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'planificacion', label: 'Planificación Física (Curva S)', labelMovil: 'Planificación', icon: TrendingUp },
            { id: 'bitacora', label: 'Bitácora y Folios', labelMovil: 'Bitácora', icon: BarChart2 },
            { id: 'registros', label: 'Evidencias Fotográficas', labelMovil: 'Fotografía', icon: Camera },
            { id: 'finanzas', label: 'Finanzas y Estimaciones', labelMovil: 'Finanzas', icon: Receipt },
          ].map((t) => {
            const Icon = t.icon
            const active = tabActivo === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTabActivo(t.id as any)}
                className={`flex items-center gap-1.5 border-b-2 px-2.5 sm:px-3 py-2 text-xs font-semibold transition-all cursor-pointer font-[Poppins] ${
                  active
                    ? 'border-[#9B0F06] text-[#9B0F06] bg-red-50/30 font-bold'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <Icon size={14} className="shrink-0" />
                <span className="sm:hidden">{t.labelMovil}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* VISTAS DINÁMICAS */}
      {cargando ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-xl border border-gray-100 font-[Poppins]">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#9B0F06] border-t-transparent" />
        </div>
      ) : (
        <>
          {tabActivo === 'planificacion' && (
            <EstadisticasPlanificacion
              proyectos={proyectosDisponibles}
              proyectoSeleccionado={proyectoSeleccionado}
              proyectoDetalle={proyectoDetalle}
              renglonesProyecto={renglonesProyecto}
              renglonesCatalogo={renglonesBD}
            />
          )}
          {tabActivo === 'bitacora' && (
            <EstadisticasBitacora
              bitacoraData={bitacoraFiltrada}
              proyectos={proyectosDisponibles}
              proyectoSeleccionado={proyectoSeleccionado}
              usuarios={usuariosBD}
            />
          )}
          {tabActivo === 'registros' && (
            <EstadisticasRegistros
              fotografiasData={fotosFiltradas}
              proyectosList={proyectosDisponibles}
              proyectoSeleccionado={proyectoSeleccionado}
            />
          )}
          {tabActivo === 'finanzas' && (
            <EstadisticasFinanzas
              proyectosList={proyectosDisponibles}
              proyectoSeleccionado={proyectoSeleccionado}
              proyectoDetalle={proyectoDetalle}
              estimacionesManualesProp={estimacionesProyecto}
            />
          )}
        </>
      )}
    </div>
  )
}
