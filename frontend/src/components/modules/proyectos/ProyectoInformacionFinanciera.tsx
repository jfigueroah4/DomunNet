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
  Layers,
  Info,
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

export interface RenglonItemFinanciero {
  id: string
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
}

export interface EstimacionFinancieraItem {
  id: string
  numero: string
  nombreEstimacion: string
  delegadoResidente: string
  perspectiva: 'ejecutora' | 'supervisora'
  fechaInicio: string
  fechaFin: string
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
  const [fechaDesdeEstimacion, setFechaDesdeEstimacion] = useState('')
  const [fechaHastaEstimacion, setFechaHastaEstimacion] = useState('')
  const [paginaEstimaciones, setPaginaEstimaciones] = useState(1)
  const itemsPorPaginaEstimaciones = 5

  // 2 Filtros en Programa de Trabajo: Por Capítulo y Por Renglón
  const [filtroCapitulo, setFiltroCapitulo] = useState<number | 'todos'>('todos')
  const [filtroRenglon, setFiltroRenglon] = useState<string>('todos')
  const [busquedaTexto, setBusquedaTexto] = useState('')

  // Paginación en Programa de Trabajo (Selector de 8, 16, 24, 50, etc.)
  const [paginaRenglones, setPaginaRenglones] = useState(1)
  const [itemsPorPagina, setItemsPorPagina] = useState(8)

  // Filtros interactivos para el Gráfico Financiero (Curva S)
  const [perspectivaCurva, setPerspectivaCurva] = useState<'ejecutora' | 'supervisora'>('ejecutora')
  const [filtroAnioCurva, setFiltroAnioCurva] = useState<string>('todos')
  const [tipoMetricaCurva, setTipoMetricaCurva] = useState<'porcentaje' | 'monto'>('porcentaje')
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

  // Soporte de Modalidad Manual de Presupuesto y Estimaciones
  const modoManual =
    pAny.modoGestionFinanciera === 'manual' || pAny.usarModoSabana === false
  const ambitoPlanTrabajo = pAny.ambitoPlanTrabajo || pAny.ambito_plan_trabajo || 'obra'
  const esModoSabana = pAny.modoGestionFinanciera === 'sabana' || pAny.usarModoSabana === true
  const perspectivaTieneSabana = esModoSabana && (
    (ambitoPlanTrabajo === 'obra' && perspectivaEstimacion === 'ejecutora') ||
    (ambitoPlanTrabajo === 'supervision' && perspectivaEstimacion === 'supervisora')
  )
  const perspectivaEsManual = !perspectivaTieneSabana
  const [estimacionesManuales, setEstimacionesManuales] = useState<EstimacionFinancieraItem[]>([])
  const [modalEstimacionManualOpen, setModalEstimacionManualOpen] = useState(false)
  const [estimacionEnEdicion, setEstimacionEnEdicion] = useState<EstimacionFinancieraItem | null>(null)
  const [estimacionParaEliminar, setEstimacionParaEliminar] = useState<EstimacionFinancieraItem | null>(null)

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
      const stored = localStorage.getItem(`domun_estimaciones_manuales_${proyecto.id}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          // Filtrar dummies de versiones anteriores para no mostrar estimaciones falsas
          const limpios = parsed.filter(
            (item: any) => !item.id?.startsWith('est-ejec-1-') && !item.id?.startsWith('est-sup-1-')
          )
          setEstimacionesManuales(limpios)
          return
        }
      }
      if (Array.isArray(pAny.estimacionesManuales) && pAny.estimacionesManuales.length > 0) {
        setEstimacionesManuales(pAny.estimacionesManuales)
      } else if (Array.isArray(pAny.estimaciones) && pAny.estimaciones.length > 0) {
        setEstimacionesManuales(pAny.estimaciones)
      } else {
        setEstimacionesManuales([])
      }
    } catch (e) {
      console.warn('Error cargando estimaciones manuales:', e)
    }
  }, [proyecto?.id, pAny.estimacionesManuales, pAny.estimaciones])

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
    const filtradas = estimacionesGeneradas.filter((e) => e.perspectiva === perspectiva)
    let maxNum = 0
    filtradas.forEach((e) => {
      const match = e.numero.match(/\d+/)
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
      if (e.perspectiva !== perspectivaEstimacion) return false
      if (fechaDesdeEstimacion && e.fechaInicio < fechaDesdeEstimacion) return false
      if (fechaHastaEstimacion && e.fechaFin > fechaHastaEstimacion) return false
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
      const seleccionados = rawRenglones.filter((r: any) => r.seleccionado !== false)
      if (seleccionados.length > 0) {
        return seleccionados.map((r: any, idx: number) => ({
          id: r.id || `r-${idx}`,
          capituloId: Number(r.capituloId || r.capitulo || 1),
          capituloNombre: r.capituloNombre || `Capítulo ${r.capituloId || 1}`,
          codigoDGC: r.codigoDGC || r.codigo || `10${idx + 1}.01`,
          descripcion: r.descripcion || '',
          unidad: r.unidad || 'm³',
          cantidadContratada: Number(r.cantidadContratada || r.cantidad || 0),
          cantidadAjustada: Number(r.cantidadAjustada || r.cantidadContratada || 0),
          costoUnitarioDirecto: Number(r.costoUnitarioDirecto || r.costoUnitario || r.precioUnitario || 0),
          cantidadEstePeriodo: Number(r.cantidadEstePeriodo || 0),
          cantidadAcumuladaAnterior: Number(r.cantidadAcumuladaAnterior || 0),
        }))
      }
    }
    // Si no se han establecido renglones en el proyecto, no deben salir renglones por defecto
    return []
  }, [proyecto])

  // Filtrado de Renglones en Programa de Trabajo (Filtro por Capítulo + Filtro por Renglón / Búsqueda)
  const renglonesFiltrados = useMemo(() => {
    return listaRenglonesFuente.filter((r) => {
      const matchCap = filtroCapitulo === 'todos' || r.capituloId === filtroCapitulo
      const matchRenglon = filtroRenglon === 'todos' || r.codigoDGC === filtroRenglon
      const matchTexto = busquedaTexto.trim() === '' ||
        r.codigoDGC.toLowerCase().includes(busquedaTexto.toLowerCase()) ||
        r.descripcion.toLowerCase().includes(busquedaTexto.toLowerCase()) ||
        r.capituloNombre.toLowerCase().includes(busquedaTexto.toLowerCase())

      return matchCap && matchRenglon && matchTexto
    })
  }, [listaRenglonesFuente, filtroCapitulo, filtroRenglon, busquedaTexto])

  // Paginación de Renglones
  const totalPaginasRenglones = Math.max(1, Math.ceil(renglonesFiltrados.length / itemsPorPagina))
  const renglonesPaginados = useMemo(() => {
    const inicio = (paginaRenglones - 1) * itemsPorPagina
    return renglonesFiltrados.slice(inicio, inicio + itemsPorPagina)
  }, [renglonesFiltrados, paginaRenglones, itemsPorPagina])

  // Lista de códigos de renglón únicos para el selector
  const listaCodigosRenglon = useMemo(() => {
    const items = filtroCapitulo === 'todos'
      ? listaRenglonesFuente
      : listaRenglonesFuente.filter((r) => r.capituloId === filtroCapitulo)
    return items.map((r) => ({ codigo: r.codigoDGC, descripcion: r.descripcion }))
  }, [listaRenglonesFuente, filtroCapitulo])

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
    const estimacionesPerspectiva = estimacionesGeneradas.filter((e) => e.perspectiva === perspectivaCurva)

    let acumuladoEjecutado = 0

    return listaMeses.map((m, idx) => {
      // Función S-curve contractual programada estándar
      const t = idx / Math.max(1, total - 1)
      const prog = Math.round((3 * t * t - 2 * t * t * t) * 10000) / 100

      // Buscar si existen estimaciones asociadas a este mes o período
      const estsDelMes = estimacionesPerspectiva.filter((e) => {
        const eFin = e.fechaFin ? new Date(e.fechaFin) : null
        if (eFin && !isNaN(eFin.getTime())) {
          return eFin.getFullYear() === m.año && eFin.getMonth() === m.mesIdx
        }
        return e.mes.toLowerCase().includes(mesesCompletos[m.mesIdx].toLowerCase()) && e.mes.includes(String(m.año))
      })

      let real: number | null = null
      let esCorte = false

      if (estsDelMes.length > 0) {
        estsDelMes.forEach((est) => {
          acumuladoEjecutado += Number(est.valorBrutoTrabajado) || 0
        })
        real = montoBaseCurva > 0 ? Number(((acumuladoEjecutado / montoBaseCurva) * 100).toFixed(2)) : 0
      } else if (acumuladoEjecutado > 0 && idx < total) {
        real = montoBaseCurva > 0 ? Number(((acumuladoEjecutado / montoBaseCurva) * 100).toFixed(2)) : 0
      }

      if (idx === total - 1 && real !== null) {
        esCorte = true
      }

      const variacion = real !== null ? Number((real - prog).toFixed(2)) : null
      const montoProg = montoBaseCurva * (prog / 100)
      const montoReal = real !== null ? acumuladoEjecutado : null

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
        <div className="flex flex-wrap items-center justify-between gap-2.5">
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
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[8.5px] font-bold border font-sans ${
                  modoManual
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                }`}>
                  {modoManual ? <Calculator size={10} /> : <FileSpreadsheet size={10} />}
                  <span>{modoManual ? 'Modo Manual' : 'Modo Hoja Sábana'}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 font-sans">
            <div className="text-right hidden sm:block">
              <span className="text-[7.5px] font-bold uppercase tracking-wider text-gray-400 block">
                Delegado Residente Autorizado:
              </span>
              <span className="text-[10px] font-bold text-gray-800">
                {nombreDelegadoProyecto}
              </span>
            </div>

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
            <span>Resumen</span>
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
                  Resumen Financiero
                </span>
                <button
                  type="button"
                  onClick={() => setSubTab('estimaciones')}
                  className="text-[8.5px] font-bold text-[#9B0F06] hover:underline flex items-center gap-0.5 font-sans cursor-pointer"
                >
                  <span>Ver detalle</span>
                  <ChevronRight size={10} />
                </button>
              </div>
              <div className="mt-1">
                <span className="text-[7.5px] text-gray-400 block uppercase font-sans">Monto Líquido a Pagar</span>
                <p className="text-[13px] font-black text-gray-900 font-sans">
                  Q {totalLiquidoAPagar.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Tarjeta 2: Control de Anticipo */}
            <div className="rounded-xl border border-gray-200 bg-white p-2.5 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-extrabold uppercase tracking-wider text-gray-400 font-sans">
                  Control de Anticipo
                </span>
                <button
                  type="button"
                  onClick={() => navegarAHojaSabana({ tab: 'estimaciones' })}
                  className="text-[8.5px] font-bold text-[#9B0F06] hover:underline flex items-center gap-0.5 font-sans cursor-pointer"
                >
                  <span>Ver detalle</span>
                  <ChevronRight size={10} />
                </button>
              </div>
              <div className="mt-1">
                <span className="text-[7.5px] text-gray-400 block uppercase font-sans">% Amortizado a la Fecha</span>
                <div className="flex items-baseline justify-between">
                  <p className="text-[13px] font-black text-gray-900 font-sans">
                    {pctAmortizadoAnticipo.toFixed(1)}%
                  </p>
                  <span className="text-[8px] text-gray-500 font-sans">
                    Saldo: Q {saldoAnticipoPendiente.toLocaleString('es-GT', { minimumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Tarjeta 3: Control de Plazo */}
            <div className="rounded-xl border border-gray-200 bg-white p-2.5 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-extrabold uppercase tracking-wider text-gray-400 font-sans">
                  Control de Plazo
                </span>
                <button
                  type="button"
                  onClick={() => setSubTab('estimaciones')}
                  className="text-[8.5px] font-bold text-[#9B0F06] hover:underline flex items-center gap-0.5 font-sans cursor-pointer"
                >
                  <span>Ver detalle</span>
                  <ChevronRight size={10} />
                </button>
              </div>
              <div className="mt-1">
                <span className="text-[7.5px] text-gray-400 block uppercase font-sans">Días por Emplearse</span>
                <div className="flex items-baseline justify-between">
                  <p className="text-[13px] font-black text-gray-900 font-sans">
                    {plazoDiasCalculados.diasRestantes} <span className="text-[9px] font-semibold text-gray-500">días</span>
                  </p>
                  <span className="text-[8px] text-gray-500 font-sans">
                    Plazo: {plazoDiasCalculados.totalDias}d
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Barra con los 2 Filtros Solicitados */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white p-2 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              {/* Filtro 1: Todos los Capítulos */}
              <div className="min-w-[170px]">
                <select
                  value={filtroCapitulo}
                  onChange={(e) => {
                    setFiltroCapitulo(e.target.value === 'todos' ? 'todos' : Number(e.target.value))
                    setFiltroRenglon('todos')
                    setPaginaRenglones(1)
                  }}
                  className="w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-[9.5px] font-semibold text-gray-700 focus:border-[#9B0F06] focus:outline-none cursor-pointer"
                >
                  <option value="todos">Todos los Capítulos DGC</option>
                  {CAPITULOS_LIBRO_AZUL_DGC.map((c) => (
                    <option key={c.id} value={c.id}>
                      Capítulo {c.id}: {c.nombre.split(':')[1]?.trim() || c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro 2: Según el Renglón */}
              <div className="min-w-[170px]">
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
                      {r.codigo} — {r.descripcion.length > 35 ? `${r.descripcion.substring(0, 35)}...` : r.descripcion}
                    </option>
                  ))}
                </select>
              </div>

              {/* Búsqueda rápida por texto */}
              <div className="relative flex-1 min-w-[150px]">
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

            <div className="text-[9.5px] text-gray-500 font-medium whitespace-nowrap">
              Mostrando <strong className="text-gray-900">{renglonesFiltrados.length}</strong> renglones
            </div>
          </div>

          {/* Tabla Resumida de Renglones con Paginación de 10 */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-[10px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-100/75 text-[8.5px] font-extrabold uppercase tracking-wider text-gray-600">
                    <th className="px-2.5 py-1.5 w-20">Código</th>
                    <th className="px-2.5 py-1.5 min-w-[220px]">Descripción del Renglón DGC</th>
                    <th className="px-2.5 py-1.5 text-center w-16">Unidad</th>
                    <th className="px-2.5 py-1.5 text-right w-24">Cantidad</th>
                    <th className="px-2.5 py-1.5 text-right w-24">P. Unitario (Q)</th>
                    <th className="px-2.5 py-1.5 text-right w-28">Total (Q)</th>
                    <th className="px-2.5 py-1.5 text-center w-28">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-sans text-[10px]">
                  {renglonesPaginados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[10.5px] text-gray-500 font-sans">
                        <div className="flex flex-col items-center justify-center py-5 text-gray-400">
                          <Layers size={26} className="text-gray-300 mb-2" />
                          <p className="font-bold text-gray-700 text-xs">
                            {listaRenglonesFuente.length === 0
                              ? 'No hay renglones asignados a este proyecto'
                              : 'No se encontraron renglones con los filtros seleccionados'}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {listaRenglonesFuente.length === 0
                              ? 'Aún no se han establecido renglones de trabajo para este proyecto.'
                              : 'Prueba cambiando o limpiando los filtros de búsqueda.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    renglonesPaginados.map((renglon) => {
                      const montoTotal = (renglon.cantidadContratada || 0) * (renglon.costoUnitarioDirecto || 0)

                      return (
                        <tr
                          key={renglon.id}
                          onClick={() => navegarAHojaSabana({ tab: 'planificacion', renglon: renglon.codigoDGC })}
                          className="hover:bg-red-50/40 transition-colors cursor-pointer group"
                          title="Hacer clic para ampliar en la Hoja Sábana (Planificación)"
                        >
                          <td className="px-2.5 py-1.5">
                            <span className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[9px] font-bold text-gray-800 border border-gray-200 group-hover:border-[#9B0F06] group-hover:text-[#9B0F06]">
                              {renglon.codigoDGC}
                            </span>
                          </td>
                          <td className="px-2.5 py-1.5 font-sans font-medium text-gray-800 text-[10px]">
                            <p className="line-clamp-1 group-hover:text-[#9B0F06]">{renglon.descripcion}</p>
                            <span className="text-[8px] text-gray-400 font-normal">Capítulo {renglon.capituloId}</span>
                          </td>
                          <td className="px-2.5 py-1.5 text-center font-bold text-gray-600">
                            {renglon.unidad}
                          </td>
                          <td className="px-2.5 py-1.5 text-right font-bold text-gray-800">
                            {renglon.cantidadContratada.toLocaleString('es-GT', {
                              minimumFractionDigits: renglon.unidad.toLowerCase() === 'glb' || renglon.unidad.toLowerCase() === 'u' ? 0 : 2,
                            })}
                          </td>
                          <td className="px-2.5 py-1.5 text-right font-semibold text-gray-700">
                            Q {renglon.costoUnitarioDirecto.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-2.5 py-1.5 text-right font-black text-[#9B0F06]">
                            Q {montoTotal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-2.5 py-1.5 text-center font-sans">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                navegarAHojaSabana({ tab: 'planificacion', renglon: renglon.codigoDGC })
                              }}
                              className="inline-flex items-center gap-1 rounded bg-gray-50 border border-gray-200 px-1.5 py-0.5 text-[8.5px] font-bold text-gray-700 hover:bg-[#9B0F06] hover:text-white hover:border-[#9B0F06] transition-colors"
                            >
                              <Eye size={9} />
                              <span>Planificación</span>
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación estilo Hoja Sábana con Selector de Cantidad (8, 16, 24, 50, etc.) */}
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
                    <option value={8}>8</option>
                    <option value={16}>16</option>
                    <option value={24}>24</option>
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
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-gray-500">
                PERSPECTIVA:
              </span>
              <div className="inline-flex items-center gap-1 rounded-lg bg-gray-100/80 p-0.5 border border-gray-200/60 shadow-2xs">
                <button
                  type="button"
                  onClick={() => {
                    setPerspectivaEstimacion('ejecutora')
                    setPaginaEstimaciones(1)
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold transition-all duration-200 cursor-pointer ${
                    perspectivaEstimacion === 'ejecutora'
                      ? 'bg-white text-[#9B0F06] border border-gray-200/80 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 font-medium'
                  }`}
                >
                  <Building2 size={11} className={perspectivaEstimacion === 'ejecutora' ? 'text-[#9B0F06]' : 'text-gray-500'} />
                  <span>Empresa Ejecutora ({nombreEmpresaEjecutora})</span>
                  {esModoSabana && (
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold ml-1 ${
                      ambitoPlanTrabajo === 'obra'
                        ? 'bg-red-50 text-[#9B0F06] border border-red-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-300'
                    }`}>
                      {ambitoPlanTrabajo === 'obra' ? 'Plan de Trabajo' : 'Manual'}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPerspectivaEstimacion('supervisora')
                    setPaginaEstimaciones(1)
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold transition-all duration-200 cursor-pointer ${
                    perspectivaEstimacion === 'supervisora'
                      ? 'bg-white text-[#9B0F06] border border-gray-200/80 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 font-medium'
                  }`}
                >
                  <UserCheck size={11} className={perspectivaEstimacion === 'supervisora' ? 'text-[#9B0F06]' : 'text-gray-500'} />
                  <span>Empresa Supervisora ({nombreEmpresaSupervisora})</span>
                  {esModoSabana && (
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold ml-1 ${
                      ambitoPlanTrabajo === 'supervision'
                        ? 'bg-orange-50 text-orange-800 border border-orange-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-300'
                    }`}>
                      {ambitoPlanTrabajo === 'supervision' ? 'Plan de Trabajo' : 'Manual'}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Filtros de Rango de Fecha para Estimaciones */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 text-[9px] text-gray-500 font-medium">
                <span>Desde:</span>
                <input
                  type="date"
                  value={fechaDesdeEstimacion}
                  onChange={(e) => {
                    setFechaDesdeEstimacion(e.target.value)
                    setPaginaEstimaciones(1)
                  }}
                  className="rounded-md border border-gray-200 bg-gray-50/60 px-2 py-0.5 text-[9px] font-medium text-gray-800 focus:border-[#9B0F06] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1 text-[9px] text-gray-500 font-medium">
                <span>Hasta:</span>
                <input
                  type="date"
                  value={fechaHastaEstimacion}
                  onChange={(e) => {
                    setFechaHastaEstimacion(e.target.value)
                    setPaginaEstimaciones(1)
                  }}
                  className="rounded-md border border-gray-200 bg-gray-50/60 px-2 py-0.5 text-[9px] font-medium text-gray-800 focus:border-[#9B0F06] focus:bg-white focus:outline-none"
                />
              </div>

              {(fechaDesdeEstimacion || fechaHastaEstimacion) && (
                <button
                  type="button"
                  onClick={() => {
                    setFechaDesdeEstimacion('')
                    setFechaHastaEstimacion('')
                    setPaginaEstimaciones(1)
                  }}
                  className="text-[8.5px] font-bold text-[#9B0F06] hover:underline cursor-pointer"
                >
                  Limpiar
                </button>
              )}

              {/* Botón para crear o agregar estimación manual */}
              <button
                type="button"
                onClick={handleAbrirCrearEstimacionManual}
                className="inline-flex items-center gap-1 rounded-md bg-[#9B0F06] px-2.5 py-1 text-[9px] font-bold text-white hover:bg-[#7a0c05] transition-colors cursor-pointer shadow-2xs"
                title="Crear o registrar estimación manual"
              >
                <Plus size={11} />
                <span>+ Nueva Estimación</span>
              </button>

              <div className="text-[8.5px] text-gray-400 font-medium pl-1">
                {estimacionesFiltradas.length} estimaciones
              </div>
            </div>
          </div>

          {/* Banner contextual de Estimación según Ámbito del Plan de Trabajo en Modo Sábana */}
          {esModoSabana && perspectivaEsManual && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3 shadow-2xs font-[Poppins]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800 shrink-0 border border-amber-200">
                  <Info size={16} />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-amber-900">
                    Apartado de Estimación Manual: {perspectivaEstimacion === 'supervisora' ? 'Contrato de Supervisión' : 'Contrato de Obra (Ejecución)'}
                  </h4>
                  <p className="text-[9.5px] text-amber-800 leading-snug">
                    El Plan de Trabajo con Hoja Sábana está implementado para el contrato de <strong>{ambitoPlanTrabajo === 'obra' ? 'Obra (Ejecución)' : 'Supervisión'}</strong>. En este apartado las estimaciones de <strong>{perspectivaEstimacion === 'supervisora' ? 'Supervisión' : 'Obra'}</strong> se van ingresando de forma manual.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAbrirCrearEstimacionManual}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-700 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-amber-800 transition-colors shadow-2xs shrink-0 cursor-pointer"
              >
                <Plus size={12} />
                <span>+ Ingresar Estimación Manual</span>
              </button>
            </div>
          )}

          {esModoSabana && !perspectivaEsManual && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 shadow-2xs font-[Poppins]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 shrink-0 border border-emerald-200">
                  <FileSpreadsheet size={16} />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-emerald-900">
                    Plan de Trabajo Implementado: {ambitoPlanTrabajo === 'obra' ? 'Contrato de Obra (Ejecución)' : 'Contrato de Supervisión'}
                  </h4>
                  <p className="text-[9.5px] text-emerald-800 leading-snug">
                    Este apartado está vinculado a la Hoja Sábana Digital para el desglose analítico de renglones y estimaciones.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navegarAHojaSabana({ tab: 'sabana' })}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-emerald-800 transition-colors shadow-2xs shrink-0 cursor-pointer"
              >
                <FileSpreadsheet size={12} />
                <span>Abrir Hoja Sábana</span>
              </button>
            </div>
          )}

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
                            Este proyecto no cuenta con estimaciones registradas en la perspectiva actual. Haz clic en el botón para crear la primera estimación progresiva.
                          </p>
                          <button
                            type="button"
                            onClick={handleAbrirCrearEstimacionManual}
                            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#9B0F06] px-3.5 py-1.5 text-[10px] font-bold text-white hover:bg-[#7a0c05] transition-colors cursor-pointer shadow-xs"
                          >
                            <Plus size={12} />
                            <span>Crear Primera Estimación</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    estimacionesPaginadas.map((est) => (
                      <tr key={est.id} className="hover:bg-red-50/30 transition-colors">
                        {/* No. Estimación & Nombre */}
                        <td className="px-2.5 py-1.5 font-sans">
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-gray-900">{est.numero}</span>
                            <span className={`text-[8px] font-mono px-1 py-0.2 rounded font-bold uppercase ${
                              est.estado === 'borrador' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {est.estado}
                            </span>
                          </div>
                          <p className="text-[9px] text-gray-500 font-medium truncate max-w-[180px]" title={est.nombreEstimacion}>
                            {est.nombreEstimacion}
                          </p>
                        </td>

                        {/* Delegado Residente */}
                        <td className="px-2.5 py-1.5 font-sans">
                          <div className="flex items-center gap-1 text-gray-800 font-semibold text-[9.5px]">
                            <User size={9} className="text-[#9B0F06] shrink-0" />
                            <span className="truncate max-w-[120px]">{est.delegadoResidente}</span>
                          </div>
                          <p className="text-[8px] text-gray-400 font-normal truncate max-w-[120px]">{est.supervisadoPor}</p>
                        </td>

                        {/* Período */}
                        <td className="px-2.5 py-1.5 font-mono text-[9px] text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar size={9} className="text-gray-400 shrink-0" />
                            <span>{est.fechaInicio} al {est.fechaFin}</span>
                          </div>
                          <span className="text-[8px] text-gray-400 block font-sans">{est.mes}</span>
                        </td>

                        {/* Retraso */}
                        <td className="px-2.5 py-1.5 text-center font-sans">
                          {est.diasRetraso === 0 ? (
                            <span className="text-emerald-700 font-semibold text-[9px] inline-flex items-center gap-0.5">
                              <CheckCircle2 size={9} />
                              En tiempo (0d)
                            </span>
                          ) : (
                            <span className={`font-semibold text-[9px] inline-flex items-center gap-0.5 ${
                              est.diasRetraso <= 5 ? 'text-amber-700' : 'text-[#9B0F06]'
                            }`}>
                              <AlertTriangle size={9} />
                              +{est.diasRetraso}d retraso
                            </span>
                          )}
                        </td>

                        {/* Rendimiento / Calificación */}
                        <td className="px-2.5 py-1.5 text-center font-sans">
                          <span
                            className={`font-bold text-[9px] ${
                              est.calificacionDesempeno === 'bueno'
                                ? 'text-emerald-700'
                                : est.calificacionDesempeno === 'regular'
                                ? 'text-amber-700'
                                : 'text-[#9B0F06]'
                            }`}
                          >
                            {est.porcentajeRendimiento.toFixed(1)}% ({est.calificacionDesempeno.toUpperCase()})
                          </span>
                        </td>

                        {/* Anticipo Aplicado (Monto + %) */}
                        <td className="px-2.5 py-1.5 text-right">
                          <span className="text-amber-800 font-semibold block font-mono text-[9.5px]">
                            − Q {est.montoAmortizacion.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[7.5px] text-gray-400 font-sans">
                            ({est.porcentajeAmortizacion.toFixed(0)}% amortizado)
                          </span>
                        </td>

                        {/* Valor Bruto */}
                        <td className="px-2.5 py-1.5 text-right font-semibold text-gray-900 font-mono text-[9.5px]">
                          Q {est.valorBrutoTrabajado.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Monto Líquido a Pagar */}
                        <td className="px-2.5 py-1.5 text-right font-black text-[#9B0F06] font-mono text-[9.5px]">
                          Q {est.montoLiquidoAPagar.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Saldo Contractual */}
                        <td className="px-2.5 py-1.5 text-right font-medium text-gray-600 font-mono text-[9px]">
                          Q {est.saldoContractualRestante.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Botón Acción: Ojo, Editar y Eliminar (solo en borrador) */}
                        <td className="px-2.5 py-1.5 text-center font-sans">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (perspectivaEsManual) {
                                  handleAbrirEditarEstimacionManual(est)
                                } else {
                                  navegarAHojaSabana({ estimacion: est.numero })
                                }
                              }}
                              disabled={!perspectivaEsManual && !tieneAccesoHojaSabana}
                              className={`inline-flex h-6 w-6 items-center justify-center rounded transition-colors ${
                                perspectivaEsManual || tieneAccesoHojaSabana
                                  ? 'text-gray-600 hover:text-[#9B0F06] hover:bg-red-50 cursor-pointer shadow-2xs'
                                  : 'text-gray-300 cursor-not-allowed'
                              }`}
                              title={perspectivaEsManual ? `Ver detalles de ${est.numero}` : (tieneAccesoHojaSabana ? `Ver Hoja Sábana para ${est.numero}` : 'Solo el Delegado Residente o Administrador tiene acceso')}
                            >
                              {perspectivaEsManual || tieneAccesoHojaSabana ? <Eye size={13} /> : <Lock size={12} />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAbrirEditarEstimacionManual(est)}
                              className="inline-flex h-6 w-6 items-center justify-center rounded text-amber-700 hover:bg-amber-50 cursor-pointer transition-colors shadow-2xs"
                              title="Editar estimación"
                            >
                              <Edit2 size={11} />
                            </button>
                            {est.estado === 'borrador' ? (
                              <button
                                type="button"
                                onClick={() => setEstimacionParaEliminar(est)}
                                className="inline-flex h-6 w-6 items-center justify-center rounded text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer transition-colors shadow-2xs"
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
          {/* Barra de Filtros del Gráfico Financiero (Perspectiva + Año + Métrica + Fechas) */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-gray-200 bg-white p-2.5 shadow-2xs">
            {/* Perspectiva Doble con cápsula y animación (img1 / img3) */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-gray-500">
                PERSPECTIVA:
              </span>
              <div className="inline-flex items-center gap-1 rounded-lg bg-gray-100/80 p-0.5 border border-gray-200/60 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setPerspectivaCurva('ejecutora')}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold transition-all duration-200 cursor-pointer ${
                    perspectivaCurva === 'ejecutora'
                      ? 'bg-white text-[#9B0F06] border border-gray-200/80 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 font-medium'
                  }`}
                >
                  <Building2 size={11} className={perspectivaCurva === 'ejecutora' ? 'text-[#9B0F06]' : 'text-gray-500'} />
                  <span>Empresa Ejecutora ({nombreEmpresaEjecutora})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPerspectivaCurva('supervisora')}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold transition-all duration-200 cursor-pointer ${
                    perspectivaCurva === 'supervisora'
                      ? 'bg-white text-[#9B0F06] border border-gray-200/80 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 font-medium'
                  }`}
                >
                  <UserCheck size={11} className={perspectivaCurva === 'supervisora' ? 'text-[#9B0F06]' : 'text-gray-500'} />
                  <span>Empresa Supervisora ({nombreEmpresaSupervisora})</span>
                </button>
              </div>
            </div>

            {/* Controles de Filtrado: Año, Métrica y Rango Temporal */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Filtro por Año */}
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-gray-500 font-medium">Año:</span>
                <select
                  value={filtroAnioCurva}
                  onChange={(e) => setFiltroAnioCurva(e.target.value)}
                  className="rounded-md border border-gray-200 bg-gray-50/60 px-2 py-0.5 text-[9px] font-semibold text-gray-800 focus:border-[#9B0F06] focus:bg-white focus:outline-none cursor-pointer"
                >
                  <option value="todos">Todos los Años</option>
                  {aniosDisponiblesCurva.map((a) => (
                    <option key={a} value={String(a)}>{a}</option>
                  ))}
                </select>
              </div>

              {/* Selector de Métrica (% vs Monto Q) */}
              <div className="inline-flex items-center gap-0.5 rounded-md bg-gray-100 p-0.5 border border-gray-200 text-[9px]">
                <button
                  type="button"
                  onClick={() => setTipoMetricaCurva('porcentaje')}
                  className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
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
                  className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                    tipoMetricaCurva === 'monto'
                      ? 'bg-white text-[#9B0F06] shadow-2xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Monto (Q)
                </button>
              </div>

              {/* Rango Desde / Hasta */}
              <div className="flex items-center gap-1 text-[9px] text-gray-500 font-medium">
                <span>Desde:</span>
                <input
                  type="date"
                  value={fechaDesdeCurva}
                  onChange={(e) => setFechaDesdeCurva(e.target.value)}
                  className="rounded-md border border-gray-200 bg-gray-50/60 px-1.5 py-0.5 text-[9px] font-medium text-gray-800 focus:border-[#9B0F06] focus:bg-white focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-1 text-[9px] text-gray-500 font-medium">
                <span>Hasta:</span>
                <input
                  type="date"
                  value={fechaHastaCurva}
                  onChange={(e) => setFechaHastaCurva(e.target.value)}
                  className="rounded-md border border-gray-200 bg-gray-50/60 px-1.5 py-0.5 text-[9px] font-medium text-gray-800 focus:border-[#9B0F06] focus:bg-white focus:outline-none"
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
                  className="text-[8.5px] font-bold text-[#9B0F06] hover:underline cursor-pointer"
                >
                  Limpiar
                </button>
              )}

              <span className="text-[8.5px] text-gray-400 font-medium pl-1">
                {puntosCurvaSFiltrados.length} meses
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between border-b border-gray-100 pb-2 gap-2">
              <div>
                <h2 className="text-xs font-black tracking-wide text-gray-900 uppercase">
                  PROGRAMADO / EJECUTADO ACUMULADO MENSUAL ({perspectivaCurva === 'ejecutora' ? 'CONTRATO DE OBRA' : 'CONTRATO DE SUPERVISIÓN'})
                </h2>
                <p className="text-[9px] text-gray-400">
                  {tipoMetricaCurva === 'porcentaje' ? 'Curva de avance porcentual contractual acumulado' : 'Curva de avance monetario acumulado (Q)'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[8.5px] font-bold text-gray-400 uppercase block">Base Contractual</span>
                <span className="font-mono font-bold text-[11px] text-gray-800">
                  Q {montoBaseCurva.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Contenedor SVG Responsivo de la Curva S */}
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
                  className="absolute z-30 pointer-events-none rounded-lg border border-gray-200 bg-white/95 p-2 shadow-lg backdrop-blur-md transition-all font-sans text-[10px]"
                  style={{
                    left: '50%',
                    top: '10px',
                    transform: 'translateX(-50%)',
                    minWidth: '240px',
                  }}
                >
                  <div className="flex items-center justify-between border-b border-gray-100 pb-0.5 mb-1">
                    <span className="font-extrabold text-gray-900">{tooltipCurva.data.mes}</span>
                    {tooltipCurva.data.esCorte && (
                      <span className="rounded bg-red-100 text-[#9B0F06] font-black px-1 text-[7.5px] uppercase">
                        Corte Actual
                      </span>
                    )}
                  </div>

                  <div className="space-y-0.5 font-mono text-[9.5px]">
                    <div className="flex justify-between text-blue-700">
                      <span className="font-sans font-semibold">Programado:</span>
                      <span className="font-bold">
                        {tooltipCurva.data.prog.toFixed(2)}% (Q {tooltipCurva.data.montoProg.toLocaleString('es-GT', { minimumFractionDigits: 2 })})
                      </span>
                    </div>

                    {tooltipCurva.data.real !== null ? (
                      <>
                        <div className="flex justify-between text-[#9B0F06]">
                          <span className="font-sans font-semibold">Ejecutado:</span>
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
                </div>
              )}
            </div>

            {/* Leyenda en la parte inferior centrada */}
            <div className="flex items-center justify-center gap-6 pt-2 border-t border-gray-100 text-[10px] font-semibold">
              <span className="flex items-center gap-2 text-gray-700">
                <span className="h-0.5 w-6 bg-[#2563eb] inline-block rounded" />
                {tipoMetricaCurva === 'porcentaje' ? '% Prog Acum Mensual' : 'Monto Prog Acumulado (Q)'}
              </span>
              <span className="flex items-center gap-2 text-gray-700">
                <span className="h-0.5 w-6 bg-[#9B0F06] inline-block rounded" />
                {tipoMetricaCurva === 'porcentaje' ? '% Ejecut Acum Mensual' : 'Monto Ejecut Acumulado (Q)'}
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
                {/* No. de Estimación (Bloqueado / Progresivo) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-gray-700">
                      No. de Estimación <span className="text-[#9B0F06]">*</span>
                    </label>
                    <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                      <Lock size={9} /> Correlativo bloqueado
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={formEstNumero}
                      placeholder="Ej: Est. 01"
                      className="w-full rounded-xl border border-gray-200 bg-gray-100/90 pl-3 pr-8 py-2 font-mono text-xs font-bold text-gray-800 cursor-not-allowed select-none focus:outline-none"
                      title="El número de estimación es correlativo progresivo y no puede modificarse manualmente."
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                      <Lock size={13} />
                    </div>
                  </div>
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

                {/* Concepto / Título de la Estimación */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Concepto / Título de la Estimación
                  </label>
                  <input
                    type="text"
                    value={formEstNombre}
                    onChange={(e) => setFormEstNombre(e.target.value)}
                    placeholder="Ej: Estimación No. 01 - Obras Preliminares"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 focus:border-[#9B0F06] focus:outline-none"
                  />
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
    </div>
  )
}

export default ProyectoInformacionFinanciera
