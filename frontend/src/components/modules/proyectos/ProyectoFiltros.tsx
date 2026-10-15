'use client'

import { Search, X, Trash2, Filter, SlidersHorizontal } from 'lucide-react'
import { EstadoProyecto } from '@/types/proyecto'
import { useMemo, useState, useEffect } from 'react'
import { apiGetDeduplicado } from '@/lib/api/cliente'
import { useCustomToast } from '@/hooks/useCustomToast'
import { Portal } from '@/components/ui/Portal'
import { useUIStore } from '@/stores/useUIStore'
import { Combobox } from '@/components/ui/Combobox'

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
  proyectos?: any[]
  busqueda: string
  setBusqueda: (valor: string) => void
  proyectoSeleccionadoId?: string
  setProyectoSeleccionadoId?: (valor: string) => void
  mostrarSelectorProyecto?: boolean
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
  modoSeleccion?: boolean
  setModoSeleccion?: React.Dispatch<React.SetStateAction<boolean>>
  seleccionados?: string[]
  onAbrirModalEliminar?: () => void
  ocultarBorrador?: boolean
}

export default function ProyectoFiltros({
  proyectos = [],
  busqueda,
  setBusqueda,
  proyectoSeleccionadoId = '',
  setProyectoSeleccionadoId,
  mostrarSelectorProyecto = false,
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
  modoSeleccion = false,
  setModoSeleccion,
  ocultarBorrador = false,
}: ProyectoFiltrosProps) {
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [municipiosData, setMunicipiosData] = useState<Municipio[]>([])
  const { showErrorToast } = useCustomToast()
  const [locationsLoaded, setLocationsLoaded] = useState(false)

  // Estado para el modal/drawer de filtros inferior en móviles
  const [modalFiltrosAbierto, setModalFiltrosAbierto] = useState(false)
  const setOcultarBottomNav = useUIStore((s) => s.setOcultarBottomNav)

  // Ocultar barra inferior de navegación y bloquear scroll al abrir el modal en móviles
  useEffect(() => {
    if (modalFiltrosAbierto) {
      setOcultarBottomNav(true)
      const prevOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        setOcultarBottomNav(false)
        document.body.style.overflow = prevOverflow
      }
    }
  }, [modalFiltrosAbierto, setOcultarBottomNav])

  const cargarUbicaciones = async () => {
    if (locationsLoaded) return
    try {
      setLocationsLoaded(true)
      const [resDep, resMun] = await Promise.all([
        apiGetDeduplicado('/mantenimiento/departamento?limite=500'),
        apiGetDeduplicado('/mantenimiento/municipio?limite=500'),
      ])
      if (resDep.data?.success) setDepartamentos(resDep.data.data)
      if (resMun.data?.success) setMunicipiosData(resMun.data.data)
    } catch (error: any) {
      console.error('Error fetching locations:', error)
    }
  }

  useEffect(() => {
    // Cargar ubicaciones al montar o cuando se requieran
    void cargarUbicaciones()
  }, [])

  useEffect(() => {
    if (filtroDepa || modalFiltrosAbierto) {
      void cargarUbicaciones()
    }
  }, [filtroDepa, modalFiltrosAbierto])

  const estados: Array<{ value: EstadoProyecto | 'todos'; label: string }> = useMemo(() => {
    const todosEstados: Array<{ value: EstadoProyecto | 'todos'; label: string }> = [
      { value: 'todos', label: 'Todos los estados' },
      { value: 'borrador', label: 'Borradores' },
      { value: 'activo', label: 'Activo' },
      { value: 'en_revision', label: 'En Revisión' },
      { value: 'completado', label: 'Completado' },
      { value: 'pausado', label: 'Pausado' },
    ]
    if (ocultarBorrador) {
      return todosEstados.filter((e) => e.value !== 'borrador')
    }
    return todosEstados
  }, [ocultarBorrador])

  // Filtrar proyectos si ocultarBorrador es true
  const proyectosFiltrados = useMemo(() => {
    if (!ocultarBorrador) return proyectos
    return (proyectos || []).filter((p) => {
      const estadoNorm = (p.estado || p.estado_codigo || '').toLowerCase().trim()
      return estadoNorm !== 'borrador'
    })
  }, [proyectos, ocultarBorrador])

  // Departamentos con proyectos
  const departamentosConProyectos = useMemo(() => {
    if (!proyectosFiltrados || proyectosFiltrados.length === 0) return []
    return departamentos.filter((d) =>
      proyectosFiltrados.some((p) => {
        const depId = p.departamentoId || p.departamento_id
        if (depId && String(depId) === String(d.id)) return true
        const depNombre = p.departamento || p.departamento_nombre || ''
        if (depNombre && depNombre.toLowerCase().trim() === d.nombre.toLowerCase().trim()) return true
        const ub = (p.ubicacion || p.ubicacionFisica || '').toLowerCase()
        const nom = (p.nombre || p.nombreOficial || '').toLowerCase()
        const dNom = d.nombre.toLowerCase()
        return ub.includes(dNom) || nom.includes(dNom)
      })
    )
  }, [departamentos, proyectosFiltrados])

  const municipios = useMemo(() => {
    if (!filtroDepa) return []
    const dep = departamentos.find((d) => d.nombre === filtroDepa)
    if (!dep) return []
    const mData = municipiosData.filter((m) => m.departamento_id === dep.id)
    if (!proyectosFiltrados || proyectosFiltrados.length === 0) return []
    return mData.filter((m) =>
      proyectosFiltrados.some((p) => {
        const muniId = p.municipioId || p.municipio_id
        if (muniId && String(muniId) === String(m.id)) return true
        const muniNombre = p.municipio || p.municipio_nombre || ''
        if (muniNombre && muniNombre.toLowerCase().trim() === m.nombre.toLowerCase().trim()) return true
        const ub = (p.ubicacion || p.ubicacionFisica || '').toLowerCase()
        const nom = (p.nombre || p.nombreOficial || '').toLowerCase()
        const mNom = m.nombre.toLowerCase()
        return ub.includes(mNom) || nom.includes(mNom)
      })
    )
  }, [filtroDepa, departamentos, municipiosData, proyectosFiltrados])

  const [fechaInicioError, setFechaInicioError] = useState(false)
  const [fechaFinError, setFechaFinError] = useState(false)

  const getDiasEnMes = (mes: number, ano: number): number => {
    return new Date(ano, mes, 0).getDate()
  }

  const esFechaCalendarioValida = (fechaStr: string): { valida: boolean; error?: string } => {
    if (!fechaStr || !/^\d{4}-\d{2}-\d{2}$/.test(fechaStr))
      return { valida: false, error: 'Formato de fecha inválido' }
    const [yStr, mStr, dStr] = fechaStr.split('-')
    const year = parseInt(yStr, 10)
    const month = parseInt(mStr, 10)
    const day = parseInt(dStr, 10)

    const nombresMeses = [
      '',
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ]

    if (month < 1 || month > 12) return { valida: false, error: 'Mes inválido' }
    const maxDias = getDiasEnMes(month, year)
    if (day > maxDias) {
      return {
        valida: false,
        error: `La fecha no es válida. ${nombresMeses[month]} solo tiene hasta ${maxDias} días`,
      }
    }
    if (day < 1) return { valida: false, error: 'Día inválido' }
    if (year < 1900 || year > 2100) return { valida: false, error: 'Año fuera de rango' }

    return { valida: true }
  }

  const handleFechaInicioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isBadInput = e.target.validity?.badInput
    const val = e.target.value

    if (isBadInput) {
      setFechaInicioError(true)
      setFiltroFechaInicio('INVALID')
      showErrorToast('La fecha ingresada no existe en el calendario. Verifica el día y el mes.')
      return
    }

    if (!val) {
      setFechaInicioError(false)
      setFiltroFechaInicio('')
      if (filtroFechaFin && filtroFechaFin !== 'INVALID') {
        const valFin = esFechaCalendarioValida(filtroFechaFin)
        if (!valFin.valida) {
          setFechaFinError(true)
          showErrorToast(valFin.error || 'Fecha fin no válida')
        } else {
          setFechaFinError(false)
        }
      }
      return
    }

    const { valida, error } = esFechaCalendarioValida(val)
    if (!valida) {
      setFechaInicioError(true)
      setFiltroFechaInicio('INVALID')
      showErrorToast(error || 'Fecha de inicio no válida en el calendario')
      return
    }

    setFechaInicioError(false)
    setFiltroFechaInicio(val)

    if (filtroFechaFin && filtroFechaFin !== 'INVALID') {
      const valFin = esFechaCalendarioValida(filtroFechaFin)
      if (!valFin.valida) {
        setFechaFinError(true)
        showErrorToast(valFin.error || 'Fecha fin no válida')
      } else {
        const dInicio = new Date(val)
        const dFin = new Date(filtroFechaFin)
        if (dFin < dInicio) {
          setFechaFinError(true)
          showErrorToast('La fecha "Hasta" debe ser posterior a la fecha "Desde"')
        } else {
          setFechaFinError(false)
        }
      }
    }
  }

  const handleFechaFinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isBadInput = e.target.validity?.badInput
    const val = e.target.value

    if (isBadInput) {
      setFechaFinError(true)
      setFiltroFechaFin('INVALID')
      showErrorToast('La fecha ingresada no existe en el calendario. Verifica el día y el mes.')
      return
    }

    if (!val) {
      setFechaFinError(false)
      setFiltroFechaFin('')
      return
    }

    const { valida, error } = esFechaCalendarioValida(val)
    if (!valida) {
      setFechaFinError(true)
      setFiltroFechaFin('INVALID')
      showErrorToast(error || 'Fecha fin no válida en el calendario')
      return
    }

    if (filtroFechaInicio && filtroFechaInicio !== 'INVALID') {
      const valInicio = esFechaCalendarioValida(filtroFechaInicio)
      if (valInicio.valida) {
        const dInicio = new Date(filtroFechaInicio)
        const dFin = new Date(val)
        if (dFin < dInicio) {
          setFechaFinError(true)
          setFiltroFechaFin('INVALID')
          showErrorToast('La fecha "Hasta" debe ser posterior a la fecha "Desde"')
          return
        }
      }
    }

    setFechaFinError(false)
    setFiltroFechaFin(val)
  }

  const opcionesProyectos = useMemo(() => {
    const list = proyectosFiltrados.map((p) => {
      const nom = p.nombre || p.nombre_oficial || p.codigo || 'Proyecto'
      return {
        value: String(p.id),
        label: nom,
      }
    })
    return [{ value: '', label: 'Todos los Proyectos' }, ...list]
  }, [proyectosFiltrados])

  // Contador de filtros secundarios activos (excluyendo búsqueda de texto)
  const filtrosSecundariosActivos = useMemo(() => {
    let count = 0
    if (estadoFiltro !== 'todos') count++
    if (filtroDepa !== '') count++
    if (filtroMuni !== '') count++
    if (filtroFechaInicio !== '' && filtroFechaInicio !== 'INVALID') count++
    if (filtroFechaFin !== '' && filtroFechaFin !== 'INVALID') count++
    return count
  }, [estadoFiltro, filtroDepa, filtroMuni, filtroFechaInicio, filtroFechaFin])

  const hayFiltrosActivos =
    busqueda !== '' ||
    (mostrarSelectorProyecto && Boolean(proyectoSeleccionadoId)) ||
    filtrosSecundariosActivos > 0

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. VISTA MÓVIL (< sm): Barra compacta estilo Bitácora                      */}
      {/* (Buscar + Combobox Proyecto + Botón SlidersHorizontal)                    */}
      {/* ========================================================================= */}
      <div className="sm:hidden w-full rounded-xl border border-gray-200 bg-white p-2 shadow-2xs font-[Poppins] relative z-30">
        <div className="flex items-center gap-1.5 w-full">
          {/* Barra de Búsqueda */}
          <div className="relative flex-1 min-w-0">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="filtro-control w-full h-[32px] border border-gray-200 bg-gray-50 focus:bg-white rounded-lg pl-7 pr-2 text-[11px] font-normal text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#9B0F06] transition-colors"
            />
          </div>

          {/* Selector de Proyecto Combobox */}
          {mostrarSelectorProyecto && (
            <div className="w-[145px] shrink-0">
              <Combobox
                options={opcionesProyectos}
                value={proyectoSeleccionadoId}
                onChange={(val) => setProyectoSeleccionadoId?.(val)}
                placeholder={proyectos.length > 0 ? "Proyecto..." : "Sin proyectos"}
                allowNumbers={true}
                inputClassName="filtro-control h-[32px] text-[10px] sm:text-[11px] !py-0 !rounded-lg font-normal pr-5"
                dropdownClassName="z-50 shadow-2xl min-w-[260px] w-max max-w-[85vw]"
              />
            </div>
          )}

          {/* Botón de Filtro (Abre Bottom Sheet Modal) */}
          <button
            type="button"
            onClick={() => {
              void cargarUbicaciones()
              setModalFiltrosAbierto(true)
            }}
            className={`relative flex items-center justify-center h-[32px] w-[34px] shrink-0 rounded-lg border transition-all cursor-pointer shadow-2xs active:scale-95 ${
              filtrosSecundariosActivos > 0
                ? 'bg-[#9B0F06] border-[#9B0F06] text-white'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
            title="Abrir filtros"
          >
            <SlidersHorizontal size={14} className="stroke-[2.2]" />
            {filtrosSecundariosActivos > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white text-[#9B0F06] text-[9px] font-black border border-[#9B0F06] flex items-center justify-center">
                {filtrosSecundariosActivos}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. VISTA DESKTOP (>= sm): Barra completa                                 */}
      {/* ========================================================================= */}
      <div className="hidden sm:flex sm:items-center sm:gap-2 w-full max-w-full overflow-visible rounded-xl border border-gray-200 bg-white p-2 sm:p-2.5 shadow-sm font-[Poppins] relative z-20">
        {/* FILA 1: Barra de Búsqueda y Selectores de acción */}
        <div className="project-filter-primary flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2 font-[Poppins]">
          <div className="relative flex-1 min-w-0">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar proyectos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="filtro-control w-full bg-gray-50 border border-gray-200 rounded-md pl-8 pr-2.5 py-1 text-[10.5px] sm:text-[11px] font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#9B0F06] focus:bg-white transition-colors h-[30px]"
            />
          </div>

          {/* Selector de Proyecto en Desktop si está activado */}
          {mostrarSelectorProyecto && (
            <div className="w-[180px] xl:w-[220px] shrink-0">
              <Combobox
                options={opcionesProyectos}
                value={proyectoSeleccionadoId}
                onChange={(val) => setProyectoSeleccionadoId?.(val)}
                placeholder="Todos los proyectos"
                allowNumbers={true}
                inputClassName="filtro-control h-[30px] text-[11px] !py-0 !rounded-md font-medium pr-5"
                dropdownClassName="z-50 shadow-2xl min-w-[280px]"
              />
            </div>
          )}

          {/* Botón Limpiar */}
          {hayFiltrosActivos && (
            <button
              type="button"
              onClick={() => {
                setFechaInicioError(false)
                setFechaFinError(false)
                onLimpiar()
              }}
              className="inline-flex shrink-0 items-center gap-1 rounded-md bg-gray-100 px-2 h-[30px] text-[10px] font-bold text-gray-600 transition-colors hover:bg-gray-200 cursor-pointer"
              title="Limpiar filtros"
            >
              <X size={12} />
              <span className="hidden sm:inline">Limpiar</span>
            </button>
          )}
        </div>

        {/* FILA 2: Selectores, Fechas y Basurero al extremo derecho EN DESKTOP */}
        <div className="flex shrink-0 flex-nowrap items-center gap-1.5 font-[Poppins]">
        {/* Estado Dropdown */}
        <select
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value as EstadoProyecto | 'todos')}
          className="filtro-control h-[30px] min-w-[120px] max-w-[140px] rounded-md border border-gray-200 bg-white px-2 text-[10.5px] font-medium text-gray-800 focus:border-[#9B0F06] focus:outline-none cursor-pointer truncate"
        >
          {estados.map((estado) => (
            <option key={estado.value} value={estado.value}>
              {estado.label}
            </option>
          ))}
        </select>

        {/* Departamento Dropdown */}
        <select
          value={filtroDepa}
          onFocus={cargarUbicaciones}
          onMouseEnter={cargarUbicaciones}
          onChange={(e) => {
            setFiltroDepa(e.target.value)
            setFiltroMuni('')
          }}
          className="filtro-control h-[30px] min-w-[125px] max-w-[150px] rounded-md border border-gray-200 bg-white px-2 text-[10.5px] font-medium text-gray-800 focus:border-[#9B0F06] focus:outline-none cursor-pointer truncate"
        >
          <option value="">Todos los Deptos.</option>
          {departamentosConProyectos.map((d) => (
            <option key={d.id} value={d.nombre}>
              {d.nombre}
            </option>
          ))}
        </select>

        {/* Municipio Dropdown */}
        <select
          value={filtroMuni}
          onChange={(e) => setFiltroMuni(e.target.value)}
          disabled={!filtroDepa}
          className="filtro-control h-[30px] min-w-[125px] max-w-[150px] rounded-md border border-gray-200 bg-white px-2 text-[10.5px] font-medium text-gray-800 focus:border-[#9B0F06] focus:outline-none disabled:bg-gray-100 disabled:opacity-50 cursor-pointer truncate"
        >
          <option value="">Todos los Municipios</option>
          {municipios.map((m) => (
            <option key={m.id} value={m.nombre}>
              {m.nombre}
            </option>
          ))}
        </select>

        {/* Fecha Inicio */}
        <div
          className={`flex items-center gap-1 bg-white border rounded-md px-1.5 h-[30px] transition-colors ${
            fechaInicioError
              ? 'border-red-500 ring-1 ring-red-400 bg-red-50/20'
              : 'border-gray-200 focus-within:border-[#9B0F06]'
          }`}
        >
          <span
            className={`text-[9px] font-bold uppercase tracking-wider shrink-0 ${
              fechaInicioError ? 'text-red-500' : 'text-gray-400'
            }`}
          >
            Desde:
          </span>
          <input
            type="date"
            value={filtroFechaInicio === 'INVALID' ? '' : filtroFechaInicio}
            onChange={handleFechaInicioChange}
            className="filtro-control border-none bg-transparent text-[10px] font-medium text-gray-700 focus:outline-none w-full"
          />
        </div>

        {/* Fecha Fin */}
        <div
          className={`flex items-center gap-1 bg-white border rounded-md px-1.5 h-[30px] transition-colors ${
            fechaFinError
              ? 'border-red-500 ring-1 ring-red-400 bg-red-50/20'
              : 'border-gray-200 focus-within:border-[#9B0F06]'
          }`}
        >
          <span
            className={`text-[9px] font-bold uppercase tracking-wider shrink-0 ${
              fechaFinError ? 'text-red-500' : 'text-gray-400'
            }`}
          >
            Hasta:
          </span>
          <input
            type="date"
            value={filtroFechaFin === 'INVALID' ? '' : filtroFechaFin}
            min={filtroFechaInicio && filtroFechaInicio !== 'INVALID' ? filtroFechaInicio : undefined}
            onChange={handleFechaFinChange}
            className="filtro-control border-none bg-transparent text-[10px] font-medium text-gray-700 focus:outline-none w-full"
          />
        </div>

        {/* Botón de Basurero / Selección en la esquina derecha */}
        {setModoSeleccion && (
          <button
            type="button"
            onClick={() => setModoSeleccion((prev) => !prev)}
            title={modoSeleccion ? 'Desactivar selección' : 'Activar selección para eliminar proyectos'}
            className={`inline-flex shrink-0 items-center justify-center rounded-md h-[30px] text-[10px] font-bold transition-all cursor-pointer shadow-2xs ml-1 ${
              modoSeleccion
                ? 'bg-[#9B0F06] text-white hover:bg-[#5E0006] px-2.5 gap-1'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-red-600 w-[30px]'
            }`}
          >
            {modoSeleccion ? (
              <>
                <X size={12} />
                <span>Cancelar</span>
              </>
            ) : (
              <Trash2 size={12} />
            )}
          </button>
        )}
      </div>
    </div>

      {/* ========================================================================= */}
      {/* MODAL / BOTTOM SHEET DE FILTROS PARA MÓVILES (Desliza de abajo hacia arriba) */}
      {/* ========================================================================= */}
      {modalFiltrosAbierto && (
        <Portal>
          <div
            className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-xs flex flex-col justify-end font-[Poppins] animate-in fade-in duration-200"
            onClick={() => setModalFiltrosAbierto(false)}
          >
            <div
              className="w-full sm:max-w-md mx-auto bg-white rounded-t-2xl shadow-2xl border-t border-gray-200 max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Barra superior de arrastre */}
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-2.5 mb-1 shrink-0" />

              {/* Cabecera del Modal */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-[#9B0F06]/10 text-[#9B0F06]">
                    <Filter size={15} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 leading-tight">
                      Filtros de Proyectos
                    </h3>
                    <p className="text-[10px] text-gray-400">
                      Refina los proyectos de obra vial
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setModalFiltrosAbierto(false)}
                  className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                  title="Cerrar filtros"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Cuerpo del Modal con los filtros ordenados como en la imagen */}
              <div className="p-4 space-y-3 overflow-y-auto flex-1 font-[Poppins] filtro-modal-body">
                {/* 1. Selector de Estado y Departamento en Grid 2 columnas */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="filtro-label text-[8.5px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                      Estado
                    </label>
                    <select
                      value={estadoFiltro}
                      onChange={(e) => setEstadoFiltro(e.target.value as EstadoProyecto | 'todos')}
                      className="filtro-control h-[34px] w-full rounded-lg border border-gray-200 bg-white px-2 text-[11px] font-medium text-gray-800 focus:border-[#9B0F06] focus:outline-none cursor-pointer truncate"
                    >
                      {estados.map((estado) => (
                        <option key={estado.value} value={estado.value}>
                          {estado.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="filtro-label text-[8.5px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                      Departamento
                    </label>
                    <select
                      value={filtroDepa}
                      onFocus={cargarUbicaciones}
                      onChange={(e) => {
                        setFiltroDepa(e.target.value)
                        setFiltroMuni('')
                      }}
                      className="filtro-control h-[34px] w-full rounded-lg border border-gray-200 bg-white px-2 text-[11px] font-medium text-gray-800 focus:border-[#9B0F06] focus:outline-none cursor-pointer truncate"
                    >
                      <option value="">Todos los Deptos.</option>
                      {departamentosConProyectos.map((d) => (
                        <option key={d.id} value={d.nombre}>
                          {d.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 2. Selector de Municipio (Ancho completo) */}
                <div>
                  <label className="filtro-label text-[8.5px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                    Municipio
                  </label>
                  <select
                    value={filtroMuni}
                    onChange={(e) => setFiltroMuni(e.target.value)}
                    disabled={!filtroDepa}
                    className="filtro-control h-[34px] w-full rounded-lg border border-gray-200 bg-white px-2.5 text-[11px] font-medium text-gray-800 focus:border-[#9B0F06] focus:outline-none disabled:bg-gray-100 disabled:opacity-50 cursor-pointer truncate"
                  >
                    <option value="">Todos los Municipios</option>
                    {municipios.map((m) => (
                      <option key={m.id} value={m.nombre}>
                        {m.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Rango de Fechas (Desde y Hasta en 2 columnas) */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="filtro-label text-[8.5px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                      Desde
                    </label>
                    <div
                      className={`flex items-center gap-1 bg-white border rounded-lg px-2 h-[34px] transition-colors ${
                        fechaInicioError
                          ? 'border-red-500 ring-1 ring-red-400 bg-red-50/20'
                          : 'border-gray-200 focus-within:border-[#9B0F06]'
                      }`}
                    >
                      <input
                        type="date"
                        value={filtroFechaInicio === 'INVALID' ? '' : filtroFechaInicio}
                        onChange={handleFechaInicioChange}
                        className="filtro-control border-none bg-transparent text-[11px] font-medium text-gray-700 focus:outline-none w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="filtro-label text-[8.5px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                      Hasta
                    </label>
                    <div
                      className={`flex items-center gap-1 bg-white border rounded-lg px-2 h-[34px] transition-colors ${
                        fechaFinError
                          ? 'border-red-500 ring-1 ring-red-400 bg-red-50/20'
                          : 'border-gray-200 focus-within:border-[#9B0F06]'
                      }`}
                    >
                      <input
                        type="date"
                        value={filtroFechaFin === 'INVALID' ? '' : filtroFechaFin}
                        min={filtroFechaInicio && filtroFechaInicio !== 'INVALID' ? filtroFechaInicio : undefined}
                        onChange={handleFechaFinChange}
                        className="filtro-control border-none bg-transparent text-[11px] font-medium text-gray-700 focus:outline-none w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones inferiores del Modal */}
              <div className="p-3 border-t border-gray-100 bg-gray-50 flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setFechaInicioError(false)
                    setFechaFinError(false)
                    onLimpiar()
                  }}
                  className="flex-1 py-2 rounded-xl text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Limpiar filtros
                </button>
                <button
                  type="button"
                  onClick={() => setModalFiltrosAbierto(false)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-[#9B0F06] hover:bg-[#5E0006] transition-colors cursor-pointer shadow-sm"
                >
                  Aplicar filtros
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  )
}
