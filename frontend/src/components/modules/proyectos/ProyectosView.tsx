'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2, ChevronLeft, ChevronRight, List, MapPin, Plus, User, LayoutGrid, Trash2, Loader2, Calendar,
  X, ShieldAlert, AlertCircle, CheckCircle2
} from 'lucide-react'
import { api, apiGetDeduplicado, limpiarCacheMemoria } from '@/lib/api/cliente'
import { EstadoProyecto, Proyecto } from '@/types/proyecto'
import { useCustomToast } from '@/hooks/useCustomToast'
import { useAuthStore } from '@/stores/useAuthStore'
import ProyectoFiltros from '@/components/modules/proyectos/ProyectoFiltros'
import ProyectoCard from '@/components/modules/proyectos/ProyectoCard'
import ProyectoEstadoBadge from './ProyectoEstadoBadge'
import { formatearRangoFechas, debeMostrarMontoYAvance, esProyectoEliminable } from '@/lib/utils/formatters'

const estadoColor: Record<EstadoProyecto, string> = {
  borrador: '#9CA3AF',
  activo: '#16a34a',
  en_revision: '#3B82F6',
  completado: '#10B981',
  pausado: '#D97706',
}

function ProyectoListItem({
  proyecto,
  onClick,
  modoSeleccion = false,
  isSelected = false,
  onToggleSelect,
}: {
  proyecto: Proyecto
  onClick: () => void
  modoSeleccion?: boolean
  isSelected?: boolean
  onToggleSelect?: () => void
}) {
  const color = estadoColor[proyecto.estado] || '#9CA3AF'
  const eliminableInfo = esProyectoEliminable(proyecto)

  return (
    <div
      onClick={(e) => {
        if (modoSeleccion) {
          e.preventDefault()
          e.stopPropagation()
          if (eliminableInfo.puedeEliminar) {
            onToggleSelect?.()
          }
        } else {
          onClick()
        }
      }}
      className={`flex w-full items-center rounded-xl border px-3.5 py-2.5 text-left shadow-2xs transition-all cursor-pointer ${
        isSelected ? 'border-gray-400 bg-gray-100/70 ring-1 ring-gray-300' : 'border-gray-100 bg-white hover:shadow-md hover:-translate-y-0.5'
      }`}
    >
      {modoSeleccion && (
        <input
          type="checkbox"
          checked={isSelected}
          disabled={!eliminableInfo.puedeEliminar}
          title={!eliminableInfo.puedeEliminar ? eliminableInfo.motivo : 'Seleccionar para eliminar'}
          onChange={(e) => {
            e.stopPropagation()
            if (eliminableInfo.puedeEliminar) {
              onToggleSelect?.()
            }
          }}
          className={`mr-3 h-4 w-4 rounded border-gray-300 text-[#9B0F06] focus:ring-[#9B0F06] shrink-0 ${
            !eliminableInfo.puedeEliminar ? 'opacity-30 cursor-not-allowed bg-gray-100' : 'cursor-pointer'
          }`}
        />
      )}

      <div className="mr-3 h-8 w-1 shrink-0 rounded-full" style={{ background: color }} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <p className="truncate text-[12px] font-bold text-gray-900 font-[Poppins]">{proyecto.nombre}</p>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-[10px] text-gray-500 font-[Poppins]">
          <span className="inline-flex items-center gap-1">
            <MapPin size={11} className="text-[#9B0F06]" />
            {proyecto.ubicacion}
          </span>
          <span className="inline-flex items-center gap-1">
            <User size={11} className="text-gray-400" />
            {proyecto.responsable}
          </span>
        </div>
      </div>

      {debeMostrarMontoYAvance(proyecto) && (
        <div className="mx-6 hidden w-32 shrink-0 lg:block">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[9px] font-semibold text-gray-400">Avance</span>
            <span className="text-[9px] font-bold text-gray-900">
              {Number(proyecto.avance || 0) % 1 === 0 ? Math.round(proyecto.avance || 0) : Number(proyecto.avance || 0).toFixed(1)}%
            </span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-[#9B0F06]" style={{ width: `${Math.min(100, Math.max(0, proyecto.avance || 0))}%` }} />
          </div>
        </div>
      )}

      {debeMostrarMontoYAvance(proyecto) && (
        <p className="hidden shrink-0 text-right text-[11px] font-bold text-gray-900 md:block font-[Poppins] whitespace-nowrap min-w-[130px]">
          Q {Number(proyecto.presupuesto).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      )}

      <div className="hidden shrink-0 text-right xl:flex items-center justify-end gap-1.5 text-[10.5px] text-gray-500 whitespace-nowrap min-w-[190px]">
        <Calendar size={12} className="text-[#9B0F06] shrink-0" />
        <span className="font-medium font-[Poppins]">{formatearRangoFechas(proyecto.fechaInicio, proyecto.fechaFin)}</span>
      </div>

      <ChevronRight size={14} className="ml-3 shrink-0 text-gray-300" />
    </div>
  )
}


function mapearProyectoApi(p: any): Proyecto {
  const totalBitacoras = Number(p.totalBitacoras || 0)
  const estadoNorm = (p.estado || p.estado_codigo || 'borrador').toLowerCase() as EstadoProyecto
  const esEliminable = typeof p.esEliminable === 'boolean'
    ? p.esEliminable
    : estadoNorm === 'borrador'
  const motivoNoEliminable = p.motivoNoEliminable || (
    estadoNorm !== 'borrador'
      ? `Solo proyectos en modo Borrador pueden eliminarse (estado actual: ${estadoNorm})`
      : ''
  )

  return {
    id: p.id,
    codigo: p.codigo || p.numero_contrato_original || 'PROY',
    nombre: p.nombre_oficial || p.nombre || 'Proyecto Sin Nombre',
    descripcion: p.descripcion_proyecto || p.descripcion || '',
    ubicacion: p.ubicacion_fisica || p.direccion || p.tramo || p.ubicacion || 'Ubicación General',
    responsable: p.delegadoResidente || p.delegado_residente || p.responsable || 'No asignado',
    responsable_id: p.responsable_id || p.responsableId || null,
    delegadoResidente: p.delegadoResidente || p.delegado_residente || '',
    delegadoResidenteId: p.delegadoResidenteId || p.delegado_residente_id || null,
    presupuesto: Number(p.monto_contractual_original || p.presupuesto || p.monto_original || 0),
    avance: Number(p.avance || 0),
    estado: estadoNorm,
    fechaInicio: p.fechaInicioContractual || p.fechaInicio || p.fecha_inicio_contractual || p.fecha_inicio || '',
    fechaFin: p.fechaFinalContractual || p.fechaFin || p.fecha_final_contractual || p.fecha_fin_contractual_plan || p.fecha_fin || '',
    departamentoId: p.departamento_id || p.departamentoId,
    municipioId: p.municipio_id || p.municipioId,
    departamentoNombre: p.departamentoNombre || p.departamento_nombre || '',
    municipioNombre: p.municipioNombre || p.municipio_nombre || '',
    tieneSabana: Boolean(p.tieneSabana || (Array.isArray(p.renglon_trabajo) && p.renglon_trabajo.length > 0) || p.usarModoSabana),
    usarModoSabana: Boolean(p.usarModoSabana || p.tieneSabana || (Array.isArray(p.renglon_trabajo) && p.renglon_trabajo.length > 0)),
    modoGestionFinanciera: p.modoGestionFinanciera || (p.tieneSabana ? 'sabana' : 'manual'),
    totalRenglones: Number(p.totalRenglones || 0),
    totalBitacoras,
    esEliminable,
    motivoNoEliminable,
    equipo: Array.isArray(p.equipo) ? p.equipo : [],
    creadoEn: p.creadoEn || p.creado_en || p.created_at || new Date().toISOString(),
    documentos: Array.isArray(p.documentos) ? p.documentos : [],
    fotografias: Array.isArray(p.fotografias) ? p.fotografias : [],
    fases: Array.isArray(p.fases) ? p.fases : [],
  }
}

export function ProyectosView() {
  const router = useRouter()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [busqueda, setBusqueda] = useState('')
  const [proyectoFiltroId, setProyectoFiltroId] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoProyecto | 'todos'>('todos')
  
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(6)
  const [filtroDepa, setFiltroDepa] = useState('')
  const [filtroMuni, setFiltroMuni] = useState('')
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('')
  const [filtroFechaFin, setFiltroFechaFin] = useState('')

  const [vista, setVista] = useState<'lista' | 'detalles'>('lista')
  const [proyectosReales, setProyectosReales] = useState<Proyecto[]>([])
  const [loadingProyectos, setLoadingProyectos] = useState(true)

  // Estado para eliminación masiva / selección
  const [modoSeleccion, setModoSeleccion] = useState(false)
  const [seleccionados, setSeleccionados] = useState<string[]>([])
  const [showModalEliminar, setShowModalEliminar] = useState(false)
  const [isEliminando, setIsEliminando] = useState(false)

  const handleConfirmarEliminar = async () => {
    if (seleccionados.length === 0) return

    // Validar que ningún proyecto seleccionado viole las reglas
    const invalidos = seleccionados
      .map((id) => proyectosReales.find((p) => p.id === id))
      .filter((p) => p && !esProyectoEliminable(p).puedeEliminar)

    if (invalidos.length > 0) {
      showErrorToast(
        'No se pueden eliminar proyectos que no estén en modo Borrador o tengan registros de bitácora vinculados.'
      )
      return
    }

    try {
      setIsEliminando(true)
      await Promise.all(
        seleccionados.map((id) => api.delete(`/proyectos/${id}`))
      )
      showSuccessToast(
        `Se ${seleccionados.length === 1 ? 'eliminó el proyecto' : `eliminaron ${seleccionados.length} proyectos`} exitosamente`
      )
      limpiarCacheMemoria('/proyectos')
      try {
        sessionStorage.removeItem('domun_proyectos_cache')
        seleccionados.forEach((id) => {
          localStorage.removeItem(`domun_estimacion_activa_${id}`)
          localStorage.removeItem(`domun_proyecto_${id}`)
          localStorage.removeItem(`proyecto_${id}`)
        })
        window.dispatchEvent(new Event('storage'))
        window.dispatchEvent(new CustomEvent('sabana-alertas-updated'))
      } catch (e) {}
      setSeleccionados([])
      setModoSeleccion(false)
      setShowModalEliminar(false)

      setLoadingProyectos(true)
      const res = await apiGetDeduplicado('/proyectos', { bypassCache: true })
      if (res.data?.success && Array.isArray(res.data.data)) {
        const mapeados: Proyecto[] = res.data.data.map(mapearProyectoApi)
        setProyectosReales(mapeados)
        try { sessionStorage.setItem('domun_proyectos_cache', JSON.stringify(mapeados)) } catch (e) {}
      } else {
        setProyectosReales([])
      }
    } catch (error: any) {
      console.error('Error eliminando proyectos:', error)
      showErrorToast(error.response?.data?.message || 'Error al eliminar los proyectos seleccionados')
    } finally {
      setIsEliminando(false)
      setLoadingProyectos(false)
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem('proyectos_vista')
    if (saved === 'lista' || saved === 'detalles') {
      setVista(saved)
    }

    // 1. Carga instantánea desde caché local para evitar esperas visuales
    try {
      const cached = sessionStorage.getItem('domun_proyectos_cache')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mapa = new Map<string, Proyecto>()
          for (const item of parsed) {
            if (item && item.id && !mapa.has(String(item.id))) {
              mapa.set(String(item.id), item)
            }
          }
          setProyectosReales(Array.from(mapa.values()))
          setLoadingProyectos(false)
        }
      }
    } catch (e) {
      // Ignorar error de parsing en caché local
    }
  }, [])

  useEffect(() => {
    // Si no hay datos en memoria/caché previa, mostrar indicador de carga
    if (proyectosReales.length === 0) {
      setLoadingProyectos(true)
    }

    apiGetDeduplicado('/proyectos')
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          const mapeados: Proyecto[] = res.data.data.map(mapearProyectoApi)
          const mapa = new Map<string, Proyecto>()
          for (const item of mapeados) {
            if (item && item.id && !mapa.has(String(item.id))) {
              mapa.set(String(item.id), item)
            }
          }
          const deduplicados = Array.from(mapa.values())
          setProyectosReales(deduplicados)
          try {
            sessionStorage.setItem('domun_proyectos_cache', JSON.stringify(deduplicados))
          } catch (e) {}
        } else {
          setProyectosReales([])
        }
      })
      .catch((err) => {
        console.error('Error al cargar proyectos de la base de datos:', err)
      })
      .finally(() => {
        setLoadingProyectos(false)
      })
  }, [])

  const handleVistaChange = (v: 'lista' | 'detalles') => {
    setVista(v)
    if (v === 'detalles') {
      setPorPagina(3)
    }
    setPagina(1)
    localStorage.setItem('proyectos_vista', v)
  }

  const handleLimpiarFiltros = () => {
    setBusqueda('')
    setProyectoFiltroId('')
    setEstadoFiltro('todos')
    setFiltroDepa('')
    setFiltroMuni('')
    setFiltroFechaInicio('')
    setFiltroFechaFin('')
    setPagina(1)
  }

  const usuario = useAuthStore((s: any) => s.profile)
  const esResidenteODelegado = useMemo(() => {
    const rolStr = (usuario?.rol || '').toLowerCase().trim()
    const cargoStr = (usuario?.cargo || '').toLowerCase().trim()
    return (
      rolStr.includes('residente') ||
      rolStr.includes('delegado') ||
      cargoStr.includes('residente') ||
      cargoStr.includes('delegado')
    ) && !rolStr.includes('admin') && !rolStr.includes('director') && !rolStr.includes('gerencia')
  }, [usuario])

  const proyectosFiltrados = useMemo(() => {
    return proyectosReales.filter((proyecto) => {
      // Si es Residente o Delegado, solo ver proyectos donde esté asignado (o borradores recién creados sin asignar)
      if (esResidenteODelegado && usuario?.id) {
        const pAny = proyecto as any
        const uId = usuario.id
        const uNombre = (usuario.nombre || `${usuario.primer_nombre || ''} ${usuario.primer_apellido || ''}`).toLowerCase().trim()

        const esResp = pAny.responsable_id === uId || pAny.responsableId === uId || pAny.responsable === uId
        const esDel = pAny.delegadoResidenteId === uId || pAny.delegado_residente_id === uId
        const enEquipo = Array.isArray(pAny.equipo) && pAny.equipo.some((m: any) => m.id === uId || m.usuarioId === uId || (m.nombre && m.nombre.toLowerCase().trim().includes(uNombre)))
        const coincideNombre = pAny.responsable && typeof pAny.responsable === 'string' && uNombre.length > 2 && pAny.responsable.toLowerCase().includes(uNombre)
        const esBorradorSinAsignar = proyecto.estado === 'borrador' && !pAny.responsable_id && !pAny.delegadoResidenteId

        if (!esResp && !esDel && !enEquipo && !coincideNombre && !esBorradorSinAsignar) {
          return false
        }
      }

      if (proyectoFiltroId && String(proyecto.id) !== String(proyectoFiltroId)) {
        return false
      }

      const texto = `${proyecto.codigo} ${proyecto.nombre} ${proyecto.ubicacion} ${proyecto.responsable}`.toLowerCase()
      const matchBusqueda = texto.includes(busqueda.toLowerCase())
      const matchEstado = estadoFiltro === 'todos' || proyecto.estado === estadoFiltro
      
      const matchDepa = filtroDepa ? proyecto.ubicacion.toLowerCase().includes(filtroDepa.toLowerCase()) : true
      const matchMuni = filtroMuni ? proyecto.ubicacion.toLowerCase().includes(filtroMuni.toLowerCase()) : true
      
      let matchFecha = true
      if (filtroFechaInicio === 'INVALID' || filtroFechaFin === 'INVALID') {
        return false
      }
      if (filtroFechaInicio || filtroFechaFin) {
        const parseFechaSegura = (val?: string | null): Date | null => {
          if (!val) return null
          const s = String(val).trim()
          if (!s) return null
          if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
            const parts = s.substring(0, 10).split('-')
            return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
          }
          if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(s)) {
            const parts = s.split('/')
            return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10))
          }
          const dObj = new Date(s)
          return isNaN(dObj.getTime()) ? null : new Date(dObj.getFullYear(), dObj.getMonth(), dObj.getDate())
        }

        const pDate = parseFechaSegura(proyecto.fechaInicio || (proyecto as any).fecha_inicio || (proyecto as any).created_at)
        if (pDate) {
          if (filtroFechaInicio && filtroFechaInicio.length === 10) {
            const fInicio = parseFechaSegura(filtroFechaInicio)
            if (fInicio) matchFecha = matchFecha && pDate >= fInicio
          }
          if (filtroFechaFin && filtroFechaFin.length === 10) {
            const fFin = parseFechaSegura(filtroFechaFin)
            if (fFin) matchFecha = matchFecha && pDate <= fFin
          }
        }
      }

      return matchBusqueda && matchEstado && matchDepa && matchMuni && matchFecha
    })
  }, [proyectosReales, busqueda, proyectoFiltroId, estadoFiltro, filtroDepa, filtroMuni, filtroFechaInicio, filtroFechaFin, esResidenteODelegado, usuario])

  const proyectosEliminables = useMemo(() => {
    return proyectosFiltrados.filter((p) => esProyectoEliminable(p).puedeEliminar)
  }, [proyectosFiltrados])

  const proyectosSeleccionadosObjetos = useMemo(() => {
    return proyectosReales.filter((p) => seleccionados.includes(p.id))
  }, [proyectosReales, seleccionados])

  const aptosParaEliminar = useMemo(() => {
    return proyectosSeleccionadosObjetos.filter((p) => esProyectoEliminable(p).puedeEliminar)
  }, [proyectosSeleccionadosObjetos])

  const noAptosParaEliminar = useMemo(() => {
    return proyectosSeleccionadosObjetos.filter((p) => !esProyectoEliminable(p).puedeEliminar)
  }, [proyectosSeleccionadosObjetos])

  const todosAptos = proyectosSeleccionadosObjetos.length > 0 && noAptosParaEliminar.length === 0

  const toggleSeleccionarProyecto = (proyecto: Proyecto) => {
    const check = esProyectoEliminable(proyecto)
    if (!check.puedeEliminar && !seleccionados.includes(proyecto.id)) {
      showErrorToast(check.motivo)
      return
    }
    setSeleccionados((prev) =>
      prev.includes(proyecto.id) ? prev.filter((item) => item !== proyecto.id) : [...prev, proyecto.id]
    )
  }

  const toggleSeleccionarTodos = () => {
    if (proyectosEliminables.length > 0 && seleccionados.length === proyectosEliminables.length) {
      setSeleccionados([])
    } else {
      setSeleccionados(proyectosEliminables.map((p) => p.id))
    }
  }

  const totalPaginas = Math.max(1, Math.ceil(proyectosFiltrados.length / porPagina))
  
  const proyectosPaginados = useMemo(() => {
    const inicio = (pagina - 1) * porPagina
    return proyectosFiltrados.slice(inicio, inicio + porPagina)
  }, [pagina, porPagina, proyectosFiltrados])

  // Precargar páginas de detalles en segundo plano para apertura inmediata al hacer clic
  useEffect(() => {
    if (proyectosPaginados.length > 0) {
      const timer = setTimeout(() => {
        proyectosPaginados.slice(0, 6).forEach((p) => {
          try {
            router.prefetch(`/dashboard/proyectos/detalles?slug=${p.id}`)
          } catch (_) {}
        })
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [proyectosPaginados, router])

  const irAPagina = (nuevaPagina: number) => {
    const segura = Math.min(Math.max(1, nuevaPagina), totalPaginas)
    setPagina(segura)
  }

  return (
    <div className="space-y-4 font-[Poppins]">
      {/* ENCABEZADO */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="p-1.5 text-gray-400 transition-colors hover:text-[#9B0F06] cursor-pointer"
            title="Ir al Inicio"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="m-0 text-[15px] sm:text-[18px] font-extrabold text-gray-900 leading-tight">Gestión de Proyectos</h1>
            <p className="m-0 mt-0.5 text-[11px] font-medium text-gray-400">Administra y supervisa tus proyectos de construcción</p>
          </div>
        </div>
        
        <div className="flex flex-col md:items-end gap-2 w-full md:w-auto">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
            {/* Toggle de Vistas */}
            <div className="flex items-center gap-1 border-b border-gray-200 bg-white px-1 pt-1 shrink-0">
              <button
                type="button"
                onClick={() => handleVistaChange('lista')}
                className={`flex h-8 items-center gap-1.5 border-b-2 px-3 text-[10px] transition-all cursor-pointer ${
                  vista === 'lista'
                    ? 'border-[#9B0F06] text-[#9B0F06] font-bold bg-red-50/40 rounded-t-md shadow-2xs'
                    : 'border-transparent text-gray-500 font-medium hover:text-gray-800 hover:bg-gray-50/80 rounded-t-md'
                }`}
              >
                <List size={13} className={vista === 'lista' ? 'text-[#9B0F06]' : 'text-gray-400'} />
                <span>Lista</span>
              </button>
              <button
                type="button"
                onClick={() => handleVistaChange('detalles')}
                className={`flex h-8 items-center gap-1.5 border-b-2 px-3 text-[10px] transition-all cursor-pointer ${
                  vista === 'detalles'
                    ? 'border-[#9B0F06] text-[#9B0F06] font-bold bg-red-50/40 rounded-t-md shadow-2xs'
                    : 'border-transparent text-gray-500 font-medium hover:text-gray-800 hover:bg-gray-50/80 rounded-t-md'
                }`}
              >
                <LayoutGrid size={13} className={vista === 'detalles' ? 'text-[#9B0F06]' : 'text-gray-400'} />
                <span>Detalles</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => router.push('/dashboard/proyectos/empresas')}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-white border border-gray-200 px-2.5 sm:px-3 text-[10px] sm:text-[11px] font-bold text-gray-700 transition-colors hover:bg-gray-50 shadow-sm shrink-0"
              title="Catálogo de Empresas"
            >
              <Building2 size={13} className="text-[#9B0F06]" />
              <span className="hidden xs:inline sm:inline">Empresas</span>
              <span className="inline xs:hidden sm:hidden">Empresas</span>
            </button>
            
            {!esResidenteODelegado && (
              <button
                type="button"
                onClick={() => router.push('/dashboard/proyectos/nuevo')}
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#9B0F06] px-3 sm:px-3.5 text-[10px] sm:text-[11px] font-bold text-white transition-colors hover:bg-[#5E0006] shadow-sm shrink-0 cursor-pointer"
              >
                <Plus size={13} />
                <span className="hidden sm:inline">Nuevo Proyecto</span>
                <span className="inline sm:hidden">Nuevo</span>
              </button>
            )}
          </div>
          <span className="text-[10px] font-medium text-gray-500">
            {proyectosFiltrados.length} proyectos encontrados
          </span>
        </div>
      </div>

      <div className="w-full">
        <ProyectoFiltros
          proyectos={proyectosReales}
          busqueda={busqueda}
          setBusqueda={setBusqueda}
          proyectoSeleccionadoId={proyectoFiltroId}
          setProyectoSeleccionadoId={(valor) => { setProyectoFiltroId(valor); setPagina(1); }}
          mostrarSelectorProyecto={true}
          estadoFiltro={estadoFiltro}
          setEstadoFiltro={(valor) => { setEstadoFiltro(valor); setPagina(1); }}
          filtroDepa={filtroDepa}
          setFiltroDepa={(valor) => { setFiltroDepa(valor); setPagina(1); }}
          filtroMuni={filtroMuni}
          setFiltroMuni={(valor) => { setFiltroMuni(valor); setPagina(1); }}
          filtroFechaInicio={filtroFechaInicio}
          setFiltroFechaInicio={(valor) => { setFiltroFechaInicio(valor); setPagina(1); }}
          filtroFechaFin={filtroFechaFin}
          setFiltroFechaFin={(valor) => { setFiltroFechaFin(valor); setPagina(1); }}
          onLimpiar={handleLimpiarFiltros}
          modoSeleccion={modoSeleccion}
          setModoSeleccion={setModoSeleccion}
        />
      </div>

      {modoSeleccion && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-gray-200 bg-gray-50/90 p-2.5 px-4 shadow-2xs font-[Poppins] text-xs font-semibold text-gray-800">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={proyectosEliminables.length > 0 && seleccionados.length === proyectosEliminables.length}
              onChange={toggleSeleccionarTodos}
              disabled={proyectosEliminables.length === 0}
              className="h-4 w-4 rounded border-gray-300 text-[#9B0F06] focus:ring-[#9B0F06] cursor-pointer disabled:opacity-40"
            />
            <span>
              Seleccionar aptos para eliminar ({seleccionados.length} de {proyectosEliminables.length} en borrador sin bitácoras)
            </span>
          </div>
          {seleccionados.length > 0 && (
            <button
              type="button"
              onClick={() => setShowModalEliminar(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-red-700 shadow-2xs transition-colors cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Eliminar ({seleccionados.length})</span>
            </button>
          )}
        </div>
      )}

      {loadingProyectos ? (
        <div className="rounded-xl border border-gray-100 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-[#9B0F06] border-t-transparent" />
          <p className="text-xs font-medium text-gray-500">Cargando proyectos desde la base de datos...</p>
        </div>
      ) : proyectosFiltrados.length > 0 ? (
        <div className="space-y-4">
          
          {/* RENDERIZADO CONDICIONAL DE VISTAS */}
          {vista === 'lista' && (
            <div className="space-y-2.5">
              {proyectosPaginados.map((proyecto) => (
                <ProyectoListItem
                  key={proyecto.id}
                  proyecto={proyecto}
                  modoSeleccion={modoSeleccion}
                  isSelected={seleccionados.includes(proyecto.id)}
                  onToggleSelect={() => toggleSeleccionarProyecto(proyecto)}
                  onClick={() => router.push(`/dashboard/proyectos/detalles?slug=${proyecto.id}`)}
                />
              ))}
            </div>
          )}

          {vista === 'detalles' && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {proyectosPaginados.map((proyecto) => (
                <ProyectoCard
                  key={proyecto.id}
                  proyecto={proyecto}
                  modoSeleccion={modoSeleccion}
                  isSelected={seleccionados.includes(proyecto.id)}
                  onToggleSelect={() => toggleSeleccionarProyecto(proyecto)}
                />
              ))}
            </div>
          )}
          
          {/* PAGINACIÓN COMPARTIDA (APLICA A TODAS LAS VISTAS) */}
          <div className="flex flex-nowrap items-center justify-between gap-2 rounded-xl border border-gray-100 bg-white px-2.5 py-2.5 shadow-sm mt-4 font-[Poppins]">
            <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
              <span className="text-[9px] sm:text-[11px] text-gray-500 font-medium">Mostrar</span>
              <select 
                value={porPagina} 
                onChange={(e) => {
                  setPorPagina(Number(e.target.value))
                  setPagina(1)
                }}
                className="paginacion-control h-6 rounded border border-gray-200 bg-gray-50 px-1 text-[9px] sm:text-[11px] font-bold text-gray-700 focus:border-[#9B0F06] focus:outline-none cursor-pointer"
              >
                <option value={3} className="text-[9px]">3</option>
                <option value={6} className="text-[9px]">6</option>
                <option value={10} className="text-[9px]">10</option>
                <option value={20} className="text-[9px]">20</option>
                <option value={50} className="text-[9px]">50</option>
              </select>
              <div className="h-4 w-px bg-gray-200 mx-0.5 sm:mx-1"></div>
              <span className="whitespace-nowrap text-[9px] sm:text-[11px] font-semibold text-gray-600">
                Página {pagina} de {totalPaginas}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={() => irAPagina(pagina - 1)}
                disabled={pagina === 1}
                className="inline-flex h-7 items-center justify-center rounded-lg border border-gray-200 bg-white px-2 sm:px-3 text-[9px] sm:text-[11px] font-bold text-gray-600 transition-colors hover:border-[#9B0F06] hover:text-[#9B0F06] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Anterior
              </button>
              
              <button
                onClick={() => irAPagina(pagina + 1)}
                disabled={pagina === totalPaginas}
                className="inline-flex h-7 items-center justify-center rounded-lg border border-gray-200 bg-white px-2 sm:px-3 text-[9px] sm:text-[11px] font-bold text-gray-600 transition-colors hover:border-[#9B0F06] hover:text-[#9B0F06] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-100 bg-white p-12 text-center shadow-sm">
          <p className="mb-1 text-sm font-semibold text-gray-800">No hay proyectos</p>
          <p className="text-[10px] text-gray-400">No se encontraron proyectos con los filtros aplicados</p>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación (Optimizado para Desktop y Móvil) */}
      {showModalEliminar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 md:p-6 transition-all"
          onClick={() => {
            if (!isEliminando) setShowModalEliminar(false)
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg sm:max-w-xl md:max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh] font-[Poppins] animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Franja superior de acento */}
            <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-[#9B0F06] to-red-800 shrink-0" />

            {/* Cabecera del Modal */}
            <div className="p-5 sm:p-6 pb-4 flex items-start justify-between gap-3 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-red-50 p-3 text-[#9B0F06] shrink-0 ring-4 ring-red-50/50">
                  <Trash2 size={22} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
                    Eliminar {seleccionados.length} {seleccionados.length === 1 ? 'proyecto' : 'proyectos'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 leading-normal">
                    Verificación de requisitos antes de confirmar la eliminación definitiva
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isEliminando}
                onClick={() => setShowModalEliminar(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                title="Cerrar modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Cuerpo del Modal con scroll */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
              {/* Regla de negocio en banner destacado */}
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/90 p-3 text-xs text-amber-900 leading-relaxed shadow-2xs">
                <ShieldAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-950">Condición de seguridad requerida:</p>
                  <p className="mt-0.5 text-amber-800 text-[11px] sm:text-xs">
                    Solo se pueden eliminar proyectos en modo <strong className="font-bold text-amber-950 underline">Borrador</strong> y que <strong className="font-bold text-amber-950 underline">no tengan ningún registro de bitácora</strong> vinculado.
                  </p>
                </div>
              </div>

              {/* Lista de Proyectos Seleccionados */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Proyectos en selección ({seleccionados.length})
                  </h4>
                  {noAptosParaEliminar.length > 0 && aptosParaEliminar.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSeleccionados(aptosParaEliminar.map((p) => p.id))}
                      className="text-[11px] font-bold text-[#9B0F06] hover:underline cursor-pointer"
                    >
                      Conservar solo aptos ({aptosParaEliminar.length})
                    </button>
                  )}
                </div>

                <div className="max-h-56 sm:max-h-64 overflow-y-auto space-y-2 rounded-xl border border-gray-200 bg-gray-50/60 p-2.5">
                  {proyectosSeleccionadosObjetos.map((p) => {
                    const check = esProyectoEliminable(p)
                    return (
                      <div
                        key={p.id}
                        className={`p-3 rounded-xl border bg-white transition-all ${
                          check.puedeEliminar
                            ? 'border-gray-200 hover:border-gray-300'
                            : 'border-red-300 bg-red-50/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                                {p.codigo || 'PROY'}
                              </span>
                              <p className="text-xs sm:text-[13px] font-bold text-gray-900 truncate">
                                {p.nombre}
                              </p>
                            </div>
                            <p className="text-[10px] sm:text-[11px] text-gray-500 truncate">
                              {p.ubicacion} • {p.responsable}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <ProyectoEstadoBadge estado={p.estado} />
                          </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] sm:text-[11px]">
                          <span className="text-gray-500 font-medium">
                            Bitácoras vinculadas: <strong className="text-gray-800">{p.totalBitacoras || 0}</strong>
                          </span>
                          {check.puedeEliminar ? (
                            <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded-md font-semibold border border-green-200">
                              <CheckCircle2 size={12} />
                              Apto para eliminar
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-700 bg-red-100/70 px-2 py-0.5 rounded-md font-semibold border border-red-300">
                              <AlertCircle size={12} />
                              No eliminable
                            </span>
                          )}
                        </div>

                        {!check.puedeEliminar && (
                          <p className="mt-1.5 text-[10.5px] text-red-600 font-medium leading-tight">
                            • Motivo: {check.motivo}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Mensaje de Bloqueo si hay proyectos que no cumplen */}
              {noAptosParaEliminar.length > 0 && (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 shadow-2xs">
                  <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-red-900">
                      Eliminación bloqueada por restricciones de negocio:
                    </p>
                    <p className="mt-0.5 text-red-700 text-[11px] leading-normal">
                      {noAptosParaEliminar.length === 1
                        ? '1 de los proyectos seleccionados no puede eliminarse porque no está en modo Borrador o tiene bitácoras asociadas.'
                        : `${noAptosParaEliminar.length} de los proyectos seleccionados no pueden eliminarse porque no están en modo Borrador o tienen bitácoras asociadas.`}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Pie del Modal */}
            <div className="p-4 sm:p-5 px-5 sm:px-6 bg-gray-50/90 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="text-[11px] text-gray-500 text-center sm:text-left">
                {todosAptos ? (
                  <span className="text-gray-600">
                    Esta acción es irreversible y eliminará permanentemente los datos en Supabase.
                  </span>
                ) : (
                  <span className="text-red-600 font-semibold">
                    Deselecciona los proyectos no aptos para habilitar la eliminación.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  disabled={isEliminando}
                  onClick={() => setShowModalEliminar(false)}
                  className="flex-1 sm:flex-none rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isEliminando || !todosAptos || seleccionados.length === 0}
                  onClick={handleConfirmarEliminar}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-[#9B0F06] hover:bg-[#5E0006] px-5 py-2 text-xs font-bold text-white transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isEliminando ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Eliminando...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} />
                      <span>Eliminar Definitivamente ({seleccionados.length})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
