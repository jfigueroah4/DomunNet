'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Building2,
  Calculator,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  FolderPlus,
  Layers,
  Lock,
  Plus,
  Receipt,
  Search,
  Trash2,
  TrendingUp,
  User,
  UserCheck,
  X,
} from 'lucide-react'
import type { ProyectoType } from '@/validations/proyecto.schema'
import { useAuthStore } from '@/stores/useAuthStore'
import { showErrorToast, showSuccessToast } from '@/hooks/useCustomToast'
import { Portal } from '@/components/ui/Portal'
import { apiGetDeduplicado } from '@/lib/api/cliente'
import { proyectoService } from '@/services/proyectos/proyecto.service'

export interface RenglonItemFinanciero {
  id: string
  renglonId?: string
  capituloId: number
  capituloNombre: string
  codigoDGC: string
  descripcion: string
  unidad: string
  cantidadContratada: number
  cantidadAjustada?: number
  costoUnitarioDirecto: number
  cantidadEstePeriodo?: number
  cantidadAcumuladaAnterior?: number
  montoTotalContratado?: number
  seleccionado?: boolean
  esPersonalizado?: boolean
}

export interface EstimacionFinancieraItem {
  id: string
  numero: string
  nombreEstimacion: string
  delegadoResidente: string
  perspectiva: 'ejecutora' | 'supervisora'
  fechaInicio: string
  fechaFin: string
  fechaCorte?: string
  mes: string
  diasRetraso: number
  porcentajeRendimiento: number
  calificacionDesempeno: 'bueno' | 'regular' | 'malo'
  valorBrutoTrabajado: number
  porcentajeAmortizacion: number
  montoAmortizacion: number
  montoLiquidoAPagar: number
  saldoContractualRestante: number
  estado: 'aprobada' | 'en_revision' | 'pagada' | 'borrador'
  supervisadoPor?: string
  observaciones?: string
  documentoUrl?: string
}

// 9 Capítulos Oficiales del Libro Azul DGC (Guatemala)
export const CAPITULOS_LIBRO_AZUL_DGC = [
  { id: 1, nombre: 'Capítulo I: Estudios, Mantenimiento y Trabajos Preliminares', icon: Layers },
  { id: 2, nombre: 'Capítulo II: Movimiento de Tierras y Excavación', icon: Layers },
  { id: 3, nombre: 'Capítulo III: Terraplenes Estructurales y Capas de Soporte', icon: Layers },
  { id: 4, nombre: 'Capítulo IV: Subbases y Bases Granulares', icon: Layers },
  { id: 5, nombre: 'Capítulo V: Pavimentos Asfálticos y Concreto', icon: Layers },
  { id: 6, nombre: 'Capítulo VI: Estructuras de Drenaje Pluvial', icon: Layers },
  { id: 7, nombre: 'Capítulo VII: Bóvedas Metálicas y Obras de Arte', icon: Layers },
  { id: 8, nombre: 'Capítulo VIII: Construcciones Complementarias y Señalización', icon: Layers },
  { id: 9, nombre: 'Capítulo IX: Aspectos Ambientales y Gestión de Riesgo', icon: Layers },
]

type SubTabFinanciera = 'resumen' | 'estimaciones' | 'curva'

export function ProyectoInformacionFinanciera({ proyecto }: { proyecto: ProyectoType | undefined }) {
  const router = useRouter()
  const { profile: user } = useAuthStore()

  // Sub-Pestañas: Resumen, Estimaciones, Gráfico Financiero
  const [subTab, setSubTab] = useState<SubTabFinanciera>('resumen')

  // Perspectiva Doble en Control de Estimaciones: Empresa Ejecutora vs Supervisora
  const [perspectivaEstimacion, setPerspectivaEstimacion] = useState<'ejecutora' | 'supervisora'>('ejecutora')
  const [fechaDesdeEstimacion, _setFechaDesdeEstimacion] = useState('')
  const [fechaHastaEstimacion, _setFechaHastaEstimacion] = useState('')
  const [paginaEstimaciones, setPaginaEstimaciones] = useState(1)
  const itemsPorPaginaEstimaciones = 5

  // 2 Filtros en Programa de Trabajo: Por Capítulo y Por Renglón
  const [filtroCapitulo, setFiltroCapitulo] = useState<number | 'todos'>('todos')
  const [filtroRenglon, setFiltroRenglon] = useState<string>('todos')
  const [busquedaTexto, setBusquedaTexto] = useState('')

  // Paginación en Programa de Trabajo (Selector de 10, 20, 50, etc.)
  const [paginaRenglones, setPaginaRenglones] = useState(1)
  const [itemsPorPagina, setItemsPorPagina] = useState(10)

  // Filtros interactivos para el Gráfico Financiero (Curva S)
  const [perspectivaCurva, setPerspectivaCurva] = useState<'ejecutora' | 'supervisora'>('ejecutora')
  const [filtroAnioCurva, setFiltroAnioCurva] = useState<string>('todos')
  const [modalFiltrosCurvaOpen, setModalFiltrosCurvaOpen] = useState(false)
  const [tipoMetricaCurva, setTipoMetricaCurva] = useState<'porcentaje' | 'monto' | 'comparativa'>('porcentaje')
  const [fechaDesdeCurva, setFechaDesdeCurva] = useState('')
  const [fechaHastaCurva, setFechaHastaCurva] = useState('')

  // Tooltip interactivo para Curva S
  const [tooltipCurva, setTooltipCurva] = useState<any>(null)

  const pAny = (proyecto as any) || {}

  // Nombres de las empresas para los tabs de Control de Estimaciones
  const nombreEmpresaEjecutora = pAny.empresaContratista || pAny.empresa_contratista || '-'
  const nombreEmpresaSupervisora = pAny.empresaSupervisora || pAny.empresa_supervisora || '-'

  // Delegado Residente del Proyecto
  const nombreDelegadoProyecto = pAny.delegadoResidente || pAny.delegado_residente || '-'

  // Validación estricta de permisos: Solo el Delegado Residente o Administrador tiene acceso a la Hoja Sábana y generación de estimaciones
  const esAdminOGerente = useMemo(() => {
    const rol = String(user?.rol || '').toLowerCase().trim()
    return rol === 'administrador' || rol === 'admin' || rol === 'gerencia' || rol === 'director'
  }, [user])

  const esDelegadoAsignado = useMemo(() => {
    if (!user) return false
    const uAny = user as any
    const uNombre = (uAny.nombre || `${uAny.primerNombre || uAny.primer_nombre || ''} ${uAny.primerApellido || uAny.primer_apellido || ''}`).toLowerCase().trim()
    const matchNombre = uNombre.length > 2 && nombreDelegadoProyecto.toLowerCase().includes(uNombre)
    const enEquipo = Array.isArray(pAny.equipo) && pAny.equipo.some((m: any) =>
      (m.id === user.id || m.usuarioId === user.id || (m.nombre && m.nombre.toLowerCase().includes(uNombre))) &&
      String(m.rol || '').toLowerCase().includes('delegado')
    )
    const esIdDirecto = pAny.delegadoResidenteId === user.id || pAny.delegado_residente_id === user.id
    return matchNombre || enEquipo || esIdDirecto || String(user.rol || '').toLowerCase().includes('delegado')
  }, [user, nombreDelegadoProyecto, pAny])

  const tieneAccesoHojaSabana = esAdminOGerente || esDelegadoAsignado

  // Manejador de navegación a Hoja Sábana (Planificación o Estimaciones)
  const navegarAHojaSabana = (parametro?: { tab?: string; estimacion?: string; renglon?: string }) => {
    if (!tieneAccesoHojaSabana) {
      showErrorToast(`Acceso restringido: Solo el Delegado Residente asignado (${nombreDelegadoProyecto}) o la Administración pueden acceder a la Hoja Sábana y generación de estimaciones.`)
      return
    }
    const targetId = proyecto?.id || 'p-1'
    const queryParams = new URLSearchParams()
    if (parametro?.tab) queryParams.set('tab', parametro.tab)
    if (parametro?.estimacion) queryParams.set('estimacion', parametro.estimacion)
    if (parametro?.renglon) queryParams.set('renglon', parametro.renglon)

    const queryString = queryParams.toString()
    router.push(`/dashboard/proyectos/${targetId}/hoja-sabana${queryString ? `?${queryString}` : ''}`)
  }

  // Cálculos Financieros Generales con Porcentaje de Anticipo Dinámico por Contrato
  const pctAnticipoEjecucionNum = Number(pAny.contratoEjecucion?.porcentajeAnticipo ?? pAny.porcentajeAnticipo ?? 15)
  const pctAnticipoSupervisionNum = Number(pAny.contratoSupervision?.porcentajeAnticipo ?? pAny.porcentajeAnticipoSupervision ?? pAny.porcentajeAnticipo ?? 10)
  const pctAnticipoEjec = pctAnticipoEjecucionNum / 100

  const montoContractualOriginal = Number(proyecto?.montoContractualOriginal || proyecto?.presupuesto || pAny.monto_original || 0)
  const montoSupervisionOriginal = Number(pAny.contratoSupervision?.montoOriginal || pAny.supervisoraMontoOriginal || pAny.monto_supervision || 0)
  const montoAjustadoVigente = Number(proyecto?.montoFinancieroFinalEjecutado || pAny.monto_final || montoContractualOriginal || 0)
  const montoBaseCurva = perspectivaCurva === 'ejecutora' ? montoAjustadoVigente : montoSupervisionOriginal
  const anticipoOtorgado = montoContractualOriginal * pctAnticipoEjec

  // Soporte de Modalidad Manual de Presupuesto y Estimaciones por Empresa/Perspectiva
  const esEjecutoraDomun = nombreEmpresaEjecutora.toLowerCase().includes('domun')
  const esSupervisoraDomun = nombreEmpresaSupervisora.toLowerCase().includes('domun')

  // Determinar si cada empresa tiene su propia Hoja Sábana o Modo Manual
  const modoObraActual = pAny.modoObra || pAny.modo_obra || (esEjecutoraDomun && pAny.usarModoSabana !== false ? 'sabana' : 'manual')
  const modoSupervisionActual = pAny.modoSupervision || pAny.modo_supervision || (esSupervisoraDomun && pAny.usarModoSabana !== false ? 'sabana' : 'manual')

  const tieneSabanaEjecutora = Boolean(modoObraActual === 'sabana')
  const tieneSabanaSupervisora = Boolean(modoSupervisionActual === 'sabana')

  const esModoSabanaActual = perspectivaEstimacion === 'ejecutora' ? tieneSabanaEjecutora : tieneSabanaSupervisora

  const modoManual = !esModoSabanaActual

  // Capítulos Libro Azul DGC + Capítulos personalizados creados en este proyecto
  const [capitulosProyecto, setCapitulosProyecto] = useState<Array<{ id: number; nombre: string }>>(() => {
    return CAPITULOS_LIBRO_AZUL_DGC.map((c) => ({ id: c.id, nombre: c.nombre }))
  })

  // Lista de renglones interna con sincronización y conteo en Bitácora
  const [listaRenglones, setListaRenglones] = useState<RenglonItemFinanciero[]>([])
  const [filtroEstadoBitacora] = useState<'todos' | 'en_bitacora' | 'ocultos'>('todos')
  const [conteoBitacoraPorRenglon, setConteoBitacoraPorRenglon] = useState<Record<string, number>>({})

  // Modales y Drawers para Gestión Renglón, Nuevo/Editar Renglón y Nuevo Capítulo
  const [modalGestionRenglonesOpen, setModalGestionRenglonesOpen] = useState(false)
  const [subTabGestion, setSubTabGestion] = useState<'renglones' | 'capitulos'>('renglones')

  const [drawerRenglonOpen, setDrawerRenglonOpen] = useState(false)
  const [renglonEnEdicion, setRenglonEnEdicion] = useState<RenglonItemFinanciero | null>(null)
  const [formRenglonCodigo, setFormRenglonCodigo] = useState('')
  const [formRenglonDescripcion, setFormRenglonDescripcion] = useState('')
  const [formRenglonCapituloId, setFormRenglonCapituloId] = useState<number>(1)
  const [formRenglonUnidad, setFormRenglonUnidad] = useState('m³')
  const [formRenglonCantidad, setFormRenglonCantidad] = useState('1')
  const [formRenglonPrecioUnitario, setFormRenglonPrecioUnitario] = useState('0')
  const [formRenglonEnBitacora, setFormRenglonEnBitacora] = useState(true)

  const [modalCapituloOpen, setModalCapituloOpen] = useState(false)
  const [formCapituloNumero, setFormCapituloNumero] = useState('')
  const [formCapituloNombre, setFormCapituloNombre] = useState('')

  const [estimacionesManuales, setEstimacionesManuales] = useState<EstimacionFinancieraItem[]>([])
  const [modalEstimacionManualOpen, setModalEstimacionManualOpen] = useState(false)
  const [estimacionEnEdicion, setEstimacionEnEdicion] = useState<EstimacionFinancieraItem | null>(null)
  const [estimacionParaEliminar, setEstimacionParaEliminar] = useState<EstimacionFinancieraItem | null>(null)
  const [drawerEstimacionVer, setDrawerEstimacionVer] = useState<EstimacionFinancieraItem | null>(null)
  

  // Formulario modal de estimación manual
  const [formEstNumero, setFormEstNumero] = useState('')
  const [formEstNombre, setFormEstNombre] = useState('')
  const [formEstPerspectiva, setFormEstPerspectiva] = useState<'ejecutora' | 'supervisora'>('ejecutora')
  const [formEstFechaInicio, setFormEstFechaInicio] = useState('')
  const [formEstFechaFin, setFormEstFechaFin] = useState('')
  const [formEstMes, setFormEstMes] = useState('')
  const [formEstValorBruto, setFormEstValorBruto] = useState('')
  const [formEstPctAmortizacion, setFormEstPctAmortizacion] = useState('20')
  const [formEstMontoLiquido, setFormEstMontoLiquido] = useState('')
  const [formEstSaldoRestante, setFormEstSaldoRestante] = useState('')
  const [formEstEstado, setFormEstEstado] = useState<'aprobada' | 'en_revision' | 'pagada' | 'borrador'>('borrador')
  const [formEstObservaciones, setFormEstObservaciones] = useState('')
  const [formEstDiasRetraso, setFormEstDiasRetraso] = useState('0')
  const [formEstRendimiento, setFormEstRendimiento] = useState('100')

  useEffect(() => {
    if (!proyecto?.id) return
    try {
      const sabanaStored = localStorage.getItem(`domun_estimaciones_sabana_${proyecto.id}`)
      const manualStored = localStorage.getItem(`domun_estimaciones_manuales_${proyecto.id}`)
      const activaStored = localStorage.getItem(`domun_estimacion_activa_${proyecto.id}`)

      const mapa = new Map<string, EstimacionFinancieraItem>()

      // Determinar la perspectiva natural de la Hoja Sábana:
      // Si DOMUN es Supervisora, la Sábana es de Supervisora; de lo contrario de Ejecutora
      const perspectivaSabanaPredeterminada: 'ejecutora' | 'supervisora' =
        (esSupervisoraDomun && !esEjecutoraDomun) || pAny.ambitoPlanTrabajo === 'supervision' ? 'supervisora' : 'ejecutora'

      const resolverPerspectiva = (objPersp?: string): 'ejecutora' | 'supervisora' => {
        if (objPersp === 'supervisora' || objPersp === 'ejecutora') {
          if (objPersp === 'ejecutora' && esSupervisoraDomun && !esEjecutoraDomun && pAny.modoObra !== 'sabana') {
            return 'supervisora'
          }
          return objPersp
        }
        return perspectivaSabanaPredeterminada
      }

      // 1. Cargar estimaciones de sábana
      if (sabanaStored) {
        try {
          const parsedSab = JSON.parse(sabanaStored)
          if (Array.isArray(parsedSab)) {
            parsedSab.forEach((s: any) => {
              const num = s.numero || 'Est. 01'
              const bruto = Number(s.valorBruto || s.montoEstimacion || s.valorBrutoTrabajado || 0)
              const pctAmort = Number(s.porcentajeAmortizacion ?? 20)
              const amort = Number(s.montoAmortizacion ?? ((bruto * pctAmort) / 100))
              const liq = Number(s.montoLiquido || s.montoLiquidoAPagar || (bruto - amort))
              const perspFinal = resolverPerspectiva(s.perspectiva)
              mapa.set(num, {
                id: s.id || `est-sab-${num}`,
                numero: num,
                nombreEstimacion: s.nombreEstimacion || `Estimación de Obra - ${num}`,
                delegadoResidente: s.delegadoResidente || (nombreDelegadoProyecto !== '-' ? nombreDelegadoProyecto : 'Delegado Residente'),
                perspectiva: perspFinal,
                fechaInicio: s.fechaInicio || '',
                fechaFin: s.fechaFin || s.fechaCorte || '',
                mes: s.mes || 'Periodo Obra',
                diasRetraso: Number(s.diasRetraso || 0),
                porcentajeRendimiento: Number(s.porcentajeRendimiento || s.rendimiento || 100),
                calificacionDesempeno: (s.calificacionDesempeno as any) || 'bueno',
                valorBrutoTrabajado: bruto,
                porcentajeAmortizacion: pctAmort,
                montoAmortizacion: amort,
                montoLiquidoAPagar: liq,
                saldoContractualRestante: Number(s.saldoContractualRestante || s.saldoRestante || 0),
                estado: s.estado === 'cerrada' ? 'aprobada' : (s.estado || 'en_revision'),
                supervisadoPor: s.supervisadoPor || (perspFinal === 'supervisora' ? nombreEmpresaSupervisora : nombreEmpresaEjecutora),
                observaciones: s.notas || s.observaciones || 'Generada desde Hoja Sábana Analítica',
              })
            })
          }
        } catch {}
      }

      // 2. Cargar estimaciones de proyecto (prioridad si vienen de API)
      if (Array.isArray(pAny.estimaciones) && pAny.estimaciones.length > 0) {
        pAny.estimaciones.forEach((e: any) => {
          const num = e.numero || `Est. ${String(e.numeroEstimacion || 1).padStart(2, '0')}`
          const bruto = Number(e.valorBrutoTrabajado || e.montoEstimacion || 0)
          const pctAmort = Number(e.porcentajeAmortizacion ?? 20)
          const amort = Number(e.montoAmortizacion ?? ((bruto * pctAmort) / 100))
          const liq = Number(e.montoLiquidoAPagar ?? e.montoNetoPagar ?? (bruto - amort))
          const perspFinal = resolverPerspectiva(e.perspectiva)
          mapa.set(num, {
            id: e.id || `est-${num}`,
            numero: num,
            nombreEstimacion: e.nombreEstimacion || `Estimación - ${num}`,
            delegadoResidente: e.delegadoResidente || (nombreDelegadoProyecto !== '-' ? nombreDelegadoProyecto : 'Delegado Residente'),
            perspectiva: perspFinal,
            fechaInicio: e.fechaInicio || '',
            fechaFin: e.fechaFin || e.fechaCorte || '',
            mes: e.mes || 'Periodo',
            diasRetraso: Number(e.diasRetraso || 0),
            porcentajeRendimiento: Number(e.porcentajeRendimiento || 100),
            calificacionDesempeno: (e.calificacionDesempeno as any) || 'bueno',
            valorBrutoTrabajado: bruto,
            porcentajeAmortizacion: pctAmort,
            montoAmortizacion: amort,
            montoLiquidoAPagar: liq,
            saldoContractualRestante: Number(e.saldoContractualRestante || 0),
            estado: e.estado || 'aprobada',
            supervisadoPor: e.supervisadoPor || (perspFinal === 'supervisora' ? nombreEmpresaSupervisora : nombreEmpresaEjecutora),
            observaciones: e.observaciones || '',
          })
        })
        try {
          localStorage.setItem(`domun_estimaciones_sabana_${proyecto.id}`, JSON.stringify(Array.from(mapa.values())))
        } catch {}
      }

      // 3. Cargar estimaciones de proyecto o manuales
      const candidatas = [
        ...(Array.isArray(pAny.estimaciones) ? pAny.estimaciones : []),
        ...(Array.isArray(pAny.estimacionesManuales) ? pAny.estimacionesManuales : []),
      ]
      if (manualStored) {
        try {
          const parsed = JSON.parse(manualStored)
          if (Array.isArray(parsed)) candidatas.push(...parsed)
        } catch {}
      }

      candidatas.forEach((c: any) => {
        const num = c.numero || 'Est. 01'
        if (!mapa.has(num)) {
          const bruto = Number(c.valorBruto || c.valorBrutoTrabajado || c.montoEstimacion || 0)
          const pctAmort = Number(c.porcentajeAmortizacion ?? 20)
          const amort = Number(c.montoAmortizacion ?? ((bruto * pctAmort) / 100))
          const liq = Number(c.montoLiquido || c.montoLiquidoAPagar || (bruto - amort))
          const perspFinal = resolverPerspectiva(c.perspectiva)
          mapa.set(num, {
            id: c.id || `est-${num}`,
            numero: num,
            nombreEstimacion: c.nombreEstimacion || `Estimación - ${num}`,
            delegadoResidente: c.delegadoResidente || (nombreDelegadoProyecto !== '-' ? nombreDelegadoProyecto : 'Delegado Residente'),
            perspectiva: perspFinal,
            fechaInicio: c.fechaInicio || '',
            fechaFin: c.fechaFin || c.fechaCorte || '',
            mes: c.mes || 'Periodo',
            diasRetraso: Number(c.diasRetraso || 0),
            porcentajeRendimiento: Number(c.porcentajeRendimiento || c.rendimiento || 100),
            calificacionDesempeno: (c.calificacionDesempeno as any) || 'bueno',
            valorBrutoTrabajado: bruto,
            porcentajeAmortizacion: pctAmort,
            montoAmortizacion: amort,
            montoLiquidoAPagar: liq,
            saldoContractualRestante: Number(c.saldoContractualRestante || c.saldoRestante || 0),
            estado: c.estado || 'borrador',
            supervisadoPor: c.supervisadoPor || (perspFinal === 'supervisora' ? nombreEmpresaSupervisora : nombreEmpresaEjecutora),
            observaciones: c.observaciones || '',
          })
        }
      })

      // 3. Estimación activa actualmente abierta en Hoja Sábana
      if (activaStored) {
        try {
          const act = JSON.parse(activaStored)
          if (act && act.numero) {
            const existing = mapa.get(act.numero)
            const estaCerrada = existing && (existing.estado === 'aprobada' || existing.estado === 'pagada')
            if (!estaCerrada) {
              const bruto = Number(act.valorBruto || act.valorBrutoTrabajado || act.montoEstimacion || 0)
              const pctAmort = Number(act.porcentajeAmortizacion ?? 20)
              const amort = Number(act.montoAmortizacion ?? ((bruto * pctAmort) / 100))
              const liq = Number(act.montoLiquido || act.montoLiquidoAPagar || (bruto - amort))
              const perspFinal = resolverPerspectiva(act.perspectiva)
              mapa.set(act.numero, {
                id: act.id || `est-activa-${act.numero}`,
                numero: act.numero,
                nombreEstimacion: act.nombreEstimacion || `Estimación de Obra - ${act.numero} (En Progreso)`,
                delegadoResidente: (nombreDelegadoProyecto !== '-' ? nombreDelegadoProyecto : 'Delegado Residente'),
                perspectiva: perspFinal,
                fechaInicio: act.fechaInicio || '',
                fechaFin: act.fechaCorte || '',
                mes: act.mes || 'Periodo Actual',
                diasRetraso: 0,
                porcentajeRendimiento: 100,
                calificacionDesempeno: 'bueno',
                valorBrutoTrabajado: bruto,
                porcentajeAmortizacion: pctAmort,
                montoAmortizacion: amort,
                montoLiquidoAPagar: liq,
                saldoContractualRestante: 0,
                estado: 'en_revision',
                supervisadoPor: perspFinal === 'supervisora' ? nombreEmpresaSupervisora : nombreEmpresaEjecutora,
                observaciones: act.notas || 'Estimación en progreso en Hoja Sábana',
              })
            }
          }
        } catch {}
      }

      const lista = Array.from(mapa.values()).filter(
        (item: any) => !item.id?.startsWith('est-ejec-1-') && !item.id?.startsWith('est-sup-1-')
      )
      setEstimacionesManuales(lista)
    } catch (e) {
      console.warn('Error cargando estimaciones:', e)
    }
  }, [proyecto?.id, pAny.estimacionesManuales, pAny.estimaciones])

  // Carga inicial y reactiva de los renglones del proyecto (con persistencia en localStorage y API)
  useEffect(() => {
    if (!proyecto?.id) return
    let localRenglones: any[] | null = null
    try {
      const stored = localStorage.getItem(`domun_proyecto_renglones_${proyecto.id}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          localRenglones = parsed
        }
      }
    } catch (_) {}

    const rawR = localRenglones || (proyecto as any)?.renglones || (proyecto as any)?.planTrabajo || (proyecto as any)?.renglones_sabana || []
    if (Array.isArray(rawR) && rawR.length > 0) {
      const mapeados: RenglonItemFinanciero[] = rawR.map((r: any, idx: number) => ({
        id: String(r.id || r.codigoDGC || r.codigo || `r-${idx}`),
        renglonId: r.renglonId || (typeof r.id === 'string' && r.id.length === 36 ? r.id : undefined),
        capituloId: Number(r.capituloId || r.capitulo || 1),
        capituloNombre: r.capituloNombre || `Capítulo ${r.capituloId || r.capitulo || 1}`,
        codigoDGC: String(r.codigoDGC || r.codigo || `10${idx + 1}.01`),
        descripcion: r.descripcion || '',
        unidad: r.unidad || r.unidad_medida || 'm³',
        cantidadContratada: Number(r.cantidadContratada ?? r.cantidad_contractual ?? r.cantidad ?? 0),
        cantidadAjustada: Number(r.cantidadAjustada ?? r.cantidad_ajustada ?? r.cantidadContratada ?? 0),
        costoUnitarioDirecto: Number(r.costoUnitarioDirecto ?? r.precio_unitario_directo ?? r.precioUnitario ?? 0),
        cantidadEstePeriodo: Number(r.cantidadEstePeriodo || 0),
        cantidadAcumuladaAnterior: Number(r.cantidadAcumuladaAnterior || 0),
        seleccionado: r.seleccionado !== false,
        esPersonalizado: Boolean(r.esPersonalizado),
      }))
      setListaRenglones(mapeados)
    } else {
      setListaRenglones([])
    }

    try {
      const storedCaps = localStorage.getItem(`domun_proyecto_capitulos_${proyecto.id}`)
      if (storedCaps) {
        const parsedCaps = JSON.parse(storedCaps)
        if (Array.isArray(parsedCaps) && parsedCaps.length > 0) {
          setCapitulosProyecto(parsedCaps)
        }
      }
    } catch (_) {}
  }, [proyecto?.id, (proyecto as any)?.renglones, (proyecto as any)?.planTrabajo])

  // Conteo de registros en bitácora por renglón
  useEffect(() => {
    if (!proyecto?.id) return
    let cancelado = false

    async function cargarConteoBitacoras() {
      const conteos: Record<string, number> = {}

      try {
        const resPend = await apiGetDeduplicado(`/mantenimiento/bitacora_pendiente?proyecto_id=${proyecto?.id}&limite=500`).catch(() => null)
        const items = Array.isArray(resPend?.data?.data) ? resPend.data.data : []
        items.forEach((item: any) => {
          if (item.renglon_id) conteos[item.renglon_id] = (conteos[item.renglon_id] || 0) + 1
          if (item.codigoDGC) conteos[item.codigoDGC] = (conteos[item.codigoDGC] || 0) + 1
          if (item.codigo) conteos[item.codigo] = (conteos[item.codigo] || 0) + 1
        })
      } catch (_) {}

      try {
        const resEnt = await apiGetDeduplicado(`/mantenimiento/bitacora_entrada?proyecto_id=${proyecto?.id}&limite=500`).catch(() => null)
        const items = Array.isArray(resEnt?.data?.data) ? resEnt.data.data : []
        items.forEach((item: any) => {
          if (item.renglon_id) conteos[item.renglon_id] = (conteos[item.renglon_id] || 0) + 1
          const desc = String(item.descripcion || '')
          const match = desc.match(/Renglón\s*([0-9]+(?:\.[0-9]+)?(?:\([a-z]\))?)/i)
          if (match && match[1]) {
            conteos[match[1]] = (conteos[match[1]] || 0) + 1
          }
        })
      } catch (_) {}

      try {
        const locales = JSON.parse(localStorage.getItem('domun_bitacora_locales') || '[]')
        if (Array.isArray(locales)) {
          locales.filter((l: any) => l.proyectoId === proyecto?.id).forEach((l: any) => {
            const rId = l.renglonId || l.renglon_id || l.renglon?.id || l.renglon?.codigo || l.renglon?.codigoDGC
            if (rId) conteos[rId] = (conteos[rId] || 0) + 1
          })
        }
      } catch (_) {}

      if (!cancelado) {
        setConteoBitacoraPorRenglon(conteos)
      }
    }

    cargarConteoBitacoras()
    return () => {
      cancelado = true
    }
  }, [proyecto?.id])

  const guardarListaRenglones = async (nuevaLista: RenglonItemFinanciero[]) => {
    setListaRenglones(nuevaLista)
    if (!proyecto?.id) return
    try {
      localStorage.setItem(`domun_proyecto_renglones_${proyecto.id}`, JSON.stringify(nuevaLista))
      localStorage.setItem(`domun_renglones_seleccionados_${proyecto.id}`, JSON.stringify(nuevaLista.filter((r) => r.seleccionado)))
      await (proyectoService.actualizarProyecto as any)(proyecto.id, {
        renglones: nuevaLista,
        planTrabajo: nuevaLista,
        renglones_seleccionados: nuevaLista.filter((r) => r.seleccionado),
      })
    } catch (e) {
      console.warn('Error sincronizando renglones:', e)
    }
  }

  const handleToggleBitacora = async (codigoDGC: string) => {
    const base = listaRenglones.length > 0 ? listaRenglones : listaRenglonesFuente
    const target = base.find((r) => r.codigoDGC === codigoDGC)
    const nuevoEstado = !target?.seleccionado
    const nuevaLista = base.map((r) =>
      r.codigoDGC === codigoDGC ? { ...r, seleccionado: nuevoEstado } : r
    )
    await guardarListaRenglones(nuevaLista)
    if (nuevoEstado) {
      showSuccessToast(`Renglón ${codigoDGC} habilitado para Bitácora`)
    } else {
      showSuccessToast(`Renglón ${codigoDGC} ocultado de Bitácora`)
    }
  }

  const handleSeleccionarTodosBitacora = async (valor: boolean) => {
    const base = listaRenglones.length > 0 ? listaRenglones : listaRenglonesFuente
    const nuevaLista = base.map((r) => ({ ...r, seleccionado: valor }))
    await guardarListaRenglones(nuevaLista)
    showSuccessToast(valor ? 'Todos los renglones habilitados para Bitácora' : 'Todos los renglones ocultados de Bitácora')
  }

  const handleAbrirCrearRenglon = () => {
    setRenglonEnEdicion(null)
    setFormRenglonCodigo('')
    setFormRenglonDescripcion('')
    setFormRenglonCapituloId(1)
    setFormRenglonUnidad('m³')
    setFormRenglonCantidad('1')
    setFormRenglonPrecioUnitario('0.00')
    setFormRenglonEnBitacora(true)
    setDrawerRenglonOpen(true)
  }

  const handleAbrirEditarRenglon = (r: RenglonItemFinanciero) => {
    setRenglonEnEdicion(r)
    setFormRenglonCodigo(r.codigoDGC)
    setFormRenglonDescripcion(r.descripcion)
    setFormRenglonCapituloId(r.capituloId)
    setFormRenglonUnidad(r.unidad)
    setFormRenglonCantidad(String(r.cantidadContratada))
    setFormRenglonPrecioUnitario(String(r.costoUnitarioDirecto))
    setFormRenglonEnBitacora(r.seleccionado !== false)
    setDrawerRenglonOpen(true)
  }

  const handleGuardarRenglonFormulario = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formRenglonCodigo.trim()) {
      showErrorToast('Ingresa el código DGC del renglón')
      return
    }
    if (!formRenglonDescripcion.trim()) {
      showErrorToast('Ingresa la descripción del renglón')
      return
    }

    const codNormalizado = formRenglonCodigo.trim()
    const cantNum = renglonEnEdicion?.cantidadContratada ?? (modoManual ? 1 : (parseFloat(formRenglonCantidad) || 1))
    const precioNum = renglonEnEdicion?.costoUnitarioDirecto ?? (modoManual ? 0 : (parseFloat(formRenglonPrecioUnitario) || 0))
    const enBitacora = modoManual ? true : formRenglonEnBitacora
    const capObj = capitulosProyecto.find((c) => c.id === formRenglonCapituloId)
    const capNom = capObj ? capObj.nombre : `Capítulo ${formRenglonCapituloId}`
    const base = listaRenglones.length > 0 ? listaRenglones : listaRenglonesFuente

    if (renglonEnEdicion) {
      const nuevaLista = base.map((item) => {
        if (item.codigoDGC === renglonEnEdicion.codigoDGC || item.id === renglonEnEdicion.id) {
          return {
            ...item,
            codigoDGC: codNormalizado,
            descripcion: formRenglonDescripcion.trim(),
            capituloId: formRenglonCapituloId,
            capituloNombre: capNom,
            unidad: formRenglonUnidad.trim() || 'm³',
            cantidadContratada: cantNum,
            cantidadAjustada: cantNum,
            costoUnitarioDirecto: precioNum,
            seleccionado: enBitacora,
          }
        }
        return item
      })
      await guardarListaRenglones(nuevaLista)
      showSuccessToast(`Renglón ${codNormalizado} actualizado correctamente`)
    } else {
      const existe = base.some((r) => r.codigoDGC.toLowerCase() === codNormalizado.toLowerCase())
      if (existe) {
        showErrorToast(`El código "${codNormalizado}" ya existe en este proyecto`)
        return
      }

      const nuevo: RenglonItemFinanciero = {
        id: `renglon-${Date.now()}`,
        codigoDGC: codNormalizado,
        descripcion: formRenglonDescripcion.trim(),
        capituloId: formRenglonCapituloId,
        capituloNombre: capNom,
        unidad: formRenglonUnidad.trim() || 'm³',
        cantidadContratada: cantNum,
        cantidadAjustada: cantNum,
        costoUnitarioDirecto: precioNum,
        seleccionado: enBitacora,
        esPersonalizado: true,
      }

      const nuevaLista = [nuevo, ...base]
      await guardarListaRenglones(nuevaLista)
      showSuccessToast(`Renglón ${codNormalizado} creado exitosamente`)
    }

    setDrawerRenglonOpen(false)
  }

  const handleEliminarRenglonPersonalizado = async (codigoDGC: string) => {
    const base = listaRenglones.length > 0 ? listaRenglones : listaRenglonesFuente
    const nuevaLista = base.filter((r) => r.codigoDGC !== codigoDGC)
    await guardarListaRenglones(nuevaLista)
    showSuccessToast(`Renglón ${codigoDGC} eliminado del proyecto`)
  }

  const handleGuardarCapitulo = (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseInt(formCapituloNumero.trim(), 10)
    if (isNaN(num) || num <= 0) {
      showErrorToast('Ingresa un número de capítulo válido (mayor a 0)')
      return
    }
    if (!formCapituloNombre.trim()) {
      showErrorToast('Ingresa el nombre del capítulo')
      return
    }

    if (capitulosProyecto.some((c) => c.id === num)) {
      showErrorToast(`El Capítulo ${num} ya existe`)
      return
    }

    const nuevoCap = {
      id: num,
      nombre: `Capítulo ${num}: ${formCapituloNombre.trim()}`,
    }

    const nuevaListaCaps = [...capitulosProyecto, nuevoCap].sort((a, b) => a.id - b.id)
    setCapitulosProyecto(nuevaListaCaps)
    if (proyecto?.id) {
      try {
        localStorage.setItem(`domun_proyecto_capitulos_${proyecto.id}`, JSON.stringify(nuevaListaCaps))
      } catch (_) {}
    }
    showSuccessToast(`Capítulo ${num} agregado exitosamente`)
    setModalCapituloOpen(false)
    setFormCapituloNumero('')
    setFormCapituloNombre('')
  }

  // Estimaciones Finales (Cargadas de la base de datos o registradas por el usuario; no genera datos falsos por defecto)
  const estimacionesGeneradas = useMemo<EstimacionFinancieraItem[]>(() => {
    if (estimacionesManuales.length > 0) {
      return estimacionesManuales
    }
    if (Array.isArray(pAny.estimaciones) && pAny.estimaciones.length > 0) {
      return pAny.estimaciones
    }
    return []
  }, [estimacionesManuales, pAny.estimaciones])

  // Métricas financieras reactivas basadas en las estimaciones
  const totalValorBrutoAprobado = useMemo(() => {
    return estimacionesGeneradas
      .filter((e) => e.perspectiva === 'ejecutora' && (e.estado === 'aprobada' || e.estado === 'pagada'))
      .reduce((acc, curr) => acc + (Number(curr.valorBrutoTrabajado) || 0), 0)
  }, [estimacionesGeneradas])

  const totalAmortizadoAnticipo = useMemo(() => {
    return estimacionesGeneradas
      .filter((e) => e.perspectiva === 'ejecutora' && (e.estado === 'aprobada' || e.estado === 'pagada'))
      .reduce((acc, curr) => acc + (Number(curr.montoAmortizacion) || 0), 0)
  }, [estimacionesGeneradas])

  const totalLiquidoAPagar = useMemo(() => {
    return estimacionesGeneradas
      .filter((e) => e.perspectiva === 'ejecutora' && (e.estado === 'aprobada' || e.estado === 'pagada'))
      .reduce((acc, curr) => acc + (Number(curr.montoLiquidoAPagar) || 0), 0)
  }, [estimacionesGeneradas])

  const pctAmortizadoAnticipo = useMemo(() => {
    if (anticipoOtorgado <= 0) return 0
    return Math.min(100, Math.max(0, (totalAmortizadoAnticipo / anticipoOtorgado) * 100))
  }, [totalAmortizadoAnticipo, anticipoOtorgado])

  const saldoAnticipoPendiente = useMemo(() => {
    return Math.max(0, anticipoOtorgado - totalAmortizadoAnticipo)
  }, [anticipoOtorgado, totalAmortizadoAnticipo])

  const saldoContractualVigente = useMemo(() => {
    return Math.max(0, montoAjustadoVigente - totalValorBrutoAprobado)
  }, [montoAjustadoVigente, totalValorBrutoAprobado])

  // Control de Plazo dinámico
  const plazoDiasCalculados = useMemo(() => {
    const fFinRaw = proyecto?.fechaFinalizacionReal || (proyecto as any)?.fechaFinContractualPlan || proyecto?.fechaFin || (proyecto as any)?.fecha_fin
    const fIniRaw = proyecto?.fechaInicioContractual || proyecto?.fechaInicio || (proyecto as any)?.fecha_inicio
    const dFin = fFinRaw ? new Date(fFinRaw) : null
    const dIni = fIniRaw ? new Date(fIniRaw) : null
    const hoy = new Date()

    let totalDias = pAny.plazoMeses ? Number(pAny.plazoMeses) * 30 : (pAny.plazoContractual ? Number(pAny.plazoContractual) : 365)
    if (dIni && dFin && !isNaN(dIni.getTime()) && !isNaN(dFin.getTime())) {
      totalDias = Math.max(1, Math.ceil((dFin.getTime() - dIni.getTime()) / (1000 * 60 * 60 * 24)))
    }

    let diasRestantes = totalDias
    if (dFin && !isNaN(dFin.getTime())) {
      diasRestantes = Math.max(0, Math.ceil((dFin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)))
    }

    return { totalDias, diasRestantes }
  }, [proyecto, pAny.plazoMeses])

  const calcularSiguienteNumeroEstimacion = (perspectiva: 'ejecutora' | 'supervisora') => {
    const todas: any[] = [...estimacionesGeneradas]
    if (proyecto?.id) {
      try {
        const sabanaStored = localStorage.getItem(`domun_estimaciones_sabana_${proyecto.id}`)
        if (sabanaStored) {
          const parsed = JSON.parse(sabanaStored)
          if (Array.isArray(parsed)) todas.push(...parsed)
        }
      } catch {}
    }
    const filtradas = todas.filter((e) => (e.perspectiva || 'ejecutora') === perspectiva)
    let maxNum = 0
    filtradas.forEach((e) => {
      const match = (e.numero || '').match(/\d+/)
      if (match) {
        const n = parseInt(match[0], 10)
        if (!isNaN(n) && n > maxNum) maxNum = n
      }
    })
    const prox = Math.max(filtradas.length + 1, maxNum + 1)
    return prox < 10 ? `Est. 0${prox}` : `Est. ${prox}`
  }

  const handleAbrirCrearEstimacionManual = () => {
    setEstimacionEnEdicion(null)
    const numStr = calcularSiguienteNumeroEstimacion(perspectivaEstimacion)
    const numDigitos = numStr.replace(/\D/g, '')
    const hoyStr = new Date().toISOString().split('T')[0]
    const mesStr = new Date().toLocaleDateString('es-GT', { month: 'long', year: 'numeric' })
    const pctAmort = perspectivaEstimacion === 'ejecutora' ? pctAnticipoEjecucionNum : pctAnticipoSupervisionNum

    setFormEstNumero(numStr)
    setFormEstNombre(`Estimación No. ${numDigitos || '01'}`)
    setFormEstPerspectiva(perspectivaEstimacion)
    setFormEstFechaInicio(hoyStr)
    setFormEstFechaFin(hoyStr)
    setFormEstMes(mesStr)
    setFormEstValorBruto('0.00')
    setFormEstPctAmortizacion(pctAmort.toString())
    setFormEstMontoLiquido('0.00')
    setFormEstSaldoRestante(saldoContractualVigente.toFixed(2))
    setFormEstEstado('borrador') // Por defecto en borrador para permitir su posterior edición o borrado
    setFormEstObservaciones('Monto registrado y verificado en campo.')
    setFormEstDiasRetraso('0')
    setFormEstRendimiento('100')
    setModalEstimacionManualOpen(true)
  }

  const handleAbrirEditarEstimacionManual = (est: EstimacionFinancieraItem) => {
    setEstimacionEnEdicion(est)
    setFormEstNumero(est.numero)
    setFormEstNombre(est.nombreEstimacion)
    setFormEstPerspectiva(est.perspectiva)
    setFormEstFechaInicio(est.fechaInicio)
    setFormEstFechaFin(est.fechaFin)
    setFormEstMes(est.mes)
    setFormEstValorBruto(est.valorBrutoTrabajado.toString())
    setFormEstPctAmortizacion(est.porcentajeAmortizacion.toString())
    setFormEstMontoLiquido(est.montoLiquidoAPagar.toString())
    setFormEstSaldoRestante(est.saldoContractualRestante.toString())
    setFormEstEstado(est.estado)
    setFormEstObservaciones(est.observaciones || '')
    setFormEstDiasRetraso(est.diasRetraso.toString())
    setFormEstRendimiento(est.porcentajeRendimiento.toString())
    setModalEstimacionManualOpen(true)
  }

  const handleGuardarEstimacionManual = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formEstNumero.trim()) {
      showErrorToast('El número de estimación es obligatorio (ej. Est. 01)')
      return
    }
    const bruto = parseFloat(formEstValorBruto) || 0
    const pctAmort = parseFloat(formEstPctAmortizacion) || 0
    const amort = (bruto * pctAmort) / 100
    const liq = parseFloat(formEstMontoLiquido) || (bruto - amort)
    const saldo = parseFloat(formEstSaldoRestante) || Math.max(0, montoAjustadoVigente - bruto)

    const nueva: EstimacionFinancieraItem = {
      id: estimacionEnEdicion?.id || `est-${formEstPerspectiva}-${Date.now()}`,
      numero: formEstNumero.trim(),
      nombreEstimacion: formEstNombre.trim() || `Estimación ${formEstNumero}`,
      delegadoResidente: nombreDelegadoProyecto !== '-' ? nombreDelegadoProyecto : 'Delegado Asignado',
      perspectiva: formEstPerspectiva,
      fechaInicio: formEstFechaInicio || new Date().toISOString().split('T')[0],
      fechaFin: formEstFechaFin || new Date().toISOString().split('T')[0],
      mes: formEstMes || new Date().toLocaleDateString('es-GT', { month: 'long', year: 'numeric' }),
      diasRetraso: parseInt(formEstDiasRetraso) || 0,
      porcentajeRendimiento: parseFloat(formEstRendimiento) || 100,
      calificacionDesempeno: (parseFloat(formEstRendimiento) || 100) >= 90 ? 'bueno' : (parseFloat(formEstRendimiento) || 100) >= 70 ? 'regular' : 'malo',
      valorBrutoTrabajado: bruto,
      porcentajeAmortizacion: pctAmort,
      montoAmortizacion: amort,
      montoLiquidoAPagar: liq,
      saldoContractualRestante: saldo,
      estado: formEstEstado,
      supervisadoPor: formEstPerspectiva === 'ejecutora' ? nombreEmpresaEjecutora : nombreEmpresaSupervisora,
      observaciones: formEstObservaciones || 'Monto registrado por el usuario.',
    }

    const baseLista = estimacionesGeneradas
    let actualizadas: EstimacionFinancieraItem[] = []
    if (estimacionEnEdicion) {
      actualizadas = baseLista.map((item) => (item.id === estimacionEnEdicion.id ? nueva : item))
    } else {
      actualizadas = [...baseLista, nueva]
    }

    setEstimacionesManuales(actualizadas)
    if (proyecto?.id) {
      localStorage.setItem(`domun_estimaciones_manuales_${proyecto.id}`, JSON.stringify(actualizadas))
    }
    showSuccessToast(`Estimación ${nueva.numero} guardada exitosamente`)
    setModalEstimacionManualOpen(false)
    setEstimacionEnEdicion(null)
  }

  const handleEliminarEstimacionManual = (id: string) => {
    const target = estimacionesGeneradas.find((item) => item.id === id)
    if (target && target.estado !== 'borrador') {
      showErrorToast('Solo las estimaciones en estado Borrador pueden eliminarse.')
      return
    }
    const filtradas = estimacionesGeneradas.filter((item) => item.id !== id)
    setEstimacionesManuales(filtradas)
    if (proyecto?.id) {
      localStorage.setItem(`domun_estimaciones_manuales_${proyecto.id}`, JSON.stringify(filtradas))
    }
    showSuccessToast(`Estimación ${target?.numero || ''} eliminada exitosamente`)
    if (modalEstimacionManualOpen) {
      setModalEstimacionManualOpen(false)
      setEstimacionEnEdicion(null)
    }
  }

  const estimacionesFiltradas = useMemo(() => {
    return estimacionesGeneradas.filter((e) => {
      const p = e.perspectiva || 'ejecutora'
      if (p !== perspectivaEstimacion) return false
      if (fechaDesdeEstimacion && e.fechaInicio && e.fechaInicio < fechaDesdeEstimacion) return false
      if (fechaHastaEstimacion && e.fechaFin && e.fechaFin > fechaHastaEstimacion) return false
      return true
    })
  }, [estimacionesGeneradas, perspectivaEstimacion, fechaDesdeEstimacion, fechaHastaEstimacion])

  const totalPaginasEstimaciones = Math.max(1, Math.ceil(estimacionesFiltradas.length / itemsPorPaginaEstimaciones))
  const estimacionesPaginadas = useMemo(() => {
    const inicio = (paginaEstimaciones - 1) * itemsPorPaginaEstimaciones
    return estimacionesFiltradas.slice(inicio, inicio + itemsPorPaginaEstimaciones)
  }, [estimacionesFiltradas, paginaEstimaciones, itemsPorPaginaEstimaciones])

  // Fuente de Renglones reales (del proyecto o vacío si no se han establecido)
  const listaRenglonesFuente = useMemo<RenglonItemFinanciero[]>(() => {
    const rawRenglones = (proyecto as any)?.renglones || (proyecto as any)?.renglones_sabana || (proyecto as any)?.planTrabajo
    if (Array.isArray(rawRenglones) && rawRenglones.length > 0) {
      return rawRenglones.map((r: any, idx: number) => ({
        id: r.id || r.codigoDGC || r.codigo || `r-${idx}`,
        renglonId: r.renglonId || (typeof r.id === 'string' && r.id.length === 36 ? r.id : undefined),
        capituloId: Number(r.capituloId || r.capitulo || 1),
        capituloNombre: r.capituloNombre || `Capítulo ${r.capituloId || r.capitulo || 1}`,
        codigoDGC: r.codigoDGC || r.codigo || `10${idx + 1}.01`,
        descripcion: r.descripcion || '',
        unidad: r.unidad || r.unidad_medida || 'm³',
        cantidadContratada: Number(r.cantidadContratada ?? r.cantidad_contractual ?? r.cantidad ?? 1),
        cantidadAjustada: Number(r.cantidadAjustada ?? r.cantidad_ajustada ?? r.cantidadContratada ?? 1),
        costoUnitarioDirecto: Number(r.costoUnitarioDirecto ?? r.precio_unitario_directo ?? r.precioUnitario ?? 0),
        cantidadEstePeriodo: Number(r.cantidadEstePeriodo || 0),
        cantidadAcumuladaAnterior: Number(r.cantidadAcumuladaAnterior || 0),
        seleccionado: r.seleccionado !== false,
        esPersonalizado: Boolean(r.esPersonalizado),
      }))
    }
    return []
  }, [proyecto])

  // Filtrado de Renglones en Programa de Trabajo (Filtro por Capítulo + Filtro por Renglón / Búsqueda + Filtro Estado Bitácora)
  const renglonesFiltrados = useMemo(() => {
    const base = listaRenglones.length > 0 ? listaRenglones : listaRenglonesFuente
    return base.filter((r) => {
      const matchCap = filtroCapitulo === 'todos' || r.capituloId === filtroCapitulo
      const matchRenglon = filtroRenglon === 'todos' || r.codigoDGC === filtroRenglon
      const matchTexto = busquedaTexto.trim() === '' ||
        r.codigoDGC.toLowerCase().includes(busquedaTexto.toLowerCase()) ||
        r.descripcion.toLowerCase().includes(busquedaTexto.toLowerCase()) ||
        r.capituloNombre.toLowerCase().includes(busquedaTexto.toLowerCase())

      let matchEstado = true
      if (filtroEstadoBitacora === 'en_bitacora') matchEstado = r.seleccionado !== false
      if (filtroEstadoBitacora === 'ocultos') matchEstado = r.seleccionado === false

      // En proyecto activo, ocultar renglones que tengan cantidad en 0
      const estProy = typeof proyecto?.estado === 'string' ? proyecto.estado.toLowerCase() : ''
      if (estProy === 'activo') {
        const cantC = Number(r.cantidadContratada ?? 0)
        const cantA = Number(r.cantidadAjustada ?? cantC)
        const cantE = Number(r.cantidadEstePeriodo ?? 0) + Number(r.cantidadAcumuladaAnterior ?? 0)
        if (cantC <= 0 && cantA <= 0 && cantE <= 0) return false
      }

      return matchCap && matchRenglon && matchTexto && matchEstado
    })
  }, [listaRenglones, listaRenglonesFuente, filtroCapitulo, filtroRenglon, busquedaTexto, filtroEstadoBitacora])

  // Paginación de Renglones
  const totalPaginasRenglones = Math.max(1, Math.ceil(renglonesFiltrados.length / itemsPorPagina))
  const renglonesPaginados = useMemo(() => {
    const inicio = (paginaRenglones - 1) * itemsPorPagina
    return renglonesFiltrados.slice(inicio, inicio + itemsPorPagina)
  }, [renglonesFiltrados, paginaRenglones, itemsPorPagina])

  // Lista de códigos de renglón únicos para el selector
  const listaCodigosRenglon = useMemo(() => {
    const base = listaRenglones.length > 0 ? listaRenglones : listaRenglonesFuente
    const items = filtroCapitulo === 'todos'
      ? base
      : base.filter((r) => r.capituloId === filtroCapitulo)
    return items.map((r) => ({ codigo: r.codigoDGC, descripcion: r.descripcion }))
  }, [listaRenglones, listaRenglonesFuente, filtroCapitulo])

  // Datos de la Curva S Financiera Dinámica basada en fechas reales y avance de estimaciones del proyecto
  const puntosCurvaS = useMemo(() => {
    const fIniRaw = proyecto?.fechaInicioContractual || proyecto?.fechaInicio || (proyecto as any)?.fecha_inicio || '2026-01-01'
    const fFinRaw = proyecto?.fechaFinalizacionReal || (proyecto as any)?.fechaFinContractualPlan || proyecto?.fechaFin || (proyecto as any)?.fecha_fin || '2026-12-31'

    const partesIni = String(fIniRaw).split('-').map(Number)
    const partesFin = String(fFinRaw).split('-').map(Number)

    const dIni = new Date(partesIni[0] || 2026, partesIni[1] ? partesIni[1] - 1 : 0, partesIni[2] || 1)
    const dFin = new Date(partesFin[0] || 2026, partesFin[1] ? partesFin[1] - 1 : 11, partesFin[2] || 28)

    const mesesAbrev = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    const mesesCompletos = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

    const listaMeses: Array<{ mes: string; fecha: string; año: number; mesIdx: number; date: Date }> = []
    const cursor = new Date(dIni.getFullYear(), dIni.getMonth(), 1)
    const limite = new Date(dFin.getFullYear(), dFin.getMonth(), 1)

    let count = 0
    while (cursor <= limite && count < 60) {
      const mIdx = cursor.getMonth()
      const y = cursor.getFullYear()
      listaMeses.push({
        mes: `${mesesCompletos[mIdx]} ${y}`,
        fecha: `${mesesAbrev[mIdx]} ${y}`,
        año: y,
        mesIdx: mIdx,
        date: new Date(cursor),
      })
      cursor.setMonth(cursor.getMonth() + 1)
      count++
    }

    if (listaMeses.length < 2) {
      listaMeses.push({
        mes: `${mesesCompletos[(dIni.getMonth() + 1) % 12]} ${dIni.getFullYear()}`,
        fecha: `${mesesAbrev[(dIni.getMonth() + 1) % 12]} ${dIni.getFullYear()}`,
        año: dIni.getFullYear(),
        mesIdx: (dIni.getMonth() + 1) % 12,
        date: new Date(dIni.getFullYear(), dIni.getMonth() + 1, 1),
      })
    }

    const total = listaMeses.length
    const estimacionesSupervisora = estimacionesGeneradas.filter((e) => e.perspectiva === 'supervisora')
    const estimacionesPerspectiva = (perspectivaCurva === 'supervisora' && estimacionesSupervisora.length > 0)
      ? estimacionesSupervisora
      : estimacionesGeneradas

    let acumuladoEjecutado = 0
    let ultimoMesConEstimacionIdx = -1

    listaMeses.forEach((m, idx) => {
      const hayEst = estimacionesPerspectiva.some((e) => {
        const fFin = String(e.fechaFin || e.fechaCorte || '').trim()
        if (fFin) {
          const p = fFin.split('-').map(Number)
          if (p.length >= 2 && p[0] && p[1]) {
            return p[0] === m.año && (p[1] - 1) === m.mesIdx
          }
        }
        return e.mes && e.mes.toLowerCase().includes(mesesCompletos[m.mesIdx].toLowerCase()) && e.mes.includes(String(m.año))
      })
      if (hayEst) {
        ultimoMesConEstimacionIdx = idx
      }
    })

    return listaMeses.map((m, idx) => {
      const t = idx / Math.max(1, total - 1)
      const prog = Math.round((3 * t * t - 2 * t * t * t) * 10000) / 100

      const tPrev = idx === 0 ? 0 : (idx - 1) / Math.max(1, total - 1)
      const progPrev = idx === 0 ? 0 : Math.round((3 * tPrev * tPrev - 2 * tPrev * tPrev * tPrev) * 10000) / 100
      const progMesPct = Math.max(0, prog - progPrev)
      const montoEsperadoMes = (montoBaseCurva * progMesPct) / 100

      const estsDelMes = estimacionesPerspectiva.filter((e) => {
        const fFin = String(e.fechaFin || e.fechaCorte || '').trim()
        if (fFin) {
          const p = fFin.split('-').map(Number)
          if (p.length >= 2 && p[0] && p[1]) {
            return p[0] === m.año && (p[1] - 1) === m.mesIdx
          }
        }
        return e.mes && e.mes.toLowerCase().includes(mesesCompletos[m.mesIdx].toLowerCase()) && e.mes.includes(String(m.año))
      })

      const montoEstimadoMes = estsDelMes.reduce((acc, e) => acc + (Number(e.valorBrutoTrabajado) || 0), 0)

      if (estsDelMes.length > 0) {
        estsDelMes.forEach((est) => {
          acumuladoEjecutado += Number(est.valorBrutoTrabajado) || 0
        })
      }

      let real: number | null = null
      let esCorte = false

      if (ultimoMesConEstimacionIdx >= 0 && idx <= ultimoMesConEstimacionIdx) {
        real = montoBaseCurva > 0 ? Number(((acumuladoEjecutado / montoBaseCurva) * 100).toFixed(2)) : 0
        if (idx === ultimoMesConEstimacionIdx) {
          esCorte = true
        }
      }

      const variacion = real !== null ? Number((real - prog).toFixed(2)) : null
      const montoProg = montoBaseCurva * (prog / 100)
      const montoReal = real !== null ? acumuladoEjecutado : null
      const nombreEstimacionMes = estsDelMes.map((e) => e.numero).join(', ')

      return {
        mes: m.mes,
        fecha: m.fecha,
        año: m.año,
        date: m.date,
        prog,
        real,
        esCorte,
        variacion,
        montoProg,
        montoReal,
        montoEsperadoMes,
        montoEstimadoMes,
        nombreEstimacionMes,
        tieneEstimacion: estsDelMes.length > 0,
      }
    })
  }, [proyecto, estimacionesGeneradas, perspectivaCurva, montoBaseCurva])

  // Años disponibles en la serie de datos para el filtro
  const aniosDisponiblesCurva = useMemo(() => {
    const setAnios = new Set<number>()
    puntosCurvaS.forEach((p) => setAnios.add(p.año))
    return Array.from(setAnios).sort((a, b) => a - b)
  }, [puntosCurvaS])

  // Puntos de la Curva S filtrados por Año y Rango de Fechas
  const puntosCurvaSFiltrados = useMemo(() => {
    return puntosCurvaS.filter((p) => {
      if (filtroAnioCurva !== 'todos' && String(p.año) !== String(filtroAnioCurva)) return false
      if (fechaDesdeCurva) {
        const dDesde = new Date(fechaDesdeCurva)
        if (p.date < dDesde) return false
      }
      if (fechaHastaCurva) {
        const dHasta = new Date(fechaHastaCurva)
        if (p.date > dHasta) return false
      }
      return true
    })
  }, [puntosCurvaS, filtroAnioCurva, fechaDesdeCurva, fechaHastaCurva])

  return (
    <div className="space-y-2.5 font-[Poppins] text-[10.5px]">
      {/* Banner Superior */}
      <div className="rounded-xl border border-gray-200 bg-white p-2.5 shadow-2xs">
        <div className={`flex flex-wrap items-center ${modoManual ? 'justify-end' : 'justify-between'} gap-2.5`}>
          {!modoManual && (
            <div className="flex items-center gap-2.5">
              <Banknote size={16} className="text-[#9B0F06] shrink-0" />
              <div>
                <p className="text-[8px] font-bold uppercase tracking-wider text-gray-400 font-sans">
                  Presupuesto / Monto Contractual Global
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-black text-gray-900 leading-none font-sans">
                    Q {montoContractualOriginal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium font-sans">
                    · Anticipo: {(pctAnticipoEjec * 100).toFixed(0)}% (Q {anticipoOtorgado.toLocaleString('es-GT', { minimumFractionDigits: 2 })})
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 font-sans">
            {!modoManual && (
              <button
                type="button"
                onClick={() => navegarAHojaSabana({ tab: 'planificacion' })}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold transition-all shadow-xs ${
                  tieneAccesoHojaSabana
                    ? 'bg-[#9B0F06] text-white hover:bg-[#5E0006] cursor-pointer'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                }`}
                title={tieneAccesoHojaSabana ? 'Abrir Hoja Sábana Analítica' : 'Solo el Delegado Residente o Administrador tiene acceso'}
              >
                {tieneAccesoHojaSabana ? <FileSpreadsheet size={11} /> : <Lock size={11} />}
                <span>Hoja Sábana Analítica</span>
                {tieneAccesoHojaSabana && <ArrowRight size={10} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sub-Pestañas Horizontales Estilo Hoja Sábana */}
      <div className="border-b border-gray-200 bg-white px-2 pt-1 rounded-t-md font-[Poppins]">
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => setSubTab('resumen')}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-1.5 text-[10.5px] transition-all cursor-pointer ${
              subTab === 'resumen'
                ? 'border-[#9B0F06] text-[#9B0F06] font-bold bg-red-50/40 rounded-t-md shadow-2xs'
                : 'border-transparent text-gray-500 font-medium hover:text-gray-800 hover:bg-gray-50/80 rounded-t-md'
            }`}
          >
            <Layers size={12} className={subTab === 'resumen' ? 'text-[#9B0F06]' : 'text-gray-400'} />
            <span>{modoManual ? 'Renglones' : 'Resumen'}</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('estimaciones')}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-1.5 text-[10.5px] transition-all cursor-pointer ${
              subTab === 'estimaciones'
                ? 'border-[#9B0F06] text-[#9B0F06] font-bold bg-red-50/40 rounded-t-md shadow-2xs'
                : 'border-transparent text-gray-500 font-medium hover:text-gray-800 hover:bg-gray-50/80 rounded-t-md'
            }`}
          >
            <Receipt size={12} className={subTab === 'estimaciones' ? 'text-[#9B0F06]' : 'text-gray-400'} />
            <span>Estimaciones</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('curva')}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-1.5 text-[10.5px] transition-all cursor-pointer ${
              subTab === 'curva'
                ? 'border-[#9B0F06] text-[#9B0F06] font-bold bg-red-50/40 rounded-t-md shadow-2xs'
                : 'border-transparent text-gray-500 font-medium hover:text-gray-800 hover:bg-gray-50/80 rounded-t-md'
            }`}
          >
            <TrendingUp size={12} className={subTab === 'curva' ? 'text-[#9B0F06]' : 'text-gray-400'} />
            <span>Gráfico Financiero</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. SUB-TAB 1: RESUMEN (KPIS + PROGRAMA DE TRABAJO CON PAGINACIÓN DE 10)    */}
      {/* ========================================================================= */}
      {subTab === 'resumen' && (
        <div className="space-y-2.5 font-[Poppins]">
          {/* 3 Tarjetas de Resumen Financiero Ejecutivo Compacto */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-sans">
            {/* Tarjeta 1: Resumen Financiero / Líquido */}
            <div className="rounded-xl border border-gray-200 bg-white p-2.5 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-extrabold uppercase tracking-wider text-gray-400 font-sans">
                  {modoManual ? 'Monto contractual' : 'Resumen Financiero'}
                </span>
                {!modoManual && (
                  <button
                    type="button"
                    onClick={() => setSubTab('estimaciones')}
                    className="text-[8.5px] font-bold text-[#9B0F06] hover:underline flex items-center gap-0.5 font-sans cursor-pointer"
                  >
                    <span>Ver detalle</span>
                    <ChevronRight size={10} />
                  </button>
                )}
              </div>
              <div className="mt-1">
                <span className="text-[7.5px] text-gray-400 block uppercase font-sans">
                  {modoManual ? 'Monto vigente del contrato' : 'Monto Líquido a Pagar'}
                </span>
                <p className="text-[13px] font-black text-gray-900 font-sans">
                  Q {(modoManual ? montoContractualOriginal : totalLiquidoAPagar).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Tarjeta 2: Control de Anticipo */}
            <div className="rounded-xl border border-gray-200 bg-white p-2.5 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-extrabold uppercase tracking-wider text-gray-400 font-sans">
                  {modoManual ? 'Inicio contractual' : 'Control de Anticipo'}
                </span>
                {!modoManual && (
                  <button
                    type="button"
                    onClick={() => navegarAHojaSabana({ tab: 'estimaciones' })}
                    className="text-[8.5px] font-bold text-[#9B0F06] hover:underline flex items-center gap-0.5 font-sans cursor-pointer"
                  >
                    <span>Ver detalle</span>
                    <ChevronRight size={10} />
                  </button>
                )}
              </div>
              <div className="mt-1">
                <span className="text-[7.5px] text-gray-400 block uppercase font-sans">
                  {modoManual ? 'Fecha de inicio' : '% Amortizado a la Fecha'}
                </span>
                <div className="flex items-baseline justify-between">
                  <p className="text-[13px] font-black text-gray-900 font-sans">
                    {modoManual
                      ? (pAny.fechaInicioContractual || pAny.fechaInicio || pAny.fecha_inicio || 'No definida')
                      : `${pctAmortizadoAnticipo.toFixed(1)}%`}
                  </p>
                  <span className="text-[8px] text-gray-500 font-sans">
                    {modoManual ? 'Contrato vigente' : `Saldo: Q ${saldoAnticipoPendiente.toLocaleString('es-GT', { minimumFractionDigits: 0 })}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Tarjeta 3: Control de Plazo */}
            <div className="rounded-xl border border-gray-200 bg-white p-2.5 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-extrabold uppercase tracking-wider text-gray-400 font-sans">
                  {modoManual ? 'Plazo contractual' : 'Control de Plazo'}
                </span>
                {!modoManual && (
                  <button
                    type="button"
                    onClick={() => setSubTab('estimaciones')}
                    className="text-[8.5px] font-bold text-[#9B0F06] hover:underline flex items-center gap-0.5 font-sans cursor-pointer"
                  >
                    <span>Ver detalle</span>
                    <ChevronRight size={10} />
                  </button>
                )}
              </div>
              <div className="mt-1">
                <span className="text-[7.5px] text-gray-400 block uppercase font-sans">
                  {modoManual ? 'Duración establecida' : 'Días por Emplearse'}
                </span>
                <div className="flex items-baseline justify-between">
                  <p className="text-[13px] font-black text-gray-900 font-sans">
                    {modoManual
                      ? `${plazoDiasCalculados.totalDias} días`
                      : <>{plazoDiasCalculados.diasRestantes} <span className="text-[9px] font-semibold text-gray-500">días</span></>}
                  </p>
                  <span className="text-[8px] text-gray-500 font-sans">
                    {modoManual ? 'Según contrato' : `Plazo: ${plazoDiasCalculados.totalDias}d`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Barra de Filtros y Acciones de Gestión de Renglones */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white p-2 shadow-2xs font-[Poppins]">
            {/* Controles Desktop (>= sm) */}
            <div className="hidden sm:flex flex-wrap items-center gap-2 flex-1">
              {/* Filtro 1: Todos los Capítulos */}
              <div className="min-w-[160px]">
                <select
                  value={filtroCapitulo}
                  onChange={(e) => {
                    setFiltroCapitulo(e.target.value === 'todos' ? 'todos' : Number(e.target.value))
                    setFiltroRenglon('todos')
                    setPaginaRenglones(1)
                  }}
                  className="w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-[9.5px] font-semibold text-gray-700 focus:border-[#9B0F06] focus:outline-none cursor-pointer"
                >
                  <option value="todos">Todos los Capítulos ({capitulosProyecto.length})</option>
                  {capitulosProyecto.map((c) => (
                    <option key={c.id} value={c.id}>
                      Capítulo {c.id}: {c.nombre.includes(':') ? c.nombre.split(':')[1]?.trim() : c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro 2: Según el Renglón */}
              <div className="min-w-[150px] hidden md:block">
                <select
                  value={filtroRenglon}
                  onChange={(e) => {
                    setFiltroRenglon(e.target.value)
                    setPaginaRenglones(1)
                  }}
                  className="w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-[9.5px] font-semibold text-gray-700 focus:border-[#9B0F06] focus:outline-none cursor-pointer"
                >
                  <option value="todos">Todos los Renglones</option>
                  {listaCodigosRenglon.map((r) => (
                    <option key={r.codigo} value={r.codigo}>
                      {r.codigo} — {r.descripcion.length > 30 ? `${r.descripcion.substring(0, 30)}...` : r.descripcion}
                    </option>
                  ))}
                </select>
              </div>

              {/* Búsqueda rápida por texto */}
              <div className="relative flex-1 min-w-[140px]">
                <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar texto en renglón..."
                  value={busquedaTexto}
                  onChange={(e) => {
                    setBusquedaTexto(e.target.value)
                    setPaginaRenglones(1)
                  }}
                  className="w-full rounded-md border border-gray-200 bg-gray-50/50 pl-6 pr-2 py-1 text-[10px] text-gray-900 placeholder:text-gray-400 focus:border-[#9B0F06] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Controles Móvil (< sm): Botón de Filtros y Búsqueda */}
            <div className="flex sm:hidden items-center gap-1.5 flex-1 min-w-0">
              <div className="relative flex-1 min-w-0">
                <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar renglón..."
                  value={busquedaTexto}
                  onChange={(e) => {
                    setBusquedaTexto(e.target.value)
                    setPaginaRenglones(1)
                  }}
                  className="w-full rounded-md border border-gray-200 bg-gray-50/50 pl-6 pr-2 py-1 text-[10px] text-gray-900 placeholder:text-gray-400 focus:border-[#9B0F06] focus:bg-white focus:outline-none"
                />
              </div>


            </div>

            {/* Acciones principales: Gestión Renglón en página completa */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const targetId = proyecto?.id || pAny.id || ''
                  if (targetId) {
                    router.push(`/dashboard/proyectos/${targetId}/renglones`)
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#9B0F06] hover:bg-[#7A0C0D] text-white px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold transition-all shadow-xs cursor-pointer"
                title="Abrir página dedicada de gestión de renglones y capítulos de este proyecto"
              >
                <Layers size={12} className="text-white" />
                <span>Gestión Renglón</span>
                <ArrowRight size={11} className="text-white/80" />
              </button>

              <div className="text-[9.5px] sm:text-[10px] text-gray-500 font-medium whitespace-nowrap pl-1">
                <strong className="text-gray-900">{renglonesFiltrados.length}</strong> {renglonesFiltrados.length === 1 ? 'renglón' : 'renglones'}
              </div>
            </div>
          </div>

          {/* Tabla de Renglones Compacta con Paginación */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-100/80 text-[9.5px] font-extrabold uppercase tracking-wider text-gray-700">
                    <th className="px-3 py-1.5 w-24 text-left">Código</th>
                    <th className="px-3 py-1.5 min-w-[280px] text-left">Descripción del Renglón</th>
                    {!modoManual ? (
                      <>
                        <th className="px-2.5 py-1.5 text-center w-20">Unidad</th>
                        <th className="px-2.5 py-1.5 text-right w-24">Cantidad</th>
                        <th className="px-2.5 py-1.5 text-right w-28">P. Unitario (Q)</th>
                        <th className="px-2.5 py-1.5 text-right w-32">Total (Q)</th>
                        <th className="px-2.5 py-1.5 text-center w-28">Acción</th>
                      </>
                    ) : (
                      <>
                        <th className="px-3 py-1.5 text-center w-36">Registros Bitácora</th>
                        <th className="px-3 py-1.5 text-center w-24">Acción</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-sans text-xs">
                  {renglonesPaginados.length === 0 ? (
                    <tr>
                      <td colSpan={modoManual ? 4 : 7} className="p-6 text-center text-xs text-gray-500 font-sans">
                        <div className="flex flex-col items-center justify-center py-4 text-gray-400">
                          <Layers size={28} className="text-gray-300 mb-1.5" />
                          <p className="font-bold text-gray-700 text-xs">
                            {listaRenglones.length === 0 && listaRenglonesFuente.length === 0
                              ? 'No hay renglones asignados a este proyecto'
                              : 'No se encontraron renglones con los filtros seleccionados'}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {listaRenglones.length === 0 && listaRenglonesFuente.length === 0
                              ? 'Puedes administrar y agregar renglones usando el botón "Gestión Renglón" arriba.'
                              : 'Prueba cambiando o limpiando los filtros de búsqueda.'}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              const targetId = proyecto?.id || pAny.id || ''
                              if (targetId) router.push(`/dashboard/proyectos/${targetId}/renglones`)
                            }}
                            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#9B0F06] hover:bg-[#7A0C0D] text-white px-3 py-1 text-xs font-bold shadow-xs cursor-pointer transition-colors"
                          >
                            <Layers size={12} />
                            <span>Abrir Gestión de Renglones</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    renglonesPaginados.map((renglon) => {
                      const montoTotal = (renglon.cantidadContratada || 0) * (renglon.costoUnitarioDirecto || 0)
                      const countBitacora =
                        (conteoBitacoraPorRenglon[renglon.codigoDGC] || 0) +
                        (conteoBitacoraPorRenglon[renglon.id] || 0) +
                        (renglon.renglonId ? (conteoBitacoraPorRenglon[renglon.renglonId] || 0) : 0)

                      return (
                        <tr
                          key={renglon.id || renglon.codigoDGC}
                          onClick={() => {
                            if (!modoManual) {
                              navegarAHojaSabana({ tab: 'planificacion', renglon: renglon.codigoDGC })
                            } else {
                              handleAbrirEditarRenglon(renglon)
                            }
                          }}
                          className="hover:bg-red-50/40 transition-colors cursor-pointer group"
                          title={modoManual ? 'Hacer clic para editar renglón de este proyecto' : 'Hacer clic para ampliar en Hoja Sábana'}
                        >
                          <td className="px-3 py-1.5 whitespace-nowrap">
                            <span className="inline-block rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-gray-800 border border-gray-200 group-hover:border-[#9B0F06] group-hover:text-[#9B0F06] transition-colors">
                              {renglon.codigoDGC}
                            </span>
                          </td>
                          <td className="px-3 py-1.5 font-sans">
                            <p className="font-semibold text-gray-900 text-[11px] sm:text-xs leading-tight group-hover:text-[#9B0F06] transition-colors">
                              {renglon.descripcion}
                            </p>
                            <span className="text-[9.5px] text-gray-400 font-medium block">
                              {renglon.capituloNombre || `Capítulo ${renglon.capituloId}`}
                            </span>
                          </td>
                          {!modoManual && (
                            <>
                              <td className="px-2.5 py-1.5 text-center font-bold text-gray-700 text-[11px] whitespace-nowrap">
                                {renglon.unidad}
                              </td>
                              <td className="px-2.5 py-1.5 text-right font-bold text-gray-900 text-[11px] whitespace-nowrap">
                                {renglon.cantidadContratada.toLocaleString('es-GT', {
                                  minimumFractionDigits: renglon.unidad.toLowerCase() === 'glb' || renglon.unidad.toLowerCase() === 'u' ? 0 : 2,
                                })}
                              </td>
                              <td className="px-2.5 py-1.5 text-right font-semibold text-gray-700 text-[11px] whitespace-nowrap">
                                Q {renglon.costoUnitarioDirecto.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-2.5 py-1.5 text-right font-black text-[#9B0F06] text-[11px] whitespace-nowrap">
                                Q {montoTotal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                              </td>
                            </>
                          )}

                          {modoManual && (
                            <>
                              {/* Conteo de registros en Bitácora */}
                              <td className="px-3 py-1.5 text-center whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9.5px] font-bold border ${
                                    countBitacora > 0
                                      ? 'bg-blue-50 text-blue-800 border-blue-200'
                                      : 'bg-gray-50 text-gray-400 border-gray-200'
                                  }`}
                                  title={countBitacora > 0 ? `${countBitacora} registros vinculados en bitácora de obra` : 'Sin registros en bitácora'}
                                >
                                  <FileText size={11} className={countBitacora > 0 ? 'text-blue-600' : 'text-gray-400'} />
                                  <span>{countBitacora} {countBitacora === 1 ? 'registro' : 'registros'}</span>
                                </span>
                              </td>

                              {/* Acciones: Editar / Eliminar */}
                              <td className="px-3 py-1.5 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleAbrirEditarRenglon(renglon)}
                                    className="p-1 rounded-md text-gray-600 hover:bg-gray-100 hover:text-[#9B0F06] transition-colors cursor-pointer"
                                    title="Editar renglón en este proyecto"
                                  >
                                    <Edit2 size={12} />
                                  </button>
                                  {renglon.esPersonalizado && (
                                    <button
                                      type="button"
                                      onClick={() => handleEliminarRenglonPersonalizado(renglon.codigoDGC)}
                                      className="p-1 rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                                      title="Eliminar renglón personalizado de este proyecto"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </>
                          )}

                          {!modoManual && (
                            <td className="px-2.5 py-1.5 text-center font-sans whitespace-nowrap">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  navegarAHojaSabana({ tab: 'planificacion', renglon: renglon.codigoDGC })
                                }}
                                className="inline-flex items-center gap-1 rounded bg-gray-50 border border-gray-200 px-2 py-0.5 text-[9.5px] font-bold text-gray-700 hover:bg-[#9B0F06] hover:text-white hover:border-[#9B0F06] transition-colors cursor-pointer"
                              >
                                <Eye size={10} />
                                <span>Planificación</span>
                              </button>
                            </td>
                          )}
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación estilo Hoja Sábana con Selector de Cantidad */}
            <div data-paginacion="true" className="paginacion-control flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 bg-gray-50/60 px-2.5 py-1 text-[8.5px] text-gray-600">
              <div className="flex items-center gap-2">
                <span className="font-medium text-[8.5px]">
                  Página <strong className="text-gray-900">{paginaRenglones}</strong> de <strong className="text-gray-900">{totalPaginasRenglones}</strong> ({renglonesFiltrados.length} renglones)
                </span>
                <span className="text-gray-300">|</span>
                <div className="flex items-center gap-1 text-[8.5px]">
                  <span>Mostrar:</span>
                  <select
                    value={itemsPorPagina}
                    onChange={(e) => {
                      setItemsPorPagina(Number(e.target.value))
                      setPaginaRenglones(1)
                    }}
                    className="paginacion-control h-5.5 rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[8.5px] font-semibold text-gray-700 shadow-2xs focus:border-[#9B0F06] focus:outline-none cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={500}>Todos</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPaginaRenglones((p) => Math.max(1, p - 1))}
                  disabled={paginaRenglones <= 1}
                  className="inline-flex h-5 w-5 items-center justify-center rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Página anterior"
                >
                  <ChevronLeft size={10} />
                </button>
                <span className="px-1 font-bold font-mono text-[9px]">{paginaRenglones}</span>
                <button
                  type="button"
                  onClick={() => setPaginaRenglones((p) => Math.min(totalPaginasRenglones, p + 1))}
                  disabled={paginaRenglones >= totalPaginasRenglones}
                  className="inline-flex h-5 w-5 items-center justify-center rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Página siguiente"
                >
                  <ChevronRight size={10} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SUB-TAB 2: ESTIMACIONES (PERSPECTIVA + FILTRO DE FECHAS + PAGINACIÓN) */}
      {/* ========================================================================= */}
      {subTab === 'estimaciones' && (
        <div className="space-y-2.5">
          {/* Selector de Perspectiva Doble y Filtros de Fecha */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-gray-200 bg-white p-2.5 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500">
                PERSPECTIVA:
              </span>
              <div className="grid grid-cols-2 w-full sm:w-auto items-center gap-1 rounded-lg bg-gray-100/80 p-0.5 border border-gray-200/60 shadow-2xs">
                <button
                  type="button"
                  onClick={() => {
                    setPerspectivaEstimacion('ejecutora')
                    setPaginaEstimaciones(1)
                  }}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold transition-all duration-200 cursor-pointer ${
                    perspectivaEstimacion === 'ejecutora'
                      ? 'bg-white text-[#9B0F06] border border-gray-200/80 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 font-medium'
                  }`}
                >
                  <Building2 size={11} className={perspectivaEstimacion === 'ejecutora' ? 'text-[#9B0F06]' : 'text-gray-500'} />
                  <span className="text-[10px] truncate">Empresa Ejecutora</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPerspectivaEstimacion('supervisora')
                    setPaginaEstimaciones(1)
                  }}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold transition-all duration-200 cursor-pointer ${
                    perspectivaEstimacion === 'supervisora'
                      ? 'bg-white text-[#9B0F06] border border-gray-200/80 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 font-medium'
                  }`}
                >
                  <UserCheck size={11} className={perspectivaEstimacion === 'supervisora' ? 'text-[#9B0F06]' : 'text-gray-500'} />
                  <span className="text-[10px] truncate">Empresa Supervisora</span>
                </button>
              </div>
            </div>

            {/* Botón para crear o agregar estimación */}
            <div className="flex items-center gap-2">
              {esModoSabanaActual ? (
                <a
                  href={`/dashboard/proyectos/${proyecto?.id || ''}/hoja-sabana`}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-[#9B0F06] px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-[#7a0c05] transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                  title="Gestionar periodos y estimaciones en Hoja Sábana"
                >
                  <FileSpreadsheet size={12} />
                  <span>Gestionar en Hoja Sábana</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={handleAbrirCrearEstimacionManual}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-[#9B0F06] px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-[#7a0c05] transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                  title="Crear o registrar estimación manual"
                >
                  <Plus size={12} />
                  <span>Nueva Estimación</span>
                </button>
              )}

              <div className="text-[10px] text-gray-500 font-medium pl-1">
                <strong className="text-gray-900">{estimacionesFiltradas.length}</strong> {estimacionesFiltradas.length === 1 ? 'estimación' : 'estimaciones'}
              </div>
            </div>
          </div>

          {/* Tabla de Estimaciones con Acción (Solo Ojo / Editar) y Paginación */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-[10px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-100/75 text-[8px] font-extrabold uppercase tracking-wider text-gray-600">
                    <th className="px-2.5 py-1.5 min-w-[160px]">No. Estimación / Título</th>
                    <th className="px-2.5 py-1.5 min-w-[130px]">Delegado Residente / Responsable</th>
                    <th className="px-2.5 py-1.5 min-w-[120px]">Período (Inicio / Fin)</th>
                    <th className="px-2.5 py-1.5 text-center min-w-[100px]">Retraso</th>
                    <th className="px-2.5 py-1.5 text-center min-w-[110px]">Rendimiento</th>
                    <th className="px-2.5 py-1.5 text-right min-w-[110px]">Anticipo Aplicado</th>
                    <th className="px-2.5 py-1.5 text-right min-w-[110px]">Valor Bruto (Q)</th>
                    <th className="px-2.5 py-1.5 text-right min-w-[110px]">Líquido a Pagar (Q)</th>
                    <th className="px-2.5 py-1.5 text-right min-w-[110px]">Saldo Restante</th>
                    <th className="px-2.5 py-1.5 text-center w-20">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-sans text-[10px]">
                  {estimacionesPaginadas.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-10 px-4 text-center font-sans">
                        <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-2">
                          <div className="p-3 bg-red-50 text-[#9B0F06] rounded-full border border-red-100">
                            <Receipt size={22} />
                          </div>
                          <p className="text-xs font-bold text-gray-800">
                            No hay estimaciones registradas
                          </p>
                          <p className="text-[10px] text-gray-500 leading-normal">
                            {esModoSabanaActual
                              ? 'Las estimaciones de esta perspectiva se generan y controlan directamente a través de la Hoja Sábana Analítica.'
                              : 'Este proyecto no cuenta con estimaciones registradas en la perspectiva actual. Haz clic en el botón para crear la primera estimación progresiva.'}
                          </p>
                          {esModoSabanaActual ? (
                            <a
                              href={`/dashboard/proyectos/${proyecto?.id || ''}/hoja-sabana`}
                              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#9B0F06] px-3.5 py-1.5 text-[10px] font-bold text-white hover:bg-[#7a0c05] transition-colors cursor-pointer shadow-xs"
                            >
                              <FileSpreadsheet size={12} />
                              <span>Abrir Hoja Sábana</span>
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={handleAbrirCrearEstimacionManual}
                              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#9B0F06] px-3.5 py-1.5 text-[10px] font-bold text-white hover:bg-[#7a0c05] transition-colors cursor-pointer shadow-xs"
                            >
                              <Plus size={12} />
                              <span>Crear Primera Estimación</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    estimacionesPaginadas.map((est) => (
                      <tr key={est.id} className="hover:bg-gray-50/70 transition-colors">
                        {/* No. Estimación & Nombre (con indicación de Hoja Sábana si aplica) */}
                        <td className="px-2.5 py-1.5 font-sans">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-gray-900">{est.numero}</span>
                            {(esModoSabanaActual || (est as any).origenSabana) && (
                              <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[8px] font-bold bg-[#9B0F06]/10 text-[#9B0F06] border border-[#9B0F06]/20">
                                <FileSpreadsheet size={9} /> Hoja Sábana
                              </span>
                            )}
                            {est.estado === 'en_revision' && (
                              <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[8px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                En Progreso
                              </span>
                            )}
                          </div>
                          <p className="text-[9px] text-gray-600 font-medium truncate max-w-[180px]" title={est.nombreEstimacion}>
                            {est.nombreEstimacion}
                          </p>
                        </td>

                        {/* Delegado Residente */}
                        <td className="px-2.5 py-1.5 font-sans">
                          <div className="flex items-center gap-1 text-gray-900 font-semibold text-[9.5px]">
                            <User size={9} className="text-gray-700 shrink-0" />
                            <span className="truncate max-w-[120px]">{est.delegadoResidente}</span>
                          </div>
                          <p className="text-[8px] text-gray-500 font-normal truncate max-w-[120px]">
                            {est.perspectiva === 'supervisora' ? nombreEmpresaSupervisora : nombreEmpresaEjecutora}
                          </p>
                        </td>

                        {/* Período */}
                        <td className="px-2.5 py-1.5 font-mono text-[9px] text-gray-900">
                          <div className="flex items-center gap-1">
                            <Calendar size={9} className="text-gray-500 shrink-0" />
                            <span>{est.fechaInicio} al {est.fechaFin}</span>
                          </div>
                          <span className="text-[8px] text-gray-500 block font-sans">{est.mes}</span>
                        </td>

                        {/* Retraso (en color negro) */}
                        <td className="px-2.5 py-1.5 text-center font-sans">
                          {est.diasRetraso === 0 ? (
                            <span className="text-gray-900 font-semibold text-[9px] inline-flex items-center gap-0.5">
                              <CheckCircle2 size={9} className="text-gray-700" />
                              En tiempo (0d)
                            </span>
                          ) : (
                            <span className="text-gray-900 font-semibold text-[9px] inline-flex items-center gap-0.5">
                              <AlertTriangle size={9} className="text-gray-700" />
                              +{est.diasRetraso}d retraso
                            </span>
                          )}
                        </td>

                        {/* Rendimiento (en color negro) */}
                        <td className="px-2.5 py-1.5 text-center font-sans">
                          <span className="font-bold text-[9px] text-gray-900">
                            {est.porcentajeRendimiento.toFixed(1)}% ({est.calificacionDesempeno.toUpperCase()})
                          </span>
                        </td>

                        {/* Anticipo Aplicado (en color negro) */}
                        <td className="px-2.5 py-1.5 text-right">
                          <span className="text-gray-900 font-semibold block font-mono text-[9.5px]">
                            − Q {est.montoAmortizacion.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[7.5px] text-gray-500 font-sans">
                            ({est.porcentajeAmortizacion.toFixed(0)}% amortizado)
                          </span>
                        </td>

                        {/* Valor Bruto */}
                        <td className="px-2.5 py-1.5 text-right font-semibold text-gray-900 font-mono text-[9.5px]">
                          Q {est.valorBrutoTrabajado.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Monto Líquido a Pagar (en color negro) */}
                        <td className="px-2.5 py-1.5 text-right font-bold text-gray-900 font-mono text-[9.5px]">
                          Q {est.montoLiquidoAPagar.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Saldo Contractual (en color negro) */}
                        <td className="px-2.5 py-1.5 text-right font-medium text-gray-900 font-mono text-[9px]">
                          Q {est.saldoContractualRestante.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Botón Acción: Ver abre Drawer ahí mismo, Editar y Eliminar */}
                        <td className="px-2.5 py-1.5 text-center font-sans">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setDrawerEstimacionVer(est)}
                              className="inline-flex h-6 w-6 items-center justify-center rounded text-gray-700 hover:text-black hover:bg-gray-100 cursor-pointer transition-colors shadow-2xs"
                              title={`Ver detalles de ${est.numero}`}
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAbrirEditarEstimacionManual(est)}
                              className="inline-flex h-6 w-6 items-center justify-center rounded text-gray-700 hover:text-black hover:bg-gray-100 cursor-pointer transition-colors shadow-2xs"
                              title="Editar estimación"
                            >
                              <Edit2 size={11} />
                            </button>
                            {est.estado === 'borrador' ? (
                              <button
                                type="button"
                                onClick={() => setEstimacionParaEliminar(est)}
                                className="inline-flex h-6 w-6 items-center justify-center rounded text-gray-700 hover:text-red-700 hover:bg-red-50 cursor-pointer transition-colors shadow-2xs"
                                title={`Eliminar ${est.numero} (Permitido en estado Borrador)`}
                              >
                                <Trash2 size={11} />
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación de Estimaciones */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 bg-gray-50/60 px-2.5 py-1 text-[8.5px] text-gray-600">
              <span className="font-medium">
                Página <strong className="text-gray-900">{paginaEstimaciones}</strong> de <strong className="text-gray-900">{totalPaginasEstimaciones}</strong> ({estimacionesFiltradas.length} estimaciones totales)
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPaginaEstimaciones((p) => Math.max(1, p - 1))}
                  disabled={paginaEstimaciones <= 1}
                  className="inline-flex h-5 w-5 items-center justify-center rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Página anterior"
                >
                  <ChevronLeft size={10} />
                </button>
                <span className="px-1 font-bold font-mono text-[9px]">{paginaEstimaciones}</span>
                <button
                  type="button"
                  onClick={() => setPaginaEstimaciones((p) => Math.min(totalPaginasEstimaciones, p + 1))}
                  disabled={paginaEstimaciones >= totalPaginasEstimaciones}
                  className="inline-flex h-5 w-5 items-center justify-center rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Página siguiente"
                >
                  <ChevronRight size={10} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SUB-TAB 3: GRÁFICO FINANCIERO (PROGRAMADO / EJECUTADO ACUMULADO)      */}
      {/* ========================================================================= */}
      {subTab === 'curva' && (
        <div className="space-y-2.5 font-[Poppins]">
          {/* Barra de Filtros del Gráfico Financiero en 2 Filas Independientes */}
          <div className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-3 shadow-2xs">
            {/* Fila 1: Perspectiva Doble */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500">
                  PERSPECTIVA:
                </span>
                <div className="grid grid-cols-2 w-full sm:w-auto items-center gap-1 rounded-lg bg-gray-100/80 p-0.5 border border-gray-200/60 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setPerspectivaCurva('ejecutora')}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1 text-[10.5px] font-bold transition-all duration-200 cursor-pointer ${
                      perspectivaCurva === 'ejecutora'
                        ? 'bg-white text-[#9B0F06] border border-gray-200/80 shadow-xs'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 font-medium'
                    }`}
                  >
                    <Building2 size={12} className={perspectivaCurva === 'ejecutora' ? 'text-[#9B0F06]' : 'text-gray-500'} />
                    <span className="truncate">Empresa Ejecutora</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPerspectivaCurva('supervisora')}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1 text-[10.5px] font-bold transition-all duration-200 cursor-pointer ${
                      perspectivaCurva === 'supervisora'
                        ? 'bg-white text-[#9B0F06] border border-gray-200/80 shadow-xs'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 font-medium'
                    }`}
                  >
                    <UserCheck size={12} className={perspectivaCurva === 'supervisora' ? 'text-[#9B0F06]' : 'text-gray-500'} />
                    <span className="truncate">Empresa Supervisora</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalFiltrosCurvaOpen(true)}
                  className="sm:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-[10px] font-bold text-gray-700 shadow-2xs hover:bg-gray-50 cursor-pointer shrink-0"
                >
                  <Filter size={11} className="text-[#9B0F06]" />
                  <span>Filtros</span>
                  {(filtroAnioCurva !== 'todos' || fechaDesdeCurva || fechaHastaCurva || tipoMetricaCurva !== 'porcentaje') && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#9B0F06]" />
                  )}
                </button>
                <span className="text-[10.5px] text-gray-400 font-medium hidden sm:inline">
                  {puntosCurvaSFiltrados.length} {puntosCurvaSFiltrados.length === 1 ? 'mes registrado' : 'meses registrados'}
                </span>
              </div>
            </div>

            {/* Fila 2: Controles de Filtrado: Año, Métrica y Rango Temporal (Fila aparte como solicitado) */}
            <div className="hidden sm:flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 text-[10.5px]">
              {/* Filtro por Año */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10.5px] text-gray-500 font-semibold">Año:</span>
                <select
                  value={filtroAnioCurva}
                  onChange={(e) => setFiltroAnioCurva(e.target.value)}
                  className="rounded-md border border-gray-200 bg-gray-50/60 px-2.5 py-1 text-[10.5px] font-semibold text-gray-800 focus:border-[#9B0F06] focus:bg-white focus:outline-none cursor-pointer"
                >
                  <option value="todos">Todos los Años</option>
                  {aniosDisponiblesCurva.map((a) => (
                    <option key={a} value={String(a)}>{a}</option>
                  ))}
                </select>
              </div>

              {/* Selector de Métrica (% vs Monto Q vs Comparativa Plan) */}
              <div className="inline-flex items-center gap-0.5 rounded-md bg-gray-100 p-0.5 border border-gray-200">
                <button
                  type="button"
                  onClick={() => setTipoMetricaCurva('porcentaje')}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    tipoMetricaCurva === 'porcentaje'
                      ? 'bg-white text-[#9B0F06] shadow-2xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  % Acumulado
                </button>
                <button
                  type="button"
                  onClick={() => setTipoMetricaCurva('monto')}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    tipoMetricaCurva === 'monto'
                      ? 'bg-white text-[#9B0F06] shadow-2xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Monto (Q)
                </button>
                <button
                  type="button"
                  onClick={() => setTipoMetricaCurva('comparativa')}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    tipoMetricaCurva === 'comparativa'
                      ? 'bg-white text-[#9B0F06] shadow-2xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Comparar estimaciones con el monto esperado en el plan de trabajo"
                >
                  Estimado vs Esperado (Plan)
                </button>
              </div>

              {/* Rango Desde / Hasta */}
              <div className="flex items-center gap-1.5 text-gray-500 font-medium">
                <span className="text-[10.5px] font-semibold">Desde:</span>
                <input
                  type="date"
                  value={fechaDesdeCurva}
                  onChange={(e) => setFechaDesdeCurva(e.target.value)}
                  className="rounded-md border border-gray-200 bg-gray-50/60 px-2 py-1 text-[10.5px] font-medium text-gray-800 focus:border-[#9B0F06] focus:bg-white focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-1.5 text-gray-500 font-medium">
                <span className="text-[10.5px] font-semibold">Hasta:</span>
                <input
                  type="date"
                  value={fechaHastaCurva}
                  onChange={(e) => setFechaHastaCurva(e.target.value)}
                  className="rounded-md border border-gray-200 bg-gray-50/60 px-2 py-1 text-[10.5px] font-medium text-gray-800 focus:border-[#9B0F06] focus:bg-white focus:outline-none"
                />
              </div>

              {(filtroAnioCurva !== 'todos' || fechaDesdeCurva || fechaHastaCurva) && (
                <button
                  type="button"
                  onClick={() => {
                    setFiltroAnioCurva('todos')
                    setFechaDesdeCurva('')
                    setFechaHastaCurva('')
                  }}
                  className="text-[10.5px] font-bold text-[#9B0F06] hover:underline cursor-pointer ml-1"
                >
                  Limpiar Filtros
                </button>
              )}

              <span className="text-[10.5px] text-gray-400 font-medium sm:hidden">
                {puntosCurvaSFiltrados.length} meses
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between border-b border-gray-100 pb-2 gap-2">
              <div>
                <h2 className="text-xs font-black tracking-wide text-gray-900 uppercase">
                  {tipoMetricaCurva === 'comparativa'
                    ? `COMPARATIVA ESTIMACIÓN VS PLAN ESPERADO (${perspectivaCurva === 'ejecutora' ? 'CONTRATO DE OBRA' : 'CONTRATO DE SUPERVISIÓN'})`
                    : `PROGRAMADO / EJECUTADO ACUMULADO MENSUAL (${perspectivaCurva === 'ejecutora' ? 'CONTRATO DE OBRA' : 'CONTRATO DE SUPERVISIÓN'})`}
                </h2>
                <p className="text-[9px] text-gray-400">
                  {tipoMetricaCurva === 'porcentaje'
                    ? 'Curva de avance porcentual contractual acumulado'
                    : tipoMetricaCurva === 'monto'
                    ? 'Curva de avance monetario acumulado (Q)'
                    : 'Comparativa mensual directa del monto de estimaciones ejecutadas vs monto esperado en el plan de trabajo (Q)'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[8.5px] font-bold text-gray-400 uppercase block">Base Contractual</span>
                <span className="font-mono font-bold text-[11px] text-gray-800">
                  Q {montoBaseCurva.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Contenedor SVG Responsivo de la Curva S y Comparativa */}
            <div className="relative w-full bg-white rounded-lg p-2 select-none overflow-x-auto">
              <div className="w-full min-w-[650px]">
                {(() => {
                  const total = puntosCurvaSFiltrados.length
                  if (total === 0) {
                    return (
                      <div className="py-12 text-center text-gray-500 text-xs font-sans">
                        No hay datos financieros para los filtros seleccionados.
                      </div>
                    )
                  }

                  const svgWidth = Math.max(760, total * 48)
                  const xStep = (svgWidth - 90) / Math.max(1, total - 1)
                  const esPorcentaje = tipoMetricaCurva === 'porcentaje'
                  const esComparativa = tipoMetricaCurva === 'comparativa'

                  if (esComparativa) {
                    const maxVal = Math.max(
                      1,
                      ...puntosCurvaSFiltrados.map((p) => Math.max(p.montoEsperadoMes || 0, p.montoEstimadoMes || 0))
                    ) * 1.2
                    const barGroupWidth = Math.min(28, Math.max(16, xStep * 0.45))
                    const barW = barGroupWidth / 2 - 1

                    const ticksY = [0, 0.25, 0.5, 0.75, 1.0].map((f) => {
                      const val = f * maxVal
                      const y = 175 - (val / maxVal) * 145
                      const labelQ = val >= 1_000_000
                        ? `Q ${(val / 1_000_000).toFixed(1)}M`
                        : val >= 1_000
                        ? `Q ${(val / 1000).toFixed(0)}k`
                        : `Q ${val.toFixed(0)}`
                      return { y, label: labelQ }
                    })

                    return (
                      <svg viewBox={`0 0 ${svgWidth} 250`} className="w-full h-auto max-h-[320px] overflow-visible">
                        {/* Cuadrícula Horizontal Y */}
                        {ticksY.map((t, idx) => (
                          <g key={idx}>
                            <line x1="50" y1={t.y} x2={svgWidth - 20} y2={t.y} stroke="#e5e7eb" strokeWidth="1" />
                            <text x="44" y={t.y + 3} textAnchor="end" fontSize="8" fill="#4b5563" fontFamily="sans-serif" fontWeight="500">
                              {t.label}
                            </text>
                          </g>
                        ))}

                        {/* Ejes X y Y */}
                        <line x1="50" y1="30" x2="50" y2="175" stroke="#d1d5db" strokeWidth="1.5" />
                        <line x1="50" y1="175" x2={svgWidth - 20} y2="175" stroke="#d1d5db" strokeWidth="1.5" />

                        {/* Columnas de Comparación por Mes */}
                        {puntosCurvaSFiltrados.map((pt, idx) => {
                          const xCenter = 55 + idx * xStep
                          const hEsperado = Math.max(0, Math.min(145, ((pt.montoEsperadoMes || 0) / maxVal) * 145))
                          const yEsperado = 175 - hEsperado

                          const hEstimado = Math.max(0, Math.min(145, ((pt.montoEstimadoMes || 0) / maxVal) * 145))
                          const yEstimado = 175 - hEstimado

                          const x1 = xCenter - barGroupWidth / 2
                          const x2 = xCenter + 1

                          const dif = (pt.montoEstimadoMes || 0) - (pt.montoEsperadoMes || 0)
                          const tieneDatoReal = pt.tieneEstimacion || pt.real !== null

                          return (
                            <g
                              key={`comp-${idx}`}
                              className="cursor-pointer transition-opacity hover:opacity-90"
                              onMouseEnter={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect()
                                setTooltipCurva({
                                  x: rect.left,
                                  y: rect.top,
                                  visible: true,
                                  data: {
                                    ...pt,
                                    esComparativa: true,
                                  },
                                })
                              }}
                              onMouseLeave={() => setTooltipCurva(null)}
                            >
                              {/* Barra Azul: Monto Esperado en Plan */}
                              <rect
                                x={x1}
                                y={yEsperado}
                                width={barW}
                                height={hEsperado}
                                rx="2"
                                fill="#2563eb"
                                opacity="0.85"
                              />

                              {/* Barra Borgoña: Monto Estimación Real */}
                              <rect
                                x={x2}
                                y={yEstimado}
                                width={barW}
                                height={hEstimado}
                                rx="2"
                                fill={tieneDatoReal ? '#9B0F06' : '#e5e7eb'}
                                stroke={tieneDatoReal ? '#7a0c05' : '#d1d5db'}
                                strokeWidth="0.5"
                                strokeDasharray={tieneDatoReal ? undefined : '2,2'}
                              />

                              {/* Indicador de Desfase / Adelanto flotante si hay estimación */}
                              {tieneDatoReal && pt.montoEstimadoMes > 0 && (
                                <text
                                  x={xCenter}
                                  y={Math.min(yEsperado, yEstimado) - 5}
                                  textAnchor="middle"
                                  fontSize="7"
                                  fontWeight="bold"
                                  fill={dif >= 0 ? '#047857' : '#9B0F06'}
                                  fontFamily="sans-serif"
                                >
                                  {dif >= 0 ? '+' : ''}{dif >= 1_000_000 ? `Q${(dif / 1_000_000).toFixed(1)}M` : `Q${(dif / 1000).toFixed(0)}k`}
                                </text>
                              )}
                            </g>
                          )
                        })}

                        {/* Etiquetas Eje X Verticales / Rotadas */}
                        {puntosCurvaSFiltrados.map((pt, idx) => {
                          const xCenter = 55 + idx * xStep
                          return (
                            <g key={`lbl-${idx}`} transform={`translate(${xCenter}, 185) rotate(-90)`}>
                              <text
                                x="0"
                                y="3"
                                textAnchor="end"
                                fontSize="7.5"
                                fill={pt.tieneEstimacion ? '#9B0F06' : '#4b5563'}
                                fontWeight={pt.tieneEstimacion ? 'bold' : 'normal'}
                                fontFamily="sans-serif"
                              >
                                {pt.nombreEstimacionMes ? `${pt.fecha} (${pt.nombreEstimacionMes})` : pt.fecha}
                              </text>
                            </g>
                          )
                        })}
                      </svg>
                    )
                  }

                  const maxMonto = Math.max(1, montoBaseCurva * 1.2)

                  const ptsProg = puntosCurvaSFiltrados.map((p, idx) => {
                    const yVal = esPorcentaje
                      ? 175 - ((p.prog + 20) / 140) * 145
                      : 175 - ((p.montoProg / maxMonto) * 145)
                    return {
                      x: 55 + idx * xStep,
                      y: Math.max(15, Math.min(185, yVal)),
                      data: p,
                    }
                  })

                  const ptsReal = puntosCurvaSFiltrados
                    .filter((p) => p.real !== null)
                    .map((p) => {
                      const idx = puntosCurvaSFiltrados.findIndex((it) => it.mes === p.mes && it.fecha === p.fecha)
                      const yVal = esPorcentaje
                        ? 175 - (((p.real as number) + 20) / 140) * 145
                        : 175 - (((p.montoReal as number) / maxMonto) * 145)
                      return {
                        x: 55 + (idx >= 0 ? idx : 0) * xStep,
                        y: Math.max(15, Math.min(185, yVal)),
                        data: p,
                      }
                    })

                  const dProg = ptsProg.reduce((acc, curr, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${curr.x} ${curr.y}`, '')
                  const dReal = ptsReal.reduce((acc, curr, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${curr.x} ${curr.y}`, '')

                  // Configuración de Ticks Eje Y
                  const ticksY = esPorcentaje
                    ? [-20, 0, 20, 40, 60, 80, 100, 120].map((pct) => ({
                        y: 175 - ((pct + 20) / 140) * 145,
                        label: `${pct.toFixed(2)}%`,
                      }))
                    : [0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2].map((f) => {
                        const val = f * montoBaseCurva
                        const y = 175 - (val / maxMonto) * 145
                        const labelQ = val >= 1_000_000
                          ? `Q ${(val / 1_000_000).toFixed(1)}M`
                          : `Q ${(val / 1000).toFixed(0)}k`
                        return { y, label: labelQ }
                      })

                  return (
                    <svg viewBox={`0 0 ${svgWidth} 250`} className="w-full h-auto max-h-[320px] overflow-visible">
                      {/* Cuadrícula Horizontal Y */}
                      {ticksY.map((t, idx) => (
                        <g key={idx}>
                          <line x1="50" y1={t.y} x2={svgWidth - 20} y2={t.y} stroke="#e5e7eb" strokeWidth="1" />
                          <text x="44" y={t.y + 3} textAnchor="end" fontSize="8" fill="#4b5563" fontFamily="sans-serif" fontWeight="500">
                            {t.label}
                          </text>
                        </g>
                      ))}

                      {/* Ejes X y Y */}
                      <line x1="50" y1="30" x2="50" y2="175" stroke="#d1d5db" strokeWidth="1.5" />
                      <line x1="50" y1="175" x2={svgWidth - 20} y2="175" stroke="#d1d5db" strokeWidth="1.5" />

                      {/* Línea Azul: % Prog Acum Mensual */}
                      <path d={dProg} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                      {/* Línea Roja / Granate: % Ejecut Acum Mensual */}
                      <path d={dReal} fill="none" stroke="#9B0F06" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                      {/* Puntos Interactivos Programados */}
                      {ptsProg.map((pt, idx) => (
                        <circle
                          key={`prog-${idx}`}
                          cx={pt.x}
                          cy={pt.y}
                          r="2.5"
                          fill="#ffffff"
                          stroke="#2563eb"
                          strokeWidth="1.5"
                          className="transition-all hover:r-4 cursor-pointer"
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect()
                            setTooltipCurva({
                              x: rect.left,
                              y: rect.top,
                              visible: true,
                              data: pt.data,
                            })
                          }}
                          onMouseLeave={() => setTooltipCurva(null)}
                        />
                      ))}

                      {/* Puntos Interactivos Reales */}
                      {ptsReal.map((pt, idx) => {
                        const esCorte = pt.data.esCorte
                        return (
                          <circle
                            key={`real-${idx}`}
                            cx={pt.x}
                            cy={pt.y}
                            r={esCorte ? '4' : '2.5'}
                            fill={esCorte ? '#9B0F06' : '#ffffff'}
                            stroke="#9B0F06"
                            strokeWidth="2"
                            className="transition-all hover:r-4 cursor-pointer"
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect()
                              setTooltipCurva({
                                x: rect.left,
                                y: rect.top,
                                visible: true,
                                data: pt.data,
                              })
                            }}
                            onMouseLeave={() => setTooltipCurva(null)}
                          />
                        )
                      })}

                      {/* Etiquetas Eje X Verticales / Rotadas */}
                      {ptsProg.map((pt, idx) => (
                        <g key={`lbl-${idx}`} transform={`translate(${pt.x}, 185) rotate(-90)`}>
                          <text
                            x="0"
                            y="3"
                            textAnchor="end"
                            fontSize="7.5"
                            fill={pt.data.esCorte ? '#9B0F06' : '#4b5563'}
                            fontWeight={pt.data.esCorte ? 'bold' : 'normal'}
                            fontFamily="sans-serif"
                          >
                            {pt.data.fecha}
                          </text>
                        </g>
                      ))}
                    </svg>
                  )
                })()}
              </div>

              {/* Tooltip Flotante */}
              {tooltipCurva && tooltipCurva.visible && (
                <div
                  className="absolute z-30 pointer-events-none rounded-lg border border-gray-200 bg-white/95 p-2.5 shadow-lg backdrop-blur-md transition-all font-sans text-[10px]"
                  style={{
                    left: '50%',
                    top: '10px',
                    transform: 'translateX(-50%)',
                    minWidth: '260px',
                  }}
                >
                  <div className="flex items-center justify-between border-b border-gray-100 pb-0.5 mb-1.5">
                    <span className="font-extrabold text-gray-900">{tooltipCurva.data.mes}</span>
                    {tooltipCurva.data.nombreEstimacionMes ? (
                      <span className="rounded bg-red-100 text-[#9B0F06] font-bold px-1.5 py-0.2 text-[8px]">
                        {tooltipCurva.data.nombreEstimacionMes}
                      </span>
                    ) : tooltipCurva.data.esCorte ? (
                      <span className="rounded bg-red-100 text-[#9B0F06] font-black px-1 text-[7.5px] uppercase">
                        Corte Actual
                      </span>
                    ) : null}
                  </div>

                  {tooltipCurva.data.esComparativa || tipoMetricaCurva === 'comparativa' ? (
                    <div className="space-y-1 font-mono text-[9.5px]">
                      <div className="flex justify-between text-blue-700">
                        <span className="font-sans font-semibold">Esperado (Plan de Trabajo):</span>
                        <span className="font-bold">
                          Q {(tooltipCurva.data.montoEsperadoMes || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="flex justify-between text-[#9B0F06]">
                        <span className="font-sans font-semibold">Estimación Ejecutada:</span>
                        <span className="font-bold">
                          {tooltipCurva.data.tieneEstimacion || tooltipCurva.data.real !== null
                            ? `Q ${(tooltipCurva.data.montoEstimadoMes || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`
                            : 'Pendiente de registro'}
                        </span>
                      </div>

                      {(tooltipCurva.data.tieneEstimacion || tooltipCurva.data.real !== null) && (
                        <div className="mt-1 pt-1 border-t border-gray-100 flex items-center justify-between font-sans">
                          <span className="font-bold text-gray-600">Diferencia:</span>
                          {(() => {
                            const dif = (tooltipCurva.data.montoEstimadoMes || 0) - (tooltipCurva.data.montoEsperadoMes || 0)
                            const pct = tooltipCurva.data.montoEsperadoMes > 0
                              ? ((tooltipCurva.data.montoEstimadoMes || 0) / tooltipCurva.data.montoEsperadoMes) * 100
                              : 100
                            return (
                              <span className={`font-black text-[9px] ${dif >= 0 ? 'text-emerald-700' : 'text-[#9B0F06]'}`}>
                                {dif >= 0 ? '+' : ''}Q {dif.toLocaleString('es-GT', { minimumFractionDigits: 2 })} ({pct.toFixed(1)}%)
                              </span>
                            )
                          })()}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-0.5 font-mono text-[9.5px]">
                      <div className="flex justify-between text-blue-700">
                        <span className="font-sans font-semibold">Esperado (Plan):</span>
                        <span className="font-bold">
                          {tooltipCurva.data.prog.toFixed(2)}% (Q {tooltipCurva.data.montoProg.toLocaleString('es-GT', { minimumFractionDigits: 2 })})
                        </span>
                      </div>

                      {tooltipCurva.data.real !== null ? (
                        <>
                          <div className="flex justify-between text-[#9B0F06]">
                            <span className="font-sans font-semibold">Estimación Real:</span>
                            <span className="font-bold">
                              {tooltipCurva.data.real.toFixed(2)}% (Q {(tooltipCurva.data.montoReal ?? 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })})
                            </span>
                          </div>

                          <div className="mt-1 pt-0.5 border-t border-gray-100 flex items-center justify-between font-sans">
                            <span className="font-bold text-gray-600">Variación:</span>
                            <span
                              className={`font-black text-[8.5px] ${
                                tooltipCurva.data.variacion >= 0 ? 'text-emerald-700' : 'text-[#9B0F06]'
                              }`}
                            >
                              {tooltipCurva.data.variacion >= 0 ? '+' : ''}
                              {tooltipCurva.data.variacion.toFixed(2)}% {tooltipCurva.data.variacion >= 0 ? '(Adelanto)' : '(Retraso)'}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="mt-0.5 text-center text-gray-400 font-sans italic text-[8.5px]">
                          Proyección futura
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Leyenda en la parte inferior centrada */}
            <div className="flex items-center justify-center gap-6 pt-2 border-t border-gray-100 text-[10px] font-semibold">
              <span className="flex items-center gap-2 text-gray-700">
                <span className={`inline-block rounded ${tipoMetricaCurva === 'comparativa' ? 'h-2.5 w-3 bg-[#2563eb]' : 'h-0.5 w-6 bg-[#2563eb]'}`} />
                {tipoMetricaCurva === 'porcentaje'
                  ? '% Esperado Acumulado (Plan de Trabajo)'
                  : tipoMetricaCurva === 'monto'
                  ? 'Monto Esperado Acumulado (Plan de Trabajo)'
                  : 'Monto Esperado Mensual (Plan de Trabajo)'}
              </span>
              <span className="flex items-center gap-2 text-gray-700">
                <span className={`inline-block rounded ${tipoMetricaCurva === 'comparativa' ? 'h-2.5 w-3 bg-[#9B0F06]' : 'h-0.5 w-6 bg-[#9B0F06]'}`} />
                {tipoMetricaCurva === 'porcentaje'
                  ? '% Estimaciones Acumulado (Ejecutado)'
                  : tipoMetricaCurva === 'monto'
                  ? 'Monto Estimaciones Acumulado (Ejecutado)'
                  : 'Monto Estimación Ejecutada'}
              </span>
            </div>

            {/* Resumen Compacto de Desviación y Rendimiento Dinámico */}
            {(() => {
              const puntoCorte = puntosCurvaSFiltrados.find((p) => p.esCorte) || puntosCurvaSFiltrados[0] || puntosCurvaS[0]
              const desviacionVal = puntoCorte?.variacion ?? 0
              const spiVal = (puntoCorte && puntoCorte.prog > 0 && puntoCorte.real !== null)
                ? (puntoCorte.real / puntoCorte.prog)
                : (Number(proyecto?.avance || 0) > 0 ? 1.0 : 0)
              const mesCorteTexto = puntoCorte?.mes || 'A la fecha'

              return (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] font-mono pt-2">
                  <div className="rounded-lg border border-gray-200 bg-gray-50/70 p-2">
                    <span className="text-[8px] font-bold uppercase tracking-wider text-gray-500 font-sans block">
                      Desviación ({mesCorteTexto})
                    </span>
                    <p className={`text-[12px] font-black mt-0.5 ${desviacionVal >= 0 ? 'text-emerald-700' : 'text-[#9B0F06]'}`}>
                      {desviacionVal >= 0 ? '+' : ''}{desviacionVal.toFixed(2)}% ({desviacionVal >= 0 ? 'Adelanto vs Plan' : 'Desfase vs Plan'})
                    </p>
                    <span className="text-[7.5px] text-gray-400 font-sans">
                      Prog: {puntoCorte?.prog?.toFixed(2) ?? '0.00'}% vs Real: {puntoCorte?.real?.toFixed(2) ?? '0.00'}%
                    </span>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-gray-50/70 p-2">
                    <span className="text-[8px] font-bold uppercase tracking-wider text-gray-500 font-sans block">
                      Índice de Rendimiento (SPI)
                    </span>
                    <p className={`text-[12px] font-black mt-0.5 ${spiVal >= 1 ? 'text-emerald-700' : 'text-[#9B0F06]'}`}>
                      {spiVal.toFixed(2)} ({spiVal >= 1 ? 'Rendimiento Favorable' : 'Rendimiento con Desfase'})
                    </p>
                    <span className="text-[7.5px] text-gray-400 font-sans">
                      {spiVal >= 1 ? 'Ritmo superior o conforme al plan base' : 'Requiere ajuste de ritmo'}
                    </span>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-gray-50/70 p-2">
                    <span className="text-[8px] font-bold uppercase tracking-wider text-gray-500 font-sans block">
                      Anticipo Pendiente de Amortizar
                    </span>
                    <p className="text-[12px] font-black text-gray-900 mt-0.5">
                      Q {saldoAnticipoPendiente.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                    </p>
                    <span className="text-[7.5px] text-gray-400 font-sans">
                      Amortizado: Q {totalAmortizadoAnticipo.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )
            })()}

            {/* Tabla Comparativa Detallada Mes a Mes cuando la métrica comparativa está activa */}
            {tipoMetricaCurva === 'comparativa' && (
              <div className="mt-3 space-y-2 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-900 uppercase">
                    Detalle Comparativo: Estimación vs Esperado en Plan de Trabajo
                  </h3>
                  <span className="text-[10px] text-gray-500 font-medium">
                    {puntosCurvaSFiltrados.filter((p) => p.tieneEstimacion || p.real !== null).length} períodos con estimación registrada
                  </span>
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-left font-sans text-[10px]">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50 text-[8px] font-extrabold uppercase tracking-wider text-gray-600">
                        <th className="px-3 py-1.5">Período / Mes</th>
                        <th className="px-3 py-1.5">Estimación</th>
                        <th className="px-3 py-1.5 text-right">Monto Esperado (Plan)</th>
                        <th className="px-3 py-1.5 text-right">Monto Estimación (Real)</th>
                        <th className="px-3 py-1.5 text-right">Diferencia (Q)</th>
                        <th className="px-3 py-1.5 text-center">Cumplimiento</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-mono text-[9.5px]">
                      {puntosCurvaSFiltrados.map((p, idx) => {
                        const tieneReal = p.tieneEstimacion || p.real !== null
                        const dif = (p.montoEstimadoMes || 0) - (p.montoEsperadoMes || 0)
                        const pct = p.montoEsperadoMes > 0
                          ? ((p.montoEstimadoMes || 0) / p.montoEsperadoMes) * 100
                          : 100

                        return (
                          <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                            <td className="px-3 py-1.5 font-sans font-semibold text-gray-900">
                              {p.mes}
                            </td>
                            <td className="px-3 py-1.5 font-sans">
                              {p.nombreEstimacionMes ? (
                                <span className="font-bold text-gray-900">{p.nombreEstimacionMes}</span>
                              ) : (
                                <span className="text-gray-400 font-sans italic text-[8.5px]">Sin estimación</span>
                              )}
                            </td>
                            <td className="px-3 py-1.5 text-right text-gray-900 font-semibold">
                              Q {(p.montoEsperadoMes || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-3 py-1.5 text-right font-bold text-gray-900">
                              {tieneReal
                                ? `Q ${(p.montoEstimadoMes || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`
                                : <span className="text-gray-400 font-sans font-normal italic text-[8.5px]">Proyección</span>}
                            </td>
                            <td className="px-3 py-1.5 text-right font-bold text-gray-900">
                              {tieneReal
                                ? `${dif >= 0 ? '+' : ''}Q ${dif.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`
                                : '—'}
                            </td>
                            <td className="px-3 py-1.5 text-center font-sans">
                              {tieneReal ? (
                                <span className="font-bold text-[9px] text-gray-900">
                                  {pct.toFixed(1)}% {dif >= 0 ? '(Adelanto)' : '(Desfase)'}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-[8.5px] italic">Pendiente</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Modal Bottom Sheet de Filtros Curva S en Móvil */}
            {modalFiltrosCurvaOpen && (
              <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4">
                <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-gray-200 p-4 space-y-4 font-[Poppins] animate-in fade-in slide-in-from-bottom duration-200">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Filter size={14} className="text-[#9B0F06]" />
                      <h3 className="text-xs font-bold text-gray-900">Filtros del Gráfico Financiero</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModalFiltrosCurvaOpen(false)}
                      className="rounded-md p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    {/* Filtro por Año */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                        Año Calendario
                      </label>
                      <select
                        value={filtroAnioCurva}
                        onChange={(e) => setFiltroAnioCurva(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-800 focus:border-[#9B0F06] focus:bg-white focus:outline-none cursor-pointer"
                      >
                        <option value="todos">Todos los Años</option>
                        {aniosDisponiblesCurva.map((a) => (
                          <option key={a} value={String(a)}>{a}</option>
                        ))}
                      </select>
                    </div>

                    {/* Métrica */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                        Tipo de Métrica
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setTipoMetricaCurva('porcentaje')}
                          className={`py-2 px-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border text-center ${
                            tipoMetricaCurva === 'porcentaje'
                              ? 'bg-[#9B0F06] text-white border-[#9B0F06] shadow-xs'
                              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          % Acum.
                        </button>
                        <button
                          type="button"
                          onClick={() => setTipoMetricaCurva('monto')}
                          className={`py-2 px-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border text-center ${
                            tipoMetricaCurva === 'monto'
                              ? 'bg-[#9B0F06] text-white border-[#9B0F06] shadow-xs'
                              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          Monto (Q)
                        </button>
                        <button
                          type="button"
                          onClick={() => setTipoMetricaCurva('comparativa')}
                          className={`py-2 px-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border text-center ${
                            tipoMetricaCurva === 'comparativa'
                              ? 'bg-[#9B0F06] text-white border-[#9B0F06] shadow-xs'
                              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          Plan Esperado
                        </button>
                      </div>
                    </div>

                    {/* Rango de Fechas */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                          Fecha Desde
                        </label>
                        <input
                          type="date"
                          value={fechaDesdeCurva}
                          onChange={(e) => setFechaDesdeCurva(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-800 focus:border-[#9B0F06] focus:bg-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                          Fecha Hasta
                        </label>
                        <input
                          type="date"
                          value={fechaHastaCurva}
                          onChange={(e) => setFechaHastaCurva(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-800 focus:border-[#9B0F06] focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        setFiltroAnioCurva('todos')
                        setFechaDesdeCurva('')
                        setFechaHastaCurva('')
                        setTipoMetricaCurva('porcentaje')
                      }}
                      className="text-[11px] font-bold text-gray-500 hover:text-[#9B0F06] cursor-pointer"
                    >
                      Restablecer
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalFiltrosCurvaOpen(false)}
                      className="rounded-lg bg-[#9B0F06] px-4 py-2 text-xs font-bold text-white hover:bg-[#7A0C0D] transition-colors cursor-pointer shadow-xs"
                    >
                      Aplicar Filtros
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* MODAL REGISTRO / EDICIÓN DE ESTIMACIÓN MANUAL */}
      {modalEstimacionManualOpen && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-3 sm:p-5 md:p-8 backdrop-blur-xs font-[Poppins]"
          onClick={() => setModalEstimacionManualOpen(false)}
        >
          <div
            className="w-full max-w-4xl lg:max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Barra superior institucional */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#9B0F06] via-red-600 to-[#9B0F06]" />

            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50/70">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-[#9B0F06] border border-red-100 shadow-2xs">
                  <Calculator size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    {estimacionEnEdicion ? `Editar Estimación: ${estimacionEnEdicion.numero}` : 'Nueva Estimación Manual'}
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200">
                      {formEstPerspectiva === 'ejecutora' ? 'Empresa Ejecutora' : 'Empresa Supervisora'}
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Registro de liquidación contractual y control financiero de la obra
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalEstimacionManualOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                title="Cerrar modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleGuardarEstimacionManual} className="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-xs">
              {/* Sección 1: Identificación y Perspectiva */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* No. de Estimación (Progresivo por defecto) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-gray-700">
                      No. de Estimación <span className="text-[#9B0F06]">*</span>
                    </label>
                    <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                      Progresivo
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={formEstNumero}
                      onChange={(e) => setFormEstNumero(e.target.value)}
                      placeholder="Ej: Est. 06"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-2 font-mono text-xs font-bold text-gray-800 focus:outline-none focus:border-[#9B0F06]"
                      title="Número correlativo de la estimación."
                    />
                  </div>
                </div>

                {/* Concepto / Descripción Opcional */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Descripción / Concepto <span className="text-gray-400 font-normal">(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={formEstNombre}
                    onChange={(e) => setFormEstNombre(e.target.value)}
                    placeholder="Ej: Obras Preliminares, Tramo 2..."
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 focus:border-[#9B0F06] focus:outline-none"
                  />
                </div>

                {/* Perspectiva Contractual */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Perspectiva Contractual
                  </label>
                  <select
                    value={formEstPerspectiva}
                    onChange={(e) => {
                      const nuevaPerspectiva = e.target.value as 'ejecutora' | 'supervisora'
                      setFormEstPerspectiva(nuevaPerspectiva)
                      if (!estimacionEnEdicion) {
                        const numStr = calcularSiguienteNumeroEstimacion(nuevaPerspectiva)
                        const numDigitos = numStr.replace(/\D/g, '')
                        setFormEstNumero(numStr)
                        setFormEstNombre(`Estimación No. ${numDigitos || '01'}`)
                        setFormEstPctAmortizacion(nuevaPerspectiva === 'ejecutora' ? pctAnticipoEjecucionNum.toString() : pctAnticipoSupervisionNum.toString())
                      }
                    }}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 focus:border-[#9B0F06] focus:outline-none"
                  >
                    <option value="ejecutora">Empresa Ejecutora (Contratista)</option>
                    <option value="supervisora">Empresa Supervisora (DGC)</option>
                  </select>
                </div>
              </div>

              {/* Sección 2: Período y Fechas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Fecha Inicio</label>
                  <input
                    type="date"
                    value={formEstFechaInicio}
                    onChange={(e) => setFormEstFechaInicio(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 focus:border-[#9B0F06] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Fecha Fin</label>
                  <input
                    type="date"
                    value={formEstFechaFin}
                    onChange={(e) => setFormEstFechaFin(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 focus:border-[#9B0F06] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Mes / Período</label>
                  <input
                    type="text"
                    value={formEstMes}
                    onChange={(e) => setFormEstMes(e.target.value)}
                    placeholder="Ej: Octubre 2026"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 focus:border-[#9B0F06] focus:outline-none"
                  />
                </div>
              </div>

              {/* Sección 3: Liquidación Financiera Directa */}
              <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
                    <Banknote size={14} className="text-[#9B0F06]" />
                    Liquidación Financiera y Amortización Directa
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    Presupuesto Base: Q {montoAjustadoVigente.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Valor Bruto Trabajado (Q) <span className="text-[#9B0F06]">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formEstValorBruto}
                      onChange={(e) => {
                        const val = e.target.value
                        setFormEstValorBruto(val)
                        const bruto = parseFloat(val) || 0
                        const pct = parseFloat(formEstPctAmortizacion) || 0
                        const amort = (bruto * pct) / 100
                        setFormEstMontoLiquido((bruto - amort).toFixed(2))
                      }}
                      placeholder="0.00"
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 font-mono text-xs font-bold text-gray-900 focus:border-[#9B0F06] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      % Amortización Anticipo
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formEstPctAmortizacion}
                      onChange={(e) => {
                        const val = e.target.value
                        setFormEstPctAmortizacion(val)
                        const bruto = parseFloat(formEstValorBruto) || 0
                        const pct = parseFloat(val) || 0
                        const amort = (bruto * pct) / 100
                        setFormEstMontoLiquido((bruto - amort).toFixed(2))
                      }}
                      placeholder="20"
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 font-mono text-xs text-gray-800 focus:border-[#9B0F06] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Líquido a Pagar (Q)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formEstMontoLiquido}
                      onChange={(e) => setFormEstMontoLiquido(e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 font-mono text-xs font-black text-[#9B0F06] focus:border-[#9B0F06] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Saldo Contractual Restante (Q)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formEstSaldoRestante}
                      onChange={(e) => setFormEstSaldoRestante(e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 font-mono text-xs text-gray-800 focus:border-[#9B0F06] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 4: Estado, Rendimiento y Días de Retraso */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Estado de la Estimación
                  </label>
                  <select
                    value={formEstEstado}
                    onChange={(e) => setFormEstEstado(e.target.value as any)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 focus:border-[#9B0F06] focus:outline-none"
                  >
                    <option value="borrador">Borrador (Editable y eliminable)</option>
                    <option value="en_revision">En Revisión (Protegida)</option>
                    <option value="aprobada">Aprobada (Protegida)</option>
                    <option value="pagada">Pagada (Protegida)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Rendimiento (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formEstRendimiento}
                    onChange={(e) => setFormEstRendimiento(e.target.value)}
                    placeholder="100"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 font-mono text-xs text-gray-800 focus:border-[#9B0F06] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Días Retraso</label>
                  <input
                    type="number"
                    value={formEstDiasRetraso}
                    onChange={(e) => setFormEstDiasRetraso(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 font-mono text-xs text-gray-800 focus:border-[#9B0F06] focus:outline-none"
                  />
                </div>
              </div>

              {/* Banner contextual de seguridad según el estado */}
              {formEstEstado === 'borrador' ? (
                <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-emerald-800">
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                  <p className="text-[11px] font-medium leading-relaxed">
                    <strong>Modo Borrador activo:</strong> Esta estimación se puede editar libremente y <strong>se puede eliminar</strong> mientras conserve este estado.
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-amber-800">
                  <AlertTriangle size={16} className="shrink-0 text-amber-600" />
                  <p className="text-[11px] font-medium leading-relaxed">
                    <strong>Estado {formEstEstado.toUpperCase()}:</strong> Esta estimación está protegida contra eliminación para preservar los registros contractuales. Para poder borrarla, debes cambiar su estado a <strong>Borrador</strong>.
                  </p>
                </div>
              )}

              {/* Observaciones */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Observaciones / Notas de Campo
                </label>
                <textarea
                  rows={2}
                  value={formEstObservaciones}
                  onChange={(e) => setFormEstObservaciones(e.target.value)}
                  placeholder="Detalles sobre avance físico, justificación o notas técnicas..."
                  className="w-full rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-800 focus:border-[#9B0F06] focus:outline-none"
                />
              </div>

              {/* Footer de Acciones del Formulario */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
                <div>
                  {estimacionEnEdicion && (
                    formEstEstado === 'borrador' ? (
                      <button
                        type="button"
                        onClick={() => {
                          handleEliminarEstimacionManual(estimacionEnEdicion.id)
                          setModalEstimacionManualOpen(false)
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition-colors cursor-pointer shadow-2xs"
                        title="Eliminar estimación en modo borrador"
                      >
                        <Trash2 size={13} />
                        <span>Eliminar Estimación</span>
                      </button>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 text-[10px] text-gray-400 font-medium bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                        <Lock size={11} className="text-gray-400" />
                        <span>Solo eliminable en estado Borrador</span>
                      </div>
                    )
                  )}
                </div>

                <div className="flex items-center gap-2.5 ml-auto">
                  <button
                    type="button"
                    onClick={() => setModalEstimacionManualOpen(false)}
                    className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#9B0F06] hover:bg-[#7a0c05] text-white px-5 py-2 text-xs font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    <CheckCircle2 size={14} />
                    <span>Guardar Estimación</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN DE ESTIMACIÓN */}
      {estimacionParaEliminar && (
        <div
          className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs font-[Poppins]"
          onClick={() => setEstimacionParaEliminar(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-gray-200 animate-fadeIn space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-[#9B0F06]">
                <Trash2 size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">¿Eliminar estimación en borrador?</h4>
                <p className="text-xs text-gray-500 font-medium">{estimacionParaEliminar.numero}</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100 leading-relaxed">
              ¿Deseas eliminar la estimación <strong>{estimacionParaEliminar.numero}</strong> ({estimacionParaEliminar.nombreEstimacion})? Al encontrarse en estado <strong>Borrador</strong>, puede removerse con total seguridad.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEstimacionParaEliminar(null)}
                className="rounded-xl border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  handleEliminarEstimacionManual(estimacionParaEliminar.id)
                  setEstimacionParaEliminar(null)
                }}
                className="rounded-xl bg-[#9B0F06] hover:bg-[#7a0c05] text-white px-4 py-1.5 text-xs font-bold cursor-pointer transition-colors"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PRINCIPAL: GESTIÓN DE RENGLONES Y CAPÍTULOS DEL PROYECTO */}
      {modalGestionRenglonesOpen && (
        <Portal>
          <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs font-[Poppins]"
            onClick={() => setModalGestionRenglonesOpen(false)}
          >
            <div
              className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-[#9B0F06] px-5 py-3.5 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white">
                    <Layers size={18} />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold tracking-wide">Gestión de Renglones y Capítulos de Obra</h2>
                    <p className="text-[10px] text-gray-300 font-normal">
                      Configuración de catálogo para Bitácora y control contractual del proyecto
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalGestionRenglonesOpen(false)}
                  className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Subtabs del Modal */}
              <div className="border-b border-gray-200 bg-gray-50 px-5 pt-2 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSubTabGestion('renglones')}
                    className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-[11px] font-semibold transition-colors cursor-pointer ${
                      subTabGestion === 'renglones'
                        ? 'border-[#9B0F06] text-[#9B0F06] bg-white rounded-t-lg'
                        : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <FileSpreadsheet size={13} />
                    <span>Renglones ({listaRenglones.length || listaRenglonesFuente.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubTabGestion('capitulos')}
                    className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-[11px] font-semibold transition-colors cursor-pointer ${
                      subTabGestion === 'capitulos'
                        ? 'border-[#9B0F06] text-[#9B0F06] bg-white rounded-t-lg'
                        : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <Layers size={13} />
                    <span>Capítulos ({capitulosProyecto.length})</span>
                  </button>
                </div>

                <div className="pb-1.5 flex items-center gap-2">
                  {subTabGestion === 'renglones' && (() => {
                    const baseR = (listaRenglones.length > 0 ? listaRenglones : listaRenglonesFuente) || []
                    const totalHab = baseR.filter((r) => r.seleccionado !== false).length
                    const todosHab = baseR.length > 0 && totalHab === baseR.length
                    const algunoHab = totalHab > 0 && totalHab < baseR.length
                    const ningunoHab = totalHab === 0

                    return (
                      <>
                        <div className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2 py-1 text-[10px] sm:text-xs shadow-2xs hover:border-gray-300 transition-all">
                          <input
                            type="checkbox"
                            ref={(el) => {
                              if (el) el.indeterminate = algunoHab
                            }}
                            checked={todosHab}
                            onChange={(e) => handleSeleccionarTodosBitacora(e.target.checked)}
                            title={todosHab ? 'Ocultar todos en bitácora' : 'Habilitar todos en bitácora'}
                            className="h-3.5 w-3.5 rounded border-gray-300 text-[#9B0F06] focus:ring-[#9B0F06] cursor-pointer"
                          />
                          <select
                            value={todosHab ? 'todos' : ningunoHab ? 'ninguno' : 'parcial'}
                            onChange={(e) => {
                              if (e.target.value === 'todos') handleSeleccionarTodosBitacora(true)
                              if (e.target.value === 'ninguno') handleSeleccionarTodosBitacora(false)
                            }}
                            className="bg-transparent text-[10px] sm:text-xs font-bold text-gray-700 focus:outline-none cursor-pointer"
                          >
                            <option value="todos">Bitácora: Habilitar Todos ({baseR.length})</option>
                            <option value="ninguno">Bitácora: Ocultar Todos</option>
                            {algunoHab && (
                              <option value="parcial" disabled>
                                Bitácora: {totalHab} de {baseR.length} activos
                              </option>
                            )}
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setModalGestionRenglonesOpen(false)
                            handleAbrirCrearRenglon()
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-[#9B0F06] px-3 py-1.5 text-[10px] font-medium text-white hover:bg-[#5E0006] transition-colors cursor-pointer shadow-2xs"
                        >
                          <Plus size={12} />
                          <span>Nuevo Renglón</span>
                        </button>
                      </>
                    )
                  })()}
                  {subTabGestion === 'capitulos' && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormCapituloNumero(String(capitulosProyecto.length + 1))
                        setFormCapituloNombre('')
                        setModalCapituloOpen(true)
                      }}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#9B0F06] px-3 py-1.5 text-[10px] font-medium text-white hover:bg-[#5E0006] transition-colors cursor-pointer shadow-2xs"
                    >
                      <Plus size={12} />
                      <span>Nuevo Capítulo</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Contenido por pestaña */}
              <div className="p-4 overflow-y-auto flex-1 bg-gray-50/50">
                {subTabGestion === 'renglones' && (
                  <div className="space-y-3 font-[Poppins]">
                    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-2xs">
                      <div className="overflow-x-auto max-h-[55vh]">
                        <table className="w-full text-left text-[10.5px] border-collapse font-sans">
                          <thead className="sticky top-0 z-10 bg-gray-100 text-gray-700 font-semibold uppercase text-[9px] tracking-wider border-b border-gray-200">
                            <tr>
                              <th className="px-3 py-2">Código DGC</th>
                              <th className="px-3 py-2">Descripción del Renglón</th>
                              <th className="px-3 py-2">Capítulo</th>
                              {!modoManual && (
                                <>
                                  <th className="px-3 py-2 text-center">Unidad</th>
                                  <th className="px-3 py-2 text-right">Cantidad</th>
                                  <th className="px-3 py-2 text-right">P. Unitario (Q)</th>
                                  <th className="px-3 py-2 text-center">En Bitácora</th>
                                </>
                              )}
                              <th className="px-3 py-2 text-center">Registros</th>
                              <th className="px-3 py-2 text-center">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-[10px]">
                            {(listaRenglones.length > 0 ? listaRenglones : listaRenglonesFuente).map((r) => {
                              const countBit =
                                (conteoBitacoraPorRenglon[r.codigoDGC] || 0) +
                                (conteoBitacoraPorRenglon[r.id] || 0) +
                                (r.renglonId ? (conteoBitacoraPorRenglon[r.renglonId] || 0) : 0)

                              return (
                                <tr key={r.id || r.codigoDGC} className="hover:bg-red-50/30 transition-colors">
                                  <td className="px-3 py-2 font-mono font-bold text-gray-900">
                                    <span className="rounded bg-gray-100 px-1.5 py-0.5 border border-gray-200">
                                      {r.codigoDGC}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 font-medium text-gray-800">
                                    {r.descripcion}
                                  </td>
                                  <td className="px-3 py-2 text-gray-500">
                                    {r.capituloNombre || `Capítulo ${r.capituloId}`}
                                  </td>
                                  {!modoManual && (
                                    <>
                                      <td className="px-3 py-2 text-center font-bold text-gray-600">
                                        {r.unidad}
                                      </td>
                                      <td className="px-3 py-2 text-right font-semibold text-gray-800">
                                        {r.cantidadContratada.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                                      </td>
                                      <td className="px-3 py-2 text-right font-semibold text-gray-700">
                                        Q {r.costoUnitarioDirecto.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                                      </td>
                                      <td className="px-3 py-2 text-center">
                                        <button
                                          type="button"
                                          onClick={() => handleToggleBitacora(r.codigoDGC)}
                                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[8.5px] font-bold border cursor-pointer transition-all ${
                                            r.seleccionado !== false
                                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                              : 'bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200'
                                          }`}
                                        >
                                          <span className={`h-1.5 w-1.5 rounded-full ${r.seleccionado !== false ? 'bg-emerald-600' : 'bg-gray-400'}`} />
                                          <span>{r.seleccionado !== false ? 'Visible' : 'Oculto'}</span>
                                        </button>
                                      </td>
                                    </>
                                  )}
                                  <td className="px-3 py-2 text-center">
                                    <span
                                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[8.5px] font-bold border ${
                                        countBit > 0
                                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                                          : 'bg-gray-50 text-gray-400 border-gray-200'
                                      }`}
                                    >
                                      <FileText size={10} className={countBit > 0 ? 'text-blue-600' : 'text-gray-400'} />
                                      <span>{countBit}</span>
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setModalGestionRenglonesOpen(false)
                                          handleAbrirEditarRenglon(r)
                                        }}
                                        className="p-1 rounded text-gray-600 hover:bg-gray-100 hover:text-[#9B0F06] transition-colors cursor-pointer"
                                        title="Editar renglón"
                                      >
                                        <Edit2 size={11} />
                                      </button>
                                      {r.esPersonalizado && (
                                        <button
                                          type="button"
                                          onClick={() => handleEliminarRenglonPersonalizado(r.codigoDGC)}
                                          className="p-1 rounded text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                                          title="Eliminar renglón"
                                        >
                                          <Trash2 size={11} />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {subTabGestion === 'capitulos' && (
                  <div className="space-y-3 font-[Poppins]">
                    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-2xs">
                      <div className="overflow-x-auto max-h-[55vh]">
                        <table className="w-full text-left text-[10.5px] border-collapse font-sans">
                          <thead className="sticky top-0 z-10 bg-gray-100 text-gray-700 font-semibold uppercase text-[9px] tracking-wider border-b border-gray-200">
                            <tr>
                              <th className="px-3 py-2 w-24">No. Capítulo</th>
                              <th className="px-3 py-2">Nombre del Capítulo</th>
                              <th className="px-3 py-2 text-center w-32">Renglones Asignados</th>
                              <th className="px-3 py-2 text-center w-28">Tipo</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-[10px]">
                            {capitulosProyecto.map((c) => {
                              const base = listaRenglones.length > 0 ? listaRenglones : listaRenglonesFuente
                              const countEnCap = base.filter((r) => r.capituloId === c.id).length
                              const esLibroAzul = c.id <= 9

                              return (
                                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-3 py-2 font-mono font-bold text-gray-900">
                                    Capítulo {c.id}
                                  </td>
                                  <td className="px-3 py-2 font-medium text-gray-800">
                                    {c.nombre.includes(':') ? c.nombre.split(':')[1]?.trim() : c.nombre}
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[8.5px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
                                      {countEnCap} {countEnCap === 1 ? 'renglón' : 'renglones'}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[8px] font-bold ${
                                      esLibroAzul ? 'bg-emerald-50 text-emerald-800' : 'bg-purple-50 text-purple-800'
                                    }`}>
                                      {esLibroAzul ? 'Libro Azul' : 'Personalizado'}
                                    </span>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 bg-white px-5 py-3 flex items-center justify-between text-[10px] text-gray-500">
                <span>Modificaciones sincronizadas con la bitácora y presupuesto del proyecto</span>
                <button
                  type="button"
                  onClick={() => setModalGestionRenglonesOpen(false)}
                  className="rounded-lg bg-gray-800 hover:bg-gray-900 text-white px-4 py-1.5 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* DRAWER LATERAL: CREAR / EDITAR RENGLÓN DE OBRA */}
      {drawerRenglonOpen && (
        <Portal>
          <div
            className="fixed inset-0 z-[130] flex justify-end bg-black/60 backdrop-blur-xs font-[Poppins] animate-in fade-in duration-200"
            onClick={() => setDrawerRenglonOpen(false)}
          >
            <div
              className="relative flex h-full max-h-screen w-full max-w-md flex-col bg-white shadow-2xl border-l border-gray-200 overflow-hidden font-sans"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50/80 px-4 py-3 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-[#9B0F06]">
                    {renglonEnEdicion ? <Edit2 size={14} /> : <Plus size={14} />}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 uppercase">
                      {renglonEnEdicion ? `Editar Renglón [${renglonEnEdicion.codigoDGC}]` : 'Nuevo Renglón de Obra'}
                    </h3>
                    <p className="text-[9.5px] text-gray-500">
                      {renglonEnEdicion ? 'Exclusivo de este proyecto: no afecta a otros proyectos' : 'Se vinculará únicamente a este proyecto para control y bitácora'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerRenglonOpen(false)}
                  className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700 cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Formulario */}
              <form onSubmit={handleGuardarRenglonFormulario} className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
                <div>
                  <label className="block text-[10.5px] font-bold text-gray-700 mb-1">
                    Código DGC del Renglón <span className="text-[#9B0F06]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formRenglonCodigo}
                    onChange={(e) => setFormRenglonCodigo(e.target.value)}
                    placeholder="Ej. 201.05, 302.01 (a) o CUSTOM-01"
                    className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 font-mono text-xs text-gray-900 focus:border-[#9B0F06] focus:outline-none"
                  />
                  <p className="text-[8.5px] text-gray-400 mt-0.5">Identificador único del renglón en el proyecto</p>
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold text-gray-700 mb-1">
                    Descripción del Renglón <span className="text-[#9B0F06]">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formRenglonDescripcion}
                    onChange={(e) => setFormRenglonDescripcion(e.target.value)}
                    placeholder="Ej. Excavación no clasificada de material de desperdicio..."
                    className="w-full rounded-lg border border-gray-200 bg-white p-2.5 text-xs text-gray-900 focus:border-[#9B0F06] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10.5px] font-bold text-gray-700 mb-1">
                      Capítulo
                    </label>
                    <select
                      value={formRenglonCapituloId}
                      onChange={(e) => setFormRenglonCapituloId(Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-800 focus:border-[#9B0F06] focus:outline-none cursor-pointer"
                    >
                      {capitulosProyecto.map((c) => (
                        <option key={c.id} value={c.id}>
                          Capítulo {c.id}: {c.nombre.includes(':') ? c.nombre.split(':')[1]?.trim() : c.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-gray-700 mb-1">
                      Unidad de Medida
                    </label>
                    <select
                      value={formRenglonUnidad}
                      onChange={(e) => setFormRenglonUnidad(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-semibold text-gray-800 focus:border-[#9B0F06] focus:outline-none cursor-pointer"
                    >
                      {['m³', 'm²', 'm', 'km', 'ton', 'Glb', 'Ha', 'kg', 'u', 'mes', 'c/u', 'lote'].map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Checkbox Habilitar en Bitácora */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="chkEnBitacora"
                    checked={formRenglonEnBitacora}
                    onChange={(e) => setFormRenglonEnBitacora(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#9B0F06] focus:ring-[#9B0F06] cursor-pointer"
                  />
                  <label htmlFor="chkEnBitacora" className="text-xs font-semibold text-gray-700 cursor-pointer select-none">
                    Habilitar inmediatamente en Bitácora de Obra
                  </label>
                </div>

                {/* Botones de acción */}
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setDrawerRenglonOpen(false)}
                    className="rounded-lg border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-[#9B0F06] hover:bg-[#5E0006] text-white px-4 py-1.5 text-xs font-bold shadow-xs cursor-pointer transition-colors"
                  >
                    {renglonEnEdicion ? 'Actualizar Renglón' : 'Guardar Renglón'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* DRAWER: VER DETALLE DE ESTIMACIÓN */}
      {drawerEstimacionVer && (
        <Portal>
          <div
            className="fixed inset-0 z-[125] flex justify-end bg-black/60 backdrop-blur-xs font-[Poppins] animate-fadeIn"
            onClick={() => setDrawerEstimacionVer(null)}
          >
            <div
              className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col font-sans overflow-hidden border-l border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50/80 px-4 py-3 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-[#9B0F06]">
                    <Receipt size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-gray-900 uppercase">
                        {drawerEstimacionVer.numero}
                      </h3>
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium truncate max-w-[280px]">
                      {drawerEstimacionVer.nombreEstimacion}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerEstimacionVer(null)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 cursor-pointer transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Contenido scrolleable */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-[Poppins]">
                {/* 4 Cards Métricas Financieras Principales */}
                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-2.5">
                    <span className="text-[8px] font-bold uppercase tracking-wider text-gray-500 font-sans block">
                      Valor Bruto Trabajado
                    </span>
                    <p className="text-[13px] font-bold text-gray-900 mt-0.5">
                      Q {drawerEstimacionVer.valorBrutoTrabajado.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                    </p>
                    <span className="text-[7.5px] text-gray-400 font-sans">
                      Monto devengado
                    </span>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-2.5">
                    <span className="text-[8px] font-bold uppercase tracking-wider text-gray-500 font-sans block">
                      Anticipo Aplicado ({drawerEstimacionVer.porcentajeAmortizacion}%)
                    </span>
                    <p className="text-[13px] font-bold text-gray-900 mt-0.5">
                      − Q {drawerEstimacionVer.montoAmortizacion.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                    </p>
                    <span className="text-[7.5px] text-gray-400 font-sans">
                      Amortización contractual
                    </span>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-2.5">
                    <span className="text-[8px] font-bold uppercase tracking-wider text-gray-500 font-sans block">
                      Líquido a Pagar
                    </span>
                    <p className="text-[13px] font-bold text-gray-900 mt-0.5">
                      Q {drawerEstimacionVer.montoLiquidoAPagar.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                    </p>
                    <span className="text-[7.5px] text-gray-400 font-sans">
                      Monto neto a desembolsar
                    </span>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-2.5">
                    <span className="text-[8px] font-bold uppercase tracking-wider text-gray-500 font-sans block">
                      Saldo Contractual Restante
                    </span>
                    <p className="text-[13px] font-bold text-gray-900 mt-0.5">
                      Q {drawerEstimacionVer.saldoContractualRestante.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                    </p>
                    <span className="text-[7.5px] text-gray-400 font-sans">
                      Saldo por devengar
                    </span>
                  </div>
                </div>

                {/* Comparativa con Plan de Trabajo para esta Estimación */}
                {(() => {
                  const pMes = puntosCurvaS.find((p) => {
                    const fFin = String(drawerEstimacionVer.fechaFin || drawerEstimacionVer.fechaCorte || '').trim()
                    if (fFin) {
                      const partes = fFin.split('-').map(Number)
                      if (partes.length >= 2 && partes[0] && partes[1]) {
                        return p.año === partes[0] && p.date.getMonth() === (partes[1] - 1)
                      }
                    }
                    return drawerEstimacionVer.mes && drawerEstimacionVer.mes.toLowerCase().includes(p.mes.toLowerCase())
                  })

                  const esperadoMes = pMes?.montoEsperadoMes || (montoBaseCurva * 0.1)
                  const estimadoMes = drawerEstimacionVer.valorBrutoTrabajado
                  const dif = estimadoMes - esperadoMes
                  const pctCumpl = esperadoMes > 0 ? (estimadoMes / esperadoMes) * 100 : 100

                  return (
                    <div className="rounded-xl border border-gray-200 bg-white p-3 space-y-2">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
                          Comparativa vs Plan de Trabajo Esperado
                        </span>
                        <span className="text-[9px] font-bold text-gray-900">
                          {pctCumpl.toFixed(1)}% cumplimiento
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 font-mono text-[10px]">
                        <div>
                          <span className="text-[8px] text-gray-400 font-sans block">Esperado (Plan)</span>
                          <span className="font-semibold text-gray-900">
                            Q {esperadoMes.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div>
                          <span className="text-[8px] text-gray-400 font-sans block">Estimado (Real)</span>
                          <span className="font-semibold text-gray-900">
                            Q {estimadoMes.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div>
                          <span className="text-[8px] text-gray-400 font-sans block">Variación</span>
                          <span className="font-bold text-gray-900">
                            {dif >= 0 ? '+' : ''}Q {dif.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* Datos Operativos y Desempeño */}
                <div className="rounded-xl border border-gray-200 bg-white p-3 space-y-2.5">
                  <h4 className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
                    Datos Operativos y Período
                  </h4>
                  <div className="space-y-2 text-[10.5px]">
                    <div className="flex items-center justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500">Período de Ejecución:</span>
                      <span className="font-medium text-gray-900">
                        {drawerEstimacionVer.fechaInicio || 'N/A'} al {drawerEstimacionVer.fechaFin || 'N/A'} ({drawerEstimacionVer.mes})
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500">Delegado Residente:</span>
                      <span className="font-medium text-gray-900">
                        {drawerEstimacionVer.delegadoResidente}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500">Supervisado Por:</span>
                      <span className="font-medium text-gray-900">
                        {drawerEstimacionVer.supervisadoPor || 'Empresa Supervisora'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500">Cumplimiento de Plazo:</span>
                      <span className="font-medium text-gray-900">
                        {drawerEstimacionVer.diasRetraso === 0 ? 'En tiempo (0 días de retraso)' : `${drawerEstimacionVer.diasRetraso} días de retraso`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span className="text-gray-500">Rendimiento Operativo:</span>
                      <span className="font-bold text-gray-900">
                        {drawerEstimacionVer.porcentajeRendimiento.toFixed(1)}% ({drawerEstimacionVer.calificacionDesempeno.toUpperCase()})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Observaciones */}
                <div className="rounded-xl border border-gray-200 bg-white p-3 space-y-1">
                  <h4 className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
                    Observaciones Técnicas
                  </h4>
                  <p className="text-[10px] text-gray-700 leading-relaxed font-sans">
                    {drawerEstimacionVer.observaciones || 'Sin observaciones técnicas adicionales registradas para este período.'}
                  </p>
                </div>
              </div>

              {/* Footer con Acciones */}
              <div className="flex items-center justify-between gap-2 border-t border-gray-200 bg-gray-50/80 p-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setDrawerEstimacionVer(null)}
                  className="rounded-lg border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  Cerrar
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const est = drawerEstimacionVer
                      setDrawerEstimacionVer(null)
                      handleAbrirEditarEstimacionManual(est)
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <Edit2 size={12} />
                    <span>Editar</span>
                  </button>

                  {tieneAccesoHojaSabana && (
                    <button
                      type="button"
                      onClick={() => {
                        const num = drawerEstimacionVer.numero
                        setDrawerEstimacionVer(null)
                        navegarAHojaSabana({ estimacion: num })
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#9B0F06] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#7a0c05] cursor-pointer transition-colors shadow-xs"
                    >
                      <FileSpreadsheet size={13} />
                      <span>Abrir Hoja Sábana</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* MODAL: CREAR NUEVO CAPÍTULO */}
      {modalCapituloOpen && (
        <Portal>
          <div
            className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs font-[Poppins]"
            onClick={() => setModalCapituloOpen(false)}
          >
            <div
              className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-gray-200 animate-fadeIn space-y-4 font-sans"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-[#9B0F06]">
                    <FolderPlus size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 uppercase">Nuevo Capítulo de Obra</h3>
                    <p className="text-[10px] text-gray-500">Agrega un capítulo adicional para clasificar renglones</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalCapituloOpen(false)}
                  className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleGuardarCapitulo} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10.5px] font-bold text-gray-700 mb-1">
                    Número de Capítulo <span className="text-[#9B0F06]">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formCapituloNumero}
                    onChange={(e) => setFormCapituloNumero(e.target.value)}
                    placeholder="Ej. 10"
                    className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 font-mono text-xs text-gray-900 focus:border-[#9B0F06] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold text-gray-700 mb-1">
                    Nombre del Capítulo <span className="text-[#9B0F06]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formCapituloNombre}
                    onChange={(e) => setFormCapituloNombre(e.target.value)}
                    placeholder="Ej. Obras Complementarias de Mitigación"
                    className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-900 focus:border-[#9B0F06] focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setModalCapituloOpen(false)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-[#9B0F06] hover:bg-[#5E0006] text-white px-4 py-1.5 text-xs font-bold shadow-xs cursor-pointer transition-colors"
                  >
                    Guardar Capítulo
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

    </div>
  )
}

export default ProyectoInformacionFinanciera
