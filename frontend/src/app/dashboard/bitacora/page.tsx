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

import { useAuthStore } from '@/stores/useAuthStore'
import { apiGetDeduplicado } from '@/lib/api/cliente'
import { Portal } from '@/components/ui/Portal'
import { MapaGuatemalaDepartamentos } from '@/components/modules/fotografias/MapaGuatemalaDepartamentos'

export default function BitacoraPage() {
  const searchParams = useSearchParams()
  const usuario = useAuthStore((s) => s.profile)
  const rolUsuario = (usuario?.rol || '').toLowerCase()
  const esAdmin = rolUsuario.includes('admin') || rolUsuario.includes('director')
  const esResidente = rolUsuario.includes('residente')
  const esRolCampoRestringido = !esAdmin && !esResidente

  const [vista, setVista] = useState<'lista' | 'crear'>('lista')
  const [registrosApi, setRegistrosApi] = useState<any[]>([])

  useEffect(() => {
    if (searchParams?.get('nuevo') === 'true' || searchParams?.get('formulario') === 'true') {
      setVista('crear')
    }
  }, [searchParams])

  useEffect(() => {
    apiGetDeduplicado('/mantenimiento/bitacora_entrada')
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setRegistrosApi(res.data.data)
        }
      })
      .catch(() => {})
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
      <div className="w-full p-2 sm:p-4 min-h-[calc(100vh-80px)]">
        <BitacoraForm
          onBack={() => setVista('lista')}
          onSubmit={() => {
            setVista('lista')
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
                      <BitacoraEstadoBadge estado={drawerRegistro.estado} />
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
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

                      <div className="sm:col-span-2">
                        <span className="text-[8.5px] font-bold text-gray-400 uppercase tracking-wider block">
                          Responsable / Autor
                        </span>
                        <span className="text-[11px] font-bold text-gray-800 flex items-center gap-1">
                          <User size={11} className="text-gray-400" />
                          <span>{drawerRegistro.autor}</span>
                          {drawerRegistro.autorRol && (
                            <span className="text-[9.5px] text-gray-500 font-normal">({drawerRegistro.autorRol})</span>
                          )}
                        </span>
                      </div>

                      {/* Ubicación GPS y Departamento con solo el Icono de Mapa sin fondo */}
                      <div className="sm:col-span-2 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[8.5px] font-bold text-gray-400 uppercase tracking-wider block">
                            Ubicación y Departamento (GPS)
                          </span>
                          {/* Botón de Mapa solo icono sin fondo */}
                          <button
                            type="button"
                            onClick={() => setModalMapaGTAbierto(true)}
                            className="p-1 text-[#9B0F06] hover:text-[#5E0006] hover:scale-110 transition-all cursor-pointer focus:outline-none"
                            title="Ver Mapa GT"
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
                            <div className="aspect-[16/9] max-h-64 sm:max-h-72 w-full overflow-hidden bg-gray-100 flex items-center justify-center">
                              <img
                                src={adj.url}
                                alt={adj.nombre || 'Evidencia'}
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
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

      {/* MODAL DEL MAPA DE GUATEMALA Y RUTA DE LA OBRA (Fondo Verde Satelital Realista Leaflet/Esri + Reconocimiento de GPS) */}
      {modalMapaGTAbierto && drawerRegistro && (
        <Portal>
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-sm font-[Poppins]"
            onClick={() => setModalMapaGTAbierto(false)}
          >
            <div
              className="relative w-full max-w-3xl bg-zinc-950 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Encabezado del Mapa */}
              <div className="flex items-center justify-between p-3.5 border-b border-zinc-800 bg-zinc-900/90">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-red-600/20 text-red-500 flex items-center justify-center">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">
                      Ruta de Obra y Ubicación Geográfica
                    </h3>
                    <p className="text-[10px] text-zinc-400 font-mono">
                      {drawerRegistro.proyectoNombre || 'Proyecto de Obra'} · {(drawerRegistro as any).departamento || (drawerRegistro as any).departamentoNombre || 'Huehuetenango'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setModalMapaGTAbierto(false)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
                  title="Cerrar mapa"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Vista del Mapa de Satélite / Terreno Verde Realista (Estilo Leaflet/Esri Satellite Terrain) */}
              <div className="relative w-full h-[400px] sm:h-[460px] bg-[#1C2E1C] overflow-hidden select-none">
                {/* SVG Fondo con textura de mapa topográfico satelital verde Leaflet */}
                <svg viewBox="0 0 800 500" className="w-full h-full object-cover">
                  <defs>
                    <linearGradient id="leafGreenGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#1B2E1C" />
                      <stop offset="50%" stopColor="#253D25" />
                      <stop offset="100%" stopColor="#1A291A" />
                    </linearGradient>
                  </defs>

                  {/* Capa de fondo satelital */}
                  <rect width="800" height="500" fill="url(#leafGreenGrad)" />

                  {/* Contornos de relieve montañoso verde oscuro/claro */}
                  <path d="M 0 0 L 800 0 L 800 500 L 0 500 Z" fill="#1C2E1C" />
                  <path d="M 100 20 Q 300 220 520 100 T 800 180 L 800 500 L 0 500 Z" fill="#263E26" opacity="0.8" />
                  <path d="M 280 80 Q 580 320 780 440 L 800 500 L 150 500 Z" fill="#304C30" opacity="0.65" />
                  <path d="M 400 180 Q 600 380 720 480 L 800 500 L 350 500 Z" fill="#213521" opacity="0.7" />

                  {/* Vías secundarias beige / gris */}
                  <path d="M 50 120 L 320 180 L 400 250 M 320 180 L 450 100 L 780 110" stroke="#D4C59E" strokeWidth="2.5" fill="none" opacity="0.6" strokeDasharray="6,4" />
                  <path d="M 220 420 L 480 340 L 750 420" stroke="#D4C59E" strokeWidth="2" fill="none" opacity="0.5" strokeDasharray="4,4" />

                  {/* RUTA PRINCIPAL DEL PROYECTO (Línea Roja #EF4444 sin parpadeos) */}
                  <path
                    d="M 530 150 L 535 190 L 525 240 L 530 270 L 545 320 L 580 340 L 615 365 L 610 390 L 580 405 L 610 420 L 640 430"
                    stroke="#EF4444"
                    strokeWidth="5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Puntos de Estación a lo largo de la ruta */}
                  <g className="font-sans text-[11px] font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                    <text x="250" y="85" fill="#E4E4E7">San Antonio el Cimarrón</text>
                    <text x="350" y="140" fill="#E4E4E7">Finca La Trinidad</text>
                    <text x="470" y="160" fill="#E4E4E7">Yuxquen</text>

                    {/* Yalambojoch */}
                    <text x="510" y="140" fill="#FFFFFF" textAnchor="middle">Yalambojoch</text>
                    <circle cx="530" cy="150" r="4" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2" />

                    {/* Bulej */}
                    <text x="500" y="255" fill="#FFFFFF" textAnchor="end">Bulej</text>
                    <circle cx="528" cy="255" r="4.5" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2" />

                    {/* Patalcal */}
                    <text x="535" y="335" fill="#FFFFFF">Patalcal</text>
                    <circle cx="550" cy="325" r="4.5" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2" />

                    <text x="440" y="375" fill="#E4E4E7">Yolcultac</text>

                    {/* San Mateo Ixtatán */}
                    <text x="645" y="415" fill="#FFFFFF">San Mateo Ixtatán</text>
                    <circle cx="640" cy="430" r="5" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2" />

                    {/* Escudo de Carretera 9N */}
                    <g transform="translate(620, 420)">
                      <rect width="22" height="15" rx="3" fill="#FFFFFF" stroke="#334155" strokeWidth="1" />
                      <text x="11" y="11" fill="#0F172A" fontSize="9" fontWeight="900" textAnchor="middle">9N</text>
                    </g>
                  </g>
                </svg>

                {/* MINI MAPA DE GUATEMALA SUPERPUESTO EN LA ESQUINA SUPERIOR IZQUIERDA */}
                <div className="absolute top-3 left-3 bg-white p-2.5 rounded-xl shadow-2xl border border-gray-200 z-20 w-44 sm:w-48">
                  <div className="text-[9px] font-black text-gray-800 uppercase tracking-wider mb-1 text-center font-mono border-b border-gray-100 pb-1">
                    Guatemala · {(drawerRegistro as any).departamento || (drawerRegistro as any).departamentoNombre || 'Huehuetenango'}
                  </div>
                  <MapaGuatemalaDepartamentos
                    ubicacion={drawerRegistro.ubicacion || drawerRegistro.proyectoNombre || ''}
                    departamentoSeleccionado={(drawerRegistro as any).departamento || (drawerRegistro as any).departamentoNombre || 'Huehuetenango'}
                    soloMapa={true}
                    compacto={true}
                    fondoTransparente={true}
                    className="w-full"
                  />
                </div>

                {/* Coordenadas GPS del registro dinámicas */}
                <div className="absolute bottom-3 right-3 bg-zinc-900/90 backdrop-blur-xs text-white px-3 py-1.5 rounded-lg border border-zinc-700 text-[10.5px] font-mono flex items-center gap-2 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span>
                    Coordenadas GPS: {drawerRegistro.coordenadasGps?.lat
                      ? `${drawerRegistro.coordenadasGps.lat.toFixed(6)}, ${drawerRegistro.coordenadasGps.lng?.toFixed(6)}`
                      : '14.500167, -90.617015'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  )
}
