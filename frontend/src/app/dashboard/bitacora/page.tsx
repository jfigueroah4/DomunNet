'use client'
import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Plus,
  X,
  Calendar,
  User,
  MapPin,
  Map as LucideMap,
  Camera,
  Clock,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { RegistroBitacora, TipoBitacora, EstadoBitacora } from '@/types/bitacora'
import { BitacoraFiltros } from '@/components/modules/bitacora/BitacoraFiltros'
import { BitacoraCard } from '@/components/modules/bitacora/BitacoraCard'
import { BitacoraEstadoBadge } from '@/components/modules/bitacora/BitacoraEstadoBadge'
import { BitacoraForm } from '@/components/modules/bitacora/BitacoraForm'
import { BitacoraMapaInline } from '@/components/modules/bitacora/BitacoraMapaInline'

import { useAuthStore } from '@/stores/useAuthStore'
import { apiGetDeduplicado } from '@/lib/api/cliente'
import { Portal } from '@/components/ui/Portal'
import { BITACORA_MOCK } from '@/data/bitacora.mock'

export default function BitacoraPage() {
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
      const proyMap = new Map<string, string>()
      proysBD.forEach((p: any) => {
        if (p.id) proyMap.set(String(p.id), p.nombreOficial || p.nombre || p.codigo || 'Proyecto Vial')
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
        const pNombre = proyMap.get(String(e.proyecto_id)) || 'Proyecto Vial'
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
    } catch (err) {
      console.warn('Error al sincronizar bitácora:', err)
    }
  }

  useEffect(() => {
    if (searchParams?.get('nuevo') === 'true' || searchParams?.get('formulario') === 'true') {
      setVista('crear')
    }
  }, [searchParams])

  useEffect(() => {
    void cargarRegistros()
  }, [])

  // Drawer lateral deslizable de detalle de registro y modales
  const [drawerRegistro, setDrawerRegistro] = useState<RegistroBitacora | null>(null)
  const [fotoExpandida, setFotoExpandida] = useState<string | null>(null)
  const [modalMapaGTAbierto, setModalMapaGTAbierto] = useState(false)

  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [tipo, setTipo] = useState<TipoBitacora | 'todos'>('todos')
  const [proyectoId, setProyectoId] = useState('')
  const [estado, setEstado] = useState<EstadoBitacora | 'todos'>('todos')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [rolFiltro, setRolFiltro] = useState('todos')
  const [usuarioFiltro, setUsuarioFiltro] = useState('')

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

      const matchTipo = tipo === 'todos' || registro.tipo === tipo
      const matchProyecto = proyectoId === '' || registro.proyectoId === proyectoId || registro.proyecto_id === proyectoId
      const matchEstado = estado === 'todos' || registro.estado === estado

      const registroFecha = new Date(registro.fecha)
      const matchFechaDesde =
        fechaDesde === '' || registroFecha >= new Date(fechaDesde)
      const matchFechaHasta =
        fechaHasta === '' || registroFecha <= new Date(fechaHasta)

      const matchUsuario =
        !usuarioFiltro ||
        registro.autor_id === usuarioFiltro ||
        registro.autorId === usuarioFiltro ||
        (registro.autor && String(registro.autor).toLowerCase().includes(usuarioFiltro.toLowerCase()))

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
      <div className="-mx-4 -mt-4 -mb-20 md:-mb-4 xl:-mx-5 min-h-[calc(100vh-65px)] bg-white">
        <BitacoraForm
          onBack={() => setVista('lista')}
          onSubmit={(nuevoReg: any) => {
            if (nuevoReg) {
              setRegistrosApi((prev) => [nuevoReg, ...prev.filter((p: any) => p.id !== nuevoReg.id)])
            }
            setVista('lista')
            void cargarRegistros()
          }}
        />
      </div>
    )
  }

  return (
    <div className="p-2.5 sm:p-4 space-y-2 font-[Poppins]">
      {/* Header Compacto */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-sm font-extrabold text-gray-900 leading-tight">Bitácora de Obra</h1>
          <p className="text-[9.5px] text-gray-500">Registro diario de actividades de campo y ensayos de laboratorio</p>
        </div>

        <button
          type="button"
          onClick={() => setVista('crear')}
          className="flex items-center gap-1 bg-[#9B0F06] text-white text-[11px] font-bold px-3 py-1 rounded-lg hover:bg-[#5E0006] transition-colors shadow-2xs cursor-pointer"
        >
          <Plus size={12} />
          Nuevo Registro
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
        />

        {registrosAgrupados.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-xl border border-gray-200 shadow-2xs">
            <p className="text-xs font-bold text-gray-700">No hay registros de bitácora</p>
            <p className="text-[10px] text-gray-400 mt-0.5">No se encontraron datos con los filtros seleccionados</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {registrosAgrupados.map((grupo) => (
              <div key={grupo.fecha}>
                {/* Encabezado por Fecha Solicitado (Ej. Lunes, 28 de Septiembre 2026) */}
                <div className="flex items-center gap-2 my-1">
                  <div className="h-px bg-gray-200 flex-1" />
                  <span className="text-[8.5px] text-gray-600 font-bold uppercase tracking-wider bg-gray-100 px-2.5 py-0.2 rounded-full font-mono">
                    {formatearFecha(grupo.fecha)}
                  </span>
                  <div className="h-px bg-gray-200 flex-1" />
                </div>

                <div className="space-y-1">
                  {grupo.registros.map((registro) => (
                    <BitacoraCard
                      key={registro.id}
                      registro={registro}
                      onClick={() => setDrawerRegistro(registro)}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Paginación Footer Corporativo (15 registros por página) */}
            {registrosFiltrados.length > 0 && (
              <div className="flex items-center justify-between border border-gray-200 bg-white p-2 rounded-lg shadow-2xs text-[11px] text-gray-500 mt-2">
                <div className="flex items-center gap-1.5">
                  <span>Mostrar</span>
                  <select
                    value={registrosPorPagina}
                    onChange={(e) => setRegistrosPorPagina(Number(e.target.value))}
                    className="h-6 border border-gray-200 rounded px-1 bg-white text-gray-700 text-[10px] focus:outline-none focus:border-[#9B0F06]"
                  >
                    {[15, 25, 50, 100].map((num) => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                  <span>registros por página ({registrosFiltrados.length} en total)</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                    disabled={paginaActual === 1}
                    className="p-0.5 border border-gray-200 rounded text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <span className="px-1.5 font-medium text-gray-700 text-[10px]">
                    Página {paginaActual} de {totalPaginas || 1}
                  </span>
                  <button
                    onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                    disabled={paginaActual === totalPaginas || totalPaginas === 0}
                    className="p-0.5 border border-gray-200 rounded text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={13} />
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
                <div className="p-4 border-b border-gray-200 bg-gray-50/90 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-black text-gray-900 leading-snug">
                        Detalle del Registro de Bitácora
                      </h2>
                      <BitacoraEstadoBadge estado={drawerRegistro.estado} sinFondo={true} />
                    </div>
                    <p className="text-[10.5px] text-gray-500 font-mono flex items-center gap-1.5">
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
                    <X size={18} />
                  </button>
                </div>

                {/* Drawer Body - Scrollable Content */}
                <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
                  {/* 1. Información General del Proyecto y Responsable */}
                  <div className="space-y-3 pb-3.5 border-b border-gray-100">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="col-span-2 sm:col-span-3">
                        <span className="text-[8.5px] font-bold text-gray-400 uppercase tracking-wider block">
                          Proyecto de Obra
                        </span>
                        <span className="text-[11px] font-bold text-gray-800">
                          {drawerRegistro.proyectoCodigo ? `${drawerRegistro.proyectoCodigo} · ` : ''}
                          {drawerRegistro.proyectoNombre || 'Proyecto de Obra'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[8.5px] font-bold text-gray-400 uppercase tracking-wider block">
                          Fecha de Registro
                        </span>
                        <span className="text-[11px] font-bold text-gray-800 font-mono">
                          {drawerRegistro.fecha}
                        </span>
                      </div>

                      <div>
                        <span className="text-[8.5px] font-bold text-gray-400 uppercase tracking-wider block">
                          Hora de Registro
                        </span>
                        <span className="text-[11px] font-bold text-gray-800 font-mono">
                          {drawerRegistro.hora || '12:00'} hrs
                        </span>
                      </div>

                      <div>
                        <span className="text-[8.5px] font-bold text-gray-400 uppercase tracking-wider block">
                          Lado de la Vía
                        </span>
                        <span className="text-[11px] font-bold text-gray-800">
                          {drawerRegistro.lado || (drawerRegistro as any).lado_via || 'Ambos'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[8.5px] font-bold text-gray-400 uppercase tracking-wider block">
                          Estación Inicio
                        </span>
                        <span className="text-[11px] font-bold text-gray-800 font-mono">
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
                        <span className="text-[8.5px] font-bold text-gray-400 uppercase tracking-wider block">
                          Estación Fin
                        </span>
                        <span className="text-[11px] font-bold text-gray-800 font-mono">
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
                        <span className="text-[8.5px] font-bold text-gray-400 uppercase tracking-wider block">
                          Responsable / Autor
                        </span>
                        <span className="text-[11px] font-bold text-gray-800 flex items-center gap-1">
                          <User size={11} className="text-gray-400" />
                          <span>{drawerRegistro.autor}</span>
                        </span>
                      </div>

                      {/* Ubicación GPS y Departamento con solo el Icono de Mapa sin fondo */}
                      <div className="col-span-2 sm:col-span-3 space-y-1.5 pt-1 relative">
                        <div className="flex items-center justify-between">
                          <span className="text-[8.5px] font-bold text-gray-400 uppercase tracking-wider block">
                            Ubicación y Departamento (GPS)
                          </span>
                          {/* Botón de Mapa solo icono sin fondo */}
                          <button
                            type="button"
                            onClick={() => setModalMapaGTAbierto((prev) => !prev)}
                            className="p-1 text-[#9B0F06] hover:text-[#5E0006] hover:scale-110 transition-all cursor-pointer focus:outline-none"
                            title="Ver / Ocultar Mapa en el Drawer"
                          >
                            <LucideMap size={18} />
                          </button>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <MapPin size={13} className="text-[#9B0F06] shrink-0 mt-0.5" />
                          <div className="space-y-0.5 flex-1">
                            <span className="text-[11px] font-bold text-gray-800 block">
                              {drawerRegistro.ubicacion || 'Ubicación Registrada en Sitio'}
                            </span>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-gray-500 font-mono">
                              <span>
                                Departamento: <strong className="text-gray-800">{(drawerRegistro as any).departamento || (drawerRegistro as any).departamentoNombre || 'Huehuetenango'}</strong>
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
                  <div className="space-y-2 pb-3.5 border-b border-gray-100">
                    <span className="text-[8.5px] font-bold text-gray-400 uppercase tracking-wider block">
                      Evidencia Fotográfica Principal
                    </span>

                    {drawerRegistro.adjuntos && drawerRegistro.adjuntos.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2.5">
                        {drawerRegistro.adjuntos.map((adj: any) => (
                          <div
                            key={adj.id}
                            onClick={() => setFotoExpandida(adj.url)}
                            className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gray-950 cursor-pointer shadow-xs hover:border-[#9B0F06] transition-all"
                          >
                            <div className="h-44 sm:h-48 w-full overflow-hidden bg-gray-900 flex items-center justify-center">
                              <img
                                src={adj.url}
                                alt={adj.nombre || 'Evidencia'}
                                className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-between p-3 opacity-90 group-hover:opacity-100 transition-opacity">
                              <div className="flex justify-end">
                                <span className="inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-[9.5px] font-bold text-white backdrop-blur-xs">
                                  <ZoomIn size={12} />
                                  <span>Clic para Ampliar</span>
                                </span>
                              </div>
                              <div className="text-white">
                                <p className="text-xs font-bold truncate">{adj.nombre || 'Fotografía en Sitio'}</p>
                                <p className="text-[9.5px] text-gray-200 font-mono">
                                  {adj.tamanio || 'Evidencia de obra'} · Clic para ver en pantalla completa
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/70 p-3.5 text-center">
                        <Camera size={20} className="mx-auto text-gray-300 mb-1" />
                        <p className="text-[11px] font-bold text-gray-500">Sin fotografía adjunta</p>
                        <p className="text-[9.5px] text-gray-400">Este registro no cuenta con archivo fotográfico</p>
                      </div>
                    )}
                  </div>

                  {/* 3. Observaciones y Notas */}
                  <div className="space-y-1">
                    <span className="text-[8.5px] font-bold text-gray-400 uppercase tracking-wider block">
                      Observaciones y Notas de la Jornada
                    </span>
                    <p className="text-[11px] font-medium text-gray-700 leading-relaxed whitespace-pre-line">
                      {drawerRegistro.descripcion || 'Sin observaciones adicionales registradas para este día.'}
                    </p>
                  </div>
                </div>

                {/* Drawer Footer */}
                <div className="p-3.5 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-3">
                  <span className="text-[10px] text-gray-400 font-mono">ID: {drawerRegistro.id}</span>
                  <button
                    type="button"
                    onClick={() => setDrawerRegistro(null)}
                    className="rounded-lg bg-[#9B0F06] px-4 py-2 text-xs font-bold text-white hover:bg-[#5E0006] transition-colors cursor-pointer shadow-2xs"
                  >
                    Cerrar Detalle
                  </button>
                </div>
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
