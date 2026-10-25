'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  MessageSquare,
  MessageSquarePlus,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  FileText,
  Filter,
  Trash2,
  CornerDownRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
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
  proyectoIdActual: string
  proyectosList: any[]
}

const OBSERVACIONES_INICIALES: ObservacionContratante[] = [
  {
    id: 'obs-init-1',
    proyectoId: '9a9253b1-5e08-48fa-a6e4-25e443e05240',
    proyectoNombre: 'REPOSICIÓN DE CARRETERA TRAMO KM 45 A KM 60',
    reporteTitulo: 'Reporte Formal de Obra - Período Quincenal',
    autorNombre: 'Ing. Fernando Castillo',
    autorCargo: 'Supervisor de Contratos Viales',
    autorRol: 'Entidad Contratante',
    tipo: 'tecnica',
    prioridad: 'alta',
    estado: 'en_revision',
    texto:
      'Se solicita a la empresa supervisora y al contratista adjuntar el anexo de ensayos de densidad de campo Proctor en las capas de base granular correspondientes a los subtramos Km 48+200 a Km 51+000 para validar el volumen certificado en la presente entrega.',
    fechaIso: '2026-10-23T14:30:00Z',
    fechaTexto: '23/10/2026, 14:30 hrs',
    respuestas: [
      {
        id: 'resp-1',
        autorNombre: 'Ing. Delegado Residente',
        autorRol: 'Ingeniero Residente',
        texto:
          'Se coordinó con el laboratorio de suelos la recopilación de los certificados de compactación del tramo indicado para su incorporación formal en el expediente.',
        fechaTexto: '23/10/2026, 16:15 hrs',
      },
    ],
  },
  {
    id: 'obs-init-2',
    proyectoId: '1',
    proyectoNombre: 'Paso Inferior Boulevard Vista Hermosa',
    reporteTitulo: 'Informe Mensual de Avance Físico y Financiero',
    autorNombre: 'Licda. Marcela Gómez',
    autorCargo: 'Delegada Fiscalizadora',
    autorRol: 'Entidad Contratante',
    tipo: 'conformidad',
    prioridad: 'baja',
    estado: 'solventada',
    texto:
      'Revisado el avance físico ponderado del 68.4% y las evidencias fotográficas de colocación de vigas pretensadas. La Entidad Contratante emite visto bueno conforme para el trámite de estimación correspondiente.',
    fechaIso: '2026-10-20T10:15:00Z',
    fechaTexto: '20/10/2026, 10:15 hrs',
  },
  {
    id: 'obs-init-3',
    proyectoId: '1a1b0242-e13d-431a-8e4c-50fb29e4fe57',
    proyectoNombre: 'CONSTRUCCION DE FASE 1, CONEXION VAS - HINCAPIE',
    reporteTitulo: 'Bitácora y Evidencias Fotográficas Semanales',
    autorNombre: 'Ing. Roberto Méndez',
    autorCargo: 'Coordinador Técnico Ministerial',
    autorRol: 'Entidad Contratante',
    tipo: 'aclaracion',
    prioridad: 'media',
    estado: 'pendiente',
    texto:
      'En la galería de fotografías se observa maquinaria pesada operando cerca del talud norte. Aclarar si se colocó la señalización preventiva diurna y nocturna estipulada en los términos contractuales de seguridad vial.',
    fechaIso: '2026-10-22T09:00:00Z',
    fechaTexto: '22/10/2026, 09:00 hrs',
  },
]

export function ReportesObservacionesContratante({
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

  const [observaciones, setObservaciones] = useState<ObservacionContratante[]>([])
  const [, setCargado] = useState(false)
  const [formularioAbierto, setFormularioAbierto] = useState(esContratante)
  const [filtroEstado, setFiltroEstado] = useState<'todos' | EstadoObservacion>('todos')
  const [filtroTipo, setFiltroTipo] = useState<'todos' | TipoObservacion>('todos')
  const [filtroProyectoId, setFiltroProyectoId] = useState<string>('todos')

  // Estado del formulario
  const [nuevoProyectoId, setNuevoProyectoId] = useState<string>('')
  const [nuevoTipo, setNuevoTipo] = useState<TipoObservacion>('tecnica')
  const [nuevaPrioridad, setNuevaPrioridad] = useState<'alta' | 'media' | 'baja'>('media')
  const [nuevoReporteTitulo, setNuevoReporteTitulo] = useState<string>('Reporte de Avance y Bitácora Actual')
  const [nuevoTexto, setNuevoTexto] = useState<string>('')
  const [enviando, setEnviando] = useState(false)

  // Respuestas en línea
  const [respondiendoA, setRespondiendoA] = useState<string | null>(null)
  const [textoRespuesta, setTextoRespuesta] = useState<string>('')

  // Cargar observaciones desde localStorage con fallback
  useEffect(() => {
    try {
      const guardadas = localStorage.getItem('domun_reportes_observaciones_contratante')
      if (guardadas) {
        const parsed = JSON.parse(guardadas)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setObservaciones(parsed)
          setCargado(true)
          return
        }
      }
    } catch (_) {}

    setObservaciones(OBSERVACIONES_INICIALES)
    try {
      localStorage.setItem(
        'domun_reportes_observaciones_contratante',
        JSON.stringify(OBSERVACIONES_INICIALES)
      )
    } catch (_) {}
    setCargado(true)
  }, [])

  // Sincronizar proyecto inicial del formulario
  useEffect(() => {
    if (proyectoIdActual && proyectoIdActual !== 'todos') {
      setNuevoProyectoId(proyectoIdActual)
    } else if (proyectosList.length > 0) {
      setNuevoProyectoId(String(proyectosList[0].id))
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
      toast.error('Ingrese el contenido de la observación o comentario.')
      return
    }

    setEnviando(true)

    const proyObj = proyectosList.find((p) => String(p.id) === String(nuevoProyectoId))
    const proyNombre = proyObj?.nombreOficial || proyObj?.nombre || 'Proyecto Vial'
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
      autorCargo: esContratante ? 'Representante Entidad Contratante' : (userProfile?.cargo || userProfile?.rol || 'Supervisor Oficial'),
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
    setEnviando(false)
    toast.success('Observación registrada formalmente en el sistema.')
  }

  const handleResponder = (obsId: string) => {
    if (!textoRespuesta.trim()) {
      toast.error('Escriba una respuesta antes de enviar.')
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
    toast.success('Respuesta agregada al hilo de la observación.')
  }

  const handleCambiarEstado = (obsId: string, nuevoEstado: EstadoObservacion) => {
    const listaActualizada = observaciones.map((obs) => {
      if (obs.id !== obsId) return obs
      return { ...obs, estado: nuevoEstado }
    })
    guardarObservaciones(listaActualizada)
    toast.info(`Estado actualizado a: ${nuevoEstado.replace('_', ' ').toUpperCase()}`)
  }

  const handleEliminarObservacion = (obsId: string) => {
    const listaActualizada = observaciones.filter((obs) => obs.id !== obsId)
    guardarObservaciones(listaActualizada)
    toast.success('Observación eliminada.')
  }

  // Filtrado de observaciones
  const observacionesFiltradas = useMemo(() => {
    return observaciones.filter((obs) => {
      if (filtroEstado !== 'todos' && obs.estado !== filtroEstado) return false
      if (filtroTipo !== 'todos' && obs.tipo !== filtroTipo) return false
      if (filtroProyectoId !== 'todos' && String(obs.proyectoId) !== String(filtroProyectoId)) return false
      return true
    })
  }, [observaciones, filtroEstado, filtroTipo, filtroProyectoId])

  // Contadores
  const contadores = useMemo(() => {
    const total = observaciones.length
    const pendientes = observaciones.filter((o) => o.estado === 'pendiente').length
    const enRevision = observaciones.filter((o) => o.estado === 'en_revision').length
    const solventadas = observaciones.filter((o) => o.estado === 'solventada').length
    return { total, pendientes, enRevision, solventadas }
  }, [observaciones])

  const renderBadgeTipo = (tipo: TipoObservacion) => {
    switch (tipo) {
      case 'tecnica':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[9.5px] font-bold text-amber-800 border border-amber-200">
            <AlertTriangle size={10} className="text-amber-600" />
            Observación Técnica
          </span>
        )
      case 'aclaracion':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[9.5px] font-bold text-blue-800 border border-blue-200">
            <AlertCircle size={10} className="text-blue-600" />
            Solicitud de Aclaración
          </span>
        )
      case 'salvedad':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2 py-0.5 text-[9.5px] font-bold text-orange-800 border border-orange-200">
            <AlertTriangle size={10} className="text-orange-600" />
            Aprobación con Salvedades
          </span>
        )
      case 'conformidad':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[9.5px] font-bold text-emerald-800 border border-emerald-200">
            <CheckCircle2 size={10} className="text-emerald-600" />
            Conformidad / Visto Bueno
          </span>
        )
      case 'general':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2 py-0.5 text-[9.5px] font-bold text-gray-700 border border-gray-200">
            <FileText size={10} className="text-gray-500" />
            Comentario General
          </span>
        )
    }
  }

  const renderBadgeEstado = (estado: EstadoObservacion) => {
    switch (estado) {
      case 'pendiente':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-bold text-red-700 border border-red-200">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            Pendiente de Solventar
          </span>
        )
      case 'en_revision':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700 border border-amber-200">
            <Clock size={9} className="text-amber-600" />
            En Revisión
          </span>
        )
      case 'solventada':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={10} className="text-emerald-600" />
            Solventada / Conforme
          </span>
        )
    }
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-3.5 sm:p-5 shadow-xs font-[Poppins] space-y-4">
      {/* Encabezado Principal de la Sección */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3.5">
        <div className="flex items-start gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-100 shadow-2xs shrink-0">
            <ShieldCheck size={19} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xs sm:text-sm font-bold text-gray-900 tracking-tight">
                Espacio de Observaciones y Comentarios del Contratante
              </h2>
              {esContratante ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-extrabold text-blue-700 border border-blue-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  Rol Contratante Activo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-[9px] font-medium text-gray-600 border border-gray-200">
                  Canal de Supervisión Oficial
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 leading-snug">
              Espacio formal dentro del sistema para emitir observaciones, dictámenes técnicos y comentarios sobre los reportes generados.
            </p>
          </div>
        </div>

        {/* Acciones y Botón de Apertura de Formulario */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setFormularioAbierto((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#9B0F06] hover:bg-[#800C05] text-white text-[11px] font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
          >
            <MessageSquarePlus size={13} />
            <span>{formularioAbierto ? 'Ocultar Formulario' : 'Nueva Observación'}</span>
            {formularioAbierto ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* Banner Informativo si es Contratante */}
      {esContratante && (
        <div className="rounded-xl border border-blue-200/80 bg-blue-50/60 p-3 flex items-start gap-2.5 text-xs text-blue-900">
          <Sparkles size={16} className="text-blue-600 shrink-0 mt-0.5" />
          <div className="text-[10.5px] leading-relaxed">
            <span className="font-bold">Estimado Representante de la Entidad Contratante:</span> Como entidad contratante, sus observaciones emitidas aquí quedan registradas formalmente con fecha, hora y trazabilidad, permitiendo a la empresa supervisora y constructora atender los requerimientos técnicos y solventar observaciones previas a la aprobación de estimaciones.
          </div>
        </div>
      )}

      {/* FORMULARIO DE COMENTARIOS / OBSERVACIONES */}
      {formularioAbierto && (
        <form
          onSubmit={handleCrearObservacion}
          className="rounded-xl border border-blue-200/90 bg-gradient-to-b from-blue-50/40 to-white p-3.5 sm:p-4 space-y-3 shadow-2xs transition-all"
        >
          <div className="flex items-center justify-between border-b border-blue-100 pb-2">
            <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
              <MessageSquare size={14} className="text-blue-700" />
              <span>Emitir Observación o Comentario de Reporte</span>
            </div>
            <span className="text-[10px] text-gray-500 font-medium">
              Autor:{' '}
              <strong className="text-gray-800">
                {userProfile?.nombre || userProfile?.correo || 'Entidad Contratante'}
              </strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Proyecto */}
            <div>
              <label className="block text-[9.5px] font-bold text-gray-700 mb-1 uppercase tracking-wider">
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

            {/* Tipo de Observación */}
            <div>
              <label className="block text-[9.5px] font-bold text-gray-700 mb-1 uppercase tracking-wider">
                Tipo de Observación *
              </label>
              <select
                value={nuevoTipo}
                onChange={(e) => setNuevoTipo(e.target.value as TipoObservacion)}
                className="w-full h-8 px-2.5 rounded-lg border border-gray-300 bg-white text-xs text-gray-800 focus:border-[#9B0F06] focus:outline-none cursor-pointer"
              >
                <option value="tecnica">Observación Técnica de Control</option>
                <option value="aclaracion">Solicitud de Aclaración</option>
                <option value="salvedad">Aprobación con Salvedades</option>
                <option value="conformidad">Visto Bueno / Conforme</option>
                <option value="general">Comentario General</option>
              </select>
            </div>

            {/* Nivel de Prioridad */}
            <div>
              <label className="block text-[9.5px] font-bold text-gray-700 mb-1 uppercase tracking-wider">
                Prioridad / Severidad *
              </label>
              <select
                value={nuevaPrioridad}
                onChange={(e) => setNuevaPrioridad(e.target.value as any)}
                className="w-full h-8 px-2.5 rounded-lg border border-gray-300 bg-white text-xs text-gray-800 focus:border-[#9B0F06] focus:outline-none cursor-pointer"
              >
                <option value="alta">Alta (Impide o condiciona trámite)</option>
                <option value="media">Media (Requiere solventación pronta)</option>
                <option value="baja">Baja (Informativa / Conforme)</option>
              </select>
            </div>
          </div>

          {/* Título o Referencia del Reporte */}
          <div>
            <label className="block text-[9.5px] font-bold text-gray-700 mb-1 uppercase tracking-wider">
              Referencia del Reporte o Documento Consultado
            </label>
            <input
              type="text"
              value={nuevoReporteTitulo}
              onChange={(e) => setNuevoReporteTitulo(e.target.value)}
              placeholder="Ej. Reporte Quincenal de Bitácora Km 45 a 60 / Informe de Avance Físico Mensual"
              className="w-full h-8 px-2.5 rounded-lg border border-gray-300 bg-white text-xs text-gray-800 focus:border-[#9B0F06] focus:outline-none"
            />
          </div>

          {/* Texto de la Observación */}
          <div>
            <label className="block text-[9.5px] font-bold text-gray-700 mb-1 uppercase tracking-wider">
              Detalle de la Observación o Comentario *
            </label>
            <textarea
              rows={3}
              value={nuevoTexto}
              onChange={(e) => setNuevoTexto(e.target.value)}
              placeholder="Describa de forma precisa el requerimiento, aclaración técnica, observación a los datos o conformidad con el reporte..."
              className="w-full p-2.5 rounded-lg border border-gray-300 bg-white text-xs text-gray-800 focus:border-[#9B0F06] focus:outline-none resize-y"
              required
            />
          </div>

          {/* Botones de acción del formulario */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-gray-400">
              * El dictamen quedará vinculado al expediente del proyecto.
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
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#9B0F06] hover:bg-[#800C05] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer active:scale-95"
              >
                <Send size={12} />
                <span>{enviando ? 'Guardando...' : 'Publicar Observación'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* FILTROS Y RESUMEN KPI DE OBSERVACIONES */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
        {/* Chips de Estado */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setFiltroEstado('todos')}
            className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
              filtroEstado === 'todos'
                ? 'bg-gray-900 text-white shadow-2xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todas ({contadores.total})
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado('pendiente')}
            className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
              filtroEstado === 'pendiente'
                ? 'bg-red-700 text-white shadow-2xs'
                : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
            }`}
          >
            Pendientes ({contadores.pendientes})
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado('en_revision')}
            className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
              filtroEstado === 'en_revision'
                ? 'bg-amber-700 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            En Revisión ({contadores.enRevision})
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado('solventada')}
            className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
              filtroEstado === 'solventada'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            Solventadas ({contadores.solventadas})
          </button>
        </div>

        {/* Filtros Tipo y Proyecto */}
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
              <option value="conformidad">Conforme</option>
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

      {/* LISTADO DE OBSERVACIONES */}
      <div className="space-y-3 pt-1">
        {observacionesFiltradas.length === 0 ? (
          <div className="py-8 text-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 space-y-1.5">
            <MessageSquare size={24} className="text-gray-300 mx-auto" />
            <p className="text-xs font-bold text-gray-700">Sin observaciones registradas</p>
            <p className="text-[10px] text-gray-400 max-w-sm mx-auto">
              No hay observaciones que coincidan con los filtros aplicados.
            </p>
          </div>
        ) : (
          observacionesFiltradas.map((obs) => {
            const esAutor =
              userProfile?.id && obs.autorId ? userProfile.id === obs.autorId : false
            const puedeGestionar = esContratante || esAdminOGerencia || esAutor

            return (
              <div
                key={obs.id}
                className="rounded-xl border border-gray-200 bg-white p-3.5 space-y-2.5 shadow-2xs hover:border-gray-300 transition-all"
              >
                {/* Cabecera de la Tarjeta */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {renderBadgeTipo(obs.tipo)}
                    {renderBadgeEstado(obs.estado)}
                    <span className="text-[9px] font-mono text-gray-400">· {obs.fechaTexto}</span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {/* Cambiar Estado */}
                    {puedeGestionar && (
                      <select
                        value={obs.estado}
                        onChange={(e) =>
                          handleCambiarEstado(obs.id, e.target.value as EstadoObservacion)
                        }
                        className="h-6 rounded border border-gray-200 bg-gray-50 px-1.5 text-[9.5px] font-bold text-gray-700 cursor-pointer focus:outline-none"
                        title="Cambiar estado de la observación"
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
                    <span className="rounded bg-blue-50 px-1.5 py-0.2 text-[8.5px] font-bold text-blue-700 border border-blue-100">
                      {obs.autorRol}
                    </span>
                    {obs.autorCargo && (
                      <span className="text-gray-400 hidden sm:inline">({obs.autorCargo})</span>
                    )}
                  </div>
                  <div className="text-gray-500 font-medium truncate max-w-xs">
                    Proyecto: <strong className="text-gray-700">{obs.proyectoNombre}</strong>
                  </div>
                </div>

                {/* Referencia de reporte */}
                {obs.reporteTitulo && (
                  <p className="text-[10px] text-gray-500 font-medium italic">
                    Referencia: {obs.reporteTitulo}
                  </p>
                )}

                {/* Texto de la observación */}
                <div className="rounded-lg bg-gray-50/80 p-2.5 text-xs text-gray-800 leading-relaxed font-sans border border-gray-100">
                  {obs.texto}
                </div>

                {/* Hilo de Respuestas / Solventación */}
                {Array.isArray(obs.respuestas) && obs.respuestas.length > 0 && (
                  <div className="pl-3 sm:pl-5 space-y-2 border-l-2 border-blue-200 mt-2">
                    {obs.respuestas.map((resp) => (
                      <div
                        key={resp.id}
                        className="rounded-lg bg-blue-50/40 border border-blue-100/80 p-2 text-[10.5px] space-y-1"
                      >
                        <div className="flex items-center justify-between text-[9px] text-gray-500">
                          <div className="flex items-center gap-1.5 font-bold text-gray-800">
                            <CornerDownRight size={11} className="text-blue-600" />
                            <span>{resp.autorNombre}</span>
                            <span className="font-normal text-gray-500">({resp.autorRol})</span>
                          </div>
                          <span>{resp.fechaTexto}</span>
                        </div>
                        <p className="text-gray-800 leading-snug pl-4">{resp.texto}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Formulario para Responder */}
                {respondiendoA === obs.id ? (
                  <div className="pt-2 pl-3 sm:pl-5 border-l-2 border-dashed border-gray-300 space-y-2">
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
                        className="px-3 py-1 rounded bg-blue-700 hover:bg-blue-800 text-white text-[10.5px] font-bold shadow-2xs cursor-pointer active:scale-95"
                      >
                        Enviar Respuesta
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => setRespondiendoA(obs.id)}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 hover:text-blue-900 transition-colors cursor-pointer"
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
    </section>
  )
}
