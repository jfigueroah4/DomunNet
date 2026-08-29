// @ts-nocheck
'use client'
import React, { useState, useMemo, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Filter,
  Maximize2,
  Printer,
  Search,
  Building2,
  MapPin,
  Clock,
  Banknote,
  Calculator,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Layers,
  FileCheck2,
  AlertCircle,
  FileText,
  RotateCcw,
  Eraser,
  Plus,
  Eye,
  Edit2,
  Trash2,
  X,
  Save,
  Check,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronUp,
  TrendingUp,
  ArrowRight,
  AlertTriangle,
  History,
  CalendarClock,
  Info,
} from 'lucide-react'
import { PROYECTOS_MOCK } from '@/data/proyectos.mock'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/useAuthStore'

export interface RenglonDetalladoSabana {
  id: string
  capituloId: number
  capituloNombre: string
  codigoDGC: string
  descripcion: string
  unidad: string
  cantidadContratada: number
  cantidadAjustada: number
  costoUnitarioDirecto: number
  cantidadEstePeriodo: number
  cantidadAcumuladaAnterior: number
  tipoRenglon?: 'Original' | 'Aumento' | 'Nuevo'
  estadoEjecucion?: 'En proceso' | 'Completado' | 'No iniciado' | 'Con excedente'
  avancesMensuales?: Record<string, number>
  fechaInicioPlan?: string
  fechaFinPlan?: string
}

// Estructura de MediciÃƒÂ³n de Campo para el Tab AnalÃƒÂ­tico
export interface MedicionAnaliticaCampo {
  id: string
  codigoDGC: string
  estacionInicio: string
  estacionFin: string
  longitudL: number
  anchoA: number
  alturaH: number
  mesPeriodo: string
  numEstimacion: string
  observaciones?: string
}

// Estructura de Trabajo Pendiente para el Tab Pendientes
export interface TrabajoPendienteBolsa {
  id: string
  codigoDGC: string
  descripcion: string
  unidad: string
  origenTrazabilidad: string
  longitudBase: number
  factorDescuento: number
  cantidadBruta: number
  costoUnitario: number
  estado: 'Pendiente' | 'Aprobado' | 'Trasladado'
  mesesAntiguedad: number
}

const CAPITULOS_LIBRO_AZUL = [
  { id: 1, nombre: 'CapÃƒÂ­tulo I: Estudios, Mantenimiento y Trabajos Preliminares' },
  { id: 2, nombre: 'CapÃƒÂ­tulo II: Movimiento de Tierras y ExcavaciÃƒÂ³n' },
  { id: 3, nombre: 'CapÃƒÂ­tulo III: Terraplenes Estructurales y Capas de Soporte' },
  { id: 4, nombre: 'CapÃƒÂ­tulo IV: Subbases y Bases Granulares' },
  { id: 5, nombre: 'CapÃƒÂ­tulo V: Pavimentos AsfÃƒÂ¡lticos y Concreto' },
  { id: 6, nombre: 'CapÃƒÂ­tulo VI: Estructuras de Drenaje Pluvial' },
  { id: 7, nombre: 'CapÃƒÂ­tulo VII: BÃƒÂ³vedas MetÃƒÂ¡licas y Obras de Arte' },
  { id: 8, nombre: 'CapÃƒÂ­tulo VIII: Construcciones Complementarias y SeÃƒÂ±alizaciÃƒÂ³n' },
  { id: 9, nombre: 'CapÃƒÂ­tulo IX: Aspectos Ambientales y GestiÃƒÂ³n de Riesgo' },
]

// 88 RENGLONES OFICIALES
const CATALOGO_DETALLADO_88_RENGLONES: RenglonDetalladoSabana[] = [
  {
    id: 'sab-1',
    capituloId: 1,
    capituloNombre: 'CapÃƒÂ­tulo I: Estudios, Mantenimiento y Trabajos Preliminares',
    codigoDGC: '101.01',
    descripcion: 'Mantenimiento del trÃƒÂ¡nsito y construcciÃƒÂ³n de desvÃƒÂ­os provisionales',
    unidad: 'Glb',
    cantidadContratada: 1,
    cantidadAjustada: 1,
    costoUnitarioDirecto: 250000,
    cantidadEstePeriodo: 0.1,
    cantidadAcumuladaAnterior: 0.6,
    tipoRenglon: 'Original',
    estadoEjecucion: 'En proceso',
    avancesMensuales: { 'Mes 1': 0.1, 'Mes 2': 0.1, 'Mes 3': 0.1, 'Mes 4': 0.1, 'Mes 5': 0.1, 'Mes 6': 0.1, 'Mes 7': 0.1 },
  },
  {
    id: 'sab-2',
    capituloId: 1,
    capituloNombre: 'CapÃƒÂ­tulo I: Estudios, Mantenimiento y Trabajos Preliminares',
    codigoDGC: '102.03',
    descripcion: 'Clechado, chapeo, destronque y limpieza del derecho de vÃƒÂ­a',
    unidad: 'Ha',
    cantidadContratada: 18.5,
    cantidadAjustada: 18.5,
    costoUnitarioDirecto: 18500,
    cantidadEstePeriodo: 1.5,
    cantidadAcumuladaAnterior: 16.0,
    tipoRenglon: 'Original',
    estadoEjecucion: 'En proceso',
    avancesMensuales: { 'Mes 1': 4.0, 'Mes 2': 4.0, 'Mes 3': 4.0, 'Mes 4': 2.0, 'Mes 5': 2.0, 'Mes 6': 1.5 },
  },
  {
    id: 'sab-3',
    capituloId: 1,
    capituloNombre: 'CapÃƒÂ­tulo I: Estudios, Mantenimiento y Trabajos Preliminares',
    codigoDGC: '103.01',
    descripcion: 'DemoliciÃƒÂ³n de estructuras existentes de concreto y mamposterÃƒÂ­a',
    unidad: 'mÃ‚Â³',
    cantidadContratada: 1200,
    cantidadAjustada: 1200,
    costoUnitarioDirecto: 280,
    cantidadEstePeriodo: 100,
    cantidadAcumuladaAnterior: 1100,
    tipoRenglon: 'Original',
    estadoEjecucion: 'Completado',
    avancesMensuales: { 'Mes 1': 300, 'Mes 2': 400, 'Mes 3': 200, 'Mes 4': 100, 'Mes 5': 100, 'Mes 6': 100 },
  },
  {
    id: 'sab-11',
    capituloId: 2,
    capituloNombre: 'CapÃƒÂ­tulo II: Movimiento de Tierras y ExcavaciÃƒÂ³n',
    codigoDGC: '201.01',
    descripcion: 'ExcavaciÃƒÂ³n no clasificada para corte en vÃƒÂ­a',
    unidad: 'mÃ‚Â³',
    cantidadContratada: 45000,
    cantidadAjustada: 48000,
    costoUnitarioDirecto: 68,
    cantidadEstePeriodo: 3500,
    cantidadAcumuladaAnterior: 41000,
    tipoRenglon: 'Aumento',
    estadoEjecucion: 'En proceso',
    avancesMensuales: { 'Mes 1': 8000, 'Mes 2': 10000, 'Mes 3': 11000, 'Mes 4': 7000, 'Mes 5': 5000, 'Mes 6': 3500 },
  },
  {
    id: 'sab-12',
    capituloId: 2,
    capituloNombre: 'CapÃƒÂ­tulo II: Movimiento de Tierras y ExcavaciÃƒÂ³n',
    codigoDGC: '201.03(b)',
    descripcion: 'ExcavaciÃƒÂ³n en roca mediante perforaciÃƒÂ³n y voladura controlada',
    unidad: 'mÃ‚Â³',
    cantidadContratada: 12500,
    cantidadAjustada: 14000,
    costoUnitarioDirecto: 210,
    cantidadEstePeriodo: 1200,
    cantidadAcumuladaAnterior: 11800,
    tipoRenglon: 'Aumento',
    estadoEjecucion: 'Con excedente',
    avancesMensuales: { 'Mes 1': 2000, 'Mes 2': 3000, 'Mes 3': 3500, 'Mes 4': 2000, 'Mes 5': 1300, 'Mes 6': 1200 },
  },
  {
    id: 'sab-38',
    capituloId: 5,
    capituloNombre: 'CapÃƒÂ­tulo V: Pavimentos AsfÃƒÂ¡lticos y Concreto',
    codigoDGC: '551.03',
    descripcion: 'Pavimento de concreto hidrÃƒÂ¡ulico MR=48 e=25cm para tramos de carga pesada',
    unidad: 'mÃ‚Â²',
    cantidadContratada: 18000,
    cantidadAjustada: 18000,
    costoUnitarioDirecto: 460,
    cantidadEstePeriodo: 1600,
    cantidadAcumuladaAnterior: 14800,
    tipoRenglon: 'Nuevo',
    estadoEjecucion: 'En proceso',
    avancesMensuales: { 'Mes 3': 3000, 'Mes 4': 5000, 'Mes 5': 6800, 'Mes 6': 1600 },
  },
]

// Generar 88 renglones
const GENERAR_88_RENGLONES = (): RenglonDetalladoSabana[] => {
  const lista = [...CATALOGO_DETALLADO_88_RENGLONES]
  let currentId = 50

  CAPITULOS_LIBRO_AZUL.forEach((cap) => {
    const existentesCap = lista.filter((r) => r.capituloId === cap.id)
    const faltantes = 10 - existentesCap.length

    for (let i = 1; i <= faltantes; i++) {
      currentId++
      const codSub = `${cap.id}0${i}.${i < 10 ? '0' + i : i}-C${i}`
      lista.push({
        id: `sab-gen-${currentId}`,
        capituloId: cap.id,
        capituloNombre: cap.nombre,
        codigoDGC: codSub,
        descripcion: `RenglÃƒÂ³n complementario de ${cap.nombre.split(':')[1]?.trim() || 'Obra Vial'} No. ${i}`,
        unidad: i % 2 === 0 ? 'mÃ‚Â³' : i % 3 === 0 ? 'ml' : 'mÃ‚Â²',
        cantidadContratada: 1000 + i * 250,
        cantidadAjustada: 1000 + i * 250,
        costoUnitarioDirecto: 120 + i * 15,
        cantidadEstePeriodo: i % 4 === 0 ? 0 : 100 + i * 10,
        cantidadAcumuladaAnterior: 500 + i * 50,
        tipoRenglon: i % 5 === 0 ? 'Nuevo' : i % 3 === 0 ? 'Aumento' : 'Original',
        estadoEjecucion: i % 4 === 0 ? 'No iniciado' : i % 6 === 0 ? 'Completado' : 'En proceso',
        avancesMensuales: {
          'Mes 1': 100,
          'Mes 2': 150,
          'Mes 3': 150,
          'Mes 4': 100,
          'Mes 5': 100,
          'Mes 6': 100 + i * 10,
        },
        fechaInicioPlan: '2025-01-20',
        fechaFinPlan: '2026-06-30',
      })
    }
  })

  return lista
}

const CATALOGO_COMPLETO_88 = GENERAR_88_RENGLONES()

// Mediciones
const MEDICIONES_ANALITICAS_MOCK: MedicionAnaliticaCampo[] = [
  { id: 'm-1', codigoDGC: '201.01', estacionInicio: '14+200', estacionFin: '14+700', longitudL: 500, anchoA: 7.3, alturaH: 0.95, mesPeriodo: 'Mes 6', numEstimacion: 'Est. 08', observaciones: 'Ancho promedio verificado segÃƒÂºn libreta de nivelaciÃƒÂ³n topogrÃƒÂ¡fica NÃ‚Â° 04.' },
  { id: 'm-2', codigoDGC: '201.01', estacionInicio: '14+700', estacionFin: '15+100', longitudL: 400, anchoA: 7.3, alturaH: 0.95, mesPeriodo: 'Mes 6', numEstimacion: 'Est. 08', observaciones: 'Alineamiento ajustado por presencia de talud de corte cÃƒÂ³ncavo.' },
  { id: 'm-3', codigoDGC: '201.03(b)', estacionInicio: '15+200', estacionFin: '15+500', longitudL: 300, anchoA: 4.0, alturaH: 1.0, mesPeriodo: 'Mes 6', numEstimacion: 'Est. 08', observaciones: 'Volumen derivado de perforaciÃƒÂ³n y voladura en banco de material rocoso duro.' },
  { id: 'm-4', codigoDGC: '551.03', estacionInicio: '14+200', estacionFin: '14+600', longitudL: 400, anchoA: 3.65, alturaH: 0.25, mesPeriodo: 'Mes 6', numEstimacion: 'Est. 08', observaciones: 'Espesor verificado con reglas de nivel durante la fundiciÃƒÂ³n continua de carril derecho.' },
]

// Trabajos Pendientes
const TRABAJOS_PENDIENTES_MOCK: TrabajoPendienteBolsa[] = [
  {
    id: 'p-1',
    codigoDGC: '201.03(b)',
    descripcion: 'ExcavaciÃƒÂ³n en roca mediante voladura en talud inestable',
    unidad: 'mÃ‚Â³',
    origenTrazabilidad: 'Volumen excede cupo contractual acumulado (48,000 mÃ‚Â³ max)',
    longitudBase: 500,
    factorDescuento: 0.657,
    cantidadBruta: 1500,
    costoUnitario: 210,
    estado: 'Pendiente',
    mesesAntiguedad: 4,
  },
  {
    id: 'p-2',
    codigoDGC: '504.01',
    descripcion: 'Pavimento de concreto hidrÃƒÂ¡ulico MR=45 tramo auxiliar',
    unidad: 'mÃ‚Â²',
    origenTrazabilidad: 'Control de Calidad: Prueba de resistencia en corazones de concreto pendiente',
    longitudBase: 350,
    factorDescuento: 0.15,
    cantidadBruta: 800,
    costoUnitario: 380,
    estado: 'Pendiente',
    mesesAntiguedad: 2,
  },
]

type ColumnaOrdenable = keyof RenglonDetalladoSabana | 'totalAFecha' | 'avancePct' | 'costoTotalAFecha' | 'saldoPorEjecutar' | string

export function HojaSabanaView({ slug }: { slug?: string }) {
  const navigate = useRouter()
  const { profile: user } = useAuthStore()

  const [proyectoIdSeleccionado, setProyectoIdSeleccionado] = useState<string>(slug || PROYECTOS_MOCK[0]?.id || 'p-1')

  const esPlantillaVacia = proyectoIdSeleccionado === 'nuevo' || proyectoIdSeleccionado === 'crear'

  const proyecto = useMemo(() => {
    if (esPlantillaVacia) {
      return {
        id: 'nuevo',
        codigo: 'PROY-000',
        nombre: 'Nuevo Proyecto Vial (Plantilla SÃƒÂ¡bana VacÃƒÂ­a)',
        presupuesto: 0,
        plazo: '0 Meses (0 dÃƒÂ­as)',
        ubicacion: 'Guatemala',
        responsable: 'Sin Asignar',
        estado: 'borrador' as const,
        avance: 0,
        equipo: [],
        fases: [],
        documentos: [],
        fechaInicio: '',
        fechaFin: '',
      }
    }
    return PROYECTOS_MOCK.find((p) => p.id === proyectoIdSeleccionado) || PROYECTOS_MOCK[0]
  }, [proyectoIdSeleccionado, esPlantillaVacia])

  const [tabSeccion, setTabSeccion] = useState<'sabana' | 'analitico' | 'pendientes' | 'planificadoReal' | 'resumen'>('sabana')
  const [modoVistaSabana, setModoVistaSabana] = useState<'planificacion' | 'actual'>('actual')

  // MODAL MODIFICAR PLAZO
  const [modalModificarPlazoOpen, setModalModificarPlazoOpen] = useState(false)
  const [formNuevaFechaFin, setFormNuevaFechaFin] = useState('2026-12-31')
  const [formMotivoPlazo, setFormMotivoPlazo] = useState<'ampliacion' | 'retraso' | 'orden_cambio'>('ampliacion')
  const [formDiasAdicionales, setFormDiasAdicionales] = useState('30')
  const [formObservacionesPlazo, setFormObservacionesPlazo] = useState('')
  const [errorsPlazoForm, setErrorsPlazoForm] = useState<Record<string, boolean>>({})

  // FECHA FINALIZACIÃƒâ€œN ACTUALIZADA
  const [fechaFinalizacionActualizada, setFechaFinalizacionActualizada] = useState('30/11/2026')

  const [capituloFiltro, setCapituloFiltro] = useState<number | 'todos'>('todos')
  const [mesFiltro, setMesFiltro] = useState<string | 'todos'>('todos')
  const [estadoEjecucionFiltro, setEstadoEjecucionFiltro] = useState<string | 'todos'>('todos')
  const [tipoRenglonFiltro, setTipoRenglonFiltro] = useState<string | 'todos'>('todos')
  const [numEstimacionFiltro, setNumEstimacionFiltro] = useState<string | 'todos'>('todos')

  const [busqueda, setBusqueda] = useState('')
  const [capitulosColapsados, setCapitulosColapsados] = useState<Record<number, boolean>>({})

  const [itemsPorPagina, setItemsPorPagina] = useState<number>(12)
  const [paginaActual, setPaginaActual] = useState<number>(1)

  // PaginaciÃƒÂ³n para Tab "Planificado vs Real"
  const [pvrItemsPorPagina, setPvrItemsPorPagina] = useState<number>(10)
  const [pvrPaginaActual, setPvrPaginaActual] = useState<number>(1)

  const [renglones, setRenglones] = useState<RenglonDetalladoSabana[]>(esPlantillaVacia ? [] : CATALOGO_COMPLETO_88)
  const [medicionesAnaliticas, setMedicionesAnaliticas] = useState<MedicionAnaliticaCampo[]>(esPlantillaVacia ? [] : MEDICIONES_ANALITICAS_MOCK)
  const [trabajosPendientes, setTrabajosPendientes] = useState<TrabajoPendienteBolsa[]>(esPlantillaVacia ? [] : TRABAJOS_PENDIENTES_MOCK)

  const [columnaOrden, setColumnaOrden] = useState<ColumnaOrdenable | null>(null)
  const [direccionOrden, setDireccionOrden] = useState<'asc' | 'desc'>('asc')

  const [filaEditandoId, setFilaEditandoId] = useState<string | null>(null)
  const [datosEditando, setDatosEditando] = useState<Partial<RenglonDetalladoSabana>>({})

  const [drawerModo, setDrawerModo] = useState<'crear' | 'ver' | null>(null)
  const [renglonSeleccionado, setRenglonSeleccionado] = useState<RenglonDetalladoSabana | null>(null)
  const [modalEliminarOpen, setModalEliminarOpen] = useState(false)
  const [renglonAEliminar, setRenglonAEliminar] = useState<RenglonDetalladoSabana | null>(null)

  // CAMPOS FORMULARIO CREAR DENSIDAD COMPACTA (PATRÃƒâ€œN USUARIOS)
  const [formCodigo, setFormCodigo] = useState('')
  const [formDescripcion, setFormDescripcion] = useState('')
  const [formUnidad, setFormUnidad] = useState('mÃ‚Â³')
  const [formUnidadManual, setFormUnidadManual] = useState('')
  const [formCantContratada, setFormCantContratada] = useState('')
  const [formCantAjustada, setFormCantAjustada] = useState('')
  const [formCostoUnitario, setFormCostoUnitario] = useState('')
  const [formCapituloId, setFormCapituloId] = useState(1)
  const [formTipoRenglon, setFormTipoRenglon] = useState<'Original' | 'Aumento' | 'Nuevo'>('Original')
  const [formEstadoEjecucion, setFormEstadoEjecucion] = useState<'En proceso' | 'Completado' | 'No iniciado' | 'Con excedente'>('En proceso')

  // ESTADO DE ERRORES DE VALIDACIÃƒâ€œN PARA DIBUJAR BORDES ROJOS (PATRÃƒâ€œN USUARIOS)
  const [errorsForm, setErrorsForm] = useState<Record<string, boolean>>({})

  const listaMesesDinamicos = useMemo(() => {
    // Calculo del plazo contractual en base a la fecha de inicio y fecha de finalizaciÃƒÂ³n (o plazo modificado)
    let duracionMeses = 18

    const parseFecha = (fechaStr: string) => {
      if (!fechaStr) return null
      // Si la fecha viene en formato dd/mm/yyyy
      if (fechaStr.includes('/')) {
        const [dd, mm, yyyy] = fechaStr.split('/')
        if (dd && mm && yyyy) return new Date(`${yyyy}-${mm}-${dd}T00:00:00`)
      }
      // Si viene en formato yyyy-mm-dd
      if (fechaStr.includes('-')) {
        return new Date(`${fechaStr}T00:00:00`)
      }
      return null
    }

    const fechaInicio = parseFecha(proyecto.fechaInicio || '20/01/2025')
    const fechaFin = parseFecha(fechaFinalizacionActualizada || proyecto.fechaFin || '30/11/2026')

    if (fechaInicio && fechaFin && !isNaN(fechaInicio.getTime()) && !isNaN(fechaFin.getTime())) {
      let months = (fechaFin.getFullYear() - fechaInicio.getFullYear()) * 12
      months -= fechaInicio.getMonth()
      months += fechaFin.getMonth()
      // Si la fecha de fin es mayor en dÃƒÂ­as al dÃƒÂ­a de inicio en el mismo mes, sumamos 1 mes
      if (fechaFin.getDate() >= fechaInicio.getDate()) {
        months += 1
      }
      duracionMeses = Math.max(1, months)
    } else if (proyecto.plazo) {
      const match = proyecto.plazo.match(/\d+/)
      if (match) {
        const val = parseInt(match[0], 10)
        duracionMeses = val > 60 ? Math.round(val / 30) : val
      }
    }

    const meses = []
    // Limitamos la generaciÃƒÂ³n a 36 meses como mÃƒÂ¡ximo preventivo
    for (let i = 1; i <= Math.min(duracionMeses, 36); i++) {
      meses.push(`Mes ${i}`)
    }
    return meses
  }, [proyecto, fechaFinalizacionActualizada])

  const handlePromoverTrabajoPendiente = (item: TrabajoPendienteBolsa) => {
    const descuentoAplicado = item.longitudBase * item.factorDescuento
    const cantidadNetaCalculada = Math.max(0, item.cantidadBruta - descuentoAplicado)

    // Buscar el renglÃƒÂ³n correspondiente en la SÃƒÂ¡bana
    const renglonDestino = renglones.find((r) => r.codigoDGC === item.codigoDGC)

    if (renglonDestino) {
      const ejecutadoAcumuladoActual = renglonDestino.cantidadAcumuladaAnterior + renglonDestino.cantidadEstePeriodo
      const nuevoTotalPostPromocion = ejecutadoAcumuladoActual + cantidadNetaCalculada
      const cupoDisponible = renglonDestino.cantidadAjustada - ejecutadoAcumuladoActual

      if (nuevoTotalPostPromocion > renglonDestino.cantidadAjustada) {
        toast.error(
          `PromociÃƒÂ³n bloqueada: La Cantidad Neta (${cantidadNetaCalculada.toLocaleString('es-GT', { minimumFractionDigits: 2 })} ${item.unidad}) supera el cupo contractual disponible (${Math.max(0, cupoDisponible).toLocaleString('es-GT', { minimumFractionDigits: 2 })} ${item.unidad}) para el renglÃƒÂ³n ${item.codigoDGC}. Requiere una orden de cambio o ampliaciÃƒÂ³n aprobada.`
        )
        return
      }
    }

    setTrabajosPendientes((prev) =>
      prev.map((p) => (p.id === item.id ? { ...p, estado: 'Trasladado' } : p))
    )

    const nuevaMedicion: MedicionAnaliticaCampo = {
      id: `m-promovid-${Date.now()}`,
      codigoDGC: item.codigoDGC,
      estacionInicio: '15+000',
      estacionFin: '15+500',
      longitudL: cantidadNetaCalculada > 0 ? cantidadNetaCalculada : 100,
      anchoA: 1.0,
      alturaH: 1.0,
      mesPeriodo: 'Mes 6',
      numEstimacion: 'Est. 08',
      observaciones: `Promovido desde Bolsa de Pendientes. Origen: ${item.origenTrazabilidad}`,
    }

    setMedicionesAnaliticas((prev) => [nuevaMedicion, ...prev])

    setRenglones((prev) =>
      prev.map((r) => {
        if (r.codigoDGC === item.codigoDGC) {
          return {
            ...r,
            cantidadEstePeriodo: r.cantidadEstePeriodo + cantidadNetaCalculada,
          }
        }
        return r
      })
    )

    toast.success(`Partida ${item.codigoDGC} promovida con ÃƒÂ©xito e integrada a 'Este Periodo' en la SÃƒÂ¡bana y Memoria AnalÃƒÂ­tica`)
  }

  const handleOrdenarPorColumna = (col: ColumnaOrdenable) => {
    if (columnaOrden === col) {
      if (direccionOrden === 'asc') {
        setDireccionOrden('desc')
      } else {
        setColumnaOrden(null)
        setDireccionOrden('asc')
      }
    } else {
      setColumnaOrden(col)
      setDireccionOrden('asc')
    }
  }

  const handleAbrirCrear = () => {
    setRenglonSeleccionado(null)
    setFormCodigo('')
    setFormDescripcion('')
    setFormUnidad('mÃ‚Â³')
    setFormUnidadManual('')
    setFormCantContratada('')
    setFormCantAjustada('')
    setFormCostoUnitario('')
    setFormCapituloId(1)
    setFormTipoRenglon('Original')
    setFormEstadoEjecucion('No iniciado')
    setErrorsForm({})
    setDrawerModo('crear')
  }

  const handleAbrirVer = (r: RenglonDetalladoSabana) => {
    setRenglonSeleccionado(r)
    setDrawerModo('ver')
  }

  const handleIniciarEdicionInline = (r: RenglonDetalladoSabana) => {
    setFilaEditandoId(r.id)
    setDatosEditando({ ...r })
  }

  const handleCambiarCodigoInline = (codigoElegido: string) => {
    const itemCatalogo = CATALOGO_COMPLETO_88.find((item) => item.codigoDGC === codigoElegido)
    if (itemCatalogo) {
      setDatosEditando((prev) => ({
        ...prev,
        codigoDGC: itemCatalogo.codigoDGC,
        descripcion: itemCatalogo.descripcion,
        unidad: itemCatalogo.unidad,
        capituloId: itemCatalogo.capituloId,
        capituloNombre: itemCatalogo.capituloNombre,
      }))
    } else {
      setDatosEditando((prev) => ({ ...prev, codigoDGC: codigoElegido }))
    }
  }

  const handleGuardarEdicionInline = (id: string) => {
    setRenglones((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          return {
            ...r,
            ...datosEditando,
            codigoDGC: datosEditando.codigoDGC || r.codigoDGC,
            descripcion: datosEditando.descripcion || r.descripcion,
            unidad: datosEditando.unidad || r.unidad,
            cantidadContratada: datosEditando.cantidadContratada ?? r.cantidadContratada,
            cantidadAjustada: datosEditando.cantidadAjustada ?? r.cantidadAjustada,
            cantidadEstePeriodo: datosEditando.cantidadEstePeriodo ?? r.cantidadEstePeriodo,
            cantidadAcumuladaAnterior: datosEditando.cantidadAcumuladaAnterior ?? r.cantidadAcumuladaAnterior,
            costoUnitarioDirecto: datosEditando.costoUnitarioDirecto ?? r.costoUnitarioDirecto,
          } as RenglonDetalladoSabana
        }
        return r
      })
    )
    setFilaEditandoId(null)
    setDatosEditando({})
    toast.success('Cambios guardados directamente en la tabla')
  }

  const handleCancelarEdicionInline = () => {
    setFilaEditandoId(null)
    setDatosEditando({})
  }

  const handleAbrirEliminar = (r: RenglonDetalladoSabana) => {
    setRenglonAEliminar(r)
    setModalEliminarOpen(true)
  }

  // REQUERIMIENTO: VALIDACIÃƒâ€œN CON BORDES ROJOS Y INSTANCIA TOAST REAL DE TOAST.TSX (PATRÃƒâ€œN USUARIOS)
  const handleGuardarRenglonCrear = () => {
    const errs: Record<string, boolean> = {}

    if (!formCodigo.trim()) errs.codigo = true
    if (!formDescripcion.trim()) errs.descripcion = true
    if (!formCantContratada || Number(formCantContratada) <= 0) errs.cantContratada = true
    if (!formCostoUnitario || Number(formCostoUnitario) <= 0) errs.costoUnitario = true

    if (Object.keys(errs).length > 0) {
      setErrorsForm(errs)
      toast.error('Por favor complete todos los campos obligatorios (*)')
      return
    }

    const unidadFinal = formUnidad === 'otra' ? formUnidadManual.trim() || 'U' : formUnidad
    const capObj = CAPITULOS_LIBRO_AZUL.find((c) => c.id === formCapituloId)

    const nuevo: RenglonDetalladoSabana = {
      id: `sab-custom-${Date.now()}`,
      capituloId: formCapituloId,
      capituloNombre: capObj?.nombre || 'CapÃƒÂ­tulo I',
      codigoDGC: formCodigo.trim(),
      descripcion: formDescripcion.trim(),
      unidad: unidadFinal,
      cantidadContratada: Number(formCantContratada),
      cantidadAjustada: Number(formCantAjustada) || Number(formCantContratada),
      costoUnitarioDirecto: Number(formCostoUnitario),
      cantidadEstePeriodo: 0,
      cantidadAcumuladaAnterior: 0,
      tipoRenglon: formTipoRenglon,
      estadoEjecucion: formEstadoEjecucion,
    }

    setRenglones((prev) => [nuevo, ...prev])
    toast.success(`Se agregÃƒÂ³ el renglÃƒÂ³n ${formCodigo.trim()} exitosamente`)
    setDrawerModo(null)
  }

  const handleConfirmarEliminar = () => {
    if (renglonAEliminar) {
      setRenglones((prev) => prev.filter((r) => r.id !== renglonAEliminar.id))
      toast.success(`Se eliminÃƒÂ³ el renglÃƒÂ³n ${renglonAEliminar.codigoDGC}`)
    }
    setModalEliminarOpen(false)
    setRenglonAEliminar(null)
  }

  // Filtrado y Ordenamiento
  const renglonesFiltradosYOrdenados = useMemo(() => {
    let resultado = renglones.filter((r) => {
      const matchCap = capituloFiltro === 'todos' || r.capituloId === capituloFiltro
      const matchEstado = estadoEjecucionFiltro === 'todos' || r.estadoEjecucion === estadoEjecucionFiltro
      const matchTipo = tipoRenglonFiltro === 'todos' || r.tipoRenglon === tipoRenglonFiltro
      const matchMes =
        mesFiltro === 'todos' || (r.avancesMensuales && (r.avancesMensuales[mesFiltro] || 0) > 0)
      const matchSearch = `${r.codigoDGC} ${r.descripcion} ${r.unidad} ${r.capituloNombre}`
        .toLowerCase()
        .includes(busqueda.toLowerCase())

      return matchCap && matchEstado && matchTipo && matchMes && matchSearch
    })

    if (columnaOrden) {
      resultado = [...resultado].sort((a, b) => {
        let valA: any = 0
        let valB: any = 0

        if (columnaOrden === 'codigoDGC') {
          valA = a.codigoDGC
          valB = b.codigoDGC
        } else if (columnaOrden === 'descripcion') {
          valA = a.descripcion.toLowerCase()
          valB = b.descripcion.toLowerCase()
        } else if (columnaOrden === 'unidad') {
          valA = a.unidad.toLowerCase()
          valB = b.unidad.toLowerCase()
        } else if (columnaOrden === 'cantidadContratada') {
          valA = a.cantidadContratada
          valB = b.cantidadContratada
        } else if (columnaOrden === 'cantidadAjustada') {
          valA = a.cantidadAjustada
          valB = b.cantidadAjustada
        } else if (columnaOrden === 'cantidadEstePeriodo') {
          valA = a.cantidadEstePeriodo
          valB = b.cantidadEstePeriodo
        } else if (columnaOrden === 'cantidadAcumuladaAnterior') {
          valA = a.cantidadAcumuladaAnterior
          valB = b.cantidadAcumuladaAnterior
        } else if (columnaOrden === 'totalAFecha') {
          valA = a.cantidadEstePeriodo + a.cantidadAcumuladaAnterior
          valB = b.cantidadEstePeriodo + b.cantidadAcumuladaAnterior
        } else if (columnaOrden === 'avancePct') {
          valA = a.cantidadAjustada > 0 ? (a.cantidadEstePeriodo + a.cantidadAcumuladaAnterior) / a.cantidadAjustada : 0
          valB = b.cantidadAjustada > 0 ? (b.cantidadEstePeriodo + b.cantidadAcumuladaAnterior) / b.cantidadAjustada : 0
        } else if (columnaOrden === 'costoUnitarioDirecto') {
          valA = a.costoUnitarioDirecto
          valB = b.costoUnitarioDirecto
        } else if (columnaOrden === 'costoTotalAFecha') {
          valA = (a.cantidadEstePeriodo + a.cantidadAcumuladaAnterior) * a.costoUnitarioDirecto
          valB = (b.cantidadEstePeriodo + b.cantidadAcumuladaAnterior) * b.costoUnitarioDirecto
        } else if (columnaOrden === 'saldoPorEjecutar') {
          valA = Math.max(0, a.cantidadAjustada - (a.cantidadEstePeriodo + a.cantidadAcumuladaAnterior)) * a.costoUnitarioDirecto
          valB = Math.max(0, b.cantidadAjustada - (b.cantidadEstePeriodo + b.cantidadAcumuladaAnterior)) * b.costoUnitarioDirecto
        } else if (columnaOrden.startsWith('Mes ')) {
          valA = a.avancesMensuales?.[columnaOrden] || 0
          valB = b.avancesMensuales?.[columnaOrden] || 0
        } else {
          valA = (a as any)[columnaOrden] || ''
          valB = (b as any)[columnaOrden] || ''
        }

        if (valA < valB) return direccionOrden === 'asc' ? -1 : 1
        if (valA > valB) return direccionOrden === 'asc' ? 1 : -1
        return 0
      })
    }

    return resultado
  }, [renglones, capituloFiltro, estadoEjecucionFiltro, tipoRenglonFiltro, mesFiltro, busqueda, columnaOrden, direccionOrden])

  // PaginaciÃƒÂ³n
  const totalItems = renglonesFiltradosYOrdenados.length
  const totalPaginas = Math.ceil(totalItems / itemsPorPagina) || 1
  const inicioIndice = (paginaActual - 1) * itemsPorPagina
  const finIndice = Math.min(inicioIndice + itemsPorPagina, totalItems)
  const renglonesPaginados = useMemo(() => {
    return renglonesFiltradosYOrdenados.slice(inicioIndice, finIndice)
  }, [renglonesFiltradosYOrdenados, inicioIndice, finIndice])

  const capitulosUnicosPagina = useMemo(() => {
    const map = new Map<number, string>()
    renglonesPaginados.forEach((r) => {
      map.set(r.capituloId, r.capituloNombre)
    })
    return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre }))
  }, [renglonesPaginados])

  // Subtotales globales por capÃƒÂ­tulo
  const subtotalesPorCapitulo = useMemo(() => {
    const mapa: Record<
      number,
      {
        costoDirectoContratado: number
        costoDirectoAjustado: number
        costoDirectoEstePeriodo: number
        costoDirectoAcumuladoAnterior: number
        costoDirectoTotalFecha: number
        saldoPorEjecutar: number
      }
    > = {}

    CAPITULOS_LIBRO_AZUL.forEach((c) => {
      mapa[c.id] = {
        costoDirectoContratado: 0,
        costoDirectoAjustado: 0,
        costoDirectoEstePeriodo: 0,
        costoDirectoAcumuladoAnterior: 0,
        costoDirectoTotalFecha: 0,
        saldoPorEjecutar: 0,
      }
    })

    renglones.forEach((r) => {
      const cantTotalFecha = r.cantidadEstePeriodo + r.cantidadAcumuladaAnterior
      const costoContratado = r.cantidadContratada * r.costoUnitarioDirecto
      const costoAjustado = r.cantidadAjustada * r.costoUnitarioDirecto
      const costoEstePeriodo = r.cantidadEstePeriodo * r.costoUnitarioDirecto
      const costoAcumAnterior = r.cantidadAcumuladaAnterior * r.costoUnitarioDirecto
      const costoTotalFecha = costoEstePeriodo + costoAcumAnterior
      const saldo = Math.max(0, costoAjustado - costoTotalFecha)

      if (!mapa[r.capituloId]) {
        mapa[r.capituloId] = {
          costoDirectoContratado: 0,
          costoDirectoAjustado: 0,
          costoDirectoEstePeriodo: 0,
          costoDirectoAcumuladoAnterior: 0,
          costoDirectoTotalFecha: 0,
          saldoPorEjecutar: 0,
        }
      }

      mapa[r.capituloId].costoDirectoContratado += costoContratado
      mapa[r.capituloId].costoDirectoAjustado += costoAjustado
      mapa[r.capituloId].costoDirectoEstePeriodo += costoEstePeriodo
      mapa[r.capituloId].costoDirectoAcumuladoAnterior += costoAcumAnterior
      mapa[r.capituloId].costoDirectoTotalFecha += costoTotalFecha
      mapa[r.capituloId].saldoPorEjecutar += saldo
    })

    return mapa
  }, [renglones])

  // CÃƒÂLCULOS FINANCIEROS GLOBALES
  const subtotalCostoDirectoContratadoGlobal = useMemo(() => {
    return renglones.reduce((sum, r) => sum + r.cantidadContratada * r.costoUnitarioDirecto, 0)
  }, [renglones])

  const subtotalCostoDirectoAjustadoGlobal = useMemo(() => {
    return renglones.reduce((sum, r) => sum + r.cantidadAjustada * r.costoUnitarioDirecto, 0)
  }, [renglones])

  // Monto Contractual Original = Costo Directo Total + 45% Indirectos + 12% IVA
  const indirectos45ContratadoGlobal = subtotalCostoDirectoContratadoGlobal * 0.45
  const subtotalAntesIvaContratadoGlobal = subtotalCostoDirectoContratadoGlobal + indirectos45ContratadoGlobal
  const iva12ContratadoGlobal = subtotalAntesIvaContratadoGlobal * 0.12
  const montoContractualOriginalTotal = subtotalAntesIvaContratadoGlobal + iva12ContratadoGlobal

  const subtotalCostoDirectoGlobalPeriodo = useMemo(() => {
    return renglones.reduce((sum, r) => sum + r.cantidadEstePeriodo * r.costoUnitarioDirecto, 0)
  }, [renglones])

  const indirectos45Global = subtotalCostoDirectoGlobalPeriodo * 0.45
  const subtotalAntesIvaGlobal = subtotalCostoDirectoGlobalPeriodo + indirectos45Global
  const iva12Global = subtotalAntesIvaGlobal * 0.12
  const valorTotalEstimacionBrutoGlobal = subtotalAntesIvaGlobal + iva12Global

  const anticipoRecibido20 = subtotalCostoDirectoContratadoGlobal * 0.20
  const amortizacionAnteriorAcumulada = anticipoRecibido20 * 0.40
  const amortizacionAnticipoEstePeriodo = valorTotalEstimacionBrutoGlobal * 0.20
  const amortizacionTotalAcumulada = amortizacionAnteriorAcumulada + amortizacionAnticipoEstePeriodo
  const saldoAnticipoPorAmortizar = Math.max(0, anticipoRecibido20 - amortizacionTotalAcumulada)
  const liquidoAPagarNetoContratista = Math.max(0, valorTotalEstimacionBrutoGlobal - amortizacionAnticipoEstePeriodo)

  // Datos contextuales de ejemplo calculados segÃƒÂºn el proyecto seleccionado en el dropdown
  const metricasHeaderContextuales = useMemo(() => {
    switch (proyectoIdSeleccionado) {
      case '2':
        return {
          nombre: 'Rehabilitacion Calzada Roosevelt (DOM-VIAL-002)',
          plazo: '24 Meses (720 dÃƒÂ­as)',
          costoDirecto: 24750000.00,
          montoContractualOriginal: 40156875.00,
          liquidoNetoPeriodo: 1845200.50,
        }
      case '3':
        return {
          nombre: 'Estabilizacion de Taludes Ruta a El Salvador (DOM-VIAL-003)',
          plazo: '12 Meses (360 dÃƒÂ­as)',
          costoDirecto: 14200000.00,
          montoContractualOriginal: 23038900.00,
          liquidoNetoPeriodo: 920400.00,
        }
      case '4':
        return {
          nombre: 'Paso a Desnivel Calzada Atanasio Tzul (DOM-VIAL-004)',
          plazo: '15 Meses (450 dÃƒÂ­as)',
          costoDirecto: 31500000.00,
          montoContractualOriginal: 51108750.00,
          liquidoNetoPeriodo: 2410800.25,
        }
      default:
        return {
          nombre: `${proyecto.nombre} (${proyecto.codigo || 'DOM-VIAL-001'})`,
          plazo: proyecto.plazo || '18 Meses (540 dÃƒÂ­as)',
          costoDirecto: subtotalCostoDirectoContratadoGlobal,
          montoContractualOriginal: montoContractualOriginalTotal,
          liquidoNetoPeriodo: liquidoAPagarNetoContratista,
        }
    }
  }, [proyectoIdSeleccionado, proyecto, subtotalCostoDirectoContratadoGlobal, montoContractualOriginalTotal, liquidoAPagarNetoContratista])

  const diasEmpleadosCalculados = 372
  const diasSuspendidosSumados = 30
  const fechaInicioContrato = '20/01/2025'

  const toggleCapitulo = (capId: number) => {
    setCapitulosColapsados((prev) => ({ ...prev, [capId]: !prev[capId] }))
  }

  const handleExportarExcel = () => {
    toast.success('Descargando archivo Excel oficial "DÃƒÂAS" (.xlsx)...')
  }

  const handleGuardarModificarPlazo = () => {
    const errs: Record<string, boolean> = {}
    if (!formNuevaFechaFin) errs.fechaFin = true
    if (!formDiasAdicionales || Number(formDiasAdicionales) <= 0) errs.dias = true

    if (Object.keys(errs).length > 0) {
      setErrorsPlazoForm(errs)
      toast.error('Por favor complete todos los campos obligatorios del plazo (*)')
      return
    }

    const [yyyy, mm, dd] = formNuevaFechaFin.split('-')
    const fechaFormateada = dd && mm && yyyy ? `${dd}/${mm}/${yyyy}` : formNuevaFechaFin
    setFechaFinalizacionActualizada(fechaFormateada)
    setModalModificarPlazoOpen(false)
    setErrorsPlazoForm({})
    toast.success(`Plazo modificado exitosamente. Nueva fecha de finalizaciÃƒÂ³n: ${fechaFormateada}`)
  }

  const resetFiltros = () => {
    setCapituloFiltro('todos')
    setMesFiltro('todos')
    setEstadoEjecucionFiltro('todos')
    setTipoRenglonFiltro('todos')
    setNumEstimacionFiltro('todos')
    setBusqueda('')
    setColumnaOrden(null)
    setDireccionOrden('asc')
    setPaginaActual(1)
  }

  const renderIconoOrden = (col: ColumnaOrdenable) => {
    if (columnaOrden !== col) {
      return <ArrowUpDown size={10} className="text-gray-300 opacity-60 inline-block ml-0.5" />
    }
    return direccionOrden === 'asc' ? (
      <ArrowUp size={10} className="text-[#9B0F06] font-black inline-block ml-0.5" />
    ) : (
      <ArrowDown size={10} className="text-[#9B0F06] font-black inline-block ml-0.5" />
    )
  }

  return (
    <div className="space-y-2 font-[Poppins] text-xs">
      <style>{`
        .btn-success-compact {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
          padding: 0.35rem 0.65rem;
          border-radius: 0.5rem;
          font-weight: 600;
          font-size: 0.75rem;
          border: 1px solid transparent;
          background: linear-gradient(135deg, #10b981, #059669);
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
          transition: background-color 0.2s, border-color 0.2s, color 0.2s, transform 0.2s;
        }
        .btn-success-compact:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(16, 185, 129, 0.28);
        }
      `}</style>

      {/* Encabezado compacto */}
      <div className="pt-0.5 pb-0.5 space-y-1.5 font-[Poppins]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate.push(`/dashboard/proyectos/${proyecto.id}`)}
              className="p-1 text-gray-600 hover:text-[#9B0F06] transition-colors"
              title="Regresar al detalle del proyecto"
            >
              <ArrowLeft size={16} />
            </button>

            <div>
              <div className="flex items-center gap-1.5 text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                <span className="hover:underline cursor-pointer" onClick={() => navigate.push('/dashboard/proyectos')}>
                  Proyectos
                </span>
                <span>/</span>
                <span
                  className="hover:underline cursor-pointer text-gray-700"
                  onClick={() => navigate.push(`/dashboard/proyectos/${proyecto.id}`)}
                >
                  {proyecto.codigo}
                </span>
                <span>/</span>
                <span className="text-[#9B0F06] font-medium">Hoja SÃƒÂ¡bana Digital</span>
              </div>

              <h1 className="text-xs font-medium text-gray-900 mt-0.5 flex items-center gap-1.5">
                <FileSpreadsheet size={13} className="text-[#9B0F06]" />
                <span>Hoja SÃƒÂ¡bana Digital</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Toggle PlanificaciÃƒÂ³n / Actual */}
            <div className="inline-flex items-center rounded-md border border-gray-200 bg-gray-100 p-0.5 text-[9.5px]">
              <button
                type="button"
                onClick={() => setModoVistaSabana('planificacion')}
                className={`inline-flex items-center gap-1 border-b-2 px-2 py-1 text-[9.5px] font-normal transition-all cursor-pointer ${
                  modoVistaSabana === 'planificacion'
                    ? 'border-[#9B0F06] text-[#9B0F06] bg-white font-medium shadow-xs'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Calendar size={11} />
                <span>PlanificaciÃƒÂ³n</span>
              </button>
              <button
                type="button"
                onClick={() => setModoVistaSabana('actual')}
                className={`inline-flex items-center gap-1 border-b-2 px-2 py-1 text-[9.5px] font-normal transition-all cursor-pointer ${
                  modoVistaSabana === 'actual'
                    ? 'border-[#9B0F06] text-[#9B0F06] bg-white font-medium shadow-xs'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Clock size={11} />
                <span>Actual</span>
              </button>
            </div>

            {/* BotÃƒÂ³n Modificar Plazo - Visible ÃƒÅ¡NICAMENTE para rol Administrador */}
            {user?.rol === 'Administrador' && (
              <button
                type="button"
                onClick={() => {
                  setErrorsPlazoForm({})
                  setModalModificarPlazoOpen(true)
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-[10px] font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs cursor-pointer"
                title="Modificar cronograma y fecha de finalizaciÃƒÂ³n"
              >
                <CalendarClock size={13} className="text-[#9B0F06]" />
                <span>Modificar Plazo</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportarExcel}
              className="btn-success-compact cursor-pointer"
              title="Exportar archivo Excel DÃƒÂAS"
            >
              <FileSpreadsheet size={13} />
              <span>Exportar Excel</span>
              <Download size={12} />
            </button>
          </div>
        </div>

        {/* Fila horizontal de mÃƒÂ©tricas */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 bg-gray-50/80 p-1.5 rounded-lg border border-gray-200/80 text-[10px]">
          <div className="min-w-0">
            <span className="text-[7.5px] font-medium uppercase tracking-wider text-gray-400 block truncate mb-0.5">
              Proyecto / Contrato
            </span>
            <select
              value={proyectoIdSeleccionado}
              onChange={(e) => {
                const newId = e.target.value
                setProyectoIdSeleccionado(newId)
                navigate.push(`/dashboard/proyectos/${newId}/hoja-sabana`)
              }}
              className="h-6 w-full rounded border border-gray-300 bg-white px-1 text-[10px] font-medium text-gray-900 focus:border-[#9B0F06] focus:outline-none cursor-pointer truncate"
            >
              {PROYECTOS_MOCK.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.codigo} Ã‚Â· {p.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="text-[7.5px] font-medium uppercase tracking-wider text-gray-400 block truncate">
              Plazo de EjecuciÃƒÂ³n Real
            </span>
            <span className="font-medium text-gray-800 flex items-center gap-1">
              <Clock size={9.5} className="text-[#9B0F06] shrink-0" />
              <span>{metricasHeaderContextuales.plazo}</span>
            </span>
          </div>

          <div>
            <span className="text-[7.5px] font-medium uppercase tracking-wider text-gray-400 block truncate">
              Costo Directo Contratado Total (D Ãƒâ€” F)
            </span>
            <span className="font-medium font-mono text-gray-900">
              Q {metricasHeaderContextuales.costoDirecto.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div>
            <span className="text-[7.5px] font-medium uppercase tracking-wider text-[#9B0F06] block truncate font-bold">
              Monto Contractual Original (con Indirectos e IVA)
            </span>
            <span className="font-bold font-mono text-[#9B0F06]">
              Q {metricasHeaderContextuales.montoContractualOriginal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div>
            <span className="text-[7.5px] font-medium uppercase tracking-wider text-gray-400 block truncate">
              LÃƒÂ­quido Neto Este Periodo
            </span>
            <span className="font-medium font-mono text-gray-900">
              Q {metricasHeaderContextuales.liquidoNetoPeriodo.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* TABS SUPERIORES SIN NEGRILLA */}
      <div className="border-b border-gray-200 bg-white px-1 rounded-t-md font-[Poppins]">
        <div className="flex flex-wrap items-center gap-1">
          {[
            { id: 'sabana', label: 'SÃƒÂ¡bana', icon: Layers },
            { id: 'analitico', label: 'AnalÃƒÂ­tico', icon: Calculator },
            ...(proyecto.id === 'nuevo' || id === 'nuevo' ? [] : [{ id: 'pendientes', label: 'Pendientes', icon: AlertCircle }]),
            { id: 'planificadoReal', label: 'Planificado vs Real', icon: TrendingUp },
            { id: 'resumen', label: 'Resumen Financiero', icon: Banknote },
          ].map((item) => {
            const Icon = item.icon
            const active = tabSeccion === item.id

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTabSeccion(item.id as any)}
                className={`flex items-center gap-1 border-b-2 px-2 py-1 text-[9.5px] font-normal transition-all ${
                  active
                    ? 'border-[#9B0F06] text-[#9B0F06] bg-red-50/40'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Icon size={11} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* BARRA DE FILTROS Y ACCIONES COMPACTA (OCULTA EN RESUMEN FINANCIERO) */}
      {tabSeccion !== 'resumen' && (
        <div className="w-full rounded-lg border border-gray-200 bg-white p-1.5 shadow-2xs flex items-center justify-between gap-1.5 overflow-x-auto font-[Poppins]">
          <div className="flex items-center gap-1 shrink-0 flex-nowrap">
            {/* CapÃƒÂ­tulo: Disponible en SÃƒÂ¡bana, AnalÃƒÂ­tico, Pendientes y Planificado vs Real */}
            <select
              value={capituloFiltro}
              onChange={(e) => {
                setCapituloFiltro(e.target.value === 'todos' ? 'todos' : Number(e.target.value))
                setPaginaActual(1)
              }}
              className="h-7 rounded border border-gray-200 bg-white px-1.5 text-[10px] font-normal text-gray-800 focus:border-[#9B0F06] focus:outline-none max-w-[130px] truncate"
            >
              <option value="todos">CapÃƒÂ­tulo: Todos</option>
              {CAPITULOS_LIBRO_AZUL.map((c) => (
                <option key={c.id} value={c.id}>
                  Cap {c.id}: {c.nombre.split(':')[1]?.trim() || c.nombre}
                </option>
              ))}
            </select>

            {/* Mes: Disponible en SÃƒÂ¡bana, AnalÃƒÂ­tico y Planificado vs Real (NO en Pendientes) */}
            {(tabSeccion === 'sabana' || tabSeccion === 'analitico' || tabSeccion === 'planificadoReal') && (
              <select
                value={mesFiltro}
                onChange={(e) => {
                  setMesFiltro(e.target.value)
                  setPaginaActual(1)
                }}
                className="h-7 rounded border border-gray-200 bg-white px-1.5 text-[10px] font-normal text-gray-800 focus:border-[#9B0F06] focus:outline-none max-w-[100px] truncate"
              >
                <option value="todos">Mes: Todos</option>
                {listaMesesDinamicos.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            )}

            {/* EstimaciÃƒÂ³n: Disponible ÃƒÂºnicamente en SÃƒÂ¡bana y AnalÃƒÂ­tico */}
            {(tabSeccion === 'sabana' || tabSeccion === 'analitico') && (
              <select
                value={numEstimacionFiltro}
                onChange={(e) => setNumEstimacionFiltro(e.target.value)}
                className="h-7 rounded border border-gray-200 bg-white px-1.5 text-[10px] font-normal text-gray-800 focus:border-[#9B0F06] focus:outline-none max-w-[110px] truncate"
              >
                <option value="todos">EstimaciÃƒÂ³n: Todas</option>
                <option value="Est. 01">EstimaciÃƒÂ³n 01</option>
                <option value="Est. 02">EstimaciÃƒÂ³n 02</option>
                <option value="Est. 06">EstimaciÃƒÂ³n 06</option>
                <option value="Est. 08">EstimaciÃƒÂ³n 08 (Actual)</option>
              </select>
            )}

            {/* Estado: Disponible ÃƒÂºnicamente en SÃƒÂ¡bana y Pendientes */}
            {(tabSeccion === 'sabana' || tabSeccion === 'pendientes') && (
              <select
                value={estadoEjecucionFiltro}
                onChange={(e) => {
                  setEstadoEjecucionFiltro(e.target.value)
                  setPaginaActual(1)
                }}
                className="h-7 rounded border border-gray-200 bg-white px-1.5 text-[10px] font-normal text-gray-800 focus:border-[#9B0F06] focus:outline-none max-w-[110px] truncate"
              >
                <option value="todos">Estado: Todos</option>
                <option value="En proceso">En proceso</option>
                <option value="Completado">Completado</option>
                <option value="No iniciado">No iniciado</option>
                <option value="Con excedente">Con excedente</option>
              </select>
            )}

            {/* Tipo: Disponible ÃƒÂºnicamente en SÃƒÂ¡bana y Pendientes */}
            {(tabSeccion === 'sabana' || tabSeccion === 'pendientes') && (
              <select
                value={tipoRenglonFiltro}
                onChange={(e) => {
                  setTipoRenglonFiltro(e.target.value)
                  setPaginaActual(1)
                }}
                className="h-7 rounded border border-gray-200 bg-white px-1.5 text-[10px] font-normal text-gray-800 focus:border-[#9B0F06] focus:outline-none max-w-[100px] truncate"
              >
                <option value="todos">Tipo: Todos</option>
                <option value="Original">Original</option>
                <option value="Aumento">Aumento (OC)</option>
                <option value="Nuevo">Nuevo (ATE)</option>
              </select>
            )}

            <button
              type="button"
              onClick={resetFiltros}
              className="h-7 rounded border border-gray-200 px-2 text-[10px] font-normal hover:bg-gray-50 flex items-center gap-1 shrink-0 text-gray-700 transition-colors cursor-pointer"
              title="Limpiar filtros"
            >
              <Eraser size={11} className="text-gray-500" />
              <span className="whitespace-nowrap">Limpiar filtros</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <div className="relative w-36 sm:w-44">
              <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value)
                  setPaginaActual(1)
                }}
                placeholder="Buscar..."
                className="h-7 w-full rounded border border-gray-200 bg-gray-50 pl-6 pr-2 text-[10px] font-normal text-gray-800 placeholder-gray-400 focus:border-[#9B0F06] focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: [SÃƒÂBANA] Ã¢â‚¬â€ TABLA CON FUENTE POPPINS, REGULAR SALVO CÃƒâ€œDIGO */}
      {tabSeccion === 'sabana' && (
        <div className="bg-white overflow-hidden rounded-md border-b border-gray-200/80 font-[Poppins]">
          {totalItems === 0 ? (
            <div className="p-8 text-center space-y-2">
              <AlertCircle size={24} className="mx-auto text-gray-400" />
              <p className="text-xs font-medium text-gray-700">No se encontraron renglones con los filtros activos</p>
              <button
                type="button"
                onClick={resetFiltros}
                className="inline-flex items-center gap-1.5 rounded bg-[#9B0F06] px-3 py-1 text-xs font-medium text-white hover:bg-[#5E0006]"
              >
                <Eraser size={12} /> Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[9.5px] leading-tight">
                <thead>
                  <tr className="border-b border-gray-300 bg-gray-50/80 text-gray-600 font-medium uppercase tracking-wider text-left text-[8.5px] whitespace-nowrap select-none">
                    <th
                      onClick={() => handleOrdenarPorColumna('codigoDGC')}
                      className="px-2 py-2 w-16 cursor-pointer hover:bg-gray-100/80 transition-colors font-medium"
                    >
                      A. CÃƒÂ³digo {renderIconoOrden('codigoDGC')}
                    </th>

                    <th
                      onClick={() => handleOrdenarPorColumna('descripcion')}
                      className="px-2.5 py-2 min-w-[180px] cursor-pointer hover:bg-gray-100/80 transition-colors font-medium"
                    >
                      B. DescripciÃƒÂ³n {renderIconoOrden('descripcion')}
                    </th>

                    <th
                      onClick={() => handleOrdenarPorColumna('unidad')}
                      className="px-1.5 py-2 text-center w-10 cursor-pointer hover:bg-gray-100/80 transition-colors font-medium"
                    >
                      C. Unid {renderIconoOrden('unidad')}
                    </th>

                    <th
                      onClick={() => handleOrdenarPorColumna('cantidadContratada')}
                      className="px-2 py-2 text-right w-24 cursor-pointer hover:bg-gray-100/80 transition-colors font-medium"
                    >
                      D. Cant. Contratada {renderIconoOrden('cantidadContratada')}
                    </th>

                    <th
                      onClick={() => handleOrdenarPorColumna('cantidadAjustada')}
                      className="px-2 py-2 text-right w-24 cursor-pointer hover:bg-gray-100/80 transition-colors font-medium text-gray-900"
                    >
                      E. Cant. Ajustada {renderIconoOrden('cantidadAjustada')}
                    </th>

                    <th
                      onClick={() => handleOrdenarPorColumna('costoUnitarioDirecto')}
                      className="px-2 py-2 text-right w-22 cursor-pointer hover:bg-gray-100/80 transition-colors font-medium text-gray-900"
                    >
                      F. Costo Unit. Directo {renderIconoOrden('costoUnitarioDirecto')}
                    </th>

                    <th className="px-2.5 py-2 text-right w-28 font-medium text-gray-900">
                      G. Costo Total Directo (DÃƒâ€”F)
                    </th>

                    <th className="px-2.5 py-2 text-right w-28 font-medium text-gray-900">
                      H. Costo Total Ajustado (EÃƒâ€”F)
                    </th>

                    <th
                      onClick={() => handleOrdenarPorColumna('cantidadEstePeriodo')}
                      className="px-2 py-2 text-right w-22 cursor-pointer hover:bg-gray-100/80 transition-colors font-medium text-[#9B0F06] text-[8.5px]"
                    >
                      I. Este Periodo (Cant.) {renderIconoOrden('cantidadEstePeriodo')}
                    </th>

                    <th
                      onClick={() => handleOrdenarPorColumna('cantidadAcumuladaAnterior')}
                      className="px-2 py-2 text-right w-20 cursor-pointer hover:bg-gray-100/80 transition-colors font-medium"
                    >
                      J. Acum. Anterior (Cant.) {renderIconoOrden('cantidadAcumuladaAnterior')}
                    </th>

                    <th
                      onClick={() => handleOrdenarPorColumna('totalAFecha')}
                      className="px-2 py-2 text-right w-22 cursor-pointer hover:bg-gray-100/80 transition-colors font-medium text-gray-900"
                    >
                      K. Total a Fecha (Cant.) {renderIconoOrden('totalAFecha')}
                    </th>

                    <th
                      onClick={() => handleOrdenarPorColumna('avancePct')}
                      className="px-2 py-2 text-right w-16 cursor-pointer hover:bg-gray-100/80 transition-colors font-medium text-[#9B0F06]"
                    >
                      L. % Avance (Cant.) {renderIconoOrden('avancePct')}
                    </th>

                    <th className="px-2.5 py-2 text-right w-24 font-medium text-gray-900">
                      M. Este Periodo (Costo)
                    </th>

                    <th className="px-2.5 py-2 text-right w-24 font-medium text-gray-900">
                      N. Acum. Anterior (Costo)
                    </th>

                    <th className="px-2.5 py-2 text-right w-24 font-medium text-gray-900">
                      O. Total a Fecha (Costo)
                    </th>

                    <th className="px-2 py-2 text-right w-16 font-medium text-[#9B0F06]">
                      P. % Avance (Costo)
                    </th>

                    <th
                      onClick={() => handleOrdenarPorColumna('saldoPorEjecutar')}
                      className="px-2.5 py-2 text-right w-28 cursor-pointer hover:bg-gray-100/80 transition-colors font-medium text-[#9B0F06]"
                    >
                      Saldo por Ejecutar (HÃ¢Ë†â€™O) {renderIconoOrden('saldoPorEjecutar')}
                    </th>

                    {/* Columnas mensuales (Mes 1...Mes N) segÃƒÂºn toggle PlanificaciÃƒÂ³n / Actual */}
                    {listaMesesDinamicos.map((mes) => (
                      <th
                        key={mes}
                        onClick={() => handleOrdenarPorColumna(mes)}
                        className="px-2 py-2 text-right w-16 font-mono cursor-pointer hover:bg-gray-100/80 transition-colors font-normal"
                      >
                        {mes} {modoVistaSabana === 'planificacion' ? 'Plan' : 'Real'} {renderIconoOrden(mes)}
                      </th>
                    ))}

                    <th className="px-2 py-2 text-center w-24 sticky right-0 bg-gray-50/90 font-medium text-gray-900">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 font-mono text-[9.5px]">
                  {capitulosUnicosPagina.map((cap) => {
                    const renglonesCap = renglonesPaginados.filter((r) => r.capituloId === cap.id)
                    if (renglonesCap.length === 0) return null

                    const estaColapsado = capitulosColapsados[cap.id]
                    const subtotalCap = subtotalesPorCapitulo[cap.id] || {
                      costoDirectoAjustado: 0,
                      costoDirectoEjecutadoFecha: 0,
                      saldoPorEjecutar: 0,
                      costoDirectoEstePeriodo: 0,
                    }

                    return (
                      <Fragment key={`cap-sabana-${cap.id}`}>
                        <tr
                          onClick={() => toggleCapitulo(cap.id)}
                          className="bg-gray-50/90 font-sans font-normal text-gray-800 cursor-pointer hover:bg-gray-100/80 transition-colors select-none border-t border-gray-200"
                        >
                          <td colSpan={18 + listaMesesDinamicos.length + 1} className="px-2.5 py-1.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-1">
                                {estaColapsado ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
                                <span className="text-[9px] uppercase tracking-wider text-[#9B0F06] font-bold">
                                  {cap.nombre}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-[8px] font-mono font-normal text-gray-600">
                                <span>Contratado: Q {subtotalCap.costoDirectoContratado.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                                <span>Ã¢â‚¬Â¢</span>
                                <span>Ajustado: Q {subtotalCap.costoDirectoAjustado.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                                <span>Ã¢â‚¬Â¢</span>
                                <span>Periodo: Q {subtotalCap.costoDirectoEstePeriodo.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                                <span>Ã¢â‚¬Â¢</span>
                                <span>Total Fecha: Q {subtotalCap.costoDirectoTotalFecha.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                                <span>Ã¢â‚¬Â¢</span>
                                <span className="text-[#9B0F06] font-medium">Saldo: Q {subtotalCap.saldoPorEjecutar.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                              </div>
                            </div>
                          </td>
                        </tr>

                        {/* REQUERIMIENTO EDICIÃƒâ€œN INLINE:
                            - SIN fondo amarillo en la fila completa
                            - Highlight solo en campos editables con contorno gris oscuro
                            - CÃƒÂ³digo (A) es editable (dropdown), DescripciÃƒÂ³n y Unid se autocompletan de solo lectura */}
                        {!estaColapsado &&
                          renglonesCap.map((r) => {
                            const esEditando = filaEditandoId === r.id
                            const cantContratadaD = esEditando ? Number(datosEditando.cantidadContratada ?? r.cantidadContratada) : r.cantidadContratada
                            const cantAjustadaE = esEditando ? Number(datosEditando.cantidadAjustada ?? r.cantidadAjustada) : r.cantidadAjustada
                            const costoUnitF = esEditando ? Number(datosEditando.costoUnitarioDirecto ?? r.costoUnitarioDirecto) : r.costoUnitarioDirecto

                            const costoTotalDirectoG = cantContratadaD * costoUnitF
                            const costoTotalAjustadoH = cantAjustadaE * costoUnitF

                            const cantEstePeriodoI = r.cantidadEstePeriodo
                            const cantAcumAnteriorJ = esEditando ? Number(datosEditando.cantidadAcumuladaAnterior ?? r.cantidadAcumuladaAnterior) : r.cantidadAcumuladaAnterior
                            const cantTotalFechaK = cantEstePeriodoI + cantAcumAnteriorJ
                            const pctAvanceCantL = cantAjustadaE > 0 ? (cantTotalFechaK / cantAjustadaE) * 100 : 0

                            const costoEstePeriodoM = cantEstePeriodoI * costoUnitF
                            const costoAcumAnteriorN = cantAcumAnteriorJ * costoUnitF
                            const costoTotalFechaO = costoEstePeriodoM + costoAcumAnteriorN
                            const pctAvanceCostoP = costoTotalAjustadoH > 0 ? (costoTotalFechaO / costoTotalAjustadoH) * 100 : 0

                            const saldoPorEjecutar = Math.max(0, costoTotalAjustadoH - costoTotalFechaO)

                            return (
                              <tr key={r.id} className="transition-colors border-b border-gray-100 hover:bg-gray-50/60 font-[Poppins]">
                                {/* A. CÃƒÂ³digo */}
                                <td className="px-2 py-1.5 font-mono font-bold text-gray-900">
                                  {esEditando ? (
                                    <select
                                      value={datosEditando.codigoDGC ?? r.codigoDGC}
                                      onChange={(e) => handleCambiarCodigoInline(e.target.value)}
                                      className="w-20 rounded border-2 border-gray-700 bg-white px-1 py-0.5 font-bold text-gray-900 text-[9px] focus:outline-none"
                                    >
                                      {Array.from(new Set(CATALOGO_COMPLETO_88.map((cat) => cat.codigoDGC))).map((cod) => (
                                        <option key={cod} value={cod}>
                                          {cod}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <span>{r.codigoDGC}</span>
                                  )}
                                </td>

                                {/* B. DescripciÃƒÂ³n */}
                                <td className="px-2.5 py-1.5 font-sans font-normal text-gray-700">
                                  {esEditando ? (
                                    <div className="w-full rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 font-sans text-[9px] text-gray-700 cursor-not-allowed">
                                      <span className="truncate block max-w-[200px]">
                                        {datosEditando.descripcion ?? r.descripcion} (Solo lectura)
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="truncate block max-w-[200px]">{r.descripcion}</span>
                                  )}
                                </td>

                                {/* C. Unid */}
                                <td className="px-1.5 py-1.5 text-center font-normal text-gray-600">
                                  {esEditando ? (
                                    <div className="w-10 rounded border border-gray-300 bg-gray-100 px-0.5 py-0.5 font-mono text-[9px] text-gray-700 cursor-not-allowed mx-auto">
                                      {datosEditando.unidad ?? r.unidad}
                                    </div>
                                  ) : (
                                    <span>{r.unidad}</span>
                                  )}
                                </td>

                                {/* D. Cant. Contratada */}
                                <td className="px-2 py-1.5 text-right font-normal text-gray-600 font-mono">
                                  {esEditando ? (
                                    <input
                                      type="text"
                                      value={datosEditando.cantidadContratada ?? r.cantidadContratada}
                                      onChange={(e) => {
                                        const val = e.target.value.replace(/[^\d.]/g, '')
                                        setDatosEditando((d) => ({ ...d, cantidadContratada: Number(val) }))
                                      }}
                                      className="w-18 rounded border-2 border-gray-700 bg-white px-1 py-0.5 text-right font-mono text-[9px] font-normal text-gray-900 focus:outline-none"
                                    />
                                  ) : (
                                    <span>{r.cantidadContratada.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                                  )}
                                </td>

                                {/* E. Cant. Ajustada */}
                                <td className="px-2 py-1.5 text-right font-normal text-gray-800 font-mono">
                                  {esEditando ? (
                                    <input
                                      type="text"
                                      value={datosEditando.cantidadAjustada ?? r.cantidadAjustada}
                                      onChange={(e) => {
                                        const val = e.target.value.replace(/[^\d.]/g, '')
                                        setDatosEditando((d) => ({ ...d, cantidadAjustada: Number(val) }))
                                      }}
                                      className="w-18 rounded border-2 border-gray-700 bg-white px-1 py-0.5 text-right font-mono text-[9px] font-normal text-gray-900 focus:outline-none"
                                    />
                                  ) : (
                                    <span>{r.cantidadAjustada.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                                  )}
                                </td>

                                {/* F. Costo Unit. Directo */}
                                <td className="px-2 py-1.5 text-right font-normal text-gray-700 font-mono">
                                  {esEditando ? (
                                    <input
                                      type="text"
                                      value={datosEditando.costoUnitarioDirecto ?? r.costoUnitarioDirecto}
                                      onChange={(e) => {
                                        const val = e.target.value.replace(/[^\d.]/g, '')
                                        setDatosEditando((d) => ({ ...d, costoUnitarioDirecto: Number(val) }))
                                      }}
                                      className="w-18 rounded border-2 border-gray-700 bg-white px-1 py-0.5 text-right font-mono text-[9px] font-normal text-gray-900 focus:outline-none"
                                    />
                                  ) : (
                                    <span>Q {r.costoUnitarioDirecto.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                                  )}
                                </td>

                                {/* G. Costo Total Directo = D Ãƒâ€” F */}
                                <td className="px-2.5 py-1.5 text-right font-normal text-gray-800 font-mono">
                                  Q {costoTotalDirectoG.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                                </td>

                                {/* H. Costo Total Ajustado = E Ãƒâ€” F */}
                                <td className="px-2.5 py-1.5 text-right font-normal text-gray-900 font-mono">
                                  Q {costoTotalAjustadoH.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                                </td>

                                {/* I. Este Periodo (Cant.): Enlace de SOLO LECTURA al tab AnalÃƒÂ­tico */}
                                <td className="px-2 py-1.5 text-right font-normal font-mono text-[9.5px]">
                                  {cantEstePeriodoI > 0 ? (
                                    <button
                                      type="button"
                                      onClick={() => setTabSeccion('analitico')}
                                      className="text-blue-700 hover:underline hover:text-[#9B0F06] transition-colors cursor-pointer font-mono text-[9.5px]"
                                      title="Ver origen en Memoria de CÃƒÂ¡lculo AnalÃƒÂ­tica"
                                    >
                                      {cantEstePeriodoI.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setTabSeccion('analitico')}
                                      className="inline-flex items-center justify-end gap-1 text-gray-400 hover:text-[#9B0F06] transition-colors cursor-pointer font-mono text-[9px]"
                                      title="Valor calculado en tiempo real desde el Tab AnalÃƒÂ­tico (sin registros)"
                                    >
                                      <span className="text-gray-400 font-mono">Ã¢â‚¬â€ Sin registro</span>
                                      <Calculator size={10} className="opacity-60" />
                                    </button>
                                  )}
                                </td>

                                {/* J. Acum. Anterior (Cant.) */}
                                <td className="px-2 py-1.5 text-right font-normal text-gray-600 font-mono">
                                  {esEditando ? (
                                    <input
                                      type="text"
                                      value={datosEditando.cantidadAcumuladaAnterior ?? r.cantidadAcumuladaAnterior}
                                      onChange={(e) => {
                                        const val = e.target.value.replace(/[^\d.]/g, '')
                                        setDatosEditando((d) => ({ ...d, cantidadAcumuladaAnterior: Number(val) }))
                                      }}
                                      className="w-16 rounded border-2 border-gray-700 bg-white px-1 py-0.5 text-right font-mono text-[9px] font-normal text-gray-900 focus:outline-none"
                                    />
                                  ) : (
                                    <span>{r.cantidadAcumuladaAnterior.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                                  )}
                                </td>

                                {/* K. Total a Fecha (Cant.) = I + J */}
                                <td className="px-2 py-1.5 text-right font-normal text-gray-900 font-mono">
                                  {cantTotalFechaK.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                                </td>

                                {/* L. % Avance (Cant.) = K / E */}
                                <td className="px-2 py-1.5 text-right font-normal text-[#9B0F06] font-mono">
                                  {pctAvanceCantL.toFixed(1)}%
                                </td>

                                {/* M. Este Periodo (Costo) = I Ãƒâ€” F */}
                                <td className="px-2.5 py-1.5 text-right font-normal text-gray-800 font-mono">
                                  Q {costoEstePeriodoM.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                                </td>

                                {/* N. Acum. Anterior (Costo) = J Ãƒâ€” F */}
                                <td className="px-2.5 py-1.5 text-right font-normal text-gray-700 font-mono">
                                  Q {costoAcumAnteriorN.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                                </td>

                                {/* O. Total a Fecha (Costo) = M + N */}
                                <td className="px-2.5 py-1.5 text-right font-normal text-gray-900 font-mono font-medium">
                                  Q {costoTotalFechaO.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                                </td>

                                {/* P. % Avance (Costo) = O / H */}
                                <td className="px-2 py-1.5 text-right font-normal text-[#9B0F06] font-mono">
                                  {pctAvanceCostoP.toFixed(1)}%
                                </td>

                                {/* Saldo por Ejecutar = H - O */}
                                <td className="px-2.5 py-1.5 text-right font-normal text-[#9B0F06] font-mono">
                                  Q {saldoPorEjecutar.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                                </td>

                                {/* Columnas mensuales (Mes 1...Mes N) segÃƒÂºn toggle PlanificaciÃƒÂ³n / Actual */}
                                {listaMesesDinamicos.map((mes) => {
                                  let valMes = 0
                                  if (modoVistaSabana === 'planificacion') {
                                    valMes = r.cantidadAjustada > 0 ? r.cantidadAjustada / Math.max(1, listaMesesDinamicos.length) : 0
                                  } else {
                                    valMes = r.avancesMensuales?.[mes] || 0
                                  }

                                  return (
                                    <td key={mes} className="px-2 py-1.5 text-right font-mono text-[8.5px] font-normal text-gray-600">
                                      {valMes > 0 ? valMes.toLocaleString('es-GT', { minimumFractionDigits: 1 }) : 'Ã¢â‚¬â€'}
                                    </td>
                                  )
                                })}

                                {/* Acciones */}
                                <td className="px-2 py-1.5 text-center sticky right-0 bg-white hover:bg-gray-50/90 border-l border-gray-100">
                                  {esEditando ? (
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleGuardarEdicionInline(r.id)}
                                        className="rounded bg-emerald-600 p-1 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                                        title="Guardar cambios"
                                      >
                                        <Check size={12} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={handleCancelarEdicionInline}
                                        className="rounded bg-gray-200 p-1 text-gray-700 hover:bg-gray-300 transition-colors cursor-pointer"
                                        title="Cancelar ediciÃƒÂ³n"
                                      >
                                        <X size={12} />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center gap-0.5">
                                      <button
                                        type="button"
                                        onClick={() => handleAbrirVer(r)}
                                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-800 transition-colors cursor-pointer"
                                        title="Ver detalle completo"
                                      >
                                        <Eye size={12} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleIniciarEdicionInline(r)}
                                        className="rounded p-1 text-gray-400 hover:bg-amber-50 hover:text-amber-800 transition-colors cursor-pointer"
                                        title="Editar inline en la tabla"
                                      >
                                        <Edit2 size={12} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleAbrirEliminar(r)}
                                        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                                        title="Eliminar renglÃƒÂ³n"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* PaginaciÃƒÂ³n */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200/80 bg-white px-3 py-1.5 text-[9.5px] font-[Poppins]">
            <div className="flex items-center gap-1.5 text-gray-500 font-normal">
              <span>
                Mostrando <span className="font-normal text-gray-700">{totalItems > 0 ? inicioIndice + 1 : 0}</span> a{' '}
                <span className="font-normal text-gray-700">{finIndice}</span> de{' '}
                <span className="font-normal text-gray-700">{totalItems}</span> renglones
              </span>
              <div className="h-2.5 w-px bg-gray-200 mx-0.5" />
              <select
                value={itemsPorPagina}
                onChange={(e) => {
                  setItemsPorPagina(Number(e.target.value))
                  setPaginaActual(1)
                }}
                className="rounded border border-gray-200 bg-gray-50 px-1 py-0.5 text-[9px] font-normal text-gray-700 focus:outline-none"
              >
                <option value={10}>10 / pÃƒÂ¡g</option>
                <option value={12}>12 / pÃƒÂ¡g</option>
                <option value={15}>15 / pÃƒÂ¡g</option>
                <option value={25}>25 / pÃƒÂ¡g</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={paginaActual === 1}
                onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-0.5 rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[9px] font-normal text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft size={11} />
                <span>Anterior</span>
              </button>

              <div className="flex items-center px-1.5 py-0.5 bg-gray-100 rounded text-[9px] font-normal text-gray-700 border border-gray-200">
                <span>{paginaActual}</span>
                <span className="mx-0.5 text-gray-400">/</span>
                <span>{totalPaginas}</span>
              </div>

              <button
                type="button"
                disabled={paginaActual >= totalPaginas}
                onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                className="inline-flex items-center gap-0.5 rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[9px] font-normal text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>Siguiente</span>
                <ChevronRight size={11} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: [ANALÃƒÂTICO] */}
      {tabSeccion === 'analitico' && (
        <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-2xs space-y-3 font-[Poppins]">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <div className="flex items-center gap-2">
              <Calculator size={16} className="text-[#9B0F06]" />
              <div>
                <h3 className="text-xs font-medium text-gray-900">
                  Memoria de CÃƒÂ¡lculo
                </h3>
              </div>
            </div>
          </div>

          {Array.from(new Set(medicionesAnaliticas.map((m) => m.codigoDGC))).map((codDGC) => {
            const renglonMaestro = CATALOGO_COMPLETO_88.find((cat) => cat.codigoDGC === codDGC) || {
              codigoDGC: codDGC,
              descripcion: 'RenglÃƒÂ³n de obra vial',
              unidad: 'mÃ‚Â³',
            }

            const medicionesRenglon = medicionesAnaliticas.filter((m) => {
              const matchCod = m.codigoDGC === codDGC
              const matchCap = capituloFiltro === 'todos' || renglonMaestro.capituloId === capituloFiltro
              const matchMes = mesFiltro === 'todos' || m.mesPeriodo === mesFiltro
              const matchEst = numEstimacionFiltro === 'todos' || m.numEstimacion === numEstimacionFiltro
              return matchCod && matchCap && matchMes && matchEst
            })

            if (medicionesRenglon.length === 0) return null

            const totalCantidadCalculadaRenglon = medicionesRenglon.reduce(
              (acc, m) => acc + m.longitudL * m.anchoA * m.alturaH,
              0
            )

            return (
              <div key={codDGC} className="rounded-lg border border-gray-200 overflow-hidden text-[9.5px]">
                <div className="bg-gray-100 p-2 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-[#9B0F06] px-1.5 py-0.2 font-mono text-[9px] font-bold text-white">
                      {renglonMaestro.codigoDGC}
                    </span>
                    <span className="font-normal text-gray-900 font-sans">{renglonMaestro.descripcion}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded bg-white px-2 py-0.5 text-[8.5px] font-normal text-gray-600 border border-gray-200">
                      Unidad CatÃƒÂ¡logo: <strong className="text-gray-900 font-normal">{renglonMaestro.unidad}</strong> (Solo lectura)
                    </span>
                    <span className="rounded bg-gray-50 px-2 py-0.5 text-[8.5px] font-normal text-gray-700 border border-gray-200">
                      Alimenta Columna 'Este Periodo'
                    </span>
                  </div>
                </div>

                <table className="w-full text-left font-mono">
                  <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 text-[8.5px] font-normal">
                    <tr>
                      <th className="p-2">EstaciÃƒÂ³n Inicio</th>
                      <th className="p-2">EstaciÃƒÂ³n Fin</th>
                      <th className="p-2 text-right">Longitud L (m)</th>
                      <th className="p-2 text-right">Ancho A (m)</th>
                      <th className="p-2 text-right">Altura/Espesor H (m)</th>
                      <th className="p-2 text-right font-medium text-gray-900">Cantidad Calculada (LÃƒâ€”AÃƒâ€”H)</th>
                      <th className="p-2 text-center">Periodo / EstimaciÃƒÂ³n</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 text-gray-800 font-normal">
                    {medicionesRenglon.map((m) => {
                      const cantidadCalculada = m.longitudL * m.anchoA * m.alturaH

                      return (
                        <tr key={m.id} className="hover:bg-gray-50/60">
                          <td className="p-2 text-gray-900 font-normal">{m.estacionInicio}</td>
                          <td className="p-2 text-gray-900 font-normal">{m.estacionFin}</td>
                          <td className="p-2 text-right">{m.longitudL.toFixed(2)}</td>
                          <td className="p-2 text-right">{m.anchoA.toFixed(2)}</td>
                          <td className="p-2 text-right">{m.alturaH.toFixed(2)}</td>
                          <td className="p-2 text-right font-normal text-gray-900 bg-gray-50/50">
                            {cantidadCalculada.toLocaleString('es-GT', { minimumFractionDigits: 2 })} {renglonMaestro.unidad}
                          </td>
                          <td className="p-2 text-center text-gray-500 text-[8.5px]">
                            {m.mesPeriodo} Ã¢â‚¬â€ {m.numEstimacion}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>

                  <tfoot>
                    <tr className="bg-gray-100/90 font-normal text-gray-900 border-t border-gray-300">
                      <td colSpan={5} className="p-2 text-right uppercase tracking-wider text-[8.5px]">
                        TOTAL MES DEL RENGLÃƒâ€œN {codDGC} (TRANSMITE A SÃƒÂBANA 'ESTE PERIODO'):
                      </td>
                      <td className="p-2 text-right font-normal text-[#9B0F06] font-mono text-[10px]">
                        {totalCantidadCalculadaRenglon.toLocaleString('es-GT', { minimumFractionDigits: 2 })} {renglonMaestro.unidad}
                      </td>
                      <td className="p-2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )
          })}
        </div>
      )}

      {/* TAB 3: [PENDIENTES] */}
      {tabSeccion === 'pendientes' && (
        <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-2xs space-y-3 font-[Poppins]">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-[#9B0F06]" />
              <div>
                <h3 className="text-xs font-medium text-gray-900">
                  Bolsa de Trabajos Pendientes y No Conciliados
                </h3>
                <p className="text-[9.5px] text-gray-500 font-normal">
                  Control de volÃƒÂºmenes en conciliaciÃƒÂ³n con cÃƒÂ¡lculo de descuentos y promociÃƒÂ³n al Tab AnalÃƒÂ­tico.
                </p>
              </div>
            </div>

            <span className="rounded bg-gray-100 px-2 py-0.5 text-[9.5px] font-normal text-gray-700 border border-gray-200">
              {trabajosPendientes.filter((t) => t.estado === 'Pendiente').length} Partidas Pendientes
            </span>
          </div>

          <div className="overflow-x-auto rounded border border-gray-200">
            <table className="w-full text-left font-mono text-[9.5px]">
              <thead>
                <tr className="bg-gray-50 text-gray-600 font-normal uppercase tracking-wider text-[8.5px] border-b border-gray-200">
                  <th className="p-2 w-16">CÃƒÂ³digo</th>
                  <th className="p-2 min-w-[160px]">DescripciÃƒÂ³n / Partida</th>
                  <th className="p-2 text-center w-24">Estado</th>
                  <th className="p-2 text-right">Cant. Bruta</th>
                  <th className="p-2 text-right">Descuento Aplicado</th>
                  <th className="p-2 text-right font-normal text-gray-900">Cant. Neta a Cobrar</th>
                  <th className="p-2">Origen / Trazabilidad</th>
                  <th className="p-2 text-center w-20">AcciÃƒÂ³n</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {trabajosPendientes
                  .filter((item) => {
                    const renglonMaestro = CATALOGO_COMPLETO_88.find((cat) => cat.codigoDGC === item.codigoDGC)
                    const matchCap = capituloFiltro === 'todos' || renglonMaestro?.capituloId === capituloFiltro
                    const matchEst = estadoEjecucionFiltro === 'todos' || item.estado === estadoEjecucionFiltro
                    const matchTipo = tipoRenglonFiltro === 'todos' || (renglonMaestro?.tipoRenglon === tipoRenglonFiltro)
                    const matchBusq = busqueda === '' ||
                      item.codigoDGC.toLowerCase().includes(busqueda.toLowerCase()) ||
                      item.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
                      item.origenTrazabilidad.toLowerCase().includes(busqueda.toLowerCase())

                    return matchCap && matchEst && matchTipo && matchBusq
                  })
                  .map((item) => {
                  const descuentoMonto = item.longitudBase * item.factorDescuento
                  const cantidadNetaCobrar = Math.max(0, item.cantidadBruta - descuentoMonto)
                  const esCriticoTresMeses = item.mesesAntiguedad >= 3 && item.estado === 'Pendiente'

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50/80 bg-white transition-colors"
                    >
                      <td className="p-2 font-mono font-bold text-gray-900">{item.codigoDGC}</td>

                      <td className="p-2 font-sans font-normal text-gray-800">
                        <div>
                          <span>{item.descripcion}</span>
                          {esCriticoTresMeses && (
                            <div className="mt-0.5 inline-flex items-center gap-1 text-[8.5px] font-normal text-gray-700">
                              <AlertTriangle size={11} className="text-gray-500 shrink-0" />
                              <span>{item.mesesAntiguedad} meses sin procesar</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="p-2 text-center">
                        {item.estado === 'Pendiente' && (
                          <span className="rounded bg-gray-100 text-gray-800 px-2 py-0.5 text-[8.5px] font-normal border border-gray-200">
                            Pendiente
                          </span>
                        )}
                        {item.estado === 'Aprobado' && (
                          <span className="rounded bg-gray-100 text-gray-800 px-2 py-0.5 text-[8.5px] font-normal border border-gray-200">
                            Aprobado
                          </span>
                        )}
                        {item.estado === 'Trasladado' && (
                          <span className="rounded bg-gray-100 text-gray-800 px-2 py-0.5 text-[8.5px] font-normal border border-gray-200 flex items-center justify-center gap-0.5">
                            <Check size={10} /> Trasladado
                          </span>
                        )}
                      </td>

                      <td className="p-2 text-right text-gray-700">
                        {item.cantidadBruta.toLocaleString('es-GT', { minimumFractionDigits: 2 })} {item.unidad}
                      </td>

                      <td className="p-2 text-right text-gray-700">
                        {descuentoMonto > 0 ? (
                          <span>
                            Ã¢Ë†â€™{descuentoMonto.toFixed(2)} ({item.factorDescuento}Ãƒâ€”L)
                          </span>
                        ) : (
                          <span className="text-gray-400">0.00</span>
                        )}
                      </td>

                      <td className="p-2 text-right font-normal text-gray-900 font-mono">
                        {cantidadNetaCobrar.toLocaleString('es-GT', { minimumFractionDigits: 2 })} {item.unidad}
                      </td>

                      <td className="p-2 font-sans text-gray-600 text-[9px]">
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 border border-gray-200 font-mono">
                          {item.origenTrazabilidad}
                        </span>
                      </td>

                      <td className="p-2 text-center">
                        {item.estado !== 'Trasladado' ? (
                          <button
                            type="button"
                            onClick={() => handlePromoverTrabajoPendiente(item)}
                            className="inline-flex items-center gap-1 rounded bg-[#9B0F06] px-2 py-1 text-[8.5px] font-normal text-white hover:bg-[#5E0006] transition-colors shadow-2xs cursor-pointer"
                            title="Promover a Trasladado e integrar con Tab AnalÃƒÂ­tico"
                          >
                            <span>Promover</span>
                            <ArrowRight size={10} />
                          </button>
                        ) : (
                          <span className="text-[8px] text-gray-400 font-sans">Sincronizado</span>
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

      {/* TAB 4: [PLANIFICADO VS REAL] */}
      {tabSeccion === 'planificadoReal' && (() => {
        const totalPvrRenglones = renglonesFiltradosYOrdenados.length
        const totalPvrPaginas = Math.ceil(totalPvrRenglones / pvrItemsPorPagina) || 1
        const pvrPaginaValidada = Math.min(pvrPaginaActual, totalPvrPaginas)
        const pvrInicio = (pvrPaginaValidada - 1) * pvrItemsPorPagina
        const pvrFin = pvrInicio + pvrItemsPorPagina
        const pvrRenglonesPagina = renglonesFiltradosYOrdenados.slice(pvrInicio, pvrFin)

        return (
          <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-2xs space-y-3 font-[Poppins]">
            <div className="flex flex-wrap items-center justify-between border-b border-gray-100 pb-2 gap-2">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-[#9B0F06]" />
                <div>
                  <h3 className="text-xs font-medium text-gray-900">
                    Comparativa de Avance: Planificado vs Real
                  </h3>
                  <p className="text-[9.5px] text-gray-500 font-normal">
                    AnÃƒÂ¡lisis de variaciones fÃƒÂ­sicas y financieras segÃƒÂºn cronograma del programa de trabajo.
                  </p>
                </div>
              </div>

              <span className="rounded bg-gray-100 px-2 py-0.5 text-[9.5px] font-normal text-gray-700 border border-gray-200">
                {totalPvrRenglones} Renglones Evaluados
              </span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-left font-mono text-[9.5px]">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 font-medium uppercase tracking-wider text-[8.5px] border-b border-gray-200">
                    <th className="p-2 w-16">CÃƒÂ³digo</th>
                    <th className="p-2 min-w-[180px]">DescripciÃƒÂ³n</th>
                    <th className="p-2 text-right">Cant. Ajustada (Plan)</th>
                    <th className="p-2 text-right">Cant. Ejecutada (Real)</th>
                    <th className="p-2 text-right">% Planificado (Mes 6)</th>
                    <th className="p-2 text-right">% Real</th>
                    <th className="p-2 text-center w-28">VariaciÃƒÂ³n</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pvrRenglonesPagina.map((r) => {
                    const ejecReal = r.cantidadEstePeriodo + r.cantidadAcumuladaAnterior
                    
                    // CÃƒÂ¡lculo dinÃƒÂ¡mico de % Planificado a la fecha (hasta Mes 6)
                    const sumaPlanMes6 = r.avancesMensuales
                      ? Object.entries(r.avancesMensuales).reduce((acc, [mesKey, val]) => {
                          const numMes = parseInt(mesKey.replace('Mes ', ''), 10)
                          if (!isNaN(numMes) && numMes <= 6) return acc + (Number(val) || 0)
                          return acc
                        }, 0)
                      : 0

                    const pctPlan = r.cantidadAjustada > 0 ? (sumaPlanMes6 / r.cantidadAjustada) * 100 : 0
                    const pctReal = r.cantidadAjustada > 0 ? (ejecReal / r.cantidadAjustada) * 100 : 0
                    const variacion = pctReal - pctPlan

                    let colorClase = 'border-emerald-500 text-emerald-700 bg-transparent'
                    if (variacion < -15) {
                      colorClase = 'border-red-500 text-red-700 bg-transparent'
                    } else if (variacion < 0) {
                      colorClase = 'border-amber-500 text-amber-700 bg-transparent'
                    }

                    return (
                      <tr key={`pvr-${r.id}`} className="hover:bg-gray-50/60 font-[Poppins]">
                        <td className="p-2 font-mono font-bold text-gray-900">{r.codigoDGC}</td>
                        <td className="p-2 font-sans text-gray-800">{r.descripcion}</td>
                        <td className="p-2 text-right font-mono text-gray-700">
                          {r.cantidadAjustada.toLocaleString('es-GT', { minimumFractionDigits: 2 })} {r.unidad}
                        </td>
                        <td className="p-2 text-right font-mono text-gray-900 font-medium">
                          {ejecReal.toLocaleString('es-GT', { minimumFractionDigits: 2 })} {r.unidad}
                        </td>
                        <td className="p-2 text-right font-mono text-gray-600">{pctPlan.toFixed(1)}%</td>
                        <td className="p-2 text-right font-mono text-gray-900">{pctReal.toFixed(1)}%</td>
                        <td className="p-2 text-center">
                          <span className={`inline-block px-2 py-0.5 text-[9px] font-mono font-semibold border rounded ${colorClase}`}>
                            {variacion > 0 ? `+${variacion.toFixed(1)}%` : `${variacion.toFixed(1)}%`}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* PaginaciÃƒÂ³n estandarizada DomunNet */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-100 text-[9.5px]">
              <div className="flex items-center gap-1.5 text-gray-500 font-normal">
                <span>Mostrando</span>
                <span className="font-mono font-medium text-gray-800">{pvrRenglonesPagina.length > 0 ? pvrInicio + 1 : 0}</span>
                <span>a</span>
                <span className="font-mono font-medium text-gray-800">{Math.min(pvrFin, totalPvrRenglones)}</span>
                <span>de</span>
                <span className="font-mono font-medium text-gray-800">{totalPvrRenglones}</span>
                <span>renglones</span>

                <select
                  value={pvrItemsPorPagina}
                  onChange={(e) => {
                    setPvrItemsPorPagina(Number(e.target.value))
                    setPvrPaginaActual(1)
                  }}
                  className="ml-2 rounded border border-gray-200 bg-gray-50 px-1 py-0.5 text-[9px] font-normal text-gray-700 focus:outline-none"
                >
                  <option value={10}>10 / pÃƒÂ¡g</option>
                  <option value={15}>15 / pÃƒÂ¡g</option>
                  <option value={25}>25 / pÃƒÂ¡g</option>
                  <option value={50}>50 / pÃƒÂ¡g</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={pvrPaginaValidada === 1}
                  onClick={() => setPvrPaginaActual((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-0.5 rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[9px] font-normal text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft size={11} />
                  <span>Anterior</span>
                </button>

                <div className="flex items-center px-1.5 py-0.5 bg-gray-100 rounded text-[9px] font-normal text-gray-700 border border-gray-200">
                  <span>{pvrPaginaValidada}</span>
                  <span className="mx-0.5 text-gray-400">/</span>
                  <span>{totalPvrPaginas}</span>
                </div>

                <button
                  type="button"
                  disabled={pvrPaginaValidada >= totalPvrPaginas}
                  onClick={() => setPvrPaginaActual((p) => Math.min(totalPvrPaginas, p + 1))}
                  className="inline-flex items-center gap-0.5 rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[9px] font-normal text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>Siguiente</span>
                  <ChevronRight size={11} />
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* TAB 5: [RESUMEN FINANCIERO] */}
      {tabSeccion === 'resumen' && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs space-y-3 text-[10px] font-[Poppins]">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <div className="flex items-center gap-2">
              <Banknote size={16} className="text-[#9B0F06]" />
              <div>
                <h3 className="text-xs font-medium text-gray-900">
                  Resumen Financiero del Periodo y Estado de Cuenta
                </h3>
                <p className="text-[9.5px] text-gray-500 font-normal">
                  Consolidado financiero proveniente de vista_estado_cuenta y vista_control_anticipo.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-lg border border-gray-200 bg-gray-50/70 p-3 space-y-2">
              <div className="flex items-center gap-1.5 border-b border-gray-200 pb-1.5">
                <Banknote size={14} className="text-[#9B0F06]" />
                <h4 className="text-[10px] font-medium uppercase text-gray-900">Control de Anticipo (20%)</h4>
              </div>

              <div className="space-y-1 font-mono text-[9.5px]">
                <div className="flex justify-between py-0.5">
                  <span className="font-sans text-gray-600 font-normal">Monto Total Recibido (20%):</span>
                  <span className="font-normal text-gray-900">Q {anticipoRecibido20.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between py-0.5">
                  <span className="font-sans text-gray-600 font-normal">AmortizaciÃƒÂ³n Acumulada (Anterior):</span>
                  <span className="font-normal text-emerald-800">Q {amortizacionAnteriorAcumulada.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between py-0.5">
                  <span className="font-sans text-gray-600 font-normal">AmortizaciÃƒÂ³n del Periodo (20%):</span>
                  <span className="font-normal text-emerald-800">Q {amortizacionAnticipoEstePeriodo.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between py-1 border-t border-gray-200 font-normal text-[#9B0F06] bg-red-50/50 px-1 rounded">
                  <span className="font-sans">Saldo por Amortizar:</span>
                  <span>Q {saldoAnticipoPorAmortizar.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50/70 p-3 space-y-2">
              <div className="flex items-center gap-1.5 border-b border-gray-200 pb-1.5">
                <Calculator size={14} className="text-[#9B0F06]" />
                <h4 className="text-[10px] font-medium uppercase text-gray-900">Totales Contractuales</h4>
              </div>

              <div className="space-y-1 font-mono text-[9.5px]">
                <div className="flex justify-between py-0.5">
                  <span className="font-sans text-gray-600 font-normal">Costo Directo Contratado Total (DÃƒâ€”F):</span>
                  <span className="font-normal text-gray-900">Q {subtotalCostoDirectoContratadoGlobal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between py-0.5">
                  <span className="font-sans text-gray-600 font-normal">(+) Indirectos 45% Contractuales:</span>
                  <span className="font-normal text-gray-800">Q {indirectos45ContratadoGlobal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between py-0.5 border-b border-gray-200 pb-1">
                  <span className="font-sans text-gray-600 font-normal">(+) IVA 12% Contractual:</span>
                  <span className="font-normal text-gray-800">Q {iva12ContratadoGlobal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between py-1 font-bold text-[#9B0F06] bg-red-50/70 px-1 rounded">
                  <span className="font-sans text-[8.5px] uppercase">Monto Contractual Original Total:</span>
                  <span>Q {montoContractualOriginalTotal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between py-0.5 pt-1">
                  <span className="font-sans text-gray-600 font-normal">Costo Directo Periodo (M):</span>
                  <span className="font-normal text-gray-900">Q {subtotalCostoDirectoGlobalPeriodo.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between py-1 border-t border-gray-200 font-normal text-[#9B0F06] bg-red-100/60 p-1.5 rounded items-center">
                  <div className="flex items-center gap-1">
                    <span className="font-sans text-[9px]">LÃƒÂ­quido Neto a Favor Contratista Periodo:</span>
                    <div className="relative group cursor-pointer inline-flex items-center">
                      <Info size={13} className="text-[#9B0F06] hover:text-[#5E0006] transition-colors" />
                      <div className="absolute left-1/2 bottom-full mb-1.5 -translate-x-1/2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-[8.5px] font-sans font-normal rounded-md shadow-xl z-50 pointer-events-none leading-tight">
                        <strong>FÃƒÂ³rmula DGC Oficial:</strong><br/>
                        (Costo Directo Periodo Ãƒâ€” 1.45 Ãƒâ€” 1.12) Ã¢Ë†â€™ AmortizaciÃƒÂ³n del Periodo
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </div>
                  <span>Q {liquidoAPagarNetoContratista.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50/70 p-3 space-y-2">
              <div className="flex items-center gap-1.5 border-b border-gray-200 pb-1.5">
                <Clock size={14} className="text-[#9B0F06]" />
                <h4 className="text-[10px] font-medium uppercase text-gray-900">Indicadores de Tiempo</h4>
              </div>

              <div className="space-y-1.5 text-[9.5px]">
                <div className="flex justify-between py-0.5">
                  <span className="text-gray-600 font-normal">Fecha Inicio Contrato:</span>
                  <span className="font-mono font-normal text-gray-900">{fechaInicioContrato}</span>
                </div>

                <div className="flex justify-between py-0.5">
                  <span className="text-gray-600 font-normal">DÃƒÂ­as Empleados:</span>
                  <span className="font-mono font-normal text-gray-900">{diasEmpleadosCalculados} DÃƒÂ­as</span>
                </div>

                <div className="flex justify-between py-0.5">
                  <span className="text-gray-600 font-normal">DÃƒÂ­as Suspendidos (Actas Formales):</span>
                  <span className="font-mono font-normal text-orange-800">{diasSuspendidosSumados} DÃƒÂ­as</span>
                </div>

                <div className="flex justify-between py-1 border-t border-gray-200 bg-blue-50/60 p-1.5 rounded text-blue-950 font-normal">
                  <span>FinalizaciÃƒÂ³n Actualizada:</span>
                  <span className="font-mono font-medium text-[#9B0F06]">{fechaFinalizacionActualizada}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REQUERIMIENTO: PANEL "DETALLE DEL RENGLÃƒâ€œN" (BOTÃƒâ€œN VER / OJO)
          - ALINEADO AL PATRÃƒâ€œN DE USUARIOS (TARJETAS BG-GRAY-50/BORDER-GRAY-200)
          - DENSIDAD COMPACTA Y FUENTE POPPINS SIN NEAGRILLA EN VALORES
          - MOSTRAR TODAS LAS COLUMNAS DEL MOTOR FINANCIERO A-P CON VALORES EXACTOS EN GRID 2 COLUMNAS POR BLOQUES:
            IdentificaciÃƒÂ³n -> Cantidades y Avance -> Financiero -> Desglose Mensual
      */}
      {drawerModo === 'ver' && renglonSeleccionado && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs font-[Poppins]">
          <div className="h-full w-full max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-gray-200">
            {/* Header del Panel */}
            <div className="flex items-center justify-between border-b border-gray-200 p-2.5 bg-gray-50">
              <div className="flex items-center gap-1.5">
                <Eye size={15} className="text-[#9B0F06]" />
                <div>
                  <h3 className="text-[10.5px] font-medium text-gray-900 uppercase">
                    DETALLE DEL RENGLÃƒâ€œN [{renglonSeleccionado.codigoDGC}]
                  </h3>
                  <p className="text-[8.5px] text-gray-500 font-normal">Solo lectura</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDrawerModo(null)}
                className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Cuerpo del Panel agrupado en bloques en Grid 2 columnas (A-P) */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-[9.5px]">
              {/* BLOQUE 1: IdentificaciÃƒÂ³n */}
              <div>
                <p className="text-[8px] text-gray-400 uppercase tracking-widest font-medium mb-1.5 border-b border-gray-100 pb-1">
                  IdentificaciÃƒÂ³n del RenglÃƒÂ³n
                </p>

                <div className="space-y-1.5">
                  <div className="rounded-lg bg-gray-50 p-2 border border-gray-200">
                    <span className="text-[7.5px] font-medium text-gray-600 block">CÃƒÂ³digo DGC (A)</span>
                    <p className="font-mono text-[10px] font-bold text-gray-900 mt-0.5">{renglonSeleccionado.codigoDGC}</p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-2 border border-gray-200">
                    <span className="text-[7.5px] font-medium text-gray-600 block">DescripciÃƒÂ³n Completa (B)</span>
                    <p className="font-normal text-gray-800 leading-tight mt-0.5">{renglonSeleccionado.descripcion}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="rounded-lg bg-gray-50 p-2 border border-gray-200">
                      <span className="text-[7.5px] font-medium text-gray-600 block">Unidad de Medida (C)</span>
                      <p className="font-normal text-gray-800">{renglonSeleccionado.unidad}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-2 border border-gray-200">
                      <span className="text-[7.5px] font-medium text-gray-600 block">Tipo RenglÃƒÂ³n</span>
                      <p className="font-normal text-gray-800">{renglonSeleccionado.tipoRenglon || 'Original'}</p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-2 border border-gray-200">
                    <span className="text-[7.5px] font-medium text-gray-600 block">CapÃƒÂ­tulo Pertenece</span>
                    <p className="font-normal text-[#9B0F06] leading-tight">{renglonSeleccionado.capituloNombre}</p>
                  </div>
                </div>
              </div>

              {/* BLOQUE 2: Cantidades y Avance (D-L) */}
              <div>
                <p className="text-[8px] text-gray-400 uppercase tracking-widest font-medium mb-1.5 border-b border-gray-100 pb-1">
                  Cantidades y Avance FÃƒÂ­sico (D-L)
                </p>

                <div className="grid grid-cols-2 gap-1.5">
                  <div className="rounded-lg bg-gray-50 p-2 border border-gray-200">
                    <span className="text-[7.5px] font-medium text-gray-600 block">Cant. Contratada (D)</span>
                    <p className="font-mono font-normal text-gray-900">{renglonSeleccionado.cantidadContratada.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-2 border border-gray-200">
                    <span className="text-[7.5px] font-medium text-gray-600 block">Cant. Ajustada (E)</span>
                    <p className="font-mono font-normal text-gray-900">{renglonSeleccionado.cantidadAjustada.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-2 border border-gray-200">
                    <span className="text-[7.5px] font-medium text-gray-600 block">Costo Unit. Directo (F)</span>
                    <p className="font-mono font-normal text-gray-900">Q {renglonSeleccionado.costoUnitarioDirecto.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-2 border border-gray-200">
                    <span className="text-[7.5px] font-medium text-gray-600 block">Este Periodo Cant. (I)</span>
                    <p className="font-mono font-normal text-blue-900">{renglonSeleccionado.cantidadEstePeriodo.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-2 border border-gray-200">
                    <span className="text-[7.5px] font-medium text-gray-600 block">Acum. Anterior Cant. (J)</span>
                    <p className="font-mono font-normal text-gray-800">{renglonSeleccionado.cantidadAcumuladaAnterior.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-2 border border-gray-200">
                    <span className="text-[7.5px] font-medium text-gray-600 block">Total a Fecha Cant. (K)</span>
                    <p className="font-mono font-normal text-gray-900">
                      {(renglonSeleccionado.cantidadEstePeriodo + renglonSeleccionado.cantidadAcumuladaAnterior).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-2 border border-gray-200 col-span-2">
                    <span className="text-[7.5px] font-medium text-gray-600 block">% Avance Cantidad (L = K/E)</span>
                    <p className="font-mono font-normal text-[#9B0F06]">
                      {(
                        renglonSeleccionado.cantidadAjustada > 0
                          ? ((renglonSeleccionado.cantidadEstePeriodo + renglonSeleccionado.cantidadAcumuladaAnterior) / renglonSeleccionado.cantidadAjustada) * 100
                          : 0
                      ).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* BLOQUE 3: Motor Financiero (G-P) */}
              <div>
                <p className="text-[8px] text-gray-400 uppercase tracking-widest font-medium mb-1.5 border-b border-gray-100 pb-1">
                  Valores Financieros Exactos (G-P)
                </p>

                <div className="space-y-1.5">
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="rounded-lg bg-gray-50 p-2 border border-gray-200">
                      <span className="text-[7.5px] font-medium text-gray-600 block">Costo Directo RenglÃƒÂ³n (G=DÃƒâ€”F)</span>
                      <p className="font-mono font-normal text-gray-900">Q {(renglonSeleccionado.cantidadContratada * renglonSeleccionado.costoUnitarioDirecto).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-2 border border-gray-200">
                      <span className="text-[7.5px] font-medium text-gray-600 block">Costo Directo Ajustado (H=EÃƒâ€”F)</span>
                      <p className="font-mono font-normal text-gray-900">
                        Q {(renglonSeleccionado.cantidadAjustada * renglonSeleccionado.costoUnitarioDirecto).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="rounded-lg bg-gray-50 p-2 border border-gray-200">
                      <span className="text-[7.5px] font-medium text-gray-600 block">Este Periodo Costo (M=IÃƒâ€”F)</span>
                      <p className="font-mono font-normal text-gray-900">
                        Q {(renglonSeleccionado.cantidadEstePeriodo * renglonSeleccionado.costoUnitarioDirecto).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                      </p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-2 border border-gray-200">
                      <span className="text-[7.5px] font-medium text-gray-600 block">Acum. Anterior Costo (N)</span>
                      <p className="font-mono font-normal text-gray-900">
                        Q {(renglonSeleccionado.cantidadAcumuladaAnterior * renglonSeleccionado.costoUnitarioDirecto).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="rounded-lg bg-gray-50 p-2 border border-gray-200">
                      <span className="text-[7.5px] font-medium text-gray-600 block">Total a Fecha Costo (O=M+N)</span>
                      <p className="font-mono font-normal text-gray-900 font-medium">
                        Q {((renglonSeleccionado.cantidadEstePeriodo + renglonSeleccionado.cantidadAcumuladaAnterior) * renglonSeleccionado.costoUnitarioDirecto).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                      </p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-2 border border-gray-200">
                      <span className="text-[7.5px] font-medium text-gray-600 block">% Avance Costo (P=O/H)</span>
                      <p className="font-mono font-normal text-[#9B0F06]">
                        {(
                          renglonSeleccionado.cantidadAjustada > 0
                            ? ((renglonSeleccionado.cantidadEstePeriodo + renglonSeleccionado.cantidadAcumuladaAnterior) / renglonSeleccionado.cantidadAjustada) * 100
                            : 0
                        ).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-red-50/50 p-2 border border-red-200">
                    <span className="text-[7.5px] font-medium text-[#9B0F06] block">Saldo por Ejecutar (HÃ¢Ë†â€™O)</span>
                    <p className="font-mono font-normal text-[#9B0F06] text-[10px]">
                      Q {(Math.max(0, (renglonSeleccionado.cantidadAjustada - (renglonSeleccionado.cantidadEstePeriodo + renglonSeleccionado.cantidadAcumuladaAnterior)) * renglonSeleccionado.costoUnitarioDirecto)).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>

              {/* BLOQUE 4: Desglose Mensual DinÃƒÂ¡mico */}
              <div>
                <p className="text-[8px] text-gray-400 uppercase tracking-widest font-medium mb-1.5 border-b border-gray-100 pb-1">
                  Desglose Mensual Exacto
                </p>

                <div className="rounded-lg border border-gray-200 overflow-hidden bg-gray-50/50">
                  <table className="w-full text-[9px] font-mono">
                    <thead className="bg-gray-100 border-b border-gray-200 text-gray-600 text-[8px] font-medium">
                      <tr>
                        <th className="p-1.5 text-left">Mes / Periodo</th>
                        <th className="p-1.5 text-right">Cantidad Ejecutada</th>
                        <th className="p-1.5 text-right">Monto Directo (Q)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-gray-800">
                      {listaMesesDinamicos.map((mes) => {
                        const cantMes = renglonSeleccionado.avancesMensuales?.[mes] || 0
                        const montoMes = cantMes * renglonSeleccionado.costoUnitarioDirecto

                        return (
                          <tr key={mes}>
                            <td className="p-1.5 font-sans font-normal">{mes}</td>
                            <td className="p-1.5 text-right font-normal">
                              {cantMes > 0 ? `${cantMes.toLocaleString('es-GT', { minimumFractionDigits: 1 })} ${renglonSeleccionado.unidad}` : 'Ã¢â‚¬â€'}
                            </td>
                            <td className="p-1.5 text-right font-normal">
                              {montoMes > 0 ? `Q ${montoMes.toLocaleString('es-GT', { minimumFractionDigits: 2 })}` : 'Ã¢â‚¬â€'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer Panel */}
            <div className="border-t border-gray-200 p-2.5 bg-gray-50 flex justify-end">
              <button
                type="button"
                onClick={() => setDrawerModo(null)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-[10px] font-medium text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REQUERIMIENTO FORMULARIO "AGREGAR NUEVO RENGLÃƒâ€œN":
          - ALINEADO EXACTAMENTE AL PATRÃƒâ€œN DE USUARIOS (CREAR/EDITAR USUARIO)
          - FUENTE POPPINS, DENSIDAD COMPACTA
          - LABELS EN BOLD CON ASTERISCO ROJO (*), VALORES SIN BOLD
          - CAMPOS NUMÃƒâ€°RICOS SOLO DÃƒÂGITOS
          - BORDES ROJOS Y INSTANCIA REAL TOAST SI FALLA VALIDACIÃƒâ€œN
          - BOTONES ABAJO A LA DERECHA
      */}
      {drawerModo === 'crear' && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs font-[Poppins]">
          <div className="h-full w-full max-w-sm bg-white shadow-2xl flex flex-col justify-between border-l border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-200 p-2.5 bg-gray-50">
              <div className="flex items-center gap-1.5">
                <Plus size={15} className="text-[#9B0F06]" />
                <div>
                  <h3 className="text-[11px] font-bold uppercase text-gray-900">Agregar Nuevo RenglÃƒÂ³n</h3>
                  <p className="text-[8.5px] text-gray-500 font-normal">Complete los datos obligatorios (*)</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDrawerModo(null)}
                className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 text-[10px]">
              {/* Bloque IdentificaciÃƒÂ³n */}
              <div>
                <p className="text-[8.5px] text-gray-400 uppercase tracking-widest font-semibold mb-2 border-b border-gray-100 pb-1">
                  1. IdentificaciÃƒÂ³n y DescripciÃƒÂ³n
                </p>

                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-700 mb-0.5 block">
                      CÃƒÂ³digo DGC <span className="text-[#FF4D4F]">*</span>
                    </label>
                    <input
                      type="text"
                      value={formCodigo}
                      onChange={(e) => {
                        setFormCodigo(e.target.value)
                        if (errorsForm.codigo) setErrorsForm({ ...errorsForm, codigo: false })
                      }}
                      placeholder="Ej: 504.01"
                      className={`w-full border rounded-lg px-2.5 py-1.5 text-[10px] font-normal text-gray-700 focus:outline-none transition-colors ${
                        errorsForm.codigo ? 'border-[#FF4D4F] bg-red-50/20' : 'border-gray-200 focus:border-[#9B0F06]'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-gray-700 mb-0.5 block">
                      DescripciÃƒÂ³n del RenglÃƒÂ³n <span className="text-[#FF4D4F]">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={formDescripcion}
                      onChange={(e) => {
                        setFormDescripcion(e.target.value)
                        if (errorsForm.descripcion) setErrorsForm({ ...errorsForm, descripcion: false })
                      }}
                      placeholder="Ej: Pavimento de concreto hidrÃƒÂ¡ulico MR=45 e=20cm"
                      className={`w-full border rounded-lg px-2.5 py-1.5 text-[10px] font-normal text-gray-700 focus:outline-none transition-colors ${
                        errorsForm.descripcion ? 'border-[#FF4D4F] bg-red-50/20' : 'border-gray-200 focus:border-[#9B0F06]'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Bloque ClasificaciÃƒÂ³n */}
              <div>
                <p className="text-[8.5px] text-gray-400 uppercase tracking-widest font-semibold mb-2 border-b border-gray-100 pb-1">
                  2. ClasificaciÃƒÂ³n y CapÃƒÂ­tulo
                </p>

                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-700 mb-0.5 block">
                      CapÃƒÂ­tulo del Libro Azul <span className="text-[#FF4D4F]">*</span>
                    </label>
                    <select
                      value={formCapituloId}
                      onChange={(e) => setFormCapituloId(Number(e.target.value))}
                      className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[10px] font-normal text-gray-700 bg-white focus:outline-none focus:border-[#9B0F06]"
                    >
                      {CAPITULOS_LIBRO_AZUL.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-gray-700 mb-0.5 block">
                        Unidad de Medida <span className="text-[#FF4D4F]">*</span>
                      </label>
                      <select
                        value={formUnidad}
                        onChange={(e) => setFormUnidad(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-[10px] font-normal text-gray-700 bg-white focus:outline-none focus:border-[#9B0F06]"
                      >
                        <option value="mÃ‚Â²">mÃ‚Â²</option>
                        <option value="mÃ‚Â³">mÃ‚Â³</option>
                        <option value="ml">ml</option>
                        <option value="U">U</option>
                        <option value="Glb">Glb</option>
                        <option value="Kg">Kg</option>
                        <option value="ton">ton</option>
                        <option value="Ha">Ha</option>
                        <option value="km">km</option>
                        <option value="otra">Otra (Agregar)...</option>
                      </select>
                    </div>

                    {formUnidad === 'otra' && (
                      <div>
                        <label className="text-[10px] font-semibold text-gray-700 mb-0.5 block">Nueva Unidad</label>
                        <input
                          type="text"
                          value={formUnidadManual}
                          onChange={(e) => setFormUnidadManual(e.target.value)}
                          placeholder="Ej: saco"
                          className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[10px] font-normal text-gray-700 focus:outline-none focus:border-[#9B0F06]"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bloque Valores NumÃƒÂ©ricos */}
              <div>
                <p className="text-[8.5px] text-gray-400 uppercase tracking-widest font-semibold mb-2 border-b border-gray-100 pb-1">
                  3. Valores NumÃƒÂ©ricos y Costos
                </p>

                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-gray-700 mb-0.5 block">
                        Cant. Contratada <span className="text-[#FF4D4F]">*</span>
                      </label>
                      <input
                        type="text"
                        value={formCantContratada}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^\d.]/g, '')
                          setFormCantContratada(val)
                          if (errorsForm.cantContratada) setErrorsForm({ ...errorsForm, cantContratada: false })
                        }}
                        placeholder="1000"
                        className={`w-full border rounded-lg px-2.5 py-1.5 text-[10px] font-normal font-mono text-gray-700 focus:outline-none transition-colors ${
                          errorsForm.cantContratada ? 'border-[#FF4D4F] bg-red-50/20' : 'border-gray-200 focus:border-[#9B0F06]'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-gray-700 mb-0.5 block">Cant. Ajustada</label>
                      <input
                        type="text"
                        value={formCantAjustada}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^\d.]/g, '')
                          setFormCantAjustada(val)
                        }}
                        placeholder="1000"
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[10px] font-normal font-mono text-gray-700 focus:outline-none focus:border-[#9B0F06]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-gray-700 mb-0.5 block">
                      Costo Unitario Directo (Q) <span className="text-[#FF4D4F]">*</span>
                    </label>
                    <input
                      type="text"
                      value={formCostoUnitario}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^\d.]/g, '')
                        setFormCostoUnitario(val)
                        if (errorsForm.costoUnitario) setErrorsForm({ ...errorsForm, costoUnitario: false })
                      }}
                      placeholder="250"
                      className={`w-full border rounded-lg px-2.5 py-1.5 text-[10px] font-normal font-mono text-gray-700 focus:outline-none transition-colors ${
                        errorsForm.costoUnitario ? 'border-[#FF4D4F] bg-red-50/20' : 'border-gray-200 focus:border-[#9B0F06]'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Botones Abajo a la Derecha (PatrÃƒÂ³n Usuarios) */}
            <div className="border-t border-gray-200 p-2.5 bg-gray-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDrawerModo(null)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-[10px] font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleGuardarRenglonCrear}
                className="inline-flex items-center gap-1 rounded-lg bg-[#9B0F06] px-3.5 py-1.5 text-[10px] font-medium text-white hover:bg-[#5E0006] transition-colors shadow-2xs cursor-pointer"
              >
                <Save size={12} />
                <span>Guardar RenglÃƒÂ³n</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MODIFICAR PLAZO (SOLO ROL ADMINISTRADOR) */}
      {modalModificarPlazoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs font-[Poppins] p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-200 p-3 bg-gray-50">
              <div className="flex items-center gap-1.5">
                <CalendarClock size={16} className="text-[#9B0F06]" />
                <div>
                  <h3 className="text-xs font-bold uppercase text-gray-900">Modificar Plazo de EjecuciÃƒÂ³n</h3>
                  <p className="text-[9px] text-gray-500 font-normal">Registro oficial de cambios de cronograma</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalModificarPlazoOpen(false)}
                className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <div className="p-3.5 space-y-3 text-[10px]">
              <div>
                <label className="text-[10px] font-semibold text-gray-700 mb-0.5 block">
                  Nueva Fecha de FinalizaciÃƒÂ³n <span className="text-[#FF4D4F]">*</span>
                </label>
                <input
                  type="date"
                  value={formNuevaFechaFin}
                  onChange={(e) => {
                    setFormNuevaFechaFin(e.target.value)
                    if (errorsPlazoForm.fechaFin) setErrorsPlazoForm({ ...errorsPlazoForm, fechaFin: false })
                  }}
                  className={`w-full border rounded-lg px-2.5 py-1.5 text-[10px] font-normal text-gray-800 focus:outline-none transition-colors ${
                    errorsPlazoForm.fechaFin ? 'border-[#FF4D4F] bg-red-50/20' : 'border-gray-200 focus:border-[#9B0F06]'
                  }`}
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-gray-700 mb-0.5 block">
                  Motivo de ModificaciÃƒÂ³n <span className="text-[#FF4D4F]">*</span>
                </label>
                <select
                  value={formMotivoPlazo}
                  onChange={(e) => setFormMotivoPlazo(e.target.value as any)}
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[10px] font-normal text-gray-800 bg-white focus:outline-none focus:border-[#9B0F06]"
                >
                  <option value="ampliacion">AmpliaciÃƒÂ³n de plazo contractual</option>
                  <option value="retraso">Retraso por caso fortuito / clima</option>
                  <option value="orden_cambio">Orden de cambio / Obra extra</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-gray-700 mb-0.5 block">
                  DÃƒÂ­as de SuspensiÃƒÂ³n / AmpliaciÃƒÂ³n <span className="text-[#FF4D4F]">*</span>
                </label>
                <input
                  type="text"
                  value={formDiasAdicionales}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^\d]/g, '')
                    setFormDiasAdicionales(val)
                    if (errorsPlazoForm.dias) setErrorsPlazoForm({ ...errorsPlazoForm, dias: false })
                  }}
                  placeholder="30"
                  className={`w-full border rounded-lg px-2.5 py-1.5 text-[10px] font-normal font-mono text-gray-800 focus:outline-none transition-colors ${
                    errorsPlazoForm.dias ? 'border-[#FF4D4F] bg-red-50/20' : 'border-gray-200 focus:border-[#9B0F06]'
                  }`}
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-gray-700 mb-0.5 block">
                  Observaciones / Acta Formal
                </label>
                <textarea
                  rows={2}
                  value={formObservacionesPlazo}
                  onChange={(e) => setFormObservacionesPlazo(e.target.value)}
                  placeholder="Ej: Aprobado mediante Acta No. 04-2026 por lluvias en tramo 2"
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[10px] font-normal text-gray-800 focus:outline-none focus:border-[#9B0F06]"
                />
              </div>
            </div>

            <div className="border-t border-gray-200 p-2.5 bg-gray-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalModificarPlazoOpen(false)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-[10px] font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleGuardarModificarPlazo}
                className="inline-flex items-center gap-1 rounded-lg bg-[#9B0F06] px-3.5 py-1.5 text-[10px] font-medium text-white hover:bg-[#5E0006] transition-colors shadow-2xs cursor-pointer"
              >
                <Save size={12} />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÃƒâ€œN PARA ELIMINAR */}
      {modalEliminarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs font-[Poppins]">
          <div className="w-full max-w-sm rounded-xl bg-white p-4 shadow-2xl space-y-3 border border-gray-200">
            <div className="flex items-center gap-2.5 text-red-700">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                <Trash2 size={16} />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-900">Ã‚Â¿Eliminar RenglÃƒÂ³n?</h3>
                <p className="text-[10px] text-gray-500 font-normal">Esta acciÃƒÂ³n no se puede deshacer.</p>
              </div>
            </div>

            {renglonAEliminar && (
              <div className="rounded bg-gray-50 p-2 border border-gray-200 text-xs">
                <p className="font-mono font-bold text-gray-900">{renglonAEliminar.codigoDGC}</p>
                <p className="text-gray-700 text-[10.5px] font-normal mt-0.5">{renglonAEliminar.descripcion}</p>
              </div>
            )}

            <div className="flex justify-end gap-1.5 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setModalEliminarOpen(false)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs font-normal text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEliminar}
                className="rounded-lg bg-[#9B0F06] px-3 py-1 text-xs font-medium text-white hover:bg-[#5E0006] cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



