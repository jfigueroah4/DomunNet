// @ts-nocheck
'use client'
import React, { useState, useEffect, useMemo, Fragment } from 'react'
import { api, apiGetDeduplicado } from '@/lib/api/cliente'

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
import { showSuccessToast, showErrorToast } from '@/components/ui/Toast'
import { useAuthStore } from '@/stores/useAuthStore'
import { useRouter, useParams } from 'next/navigation'

function parseFechaRobust(fechaStr?: string | Date | null): Date | null {
  if (!fechaStr) return null
  if (fechaStr instanceof Date) return isNaN(fechaStr.getTime()) ? null : fechaStr
  const str = String(fechaStr).trim()
  if (!str) return null

  if (str.includes('/')) {
    const parts = str.split('/')
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10)
      const m = parseInt(parts[1], 10) - 1
      const y = parseInt(parts[2], 10)
      const parsed = new Date(y, m, d)
      return isNaN(parsed.getTime()) ? null : parsed
    }
  }

  if (str.includes('-')) {
    const clean = str.split('T')[0]
    const parts = clean.split('-')
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10)
      const m = parseInt(parts[1], 10) - 1
      const d = parseInt(parts[2], 10)
      const parsed = new Date(y, m, d)
      return isNaN(parsed.getTime()) ? null : parsed
    }
  }

  const defaultParsed = new Date(str)
  return isNaN(defaultParsed.getTime()) ? null : defaultParsed
}

const TOOLTIPS_COLUMNAS_SABANA: Record<string, { title: string; formula?: string; desc: string }> = {
  A: {
    title: 'A. CÓDIGO DGC',
    desc: 'Código oficial normalizado de la partida de obra vial según el Libro de Especificaciones de la DGC.',
  },
  B: {
    title: 'B. DESCRIPCIÓN',
    desc: 'Nombre y descripción técnica detallada del alcance físico de la partida o renglón de trabajo.',
  },
  C: {
    title: 'C. UNIDAD DE MEDIDA',
    desc: 'Unidad física de medición contractual de la obra (m³, m², ml, kg, ton, Glb, U, Lt).',
  },
  D: {
    title: 'D. CANTIDAD CONTRATADA',
    desc: 'Volumen o cantidad física original establecida en el contrato de obra pública.',
  },
  E: {
    title: 'E. CANTIDAD AJUSTADA',
    desc: 'Cantidad modificada oficial según Órdenes de Cambio, Acuerdos Suplementarios o Cuadros de Excedentes.',
  },
  F: {
    title: 'F. COSTO UNITARIO DIRECTO',
    formula: 'Q (Precio Unitario)',
    desc: 'Precio unitario directo de oferta pactado por unidad de medida, antes de indirectos e IVA.',
  },
  G: {
    title: 'G. COSTO TOTAL DIRECTO',
    formula: 'D × F',
    desc: 'Monto de costo directo original del renglón (Cantidad Contratada D × Costo Unitario Directo F).',
  },
  H: {
    title: 'H. COSTO TOTAL AJUSTADO',
    formula: 'E × F',
    desc: 'Monto de costo directo ajustado vigente del renglón (Cantidad Ajustada E × Costo Unitario Directo F).',
  },
  I: {
    title: 'I. ESTE PERIODO (CANTIDAD)',
    formula: 'Sum(Analítico)',
    desc: 'Cantidad ejecutada calculada en tiempo real en la Memoria de Cálculo Analítica para la estimación activa.',
  },
  J: {
    title: 'J. ACUMULADO ANTERIOR (CANTIDAD)',
    desc: 'Suma de cantidades físicas aprobadas y pagadas en todas las estimaciones mensuales previas.',
  },
  K: {
    title: 'K. TOTAL A FECHA (CANTIDAD)',
    formula: 'I + J',
    desc: 'Cantidad total acumulada ejecutada desde el inicio de la obra hasta el corte del periodo actual.',
  },
  L: {
    title: 'L. % AVANCE (CANTIDAD)',
    formula: '(K / E) × 100',
    desc: 'Porcentaje físico ejecutado con relación a la Cantidad Ajustada (E) vigente.',
  },
  M: {
    title: 'M. ESTE PERIODO (COSTO)',
    formula: 'I × F',
    desc: 'Monto en Quetzales de costo directo a cobrar en la estimación del periodo actual.',
  },
  N: {
    title: 'N. ACUMULADO ANTERIOR (COSTO)',
    formula: 'J × F',
    desc: 'Monto acumulado en Quetzales de costo directo cobrado en periodos anteriores.',
  },
  O: {
    title: 'O. TOTAL A FECHA (COSTO)',
    formula: 'M + N',
    desc: 'Monto total en Quetzales de costo directo ejecutado a la fecha.',
  },
  P: {
    title: 'P. % AVANCE (COSTO)',
    formula: '(O / H) × 100',
    desc: 'Porcentaje de ejecución financiera acumulada con respecto al Costo Total Ajustado H.',
  },
  Saldo: {
    title: 'SALDO POR EJECUTAR',
    formula: 'H − O',
    desc: 'Monto financiero remanente de costo directo disponible por ejecutar en la partida.',
  },
}

function HeaderTooltip({
  colKey,
  children,
}: {
  colKey: string
  children: React.ReactNode
}) {
  const [hovered, setHovered] = useState(false)
  const info = TOOLTIPS_COLUMNAS_SABANA[colKey]

  if (!info) return <>{children}</>

  return (
    <div
      className="relative inline-block cursor-help"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
      {hovered && (
        <div className="absolute top-full left-1/2 z-[9999] mt-1.5 w-60 -translate-x-1/2 rounded-xl border border-gray-200 bg-white p-2.5 text-left font-sans shadow-xl backdrop-blur-md transition-all">
          <div className="flex items-center gap-1.5 border-b border-gray-100 pb-1">
            <Info size={11} className="text-[#9B0F06] shrink-0" />
            <span className="text-[10px] font-extrabold text-gray-900 leading-tight">{info.title}</span>
          </div>
          {info.formula && (
            <div className="my-1 rounded bg-red-50/80 px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#9B0F06] border border-red-100">
              Fórmula: {info.formula}
            </div>
          )}
          <p className="text-[9px] font-normal leading-normal text-gray-600">{info.desc}</p>
        </div>
      )}
    </div>
  )
}

const DISCRETE_UNITS = new Set(['u', 'glb', 'mes', 'hoja', 'arbol'])

export function isUnitDiscrete(unit?: string | { abreviatura?: string; simbolo?: string; es_discreta?: boolean }): boolean {
  if (!unit) return false
  if (typeof unit === 'object') {
    if (unit.es_discreta !== undefined && unit.es_discreta !== null) {
      return Boolean(unit.es_discreta)
    }
    const symbol = (unit.abreviatura || unit.simbolo || '').toLowerCase().trim()
    return DISCRETE_UNITS.has(symbol)
  }
  const str = String(unit).toLowerCase().trim()
  return DISCRETE_UNITS.has(str)
}

export function formatQuantity(val: number, unit?: string | { abreviatura?: string; simbolo?: string; es_discreta?: boolean }): string {
  const discrete = isUnitDiscrete(unit)
  const decimals = discrete ? 0 : 2
  return Number(val || 0).toLocaleString('es-GT', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function obtenerAvanceMensual(
  avancesMensuales: Record<string, number> | undefined,
  mesHeader: string,
  index: number
): number {
  if (!avancesMensuales) return 0
  if (avancesMensuales[mesHeader] !== undefined && avancesMensuales[mesHeader] !== null) {
    return Number(avancesMensuales[mesHeader]) || 0
  }
  const legacyKey = `Mes ${index + 1}`
  if (avancesMensuales[legacyKey] !== undefined && avancesMensuales[legacyKey] !== null) {
    return Number(avancesMensuales[legacyKey]) || 0
  }
  return 0
}

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

// Estructura de Medición de Campo para el Tab Analítico
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
  origenTrazabilidad?: string
  longitudBase?: number
  factorDescuento?: number
  cantidadBruta?: number
  costoUnitario?: number
  estacionInicio?: string
  estacionFin?: string
  longitudL?: number
  anchoA?: number
  alturaH?: number
  volumenAreaBruto?: number
  descuentoMonto?: number
  descuentoNombre?: string
  cantidadNetaCobrar?: number
  ubicacionEspecifica?: string
  ladoVia?: string
  estado: 'Pendiente' | 'Aprobado' | 'Trasladado'
  mesesAntiguedad: number
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

// 88 RENGLONES OFICIALES
const CATALOGO_DETALLADO_88_RENGLONES: RenglonDetalladoSabana[] = [
  {
    id: 'sab-1',
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
    tipoRenglon: 'Original',
    estadoEjecucion: 'En proceso',
    avancesMensuales: { 'Mes 1': 0.1, 'Mes 2': 0.1, 'Mes 3': 0.1, 'Mes 4': 0.1, 'Mes 5': 0.1, 'Mes 6': 0.1, 'Mes 7': 0.1 },
  },
  {
    id: 'sab-2',
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
    tipoRenglon: 'Original',
    estadoEjecucion: 'En proceso',
    avancesMensuales: { 'Mes 1': 4.0, 'Mes 2': 4.0, 'Mes 3': 4.0, 'Mes 4': 2.0, 'Mes 5': 2.0, 'Mes 6': 1.5 },
  },
  {
    id: 'sab-3',
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
    tipoRenglon: 'Original',
    estadoEjecucion: 'Completado',
    avancesMensuales: { 'Mes 1': 300, 'Mes 2': 400, 'Mes 3': 200, 'Mes 4': 100, 'Mes 5': 100, 'Mes 6': 100 },
  },
  {
    id: 'sab-11',
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
    tipoRenglon: 'Aumento',
    estadoEjecucion: 'En proceso',
    avancesMensuales: { 'Mes 1': 8000, 'Mes 2': 10000, 'Mes 3': 11000, 'Mes 4': 7000, 'Mes 5': 5000, 'Mes 6': 3500 },
  },
  {
    id: 'sab-12',
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
    tipoRenglon: 'Aumento',
    estadoEjecucion: 'Con excedente',
    avancesMensuales: { 'Mes 1': 2000, 'Mes 2': 3000, 'Mes 3': 3500, 'Mes 4': 2000, 'Mes 5': 1300, 'Mes 6': 1200 },
  },
  {
    id: 'sab-38',
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
    const existentesCap = lista.filter((r) => (r as any).capituloId === cap.id)
    const faltantes = 10 - existentesCap.length

    for (let i = 1; i <= faltantes; i++) {
      currentId++
      const codSub = `${cap.id}0${i}.${i < 10 ? '0' + i : i}-C${i}`
      lista.push({
        id: `sab-gen-${currentId}`,
        capituloId: cap.id,
        capituloNombre: cap.nombre,
        codigoDGC: codSub,
        descripcion: `Renglón complementario de ${cap.nombre.split(':')[1]?.trim() || 'Obra Vial'} No. ${i}`,
        unidad: i % 2 === 0 ? 'm³' : i % 3 === 0 ? 'ml' : 'm²',
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

const GENERAR_RENGLONES_VACIOS = (): RenglonDetalladoSabana[] => {
  return CATALOGO_COMPLETO_88.map((item, idx) => ({
    ...item,
    id: `vacio-${idx + 1}`,
    cantidadContratada: 0,
    cantidadAjustada: 0,
    costoUnitarioDirecto: 0,
    cantidadEstePeriodo: 0,
    cantidadAcumuladaAnterior: 0,
    tipoRenglon: 'Original',
    estadoEjecucion: 'No iniciado',
    avancesMensuales: {},
  }))
}

// Mediciones
const MEDICIONES_ANALITICAS_MOCK: MedicionAnaliticaCampo[] = [
  { id: 'm-1', codigoDGC: '201.01', estacionInicio: '14+200', estacionFin: '14+700', longitudL: 500, anchoA: 7.3, alturaH: 0.95, mesPeriodo: 'Mes 6', numEstimacion: 'Est. 08', observaciones: 'Ancho promedio verificado según libreta de nivelación topográfica N° 04.' },
  { id: 'm-2', codigoDGC: '201.01', estacionInicio: '14+700', estacionFin: '15+100', longitudL: 400, anchoA: 7.3, alturaH: 0.95, mesPeriodo: 'Mes 6', numEstimacion: 'Est. 08', observaciones: 'Alineamiento ajustado por presencia de talud de corte cóncavo.' },
  { id: 'm-3', codigoDGC: '201.03(b)', estacionInicio: '15+200', estacionFin: '15+500', longitudL: 300, anchoA: 4.0, alturaH: 1.0, mesPeriodo: 'Mes 6', numEstimacion: 'Est. 08', observaciones: 'Volumen derivado de perforación y voladura en banco de material rocoso duro.' },
  { id: 'm-4', codigoDGC: '551.03', estacionInicio: '14+200', estacionFin: '14+600', longitudL: 400, anchoA: 3.65, alturaH: 0.25, mesPeriodo: 'Mes 6', numEstimacion: 'Est. 08', observaciones: 'Espesor verificado con reglas de nivel durante la fundición continua de carril derecho.' },
]

// Trabajos Pendientes
const TRABAJOS_PENDIENTES_MOCK: TrabajoPendienteBolsa[] = [
  {
    id: 'p-1',
    codigoDGC: '201.03(b)',
    descripcion: 'Excavación en roca mediante voladura en talud inestable',
    unidad: 'm³',
    origenTrazabilidad: 'Volumen excede cupo contractual acumulado (48,000 m³ max)',
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
    descripcion: 'Pavimento de concreto hidráulico MR=45 tramo auxiliar',
    unidad: 'm²',
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

function sanitizePositivo(raw: string): number {
  const cleaned = raw.replace(/[^\d.]/g, '')
  const parts = cleaned.split('.')
  const formatted = parts.length > 1 ? `${parts[0]}.${parts.slice(1).join('')}` : cleaned
  const num = parseFloat(formatted)
  return isNaN(num) || num < 0 ? 0 : num
}

function handleKeyDownNumericOnly(e: React.KeyboardEvent<HTMLInputElement>) {
  if (
    ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '.'].includes(e.key) ||
    e.ctrlKey ||
    e.metaKey
  ) {
    return
  }
  if (!/\d/.test(e.key)) {
    e.preventDefault()
  }
}

export default function HojaSabanaView({ id: idProp }: { id?: string }) {
  const params = useParams<{ id: string }>()
  const routeId = params?.id
  const id = idProp || routeId
  const router = useRouter()
  const { profile: user } = useAuthStore()

  const [proyectoIdSeleccionado, setProyectoIdSeleccionado] = useState<string>(id || 'p-1')
  const [proyectoReal, setProyectoReal] = useState<any>(null)
  const [proyectosLista, setProyectosLista] = useState<any[]>([])

  useEffect(() => {
    const targetId = proyectoIdSeleccionado || id
    if (targetId && targetId !== 'nuevo' && targetId !== 'crear') {
      apiGetDeduplicado(`/proyectos/${targetId}`)
        .then((r) => {
          if (r.data?.data) {
            console.log('[HojaSabanaView] OBJETO PROYECTO RECIBIDO DEL BACKEND:', r.data.data)
            setProyectoReal(r.data.data)
          }
        })
        .catch((err) => {
          console.warn('[HojaSabanaView] Error cargando detalle de proyecto:', err)
        })
    }
  }, [proyectoIdSeleccionado, id])

  useEffect(() => {
    apiGetDeduplicado('/proyectos')
      .then((r) => {
        if (r.data?.data) setProyectosLista(r.data.data)
      })
      .catch(() => {})
  }, [])

  const esPlantillaVacia = proyectoIdSeleccionado === 'nuevo' || proyectoIdSeleccionado === 'crear'

  const proyecto = useMemo(() => {
    if (proyectoReal && (proyectoReal.id === proyectoIdSeleccionado || proyectoReal.codigo === proyectoIdSeleccionado || proyectoReal.slug === proyectoIdSeleccionado)) {
      return proyectoReal
    }
    const enc = proyectosLista.find((p) => p.id === proyectoIdSeleccionado || p.codigo === proyectoIdSeleccionado || p.slug === proyectoIdSeleccionado)
    if (enc) return enc
    if (proyectoReal) return proyectoReal
    if (esPlantillaVacia) {
      return {
        id: 'nuevo',
        codigo: 'PROY-000',
        nombre: 'Nuevo Proyecto (Plantilla Sábana Vacía)',
        presupuesto: 0,
        plazo: '0 Meses (0 días)',
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
  }, [proyectoReal, esPlantillaVacia, proyectosLista, proyectoIdSeleccionado])

  const [tabSeccion, setTabSeccion] = useState<'sabana' | 'analitico' | 'pendientes' | 'planificadoReal' | 'resumen'>('sabana')
  const [modoVistaSabana, setModoVistaSabana] = useState<'planificacion' | 'actual'>('actual')

  // MODAL MODIFICAR PLAZO
  const [modalModificarPlazoOpen, setModalModificarPlazoOpen] = useState(false)
  const [formNuevaFechaFin, setFormNuevaFechaFin] = useState('2026-12-31')
  const [formMotivoPlazo, setFormMotivoPlazo] = useState<'ampliacion' | 'retraso' | 'orden_cambio'>('ampliacion')
  const [formDiasAdicionales, setFormDiasAdicionales] = useState('30')
  const [formObservacionesPlazo, setFormObservacionesPlazo] = useState('')
  const [errorsPlazoForm, setErrorsPlazoForm] = useState<Record<string, boolean>>({})

  // FECHA FINALIZACIÓN ACTUALIZADA
  const [fechaFinalizacionActualizada, setFechaFinalizacionActualizada] = useState('')

  // APERTURA DE ESTIMACIÓN DINÁMICA DE PERIODO
  const [modalAperturaEstimacionOpen, setModalAperturaEstimacionOpen] = useState(false)
  const [listaEstimaciones, setListaEstimaciones] = useState<Array<{ id: string; numero: string; mes: string; fechaInicio: string; fechaCorte: string; estado: 'actual' | 'cerrada' }>>([
    { id: 'est-1', numero: 'Estimación 01', mes: 'Septiembre 2026', fechaInicio: '2026-09-01', fechaCorte: '2026-09-30', estado: 'cerrada' },
    { id: 'est-2', numero: 'Estimación 02', mes: 'Octubre 2026', fechaInicio: '2026-10-01', fechaCorte: '2026-10-31', estado: 'cerrada' },
    { id: 'est-3', numero: 'Estimación 05', mes: 'Noviembre 2026', fechaInicio: '2026-11-01', fechaCorte: '2026-11-30', estado: 'cerrada' },
    { id: 'est-4', numero: 'Estimación 08 (Actual)', mes: 'Diciembre 2026', fechaInicio: '2026-12-01', fechaCorte: '2026-12-31', estado: 'actual' },
  ])
  const [formEstNumero, setFormEstNumero] = useState('Estimación 09')
  const [formEstMes, setFormEstMes] = useState('Enero 2027')
  const [formEstFechaInicio, setFormEstFechaInicio] = useState('2027-01-01')
  const [formEstFechaCorte, setFormEstFechaCorte] = useState('2027-01-31')
  const [formEstNotas, setFormEstNotas] = useState('')

  // REGISTRAR MEDICIÓN EN TAB ANALÍTICO
  const [modalAgregarMedicionOpen, setModalAgregarMedicionOpen] = useState(false)
  const [formMedCodigoDGC, setFormMedCodigoDGC] = useState('201.01')
  const [formMedEstacionInicio, setFormMedEstacionInicio] = useState('15+000')
  const [formMedEstacionFin, setFormMedEstacionFin] = useState('15+500')
  const [formMedLongitud, setFormMedLongitud] = useState('500')
  const [formMedAncho, setFormMedAncho] = useState('7.30')
  const [formMedAltura, setFormMedAltura] = useState('0.85')

  const [capituloFiltro, setCapituloFiltro] = useState<number | 'todos'>('todos')
  const [mesFiltro, setMesFiltro] = useState<string | 'todos'>('todos')
  const [estadoEjecucionFiltro, setEstadoEjecucionFiltro] = useState<string | 'todos'>('todos')
  const [tipoRenglonFiltro, setTipoRenglonFiltro] = useState<string | 'todos'>('todos')
  const [numEstimacionFiltro, setNumEstimacionFiltro] = useState<string | 'todos'>('todos')

  const [busqueda, setBusqueda] = useState('')
  const [capitulosColapsados, setCapitulosColapsados] = useState<Record<number, boolean>>({})

  const [itemsPorPagina, setItemsPorPagina] = useState<number>(12)
  const [paginaActual, setPaginaActual] = useState<number>(1)

  // Paginación para Tab "Planificado vs Real"
  const [pvrItemsPorPagina, setPvrItemsPorPagina] = useState<number>(10)
  const [pvrPaginaActual, setPvrPaginaActual] = useState<number>(1)

  const [renglones, setRenglones] = useState<RenglonDetalladoSabana[]>(() => {
    if (esPlantillaVacia) return GENERAR_RENGLONES_VACIOS()
    return CATALOGO_COMPLETO_88
  })

  useEffect(() => {
    if (proyectoReal) {
      if (proyectoReal.planTrabajo && proyectoReal.planTrabajo.length > 0) {
        setRenglones(proyectoReal.planTrabajo)
      } else if (proyectoReal.renglones && proyectoReal.renglones.length > 0) {
        setRenglones(proyectoReal.renglones)
      } else {
        setRenglones(GENERAR_RENGLONES_VACIOS())
      }
    }
  }, [proyectoReal])

  const [medicionesAnaliticas, setMedicionesAnaliticas] = useState<MedicionAnaliticaCampo[]>(esPlantillaVacia ? [] : MEDICIONES_ANALITICAS_MOCK)
  const [trabajosPendientes, setTrabajosPendientes] = useState<TrabajoPendienteBolsa[]>(esPlantillaVacia ? [] : TRABAJOS_PENDIENTES_MOCK)

  const [capitulosLista, setCapitulosLista] = useState(CAPITULOS_LIBRO_AZUL)
  const [unidadesLista, setUnidadesLista] = useState([
    { id: 'u-1', simbolo: 'm³', nombre: 'Metro Cúbico', descripcion: 'Volumen para movimiento de tierras, excavaciones y fundiciones' },
    { id: 'u-2', simbolo: 'm²', nombre: 'Metro Cuadrado', descripcion: 'Área para pavimentos, pintura y limpieza' },
    { id: 'u-3', simbolo: 'ml', nombre: 'Metro Lineal', descripcion: 'Longitud para cunetas, bordillos y tuberías' },
    { id: 'u-4', simbolo: 'Glb', nombre: 'Suma Global', descripcion: 'Trabajos globales, campamento y mantenimiento de tránsito' },
    { id: 'u-5', simbolo: 'kg', nombre: 'Kilogramo', descripcion: 'Acero de refuerzo estructural' },
    { id: 'u-6', simbolo: 'ton', nombre: 'Tonelada Métrica', descripcion: 'Mezcla asfáltica en caliente' },
    { id: 'u-7', simbolo: 'U', nombre: 'Unidad / Pieza', descripcion: 'Elementos individuales, pozos y señales' },
    { id: 'u-8', simbolo: 'Lt', nombre: 'Litro', descripcion: 'Riego de liga y líquidos bituminosos' },
  ])

  // MODAL GESTIÓN DE RENGLONES, UNIDADES Y CAPÍTULOS
  const [modalGestionRenglonesOpen, setModalGestionRenglonesOpen] = useState(false)
  const [subTabGestion, setSubTabGestion] = useState<'renglones' | 'unidades' | 'capitulos'>('renglones')

  // CRUD Unidades
  const [modalUnidadFormOpen, setModalUnidadFormOpen] = useState(false)
  const [unidadForm, setUnidadForm] = useState<{ id?: string; simbolo: string; nombre: string; descripcion: string }>({ simbolo: '', nombre: '', descripcion: '' })
  const [unidadAEliminar, setUnidadAEliminar] = useState<{ id: string; simbolo: string } | null>(null)

  // CRUD Capítulos
  const [modalCapituloFormOpen, setModalCapituloFormOpen] = useState(false)
  const [capituloForm, setCapituloForm] = useState<{ id?: number; nombre: string }>({ nombre: '' })
  const [capituloAEliminar, setCapituloAEliminar] = useState<{ id: number; nombre: string } | null>(null)

  // CARGA AUTOMÁTICA DESDE SUPABASE AL MONTAR (REQUERIDO: NO DATOS QUEMADOS)
  useEffect(() => {
    let activo = true
    const cargarDesdeSupabase = async () => {
      try {
        // 1. Capítulos Sábana desde Supabase (/mantenimiento/capitulo_sabana)
        const resCap = await apiGetDeduplicado('/mantenimiento/capitulo_sabana?limite=100')
        const dataCaps = resCap?.data?.data || resCap?.data
        if (activo && Array.isArray(dataCaps) && dataCaps.length > 0) {
          const capsMapeados = dataCaps.map((c: any) => ({
            id: Number(c.numero_capitulo) || Number(c.id) || 1,
            nombre: c.nombre_capitulo || c.nombre || `Capítulo ${c.numero_capitulo || c.id}`,
            uuid: c.id,
          }))
          setCapitulosLista(capsMapeados)
        }

        // 2. Unidades de Medida desde Supabase (/mantenimiento/unidad_medida)
        const resUni = await apiGetDeduplicado('/mantenimiento/unidad_medida?limite=100')
        const dataUnis = resUni?.data?.data || resUni?.data
        if (activo && Array.isArray(dataUnis) && dataUnis.length > 0) {
          const unisMapeadas = dataUnis.map((u: any) => ({
            id: u.id,
            simbolo: u.abreviatura || u.simbolo || u.nombre || 'U',
            nombre: u.nombre,
            descripcion: u.descripcion || '',
          }))
          setUnidadesLista(unisMapeadas)
        }

        // 3. Catálogo de Renglones desde Supabase (/mantenimiento/renglon_trabajo_catalogo)
        const resReng = await apiGetDeduplicado('/mantenimiento/renglon_trabajo_catalogo?limite=300')
        const dataRengs = resReng?.data?.data || resReng?.data
        if (activo && Array.isArray(dataRengs) && dataRengs.length > 0) {
          const rengsMapeados = dataRengs.map((r: any, idx: number) => {
            const foundCap = r.capitulo_sabana || (Array.isArray(dataCaps) ? dataCaps.find((c: any) => c.id === r.capitulo_id || Number(c.numero_capitulo) === Number(r.capitulo_id)) : null)
            const capIdNum = foundCap ? (Number(foundCap.numero_capitulo) || Number(foundCap.id) || 1) : (typeof r.capitulo_id === 'number' ? r.capitulo_id : (idx % 9) + 1)
            const capNombreStr = foundCap?.nombre_capitulo 
              ? `Capítulo ${foundCap.numero_capitulo || capIdNum}: ${foundCap.nombre_capitulo}`
              : (r.capitulo_nombre || r.capituloNombre || `Capítulo ${r.capitulo_id || 1}`)

            return {
              id: r.id || `sab-db-${idx}`,
              capituloId: capIdNum,
              capituloNombre: capNombreStr,
              codigoDGC: r.codigo || r.codigoDGC || `R-${idx + 1}`,
              descripcion: r.descripcion || 'Sin descripción',
              unidad: r.unidad_id || r.unidad || 'm³',
              cantidadContratada: Number(r.cantidad_contractual || r.cantidadContratada || 0),
              cantidadAjustada: Number(r.cantidad_ajustada || r.cantidadAjustada || 0),
              costoUnitarioDirecto: Number(r.precio_unitario_directo || r.costoUnitarioDirecto || 0),
              cantidadEstePeriodo: Number(r.cantidad_este_periodo || r.cantidadEstePeriodo || 0),
              cantidadAcumuladaAnterior: Number(r.cantidad_ejecutada || r.cantidadAcumuladaAnterior || 0),
              tipoRenglon: r.tipo_renglon || r.tipoRenglon || 'Original',
              estadoEjecucion: r.estado_ejecucion || r.estadoEjecucion || 'En proceso',
            }
          })
          setRenglones(rengsMapeados)
        }
      } catch (err) {
        console.warn('Conexión Supabase activa para catálogos:', err)
      }
    }

    void cargarDesdeSupabase()
    return () => { activo = false }
  }, [])

  useEffect(() => {
    if (!proyecto?.id || esPlantillaVacia) return
    
    // Prevent fetching UUID endpoints with mock IDs that cause backend crashes (invalid input syntax for type uuid)
    const isMockId = proyecto.id === '1' || proyecto.id === 'p-1' || proyecto.id.startsWith('PROY')
    if (isMockId) return

    let activo = true
    apiGetDeduplicado(`/proyectos/${proyecto.id}/pendientes`)
      .then((res) => {
        if (!activo) return
        const lista = res?.data?.data || res?.data
        if (Array.isArray(lista)) {
          setTrabajosPendientes(lista)
        }
      })
      .catch((err) => {
        console.warn('No se pudieron cargar los pendientes reales:', err)
      })
    return () => { activo = false }
  }, [proyecto?.id, esPlantillaVacia])

  const formatearUnidadMedidaSymbol = (raw: string | undefined): string => {
    if (!raw) return 'm³'
    if (raw.length > 15 || raw.includes('-')) {
      const encontrada = unidadesLista.find((u) => u.id === raw)
      if (encontrada && encontrada.simbolo) return encontrada.simbolo
      return 'm³'
    }
    return raw
  }

  const [columnaOrden, setColumnaOrden] = useState<ColumnaOrdenable | null>(null)
  const [direccionOrden, setDireccionOrden] = useState<'asc' | 'desc'>('asc')

  const [filaEditandoId, setFilaEditandoId] = useState<string | null>(null)
  const [datosEditando, setDatosEditando] = useState<Partial<RenglonDetalladoSabana>>({})

  const [drawerModo, setDrawerModo] = useState<'crear' | 'ver' | null>(null)
  const [renglonSeleccionado, setRenglonSeleccionado] = useState<RenglonDetalladoSabana | null>(null)
  const [modalEliminarOpen, setModalEliminarOpen] = useState(false)
  const [renglonAEliminar, setRenglonAEliminar] = useState<RenglonDetalladoSabana | null>(null)

  // CAMPOS FORMULARIO CREAR DENSIDAD COMPACTA (PATRÓN USUARIOS)
  const [formCodigo, setFormCodigo] = useState('')
  const [formDescripcion, setFormDescripcion] = useState('')
  const [formUnidad, setFormUnidad] = useState('m³')
  const [formUnidadManual, setFormUnidadManual] = useState('')
  const [formCantContratada, setFormCantContratada] = useState('')
  const [formCantAjustada, setFormCantAjustada] = useState('')
  const [formCostoUnitario, setFormCostoUnitario] = useState('')
  const [formCapituloId, setFormCapituloId] = useState(1)
  const [formTipoRenglon, setFormTipoRenglon] = useState<'Original' | 'Aumento' | 'Nuevo'>('Original')
  const [formEstadoEjecucion, setFormEstadoEjecucion] = useState<'En proceso' | 'Completado' | 'No iniciado' | 'Con excedente'>('En proceso')

  // ESTADO DE ERRORES DE VALIDACIÓN PARA DIBUJAR BORDES ROJOS (PATRÓN USUARIOS)
  const [errorsForm, setErrorsForm] = useState<Record<string, boolean>>({})

  const fechaInicioRealProyecto = useMemo(() => {
    return (
      proyecto?.fecha_inicio_contractual ||
      proyecto?.fechaInicioContractual ||
      proyecto?.fecha_inicio ||
      proyecto?.fechaInicio ||
      proyecto?.detalle?.fecha_inicio_contractual ||
      ''
    )
  }, [proyecto])

  const fechaFinRealProyecto = useMemo(() => {
    return (
      fechaFinalizacionActualizada ||
      proyecto?.fecha_fin_contractual ||
      proyecto?.fechaFinContractual ||
      proyecto?.fechaFinContractualPlan ||
      proyecto?.fecha_fin_contractual_plan ||
      proyecto?.fecha_fin ||
      proyecto?.fechaFin ||
      proyecto?.detalle?.fecha_fin_contractual ||
      ''
    )
  }, [proyecto, fechaFinalizacionActualizada])

  const plazoRealProyecto = useMemo(() => {
    return (
      proyecto?.plazo ||
      proyecto?.plazoContractual ||
      proyecto?.plazo_ejecucion_dias ||
      proyecto?.plazo_ejecucion_original ||
      proyecto?.detalle?.plazo_ejecucion_original ||
      ''
    )
  }, [proyecto])

  const esBorrador = useMemo(() => {
    if (esPlantillaVacia) return true
    if (!proyecto?.estado) return false
    const est = typeof proyecto.estado === 'string' ? proyecto.estado.toLowerCase() : (proyecto.estado as any)?.codigo?.toLowerCase() || ''
    return est === 'borrador'
  }, [proyecto, esPlantillaVacia])

  const listaMesesDinamicos = useMemo(() => {
    if (esPlantillaVacia || (!fechaInicioRealProyecto && !plazoRealProyecto)) {
      return []
    }

    let duracionMeses = 0

    const parseFecha = (fechaStr: string) => {
      if (!fechaStr || typeof fechaStr !== 'string') return null
      if (fechaStr.includes('/')) {
        const [dd, mm, yyyy] = fechaStr.split('/')
        if (dd && mm && yyyy) return new Date(`${yyyy}-${mm}-${dd}T00:00:00`)
      }
      if (fechaStr.includes('-')) {
        const clean = fechaStr.split('T')[0]
        const parts = clean.split('-')
        if (parts.length === 3) {
          return new Date(`${parts[0]}-${parts[1]}-${parts[2]}T00:00:00`)
        }
      }
      return null
    }

    const fechaInicio = parseFecha(fechaInicioRealProyecto)
    const fechaFin = parseFecha(fechaFinRealProyecto)

    if (fechaInicio && fechaFin && !isNaN(fechaInicio.getTime()) && !isNaN(fechaFin.getTime())) {
      let months = (fechaFin.getFullYear() - fechaInicio.getFullYear()) * 12
      months -= fechaInicio.getMonth()
      months += fechaFin.getMonth()
      if (fechaFin.getDate() >= fechaInicio.getDate()) {
        months += 1
      }
      duracionMeses = Math.max(1, months)
    } else if (plazoRealProyecto) {
      if (typeof plazoRealProyecto === 'number') {
        duracionMeses = plazoRealProyecto > 60 ? Math.ceil(plazoRealProyecto / 30) : Math.max(1, Math.ceil(plazoRealProyecto / 30))
      } else {
        const match = String(plazoRealProyecto).match(/\d+/)
        if (match) {
          const val = parseInt(match[0], 10)
          duracionMeses = val > 60 ? Math.ceil(val / 30) : Math.max(1, Math.ceil(val / 30))
        }
      }
    }

    if (duracionMeses === 0) return []

    const meses = []
    const MESES_NOMBRES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    const tieneFechaInicio = fechaInicio && !isNaN(fechaInicio.getTime())

    for (let i = 0; i < Math.min(duracionMeses, 36); i++) {
      if (tieneFechaInicio) {
        const d = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth() + i, 1)
        const mesNom = MESES_NOMBRES[d.getMonth()]
        const anio = d.getFullYear()
        meses.push(`${mesNom} ${anio}`)
      } else {
        meses.push(`Mes ${i + 1}`)
      }
    }
    return meses
  }, [proyecto, fechaInicioRealProyecto, fechaFinRealProyecto, plazoRealProyecto, esPlantillaVacia, esBorrador])

  const handlePromoverTrabajoPendiente = (item: TrabajoPendienteBolsa) => {
    const descuentoAplicado = item.longitudBase * item.factorDescuento
    const cantidadNetaCalculada = Math.max(0, item.cantidadBruta - descuentoAplicado)

    // Buscar el renglón correspondiente en la Sábana
    const renglonDestino = renglones.find((r) => r.codigoDGC === item.codigoDGC)

    if (renglonDestino) {
      const ejecutadoAcumuladoActual = renglonDestino.cantidadAcumuladaAnterior + renglonDestino.cantidadEstePeriodo
      const nuevoTotalPostPromocion = ejecutadoAcumuladoActual + cantidadNetaCalculada
      const cupoDisponible = renglonDestino.cantidadAjustada - ejecutadoAcumuladoActual

      if (nuevoTotalPostPromocion > renglonDestino.cantidadAjustada) {
        showErrorToast(
          `Promoción bloqueada: La Cantidad Neta (${formatQuantity(cantidadNetaCalculada, item.unidad)} ${item.unidad}) supera el cupo contractual disponible (${formatQuantity(Math.max(0, cupoDisponible), item.unidad)} ${item.unidad}) para el renglón ${item.codigoDGC}. Requiere una orden de cambio o ampliación aprobada.`
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

    showSuccessToast(`Partida ${item.codigoDGC} promovida con éxito e integrada a 'Este Periodo' en la Sábana y Memoria Analítica`)
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
    setFormUnidad('m³')
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
            avancesMensuales: datosEditando.avancesMensuales ?? r.avancesMensuales,
          } as RenglonDetalladoSabana
        }
        return r
      })
    )
    setFilaEditandoId(null)
    setDatosEditando({})
    showSuccessToast('Cambios guardados directamente en la tabla')
  }

  const handleCancelarEdicionInline = () => {
    setFilaEditandoId(null)
    setDatosEditando({})
  }

  const handleAbrirEliminar = (r: RenglonDetalladoSabana) => {
    setRenglonAEliminar(r)
    setModalEliminarOpen(true)
  }

  // REQUERIMIENTO: VALIDACIÓN CON BORDES ROJOS Y INSTANCIA TOAST REAL DE TOAST.TSX (PATRÓN USUARIOS)
  const handleGuardarRenglonCrear = () => {
    const errs: Record<string, boolean> = {}

    if (!formCodigo.trim()) errs.codigo = true
    if (!formDescripcion.trim()) errs.descripcion = true
    if (!formCantContratada || Number(formCantContratada) <= 0) errs.cantContratada = true
    if (!formCostoUnitario || Number(formCostoUnitario) <= 0) errs.costoUnitario = true

    if (Object.keys(errs).length > 0) {
      setErrorsForm(errs)
      showErrorToast('Por favor complete todos los campos obligatorios (*)')
      return
    }

    const unidadFinal = formUnidad === 'otra' ? formUnidadManual.trim() || 'U' : formUnidad
    const capObj = CAPITULOS_LIBRO_AZUL.find((c) => c.id === formCapituloId)

    const nuevo: RenglonDetalladoSabana = {
      id: `sab-custom-${Date.now()}`,
      capituloId: formCapituloId,
      capituloNombre: capObj?.nombre || 'Capítulo I',
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
    showSuccessToast(`Se agregó el renglón ${formCodigo.trim()} exitosamente`)
    setDrawerModo(null)
  }

  const handleConfirmarEliminar = () => {
    if (renglonAEliminar) {
      setRenglones((prev) => prev.filter((r) => r.id !== renglonAEliminar.id))
      showSuccessToast(`Se eliminó el renglón ${renglonAEliminar.codigoDGC}`)
    }
    setModalEliminarOpen(false)
    setRenglonAEliminar(null)
  }

  // Handlers para Unidades de Medida CRUD
  const handleGuardarUnidad = () => {
    if (!unidadForm.simbolo.trim() || !unidadForm.nombre.trim()) {
      showErrorToast('Ingrese el símbolo y el nombre de la unidad')
      return
    }
    if (unidadForm.id) {
      setUnidadesLista((prev) =>
        prev.map((u) =>
          u.id === unidadForm.id
            ? { ...u, simbolo: unidadForm.simbolo.trim(), nombre: unidadForm.nombre.trim(), descripcion: unidadForm.descripcion.trim() }
            : u
        )
      )
      showSuccessToast(`Unidad ${unidadForm.simbolo} actualizada`)
    } else {
      const nueva = {
        id: `u-${Date.now()}`,
        simbolo: unidadForm.simbolo.trim(),
        nombre: unidadForm.nombre.trim(),
        descripcion: unidadForm.descripcion.trim(),
      }
      setUnidadesLista((prev) => [...prev, nueva])
      showSuccessToast(`Unidad ${unidadForm.simbolo} agregada`)
    }
    setModalUnidadFormOpen(false)
  }

  const handleConfirmarEliminarUnidad = () => {
    if (unidadAEliminar) {
      setUnidadesLista((prev) => prev.filter((u) => u.id !== unidadAEliminar.id))
      showSuccessToast(`Unidad ${unidadAEliminar.simbolo} eliminada`)
    }
    setUnidadAEliminar(null)
  }

  // Handlers para Capítulos Sábana CRUD
  const handleGuardarCapitulo = () => {
    if (!capituloForm.nombre.trim()) {
      showErrorToast('Ingrese el nombre del capítulo')
      return
    }
    if (capituloForm.id) {
      setCapitulosLista((prev) =>
        prev.map((c) => (c.id === capituloForm.id ? { ...c, nombre: capituloForm.nombre.trim() } : c))
      )
      showSuccessToast(`Capítulo actualizado`)
    } else {
      const nuevoId = Math.max(0, ...capitulosLista.map((c) => c.id)) + 1
      const nuevoCap = { id: nuevoId, nombre: capituloForm.nombre.trim() }
      setCapitulosLista((prev) => [...prev, nuevoCap])
      showSuccessToast(`Capítulo ${nuevoId} creado exitosamente`)
    }
    setModalCapituloFormOpen(false)
  }

  const handleConfirmarEliminarCapitulo = () => {
    if (capituloAEliminar) {
      setCapitulosLista((prev) => prev.filter((c) => c.id !== capituloAEliminar.id))
      showSuccessToast(`Capítulo eliminado`)
    }
    setCapituloAEliminar(null)
  }

  // Filtrado y Ordenamiento
  const renglonesFiltradosYOrdenados = useMemo(() => {
    let resultado = renglones.filter((r) => {
      const matchCap = capituloFiltro === 'todos' || (r as any).capituloId === capituloFiltro
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

  // Paginación
  const totalItems = renglonesFiltradosYOrdenados.length
  const totalPaginas = Math.ceil(totalItems / itemsPorPagina) || 1
  const inicioIndice = (paginaActual - 1) * itemsPorPagina
  const finIndice = Math.min(inicioIndice + itemsPorPagina, totalItems)
  const renglonesPaginados = useMemo(() => {
    return renglonesFiltradosYOrdenados.slice(inicioIndice, finIndice)
  }, [renglonesFiltradosYOrdenados, inicioIndice, finIndice])

  const capitulosUnicosPagina = useMemo(() => {
    const map = new Map<any, string>()
    renglonesPaginados.forEach((r, idx) => {
      const rawCapId = (r as any).capituloId || (r as any).capitulo_id
      let nombreCap = r.capituloNombre

      const isUuidName = typeof nombreCap === 'string' && (
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(nombreCap) ||
        /CAPÍTULO\s+[0-9a-f-]{25,}/i.test(nombreCap)
      )

      if (!nombreCap || isUuidName) {
        const numCode = parseInt((r as any).codigoDGC?.split('.')[0] || '1', 10)
        const capNum = !isNaN(numCode) && numCode >= 100 ? Math.floor(numCode / 100) : (typeof rawCapId === 'number' ? rawCapId : (idx % 9) + 1)
        const foundCap = CAPITULOS_LIBRO_AZUL.find((c: any) => c.id === capNum) ||
          capitulosLista.find((c: any) => c.id === rawCapId || (c as any).uuid === rawCapId)
        nombreCap = foundCap?.nombre || `Capítulo ${capNum}: Renglones de Obra`
      }
      map.set(rawCapId || `cap-${idx}`, nombreCap)
    })
    return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre }))
  }, [renglonesPaginados, capitulosLista])

  // Subtotales globales por capítulo
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

      if (!mapa[(r as any).capituloId]) {
        mapa[(r as any).capituloId] = {
          costoDirectoContratado: 0,
          costoDirectoAjustado: 0,
          costoDirectoEstePeriodo: 0,
          costoDirectoAcumuladoAnterior: 0,
          costoDirectoTotalFecha: 0,
          saldoPorEjecutar: 0,
        }
      }

      mapa[(r as any).capituloId].costoDirectoContratado += costoContratado
      mapa[(r as any).capituloId].costoDirectoAjustado += costoAjustado
      mapa[(r as any).capituloId].costoDirectoEstePeriodo += costoEstePeriodo
      mapa[(r as any).capituloId].costoDirectoAcumuladoAnterior += costoAcumAnterior
      mapa[(r as any).capituloId].costoDirectoTotalFecha += costoTotalFecha
      mapa[(r as any).capituloId].saldoPorEjecutar += saldo
    })

    return mapa
  }, [renglones])

  const handleGuardarNuevaEstimacion = () => {
    if (!formEstNumero.trim() || !formEstFechaInicio || !formEstFechaCorte) {
      showErrorToast('Por favor complete los campos obligatorios del periodo (*)')
      return
    }

    const nuevaEst = {
      id: `est-${Date.now()}`,
      numero: formEstNumero.trim(),
      mes: formEstMes.trim() || 'Periodo Nuevo',
      fechaInicio: formEstFechaInicio,
      fechaCorte: formEstFechaCorte,
      estado: 'actual' as const,
    }

    setListaEstimaciones((prev) => [...prev.map((e) => ({ ...e, estado: 'cerrada' as const })), nuevaEst])
    setNumEstimacionFiltro(nuevaEst.numero)
    setModalAperturaEstimacionOpen(false)
    showSuccessToast(`Se aperturó con éxito el periodo ${nuevaEst.numero} (${nuevaEst.fechaInicio} al ${nuevaEst.fechaCorte})`)
  }

  const handleGuardarNuevaMedicionAnalitica = async () => {
    const l = parseFloat(formMedLongitud) || 0
    const a = parseFloat(formMedAncho) || 0
    const h = parseFloat(formMedAltura) || 0
    const vol = Math.round(l * a * h * 100) / 100

    if (!formMedCodigoDGC || l <= 0) {
      showErrorToast('Ingrese un código de renglón válido y dimensiones positivas (*)')
      return
    }

    const nuevaMed: MedicionAnaliticaCampo = {
      id: `med-${Date.now()}`,
      codigoDGC: formMedCodigoDGC,
      estacionInicio: formMedEstacionInicio,
      estacionFin: formMedEstacionFin,
      longitudL: l,
      anchoA: a,
      alturaH: h,
      cantidadCalculada: vol,
      periodoEstimacion: numEstimacionFiltro === 'todos' ? 'Est. 08 (Actual)' : numEstimacionFiltro,
    }

    setMedicionesAnaliticas((prev) => [nuevaMed, ...prev])

    // Actualizar renglón en Sábana acumulando el volumen
    setRenglones((prev) =>
      prev.map((r) => {
        if (r.codigoDGC === formMedCodigoDGC) {
          return {
            ...r,
            cantidadEstePeriodo: (r.cantidadEstePeriodo || 0) + vol,
          }
        }
        return r
      })
    )

    try {
      await api.post('/mantenimiento/bitacora_avance', {
        codigo_renglon: formMedCodigoDGC,
        estacion_inicio: formMedEstacionInicio,
        estacion_fin: formMedEstacionFin,
        longitud_l: l,
        ancho_a: a,
        altura_h: h,
        cantidad_calculada: vol,
        periodo_estimacion: numEstimacionFiltro,
        proyecto_id: proyecto?.id,
      })
    } catch {
      // guardado local en fallback
    }

    setModalAgregarMedicionOpen(false)
    showSuccessToast(`Medición de ${vol.toLocaleString('es-GT')} m³ registrada y transmitida a Columna I (Este Periodo)`)
  }

  // CÁLCULOS FINANCIEROS GLOBALES
  const subtotalCostoDirectoContratadoGlobal = useMemo(() => {
    return renglones.reduce((sum, r) => sum + r.cantidadContratada * r.costoUnitarioDirecto, 0)
  }, [renglones])

  const subtotalCostoDirectoAjustadoGlobal = useMemo(() => {
    return renglones.reduce((sum, r) => sum + r.cantidadAjustada * r.costoUnitarioDirecto, 0)
  }, [renglones])

  // Extraer parámetros dinámicos del proyecto (parametro_proyecto) con fallbacks por defecto (45% indirectos, 12% IVA, 20% anticipo)
  const paramsProj = proyecto?.parametro_proyecto || proyecto?.parametroProyecto || proyecto?.parametro || {}
  const pctIndirectos = typeof paramsProj.porcentaje_indirectos === 'number'
    ? paramsProj.porcentaje_indirectos
    : (Number(paramsProj.porcentaje_indirectos) || 0.45)
  const pctIva = typeof paramsProj.porcentaje_iva === 'number'
    ? paramsProj.porcentaje_iva
    : (Number(paramsProj.porcentaje_iva) || 0.12)
  const pctAnticipo = typeof paramsProj.porcentaje_amortizacion_anticipo === 'number'
    ? paramsProj.porcentaje_amortizacion_anticipo
    : (Number(paramsProj.porcentaje_amortizacion_anticipo) || 0.20)

  // Monto Contractual Original = Costo Directo Total + Indirectos % + IVA %
  const indirectos45ContratadoGlobal = subtotalCostoDirectoContratadoGlobal * pctIndirectos
  const subtotalAntesIvaContratadoGlobal = subtotalCostoDirectoContratadoGlobal + indirectos45ContratadoGlobal
  const iva12ContratadoGlobal = subtotalAntesIvaContratadoGlobal * pctIva
  const montoContractualOriginalTotal = subtotalAntesIvaContratadoGlobal + iva12ContratadoGlobal

  const subtotalCostoDirectoGlobalPeriodo = useMemo(() => {
    return renglones.reduce((sum, r) => sum + r.cantidadEstePeriodo * r.costoUnitarioDirecto, 0)
  }, [renglones])

  const subtotalCostoDirectoAcumuladoAnteriorGlobal = useMemo(() => {
    return renglones.reduce((sum, r) => sum + (r.cantidadAcumuladaAnterior || 0) * r.costoUnitarioDirecto, 0)
  }, [renglones])

  const indirectos45Global = subtotalCostoDirectoGlobalPeriodo * pctIndirectos
  const subtotalAntesIvaGlobal = subtotalCostoDirectoGlobalPeriodo + indirectos45Global
  const iva12Global = subtotalAntesIvaGlobal * pctIva
  const valorTotalEstimacionBrutoGlobal = subtotalAntesIvaGlobal + iva12Global

  const valorTotalAcumuladoAnteriorBrutoGlobal = (subtotalCostoDirectoAcumuladoAnteriorGlobal * (1 + pctIndirectos)) * (1 + pctIva)

  const anticipoRecibido20 = (esPlantillaVacia || proyecto?.estado === 'borrador')
    ? 0
    : (Number(paramsProj.monto_anticipo_total || paramsProj.anticipo_total_recibido) || (montoContractualOriginalTotal * pctAnticipo))
  const amortizacionAnteriorAcumulada = (esPlantillaVacia || proyecto?.estado === 'borrador')
    ? 0
    : (proyecto?.amortizacionAnteriorAcumulada !== undefined && proyecto?.amortizacionAnteriorAcumulada !== null)
      ? Number(proyecto.amortizacionAnteriorAcumulada)
      : (proyecto?.amortizadoAnterior !== undefined && proyecto?.amortizadoAnterior !== null)
        ? Number(proyecto.amortizadoAnterior)
        : valorTotalAcumuladoAnteriorBrutoGlobal * pctAnticipo
  const amortizacionAnticipoEstePeriodo = valorTotalEstimacionBrutoGlobal * pctAnticipo
  const amortizacionTotalAcumulada = amortizacionAnteriorAcumulada + amortizacionAnticipoEstePeriodo
  const saldoAnticipoPorAmortizar = Math.max(0, anticipoRecibido20 - amortizacionTotalAcumulada)
  const liquidoAPagarNetoContratista = Math.max(0, valorTotalEstimacionBrutoGlobal - amortizacionAnticipoEstePeriodo)

  // Métricas dinámicas reales calculadas en base a los renglones y estado del proyecto
  const metricasHeaderContextuales = useMemo(() => {
    let plazoStr = '0 Meses (0 días)'
    const d1 = parseFechaRobust(fechaInicioRealProyecto)
    const d2 = parseFechaRobust(fechaFinRealProyecto)
    if (d1 && d2 && d2.getTime() >= d1.getTime()) {
      const dias = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / 86400000))
      const meses = Math.max(1, Math.round(dias / 30))
      plazoStr = `${meses} ${meses === 1 ? 'Mes' : 'Meses'} (${dias} días)`
    } else if (plazoRealProyecto) {
      plazoStr = typeof plazoRealProyecto === 'number' ? `${plazoRealProyecto} días` : String(plazoRealProyecto)
    }

    const montoOriginalBase = Number(proyecto?.montoContractualOriginal || proyecto?.presupuesto || proyecto?.monto_original || 0)
    const montoContractualCalc = montoContractualOriginalTotal > 0 ? montoContractualOriginalTotal : montoOriginalBase
    const costoDirectoCalc = subtotalCostoDirectoContratadoGlobal > 0
      ? subtotalCostoDirectoContratadoGlobal
      : (montoOriginalBase > 0 ? montoOriginalBase / ((1 + pctIndirectos) * (1 + pctIva)) : 0)

    return {
      nombre: `${proyecto?.nombre || proyecto?.nombre_proyecto || proyecto?.nombreOficial || 'Proyecto'} (${proyecto?.codigo || proyecto?.codigo_proyecto || 'PROY-001'})`,
      plazo: esPlantillaVacia && !plazoStr ? '0 Meses (0 días)' : plazoStr,
      costoDirecto: costoDirectoCalc,
      montoContractualOriginal: montoContractualCalc,
      liquidoNetoPeriodo: liquidoAPagarNetoContratista,
    }
  }, [proyecto, subtotalCostoDirectoContratadoGlobal, montoContractualOriginalTotal, liquidoAPagarNetoContratista, esPlantillaVacia, pctIndirectos, pctIva, fechaInicioRealProyecto, fechaFinRealProyecto, plazoRealProyecto])

  const diasEmpleadosCalculados = esBorrador ? 0 : Math.max(0, Math.floor((Date.now() - (fechaInicioRealProyecto ? new Date(fechaInicioRealProyecto).getTime() : Date.now())) / 86400000))
  const diasSuspendidosSumados = 0
  const fechaInicioContrato = proyecto?.fechaInicio || 'No registrada'

  const toggleCapitulo = (capId: number) => {
    setCapitulosColapsados((prev) => ({ ...prev, [capId]: !prev[capId] }))
  }

  const handleExportarExcel = () => {
    showSuccessToast('Descargando archivo Excel oficial "DÍAS" (.xlsx)...')
  }

  const handleGuardarModificarPlazo = async () => {
    const errs: Record<string, boolean> = {}
    if (!formNuevaFechaFin) errs.fechaFin = true
    if (!formDiasAdicionales || Number(formDiasAdicionales) <= 0) errs.dias = true

    if (Object.keys(errs).length > 0) {
      setErrorsPlazoForm(errs)
      showErrorToast('Por favor complete todos los campos obligatorios del plazo (*)')
      return
    }

    const [yyyy, mm, dd] = formNuevaFechaFin.split('-')
    const fechaFormateada = dd && mm && yyyy ? `${dd}/${mm}/${yyyy}` : formNuevaFechaFin
    setFechaFinalizacionActualizada(fechaFormateada)

    if (proyecto) {
      proyecto.fechaFin = formNuevaFechaFin
      proyecto.fechaFinContractualPlan = formNuevaFechaFin
    }

    if (proyecto?.id && typeof proyecto.id === 'string' && !proyecto.id.startsWith('sab-') && !proyecto.id.startsWith('proy-')) {
      try {
        await api.put(`/proyectos/${proyecto.id}`, {
          fechaFinContractualPlan: formNuevaFechaFin,
          observacionesPlazo: formObservacionesPlazo,
          motivoPlazo: formMotivoPlazo,
          diasAdicionalesPlazo: Number(formDiasAdicionales),
        })
      } catch (err) {
        console.warn('Persistencia de plazo:', err)
      }
    }

    setModalModificarPlazoOpen(false)
    setErrorsPlazoForm({})
    showSuccessToast(`Plazo modificado exitosamente. Nueva fecha de finalización: ${fechaFormateada} (+${formDiasAdicionales} días)`)
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
            
              </div>
            )}

            {/* Estado: Disponible únicamente en Sábana y Pendientes */}
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

            {/* Tipo: Disponible únicamente en Sábana y Pendientes */}
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

      {/* TAB 1: [SÁBANA] — TABLA CON FUENTE POPPINS, REGULAR SALVO CÓDIGO */}
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
            <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-270px)]">
              <table className="w-full text-[9.5px] leading-tight">
                <thead className="sticky top-0 z-20 bg-gray-50 shadow-2xs">
                  <tr className="border-b border-gray-300 bg-gray-50 text-gray-600 font-medium uppercase tracking-wider text-left text-[8.5px] whitespace-nowrap select-none">
                    <th
                      onClick={() => handleOrdenarPorColumna('codigoDGC')}
                      className="px-2 py-2 w-16 cursor-pointer hover:bg-gray-100/80 transition-colors font-medium text-gray-900"
                    >
                      <HeaderTooltip colKey="A">
                        <span>A. Código {renderIconoOrden('codigoDGC')}</span>
                      </HeaderTooltip>
                    </th>

                    <th
                      onClick={() => handleOrdenarPorColumna('descripcion')}
                      className="px-2.5 py-2 min-w-[180px] cursor-pointer hover:bg-gray-100/80 transition-colors font-medium"
                    >
                      <HeaderTooltip colKey="B">
                        <span>B. Descripción {renderIconoOrden('descripcion')}</span>
                      </HeaderTooltip>
                    </th>

                    <th
                      onClick={() => handleOrdenarPorColumna('unidad')}
                      className="px-1.5 py-2 text-center w-10 cursor-pointer hover:bg-gray-100/80 transition-colors font-medium"
                    >
                      <HeaderTooltip colKey="C">
                        <span>C. Unid {renderIconoOrden('unidad')}</span>
                      </HeaderTooltip>
                    </th>

                    <th
                      onClick={() => handleOrdenarPorColumna('cantidadContratada')}
                      className="px-2 py-2 text-right w-24 cursor-pointer hover:bg-gray-100/80 transition-colors font-medium"
                    >
                      <HeaderTooltip colKey="D">
                        <span>D. Cant. Contratada {renderIconoOrden('cantidadContratada')}</span>
                      </HeaderTooltip>
                    </th>

                    <th
                      onClick={() => handleOrdenarPorColumna('cantidadAjustada')}
                      className="px-2 py-2 text-right w-24 cursor-pointer hover:bg-gray-100/80 transition-colors font-medium text-gray-900"
                    >
                      <HeaderTooltip colKey="E">
                        <span>E. Cant. Ajustada {renderIconoOrden('cantidadAjustada')}</span>
                      </HeaderTooltip>
                    </th>

                    <th
                      onClick={() => handleOrdenarPorColumna('costoUnitarioDirecto')}
                      className="px-2 py-2 text-right w-22 cursor-pointer hover:bg-gray-100/80 transition-colors font-medium text-gray-900"
                    >
                      <HeaderTooltip colKey="F">
                        <span>F. Costo Unit. Directo {renderIconoOrden('costoUnitarioDirecto')}</span>
                      </HeaderTooltip>
                    </th>

                    <th className="px-2.5 py-2 text-right w-28 font-medium text-gray-900">
                      <HeaderTooltip colKey="G">
                        <span>G. Costo Total Directo (D×F)</span>
                      </HeaderTooltip>
                    </th>

                    <th className="px-2.5 py-2 text-right w-28 font-medium text-gray-900">
                      <HeaderTooltip colKey="H">
                        <span>H. Costo Total Ajustado (E×F)</span>
                      </HeaderTooltip>
                    </th>

                    <th
                      onClick={() => handleOrdenarPorColumna('cantidadEstePeriodo')}
                      className="px-2 py-2 text-right w-22 cursor-pointer hover:bg-gray-100/80 transition-colors font-medium text-[#9B0F06] text-[8.5px]"
                    >
                      <HeaderTooltip colKey="I">
                        <span>I. Este Periodo (Cant.) {renderIconoOrden('cantidadEstePeriodo')}</span>
                      </HeaderTooltip>
                    </th>

                    <th
                      onClick={() => handleOrdenarPorColumna('cantidadAcumuladaAnterior')}
                      className="px-2 py-2 text-right w-20 cursor-pointer hover:bg-gray-100/80 transition-colors font-medium"
                    >
                      <HeaderTooltip colKey="J">
                        <span>J. Acum. Anterior (Cant.) {renderIconoOrden('cantidadAcumuladaAnterior')}</span>
                      </HeaderTooltip>
                    </th>

                    <th
                      onClick={() => handleOrdenarPorColumna('totalAFecha')}
                      className="px-2 py-2 text-right w-22 cursor-pointer hover:bg-gray-100/80 transition-colors font-medium text-gray-900"
                    >
                      <HeaderTooltip colKey="K">
                        <span>K. Total a Fecha (Cant.) {renderIconoOrden('totalAFecha')}</span>
                      </HeaderTooltip>
                    </th>

                    <th
                      onClick={() => handleOrdenarPorColumna('avancePct')}
                      className="px-2 py-2 text-right w-16 cursor-pointer hover:bg-gray-100/80 transition-colors font-medium text-[#9B0F06]"
                    >
                      <HeaderTooltip colKey="L">
                        <span>L. % Avance (Cant.) {renderIconoOrden('avancePct')}</span>
                      </HeaderTooltip>
                    </th>

                    <th className="px-2.5 py-2 text-right w-24 font-medium text-gray-900">
                      <HeaderTooltip colKey="M">
                        <span>M. Este Periodo (Costo)</span>
                      </HeaderTooltip>
                    </th>

                    <th className="px-2.5 py-2 text-right w-24 font-medium text-gray-900">
                      <HeaderTooltip colKey="N">
                        <span>N. Acum. Anterior (Costo)</span>
                      </HeaderTooltip>
                    </th>

                    <th className="px-2.5 py-2 text-right w-24 font-medium text-gray-900">
                      <HeaderTooltip colKey="O">
                        <span>O. Total a Fecha (Costo)</span>
                      </HeaderTooltip>
                    </th>

                    <th className="px-2 py-2 text-right w-16 font-medium text-[#9B0F06]">
                      <HeaderTooltip colKey="P">
                        <span>P. % Avance (Costo)</span>
                      </HeaderTooltip>
                    </th>

                    <th
                      onClick={() => handleOrdenarPorColumna('saldoPorEjecutar')}
                      className="px-2.5 py-2 text-right w-28 cursor-pointer hover:bg-gray-100/80 transition-colors font-medium text-[#9B0F06]"
                    >
                      <HeaderTooltip colKey="Saldo">
                        <span>Saldo por Ejecutar (H−O) {renderIconoOrden('saldoPorEjecutar')}</span>
                      </HeaderTooltip>
                    </th>

                    {/* Columnas mensuales (Mes 1...Mes N) según toggle Planificación / Actual */}
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
                    const renglonesCap = renglonesPaginados.filter((r) => (r as any).capituloId === cap.id)
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
                                <span>•</span>
                                <span>Ajustado: Q {subtotalCap.costoDirectoAjustado.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                                <span>•</span>
                                <span>Periodo: Q {subtotalCap.costoDirectoEstePeriodo.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                                <span>•</span>
                                <span>Total Fecha: Q {subtotalCap.costoDirectoTotalFecha.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                                <span>•</span>
                                <span className="text-[#9B0F06] font-medium">Saldo: Q {subtotalCap.saldoPorEjecutar.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                              </div>
                            </div>
                          </td>
                        </tr>

                        {/* REQUERIMIENTO EDICIÓN INLINE:
                            - SIN fondo amarillo en la fila completa
                            - Highlight solo en campos editables con contorno gris oscuro
                            - Código (A) es editable (dropdown), Descripción y Unid se autocompletan de solo lectura */}
                        {!estaColapsado &&
                          renglonesCap.map((r) => {
                            const esEditando = filaEditandoId === r.id
                            const cantContratadaD = esEditando ? Number(datosEditando.cantidadContratada ?? r.cantidadContratada) : r.cantidadContratada
                            const cantAjustadaE = esEditando ? Number(datosEditando.cantidadAjustada ?? r.cantidadAjustada) : r.cantidadAjustada
                            const costoUnitF = esEditando ? Number(datosEditando.costoUnitarioDirecto ?? r.costoUnitarioDirecto) : r.costoUnitarioDirecto

                            const costoTotalDirectoG = Math.round(cantContratadaD * costoUnitF * 100) / 100
                            const costoTotalAjustadoH = Math.round(cantAjustadaE * costoUnitF * 100) / 100

                            const cantEstePeriodoI = r.cantidadEstePeriodo
                            const cantAcumAnteriorJ = esEditando ? Number(datosEditando.cantidadAcumuladaAnterior ?? r.cantidadAcumuladaAnterior) : r.cantidadAcumuladaAnterior
                            const cantTotalFechaK = cantEstePeriodoI + cantAcumAnteriorJ
                            const pctAvanceCantL = (!cantAjustadaE || cantAjustadaE <= 0 || isNaN(cantAjustadaE)) ? 0 : (cantTotalFechaK / cantAjustadaE) * 100

                            const costoEstePeriodoM = Math.round(cantEstePeriodoI * costoUnitF * 100) / 100
                            const costoAcumAnteriorN = Math.round(cantAcumAnteriorJ * costoUnitF * 100) / 100
                            const costoTotalFechaO = Math.round((costoEstePeriodoM + costoAcumAnteriorN) * 100) / 100
                            const pctAvanceCostoP = (!costoTotalAjustadoH || costoTotalAjustadoH <= 0 || isNaN(costoTotalAjustadoH)) ? 0 : (costoTotalFechaO / costoTotalAjustadoH) * 100

                            const saldoPorEjecutar = Math.max(0, costoTotalAjustadoH - costoTotalFechaO)

                            return (
                              <tr key={r.id} className="transition-colors border-b border-gray-100 hover:bg-gray-50/60 font-[Poppins]">
                                {/* A. Código */}
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

                                {/* B. Descripción */}
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
                                <td className="px-1.5 py-1.5 text-center font-semibold text-gray-700 font-mono">
                                  {esEditando ? (
                                    <div className="w-10 rounded border border-gray-300 bg-gray-100 px-0.5 py-0.5 font-mono text-[9px] text-gray-700 cursor-not-allowed mx-auto">
                                      {formatearUnidadMedidaSymbol(datosEditando.unidad ?? r.unidad)}
                                    </div>
                                  ) : (
                                    <span>{formatearUnidadMedidaSymbol(r.unidad)}</span>
                                  )}
                                </td>

                                {/* D. Cant. Contratada */}
                                <td className="px-2 py-1.5 text-right font-normal text-gray-600 font-mono">
                                  {esEditando ? (
                                    <input
                                      type="text"
                                      value={datosEditando.cantidadContratada ?? r.cantidadContratada}
                                      onKeyDown={handleKeyDownNumericOnly}
                                      onChange={(e) => {
                                        setDatosEditando((d) => ({ ...d, cantidadContratada: sanitizePositivo(e.target.value) }))
                                      }}
                                      className="w-18 rounded border-2 border-gray-700 bg-white px-1 py-0.5 text-right font-mono text-[9px] font-normal text-gray-900 focus:outline-none"
                                    />
                                  ) : (
                                    <span>{formatQuantity(r.cantidadContratada, r.unidad)}</span>
                                  )}
                                </td>

                                {/* E. Cant. Ajustada */}
                                <td className="px-2 py-1.5 text-right font-normal text-gray-800 font-mono">
                                  {esEditando ? (
                                    <input
                                      type="text"
                                      value={datosEditando.cantidadAjustada ?? r.cantidadAjustada}
                                      onKeyDown={handleKeyDownNumericOnly}
                                      onChange={(e) => {
                                        setDatosEditando((d) => ({ ...d, cantidadAjustada: sanitizePositivo(e.target.value) }))
                                      }}
                                      className="w-18 rounded border-2 border-gray-700 bg-white px-1 py-0.5 text-right font-mono text-[9px] font-normal text-gray-900 focus:outline-none"
                                    />
                                  ) : (
                                    <span>{formatQuantity(r.cantidadAjustada, r.unidad)}</span>
                                  )}
                                </td>

                                {/* F. Costo Unit. Directo */}
                                <td className="px-2 py-1.5 text-right font-normal text-gray-700 font-mono">
                                  {esEditando ? (
                                    <input
                                      type="text"
                                      value={datosEditando.costoUnitarioDirecto ?? r.costoUnitarioDirecto}
                                      onKeyDown={handleKeyDownNumericOnly}
                                      onChange={(e) => {
                                        setDatosEditando((d) => ({ ...d, costoUnitarioDirecto: sanitizePositivo(e.target.value) }))
                                      }}
                                      className="w-18 rounded border-2 border-gray-700 bg-white px-1 py-0.5 text-right font-mono text-[9px] font-normal text-gray-900 focus:outline-none"
                                    />
                                  ) : (
                                    <span>Q {r.costoUnitarioDirecto.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                                  )}
                                </td>

                                {/* G. Costo Total Directo = D × F */}
                                <td className="px-2.5 py-1.5 text-right font-normal text-gray-800 font-mono">
                                  Q {costoTotalDirectoG.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                                </td>

                                {/* H. Costo Total Ajustado = E × F */}
                                <td className="px-2.5 py-1.5 text-right font-normal text-gray-900 font-mono">
                                  Q {costoTotalAjustadoH.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                                </td>

                                {/* I. Este Periodo (Cant.): Enlace de SOLO LECTURA al tab Analítico */}
                                <td className="px-2 py-1.5 text-right font-normal font-mono text-[9.5px]">
                                  {cantEstePeriodoI > 0 ? (
                                    <button
                                      type="button"
                                      onClick={() => setTabSeccion('analitico')}
                                      className="text-blue-700 hover:underline hover:text-[#9B0F06] transition-colors cursor-pointer font-mono text-[9.5px]"
                                      title="Ver origen en Memoria de Cálculo Analítica"
                                    >
                                      {formatQuantity(cantEstePeriodoI, r.unidad)}
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setTabSeccion('analitico')}
                                      className="inline-flex items-center justify-end gap-1 text-gray-400 hover:text-[#9B0F06] transition-colors cursor-pointer font-mono text-[9px]"
                                      title="Valor calculated en tiempo real desde el Tab Analítico (sin registros)"
                                    >
                                      <span className="text-gray-500 font-mono">{formatQuantity(0, r.unidad)}</span>
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
                                      onKeyDown={handleKeyDownNumericOnly}
                                      onChange={(e) => {
                                        setDatosEditando((d) => ({ ...d, cantidadAcumuladaAnterior: sanitizePositivo(e.target.value) }))
                                      }}
                                      className="w-16 rounded border-2 border-gray-700 bg-white px-1 py-0.5 text-right font-mono text-[9px] font-normal text-gray-900 focus:outline-none"
                                    />
                                  ) : (
                                    <span>{formatQuantity(r.cantidadAcumuladaAnterior, r.unidad)}</span>
                                  )}
                                </td>

                                {/* K. Total a Fecha (Cant.) = I + J */}
                                <td className="px-2 py-1.5 text-right font-normal text-gray-900 font-mono">
                                  {formatQuantity(cantTotalFechaK, r.unidad)}
                                </td>

                                {/* L. % Avance (Cant.) = K / E */}
                                <td className="px-2 py-1.5 text-right font-normal text-[#9B0F06] font-mono">
                                  {pctAvanceCantL.toFixed(1)}%
                                </td>

                                {/* M. Este Periodo (Costo) = I × F */}
                                <td className="px-2.5 py-1.5 text-right font-normal text-gray-800 font-mono">
                                  Q {costoEstePeriodoM.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                                </td>

                                {/* N. Acum. Anterior (Costo) = J × F */}
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

                                {/* Columnas mensuales (Mes 1...Mes N) según toggle Planificación / Actual */}
                                {listaMesesDinamicos.map((mes, idx) => {
                                  let valMes = 0
                                  if (modoVistaSabana === 'planificacion') {
                                    valMes = r.cantidadAjustada > 0 ? r.cantidadAjustada / Math.max(1, listaMesesDinamicos.length) : 0
                                  } else {
                                    valMes = r.avancesMensuales?.[mes] || r.avancesMensuales?.[`Mes ${idx + 1}`] || 0
                                  }

                                  return (
                                    <td key={mes} className="px-2 py-1.5 text-right font-mono text-[8.5px] font-normal text-gray-600">
                                      {esEditando ? (
                                        <input
                                          type="text"
                                          value={datosEditando.avancesMensuales?.[mes] ?? (valMes > 0 ? valMes : '')}
                                          onKeyDown={handleKeyDownNumericOnly}
                                          onChange={(e) => {
                                            const numVal = sanitizePositivo(e.target.value)
                                            setDatosEditando((d) => ({
                                              ...d,
                                              avancesMensuales: {
                                                ...(d.avancesMensuales || r.avancesMensuales || {}),
                                                [mes]: numVal,
                                              },
                                            }))
                                          }}
                                          placeholder="0.00"
                                          className="w-16 rounded border-2 border-gray-700 bg-white px-1 py-0.5 text-right font-mono text-[9px] font-normal text-gray-900 focus:outline-none"
                                        />
                                      ) : (
                                        <span>{valMes > 0 ? formatQuantity(valMes, r.unidad) : 'Q.00'}</span>
                                      )}
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
                                        title="Cancelar edición"
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
                                        title="Eliminar renglón"
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

          {/* Paginación */}
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
                <option value={10}>10 / pág</option>
                <option value={12}>12 / pág</option>
                <option value={15}>15 / pág</option>
                <option value={25}>25 / pág</option>
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

      {/* TAB 2: [ANALÍTICO] */}
      {tabSeccion === 'analitico' && (
        <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-2xs space-y-3 font-[Poppins]">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <div className="flex items-center gap-2">
              <Calculator size={16} className="text-[#9B0F06]" />
              <div>
                <h3 className="text-xs font-bold text-gray-900">
                  Memoria de Cálculo (Bitácora de Mediciones Reales)
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setModalAgregarMedicionOpen(true)}
              className="rounded-lg bg-[#9B0F06] px-3 py-1.5 text-[10px] font-bold text-white hover:bg-[#5E0006] transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <Plus size={11} />
              <span>Registrar Nueva Medición</span>
            </button>
          </div>

          {Array.from(new Set(medicionesAnaliticas.map((m) => m.codigoDGC))).map((codDGC) => {
            const renglonMaestro = CATALOGO_COMPLETO_88.find((cat) => cat.codigoDGC === codDGC) || {
              codigoDGC: codDGC,
              descripcion: 'Renglón de obra vial',
              unidad: 'm³',
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
                      Unidad Catálogo: <strong className="text-gray-900 font-normal">{renglonMaestro.unidad}</strong> (Solo lectura)
                    </span>
                    <span className="rounded bg-gray-50 px-2 py-0.5 text-[8.5px] font-normal text-gray-700 border border-gray-200">
                      Alimenta Columna 'Este Periodo'
                    </span>
                  </div>
                </div>

                <table className="w-full text-left font-mono">
                  <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 text-[8.5px] font-normal">
                    <tr>
                      <th className="p-2">Estación Inicio</th>
                      <th className="p-2">Estación Fin</th>
                      <th className="p-2 text-right">Longitud L (m)</th>
                      <th className="p-2 text-right">Ancho A (m)</th>
                      <th className="p-2 text-right">Altura/Espesor H (m)</th>
                      <th className="p-2 text-right font-medium text-gray-900">Cantidad Calculada (L×A×H)</th>
                      <th className="p-2 text-center">Periodo / Estimación</th>
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
                            {formatQuantity(cantidadCalculada, renglonMaestro.unidad)} {renglonMaestro.unidad}
                          </td>
                          <td className="p-2 text-center text-gray-500 text-[8.5px]">
                            {m.mesPeriodo} — {m.numEstimacion}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>

                  <tfoot>
                    <tr className="bg-gray-100/90 font-normal text-gray-900 border-t border-gray-300">
                      <td colSpan={5} className="p-2 text-right uppercase tracking-wider text-[8.5px]">
                        TOTAL MES DEL RENGLÓN {codDGC} (TRANSMITE A SÁBANA 'ESTE PERIODO'):
                      </td>
                      <td className="p-2 text-right font-normal text-[#9B0F06] font-mono text-[10px]">
                        {formatQuantity(totalCantidadCalculadaRenglon, renglonMaestro.unidad)} {renglonMaestro.unidad}
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
                  Control de volúmenes en conciliación con cálculo de descuentos y promoción al Tab Analítico.
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
                  <th className="p-2 w-16">Código</th>
                  <th className="p-2 min-w-[140px]">Descripción / Partida</th>
                  <th className="p-2 text-center w-20">Estado</th>
                  <th className="p-2 text-left">Est. Inicio</th>
                  <th className="p-2 text-left">Est. Fin</th>
                  <th className="p-2 text-right">Long. L (m)</th>
                  <th className="p-2 text-right">Ancho A (m)</th>
                  <th className="p-2 text-right">Espesor H (m)</th>
                  <th className="p-2 text-right">Volumen Bruto</th>
                  <th className="p-2 text-right">Descuento Técnico</th>
                  <th className="p-2 text-right font-normal text-gray-900">Cant. Neta a Cobrar</th>
                  <th className="p-2 text-center w-20">Acción</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {trabajosPendientes
                  .filter((item) => {
                    const matchCap = capituloFiltro === 'todos'
                    const matchEst = estadoEjecucionFiltro === 'todos' || item.estado === estadoEjecucionFiltro
                    const matchBusq = busqueda === '' ||
                      (item.codigoDGC && item.codigoDGC.toLowerCase().includes(busqueda.toLowerCase())) ||
                      (item.descripcion && item.descripcion.toLowerCase().includes(busqueda.toLowerCase())) ||
                      (item.origenTrazabilidad && item.origenTrazabilidad.toLowerCase().includes(busqueda.toLowerCase())) ||
                      (item.ubicacionEspecifica && item.ubicacionEspecifica.toLowerCase().includes(busqueda.toLowerCase()))

                    return matchCap && matchEst && matchBusq
                  })
                  .map((item) => {
                    const l = item.longitudL ?? item.longitudBase ?? 0
                    const a = item.anchoA ?? 0
                    const h = item.alturaH ?? 0
                    const volBruto = item.volumenAreaBruto ?? item.cantidadBruta ?? (l * a * h)
                    const descMonto = item.descuentoMonto ?? (item.factorDescuento ? l * item.factorDescuento : 0)
                    const cantNeta = item.cantidadNetaCobrar ?? Math.max(0, volBruto - descMonto)
                    const esCriticoTresMeses = (item.mesesAntiguedad || 0) >= 3 && item.estado === 'Pendiente'

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50/80 bg-white transition-colors text-[9px]"
                      >
                        <td className="p-2 font-mono font-bold text-gray-900">{item.codigoDGC}</td>

                        <td className="p-2 font-sans font-normal text-gray-800">
                          <div>
                            <span>{item.descripcion}</span>
                            {item.ubicacionEspecifica && (
                              <div className="text-[8px] text-gray-500">{item.ubicacionEspecifica}</div>
                            )}
                            {esCriticoTresMeses && (
                              <div className="mt-0.5 inline-flex items-center gap-1 text-[8.5px] font-normal text-amber-700">
                                <AlertTriangle size={11} className="text-amber-600 shrink-0" />
                                <span>{item.mesesAntiguedad} meses sin procesar</span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="p-2 text-center">
                          {item.estado === 'Pendiente' && (
                            <span className="rounded bg-amber-50 text-amber-700 px-2 py-0.5 text-[8.5px] font-medium border border-amber-200">
                              Pendiente
                            </span>
                          )}
                          {item.estado === 'Aprobado' && (
                            <span className="rounded bg-blue-50 text-blue-700 px-2 py-0.5 text-[8.5px] font-medium border border-blue-200">
                              Aprobado
                            </span>
                          )}
                          {item.estado === 'Trasladado' && (
                            <span className="rounded bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[8.5px] font-medium border border-emerald-200 inline-flex items-center justify-center gap-0.5">
                              <Check size={10} /> Trasladado
                            </span>
                          )}
                        </td>

                        <td className="p-2 text-left font-mono text-gray-700">{item.estacionInicio || '-'}</td>
                        <td className="p-2 text-left font-mono text-gray-700">{item.estacionFin || '-'}</td>
                        <td className="p-2 text-right font-mono text-gray-700">{l.toFixed(2)}</td>
                        <td className="p-2 text-right font-mono text-gray-700">{a.toFixed(2)}</td>
                        <td className="p-2 text-right font-mono text-gray-700">{h.toFixed(2)}</td>

                        <td className="p-2 text-right font-mono text-gray-700 font-medium">
                          {formatQuantity(volBruto, item.unidad)} {item.unidad}
                        </td>

                        <td className="p-2 text-right font-mono text-gray-700">
                          {descMonto > 0 ? (
                            <span className="text-red-700 font-medium">
                              −{descMonto.toFixed(2)} {item.descuentoNombre ? `(${item.descuentoNombre})` : ''}
                            </span>
                          ) : (
                            <span className="text-gray-400">0.00</span>
                          )}
                        </td>

                        <td className="p-2 text-right font-bold text-gray-900 font-mono bg-gray-50/50">
                          {formatQuantity(cantNeta, item.unidad)} {item.unidad}
                        </td>

                        <td className="p-2 text-center">
                          {item.estado !== 'Trasladado' ? (
                            <button
                              type="button"
                              onClick={() => handlePromoverTrabajoPendiente(item)}
                              className="inline-flex items-center gap-1 rounded bg-[#9B0F06] px-2 py-1 text-[8.5px] font-normal text-white hover:bg-[#5E0006] transition-colors shadow-2xs cursor-pointer"
                              title="Promover a Trasladado e integrar con Tab Analítico"
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
                    Análisis de variaciones físicas y financieras según cronograma del programa de trabajo.
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
                    <th className="p-2 w-16">Código</th>
                    <th className="p-2 min-w-[180px]">Descripción</th>
                    <th className="p-2 text-right">Cant. Ajustada (Plan)</th>
                    <th className="p-2 text-right">Cant. Ejecutada (Real)</th>
                    <th className="p-2 text-right">% Planificado (Mes 6)</th>
                    <th className="p-2 text-right">% Real</th>
                    <th className="p-2 text-center w-28">Variación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pvrRenglonesPagina.map((r) => {
                    const ejecReal = r.cantidadEstePeriodo + r.cantidadAcumuladaAnterior
                    
                    // Cálculo dinámico de % Planificado a la fecha (hasta Mes 6)
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
                          {formatQuantity(r.cantidadAjustada, r.unidad)} {formatearUnidadMedidaSymbol(r.unidad)}
                        </td>
                        <td className="p-2 text-right font-mono text-gray-900 font-medium">
                          {formatQuantity(ejecReal, r.unidad)} {formatearUnidadMedidaSymbol(r.unidad)}
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

            {/* Paginación estandarizada DomunNet */}
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
                  <option value={10}>10 / pág</option>
                  <option value={15}>15 / pág</option>
                  <option value={25}>25 / pág</option>
                  <option value={50}>50 / pág</option>
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

      {/* TAB 5: [RESUMEN FINANCIERO - OFICIAL EXCEL/DGC] */}
      {tabSeccion === 'resumen' && (() => {
        const montoDisenoGlobal = Number(paramsProj.monto_estudio_ingenieria || paramsProj.montoEstudioIngenieria) || 0
        const montoTrabajosAdminGlobal = Number(paramsProj.monto_trabajos_administracion || paramsProj.montoTrabajosAdmin) || 0
        const precioTotalOfertaGlobal = montoContractualOriginalTotal + montoDisenoGlobal + montoTrabajosAdminGlobal

        const subtotalCostoDirectoTotalGlobal = subtotalCostoDirectoGlobalPeriodo + subtotalCostoDirectoAcumuladoAnteriorGlobal
        const indirectos45AcumuladoAnteriorGlobal = subtotalCostoDirectoAcumuladoAnteriorGlobal * pctIndirectos
        const indirectos45TotalGlobal = indirectos45Global + indirectos45AcumuladoAnteriorGlobal

        const subtotalAntesIvaAcumuladoAnteriorGlobal = subtotalCostoDirectoAcumuladoAnteriorGlobal + indirectos45AcumuladoAnteriorGlobal
        const subtotalAntesIvaTotalGlobal = subtotalAntesIvaGlobal + subtotalAntesIvaAcumuladoAnteriorGlobal

        const iva12AcumuladoAnteriorGlobal = subtotalAntesIvaAcumuladoAnteriorGlobal * pctIva
        const iva12TotalGlobal = iva12Global + iva12AcumuladoAnteriorGlobal

        const valorTotalAcumuladoTotalBrutoGlobal = valorTotalEstimacionBrutoGlobal + valorTotalAcumuladoAnteriorBrutoGlobal

        const disenoEstePeriodo = Number(paramsProj.diseno_este_periodo) || 0
        const disenoAcumuladoAnterior = Number(paramsProj.diseno_acumulado_anterior) || (montoDisenoGlobal > 0 ? montoDisenoGlobal : 0)
        const disenoTotal = disenoEstePeriodo + disenoAcumuladoAnterior

        const adminEstePeriodo = Number(paramsProj.admin_este_periodo) || 0
        const adminAcumuladoAnterior = Number(paramsProj.admin_acumulado_anterior) || 0
        const adminTotal = adminEstePeriodo + adminAcumuladoAnterior

        const valorTotalEstimacionSumaEstePeriodo = valorTotalEstimacionBrutoGlobal + disenoEstePeriodo + adminEstePeriodo
        const valorTotalEstimacionSumaAcumuladoAnterior = valorTotalAcumuladoAnteriorBrutoGlobal + disenoAcumuladoAnterior + adminAcumuladoAnterior
        const valorTotalEstimacionSumaAcumuladoTotal = valorTotalEstimacionSumaEstePeriodo + valorTotalEstimacionSumaAcumuladoAnterior

        const pctAvanceGeneralAcumulado = precioTotalOfertaGlobal > 0 ? ((valorTotalEstimacionSumaAcumuladoTotal / precioTotalOfertaGlobal) * 100) : 0

        const liquidoNetoAcumuladoAnterior = Math.max(0, valorTotalEstimacionSumaAcumuladoAnterior - amortizacionAnteriorAcumulada)
        const liquidoNetoTotal = liquidoAPagarNetoContratista + liquidoNetoAcumuladoAnterior

        return (
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs space-y-4 text-[10px] font-[Poppins]">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2.5">
              <div className="flex items-center gap-2">
                <Banknote size={18} className="text-[#9B0F06]" />
                <div>
                  <h3 className="text-xs font-bold text-gray-900 uppercase">
                    Resumen Financiero del Periodo y Estado de Cuenta Oficial
                  </h3>
                  <p className="text-[9.5px] text-gray-500 font-normal">
                    Consolidado de Oferta Inicial, Ejecución del Periodo y Control de Amortización de Anticipo (DGC).
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-red-50 border border-red-200 px-2.5 py-1 text-[9px] font-bold text-[#9B0F06]">
                  Avance Financiero Total: {pctAvanceGeneralAcumulado.toFixed(2)}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* TABLA IZQUIERDA: PRESUPUESTO BASE / PRECIO TOTAL DE LA OFERTA */}
              <div className="lg:col-span-5 rounded-lg border border-gray-300 bg-white shadow-xs overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="bg-gray-100 px-3 py-2 border-b border-gray-300 font-bold text-gray-800 text-[10px] uppercase text-center tracking-wider">
                    Presupuesto y Oferta Inicial del Contrato
                  </div>
                  <table className="w-full text-left text-[9.5px] border-collapse">
                    <tbody>
                      <tr className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="p-2 font-normal text-gray-700">COSTO DIRECTO TOTAL</td>
                        <td className="p-2 text-right font-mono font-medium text-gray-900 border-l border-gray-200 w-32">
                          Q {subtotalCostoDirectoContratadoGlobal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="p-2 font-normal text-gray-700">45 % INDIRECTOS (GASTOS ADMIN + UTILIDAD)</td>
                        <td className="p-2 text-right font-mono text-gray-800 border-l border-gray-200">
                          Q {indirectos45ContratadoGlobal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200 bg-gray-50/70 font-medium">
                        <td className="p-2 text-gray-900">SUB-TOTAL (COSTO DIRECTO + INDIRECTOS)</td>
                        <td className="p-2 text-right font-mono text-gray-900 border-l border-gray-200">
                          Q {subtotalAntesIvaContratadoGlobal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="p-2 font-normal text-gray-700">12 % IVA</td>
                        <td className="p-2 text-right font-mono text-gray-800 border-l border-gray-200">
                          Q {iva12ContratadoGlobal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200 bg-gray-50/70 font-medium">
                        <td className="p-2 text-gray-900">SUB-TOTAL (COSTO DIRECTO + INDIRECTOS + IVA)</td>
                        <td className="p-2 text-right font-mono text-gray-900 border-l border-gray-200">
                          Q {montoContractualOriginalTotal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="p-2 font-normal text-gray-700">Estudio de Ingeniería de Detalle (diseño)</td>
                        <td className="p-2 text-right font-mono text-gray-800 border-l border-gray-200">
                          Q {montoDisenoGlobal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-300 hover:bg-gray-50">
                        <td className="p-2 font-normal text-gray-700">RENGLÓN 110.11 Trabajos por Administración</td>
                        <td className="p-2 text-right font-mono text-gray-800 border-l border-gray-200">
                          Q {montoTrabajosAdminGlobal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                      <tr className="bg-red-50/90 font-bold border-t-2 border-[#9B0F06]">
                        <td className="p-2 text-[#9B0F06] uppercase">PRECIO TOTAL DE LA OFERTA</td>
                        <td className="p-2 text-right font-mono text-[#9B0F06] text-[10.5px] border-l border-red-200">
                          Q {precioTotalOfertaGlobal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-gray-50 p-2.5 border-t border-gray-200 text-[9px] text-gray-500 font-normal leading-tight">
                  * Valores base contractuales originales del proyecto antes de órdenes de cambio o acuerdos suplementarios.
                </div>
              </div>

              {/* TABLA DERECHA: DESGLOSE DE ESTIMACIÓN Y AMORTIZACIÓN (3 COLUMNAS) */}
              <div className="lg:col-span-7 rounded-lg border border-gray-300 bg-white shadow-xs overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="bg-gray-100 px-3 py-2 border-b border-gray-300 font-bold text-gray-800 text-[10px] uppercase text-center tracking-wider">
                    Estado de Estimación y Amortización de Anticipo
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[9.5px] border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-300 font-bold text-gray-700 text-[8.5px] uppercase">
                          <th className="p-2 border-r border-gray-200">CONCEPTO FINANCIERO</th>
                          <th className="p-2 text-right border-r border-gray-200 w-28">ESTA ESTIMACIÓN</th>
                          <th className="p-2 text-right border-r border-gray-200 w-28">ACUMULADO ANTERIOR</th>
                          <th className="p-2 text-right w-28">ACUMULADO TOTAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="p-2 font-normal text-gray-800 border-r border-gray-200">VALOR DE ESTA ESTIMACIÓN</td>
                          <td className="p-2 text-right font-mono text-gray-900 border-r border-gray-200">Q {subtotalCostoDirectoGlobalPeriodo.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                          <td className="p-2 text-right font-mono text-gray-800 border-r border-gray-200">Q {subtotalCostoDirectoAcumuladoAnteriorGlobal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                          <td className="p-2 text-right font-mono font-medium text-gray-900">Q {subtotalCostoDirectoTotalGlobal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                        </tr>
                        <tr className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="p-2 font-normal text-gray-800 border-r border-gray-200">45% INDIRECTOS (GASTOS ADMIN + UTILIDAD)</td>
                          <td className="p-2 text-right font-mono text-gray-800 border-r border-gray-200">Q {indirectos45Global.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                          <td className="p-2 text-right font-mono text-gray-800 border-r border-gray-200">Q {indirectos45AcumuladoAnteriorGlobal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                          <td className="p-2 text-right font-mono text-gray-900">Q {indirectos45TotalGlobal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                        </tr>
                        <tr className="border-b border-gray-200 bg-gray-50/70 font-medium">
                          <td className="p-2 text-gray-900 border-r border-gray-200">SUBTOTAL (COSTO DIRECTO + 45% INDIRECTOS)</td>
                          <td className="p-2 text-right font-mono text-gray-900 border-r border-gray-200">Q {subtotalAntesIvaGlobal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                          <td className="p-2 text-right font-mono text-gray-900 border-r border-gray-200">Q {subtotalAntesIvaAcumuladoAnteriorGlobal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                          <td className="p-2 text-right font-mono text-gray-900">Q {subtotalAntesIvaTotalGlobal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                        </tr>
                        <tr className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="p-2 font-normal text-gray-800 border-r border-gray-200">IVA (12%)</td>
                          <td className="p-2 text-right font-mono text-gray-800 border-r border-gray-200">Q {iva12Global.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                          <td className="p-2 text-right font-mono text-gray-800 border-r border-gray-200">Q {iva12AcumuladoAnteriorGlobal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                          <td className="p-2 text-right font-mono text-gray-900">Q {iva12TotalGlobal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                        </tr>
                        <tr className="border-b border-gray-200 bg-gray-50/70 font-medium">
                          <td className="p-2 text-gray-900 border-r border-gray-200">VALOR ESTA ESTIMACIÓN + 45% INDIRECTOS + IVA</td>
                          <td className="p-2 text-right font-mono text-gray-900 border-r border-gray-200">Q {valorTotalEstimacionBrutoGlobal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                          <td className="p-2 text-right font-mono text-gray-900 border-r border-gray-200">Q {valorTotalAcumuladoAnteriorBrutoGlobal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                          <td className="p-2 text-right font-mono text-gray-900">Q {valorTotalAcumuladoTotalBrutoGlobal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                        </tr>
                        <tr className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="p-2 font-normal text-gray-800 border-r border-gray-200">RENGLÓN 110.11 Trabajos por Administración</td>
                          <td className="p-2 text-right font-mono text-gray-800 border-r border-gray-200">Q {adminEstePeriodo.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                          <td className="p-2 text-right font-mono text-gray-800 border-r border-gray-200">Q {adminAcumuladoAnterior.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                          <td className="p-2 text-right font-mono text-gray-900">Q {adminTotal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                        </tr>
                        <tr className="border-b border-gray-300 hover:bg-gray-50">
                          <td className="p-2 font-normal text-gray-800 border-r border-gray-200">Estudio de Ingeniería de Detalle (diseño)</td>
                          <td className="p-2 text-right font-mono text-gray-800 border-r border-gray-200">Q {disenoEstePeriodo.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                          <td className="p-2 text-right font-mono text-gray-800 border-r border-gray-200">Q {disenoAcumuladoAnterior.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                          <td className="p-2 text-right font-mono text-gray-900">Q {disenoTotal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                        </tr>
                        <tr className="bg-amber-50/80 font-bold border-t border-b border-amber-200">
                          <td className="p-2 text-amber-950 border-r border-amber-200 flex items-center justify-between">
                            <span>VALOR TOTAL DE LA ESTIMACIÓN</span>
                          </td>
                          <td className="p-2 text-right font-mono text-amber-950 border-r border-amber-200">Q {valorTotalEstimacionSumaEstePeriodo.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                          <td className="p-2 text-right font-mono text-amber-950 border-r border-amber-200">Q {valorTotalEstimacionSumaAcumuladoAnterior.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                          <td className="p-2 text-right font-mono text-amber-950 font-bold flex items-center justify-end gap-1.5">
                            <span>Q {valorTotalEstimacionSumaAcumuladoTotal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                            <span className="text-[8.5px] bg-amber-200 text-amber-900 px-1 py-0.5 rounded">{pctAvanceGeneralAcumulado.toFixed(2)}%</span>
                          </td>
                        </tr>
                        <tr className="border-b border-gray-200 hover:bg-gray-50 font-normal">
                          <td className="p-2 text-gray-700 border-r border-gray-200 font-sans">(-) ANTICIPO AMORTIZADO 20%</td>
                          <td className="p-2 text-right font-mono text-emerald-800 border-r border-gray-200">Q {amortizacionAnticipoEstePeriodo.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                          <td className="p-2 text-right font-mono text-emerald-800 border-r border-gray-200">Q {amortizacionAnteriorAcumulada.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                          <td className="p-2 text-right font-mono text-emerald-900 font-medium">Q {amortizacionTotalAcumulada.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                        </tr>
                        <tr className="bg-red-50/90 font-bold border-t-2 border-[#9B0F06]">
                          <td className="p-2 text-[#9B0F06] uppercase border-r border-red-200">TOTAL A FAVOR DEL CONTRATISTA</td>
                          <td className="p-2 text-right font-mono text-[#9B0F06] text-[10px] border-r border-red-200">Q {liquidoAPagarNetoContratista.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                          <td className="p-2 text-right font-mono text-red-900 text-[10px] border-r border-red-200">Q {liquidoNetoAcumuladoAnterior.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                          <td className="p-2 text-right font-mono text-[#9B0F06] text-[10.5px]">Q {liquidoNetoTotal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-gray-50 p-2.5 border-t border-gray-200 flex items-center justify-between text-[9px] text-gray-500 font-normal">
                  <span>* Amortización contractual del 20% deducida directamente en cada Estimación Mensual.</span>
                  <span className="font-mono text-gray-700 font-medium">Saldo por Amortizar: Q {saldoAnticipoPorAmortizar.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* REQUERIMIENTO: PANEL "DETALLE DEL RENGLÓN" (BOTÓN VER / OJO)
          - ALINEADO AL PATRÓN DE USUARIOS (TARJETAS BG-GRAY-50/BORDER-GRAY-200)
          - DENSIDAD COMPACTA Y FUENTE POPPINS SIN NEAGRILLA EN VALORES
          - MOSTRAR TODAS LAS COLUMNAS DEL MOTOR FINANCIERO A-P CON VALORES EXACTOS EN GRID 2 COLUMNAS POR BLOQUES:
            Identificación -> Cantidades y Avance -> Financiero -> Desglose Mensual
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
                    DETALLE DEL RENGLÓN [{renglonSeleccionado.codigoDGC}]
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
              {/* BLOQUE 1: Identificación */}
              <div>
                <p className="text-[8px] text-gray-400 uppercase tracking-widest font-medium mb-1.5 border-b border-gray-100 pb-1">
                  Identificación del Renglón
                </p>

                <div className="space-y-1.5">
                  <div className="rounded-lg bg-gray-50 p-2 border border-gray-200">
                    <span className="text-[7.5px] font-medium text-gray-600 block">Código DGC (A)</span>
                    <p className="font-mono text-[10px] font-bold text-gray-900 mt-0.5">{renglonSeleccionado.codigoDGC}</p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-2 border border-gray-200">
                    <span className="text-[7.5px] font-medium text-gray-600 block">Descripción Completa (B)</span>
                    <p className="font-normal text-gray-800 leading-tight mt-0.5">{renglonSeleccionado.descripcion}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="rounded-lg bg-gray-50 p-2 border border-gray-200">
                      <span className="text-[7.5px] font-medium text-gray-600 block">Unidad de Medida (C)</span>
                      <p className="font-normal text-gray-800">{renglonSeleccionado.unidad}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-2 border border-gray-200">
                      <span className="text-[7.5px] font-medium text-gray-600 block">Tipo Renglón</span>
                      <p className="font-normal text-gray-800">{renglonSeleccionado.tipoRenglon || 'Original'}</p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-2 border border-gray-200">
                    <span className="text-[7.5px] font-medium text-gray-600 block">Capítulo Pertenece</span>
                    <p className="font-normal text-[#9B0F06] leading-tight">{renglonSeleccionado.capituloNombre}</p>
                  </div>
                </div>
              </div>

              {/* BLOQUE 2: Cantidades y Avance (D-L) */}
              <div>
                <p className="text-[8px] text-gray-400 uppercase tracking-widest font-medium mb-1.5 border-b border-gray-100 pb-1">
                  Cantidades y Avance Físico (D-L)
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
                      <span className="text-[7.5px] font-medium text-gray-600 block">Costo Directo Renglón (G=D×F)</span>
                      <p className="font-mono font-normal text-gray-900">Q {(renglonSeleccionado.cantidadContratada * renglonSeleccionado.costoUnitarioDirecto).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-2 border border-gray-200">
                      <span className="text-[7.5px] font-medium text-gray-600 block">Costo Directo Ajustado (H=E×F)</span>
                      <p className="font-mono font-normal text-gray-900">
                        Q {(renglonSeleccionado.cantidadAjustada * renglonSeleccionado.costoUnitarioDirecto).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="rounded-lg bg-gray-50 p-2 border border-gray-200">
                      <span className="text-[7.5px] font-medium text-gray-600 block">Este Periodo Costo (M=I×F)</span>
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
                    <span className="text-[7.5px] font-medium text-[#9B0F06] block">Saldo por Ejecutar (H−O)</span>
                    <p className="font-mono font-normal text-[#9B0F06] text-[10px]">
                      Q {(Math.max(0, (renglonSeleccionado.cantidadAjustada - (renglonSeleccionado.cantidadEstePeriodo + renglonSeleccionado.cantidadAcumuladaAnterior)) * renglonSeleccionado.costoUnitarioDirecto)).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>

              {/* BLOQUE 4: Desglose Mensual Dinámico */}
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
                              {cantMes > 0 ? `${cantMes.toLocaleString('es-GT', { minimumFractionDigits: 1 })} ${renglonSeleccionado.unidad}` : '—'}
                            </td>
                            <td className="p-1.5 text-right font-normal">
                              {montoMes > 0 ? `Q ${montoMes.toLocaleString('es-GT', { minimumFractionDigits: 2 })}` : '—'}
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

      {/* REQUERIMIENTO FORMULARIO "AGREGAR NUEVO RENGLÓN":
          - ALINEADO EXACTAMENTE AL PATRÓN DE USUARIOS (CREAR/EDITAR USUARIO)
          - FUENTE POPPINS, DENSIDAD COMPACTA
          - LABELS EN BOLD CON ASTERISCO ROJO (*), VALORES SIN BOLD
          - CAMPOS NUMÉRICOS SOLO DÍGITOS
          - BORDES ROJOS Y INSTANCIA REAL TOAST SI FALLA VALIDACIÓN
          - BOTONES ABAJO A LA DERECHA
      */}
      {drawerModo === 'crear' && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs font-[Poppins]">
          <div className="h-full w-full max-w-sm bg-white shadow-2xl flex flex-col justify-between border-l border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-200 p-2.5 bg-gray-50">
              <div className="flex items-center gap-1.5">
                <Plus size={15} className="text-[#9B0F06]" />
                <div>
                  <h3 className="text-[11px] font-bold uppercase text-gray-900">Agregar Nuevo Renglón</h3>
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
              {/* Bloque Identificación */}
              <div>
                <p className="text-[8.5px] text-gray-400 uppercase tracking-widest font-semibold mb-2 border-b border-gray-100 pb-1">
                  1. Identificación y Descripción
                </p>

                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-700 mb-0.5 block">
                      Código DGC <span className="text-[#FF4D4F]">*</span>
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
                      Descripción del Renglón <span className="text-[#FF4D4F]">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={formDescripcion}
                      onChange={(e) => {
                        setFormDescripcion(e.target.value)
                        if (errorsForm.descripcion) setErrorsForm({ ...errorsForm, descripcion: false })
                      }}
                      placeholder="Ej: Pavimento de concreto hidráulico MR=45 e=20cm"
                      className={`w-full border rounded-lg px-2.5 py-1.5 text-[10px] font-normal text-gray-700 focus:outline-none transition-colors ${
                        errorsForm.descripcion ? 'border-[#FF4D4F] bg-red-50/20' : 'border-gray-200 focus:border-[#9B0F06]'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Bloque Clasificación */}
              <div>
                <p className="text-[8.5px] text-gray-400 uppercase tracking-widest font-semibold mb-2 border-b border-gray-100 pb-1">
                  2. Clasificación y Capítulo
                </p>

                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-700 mb-0.5 block">
                      Capítulo del Libro Azul <span className="text-[#FF4D4F]">*</span>
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
                        <option value="m²">m²</option>
                        <option value="m³">m³</option>
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

              {/* Bloque Valores Numéricos */}
              <div>
                <p className="text-[8.5px] text-gray-400 uppercase tracking-widest font-semibold mb-2 border-b border-gray-100 pb-1">
                  3. Valores Numéricos y Costos
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

            {/* Footer Botones Abajo a la Derecha (Patrón Usuarios) */}
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
                <span>Guardar Renglón</span>
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
                  <h3 className="text-xs font-bold uppercase text-gray-900">Modificar Plazo de Ejecución</h3>
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
                  Nueva Fecha de Finalización <span className="text-[#FF4D4F]">*</span>
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
                  Motivo de Modificación <span className="text-[#FF4D4F]">*</span>
                </label>
                <select
                  value={formMotivoPlazo}
                  onChange={(e) => setFormMotivoPlazo(e.target.value as any)}
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[10px] font-normal text-gray-800 bg-white focus:outline-none focus:border-[#9B0F06]"
                >
                  <option value="ampliacion">Ampliación de plazo contractual</option>
                  <option value="retraso">Retraso por caso fortuito / clima</option>
                  <option value="orden_cambio">Orden de cambio / Obra extra</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-gray-700 mb-0.5 block">
                  Días de Suspensión / Ampliación <span className="text-[#FF4D4F]">*</span>
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

      {/* MODAL DE CONFIRMACIÓN PARA ELIMINAR */}
      {modalEliminarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs font-[Poppins]">
          <div className="w-full max-w-sm rounded-xl bg-white p-4 shadow-2xl space-y-3 border border-gray-200">
            <div className="flex items-center gap-2.5 text-red-700">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                <Trash2 size={16} />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-900">¿Eliminar Renglón?</h3>
                <p className="text-[10px] text-gray-500 font-normal">Esta acción no se puede deshacer.</p>
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
      {/* MODAL PRINCIPAL: GESTIÓN DE RENGLONES, UNIDADES DE MEDIDA Y CAPÍTULOS SÁBANA */}
      {modalGestionRenglonesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs font-[Poppins]">
          <div className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header del Modal */}
            <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-[#9B0F06] px-5 py-3 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white">
                  <Layers size={18} />
                </div>
                <div>
                  <h2 className="text-xs font-bold tracking-wide">Gestión del Catálogo de Renglones y Estructura Sábana</h2>
                  <p className="text-[10px] text-gray-300 font-normal">Administración centralizada de renglones, unidades de medida y capítulos del Libro Azul</p>
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

            {/* Navegación por Pestañas del Modal */}
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
                  <span>Renglones ({renglones.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSubTabGestion('unidades')}
                  className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-[11px] font-semibold transition-colors cursor-pointer ${
                    subTabGestion === 'unidades'
                      ? 'border-[#9B0F06] text-[#9B0F06] bg-white rounded-t-lg'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <Calculator size={13} />
                  <span>Unidades de Medida ({unidadesLista.length})</span>
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
                  <span>Capítulos Sábana ({capitulosLista.length})</span>
                </button>
              </div>

              {/* Botones de Acción Crear según Tab */}
              <div className="pb-1.5">
                {subTabGestion === 'renglones' && (
                  <button
                    type="button"
                    onClick={() => {
                      setModalGestionRenglonesOpen(false)
                      handleAbrirCrear()
                    }}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#9B0F06] px-3 py-1.5 text-[10px] font-medium text-white hover:bg-[#5E0006] transition-colors cursor-pointer shadow-2xs"
                  >
                    <Plus size={12} />
                    <span>Nuevo Renglón</span>
                  </button>
                )}
                {subTabGestion === 'unidades' && (
                  <button
                    type="button"
                    onClick={() => {
                      setUnidadForm({ simbolo: '', nombre: '', descripcion: '' })
                      setModalUnidadFormOpen(true)
                    }}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#9B0F06] px-3 py-1.5 text-[10px] font-medium text-white hover:bg-[#5E0006] transition-colors cursor-pointer shadow-2xs"
                  >
                    <Plus size={12} />
                    <span>Nueva Unidad de Medida</span>
                  </button>
                )}
                {subTabGestion === 'capitulos' && (
                  <button
                    type="button"
                    onClick={() => {
                      setCapituloForm({ nombre: '' })
                      setModalCapituloFormOpen(true)
                    }}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#9B0F06] px-3 py-1.5 text-[10px] font-medium text-white hover:bg-[#5E0006] transition-colors cursor-pointer shadow-2xs"
                  >
                    <Plus size={12} />
                    <span>Nuevo Capítulo</span>
                  </button>
                )}
              </div>
            </div>

            {/* Contenido Dinámico por Pestaña */}
            <div className="p-4 overflow-y-auto flex-1 bg-gray-50/50">
              {/* PESTAÑA 1: RENGLONES */}
              {subTabGestion === 'renglones' && (
                <div className="space-y-3 font-[Poppins]">
                  <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto max-h-[55vh]">
                      <table className="w-full text-left text-[11px] border-collapse">
                        <thead className="sticky top-0 z-10 bg-gray-100 text-gray-700 font-semibold uppercase text-[9px] tracking-wider border-b border-gray-200">
                          <tr>
                            <th className="px-3 py-2">Código DGC</th>
                            <th className="px-3 py-2">Descripción del Renglón</th>
                            <th className="px-3 py-2">Capítulo</th>
                            <th className="px-3 py-2 text-center">Unidad</th>
                            <th className="px-3 py-2 text-right">Costo Unit. (Q)</th>
                            <th className="px-3 py-2 text-center">Estado</th>
                            <th className="px-3 py-2 text-center">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 text-gray-700">
                          {renglones.map((r) => (
                            <tr key={r.id} className="hover:bg-gray-50/80 transition-colors">
                              <td className="px-3 py-2 font-mono text-gray-800">{r.codigoDGC}</td>
                              <td className="px-3 py-2 text-gray-800 max-w-xs truncate" title={r.descripcion}>
                                {r.descripcion}
                              </td>
                              <td className="px-3 py-2 text-gray-600 truncate max-w-[180px]">{r.capituloNombre}</td>
                              <td className="px-3 py-2 text-center text-gray-700 font-mono">
                                {r.unidad}
                              </td>
                              <td className="px-3 py-2 text-right font-mono text-gray-800">
                                Q {r.costoUnitarioDirecto.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-3 py-2 text-center text-gray-700 text-[10px]">
                                {r.estadoEjecucion}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setModalGestionRenglonesOpen(false)
                                      handleAbrirVer(r)
                                    }}
                                    className="p-1 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded transition-colors"
                                    title="Ver detalle"
                                  >
                                    <Eye size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAbrirEliminar(r)}
                                    className="p-1 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded transition-colors"
                                    title="Eliminar renglón"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* PESTAÑA 2: UNIDADES DE MEDIDA */}
              {subTabGestion === 'unidades' && (
                <div className="space-y-3 font-[Poppins]">
                  <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto max-h-[55vh]">
                      <table className="w-full text-left text-[11px] border-collapse">
                        <thead className="sticky top-0 z-10 bg-gray-100 text-gray-700 font-semibold uppercase text-[9px] tracking-wider border-b border-gray-200">
                          <tr>
                            <th className="px-3 py-2 text-center">Símbolo</th>
                            <th className="px-3 py-2">Nombre Completo</th>
                            <th className="px-3 py-2">Descripción de Aplicación</th>
                            <th className="px-3 py-2 text-center">Renglones Asociados</th>
                            <th className="px-3 py-2 text-center">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 text-gray-700">
                          {unidadesLista.map((u) => {
                            const cantidadRenglonesUso = renglones.filter((r) => r.unidad.toLowerCase() === u.simbolo.toLowerCase()).length
                            return (
                              <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                                <td className="px-3 py-2 text-center font-mono text-gray-800">
                                  {u.simbolo}
                                </td>
                                <td className="px-3 py-2 text-gray-800">{u.nombre}</td>
                                <td className="px-3 py-2 text-gray-600 text-[10.5px]">{u.descripcion || 'Sin descripción'}</td>
                                <td className="px-3 py-2 text-center text-gray-600">
                                  {cantidadRenglonesUso} renglones
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setUnidadForm({ id: u.id, simbolo: u.simbolo, nombre: u.nombre, descripcion: u.descripcion })
                                        setModalUnidadFormOpen(true)
                                      }}
                                      className="p-1 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded transition-colors"
                                      title="Editar unidad"
                                    >
                                      <Edit2 size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setUnidadAEliminar({ id: u.id, simbolo: u.simbolo })}
                                      className="p-1 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded transition-colors"
                                      title="Eliminar unidad"
                                    >
                                      <Trash2 size={13} />
                                    </button>
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

              {/* PESTAÑA 3: CAPÍTULOS SÁBANA (CON MAPPING DE RENGLONES ACTUALMENTE EN ÉL) */}
              {subTabGestion === 'capitulos' && (
                <div className="space-y-3 font-[Poppins]">
                  <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto max-h-[55vh]">
                      <table className="w-full text-left text-[11px] border-collapse">
                        <thead className="sticky top-0 z-10 bg-gray-100 text-gray-700 font-semibold uppercase text-[9px] tracking-wider border-b border-gray-200">
                          <tr>
                            <th className="px-3 py-2 text-center w-16">N°</th>
                            <th className="px-3 py-2">Nombre del Capítulo</th>
                            <th className="px-3 py-2">Renglones Actualmente en este Capítulo</th>
                            <th className="px-3 py-2 text-center w-24">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 text-gray-700">
                          {capitulosLista.map((c) => {
                            const renglonesEnCapitulo = renglones.filter((r) => (r as any).capituloId === c.id)
                            return (
                              <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                                <td className="px-3 py-2 text-center font-mono text-gray-800">Cap. {c.id}</td>
                                <td className="px-3 py-2 text-gray-800 max-w-xs">{c.nombre}</td>
                                <td className="px-3 py-2 text-gray-700">
                                  {renglonesEnCapitulo.length === 0 ? (
                                    <span className="text-[10px] text-gray-400 italic">No hay renglones asignados</span>
                                  ) : (
                                    <div className="flex flex-wrap items-center gap-1 max-h-20 overflow-y-auto pr-1">
                                      <span className="text-[9px] text-gray-600">
                                        Total: {renglonesEnCapitulo.length} |
                                      </span>
                                      {renglonesEnCapitulo.map((r) => (
                                        <span
                                          key={r.id}
                                          className="inline-block font-mono text-[9px] text-gray-700"
                                          title={r.descripcion}
                                        >
                                          {r.codigoDGC}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCapituloForm({ id: c.id, nombre: c.nombre })
                                        setModalCapituloFormOpen(true)
                                      }}
                                      className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                      title="Editar capítulo"
                                    >
                                      <Edit2 size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setCapituloAEliminar({ id: c.id, nombre: c.nombre })}
                                      className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                      title="Eliminar capítulo"
                                    >
                                      <Trash2 size={13} />
                                    </button>
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
            </div>

            {/* Footer Modal Principal */}
            <div className="border-t border-gray-200 bg-gray-50 px-5 py-2.5 flex items-center justify-between text-xs text-gray-500">
              <span>Gestión de Catálogos de Construcción Vial</span>
              <button
                type="button"
                onClick={() => setModalGestionRenglonesOpen(false)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-1.5 text-[11px] font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FORMULARIO CREAR / EDITAR UNIDAD DE MEDIDA */}
      {modalUnidadFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs font-[Poppins]">
          <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-2xl space-y-3 border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <Calculator size={14} className="text-[#9B0F06]" />
                <span>{unidadForm.id ? 'Editar Unidad de Medida' : 'Nueva Unidad de Medida'}</span>
              </h3>
              <button type="button" onClick={() => setModalUnidadFormOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            </div>

            <div className="space-y-2">
              <div>
                <label className="text-[10px] font-semibold text-gray-700 mb-0.5 block">Símbolo / Abreviatura *</label>
                <input
                  type="text"
                  value={unidadForm.simbolo}
                  onChange={(e) => setUnidadForm({ ...unidadForm, simbolo: e.target.value })}
                  placeholder="Ej: m³, Glb, ton"
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-gray-800 focus:outline-none focus:border-[#9B0F06]"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-gray-700 mb-0.5 block">Nombre Completo *</label>
                <input
                  type="text"
                  value={unidadForm.nombre}
                  onChange={(e) => setUnidadForm({ ...unidadForm, nombre: e.target.value })}
                  placeholder="Ej: Metro Cúbico"
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-[#9B0F06]"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-gray-700 mb-0.5 block">Descripción de Aplicación</label>
                <textarea
                  rows={2}
                  value={unidadForm.descripcion}
                  onChange={(e) => setUnidadForm({ ...unidadForm, descripcion: e.target.value })}
                  placeholder="Ej: Utilizada para cálculo de volumen en excavaciones"
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-[#9B0F06]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-1.5 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setModalUnidadFormOpen(false)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs font-normal text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardarUnidad}
                className="rounded-lg bg-[#9B0F06] px-3.5 py-1 text-xs font-medium text-white hover:bg-[#5E0006] cursor-pointer"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMACIÓN ELIMINAR UNIDAD */}
      {unidadAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs font-[Poppins]">
          <div className="w-full max-w-sm rounded-xl bg-white p-4 shadow-2xl space-y-3 border border-gray-200">
            <div className="flex items-center gap-2 text-red-700">
              <Trash2 size={16} />
              <h3 className="text-xs font-semibold text-gray-900">¿Eliminar Unidad de Medida?</h3>
            </div>
            <p className="text-[11px] text-gray-600 font-normal">
              Está a punto de eliminar la unidad <span className="font-bold font-mono text-gray-900">{unidadAEliminar.simbolo}</span>.
            </p>
            <div className="flex justify-end gap-1.5 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setUnidadAEliminar(null)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEliminarUnidad}
                className="rounded-lg bg-[#9B0F06] px-3 py-1 text-xs font-medium text-white hover:bg-[#5E0006] cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FORMULARIO CREAR / EDITAR CAPÍTULO */}
      {modalCapituloFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs font-[Poppins]">
          <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-2xl space-y-3 border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <Layers size={14} className="text-[#9B0F06]" />
                <span>{capituloForm.id ? `Editar Capítulo ${capituloForm.id}` : 'Nuevo Capítulo Sábana'}</span>
              </h3>
              <button type="button" onClick={() => setModalCapituloFormOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            </div>

            <div className="space-y-2">
              <div>
                <label className="text-[10px] font-semibold text-gray-700 mb-0.5 block">Nombre del Capítulo *</label>
                <input
                  type="text"
                  value={capituloForm.nombre}
                  onChange={(e) => setCapituloForm({ ...capituloForm, nombre: e.target.value })}
                  placeholder="Ej: Capítulo X: Estructuras y Puentes Principales"
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-[#9B0F06]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-1.5 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setModalCapituloFormOpen(false)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs font-normal text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardarCapitulo}
                className="rounded-lg bg-[#9B0F06] px-3.5 py-1 text-xs font-medium text-white hover:bg-[#5E0006] cursor-pointer"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMACIÓN ELIMINAR CAPÍTULO */}
      {capituloAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs font-[Poppins]">
          <div className="w-full max-w-sm rounded-xl bg-white p-4 shadow-2xl space-y-3 border border-gray-200">
            <div className="flex items-center gap-2 text-red-700">
              <Trash2 size={16} />
              <h3 className="text-xs font-semibold text-gray-900">¿Eliminar Capítulo?</h3>
            </div>
            <p className="text-[11px] text-gray-600 font-normal">
              Está a punto de eliminar el capítulo <span className="font-bold text-gray-900">{capituloAEliminar.nombre}</span>.
            </p>
            <div className="flex justify-end gap-1.5 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setCapituloAEliminar(null)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEliminarCapitulo}
                className="rounded-lg bg-[#9B0F06] px-3 py-1 text-xs font-medium text-white hover:bg-[#5E0006] cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL APERTURA DE ESTIMACIÓN PERIODO MENSUAL */}
      {modalAperturaEstimacionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs font-[Poppins]">
          <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-2xl space-y-3 border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <CalendarClock size={15} className="text-[#9B0F06]" />
                <span>Apertura de Periodo de Estimación</span>
              </h3>
              <button type="button" onClick={() => setModalAperturaEstimacionOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={14} />
              </button>
            </div>

            <p className="text-[10.5px] text-gray-500 font-normal">
              Establezca las fechas de inicio y cierre para el nuevo periodo de estimación antes de iniciar operaciones en este mes.
            </p>

            <div className="space-y-2.5">
              <div>
                <label className="text-[10px] font-bold text-gray-700 mb-0.5 block">Identificador de Estimación *</label>
                <input
                  type="text"
                  value={formEstNumero}
                  onChange={(e) => setFormEstNumero(e.target.value)}
                  placeholder="Ej: Estimación 05, Estimación 08 (Actual)"
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-[#9B0F06]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-700 mb-0.5 block">Mes de Correspondencia *</label>
                <input
                  type="text"
                  value={formEstMes}
                  onChange={(e) => setFormEstMes(e.target.value)}
                  placeholder="Ej: Octubre 2026, Noviembre 2026"
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-[#9B0F06]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-gray-700 mb-0.5 block">Fecha Inicio Periodo *</label>
                  <input
                    type="date"
                    value={formEstFechaInicio}
                    onChange={(e) => setFormEstFechaInicio(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-[#9B0F06]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-700 mb-0.5 block">Fecha Corte / Cierre *</label>
                  <input
                    type="date"
                    value={formEstFechaCorte}
                    onChange={(e) => setFormEstFechaCorte(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-[#9B0F06]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-700 mb-0.5 block">Observaciones / Alcance</label>
                <textarea
                  rows={2}
                  value={formEstNotas}
                  onChange={(e) => setFormEstNotas(e.target.value)}
                  placeholder="Notas adicionales sobre la estimación de este periodo..."
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-[#9B0F06]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-1.5 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setModalAperturaEstimacionOpen(false)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-normal text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardarNuevaEstimacion}
                className="rounded-lg bg-[#9B0F06] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#5E0006] cursor-pointer shadow-2xs"
              >
                Aperturar y Fijar Periodo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR MEDISIÓN EN TAB ANALÍTICO */}
      {modalAgregarMedicionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs font-[Poppins]">
          <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-2xl space-y-3 border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <Calculator size={15} className="text-[#9B0F06]" />
                <span>Registrar Medición de Campo (Tab Analítico)</span>
              </h3>
              <button type="button" onClick={() => setModalAgregarMedicionOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={14} />
              </button>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="text-[10px] font-bold text-gray-700 mb-0.5 block">Renglón de Trabajo *</label>
                <select
                  value={formMedCodigoDGC}
                  onChange={(e) => setFormMedCodigoDGC(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-gray-800 focus:outline-none focus:border-[#9B0F06]"
                >
                  {renglones.map((r) => (
                    <option key={r.id} value={r.codigoDGC}>
                      {r.codigoDGC} - {r.descripcion.slice(0, 45)}...
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-gray-700 mb-0.5 block">Estación Inicio *</label>
                  <input
                    type="text"
                    value={formMedEstacionInicio}
                    onChange={(e) => setFormMedEstacionInicio(e.target.value)}
                    placeholder="Ej: 14+200"
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-gray-800 focus:outline-none focus:border-[#9B0F06]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-700 mb-0.5 block">Estación Fin *</label>
                  <input
                    type="text"
                    value={formMedEstacionFin}
                    onChange={(e) => setFormMedEstacionFin(e.target.value)}
                    placeholder="Ej: 14+700"
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-gray-800 focus:outline-none focus:border-[#9B0F06]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-gray-700 mb-0.5 block">Longitud L (m) *</label>
                  <input
                    type="number"
                    value={formMedLongitud}
                    onChange={(e) => setFormMedLongitud(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-mono text-gray-800 focus:outline-none focus:border-[#9B0F06]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-700 mb-0.5 block">Ancho A (m) *</label>
                  <input
                    type="number"
                    value={formMedAncho}
                    onChange={(e) => setFormMedAncho(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-mono text-gray-800 focus:outline-none focus:border-[#9B0F06]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-700 mb-0.5 block">Altura H (m) *</label>
                  <input
                    type="number"
                    value={formMedAltura}
                    onChange={(e) => setFormMedAltura(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-mono text-gray-800 focus:outline-none focus:border-[#9B0F06]"
                  />
                </div>
              </div>

              <div className="rounded-lg bg-red-50/80 p-2 border border-red-100 flex items-center justify-between text-xs font-bold text-[#9B0F06]">
                <span>Volumen Calculado (L × A × H):</span>
                <span className="font-mono text-sm">
                  {((parseFloat(formMedLongitud) || 0) * (parseFloat(formMedAncho) || 0) * (parseFloat(formMedAltura) || 0)).toLocaleString('es-GT', { minimumFractionDigits: 2 })} m³
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-1.5 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setModalAgregarMedicionOpen(false)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-normal text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardarNuevaMedicionAnalitica}
                className="rounded-lg bg-[#9B0F06] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#5E0006] cursor-pointer shadow-2xs"
              >
                Transmitir a Sábana
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
