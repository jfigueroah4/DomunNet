'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  MessageSquare,
  MessageSquarePlus,
  Send,
  FolderKanban,
  Filter,
  Trash2,
  CornerDownRight,
  Maximize2,
  Minimize2,
  X,
} from 'lucide-react'
import { Portal } from '@/components/ui/Portal'
import { showSuccessToast, showErrorToast, showInfoToast } from '@/components/ui/Toast'
import { useAuthStore } from '@/stores/useAuthStore'

export type TipoObservacion =
  | 'tecnica'
  | 'aclaracion'
  | 'salvedad'
  | 'conformidad'
  | 'general'

export type EstadoObservacion =
  | 'pendiente'
  | 'en_revision'
  | 'solventada'

export interface ObservacionContratante {
  id: string
  proyectoId: string
  proyectoNombre: string
  reporteTitulo?: string
  autorId?: string
  autorNombre: string
  autorCargo?: string
  autorRol: string
  tipo: TipoObservacion
  prioridad: 'alta' | 'media' | 'baja'
  estado: EstadoObservacion
  texto: string
  fechaIso: string
  fechaTexto: string
  respuestas?: {
    id: string
    autorNombre: string
    autorRol: string
    texto: string
    fechaTexto: string
  }[]
}

interface ReportesObservacionesContratanteProps {
  isOpen: boolean
  onClose: () => void
  proyectoIdActual: string
  proyectosList: any[]
}

export function ReportesObservacionesContratante({
  isOpen,
  onClose,
  proyectoIdActual,
  proyectosList,
}: ReportesObservacionesContratanteProps) {
  const { profile: userProfile } = useAuthStore()

  const rolNorm = String(userProfile?.rol || '').toLowerCase().trim()
  const esContratante = rolNorm.includes('contratante')
  const esAdminOGerencia =
    rolNorm.includes('admin') ||
    rolNorm.includes('gerenc') ||
    (userProfile as any)?.nivel_permisos >= 100

  // Estado de tamaño expandido (como el bot AI)
  const [isExpanded, setIsExpanded] = useState(false)

  // Sin datos quemados: solo lo que exista en localStorage
  const [observaciones, setObservaciones] = useState<ObservacionContratante[]>([])
  const [formularioAbierto, setFormularioAbierto] = useState(false)
  const [filtroEstado, setFiltroEstado] = useState<'todos' | EstadoObservacion>('todos')
  const [filtroTipo, setFiltroTipo] = useState<'todos' | TipoObservacion>('todos')
  const [filtroProyectoId, setFiltroProyectoId] = useState<string>('todos')

  // Formulario
  const [nuevoProyectoId, setNuevoProyectoId] = useState<string>('')
  const [nuevoTipo, setNuevoTipo] = useState<TipoObservacion>('tecnica')
  const [nuevaPrioridad, setNuevaPrioridad] = useState<'alta' | 'media' | 'baja'>('media')
  const [nuevoReporteTitulo, setNuevoReporteTitulo] = useState<string>('')
  const [nuevoTexto, setNuevoTexto] = useState<string>('')
  const [enviando, setEnviando] = useState(false)

  // Respuestas en línea
  const [respondiendoA, setRespondiendoA] = useState<string | null>(null)
  const [textoRespuesta, setTextoRespuesta] = useState<string>('')

  // Cargar exclusivamente datos reales guardados por el usuario
  useEffect(() => {
    try {
      const guardadas = localStorage.getItem('domun_reportes_observaciones_contratante')
      if (guardadas) {
        const parsed = JSON.parse(guardadas)
        if (Array.isArray(parsed)) {
          // Filtrar cualquier dato de prueba anterior que pudiera haber quedado en el navegador del usuario
          const reales = parsed.filter(
            (o: any) =>
              o &&
              o.id &&
              !o.id.startsWith('obs-init-') &&
              !String(o.autorNombre || '').includes('Fernando Castillo') &&
              !String(o.autorNombre || '').includes('Marcela Gómez') &&
              !String(o.autorNombre || '').includes('Roberto Méndez')
          )
          setObservaciones(reales)
          localStorage.setItem('domun_reportes_observaciones_contratante', JSON.stringify(reales))
          return
        }
      }
    } catch (_) {}
    setObservaciones([])
  }, [])

  // Sincronizar proyecto inicial
  useEffect(() => {
    if (proyectoIdActual && proyectoIdActual !== 'todos') {
      setNuevoProyectoId(proyectoIdActual)
      setFiltroProyectoId(proyectoIdActual)
    } else if (proyectosList.length > 0) {
      setNuevoProyectoId(String(proyectosList[0].id))
      setFiltroProyectoId('todos')
    }
  }, [proyectoIdActual, proyectosList])

  const guardarObservaciones = (lista: ObservacionContratante[]) => {
    setObservaciones(lista)
    try {
      localStorage.setItem('domun_reportes_observaciones_contratante', JSON.stringify(lista))
    } catch (_) {}
  }

  const handleCrearObservacion = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevoTexto.trim()) {
      showErrorToast('Ingrese el detalle de la observación.')
      return
    }

    setEnviando(true)

    const proyObj = proyectosList.find((p) => String(p.id) === String(nuevoProyectoId))
    const proyNombre = proyObj?.nombreOficial || proyObj?.nombre || 'Proyecto de Obra'
    const ahora = new Date()

    const autorNombre =
      userProfile?.nombre ||
      `${userProfile?.primerNombre || ''} ${userProfile?.primerApellido || ''}`.trim() ||
      userProfile?.correo ||
      (esContratante ? 'Delegado Contratante' : 'Entidad Contratante')

    const nuevaObs: ObservacionContratante = {
      id: `obs-${Date.now()}`,
      proyectoId: String(nuevoProyectoId),
      proyectoNombre: proyNombre,
      reporteTitulo: nuevoReporteTitulo.trim() || 'Reporte Oficial de Obra',
      autorId: userProfile?.id,
      autorNombre: autorNombre,
      autorCargo: esContratante ? 'Representante Entidad Contratante' : (userProfile?.cargo || userProfile?.rol || 'Contratante'),
      autorRol: esContratante ? 'Entidad Contratante' : (userProfile?.rol || 'Contratante'),
      tipo: nuevoTipo,
      prioridad: nuevaPrioridad,
      estado: 'pendiente',
      texto: nuevoTexto.trim(),
      fechaIso: ahora.toISOString(),
      fechaTexto:
        ahora.toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
        ', ' +
        ahora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
        ' hrs',
    }

    const listaActualizada = [nuevaObs, ...observaciones]
    guardarObservaciones(listaActualizada)

    setNuevoTexto('')
    setNuevoReporteTitulo('')
    setFormularioAbierto(false)
    setEnviando(false)
    showSuccessToast('Observación registrada formalmente en el sistema.')
  }

  const handleResponder = (obsId: string) => {
    if (!textoRespuesta.trim()) {
      showErrorToast('Escriba una respuesta antes de enviar.')
      return
    }

    const ahora = new Date()
    const autorResp =
      userProfile?.nombre ||
      `${userProfile?.primerNombre || ''} ${userProfile?.primerApellido || ''}`.trim() ||
      userProfile?.correo ||
      'Equipo de Obra'

    const listaActualizada = observaciones.map((obs) => {
      if (obs.id !== obsId) return obs
      const respuestasPrevias = obs.respuestas || []
      return {
        ...obs,
        estado: obs.estado === 'pendiente' ? ('en_revision' as EstadoObservacion) : obs.estado,
        respuestas: [
          ...respuestasPrevias,
          {
            id: `resp-${Date.now()}`,
            autorNombre: autorResp,
            autorRol: userProfile?.rol || 'Supervisión / Residencia',
            texto: textoRespuesta.trim(),
            fechaTexto:
              ahora.toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
              ', ' +
              ahora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
              ' hrs',
          },
        ],
      }
    })

    guardarObservaciones(listaActualizada)
    setTextoRespuesta('')
    setRespondiendoA(null)
    showSuccessToast('Respuesta agregada al hilo de la observación.')
  }

  const handleCambiarEstado = (obsId: string, nuevoEstado: EstadoObservacion) => {
    const listaActualizada = observaciones.map((obs) => {
      if (obs.id !== obsId) return obs
      return { ...obs, estado: nuevoEstado }
    })
    guardarObservaciones(listaActualizada)
    showInfoToast(`Estado actualizado: ${nuevoEstado.replace('_', ' ').toUpperCase()}`)
  }

  const handleEliminarObservacion = (obsId: string) => {
    const listaActualizada = observaciones.filter((obs) => obs.id !== obsId)
    guardarObservaciones(listaActualizada)
    showSuccessToast('Observación eliminada.')
  }

  const observacionesFiltradas = useMemo(() => {
    return observaciones.filter((obs) => {
      if (filtroEstado !== 'todos' && obs.estado !== filtroEstado) return false
      if (filtroTipo !== 'todos' && obs.tipo !== filtroTipo) return false
      if (filtroProyectoId !== 'todos' && String(obs.proyectoId) !== String(filtroProyectoId)) return false
      return true
    })
  }, [observaciones, filtroEstado, filtroTipo, filtroProyectoId])

  const contadores = useMemo(() => {
    const total = observaciones.length
    const pendientes = observaciones.filter((o) => o.estado === 'pendiente').length
    const enRevision = observaciones.filter((o) => o.estado === 'en_revision').length
    const solventadas = observaciones.filter((o) => o.estado === 'solventada').length
    return { total, pendientes, enRevision, solventadas }
  }, [observaciones])

  const proyectoActualNombre = useMemo(() => {
    if (proyectoIdActual === 'todos') return 'Todos los Proyectos'
    const match = proyectosList.find((p) => String(p.id) === String(proyectoIdActual))
    return match?.nombreOficial || match?.nombre || 'Proyecto Activo'
  }, [proyectoIdActual, proyectosList])

  if (!isOpen) return null

  return (
    <Portal>
      {/* Fondo semitransparente con desenfoque suave idéntico al bot */}
      <div
        className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-[2px] transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modal acoplado o expandido idéntico al bot AI */}
      <div
        className={`fixed z-[1001] bg-white shadow-2xl border border-[#D1D5DB] flex flex-col overflow-hidden transition-all duration-300 ease-out font-[Poppins] ${
          isExpanded
            ? 'inset-3 sm:inset-6 md:inset-8 rounded-2xl'
            : 'inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 top-[6%] sm:top-[8%] w-auto sm:w-[860px] max-w-[96vw] h-[82vh] max-h-[820px] rounded-2xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado idéntico al estilo DomunBot AI */}
        <div className="flex items-center justify-between border-b border-[#D1D5DB] bg-[#E5E7EB] text-[#1F2937] px-4 py-2.5 select-none shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-white/60 border border-[#D1D5DB] flex items-center justify-center text-[#4B5563] shrink-0">
              <MessageSquare size={16} className="text-[#4B5563]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-bold tracking-wide text-[#4B5563]">
                Observaciones del Contratante
              </h2>
              <p className="text-[10px] text-[#6B7280] truncate">
                Espacio de comentarios, aclaraciones y dictámenes sobre reportes de obra • DomunNet
              </p>
            </div>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            {/* Botón Maximizar / Restaurar */}
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="p-1.5 text-[#6B7280] hover:text-[#1F2937] hover:bg-[#D1D5DB] rounded-lg transition-colors cursor-pointer"
              title={isExpanded ? 'Restaurar tamaño' : 'Ampliar ventana'}
            >
              {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
            {/* Botón Cerrar */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#6B7280] hover:text-[#1F2937] hover:bg-[#D1D5DB] rounded-lg transition-colors cursor-pointer"
              title="Cerrar ventana"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Barra de Proyecto y Acciones (Subencabezado como el bot) */}
        <div className="bg-[#F3F4F6] border-b border-[#D1D5DB] px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[#4B5563] shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <FolderKanban size={13} className="shrink-0 text-gray-500" />
            <span className="truncate font-semibold text-gray-700">
              Proyecto activo: {proyectoActualNombre}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFormularioAbierto((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#9B0F06] hover:bg-[#5E0006] text-white text-[11px] font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
            >
              <MessageSquarePlus size={13} />
              <span>{formularioAbierto ? 'Ver Observaciones' : 'Nueva Observación'}</span>
            </button>
          </div>
        </div>

        {/* Cuerpo del Modal con scroll */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4 bg-white text-xs">
          {/* FORMULARIO DE NUEVA OBSERVACIÓN (Limpio, fondo blanco, bordes neutros) */}
          {formularioAbierto && (
            <form
              onSubmit={handleCrearObservacion}
              className="rounded-xl border border-gray-200 bg-white p-4 space-y-3 shadow-2xs"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div className="flex items-center gap-1.5 text-gray-900 font-bold text-xs">
                  <MessageSquare size={14} className="text-gray-700" />
                  <span>Emitir Observación o Dictamen</span>
                </div>
                <span className="text-[10px] text-gray-500 font-medium">
                  Autor:{' '}
                  <strong className="text-gray-800">
                    {userProfile?.nombre || userProfile?.correo || 'Entidad Contratante'}
                  </strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[9.5px] font-bold text-gray-600 mb-1 uppercase tracking-wider">
                    Proyecto Asociado *
                  </label>
                  <select
                    value={nuevoProyectoId}
                    onChange={(e) => setNuevoProyectoId(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-lg border border-gray-300 bg-white text-xs text-gray-800 focus:border-[#9B0F06] focus:outline-none cursor-pointer"
                    required
                  >
                    {proyectosList.map((p) => (
                      <option key={p.id} value={String(p.id)}>
                        {p.codigo ? `${p.codigo} - ` : ''}
                        {p.nombreOficial || p.nombre || 'Proyecto'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[9.5px] font-bold text-gray-600 mb-1 uppercase tracking-wider">
                    Tipo de Observación *
                  </label>
                  <select
                    value={nuevoTipo}
                    onChange={(e) => setNuevoTipo(e.target.value as TipoObservacion)}
                    className="w-full h-8 px-2.5 rounded-lg border border-gray-300 bg-white text-xs text-gray-800 focus:border-[#9B0F06] focus:outline-none cursor-pointer"
                  >
                    <option value="tecnica">Observación Técnica</option>
                    <option value="aclaracion">Solicitud de Aclaración</option>
                    <option value="salvedad">Aprobación con Salvedades</option>
                    <option value="conformidad">Conformidad / Visto Bueno</option>
                    <option value="general">Comentario General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9.5px] font-bold text-gray-600 mb-1 uppercase tracking-wider">
                    Prioridad / Nivel *
                  </label>
                  <select
                    value={nuevaPrioridad}
                    onChange={(e) => setNuevaPrioridad(e.target.value as any)}
                    className="w-full h-8 px-2.5 rounded-lg border border-gray-300 bg-white text-xs text-gray-800 focus:border-[#9B0F06] focus:outline-none cursor-pointer"
                  >
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[9.5px] font-bold text-gray-600 mb-1 uppercase tracking-wider">
                  Referencia del Reporte o Documento (Opcional)
                </label>
                <input
                  type="text"
                  value={nuevoReporteTitulo}
                  onChange={(e) => setNuevoReporteTitulo(e.target.value)}
                  placeholder="Ej. Reporte Quincenal de Bitácora / Informe Mensual de Avance"
                  className="w-full h-8 px-2.5 rounded-lg border border-gray-300 bg-white text-xs text-gray-800 focus:border-[#9B0F06] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[9.5px] font-bold text-gray-600 mb-1 uppercase tracking-wider">
                  Detalle de la Observación o Comentario *
                </label>
                <textarea
                  rows={3}
                  value={nuevoTexto}
                  onChange={(e) => setNuevoTexto(e.target.value)}
                  placeholder="Describa de forma precisa el requerimiento, aclaración técnica, observación o comentario sobre el reporte..."
                  className="w-full p-2.5 rounded-lg border border-gray-300 bg-white text-xs text-gray-800 focus:border-[#9B0F06] focus:outline-none resize-y"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-gray-400">
                  Quedará registrado formalmente con fecha y autor.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFormularioAbierto(false)}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={enviando || !nuevoTexto.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#9B0F06] hover:bg-[#5E0006] text-white text-xs font-bold transition-all shadow-2xs disabled:opacity-50 cursor-pointer active:scale-95"
                  >
                    <Send size={12} />
                    <span>{enviando ? 'Guardando...' : 'Publicar Observación'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* BARRA DE FILTROS NEUTRAL (Sin fondos de colores pasteles) */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setFiltroEstado('todos')}
                className={`px-2.5 py-1 rounded-md text-[10.5px] font-semibold transition-colors cursor-pointer border ${
                  filtroEstado === 'todos'
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                Todas ({contadores.total})
              </button>
              <button
                type="button"
                onClick={() => setFiltroEstado('pendiente')}
                className={`px-2.5 py-1 rounded-md text-[10.5px] font-semibold transition-colors cursor-pointer border ${
                  filtroEstado === 'pendiente'
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                Pendientes ({contadores.pendientes})
              </button>
              <button
                type="button"
                onClick={() => setFiltroEstado('en_revision')}
                className={`px-2.5 py-1 rounded-md text-[10.5px] font-semibold transition-colors cursor-pointer border ${
                  filtroEstado === 'en_revision'
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                En Revisión ({contadores.enRevision})
              </button>
              <button
                type="button"
                onClick={() => setFiltroEstado('solventada')}
                className={`px-2.5 py-1 rounded-md text-[10.5px] font-semibold transition-colors cursor-pointer border ${
                  filtroEstado === 'solventada'
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                Solventadas ({contadores.solventadas})
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                <Filter size={11} className="text-gray-400" />
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value as any)}
                  className="h-7 rounded-md border border-gray-200 bg-white px-2 text-[10px] font-medium text-gray-700 focus:outline-none"
                >
                  <option value="todos">Todos los tipos</option>
                  <option value="tecnica">Técnica</option>
                  <option value="aclaracion">Aclaración</option>
                  <option value="salvedad">Con Salvedades</option>
                  <option value="conformidad">Conformidad</option>
                  <option value="general">General</option>
                </select>
              </div>

              <select
                value={filtroProyectoId}
                onChange={(e) => setFiltroProyectoId(e.target.value)}
                className="h-7 rounded-md border border-gray-200 bg-white px-2 text-[10px] font-medium text-gray-700 focus:outline-none max-w-[180px] truncate"
              >
                <option value="todos">Todos los proyectos</option>
                {proyectosList.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.codigo ? `${p.codigo} - ` : ''}
                    {p.nombreOficial || p.nombre || 'Proyecto'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* LISTADO DE OBSERVACIONES REALES */}
          <div className="space-y-3">
            {observacionesFiltradas.length === 0 ? (
              <div className="py-12 text-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 space-y-2">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-gray-400">
                  <MessageSquare size={18} />
                </div>
                <p className="text-xs font-bold text-gray-700">No hay observaciones registradas</p>
                <p className="text-[10.5px] text-gray-400 max-w-sm mx-auto">
                  Los comentarios, requerimientos o dictámenes que emita la Entidad Contratante sobre los reportes se registrarán y mostrarán aquí.
                </p>
                {(esContratante || esAdminOGerencia) && !formularioAbierto && (
                  <button
                    type="button"
                    onClick={() => setFormularioAbierto(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-[11px] font-bold hover:bg-black transition-colors cursor-pointer mt-1"
                  >
                    <MessageSquarePlus size={12} />
                    <span>Registrar observación</span>
                  </button>
                )}
              </div>
            ) : (
              observacionesFiltradas.map((obs) => {
                const esAutor = userProfile?.id && obs.autorId ? userProfile.id === obs.autorId : false
                const puedeGestionar = esContratante || esAdminOGerencia || esAutor

                const tipoTexto =
                  obs.tipo === 'tecnica'
                    ? 'Observación Técnica'
                    : obs.tipo === 'aclaracion'
                    ? 'Solicitud de Aclaración'
                    : obs.tipo === 'salvedad'
                    ? 'Con Salvedades'
                    : obs.tipo === 'conformidad'
                    ? 'Conformidad / Visto Bueno'
                    : 'Comentario General'

                const estadoTexto =
                  obs.estado === 'pendiente'
                    ? 'Pendiente'
                    : obs.estado === 'en_revision'
                    ? 'En Revisión'
                    : 'Solventada'

                return (
                  <div
                    key={obs.id}
                    className="rounded-xl border border-gray-200 bg-white p-3.5 space-y-2.5 shadow-2xs"
                  >
                    {/* Header de la tarjeta */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold text-gray-800 border border-gray-200 rounded px-1.5 py-0.5 bg-white">
                          {tipoTexto}
                        </span>
                        <span className="text-[9.5px] font-medium text-gray-600 border border-gray-200 rounded px-1.5 py-0.5 bg-white">
                          {estadoTexto}
                        </span>
                        <span className="text-[9px] font-mono text-gray-400">· {obs.fechaTexto}</span>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {puedeGestionar && (
                          <select
                            value={obs.estado}
                            onChange={(e) =>
                              handleCambiarEstado(obs.id, e.target.value as EstadoObservacion)
                            }
                            className="h-6 rounded border border-gray-200 bg-white px-1.5 text-[9.5px] font-semibold text-gray-700 cursor-pointer focus:outline-none"
                            title="Cambiar estado"
                          >
                            <option value="pendiente">Pendiente</option>
                            <option value="en_revision">En Revisión</option>
                            <option value="solventada">Solventada</option>
                          </select>
                        )}

                        {puedeGestionar && (
                          <button
                            type="button"
                            onClick={() => handleEliminarObservacion(obs.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                            title="Eliminar observación"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Info de Autor y Proyecto */}
                    <div className="flex flex-wrap items-center justify-between gap-1 text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-gray-900">{obs.autorNombre}</span>
                        <span className="text-gray-500 font-medium">({obs.autorRol})</span>
                      </div>
                      <div className="text-gray-500 font-medium truncate max-w-xs">
                        Proyecto: <strong className="text-gray-800">{obs.proyectoNombre}</strong>
                      </div>
                    </div>

                    {obs.reporteTitulo && (
                      <p className="text-[10px] text-gray-500 italic">
                        Referencia: {obs.reporteTitulo}
                      </p>
                    )}

                    {/* Texto de la observación (Fondo blanco limpio, borde sutil) */}
                    <div className="p-2.5 text-xs text-gray-800 leading-relaxed font-sans border border-gray-100 rounded-lg bg-gray-50/60">
                      {obs.texto}
                    </div>

                    {/* Hilo de Respuestas */}
                    {Array.isArray(obs.respuestas) && obs.respuestas.length > 0 && (
                      <div className="pl-3 sm:pl-4 space-y-1.5 border-l-2 border-gray-200 mt-2">
                        {obs.respuestas.map((resp) => (
                          <div
                            key={resp.id}
                            className="rounded-lg border border-gray-200 bg-gray-50/50 p-2 text-[10.5px] space-y-1"
                          >
                            <div className="flex items-center justify-between text-[9px] text-gray-500">
                              <span className="font-bold text-gray-800">
                                {resp.autorNombre} ({resp.autorRol})
                              </span>
                              <span>{resp.fechaTexto}</span>
                            </div>
                            <p className="text-gray-800 leading-snug">{resp.texto}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Formulario de Respuesta */}
                    {respondiendoA === obs.id ? (
                      <div className="pt-2 pl-3 sm:pl-4 border-l-2 border-gray-200 space-y-2">
                        <textarea
                          rows={2}
                          value={textoRespuesta}
                          onChange={(e) => setTextoRespuesta(e.target.value)}
                          placeholder="Escriba la respuesta o aclaración técnica a esta observación..."
                          className="w-full p-2 rounded-lg border border-gray-300 text-xs text-gray-800 focus:outline-none focus:border-[#9B0F06]"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setRespondiendoA(null)
                              setTextoRespuesta('')
                            }}
                            className="px-2.5 py-1 rounded text-[10.5px] font-semibold text-gray-500 hover:bg-gray-100 cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResponder(obs.id)}
                            className="px-3 py-1 rounded bg-[#9B0F06] hover:bg-[#5E0006] text-white text-[10.5px] font-bold shadow-2xs cursor-pointer active:scale-95"
                          >
                            Enviar Respuesta
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end pt-0.5">
                        <button
                          type="button"
                          onClick={() => setRespondiendoA(obs.id)}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                        >
                          <CornerDownRight size={11} />
                          <span>Responder / Solventar</span>
                        </button>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Footer del Modal */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#D1D5DB] bg-[#F9FAFB] shrink-0 text-xs text-gray-500">
          <span className="text-[10px]">
            {observaciones.length} {observaciones.length === 1 ? 'observación' : 'observaciones'} en total
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-3.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer shadow-2xs"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Portal>
  )
}
