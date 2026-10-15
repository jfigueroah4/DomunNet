'use client'
import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Plus,
  X,
  Calendar,
  User,
  MapPin,
  Map as LucideMap,
  Camera,
  Clock,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { RegistroBitacora, TipoBitacora, EstadoBitacora } from '@/types/bitacora'
import { BitacoraFiltros } from '@/components/modules/bitacora/BitacoraFiltros'
import { BitacoraCard } from '@/components/modules/bitacora/BitacoraCard'
import { BitacoraEstadoBadge } from '@/components/modules/bitacora/BitacoraEstadoBadge'
import { BitacoraForm } from '@/components/modules/bitacora/BitacoraForm'

const BitacoraMapaInline = dynamic(
  () => import('@/components/modules/bitacora/BitacoraMapaInline').then((mod) => mod.BitacoraMapaInline),
  { ssr: false }
)

import { useAuthStore } from '@/stores/useAuthStore'
import { api, apiGetDeduplicado } from '@/lib/api/cliente'
import { Portal } from '@/components/ui/Portal'
import { showSuccessToast, showErrorToast } from '@/components/ui/Toast'
import { BITACORA_MOCK } from '@/data/bitacora.mock'
import { useUIStore } from '@/stores/useUIStore'

export default function BitacoraPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const usuario = useAuthStore((s) => s.profile)
  const rolUsuario = (usuario?.rol || '').toLowerCase()
  const esAdmin = rolUsuario.includes('admin') || rolUsuario.includes('director')
  const esResidente = rolUsuario.includes('residente')
  const esRolCampoRestringido = !esAdmin && !esResidente

  const [vista, setVista] = useState<'lista' | 'crear'>('lista')
  const [registrosApi, setRegistrosApi] = useState<any[]>([])

  const cargarRegistros = async () => {
    try {
      const [resEntradas, resFotos, resProyectos, resUsuarios] = await Promise.allSettled([
        apiGetDeduplicado('/mantenimiento/bitacora_entrada?limite=200'),
        apiGetDeduplicado('/mantenimiento/evidencia_fotografica?limite=200'),
        apiGetDeduplicado('/proyectos?limite=100'),
        apiGetDeduplicado('/usuarios?limite=100'),
      ])

      const entradasBD =
        resEntradas.status === 'fulfilled' && Array.isArray(resEntradas.value?.data?.data)
          ? resEntradas.value.data.data
          : []

      const fotosBD =
        resFotos.status === 'fulfilled' && Array.isArray(resFotos.value?.data?.data)
          ? resFotos.value.data.data
          : []

      const proysBD =
        resProyectos.status === 'fulfilled' && Array.isArray(resProyectos.value?.data?.data)
          ? resProyectos.value.data.data
          : []

      const usuariosBD =
        resUsuarios.status === 'fulfilled' && Array.isArray(resUsuarios.value?.data?.data)
          ? resUsuarios.value.data.data
          : []

      // Mapa de proyectos y usuarios
      const proyMap = new Map<string, { codigo: string; nombre: string }>()
      proysBD.forEach((p: any) => {
        if (p.id) {
          proyMap.set(String(p.id), {
            codigo: String(p.codigo || p.codigo_proyecto || ''),
            nombre: p.nombreOficial || p.nombre || p.nombre_oficial || 'Proyecto Vial',
          })
        }
      })

      const userMap = new Map<string, string>()
      usuariosBD.forEach((u: any) => {
        if (u.id) userMap.set(String(u.id), u.nombre || `${u.primer_nombre || ''} ${u.primer_apellido || ''}`.trim() || u.email)
      })

      // Mapa de fotos por bitacora_entrada_id
      const fotosMap = new Map<string, any[]>()
      fotosBD.forEach((f: any) => {
        if (f.bitacora_entrada_id) {
          const list = fotosMap.get(String(f.bitacora_entrada_id)) || []
          let tamStr = f.tamanio || ''
          if (!tamStr && f.url_storage) {
            if (f.url_storage.startsWith('data:')) {
              const kb = Math.round((f.url_storage.length * 3) / 4 / 1024)
              tamStr = kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`
            } else {
              tamStr = '245 KB'
            }
          }
          list.push({
            id: f.id,
            nombre: f.descripcion || 'evidencia.jpg',
            tipo: 'imagen',
            url: f.url_storage,
            tamanio: tamStr || '245 KB',
          })
          fotosMap.set(String(f.bitacora_entrada_id), list)
        }
      })

      // Cargar también registros locales offline guardados en localStorage
      let locales: any[] = []
      try {
        locales = JSON.parse(localStorage.getItem('domun_bitacora_locales') || '[]')
      } catch (_) {}

      const mapeadosBD = entradasBD.map((e: any) => {
        const proyecto = proyMap.get(String(e.proyecto_id))
        const pNombre = proyecto?.nombre || 'Proyecto Vial'
        const uNombre = userMap.get(String(e.usuario_id)) || 'Ingeniero Residente'
        const fotosAdj =
          fotosMap.get(String(e.id)) ||
          (e.firma_url ? [{ id: `f-${e.id}`, url: e.firma_url, tipo: 'imagen', nombre: 'evidencia.jpg' }] : [])

        return {
          id: e.id,
          titulo: e.titulo || `Registro de Bitácora`,
          descripcion: e.descripcion || '',
          tipo: (e.titulo || '').toLowerCase().includes('laboratorio') ? 'inspeccion' : 'actividad',
          estado: 'aprobado',
          proyectoId: String(e.proyecto_id || ''),
          proyectoCodigo: proyecto?.codigo || '',
          proyectoNombre: pNombre,
          autor: uNombre,
          autor_id: e.usuario_id,
          ubicacion: e.ubicacion || 'Frente de Obra',
          fecha: e.fecha || new Date().toISOString().slice(0, 10),
          hora: e.hora || '12:00',
          adjuntos: fotosAdj,
          renglon_nombre: e.descripcion?.includes('Renglón')
            ? e.descripcion.split('Renglón')[1]?.split('·')[0]?.trim()
            : 'Terracería',
        }
      })

      // Combinar locales + mapeados BD + BITACORA_MOCK
      const idsExistentes = new Set<string>()
      const consolidado: any[] = []

      locales.forEach((item: any) => {
        if (item.id && !idsExistentes.has(String(item.id))) {
          idsExistentes.add(String(item.id))
          consolidado.push(item)
        }
      })

      mapeadosBD.forEach((item: any) => {
        if (item.id && !idsExistentes.has(String(item.id))) {
          idsExistentes.add(String(item.id))
          consolidado.push(item)
        }
      })

      BITACORA_MOCK.forEach((item: any) => {
        if (item.id && !idsExistentes.has(String(item.id))) {
          idsExistentes.add(String(item.id))
          consolidado.push(item)
        }
      })

      setRegistrosApi(consolidado)
      try {
        sessionStorage.setItem('domun_bitacora_cache', JSON.stringify(consolidado))
      } catch (_) {}
    } catch (err) {
      console.warn('Error al sincronizar bitácora:', err)
    }
  }

  useEffect(() => {
    // 1. Hidratación instantánea desde caché de sesión
    try {
      const cached = sessionStorage.getItem('domun_bitacora_cache')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRegistrosApi(parsed)
        }
      }
    } catch (_) {}

    // 2. Sincronización en segundo plano con el servidor
    void cargarRegistros()
  }, [])

  // Drawer lateral deslizable de detalle de registro y modales
  const [drawerRegistro, setDrawerRegistro] = useState<RegistroBitacora | null>(null)
  const [fotoExpandida, setFotoExpandida] = useState<string | null>(null)
  const [modalMapaGTAbierto, setModalMapaGTAbierto] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  // Modo Selección Múltiple y Modal de Confirmación
  const [modoSeleccion, setModoSeleccion] = useState(false)
  const [seleccionados, setSeleccionados] = useState<string[]>([])
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false)
  const [registrosAEliminarIds, setRegistrosAEliminarIds] = useState<string[]>([])
  const [textoConfirmacion, setTextoConfirmacion] = useState('')

  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [tipo, setTipo] = useState<TipoBitacora | 'todos'>('todos')
  const [proyectoId, setProyectoId] = useState(() => searchParams?.get('proyectoId') || searchParams?.get('proyecto') || '')
  const [estado, setEstado] = useState<EstadoBitacora | 'todos'>('todos')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [rolFiltro, setRolFiltro] = useState('todos')
  const [usuarioFiltro, setUsuarioFiltro] = useState('')

  const setOcultarBottomNav = useUIStore((s) => s.setOcultarBottomNav)

  // Ocultar BottomNavbar en modales y drawer en mobile
  useEffect(() => {
    const hayModalAbierto = Boolean(drawerRegistro || fotoExpandida || modalMapaGTAbierto || modalEliminarAbierto)
    setOcultarBottomNav(hayModalAbierto)
    return () => {
      setOcultarBottomNav(false)
    }
  }, [drawerRegistro, fotoExpandida, modalMapaGTAbierto, modalEliminarAbierto, setOcultarBottomNav])

  useEffect(() => {
    if (searchParams?.get('nuevo') === 'true' || searchParams?.get('formulario') === 'true') {
      setVista('crear')
    } else {
      setVista('lista')
    }
    const pId = searchParams?.get('proyectoId') || searchParams?.get('proyecto')
    if (pId) {
      setProyectoId(pId)
    }
  }, [searchParams])

  // Paginación (15 registros por página por defecto para visualizar sin scrollear)
  const [paginaActual, setPaginaActual] = useState(1)
  const [registrosPorPagina, setRegistrosPorPagina] = useState(15)

  // Reset de página cuando cambian los filtros
  useEffect(() => {
    setPaginaActual(1)
  }, [busqueda, tipo, proyectoId, estado, fechaDesde, fechaHasta, usuarioFiltro, rolFiltro, registrosPorPagina])

  // Filtrado general
  const registrosFiltrados = useMemo(() => {
    const registrosBase: any[] = registrosApi
    if (registrosBase.length === 0) return []
    return registrosBase.filter((registro: any) => {
      // Restricción por rol de campo (solo sus propios registros)
      if (esRolCampoRestringido && usuario) {
        const esAutor =
          registro.autor_id === usuario.id ||
          registro.autorId === usuario.id ||
          (registro.autor && String(registro.autor).toLowerCase().includes((usuario.nombre || '').toLowerCase()))
        if (!esAutor) return false
      }

      const matchBusqueda =
        busqueda === '' ||
        registro.titulo?.toLowerCase().includes(busqueda.toLowerCase()) ||
        registro.descripcion?.toLowerCase().includes(busqueda.toLowerCase())

      // Match Renglón flexible
      const matchTipo =
        tipo === 'todos' ||
        !tipo ||
        registro.tipo === tipo ||
        (registro as any).renglon_nombre?.toLowerCase().includes(tipo.toLowerCase()) ||
        (registro as any).renglonNombre?.toLowerCase().includes(tipo.toLowerCase()) ||
        (registro as any).categoriaTrabajo?.toLowerCase().includes(tipo.toLowerCase()) ||
        (registro as any).renglon?.codigo?.toLowerCase().includes(tipo.toLowerCase()) ||
        (registro as any).renglon?.descripcion?.toLowerCase().includes(tipo.toLowerCase()) ||
        (Array.isArray(registro.etiquetas) &&
          registro.etiquetas.some((e: string) => e.toLowerCase().includes(tipo.toLowerCase())))

      const matchProyecto =
        proyectoId === '' ||
        String(registro.proyectoId) === String(proyectoId) ||
        String(registro.proyecto_id) === String(proyectoId)
      const matchEstado = estado === 'todos' || registro.estado === estado

      const registroFecha = new Date(registro.fecha)
      const matchFechaDesde =
        fechaDesde === '' || registroFecha >= new Date(fechaDesde)
      const matchFechaHasta =
        fechaHasta === '' || registroFecha <= new Date(fechaHasta)

      // Match Usuario flexible
      const matchUsuario =
        !usuarioFiltro ||
        String(registro.autor_id) === String(usuarioFiltro) ||
        String(registro.autorId) === String(usuarioFiltro) ||
        String(registro.usuario_id) === String(usuarioFiltro) ||
        (registro.autor && String(registro.autor).toLowerCase().includes(usuarioFiltro.toLowerCase())) ||
        (usuarioFiltro && String(registro.autor || '').toLowerCase() === String(usuarioFiltro).toLowerCase())

      const matchRol =
        rolFiltro === 'todos' ||
        (registro.rol && String(registro.rol).toLowerCase().includes(rolFiltro.toLowerCase())) ||
        (registro.creadorRol && String(registro.creadorRol).toLowerCase().includes(rolFiltro.toLowerCase()))

      return (
        matchBusqueda &&
        matchTipo &&
        matchProyecto &&
        matchEstado &&
        matchFechaDesde &&
        matchFechaHasta &&
        matchUsuario &&
        matchRol
      )
    })
  }, [registrosApi, busqueda, tipo, proyectoId, estado, fechaDesde, fechaHasta, usuarioFiltro, rolFiltro, esRolCampoRestringido, usuario])

  // Métodos de Selección Múltiple y Eliminación
  const toggleSeleccionarRegistro = (id: string) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleSeleccionarTodos = () => {
    if (registrosFiltrados.length > 0 && seleccionados.length === registrosFiltrados.length) {
      setSeleccionados([])
    } else {
      setSeleccionados(registrosFiltrados.map((r) => String(r.id)))
    }
  }

  const abrirModalEliminarMultiples = () => {
    if (seleccionados.length === 0) return
    setRegistrosAEliminarIds([...seleccionados])
    setTextoConfirmacion('')
    setModalEliminarAbierto(true)
  }

  const abrirModalEliminarIndividual = (id: string) => {
    setRegistrosAEliminarIds([id])
    setTextoConfirmacion('')
    setModalEliminarAbierto(true)
  }

  const handleConfirmarEliminar = async () => {
    if (registrosAEliminarIds.length === 0) return
    if (textoConfirmacion.trim().toUpperCase() !== 'CONFIRMAR') return

    setEliminando(true)
    try {
      // 1. Eliminar via API backend
      await Promise.allSettled(
        registrosAEliminarIds.map((id) => api.delete(`/mantenimiento/bitacora_entrada/${id}`))
      )

      // 2. Eliminar de localStorage
      try {
        const locales = JSON.parse(localStorage.getItem('domun_bitacora_locales') || '[]')
        const idsSet = new Set(registrosAEliminarIds.map(String))
        const filtrados = locales.filter((item: any) => !idsSet.has(String(item.id)))
        localStorage.setItem('domun_bitacora_locales', JSON.stringify(filtrados))
      } catch (_) {}

      // 3. Actualizar lista de registros
      const idsSet = new Set(registrosAEliminarIds.map(String))
      setRegistrosApi((prev) => prev.filter((r) => !idsSet.has(String(r.id))))
      setSeleccionados((prev) => prev.filter((id) => !idsSet.has(String(id))))

      if (drawerRegistro && idsSet.has(String(drawerRegistro.id))) {
        setDrawerRegistro(null)
      }

      setModalEliminarAbierto(false)
      setTextoConfirmacion('')
      setRegistrosAEliminarIds([])

      const count = registrosAEliminarIds.length
      showSuccessToast(
        count === 1
          ? 'Registro de bitácora eliminado exitosamente'
          : `${count} registros de bitácora eliminados exitosamente`
      )
    } catch (err: any) {
      console.error('Error al eliminar registros de bitácora:', err)
      showErrorToast('No se pudieron eliminar los registros')
    } finally {
      setEliminando(false)
    }
  }

  // Paginación sobre los registros filtrados (15 por página)
  const totalPaginas = Math.ceil(registrosFiltrados.length / registrosPorPagina)
  
  const registrosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * registrosPorPagina
    return registrosFiltrados.slice(inicio, inicio + registrosPorPagina)
  }, [registrosFiltrados, paginaActual, registrosPorPagina])

  // Agrupar por fecha manteniendo el encabezado por días
  const registrosAgrupados = useMemo(() => {
    const agrupado: { [fecha: string]: RegistroBitacora[] } = {}

    registrosPaginados.forEach((registro) => {
      if (!agrupado[registro.fecha]) {
        agrupado[registro.fecha] = []
      }
      agrupado[registro.fecha].push(registro)
    })

    return Object.entries(agrupado)
      .sort(([fechaA], [fechaB]) => new Date(fechaB).getTime() - new Date(fechaA).getTime())
      .map(([fecha, registros]) => ({
        fecha,
        registros: registros.sort(
          (a, b) =>
            new Date(`${b.fecha}T${b.hora}`).getTime() -
            new Date(`${a.fecha}T${a.hora}`).getTime()
        ),
      }))
  }, [registrosPaginados])

  const formatearFecha = (fecha: string) => {
    if (!fecha) return 'Fecha no especificada'
    const date = new Date(fecha + 'T00:00:00')
    if (isNaN(date.getTime())) return fecha
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    const meses = [
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
    return `${dias[date.getDay()]}, ${date.getDate()} de ${meses[date.getMonth()]} ${date.getFullYear()}`
  }

  if (vista === 'crear') {
    return (
      <div className="-mx-3.5 sm:-mx-4 -mt-3.5 sm:-mt-4 -mb-24 md:-mb-4 xl:-mx-5 min-h-[calc(100dvh-65px)] bg-white overflow-x-hidden w-full max-w-full touch-pan-y">
        <BitacoraForm
          onBack={() => {
            setVista('lista')
            router.replace('/dashboard/bitacora')
          }}
          onSubmit={(nuevoReg: any) => {
            if (nuevoReg) {
              setRegistrosApi((prev) => [nuevoReg, ...prev.filter((p: any) => p.id !== nuevoReg.id)])
            }
            setVista('lista')
            router.replace('/dashboard/bitacora')
            void cargarRegistros()
          }}
        />
      </div>
    )
  }

  return (
    <div className="p-2 sm:p-4 space-y-2 font-[Poppins] w-full max-w-full overflow-x-hidden sm:overflow-visible touch-pan-y">
      {/* Header Compacto con tipografía responsive */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-[17px] sm:text-[16px] font-extrabold text-gray-900 leading-tight">Bitácora de Obra</h1>
          <p className="text-[11px] sm:text-[9.5px] text-gray-500">Registro diario de actividades de campo y ensayos de laboratorio</p>
        </div>

        <button
          type="button"
          onClick={() => {
            setVista('crear')
            router.push('/dashboard/bitacora?nuevo=true')
          }}
          className="flex items-center justify-center gap-1.5 bg-[#9B0F06] text-white text-xs font-bold p-2 sm:px-4 sm:py-2 rounded-xl hover:bg-[#7D0C05] transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer shrink-0"
          title="Nuevo Registro"
        >
          <Plus size={16} className="stroke-[2.5]" />
          <span className="hidden sm:inline">Nuevo Registro</span>
        </button>
      </div>

      {/* Main Layout - Ancho completo */}
      <div className="w-full space-y-2 font-[Poppins]">
        <BitacoraFiltros
          busqueda={busqueda}
          onBusquedaChange={setBusqueda}
          tipo={tipo as string}
          onTipoChange={setTipo as any}
          proyectoId={proyectoId}
          onProyectoChange={setProyectoId}
          estado={estado}
          onEstadoChange={setEstado}
          fechaDesde={fechaDesde}
          onFechaDesdeChange={setFechaDesde}
          fechaHasta={fechaHasta}
          onFechaHastaChange={setFechaHasta}
          usuarioFiltro={usuarioFiltro}
          onUsuarioChange={setUsuarioFiltro}
          rolFiltro={rolFiltro}
          onRolChange={setRolFiltro}
          esRolCampoRestringido={esRolCampoRestringido}
          registrosBitacora={registrosApi}
          onLimpiar={() => {
            setBusqueda('')
            setTipo('todos')
            setProyectoId('')
            setEstado('todos')
            setFechaDesde('')
            setFechaHasta('')
            setRolFiltro('todos')
            setUsuarioFiltro('')
          }}
          modoSeleccion={modoSeleccion}
          setModoSeleccion={setModoSeleccion}
        />

        {modoSeleccion && (
          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50/90 p-1.5 px-3 shadow-2xs font-[Poppins] text-[11px] font-medium text-gray-700 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={registrosFiltrados.length > 0 && seleccionados.length === registrosFiltrados.length}
                onChange={toggleSeleccionarTodos}
                className="h-3.5 w-3.5 rounded border-gray-300 text-[#9B0F06] focus:ring-[#9B0F06] cursor-pointer"
              />
              <span>
                Seleccionar Todos ({seleccionados.length} de {registrosFiltrados.length} seleccionados)
              </span>
            </div>
            {seleccionados.length > 0 && (
              <button
                type="button"
                onClick={abrirModalEliminarMultiples}
                className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2.5 py-0.5 text-[10.5px] font-bold text-white hover:bg-red-700 shadow-2xs transition-colors cursor-pointer"
              >
                <Trash2 size={11} />
                <span>Eliminar ({seleccionados.length})</span>
              </button>
            )}
          </div>
        )}

        {registrosAgrupados.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-xl border border-gray-200 shadow-2xs">
            <p className="text-xs font-bold text-gray-700">No hay registros de bitácora</p>
            <p className="text-[10px] text-gray-400 mt-0.5">No se encontraron datos con los filtros seleccionados</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {registrosAgrupados.map((grupo) => (
              <div key={grupo.fecha}>
                {/* Encabezado por Fecha Solicitado (Ej. Lunes, 28 de Septiembre 2026) con tipografía similar a renglón */}
                <div className="flex items-center gap-2 my-1">
                  <div className="h-px bg-gray-200 flex-1" />
                  <span className="text-[9px] sm:text-[11px] font-medium text-gray-800 bg-gray-100 px-3 py-0.5 rounded-full font-[Poppins]">
                    {formatearFecha(grupo.fecha)}
                  </span>
                  <div className="h-px bg-gray-200 flex-1" />
                </div>

                <div className="space-y-1">
                  {grupo.registros.map((registro) => (
                    <BitacoraCard
                      key={registro.id}
                      registro={registro}
                      modoSeleccion={modoSeleccion}
                      isSelected={seleccionados.includes(String(registro.id))}
                      onToggleSelect={() => toggleSeleccionarRegistro(String(registro.id))}
                      onClick={() => setDrawerRegistro(registro)}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Paginación Footer Corporativo */}
            {registrosFiltrados.length > 0 && (
              <div data-paginacion="true" className="paginacion-control flex flex-row items-center justify-between border border-gray-200 bg-white px-2.5 py-1.5 rounded-lg shadow-2xs text-[9.5px] font-[Poppins] text-gray-500 mt-2 gap-2">
                <div className="flex items-center gap-1 shrink-0">
                  <span>Mostrar</span>
                  <select
                    value={registrosPorPagina}
                    onChange={(e) => setRegistrosPorPagina(Number(e.target.value))}
                    className="paginacion-control h-6 border border-gray-200 rounded px-1.5 bg-white text-gray-700 text-[9.5px] focus:outline-none focus:border-[#9B0F06] font-[Poppins]"
                  >
                    {[15, 25, 50, 100].map((num) => (
                      <option key={num} value={num} className="text-[9.5px] font-[Poppins]">{num}</option>
                    ))}
                  </select>
                  <span className="hidden sm:inline">registros ({registrosFiltrados.length} en total)</span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                    disabled={paginaActual === 1}
                    className="p-1 sm:p-0.5 border border-gray-200 rounded text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={12} className="sm:w-3 sm:h-3" />
                  </button>
                  <span className="px-1 font-normal text-gray-700 text-[9.5px]">
                    Pág. {paginaActual} de {totalPaginas || 1}
                  </span>
                  <button
                    onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                    disabled={paginaActual === totalPaginas || totalPaginas === 0}
                    className="p-1 sm:p-0.5 border border-gray-200 rounded text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={12} className="sm:w-3 sm:h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* DRAWER LATERAL DESLIZANTE DE DETALLE DE REGISTRO */}
      {drawerRegistro && (
        <Portal>
          <div className="fixed inset-0 z-[999] overflow-hidden font-[Poppins]">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
              onClick={() => setDrawerRegistro(null)}
            />

            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-4 sm:pl-10">
              <div className="pointer-events-auto w-screen max-w-lg sm:max-w-2xl bg-white shadow-2xl flex flex-col justify-between border-l border-gray-200">
                {/* Drawer Header Limpio */}
                <div className="p-3 sm:p-4 border-b border-gray-200 bg-gray-50/90 flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h2 className="text-[10.5px] font-black text-gray-900 leading-snug">
                        Detalle del Registro de Bitácora
                      </h2>
                      <BitacoraEstadoBadge estado={drawerRegistro.estado} sinFondo={true} />
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium flex items-center gap-1.5 font-[Poppins]">
                      <Calendar size={11} className="text-[#9B0F06]" />
                      <span>{formatearFecha(drawerRegistro.fecha)}</span>
                      <span>·</span>
                      <Clock size={11} className="text-gray-400" />
                      <span>{drawerRegistro.hora || '12:00'} hrs</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDrawerRegistro(null)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors cursor-pointer"
                    title="Cerrar detalle"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Drawer Body - Scrollable Content */}
                <div className="p-3 sm:p-4 space-y-3 overflow-y-auto flex-1 text-[10px] font-[Poppins]">
                  {/* 1. Información General del Proyecto y Responsable */}
                  <div className="space-y-2.5 pb-2.5 border-b border-gray-100">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
                      <div className="col-span-2 sm:col-span-3">
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">
                          Proyecto de Obra
                        </span>
                        <span className="text-[10px] font-medium text-gray-800">
                          {drawerRegistro.proyectoCodigo ? `${drawerRegistro.proyectoCodigo} · ` : ''}
                          {drawerRegistro.proyectoNombre || 'Proyecto de Obra'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">
                          Fecha de Registro
                        </span>
                        <span className="text-[10px] font-normal text-gray-800 font-[Poppins]">
                          {drawerRegistro.fecha}
                        </span>
                      </div>

                      <div>
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">
                          Hora de Registro
                        </span>
                        <span className="text-[10px] font-normal text-gray-800 font-[Poppins]">
                          {drawerRegistro.hora || '12:00'} hrs
                        </span>
                      </div>

                      <div>
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">
                          Lado de la Vía
                        </span>
                        <span className="text-[10px] font-medium text-gray-800">
                          {drawerRegistro.lado || (drawerRegistro as any).lado_via || 'Ambos'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">
                          Estación Inicio
                        </span>
                        <span className="text-[10px] font-normal text-gray-800 font-[Poppins]">
                          {(() => {
                            const val =
                              drawerRegistro.estacionInicio ||
                              (drawerRegistro as any).estacion_inicial ||
                              (drawerRegistro as any).estacion_inicio ||
                              '0+000'
                            return String(val)
                          })()}
                        </span>
                      </div>

                      <div>
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">
                          Estación Fin
                        </span>
                        <span className="text-[10px] font-normal text-gray-800 font-[Poppins]">
                          {(() => {
                            const val =
                              drawerRegistro.estacionFin ||
                              (drawerRegistro as any).estacion_final ||
                              (drawerRegistro as any).estacion_fin ||
                              '0+500'
                            return String(val)
                          })()}
                        </span>
                      </div>

                      <div>
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">
                          Responsable / Autor
                        </span>
                        <span className="text-[10px] font-medium text-gray-800 flex items-center gap-1">
                          <User size={12} className="text-gray-400" />
                          <span>{drawerRegistro.autor}</span>
                        </span>
                      </div>

                      {/* Ubicación GPS y Departamento con solo el Icono de Mapa sin fondo */}
                      <div className="col-span-2 sm:col-span-3 space-y-1 pt-0.5 relative">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">
                            Ubicación y Departamento (GPS)
                          </span>
                          {/* Botón de Mapa solo icono sin fondo */}
                          <button
                            type="button"
                            onClick={() => setModalMapaGTAbierto((prev) => !prev)}
                            className="p-1 text-[#9B0F06] hover:text-[#5E0006] hover:scale-110 transition-all cursor-pointer focus:outline-none"
                            title="Ver / Ocultar Mapa en el Drawer"
                          >
                            <LucideMap size={16} />
                          </button>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <MapPin size={13} className="text-[#9B0F06] shrink-0 mt-0.5" />
                          <div className="space-y-0.5 flex-1">
                            <span className="text-[10px] font-medium text-gray-800 block">
                              {drawerRegistro.ubicacion || 'Ubicación Registrada en Sitio'}
                            </span>
                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] text-gray-500 font-[Poppins]">
                              <span>
                                Departamento: <span className="font-medium text-gray-800">{(drawerRegistro as any).departamento || (drawerRegistro as any).departamentoNombre || 'Huehuetenango'}</span>
                              </span>
                              <span>
                                Lat: {drawerRegistro.coordenadasGps?.lat ? drawerRegistro.coordenadasGps.lat.toFixed(6) : ((drawerRegistro as any).lat || '14.500167')} · Lng: {drawerRegistro.coordenadasGps?.lng ? drawerRegistro.coordenadasGps.lng.toFixed(6) : ((drawerRegistro as any).lng || '-90.617015')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Mapa Leaflet y Departamental Flotante en el Drawer */}
                        {modalMapaGTAbierto && (
                          <BitacoraMapaInline
                            registro={drawerRegistro}
                            onClose={() => setModalMapaGTAbierto(false)}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 2. Evidencia Fotográfica Principal */}
                  <div className="space-y-1.5 pb-2.5 border-b border-gray-100">
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">
                      Evidencia Fotográfica Principal
                    </span>

                    {drawerRegistro.adjuntos && drawerRegistro.adjuntos.length > 0 ? (
                      <div className="flex flex-col items-center justify-center">
                        {drawerRegistro.adjuntos.map((adj: any) => (
                          <div
                            key={adj.id}
                            className="relative flex items-center justify-center max-w-full"
                          >
                            <img
                              src={adj.url}
                              alt={adj.nombre || 'Evidencia'}
                              onClick={() => setFotoExpandida(adj.url)}
                              className="max-h-[190px] sm:max-h-[220px] w-auto max-w-full object-contain rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                              title="Clic para ampliar a pantalla completa"
                            />
                            {/* Botón solo icono para ampliar */}
                            <button
                              type="button"
                              onClick={() => setFotoExpandida(adj.url)}
                              className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-[#9B0F06] text-white backdrop-blur-xs transition-colors cursor-pointer shadow-xs focus:outline-none"
                              title="Ampliar a pantalla completa"
                            >
                              <Maximize2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/70 p-3 text-center">
                        <Camera size={18} className="mx-auto text-gray-300 mb-1" />
                        <p className="text-[10px] font-bold text-gray-500">Sin fotografía adjunta</p>
                        <p className="text-[9px] text-gray-400">Este registro no cuenta con archivo fotográfico</p>
                      </div>
                    )}
                  </div>

                  {/* 3. Observaciones y Notas */}
                  <div className="space-y-1">
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">
                      Observaciones y Notas de la Jornada
                    </span>
                    <p className="text-[10px] font-normal text-gray-700 leading-relaxed whitespace-pre-line font-[Poppins]">
                      {drawerRegistro.descripcion || 'Sin observaciones adicionales registradas para este día.'}
                    </p>
                  </div>
                </div>

                {/* Drawer Footer */}
                <div className="p-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-3 font-[Poppins]">
                  <button
                    type="button"
                    onClick={() => abrirModalEliminarIndividual(String(drawerRegistro.id))}
                    className="p-1.5 text-gray-400 hover:text-[#9B0F06] hover:scale-110 transition-all cursor-pointer focus:outline-none"
                    title="Eliminar Registro"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-gray-400 font-medium hidden sm:inline">ID: {drawerRegistro.id}</span>
                    <button
                      type="button"
                      onClick={() => setDrawerRegistro(null)}
                      className="rounded-lg bg-[#9B0F06] px-3.5 py-1.5 text-[10px] font-bold text-white hover:bg-[#5E0006] transition-colors cursor-pointer shadow-2xs"
                    >
                      Cerrar Detalle
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN CON PALABRA 'CONFIRMAR' */}
      {modalEliminarAbierto && (
        <Portal>
          <div
            className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-[Poppins]"
            onClick={() => {
              if (!eliminando) {
                setModalEliminarAbierto(false)
                setTextoConfirmacion('')
                setRegistrosAEliminarIds([])
              }
            }}
          >
            <div
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-[#9B0F06]">
                  <AlertTriangle size={22} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-gray-900">
                    {registrosAEliminarIds.length > 1
                      ? `¿Eliminar ${registrosAEliminarIds.length} registros de bitácora?`
                      : '¿Eliminar registro de bitácora?'}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Esta acción no se puede deshacer. Se eliminarán permanentemente{' '}
                    {registrosAEliminarIds.length > 1 ? 'los registros seleccionados' : 'el registro'}{' '}
                    de campo, renglones y la evidencia fotográfica asociada de la base de datos.
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <p className="text-xs text-gray-600 font-medium">
                  Para autorizar y proceder con la eliminación, escriba{' '}
                  <span className="font-bold text-gray-900 uppercase font-mono">CONFIRMAR</span> en el siguiente campo:
                </p>
                <input
                  type="text"
                  autoFocus
                  value={textoConfirmacion}
                  onChange={(e) => setTextoConfirmacion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && textoConfirmacion.trim().toUpperCase() === 'CONFIRMAR' && !eliminando) {
                      handleConfirmarEliminar()
                    }
                  }}
                  placeholder="CONFIRMAR"
                  className="w-full text-base sm:text-xs p-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-[#9B0F06] focus:ring-1 focus:ring-[#9B0F06] font-mono tracking-wider uppercase bg-gray-50 focus:bg-white transition-colors"
                />
              </div>

              <div className="mt-5 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={eliminando}
                  onClick={() => {
                    setModalEliminarAbierto(false)
                    setTextoConfirmacion('')
                    setRegistrosAEliminarIds([])
                  }}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={eliminando || textoConfirmacion.trim().toUpperCase() !== 'CONFIRMAR'}
                  onClick={handleConfirmarEliminar}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#9B0F06] px-4 py-2 text-xs font-bold text-white hover:bg-[#5E0006] transition-colors cursor-pointer shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {eliminando ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  <span>{eliminando ? 'Eliminando...' : 'Confirmar Eliminación'}</span>
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* MODAL / LIGHTBOX DE FOTOGRAFÍA EXPANDIDA A PANTALLA COMPLETA */}
      {fotoExpandida && (
        <Portal>
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/95 p-4 sm:p-6 backdrop-blur-md font-[Poppins]"
            onClick={() => setFotoExpandida(null)}
          >
            <button
              type="button"
              onClick={() => setFotoExpandida(null)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 rounded-full bg-white/20 hover:bg-white/40 text-white p-2.5 backdrop-blur-md transition-all cursor-pointer shadow-lg"
              title="Cerrar visor"
            >
              <X size={22} />
            </button>

            <div
              className="relative flex items-center justify-center max-h-[85vh] max-w-5xl w-full p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={fotoExpandida}
                alt="Evidencia fotográfica ampliada"
                className="max-h-[82vh] max-w-full object-contain rounded-xl shadow-2xl border border-white/10"
              />
            </div>
          </div>
        </Portal>
      )}

    </div>
  )
}
