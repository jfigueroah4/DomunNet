'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileSpreadsheet,
  Layers,
  Lock,
  Receipt,
  Search,
  TrendingUp,
  User,
  UserCheck,
} from 'lucide-react'
import type { ProyectoType } from '@/validations/proyecto.schema'
import { useAuthStore } from '@/stores/useAuthStore'
import { showErrorToast } from '@/hooks/useCustomToast'

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

// Catálogo base de renglones DGC para el proyecto
const CATALOGO_BASE_RENGLONES: RenglonItemFinanciero[] = [
  {
    id: 'dgc-101',
    capituloId: 1,
    capituloNombre: 'Capítulo I: Estudios, Mantenimiento y Trabajos Preliminares',
    codigoDGC: '101.01',
    descripcion: 'Mantenimiento del tránsito y construcción de desvíos provisionales',
    unidad: 'Glb',
    cantidadContratada: 1,
    cantidadAjustada: 1,
    costoUnitarioDirecto: 250000,
    cantidadEstePeriodo: 0.1,
    cantidadAcumuladaAnterior: 0.6,
  },
  {
    id: 'dgc-102',
    capituloId: 1,
    capituloNombre: 'Capítulo I: Estudios, Mantenimiento y Trabajos Preliminares',
    codigoDGC: '102.03',
    descripcion: 'Clechado, chapeo, destronque y limpieza del derecho de vía',
    unidad: 'Ha',
    cantidadContratada: 18.5,
    cantidadAjustada: 18.5,
    costoUnitarioDirecto: 18500,
    cantidadEstePeriodo: 1.5,
    cantidadAcumuladaAnterior: 16.0,
  },
  {
    id: 'dgc-103',
    capituloId: 1,
    capituloNombre: 'Capítulo I: Estudios, Mantenimiento y Trabajos Preliminares',
    codigoDGC: '103.01',
    descripcion: 'Demolición de estructuras existentes de concreto y mampostería',
    unidad: 'm³',
    cantidadContratada: 1200,
    cantidadAjustada: 1200,
    costoUnitarioDirecto: 280,
    cantidadEstePeriodo: 100,
    cantidadAcumuladaAnterior: 1100,
  },
  {
    id: 'dgc-105',
    capituloId: 1,
    capituloNombre: 'Capítulo I: Estudios, Mantenimiento y Trabajos Preliminares',
    codigoDGC: '105.06',
    descripcion: 'Replanteo topográfico, nivelación y trazado de precisión DGC',
    unidad: 'km',
    cantidadContratada: 12.5,
    cantidadAjustada: 12.5,
    costoUnitarioDirecto: 14500,
    cantidadEstePeriodo: 0.5,
    cantidadAcumuladaAnterior: 11.5,
  },
  {
    id: 'dgc-201',
    capituloId: 2,
    capituloNombre: 'Capítulo II: Movimiento de Tierras y Excavación',
    codigoDGC: '201.01',
    descripcion: 'Excavación no clasificada para corte en vía',
    unidad: 'm³',
    cantidadContratada: 45000,
    cantidadAjustada: 48000,
    costoUnitarioDirecto: 68,
    cantidadEstePeriodo: 3500,
    cantidadAcumuladaAnterior: 41000,
  },
  {
    id: 'dgc-202',
    capituloId: 2,
    capituloNombre: 'Capítulo II: Movimiento de Tierras y Excavación',
    codigoDGC: '201.03(b)',
    descripcion: 'Excavación en roca mediante perforación y voladura controlada',
    unidad: 'm³',
    cantidadContratada: 12500,
    cantidadAjustada: 14000,
    costoUnitarioDirecto: 210,
    cantidadEstePeriodo: 1200,
    cantidadAcumuladaAnterior: 11800,
  },
  {
    id: 'dgc-203',
    capituloId: 2,
    capituloNombre: 'Capítulo II: Movimiento de Tierras y Excavación',
    codigoDGC: '202.01',
    descripcion: 'Excavación no clasificada para estructuras y cimentaciones',
    unidad: 'm³',
    cantidadContratada: 8200,
    cantidadAjustada: 8200,
    costoUnitarioDirecto: 98,
    cantidadEstePeriodo: 600,
    cantidadAcumuladaAnterior: 7400,
  },
  {
    id: 'dgc-301',
    capituloId: 3,
    capituloNombre: 'Capítulo III: Terraplenes Estructurales y Capas de Soporte',
    codigoDGC: '301.01',
    descripcion: 'Compactación de terraplenes con material propio de corte',
    unidad: 'm³',
    cantidadContratada: 32000,
    cantidadAjustada: 32000,
    costoUnitarioDirecto: 48,
    cantidadEstePeriodo: 2400,
    cantidadAcumuladaAnterior: 28500,
  },
  {
    id: 'dgc-302',
    capituloId: 3,
    capituloNombre: 'Capítulo III: Terraplenes Estructurales y Capas de Soporte',
    codigoDGC: '302.02',
    descripcion: 'Terraplén con material de préstamo seleccionado (95% AASHTO T-180)',
    unidad: 'm³',
    cantidadContratada: 24000,
    cantidadAjustada: 24000,
    costoUnitarioDirecto: 125,
    cantidadEstePeriodo: 1800,
    cantidadAcumuladaAnterior: 21200,
  },
  {
    id: 'dgc-401',
    capituloId: 4,
    capituloNombre: 'Capítulo IV: Subbases y Bases Granulares',
    codigoDGC: '401.01',
    descripcion: 'Subbase granular graduada e=20cm compactada al 100% AASHTO T-180',
    unidad: 'm³',
    cantidadContratada: 18500,
    cantidadAjustada: 18500,
    costoUnitarioDirecto: 175,
    cantidadEstePeriodo: 1400,
    cantidadAcumuladaAnterior: 16200,
  },
  {
    id: 'dgc-402',
    capituloId: 4,
    capituloNombre: 'Capítulo IV: Subbases y Bases Granulares',
    codigoDGC: '402.02',
    descripcion: 'Base granular graduada clase A e=25cm 100% de trituración',
    unidad: 'm³',
    cantidadContratada: 18500,
    cantidadAjustada: 18500,
    costoUnitarioDirecto: 220,
    cantidadEstePeriodo: 1800,
    cantidadAcumuladaAnterior: 15800,
  },
  {
    id: 'dgc-501',
    capituloId: 5,
    capituloNombre: 'Capítulo V: Pavimentos Asfálticos y Concreto',
    codigoDGC: '501.01',
    descripcion: 'Mezcla asfáltica en caliente graduación densa e=7.5cm',
    unidad: 'm²',
    cantidadContratada: 12000,
    cantidadAjustada: 12000,
    costoUnitarioDirecto: 195,
    cantidadEstePeriodo: 1500,
    cantidadAcumuladaAnterior: 9800,
  },
  {
    id: 'dgc-504',
    capituloId: 5,
    capituloNombre: 'Capítulo V: Pavimentos Asfálticos y Concreto',
    codigoDGC: '504.01',
    descripcion: 'Pavimento rígido de concreto hidráulico MR=45 e=20cm con pasadores',
    unidad: 'm²',
    cantidadContratada: 28000,
    cantidadAjustada: 26000,
    costoUnitarioDirecto: 380,
    cantidadEstePeriodo: 2400,
    cantidadAcumuladaAnterior: 24200,
  },
  {
    id: 'dgc-601',
    capituloId: 6,
    capituloNombre: 'Capítulo VI: Estructuras de Drenaje Pluvial',
    codigoDGC: '601.01',
    descripcion: 'Tubería de concreto reforzado Ø24" clase III para alcantarillado',
    unidad: 'ml',
    cantidadContratada: 3200,
    cantidadAjustada: 3200,
    costoUnitarioDirecto: 310,
    cantidadEstePeriodo: 250,
    cantidadAcumuladaAnterior: 2800,
  },
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

  // Paginación en Programa de Trabajo (Paginación de 10 solicitada)
  const [paginaRenglones, setPaginaRenglones] = useState(1)
  const itemsPorPagina = 10

  // Tooltip interactivo para Curva S
  const [tooltipCurva, setTooltipCurva] = useState<any>(null)

  const pAny = (proyecto as any) || {}
  const esBorrador = (proyecto?.estado || 'activo') === 'borrador'

  // Nombres de las empresas para los tabs de Control de Estimaciones
  const nombreEmpresaEjecutora = pAny.empresaContratista || pAny.empresa_contratista || 'Constructora Vial S.A.'
  const nombreEmpresaSupervisora = pAny.empresaSupervisora || pAny.empresa_supervisora || 'Supervisión Técnica DGC'

  // Delegado Residente del Proyecto
  const nombreDelegadoProyecto = pAny.delegadoResidente || pAny.delegado_residente || 'Ing. Fernando Álvarez'

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
  const pctAnticipoEjecucionNum = Number(pAny.contratoEjecucion?.porcentajeAnticipo ?? pAny.porcentajeAnticipo ?? 20)
  const pctAnticipoSupervisionNum = Number(pAny.contratoSupervision?.porcentajeAnticipo ?? pAny.porcentajeAnticipoSupervision ?? pAny.porcentajeAnticipo ?? 20)
  const pctAnticipoEjec = pctAnticipoEjecucionNum / 100
  const pctAnticipoSup = pctAnticipoSupervisionNum / 100

  const montoContractualOriginal = Number(proyecto?.montoContractualOriginal || proyecto?.presupuesto || 48500000)
  const montoAjustadoVigente = Number(proyecto?.montoFinancieroFinalEjecutado || montoContractualOriginal)
  const anticipoOtorgado = montoContractualOriginal * pctAnticipoEjec
  const avanceFisico = esBorrador ? 0 : Number(proyecto?.avance || 68.5)
  const pctAmortizadoAnticipo = esBorrador ? 0 : Math.min(100, Math.max(0, avanceFisico * 0.95))
  const anticipoAmortizado = anticipoOtorgado * (pctAmortizadoAnticipo / 100)
  const saldoAnticipoPendiente = Math.max(0, anticipoOtorgado - anticipoAmortizado)

  // Estimaciones Generadas
  const estimacionesGeneradas: EstimacionFinancieraItem[] = useMemo(() => {
    const periodos = [
      {
        num: 'Est. 01',
        nombre: 'Estimación No. 01 - Trabajos Preliminares y Terracería',
        mes: 'Enero 2026',
        fIni: '2026-01-01',
        fFin: '2026-01-31',
        diasRetraso: 0,
        rendimiento: 99.2,
        calif: 'bueno' as const,
        factorBruto: 0.10,
        estado: 'pagada' as const,
      },
      {
        num: 'Est. 02',
        nombre: 'Estimación No. 02 - Excavación Masiva y Drenajes Menores',
        mes: 'Febrero 2026',
        fIni: '2026-02-01',
        fFin: '2026-02-28',
        diasRetraso: 0,
        rendimiento: 98.5,
        calif: 'bueno' as const,
        factorBruto: 0.12,
        estado: 'pagada' as const,
      },
      {
        num: 'Est. 03',
        nombre: 'Estimación No. 03 - Terraplenes y Estructuras de Soporte',
        mes: 'Marzo 2026',
        fIni: '2026-03-01',
        fFin: '2026-03-31',
        diasRetraso: 3,
        rendimiento: 86.4,
        calif: 'regular' as const,
        factorBruto: 0.14,
        estado: 'pagada' as const,
      },
      {
        num: 'Est. 04',
        nombre: 'Estimación No. 04 - Subbase Granular y Obras de Arte',
        mes: 'Abril 2026',
        fIni: '2026-04-01',
        fFin: '2026-04-30',
        diasRetraso: 0,
        rendimiento: 97.0,
        calif: 'bueno' as const,
        factorBruto: 0.11,
        estado: 'pagada' as const,
      },
      {
        num: 'Est. 05',
        nombre: 'Estimación No. 05 - Base Granular y Colocación de Tubería',
        mes: 'Mayo 2026',
        fIni: '2026-05-01',
        fFin: '2026-05-31',
        diasRetraso: 7,
        rendimiento: 78.5,
        calif: 'regular' as const,
        factorBruto: 0.13,
        estado: 'pagada' as const,
      },
      {
        num: 'Est. 06',
        nombre: 'Estimación No. 06 - Pavimento Asfáltico y Concreto Hidráulico',
        mes: 'Junio 2026',
        fIni: '2026-06-01',
        fFin: '2026-06-30',
        diasRetraso: 12,
        rendimiento: 64.0,
        calif: 'malo' as const,
        factorBruto: 0.08,
        estado: 'aprobada' as const,
      },
      {
        num: 'Est. 07 (Actual)',
        nombre: 'Estimación No. 07 - Pavimento Rígido y Señalización Vial',
        mes: 'Julio 2026',
        fIni: '2026-07-01',
        fFin: '2026-07-31',
        diasRetraso: 5,
        rendimiento: 82.0,
        calif: 'regular' as const,
        factorBruto: 0.005,
        estado: 'en_revision' as const,
      },
    ]

    let acumuladoBrutoEjec = 0
    let acumuladoBrutoSup = 0

    return periodos.flatMap((p, idx) => {
      const baseBruto = montoAjustadoVigente * p.factorBruto

      // 1. Perspectiva Empresa Ejecutora (Contratista)
      acumuladoBrutoEjec += baseBruto
      const amortEjec = baseBruto * pctAnticipoEjec
      const liqEjec = baseBruto - amortEjec
      const saldoEjec = Math.max(0, montoAjustadoVigente - acumuladoBrutoEjec)

      const estEjecutora: EstimacionFinancieraItem = {
        id: `est-ejec-${idx + 1}`,
        numero: p.num,
        nombreEstimacion: p.nombre,
        delegadoResidente: nombreDelegadoProyecto,
        perspectiva: 'ejecutora',
        fechaInicio: p.fIni,
        fechaFin: p.fFin,
        mes: p.mes,
        diasRetraso: p.diasRetraso,
        porcentajeRendimiento: p.rendimiento,
        calificacionDesempeno: p.calif,
        valorBrutoTrabajado: baseBruto,
        porcentajeAmortizacion: pctAnticipoEjecucionNum,
        montoAmortizacion: amortEjec,
        montoLiquidoAPagar: liqEjec,
        saldoContractualRestante: saldoEjec,
        estado: p.estado,
        supervisadoPor: nombreEmpresaEjecutora,
        observaciones: 'Presentada según memoria analítica de campo y libretas topográficas.',
      }

      // 2. Perspectiva Empresa Supervisora (CIV / DGC)
      const factorAjusteSupervisor = p.estado === 'en_revision' ? 0.96 : (idx === 4 ? 0.98 : 1.0)
      const brutoSup = baseBruto * factorAjusteSupervisor
      acumuladoBrutoSup += brutoSup
      const amortSup = brutoSup * pctAnticipoSup
      const liqSup = brutoSup - amortSup
      const saldoSup = Math.max(0, montoAjustadoVigente - acumuladoBrutoSup)

      const estSupervisora: EstimacionFinancieraItem = {
        id: `est-sup-${idx + 1}`,
        numero: p.num,
        nombreEstimacion: `${p.nombre} (Dictamen Supervisión)`,
        delegadoResidente: nombreDelegadoProyecto,
        perspectiva: 'supervisora',
        fechaInicio: p.fIni,
        fechaFin: p.fFin,
        mes: p.mes,
        diasRetraso: p.diasRetraso,
        porcentajeRendimiento: Math.max(0, p.rendimiento * factorAjusteSupervisor),
        calificacionDesempeno: factorAjusteSupervisor < 1.0 ? (p.calif === 'bueno' ? 'regular' : p.calif) : p.calif,
        valorBrutoTrabajado: brutoSup,
        porcentajeAmortizacion: pctAnticipoSupervisionNum,
        montoAmortizacion: amortSup,
        montoLiquidoAPagar: liqSup,
        saldoContractualRestante: saldoSup,
        estado: p.estado,
        supervisadoPor: nombreEmpresaSupervisora,
        observaciones: factorAjusteSupervisor < 1.0
          ? 'Ajuste técnico por prueba de laboratorio AASHTO en proceso de resolución.'
          : 'Certificación técnica conforme a especificaciones del Libro Azul DGC.',
      }

      return [estEjecutora, estSupervisora]
    })
  }, [montoAjustadoVigente, pctAnticipoEjec, pctAnticipoSup, pctAnticipoEjecucionNum, pctAnticipoSupervisionNum, nombreDelegadoProyecto, nombreEmpresaEjecutora, nombreEmpresaSupervisora])

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

  // Filtrado de Renglones en Programa de Trabajo (Filtro por Capítulo + Filtro por Renglón / Búsqueda)
  const renglonesFiltrados = useMemo(() => {
    return CATALOGO_BASE_RENGLONES.filter((r) => {
      const matchCap = filtroCapitulo === 'todos' || r.capituloId === filtroCapitulo
      const matchRenglon = filtroRenglon === 'todos' || r.codigoDGC === filtroRenglon
      const matchTexto = busquedaTexto.trim() === '' ||
        r.codigoDGC.toLowerCase().includes(busquedaTexto.toLowerCase()) ||
        r.descripcion.toLowerCase().includes(busquedaTexto.toLowerCase()) ||
        r.capituloNombre.toLowerCase().includes(busquedaTexto.toLowerCase())

      return matchCap && matchRenglon && matchTexto
    })
  }, [filtroCapitulo, filtroRenglon, busquedaTexto])

  // Paginación de Renglones
  const totalPaginasRenglones = Math.max(1, Math.ceil(renglonesFiltrados.length / itemsPorPagina))
  const renglonesPaginados = useMemo(() => {
    const inicio = (paginaRenglones - 1) * itemsPorPagina
    return renglonesFiltrados.slice(inicio, inicio + itemsPorPagina)
  }, [renglonesFiltrados, paginaRenglones])

  // Lista de códigos de renglón únicos para el selector
  const listaCodigosRenglon = useMemo(() => {
    const items = filtroCapitulo === 'todos'
      ? CATALOGO_BASE_RENGLONES
      : CATALOGO_BASE_RENGLONES.filter((r) => r.capituloId === filtroCapitulo)
    return items.map((r) => ({ codigo: r.codigoDGC, descripcion: r.descripcion }))
  }, [filtroCapitulo])

  // Datos de la Curva S Financiera Dinámica basada en fechas reales y avance del proyecto
  const puntosCurvaS = useMemo(() => {
    const fIniRaw = proyecto?.fechaInicioContractual || proyecto?.fechaInicio || '2026-01-01'
    const fFinRaw = proyecto?.fechaFinalizacionReal || (proyecto as any)?.fechaFinContractualPlan || proyecto?.fechaFin || '2026-12-31'

    const partesIni = String(fIniRaw).split('-').map(Number)
    const partesFin = String(fFinRaw).split('-').map(Number)

    const dIni = new Date(partesIni[0] || 2026, partesIni[1] ? partesIni[1] - 1 : 0, partesIni[2] || 1)
    const dFin = new Date(partesFin[0] || 2026, partesFin[1] ? partesFin[1] - 1 : 11, partesFin[2] || 28)

    const mesesAbrev = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    const mesesCompletos = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

    const listaMeses: Array<{ mes: string; fecha: string; año: number; mesIdx: number; date: Date }> = []
    const cursor = new Date(dIni.getFullYear(), dIni.getMonth(), 1)
    const limite = new Date(dFin.getFullYear(), dFin.getMonth(), 1)

    // Límite de seguridad de 60 meses
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
    const currentAvance = esBorrador ? 0 : Number(proyecto?.avance ?? 0)
    const hoy = new Date()

    let idxCorte = 0
    if (currentAvance <= 0) {
      idxCorte = 0
    } else {
      const idxHoy = listaMeses.findIndex((m) => m.date.getFullYear() === hoy.getFullYear() && m.date.getMonth() === hoy.getMonth())
      if (idxHoy !== -1) {
        idxCorte = idxHoy
      } else {
        idxCorte = Math.min(total - 1, Math.max(1, Math.round((currentAvance / 100) * (total - 1))))
      }
    }

    return listaMeses.map((m, idx) => {
      // Función S-curve estándar
      const t = idx / (total - 1)
      const prog = Math.round((3 * t * t - 2 * t * t * t) * 10000) / 100

      let real: number | null = null
      let esCorte = false

      if (idx <= idxCorte) {
        if (currentAvance === 0) {
          real = 0
          if (idx === idxCorte) esCorte = true
        } else {
          const factor = idx / Math.max(1, idxCorte)
          real = Math.round((currentAvance * (factor * factor * (3 - 2 * factor))) * 100) / 100
          if (idx === idxCorte) {
            real = currentAvance
            esCorte = true
          }
        }
      }

      const variacion = real !== null ? Number((real - prog).toFixed(2)) : null
      const montoProg = montoAjustadoVigente * (prog / 100)
      const montoReal = real !== null ? montoAjustadoVigente * (real / 100) : null

      return {
        mes: m.mes,
        fecha: m.fecha,
        prog,
        real,
        esCorte,
        variacion,
        montoProg,
        montoReal,
      }
    })
  }, [proyecto?.fechaInicioContractual, proyecto?.fechaInicio, proyecto?.fechaFinalizacionReal, (proyecto as any)?.fechaFinContractualPlan, proyecto?.fechaFin, proyecto?.avance, esBorrador, montoAjustadoVigente])

  return (
    <div className="space-y-2.5 font-[Poppins] text-[10.5px]">
      {/* Banner Superior Limpio (img5 corregido: sin fondo en icono y sin caja en anticipo) */}
      <div className="rounded-xl border border-gray-200 bg-white p-2.5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <Banknote size={16} className="text-[#9B0F06] shrink-0" />
            <div>
              <p className="text-[8px] font-bold uppercase tracking-wider text-gray-400">
                Presupuesto / Monto Contractual Global
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[13px] font-black text-gray-900 font-mono leading-none">
                  Q {montoContractualOriginal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-gray-500 font-medium">
                  · Anticipo: {(pctAnticipoEjec * 100).toFixed(0)}% (Q {anticipoOtorgado.toLocaleString('es-GT', { minimumFractionDigits: 2 })})
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
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

      {/* Sub-Pestañas Horizontales Estilo Hoja Sábana (Image 2) */}
      <div className="border-b border-gray-200 bg-white px-2">
        <nav className="-mb-px flex space-x-4">
          <button
            type="button"
            onClick={() => setSubTab('resumen')}
            className={`cursor-pointer whitespace-nowrap py-1.5 px-1.5 border-b-2 text-[10.5px] font-bold transition-all duration-200 flex items-center gap-1.5 ${
              subTab === 'resumen'
                ? 'border-[#9B0F06] text-[#9B0F06]'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <Layers size={12} className={subTab === 'resumen' ? 'text-[#9B0F06]' : 'text-gray-400'} />
            <span>Resumen</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('estimaciones')}
            className={`cursor-pointer whitespace-nowrap py-1.5 px-1.5 border-b-2 text-[10.5px] font-bold transition-all duration-200 flex items-center gap-1.5 ${
              subTab === 'estimaciones'
                ? 'border-[#9B0F06] text-[#9B0F06]'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <Receipt size={12} className={subTab === 'estimaciones' ? 'text-[#9B0F06]' : 'text-gray-400'} />
            <span>Estimaciones</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('curva')}
            className={`cursor-pointer whitespace-nowrap py-1.5 px-1.5 border-b-2 text-[10.5px] font-bold transition-all duration-200 flex items-center gap-1.5 ${
              subTab === 'curva'
                ? 'border-[#9B0F06] text-[#9B0F06]'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <TrendingUp size={12} className={subTab === 'curva' ? 'text-[#9B0F06]' : 'text-gray-400'} />
            <span>Gráfico</span>
          </button>
        </nav>
      </div>

      {/* ========================================================================= */}
      {/* 1. SUB-TAB 1: RESUMEN (KPIS + PROGRAMA DE TRABAJO CON PAGINACIÓN DE 10)    */}
      {/* ========================================================================= */}
      {subTab === 'resumen' && (
        <div className="space-y-2.5">
          {/* 3 Tarjetas de Resumen Financiero Ejecutivo Compacto */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono">
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
                <p className="text-[13px] font-black text-gray-900 font-mono">
                  Q {estimacionesGeneradas.reduce((acc, curr) => curr.perspectiva === 'ejecutora' && curr.estado === 'aprobada' ? acc + curr.montoLiquidoAPagar : acc, 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
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
                  <p className="text-[13px] font-black text-gray-900 font-mono">
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
                  <p className="text-[13px] font-black text-gray-900 font-mono">
                    92 <span className="text-[9px] font-semibold text-gray-500">días</span>
                  </p>
                  <span className="text-[8px] text-gray-500 font-sans">
                    Plazo: {pAny.plazoMeses ? `${Number(pAny.plazoMeses) * 30}d` : '365d'}
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
                  className="w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-[10px] font-semibold text-gray-700 focus:border-[#9B0F06] focus:outline-none cursor-pointer"
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
                  className="w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-[10px] font-semibold text-gray-700 focus:border-[#9B0F06] focus:outline-none cursor-pointer"
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
                <tbody className="divide-y divide-gray-100 font-mono text-[10px]">
                  {renglonesPaginados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-[10.5px] text-gray-500 font-sans">
                        No se encontraron renglones con los filtros seleccionados.
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

            {/* Paginación estilo Hoja Sábana */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 bg-gray-50/60 px-2.5 py-1 text-[8.5px] text-gray-600">
              <span className="font-medium">
                Página <strong className="text-gray-900">{paginaRenglones}</strong> de <strong className="text-gray-900">{totalPaginasRenglones}</strong> ({renglonesFiltrados.length} renglones totales)
              </span>

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
              <span className="text-[8.5px] font-extrabold uppercase tracking-wider text-gray-500">
                PERSPECTIVA:
              </span>
              <div className="inline-flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setPerspectivaEstimacion('ejecutora')
                    setPaginaEstimaciones(1)
                  }}
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[9.5px] font-bold transition-all cursor-pointer ${
                    perspectivaEstimacion === 'ejecutora'
                      ? 'bg-red-50 text-[#9B0F06] border border-red-200 shadow-2xs'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Building2 size={11} className={perspectivaEstimacion === 'ejecutora' ? 'text-[#9B0F06]' : 'text-gray-400'} />
                  <span>Empresa Ejecutora ({nombreEmpresaEjecutora})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPerspectivaEstimacion('supervisora')
                    setPaginaEstimaciones(1)
                  }}
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[9.5px] font-bold transition-all cursor-pointer ${
                    perspectivaEstimacion === 'supervisora'
                      ? 'bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <UserCheck size={11} className={perspectivaEstimacion === 'supervisora' ? 'text-blue-700' : 'text-gray-400'} />
                  <span>Empresa Supervisora ({nombreEmpresaSupervisora})</span>
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

              <div className="text-[8.5px] text-gray-400 font-medium pl-1">
                {estimacionesFiltradas.length} estimaciones
              </div>
            </div>
          </div>

          {/* Tabla de Estimaciones con Acción (Solo Ojo) y Paginación */}
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
                    <th className="px-2.5 py-1.5 text-center w-14">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono text-[10px]">
                  {estimacionesPaginadas.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-4 text-center text-[10px] text-gray-500 font-sans">
                        No se encontraron estimaciones con los filtros de fecha seleccionados.
                      </td>
                    </tr>
                  ) : (
                    estimacionesPaginadas.map((est) => (
                      <tr key={est.id} className="hover:bg-red-50/30 transition-colors">
                        {/* No. Estimación & Nombre */}
                        <td className="px-2.5 py-1.5 font-sans">
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-gray-900">{est.numero}</span>
                            <span className="text-[8px] text-gray-400 font-mono">({est.estado.toUpperCase()})</span>
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

                        {/* Botón Acción: Solo Icono de Ojo */}
                        <td className="px-2.5 py-1.5 text-center font-sans">
                          <button
                            type="button"
                            onClick={() => navegarAHojaSabana({ estimacion: est.numero })}
                            disabled={!tieneAccesoHojaSabana}
                            className={`inline-flex h-6 w-6 items-center justify-center rounded transition-colors ${
                              tieneAccesoHojaSabana
                                ? 'text-gray-600 hover:text-[#9B0F06] hover:bg-red-50 cursor-pointer shadow-2xs'
                                : 'text-gray-300 cursor-not-allowed'
                            }`}
                            title={tieneAccesoHojaSabana ? `Ver Hoja Sábana para ${est.numero}` : 'Solo el Delegado Residente o Administrador tiene acceso'}
                          >
                            {tieneAccesoHojaSabana ? <Eye size={13} /> : <Lock size={12} />}
                          </button>
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
        <div className="space-y-3 font-[Poppins]">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs space-y-3">
            <div className="text-center pb-1">
              <h2 className="text-sm font-black tracking-wide text-gray-900 uppercase">
                PROGRAMADO / EJECUTADO ACUMULADO MENSUAL
              </h2>
            </div>

            {/* Contenedor SVG Responsivo de la Curva S */}
            <div className="relative w-full bg-white rounded-lg p-2 select-none overflow-x-auto">
              <div className="w-full min-w-[650px]">
                {(() => {
                  const total = puntosCurvaS.length
                  const svgWidth = Math.max(760, total * 48)
                  const xStep = (svgWidth - 90) / Math.max(1, total - 1)

                  const ptsProg = puntosCurvaS.map((p, idx) => ({
                    x: 55 + idx * xStep,
                    y: 175 - ((p.prog + 20) / 140) * 145,
                    data: p,
                  }))

                  const ptsReal = puntosCurvaS
                    .filter((p) => p.real !== null)
                    .map((p, idx) => ({
                      x: 55 + idx * xStep,
                      y: 175 - (((p.real as number) + 20) / 140) * 145,
                      data: p,
                    }))

                  const dProg = ptsProg.reduce((acc, curr, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${curr.x} ${curr.y}`, '')
                  const dReal = ptsReal.reduce((acc, curr, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${curr.x} ${curr.y}`, '')

                  return (
                    <svg viewBox={`0 0 ${svgWidth} 250`} className="w-full h-auto max-h-[320px] overflow-visible">
                      {/* Cuadrícula Horizontal Y de -20% a 120% */}
                      {[-20, 0, 20, 40, 60, 80, 100, 120].map((pct) => {
                        const y = 175 - ((pct + 20) / 140) * 145
                        return (
                          <g key={pct}>
                            <line x1="50" y1={y} x2={svgWidth - 20} y2={y} stroke="#e5e7eb" strokeWidth="1" />
                            <text x="44" y={y + 3} textAnchor="end" fontSize="8" fill="#4b5563" fontFamily="sans-serif" fontWeight="500">
                              {pct.toFixed(2)}%
                            </text>
                          </g>
                        )
                      })}

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
                    minWidth: '220px',
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
                      <span className="font-sans font-semibold">% Programado Acumulado:</span>
                      <span className="font-bold">{tooltipCurva.data.prog.toFixed(2)}%</span>
                    </div>

                    {tooltipCurva.data.real !== null ? (
                      <>
                        <div className="flex justify-between text-[#9B0F06]">
                          <span className="font-sans font-semibold">% Ejecutado Acumulado:</span>
                          <span className="font-bold">{tooltipCurva.data.real.toFixed(2)}%</span>
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
                % Prog Acum Mensual
              </span>
              <span className="flex items-center gap-2 text-gray-700">
                <span className="h-0.5 w-6 bg-[#9B0F06] inline-block rounded" />
                % Ejecut Acum Mensual
              </span>
            </div>

            {/* Resumen Compacto de Desviación y Rendimiento Dinámico */}
            {(() => {
              const puntoCorte = puntosCurvaS.find((p) => p.esCorte) || puntosCurvaS[0]
              const desviacionVal = puntoCorte?.variacion ?? 0
              const spiVal = (puntoCorte && puntoCorte.prog > 0 && puntoCorte.real !== null)
                ? (puntoCorte.real / puntoCorte.prog)
                : (Number(proyecto?.avance || 0) > 0 ? 1.0 : 0)
              const mesCorteTexto = puntoCorte?.mes || 'A la fecha'

              return (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] font-mono pt-2">
                  <div className="rounded-lg border border-gray-200 bg-gray-50/70 p-2">
                    <span className="text-[8px] font-bold uppercase tracking-wider text-gray-500 font-sans block">
                      Desviación a la Fecha ({mesCorteTexto})
                    </span>
                    <p className={`text-[12px] font-black mt-0.5 ${desviacionVal >= 0 ? 'text-emerald-700' : 'text-[#9B0F06]'}`}>
                      {desviacionVal >= 0 ? '+' : ''}{desviacionVal.toFixed(2)}% ({desviacionVal >= 0 ? 'Adelanto respecto al plan' : 'Desfase respecto al plan'})
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
                      Amortizado: Q {anticipoAmortizado.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProyectoInformacionFinanciera
