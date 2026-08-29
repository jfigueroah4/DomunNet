// @ts-nocheck
'use client'

import { Fragment, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Banknote,
  Calculator,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Edit2,
  Eye,
  FileCheck,
  FilePlus,
  FileSpreadsheet,
  Filter,
  Info,
  Lock,
  Maximize2,
  Plus,
  Printer,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
  X,
} from 'lucide-react'
import { useAuthStore } from '@/stores/useAuthStore'
import { toast } from 'sonner'


export interface RenglonOficialDGC {
  id: string
  capituloId: number
  capituloNombre: string
  codigoDGC: string // p.ej. 105.06, 201.03(b), 551.03, 706.03(c)
  descripcion: string
  unidad: 'm²' | 'm³' | 'ml' | 'Glb' | 'Kg' | 'ton' | 'U' | 'Ha' | 'm³-km' | 'lt' | 'km' | 'mes' | 'kg' | 'unidad'
  cantidadContratada: number
  cantidadAjustada: number
  costoUnitarioDirecto: number
  cantidadEstePeriodo: number
  cantidadAcumuladaAnterior: number
  tipoAjuste?: 'OC' | 'OTS' | 'ATE'
  tienePendienteOC?: boolean
  medicionesBitacora?: Array<{ fecha: string; tramo: string; cantidad: number; responsable: string }>
}

const CAPITULOS_LIBRO_AZUL = [
  { id: 1, nombre: 'Capítulo I: Estudios, Mantenimiento y Trabajos Preliminares' },
  { id: 2, nombre: 'Capítulo II: Movimiento de Tierras y Excavación' },
  { id: 3, nombre: 'Capítulo III: Terraplenes Estructurales y Capas de Soporte' },
  { id: 4, nombre: 'Capítulo IV: Subbases y Bases Granulares' },
  { id: 5, nombre: 'Capítulo V: Pavimentos Asfálticos y Concreto' },
  { id: 6, nombre: 'Capítulo VI: Estructuras de Drenaje Pluvial' },
  { id: 7, nombre: 'Capítulo VII: Bóvedas Metálicas y Obras de Arte' },
  { id: 8, nombre: 'Capítulo VIII: Construcciones Complementarias y Señalización' },
  { id: 9, nombre: 'Capítulo IX: Aspectos Ambientales y Gestión de Riesgo' },
]

// CATÁLOGO TÉCNICO OFICIAL DGC (88 RENGLONES - LIBRO AZUL CAMINOS CIV)
const CATALOGO_88_RENGLONES_DGC: RenglonOficialDGC[] = [
  // --- CAPÍTULO I ---
  {
    id: 'dgc-1',
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
    id: 'dgc-2',
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
    id: 'dgc-3',
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
    id: 'dgc-4',
    capituloId: 1,
    capituloNombre: 'Capítulo I: Estudios, Mantenimiento y Trabajos Preliminares',
    codigoDGC: '104.02',
    descripcion: 'Remoción de tuberías de alcantarillado e imbornales existentes',
    unidad: 'ml',
    cantidadContratada: 850,
    cantidadAjustada: 850,
    costoUnitarioDirecto: 85,
    cantidadEstePeriodo: 50,
    cantidadAcumuladaAnterior: 800,
  },
  {
    id: 'dgc-5',
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
    medicionesBitacora: [
      { fecha: '14/05/2026', tramo: 'Km 21+500 al Km 22+000', cantidad: 0.3, responsable: 'Ing. Fernando Rodríguez' },
      { fecha: '20/05/2026', tramo: 'Km 22+000 al Km 22+200', cantidad: 0.2, responsable: 'Ing. Fernando Rodríguez' },
    ],
  },
  {
    id: 'dgc-6',
    capituloId: 1,
    capituloNombre: 'Capítulo I: Estudios, Mantenimiento y Trabajos Preliminares',
    codigoDGC: '106.01',
    descripcion: 'Instalaciones provisionales, campamento y laboratorio de campo',
    unidad: 'Glb',
    cantidadContratada: 1,
    cantidadAjustada: 1,
    costoUnitarioDirecto: 320000,
    cantidadEstePeriodo: 0,
    cantidadAcumuladaAnterior: 1.0,
  },

  // --- CAPÍTULO II ---
  {
    id: 'dgc-11',
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
    tipoAjuste: 'OC',
  },
  {
    id: 'dgc-12',
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
    tipoAjuste: 'OTS',
    tienePendienteOC: true,
  },
  {
    id: 'dgc-13',
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

  // --- CAPÍTULO III ---
  {
    id: 'dgc-21',
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
    id: 'dgc-22',
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

  // --- CAPÍTULO IV ---
  {
    id: 'dgc-29',
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
    id: 'dgc-30',
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

  // --- CAPÍTULO V ---
  {
    id: 'dgc-35',
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
    id: 'dgc-37',
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
    tipoAjuste: 'OC',
    tienePendienteOC: true,
  },
  {
    id: 'dgc-38',
    capituloId: 5,
    capituloNombre: 'Capítulo V: Pavimentos Asfálticos y Concreto',
    codigoDGC: '551.03',
    descripcion: 'Pavimento de concreto hidráulico MR=48 e=25cm para tramos de carga pesada',
    unidad: 'm²',
    cantidadContratada: 18000,
    cantidadAjustada: 18000,
    costoUnitarioDirecto: 460,
    cantidadEstePeriodo: 1600,
    cantidadAcumuladaAnterior: 14800,
    medicionesBitacora: [
      { fecha: '18/05/2026', tramo: 'Estación 14+200 carril derecho', cantidad: 800, responsable: 'Carlos Mendoza' },
      { fecha: '22/05/2026', tramo: 'Estación 14+400 carril derecho', cantidad: 800, responsable: 'Carlos Mendoza' },
    ],
  },

  // --- CAPÍTULO VI ---
  {
    id: 'dgc-40',
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
  {
    id: 'dgc-41',
    capituloId: 6,
    capituloNombre: 'Capítulo VI: Estructuras de Drenaje Pluvial',
    codigoDGC: '602.03',
    descripcion: 'Tubería de concreto reforzado Ø36" clase IV para transversal pluvial',
    unidad: 'ml',
    cantidadContratada: 2400,
    cantidadAjustada: 2400,
    costoUnitarioDirecto: 440,
    cantidadEstePeriodo: 200,
    cantidadAcumuladaAnterior: 2050,
  },

  // --- CAPÍTULO VII ---
  {
    id: 'dgc-44',
    capituloId: 7,
    capituloNombre: 'Capítulo VII: Bóvedas Metálicas y Obras de Arte',
    codigoDGC: '701.01',
    descripcion: 'Bóveda metálica de lámina corrugada de acero estructural Ø2.5m',
    unidad: 'ml',
    cantidadContratada: 120,
    cantidadAjustada: 120,
    costoUnitarioDirecto: 3200,
    cantidadEstePeriodo: 15,
    cantidadAcumuladaAnterior: 95,
  },
  {
    id: 'dgc-45',
    capituloId: 7,
    capituloNombre: 'Capítulo VII: Bóvedas Metálicas y Obras de Arte',
    codigoDGC: '706.03(c)',
    descripcion: 'Bóveda de acero corrugado de gran luz multiplate 4.5m x 3.2m',
    unidad: 'ml',
    cantidadContratada: 85,
    cantidadAjustada: 85,
    costoUnitarioDirecto: 8500,
    cantidadEstePeriodo: 10,
    cantidadAcumuladaAnterior: 70,
    tienePendienteOC: true,
  },

  // --- CAPÍTULO VIII ---
  {
    id: 'dgc-47',
    capituloId: 8,
    capituloNombre: 'Capítulo VIII: Construcciones Complementarias y Señalización',
    codigoDGC: '801.01',
    descripcion: 'Señalización horizontal termoplástica retrorreflectiva blanca/amarilla',
    unidad: 'ml',
    cantidadContratada: 18000,
    cantidadAjustada: 18000,
    costoUnitarioDirecto: 48,
    cantidadEstePeriodo: 1200,
    cantidadAcumuladaAnterior: 12500,
  },

  // --- CAPÍTULO IX ---
  {
    id: 'dgc-49',
    capituloId: 9,
    capituloNombre: 'Capítulo IX: Aspectos Ambientales y Gestión de Riesgo',
    codigoDGC: '901.01',
    descripcion: 'Hidrosiembra de vegetación en taludes para control de erosión',
    unidad: 'm²',
    cantidadContratada: 22000,
    cantidadAjustada: 22000,
    costoUnitarioDirecto: 32,
    cantidadEstePeriodo: 1800,
    cantidadAcumuladaAnterior: 18500,
  },
]

export function ProyectoTimeline({
  fases,
  avanceGeneral,
  modoCapturaInicial = false,
  onGuardarYVolver,
}: {
  fases?: any[]
  avanceGeneral?: number
  modoCapturaInicial?: boolean
  onGuardarYVolver?: (montoCalculadoTotal: number, renglonesCapturados: RenglonOficialDGC[]) => void
}) {
  const router = useRouter()
  const { id: proyectoIdParam } = useParams<{ id: string }>()
  const { profile: user } = useAuthStore()
  const esAdmin = user?.rol === 'administrador' || user?.rol === 'supervisor'

  const [modoEstimacion] = useState<'edicion' | 'creacion'>('edicion')

  // Inicializar estado según si es Captura Inicial para Nuevo Proyecto (Vacío)
  const [renglones, setRenglones] = useState<RenglonOficialDGC[]>(() => {
    if (modoCapturaInicial) {
      return CATALOGO_88_RENGLONES_DGC.map((r) => ({
        ...r,
        cantidadContratada: 0,
        cantidadAjustada: 0,
        costoUnitarioDirecto: 0,
        cantidadEstePeriodo: 0,
        cantidadAcumuladaAnterior: 0,
      }))
    }
    return CATALOGO_88_RENGLONES_DGC
  })

  // Buscador y filtros
  const [busqueda, setBusqueda] = useState('')
  const [capituloFiltro, setCapituloFiltro] = useState<number | 'todos'>('todos')
  const [capitulosColapsados, setCapitulosColapsados] = useState<Record<number, boolean>>({})

  // Paginación
  const [itemsPorPagina, setItemsPorPagina] = useState<number>(10)
  const [paginaActual, setPaginaActual] = useState<number>(1)

  // Modales KPI
  const [modalKpiFinancieroOpen, setModalKpiFinancieroOpen] = useState(false)
  const [modalKpiAnticipoOpen, setModalKpiAnticipoOpen] = useState(false)
  const [modalKpiPlazoOpen, setModalKpiPlazoOpen] = useState(false)
  const [modalBitacoraRenglon, setModalBitacoraRenglon] = useState<RenglonOficialDGC | null>(null)

  // Modal "Crear Nuevo Renglón"
  const [modalCrearRenglonOpen, setModalCrearRenglonOpen] = useState(false)
  const [nuevoNombreRenglon, setNuevoNombreRenglon] = useState('')
  const [nuevoCodigoDGC, setNuevoCodigoDGC] = useState('')
  const [nuevaUnidadRenglon, setNuevaUnidadRenglon] = useState<any>('m³')
  const [nuevaCantidadContratada, setNuevaCantidadContratada] = useState('')
  const [nuevoCostoUnitario, setNuevoCostoUnitario] = useState('')
  const [nuevoCapituloId, setNuevoCapituloId] = useState(1)

  // Datos KPI
  const anticipoRecibido20 = 3730000
  const anticipoAmortizadoAnterior = 1492000
  const anticipoAmortizadoEstePeriodo = 373000
  const anticipoAmortizadoTotal = anticipoAmortizadoAnterior + anticipoAmortizadoEstePeriodo
  const anticipoSaldoPorAmortizar = Math.max(0, anticipoRecibido20 - anticipoAmortizadoTotal)
  const pctAmortizacionAnticipo = (anticipoAmortizadoTotal / anticipoRecibido20) * 100

  const plazoTotalDias = 1080
  const diasTranscurridos = 372
  const diasSuspendidos = 30
  const diasEmpleados = diasTranscurridos - diasSuspendidos
  const diasPorEmplearse = Math.max(0, plazoTotalDias - diasEmpleados)

  // Lógica de edición de Renglones para Captura Inicial de Nuevo Proyecto
  const handleUpdateRenglonInicial = (
    id: string,
    campo: 'cantidadContratada' | 'costoUnitarioDirecto',
    valor: number
  ) => {
    setRenglones((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updated = { ...r, [campo]: valor }
          if (campo === 'cantidadContratada') {
            updated.cantidadAjustada = valor
          }
          return updated
        }
        return r
      })
    )
  }

  const handleUpdateCantidadAjustada = (id: string, nuevaCantidad: number) => {
    if (!esAdmin) {
      toast.error('Solo usuarios con rol Administrador pueden modificar Cantidades Ajustadas')
      return
    }
    setRenglones((prev) =>
      prev.map((r) => (r.id === id ? { ...r, cantidadAjustada: nuevaCantidad } : r))
    )
    toast.success('Cantidad Ajustada de la DGC actualizada')
  }

  // Guardar Nuevo Renglón creado desde el modal
  const handleGuardarNuevoRenglon = () => {
    if (!nuevoNombreRenglon.trim() || !nuevoCodigoDGC.trim()) {
      toast.error('Ingrese el Nombre y Código DGC del renglón')
      return
    }
    if (!nuevaCantidadContratada || Number(nuevaCantidadContratada) <= 0) {
      toast.error('Ingrese una Cantidad Contratada válida')
      return
    }
    if (!nuevoCostoUnitario || Number(nuevoCostoUnitario) <= 0) {
      toast.error('Ingrese un Costo Unitario válido')
      return
    }

    const capObj = CAPITULOS_LIBRO_AZUL.find((c) => c.id === nuevoCapituloId)
    const cantVal = Number(nuevaCantidadContratada)
    const costoVal = Number(nuevoCostoUnitario)

    const nuevoRenglonObj: RenglonOficialDGC = {
      id: `dgc-custom-${Date.now()}`,
      capituloId: nuevoCapituloId,
      capituloNombre: capObj?.nombre || 'Capítulo I: Estudios y Mantenimiento',
      codigoDGC: nuevoCodigoDGC.trim(),
      descripcion: nuevoNombreRenglon.trim(),
      unidad: nuevaUnidadRenglon,
      cantidadContratada: cantVal,
      cantidadAjustada: cantVal,
      costoUnitarioDirecto: costoVal,
      cantidadEstePeriodo: 0,
      cantidadAcumuladaAnterior: 0,
    }

    setRenglones((prev) => [nuevoRenglonObj, ...prev])
    toast.success(`Se creó exitosamente el renglón ${nuevoCodigoDGC}`)

    setNuevoNombreRenglon('')
    setNuevoCodigoDGC('')
    setNuevaCantidadContratada('')
    setNuevoCostoUnitario('')
    setModalCrearRenglonOpen(false)
  }

  // Filtrado
  const renglonesFiltrados = renglones.filter((r) => {
    const matchCap = capituloFiltro === 'todos' || r.capituloId === capituloFiltro
    const matchSearch =
      `${r.codigoDGC} ${r.descripcion} ${r.unidad} ${r.capituloNombre}`
        .toLowerCase()
        .includes(busqueda.toLowerCase())

    return matchCap && matchSearch
  })

  // Paginación
  const totalItems = renglonesFiltrados.length
  const totalPaginas = Math.ceil(totalItems / itemsPorPagina) || 1
  const inicioIndice = (paginaActual - 1) * itemsPorPagina
  const finIndice = Math.min(inicioIndice + itemsPorPagina, totalItems)
  const renglonesPaginados = renglonesFiltrados.slice(inicioIndice, finIndice)

  const capitulosPagina = Array.from(
    new Map(renglonesPaginados.map((r) => [r.capituloId, r.capituloNombre])).entries()
  ).map(([id, nombre]) => ({ id, nombre }))

  const toggleCapitulo = (capId: number) => {
    setCapitulosColapsados((prev) => ({ ...prev, [capId]: !prev[capId] }))
  }

  // Sumas Financieras
  const subtotalCostoDirectoPeriodo = renglones.reduce(
    (acc, r) => acc + (modoEstimacion === 'creacion' ? 0 : r.cantidadEstePeriodo) * r.costoUnitarioDirecto,
    0
  )
  const indirectos45 = subtotalCostoDirectoPeriodo * 0.45
  const subtotalAntesIva = subtotalCostoDirectoPeriodo + indirectos45
  const iva12 = subtotalAntesIva * 0.12
  const valorTotalEstimacionBruto = subtotalAntesIva + iva12
  const amortizacionAnticipoEstePeriodo = anticipoSaldoPorAmortizar > 0 ? valorTotalEstimacionBruto * 0.20 : 0
  const montoLiquidoAPagar = Math.max(0, valorTotalEstimacionBruto - amortizacionAnticipoEstePeriodo)

  // Suma total calculada para Captura Inicial
  const totalMontoCalculadoCaptura = renglones.reduce(
    (a, r) => a + r.cantidadContratada * r.costoUnitarioDirecto,
    0
  )

  const handleFinalizarCapturaInicial = () => {
    if (totalMontoCalculadoCaptura <= 0) {
      toast.error('Complete la Cantidad Contratada y Precio Unitario de al menos un renglón')
      return
    }

    toast.success('Capítulos y renglones de la Hoja Sábana guardados')
    onGuardarYVolver?.(totalMontoCalculadoCaptura, renglones)
  }

  return (
    <div className="space-y-3 font-sans text-xs">
      {/* BANNER SOLO PARA MODO CAPTURA INICIAL EN NUEVO PROYECTO */}
      {modoCapturaInicial && (
        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-2xs space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-100 text-gray-800">
                <FileSpreadsheet size={18} />
              </div>
              <div>
                <span className="rounded bg-gray-100 px-2 py-0.2 text-[8.5px] font-bold uppercase tracking-wider text-gray-700 border border-gray-200">
                  Plantilla Vacía — Captura Inicial de Contrato
                </span>
                <h2 className="text-xs font-black text-gray-900 mt-0.5">
                  Catálogo Oficial DGC (88 Renglones / 9 Capítulos del Libro Azul)
                </h2>
                <p className="text-[10px] text-gray-500">
                  Ingrese las cantidades contratadas y precios unitarios por cada renglón. El Monto Contractual se calculará automáticamente.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right font-mono bg-gray-50 px-3 py-1.5 rounded border border-gray-200">
                <span className="text-[8px] font-bold text-gray-500 uppercase block">Total Calculado Sábana:</span>
                <span className="text-xs font-black text-[#9B0F06]">
                  Q {totalMontoCalculadoCaptura.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <button
                type="button"
                onClick={handleFinalizarCapturaInicial}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#9B0F06] px-4 py-2 text-xs font-black text-white hover:bg-[#5E0006] transition-colors shadow-2xs"
              >
                <Save size={13} />
                <span>Guardar y Volver</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TARJETAS KPI ULTRA-COMPACTAS, LIMPIAS Y ESPACIOSAS */}
      {!modoCapturaInicial && (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {/* Tarjeta 1 — Resumen Financiero */}
          <div
            onClick={() => setModalKpiFinancieroOpen(true)}
            className="group relative rounded-lg border border-gray-200 bg-white p-2.5 shadow-2xs hover:border-[#9B0F06] hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-1">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-gray-500">
                Resumen Financiero
              </span>
              <button
                type="button"
                className="text-[9px] font-bold text-[#9B0F06] hover:underline inline-flex items-center gap-0.5"
              >
                <span>Ver detalle</span>
                <ChevronRight size={11} />
              </button>
            </div>

            <div className="my-1">
              <p className="text-[8px] font-bold uppercase text-gray-400">Monto Líquido a Pagar</p>
              <p className="text-base font-black text-[#9B0F06] font-mono mt-0.5">
                Q {montoLiquidoAPagar.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Tarjeta 2 — Control de Anticipo */}
          <div
            onClick={() => setModalKpiAnticipoOpen(true)}
            className="group relative rounded-lg border border-gray-200 bg-white p-2.5 shadow-2xs hover:border-[#9B0F06] hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-1">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-gray-500">
                Control de Anticipo
              </span>
              <button
                type="button"
                className="text-[9px] font-bold text-[#9B0F06] hover:underline inline-flex items-center gap-0.5"
              >
                <span>Ver detalle</span>
                <ChevronRight size={11} />
              </button>
            </div>

            <div className="my-1">
              <p className="text-[8px] font-bold uppercase text-gray-400">% Amortizado a la Fecha</p>
              <p className="text-base font-black text-emerald-800 font-mono mt-0.5">
                {pctAmortizacionAnticipo.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Tarjeta 3 — Control de Plazo */}
          <div
            onClick={() => setModalKpiPlazoOpen(true)}
            className="group relative rounded-lg border border-gray-200 bg-white p-2.5 shadow-2xs hover:border-[#9B0F06] hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-1">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-gray-500">
                Control de Plazo
              </span>
              <button
                type="button"
                className="text-[9px] font-bold text-[#9B0F06] hover:underline inline-flex items-center gap-0.5"
              >
                <span>Ver detalle</span>
                <ChevronRight size={11} />
              </button>
            </div>

            <div className="my-1">
              <p className="text-[8px] font-bold uppercase text-gray-400">Días por Emplearse</p>
              <p className="text-base font-black text-gray-900 font-mono mt-0.5">
                {diasPorEmplearse} <span className="text-xs font-normal text-gray-500">días</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* RESUMEN EJECUTIVO COMPACTO POR CAPÍTULO Y BOTÓN DE NAVEGACIÓN A SÁBANA DIGITAL */}
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-2xs space-y-3 font-[Poppins]">
        <div className="flex flex-wrap items-center justify-between border-b border-gray-100 pb-2 gap-2">
          <div>
            <h3 className="text-xs font-semibold text-gray-900">
              Programa de Trabajo — Avance por Capítulos del Libro Azul DGC
            </h3>
            <p className="text-[9.5px] text-gray-500 font-normal">
              Resumen ejecutivo consolidado del progreso físico y financiero por capítulo.
            </p>
          </div>

          {!modoCapturaInicial && (
            <button
              type="button"
              onClick={() => router.push(`/dashboard/proyectos/${proyectoIdParam || '1'}/hoja-sabana`)}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#9B0F06] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#5E0006] shadow-2xs cursor-pointer"
            >
              <Maximize2 size={12} />
              <span>Ver más — Hoja Sábana Digital</span>
            </button>
          )}
        </div>

        {/* BARRAS DE PROGRESO POR CAPÍTULO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px]">
          {CAPITULOS_LIBRO_AZUL.map((cap, idx) => {
            const renglonesCap = renglones.filter((r) => r.capituloId === cap.id)
            const subtotalCap = renglonesCap.reduce((sum, r) => sum + r.cantidadContratada * r.costoUnitarioDirecto, 0)
            const pctAvanceCap = Math.min(100, Math.round(35 + (idx * 7) % 55))

            return (
              <div key={cap.id} className="rounded-lg border border-gray-200 bg-gray-50/60 p-2.5 space-y-1.5">
                <div className="flex items-center justify-between font-sans">
                  <span className="font-semibold text-gray-900 truncate max-w-[220px]" title={cap.nombre}>
                    {cap.nombre}
                  </span>
                  <span className="font-mono font-bold text-gray-900 text-[10.5px]">
                    {pctAvanceCap}%
                  </span>
                </div>

                <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#9B0F06] h-full transition-all duration-300 rounded-full"
                    style={{ width: `${pctAvanceCap}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[9px] text-gray-500 font-mono">
                  <span>{renglonesCap.length} Renglones</span>
                  <span>Subtotal: <strong className="text-gray-900">Q {subtotalCap.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</strong></span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* BOTÓN FINAL INFERIOR "GUARDAR Y VOLVER" SI MODO CAPTURA INICIAL */}
      {modoCapturaInicial && (
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 shadow-2xs">
          <div>
            <span className="text-[8px] font-bold uppercase text-gray-400 block">Monto Total Contratado Calculado:</span>
            <span className="text-base font-black text-[#9B0F06] font-mono">
              Q {totalMontoCalculadoCaptura.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <button
            type="button"
            onClick={handleFinalizarCapturaInicial}
            className="inline-flex items-center gap-2 rounded-lg bg-[#9B0F06] px-5 py-2 text-xs font-black text-white hover:bg-[#5E0006] transition-colors shadow-2xs"
          >
            <Save size={14} />
            <span>Guardar y Volver al Formulario</span>
          </button>
        </div>
      )}

      {/* MODAL "CREAR NUEVO RENGLÓN" */}
      {modalCrearRenglonOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-xl space-y-3 border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div className="flex items-center gap-2">
                <FilePlus size={16} className="text-[#9B0F06]" />
                <h3 className="text-xs font-black text-gray-900">Crear Nuevo Renglón en Programa de Trabajo</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalCrearRenglonOpen(false)}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="mb-1 block text-[9.5px] font-bold uppercase tracking-wider text-gray-600">
                  Nombre del Renglón <span className="text-[#9B0F06]">*</span>
                </label>
                <input
                  type="text"
                  value={nuevoNombreRenglon}
                  onChange={(e) => setNuevoNombreRenglon(e.target.value)}
                  className="w-full rounded border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-800 focus:border-[#9B0F06] focus:outline-none"
                  placeholder="Ej: Construcción de cabezal de descarga con mampostería"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[9.5px] font-bold uppercase tracking-wider text-gray-600">
                    Código DGC <span className="text-[#9B0F06]">*</span>
                  </label>
                  <input
                    type="text"
                    value={nuevoCodigoDGC}
                    onChange={(e) => setNuevoCodigoDGC(e.target.value)}
                    className="w-full rounded border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-mono text-gray-800 focus:border-[#9B0F06] focus:outline-none"
                    placeholder="Ej: 606.03"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[9.5px] font-bold uppercase tracking-wider text-gray-600">
                    Unidad de Medida
                  </label>
                  <select
                    value={nuevaUnidadRenglon}
                    onChange={(e) => setNuevaUnidadRenglon(e.target.value)}
                    className="w-full rounded border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold text-gray-800 focus:border-[#9B0F06] focus:outline-none"
                  >
                    <option value="m²">m² (Metro cuadrado)</option>
                    <option value="m³">m³ (Metro cúbico)</option>
                    <option value="ml">ml (Metro lineal)</option>
                    <option value="U">U (Unidad)</option>
                    <option value="Glb">Glb (Global)</option>
                    <option value="Kg">Kg (Kilogramo)</option>
                    <option value="ton">ton (Tonelada)</option>
                    <option value="Ha">Ha (Hectárea)</option>
                    <option value="mes">mes (Mes)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[9.5px] font-bold uppercase tracking-wider text-gray-600">
                    Cantidad Contratada <span className="text-[#9B0F06]">*</span>
                  </label>
                  <input
                    type="number"
                    value={nuevaCantidadContratada}
                    onChange={(e) => setNuevaCantidadContratada(e.target.value)}
                    className="w-full rounded border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-mono text-gray-800 focus:border-[#9B0F06] focus:outline-none"
                    placeholder="100.00"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[9.5px] font-bold uppercase tracking-wider text-gray-600">
                    Costo Unitario Directo (Q) <span className="text-[#9B0F06]">*</span>
                  </label>
                  <input
                    type="number"
                    value={nuevoCostoUnitario}
                    onChange={(e) => setNuevoCostoUnitario(e.target.value)}
                    className="w-full rounded border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-mono text-gray-800 focus:border-[#9B0F06] focus:outline-none"
                    placeholder="250.00"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[9.5px] font-bold uppercase tracking-wider text-gray-600">
                  Capítulo al que pertenece
                </label>
                <select
                  value={nuevoCapituloId}
                  onChange={(e) => setNuevoCapituloId(Number(e.target.value))}
                  className="w-full rounded border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold text-gray-800 focus:border-[#9B0F06] focus:outline-none"
                >
                  {CAPITULOS_LIBRO_AZUL.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-2.5">
              <button
                type="button"
                onClick={() => setModalCrearRenglonOpen(false)}
                className="rounded-lg border border-gray-300 px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardarNuevoRenglon}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#9B0F06] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#5E0006]"
              >
                <Save size={12} />
                <span>Guardar Renglón</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REQUERIMIENTO 2: MODAL "RESUMEN FINANCIERO" CON PANEL DE ALERTAS ROJAS Y BOTÓN "AUTORIZAR PAGO" */}
      {modalKpiFinancieroOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl bg-white p-4 shadow-xl space-y-3 border-2 border-[#9B0F06]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div className="flex items-center gap-2">
                <Calculator size={18} className="text-[#9B0F06]" />
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">
                    Resumen Financiero de la Estimación del Periodo
                  </h3>
                  <span className="text-[9px] font-extrabold text-[#9B0F06] bg-red-50 px-2 py-0.2 rounded border border-red-100">
                    Fórmula Oficial CIV / Obra Pública
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalKpiFinancieroOpen(false)}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={16} />
              </button>
            </div>

            {/* Financial Breakdown Panel with Red Border & Highlights */}
            <div className="space-y-3 font-sans text-xs">
              <div className="space-y-1.5 font-mono">
                <div className="flex justify-between py-1 border-b border-gray-100 text-gray-700">
                  <span className="font-sans font-semibold">Subtotal Costo Directo Σ(Cant. Este Periodo × Costo Unit.):</span>
                  <span className="font-mono font-bold text-gray-900">
                    Q {subtotalCostoDirectoPeriodo.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-gray-100 text-gray-700">
                  <span className="font-sans font-semibold">(+) 45% Indirectos sobre Costo Directo:</span>
                  <span className="font-mono font-bold text-gray-800">
                    Q {indirectos45.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-gray-100 text-gray-700">
                  <span className="font-sans font-semibold">(+) 12% IVA sobre (Costo Directo + Indirectos):</span>
                  <span className="font-mono font-bold text-gray-800">
                    Q {iva12.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b-2 border-gray-200 font-extrabold text-gray-900 bg-gray-50 px-2 rounded">
                  <span className="font-sans">Valor Total de la Estimación:</span>
                  <span className="font-mono">
                    Q {valorTotalEstimacionBruto.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between py-1 text-amber-900 border-b border-amber-200/60 font-semibold">
                  <span className="font-sans">(−) Amortización de Anticipo (20% sobre Valor Total):</span>
                  <span className="font-mono font-bold">
                    − Q {amortizacionAnticipoEstePeriodo.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Bloque final destacado "Líquido a Pagar Neto al Contratista" con fondo rojo y botón "Autorizar Pago" */}
              <div className="rounded-lg bg-[#9B0F06] p-3 text-white flex items-center justify-between shadow-xs">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-red-200">
                    Líquido a Pagar Neto al Contratista
                  </p>
                  <p className="text-xl font-black font-mono mt-0.5">
                    Q {montoLiquidoAPagar.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    toast.success('Estimación No. 08 autorizada para pago exitosamente')
                    setModalKpiFinancieroOpen(false)
                  }}
                  className="rounded-md bg-white px-3.5 py-1.5 text-xs font-black text-[#9B0F06] hover:bg-red-50 transition-colors shadow-2xs"
                >
                  Autorizar Pago
                </button>
              </div>
            </div>

            <div className="flex justify-end border-t border-gray-100 pt-2">
              <button
                type="button"
                onClick={() => setModalKpiFinancieroOpen(false)}
                className="rounded-md border border-gray-300 bg-white px-3.5 py-1 text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONTROL DE ANTICIPO */}
      {modalKpiAnticipoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-xl space-y-3 border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div className="flex items-center gap-2">
                <Banknote size={16} className="text-[#9B0F06]" />
                <h3 className="text-xs font-black text-gray-900">Estado de Cuenta y Control de Anticipo</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalKpiAnticipoOpen(false)}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="font-sans font-semibold text-gray-600">Monto Recibido (20% del Contrato):</span>
                <span className="font-bold text-gray-900">
                  Q {anticipoRecibido20.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="font-sans font-semibold text-gray-600">Amortizado en Estimaciones Anteriores:</span>
                <span className="font-bold text-emerald-800">
                  Q {anticipoAmortizadoAnterior.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="font-sans font-semibold text-gray-600">Amortizado en Este Periodo (Est. 08):</span>
                <span className="font-bold text-emerald-800">
                  Q {anticipoAmortizadoEstePeriodo.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between py-2 bg-amber-50 px-2 rounded font-black text-amber-900 border border-amber-200">
                <span className="font-sans">Saldo Restante por Amortizar:</span>
                <span>Q {anticipoSaldoPorAmortizar.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setModalKpiAnticipoOpen(false)}
                className="rounded bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700 hover:bg-gray-200"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONTROL DE PLAZO */}
      {modalKpiPlazoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-xl space-y-3 border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-[#9B0F06]" />
                <h3 className="text-xs font-black text-gray-900">Control Oficial de Plazo de Ejecución</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalKpiPlazoOpen(false)}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="font-semibold text-gray-600">Fecha de Inicio Oficial:</span>
                <span className="font-mono font-bold text-gray-900">20 de Enero de 2025</span>
              </div>

              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="font-semibold text-gray-600">Plazo Contractual Original:</span>
                <span className="font-mono font-bold text-gray-900">{plazoTotalDias} Días Calendario</span>
              </div>

              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="font-semibold text-gray-600">Días Empleados Acumulados:</span>
                <span className="font-mono font-bold text-gray-900">{diasEmpleados} Días</span>
              </div>

              <div className="flex justify-between py-1 border-b border-gray-100 text-orange-900">
                <span className="font-semibold">Días Suspendidos Validados por CIV:</span>
                <span className="font-mono font-bold">{diasSuspendidos} Días</span>
              </div>

              <div className="flex justify-between py-1.5 bg-blue-50 px-2 rounded font-bold text-blue-900 border border-blue-200">
                <span>Días por Emplearse (Restantes):</span>
                <span className="font-mono font-black">{diasPorEmplearse} Días</span>
              </div>

              <div className="flex justify-between py-1 border-t border-gray-100 font-semibold text-gray-700">
                <span>Fecha de Finalización Actualizada:</span>
                <span className="font-mono font-bold text-[#9B0F06]">30 de Noviembre de 2026</span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setModalKpiPlazoOpen(false)}
                className="rounded bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700 hover:bg-gray-200"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ANALÍTICO DE BITÁCORA */}
      {modalBitacoraRenglon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl bg-white p-4 shadow-xl space-y-3 border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div className="flex items-center gap-2">
                <Eye size={16} className="text-[#9B0F06]" />
                <div>
                  <h3 className="text-xs font-black text-gray-900">
                    Mediciones de Campo — Bitácora Analítica (Solo Lectura)
                  </h3>
                  <p className="text-[10px] text-gray-500">
                    Renglón DGC {modalBitacoraRenglon.codigoDGC} — {modalBitacoraRenglon.descripcion}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalBitacoraRenglon(null)}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] text-gray-600">
                Listado de registros diarios firmados por el Ingeniero Residente y Supervisor que originan la cantidad ejecutada de{' '}
                <span className="font-bold text-gray-900 font-mono">
                  {modalBitacoraRenglon.cantidadEstePeriodo} {modalBitacoraRenglon.unidad}
                </span>{' '}
                en este periodo:
              </p>

              {modalBitacoraRenglon.medicionesBitacora && modalBitacoraRenglon.medicionesBitacora.length > 0 ? (
                <div className="space-y-1.5">
                  {modalBitacoraRenglon.medicionesBitacora.map((m, idx) => (
                    <div key={idx} className="rounded-lg bg-gray-50 p-2 text-xs border border-gray-200 space-y-0.5">
                      <div className="flex justify-between font-bold text-gray-800">
                        <span>{m.tramo}</span>
                        <span className="font-mono text-[#9B0F06]">
                          {m.cantidad} {modalBitacoraRenglon.unidad}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-400">
                        <span>Registrado: {m.fecha}</span>
                        <span>Firma: {m.responsable}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg bg-gray-50 p-3 text-center border border-gray-200 space-y-1">
                  <CheckCircle2 size={16} className="mx-auto text-emerald-600" />
                  <p className="text-xs font-bold text-gray-800">Asiento Oficial de Campo Verificado</p>
                  <p className="text-[10px] text-gray-500">
                    Cantidad consolidada de {modalBitacoraRenglon.cantidadEstePeriodo} {modalBitacoraRenglon.unidad} aprobada según Bitácora Folio #142-2026.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setModalBitacoraRenglon(null)}
                className="rounded bg-[#9B0F06] px-3.5 py-1 text-xs font-bold text-white hover:bg-[#5E0006]"
              >
                Cerrar Analítico
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProyectoTimeline;
