// @ts-nocheck
import { PROYECTOS_MOCK as BASE_MOCKS } from '@/data/proyectos.mock'
import {
  ProyectoType,
  RenglonDetalladoSabanaType,
  MedicionAnaliticaCampoType,
  TrabajoPendienteBolsaType,
} from '@/validations/proyecto.schema'
import type { EstadoProyecto } from '@/types/proyecto'

const estadoDetalle = (estado: string): EstadoProyecto => {
  if (estado === 'pausado') return 'borrador'
  return estado as EstadoProyecto
}

const documentosBase = [
  {
    id: 'doc-1',
    nombre: 'Planos Arquitectónicos y Viales',
    tipo: 'pdf',
    tamanio: '4.2 MB',
    fechaSubida: '2025-01-15',
    subidoPor: 'Arq. María García',
  },
  {
    id: 'doc-2',
    nombre: 'Presupuesto y Renglones de Obra',
    tipo: 'excel',
    tamanio: '1.8 MB',
    fechaSubida: '2025-01-18',
    subidoPor: 'Ing. Carlos Mendoza',
  },
  {
    id: 'doc-3',
    nombre: 'Contrato Administrativo y Escritura Pública',
    tipo: 'word',
    tamanio: '856 KB',
    fechaSubida: '2025-01-20',
    subidoPor: 'Lic. Roberto López',
  },
]

const fasesBase: any[] = [
  {
    id: 'fase-1',
    nombre: 'Fase I: Estudios, Diseños y Tramitología',
    fechaInicio: '2025-01-20',
    fechaFin: '2025-03-31',
    avance: 100,
    estado: 'completado',
  },
  {
    id: 'fase-2',
    nombre: 'Fase II: Terraceróa y Movimiento de Tierras',
    fechaInicio: '2025-04-01',
    fechaFin: '2025-08-31',
    avance: 100,
    estado: 'completado',
  },
  {
    id: 'fase-3',
    nombre: 'Fase III: Pavimentación, Drenajes y Estructuras',
    fechaInicio: '2025-09-01',
    fechaFin: '2026-06-30',
    avance: 65,
    estado: 'activo',
  },
  {
    id: 'fase-4',
    nombre: 'Fase IV: Seóalización, Seguridad Vial y Entrega',
    fechaInicio: '2026-07-01',
    fechaFin: '2026-11-30',
    avance: 0,
    estado: 'borrador',
  },
]

const equipoAmpliadoMock = [
  { id: '1', nombre: 'Carlos Mendoza', rol: 'Supervisor Vial Principal' },
  { id: '2', nombre: 'Laura Fernández', rol: 'Ingeniera Estructural' },
  { id: '3', nombre: 'Roberto López', rol: 'Residente de Obra Vial' },
  { id: '4', nombre: 'Ana María Alvarado', rol: 'Especialista en Seguridad Vial' },
  { id: '5', nombre: 'Héctor Mario Paz', rol: 'Inspector de Calidad de Suelos' },
  { id: '6', nombre: 'Fernando Rodríguez', rol: 'Topógrafo Jefe de Campo' },
  { id: '7', nombre: 'Sandra Díaz', rol: 'Coordinadora de Tránsito y Cierres' },
  { id: '8', nombre: 'Gustavo Reyes', rol: 'Laboratorista de Concreto y Asfalto' },
]

export const getProyectoMockDetalle = (id: string): ProyectoType | undefined => {
  const base = BASE_MOCKS.find((proyecto) => proyecto.id === id)
  if (!base) return undefined

  return {
    id: base.id,
    codigo: base.codigo,
    nombre: base.nombre,
    nombreOficial: base.nombre,
    descripcion:
      'Proyecto vial integral con seguimiento de terraceróa, pavimentación, drenajes y seguridad vial en DomunNet.',
    estado: estadoDetalle(base.estado),
    ubicacion: base.ubicacion,
    ubicacionFisica: base.ubicacion,
    direccion: 'Km 22.5 CA-9 Sur',
    coordenadasMapa: {
      lat: 14.5021,
      lng: -90.5841,
      puntoTexto: 'Tramo Obra Vial CA-9 Sur',
    },
    entidadContratante: 'Ministerio de Comunicaciones, Infraestructura y Vivienda (CIV)',
    empresaContratista: 'Constructora Nacional de Pavimentos S.A.',
    empresaSupervisora: 'Consorcio de Ingeniería y Supervisión Vial R.L.',
    delegadoResidente: 'Ing. Carlos Mendoza (Colegiado 14,890)',
    fechaAdjudicacion: '2024-11-15',
    numeroEscrituraPublica: 'Escritura No. 142-2024 Notaría de Gobierno',
    fechaInicioContractual: base.fechaInicio,
    plazoEjecucionContractualOriginal: '18 Meses (540 días)',
    montoContractualOriginal: base.presupuesto,
    fechaFinalizacionReal: '2026-11-30',
    plazoEjecucionRealAmpliado: '20 Meses (+2 meses por lluvia excesiva)',
    montoFinancieroFinalEjecutado: base.presupuesto * 1.05,
    responsable: base.responsable,
    equipo: base.equipo.length >= 3 ? base.equipo : equipoAmpliadoMock,
    categorias: base.categorias,
    rolesProyecto: base.rolesProyecto as any,
    presupuesto: base.presupuesto,
    avance: base.avance,
    fechaInicio: base.fechaInicio,
    fechaFin: base.fechaFin,
    creadoEn: base.fechaInicio,
    documentos: base.id === '1' ? documentosBase : documentosBase.slice(0, 2),
    fotografias: [],
    fases: base.id === '1' ? fasesBase : fasesBase.slice(0, 3),
  }
}

export const CAPITULOS_LIBRO_AZUL = [
  { id: 1, nombre: 'Capítulo I: Estudios, Mantenimiento y Trabajos Preliminares' },
  { id: 2, nombre: 'Capítulo II: Movimiento de Tierras y Excavación' },
  { id: 3, nombre: 'Capítulo III: Terraplenes Estructurales y Capas de Soporte' },
  { id: 4, nombre: 'Capítulo IV: Subbases y Bases Granulares' },
  { id: 5, nombre: 'Capítulo V: Pavimentos Asfálticos y Concreto' },
  { id: 6, nombre: 'Capítulo VI: Estructuras de Drenaje Pluvial' },
  { id: 7, nombre: 'Capítulo VII: Bóvedas Metálicas y Obras de Arte' },
  { id: 8, nombre: 'Capítulo VIII: Construcciones Complementarias y Seóalización' },
  { id: 9, nombre: 'Capítulo IX: Aspectos Ambientales y Gestión de Riesgo' },
]

export const CATALOGO_DETALLADO_88_RENGLONES: RenglonDetalladoSabanaType[] = [
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
    unidad: 'm³',
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

export const GENERAR_88_RENGLONES = (): RenglonDetalladoSabanaType[] => {
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
        descripcion: `Renglón complementario de ${cap.nombre.split(':')[1]?.trim() || 'Obra Vial'} No. ${i}`,
        unidad: i % 2 === 0 ? 'm³' : i % 3 === 0 ? 'ml' : 'm³',
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

export const CATALOGO_COMPLETO_88 = GENERAR_88_RENGLONES()

export const MEDICIONES_ANALITICAS_MOCK: MedicionAnaliticaCampoType[] = [
  { id: 'm-1', codigoDGC: '201.01', estacionInicio: '14+200', estacionFin: '14+700', longitudL: 500, anchoA: 7.3, alturaH: 0.95, mesPeriodo: 'Mes 6', numEstimacion: 'Est. 08', observaciones: 'Ancho promedio verificado según libreta de nivelación topográfica N° 04.' },
  { id: 'm-2', codigoDGC: '201.01', estacionInicio: '14+700', estacionFin: '15+100', longitudL: 400, anchoA: 7.3, alturaH: 0.95, mesPeriodo: 'Mes 6', numEstimacion: 'Est. 08', observaciones: 'Alineamiento ajustado por presencia de talud de corte cóncavo.' },
  { id: 'm-3', codigoDGC: '201.03(b)', estacionInicio: '15+200', estacionFin: '15+500', longitudL: 300, anchoA: 4.0, alturaH: 1.0, mesPeriodo: 'Mes 6', numEstimacion: 'Est. 08', observaciones: 'Volumen derivado de perforación y voladura en banco de material rocoso duro.' },
  { id: 'm-4', codigoDGC: '551.03', estacionInicio: '14+200', estacionFin: '14+600', longitudL: 400, anchoA: 3.65, alturaH: 0.25, mesPeriodo: 'Mes 6', numEstimacion: 'Est. 08', observaciones: 'Espesor verificado con reglas de nivel durante la fundición continua de carril derecho.' },
]

export const TRABAJOS_PENDIENTES_MOCK: TrabajoPendienteBolsaType[] = [
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

export const MOCK_UBICACIONES = {
  departamentos: [
    { id: '1', nombre: 'Guatemala', slug: 'guatemala' },
    { id: '2', nombre: 'El Progreso', slug: 'el-progreso' },
    { id: '3', nombre: 'Sacatepéquez', slug: 'sacatepequez' },
    { id: '4', nombre: 'Chimaltenango', slug: 'chimaltenango' },
    { id: '5', nombre: 'Escuintla', slug: 'escuintla' },
    { id: '6', nombre: 'Santa Rosa', slug: 'santa-rosa' },
    { id: '7', nombre: 'Sololá', slug: 'solola' },
    { id: '8', nombre: 'Totonicapán', slug: 'totonicapan' },
    { id: '9', nombre: 'Quetzaltenango', slug: 'quetzaltenango' },
    { id: '10', nombre: 'Suchitepéquez', slug: 'suchitepequez' },
    { id: '11', nombre: 'Retalhuleu', slug: 'retalhuleu' },
    { id: '12', nombre: 'San Marcos', slug: 'san-marcos' },
    { id: '13', nombre: 'Huehuetenango', slug: 'huehuetenango' },
    { id: '14', nombre: 'Quiché', slug: 'quiche' },
    { id: '15', nombre: 'Baja Verapaz', slug: 'baja-verapaz' },
    { id: '16', nombre: 'Alta Verapaz', slug: 'alta-verapaz' },
    { id: '17', nombre: 'Petén', slug: 'peten' },
    { id: '18', nombre: 'Izabal', slug: 'izabal' },
    { id: '19', nombre: 'Zacapa', slug: 'zacapa' },
    { id: '20', nombre: 'Chiquimula', slug: 'chiquimula' },
    { id: '21', nombre: 'Jalapa', slug: 'jalapa' },
    { id: '22', nombre: 'Jutiapa', slug: 'jutiapa' }
  ],
  municipios: [
    { id: '101', nombre: 'Guatemala', departamentoId: '1', slug: 'guatemala-ciudad' },
    { id: '102', nombre: 'Mixco', departamentoId: '1', slug: 'mixco' },
    { id: '103', nombre: 'Villa Nueva', departamentoId: '1', slug: 'villa-nueva' },
    { id: '104', nombre: 'Santa Catarina Pinula', departamentoId: '1', slug: 'santa-catarina-pinula' },
    { id: '105', nombre: 'San Miguel Petapa', departamentoId: '1', slug: 'san-miguel-petapa' },
    
    { id: '201', nombre: 'Guastatoya', departamentoId: '2', slug: 'guastatoya' },
    { id: '202', nombre: 'Sanarate', departamentoId: '2', slug: 'sanarate' },
    
    { id: '301', nombre: 'Antigua Guatemala', departamentoId: '3', slug: 'antigua-guatemala' },
    { id: '302', nombre: 'San Juan Sacatepéquez', departamentoId: '3', slug: 'san-juan-sacatepequez' },
    
    { id: '401', nombre: 'Chimaltenango', departamentoId: '4', slug: 'chimaltenango-mun' },
    { id: '402', nombre: 'El Tejar', departamentoId: '4', slug: 'el-tejar' },
    
    { id: '501', nombre: 'Escuintla', departamentoId: '5', slug: 'escuintla-mun' },
    { id: '502', nombre: 'Santa Lucía Cotzumalguapa', departamentoId: '5', slug: 'santa-lucia-cotzumalguapa' },
    { id: '503', nombre: 'Puerto San José', departamentoId: '5', slug: 'puerto-san-jose' },
    
    { id: '901', nombre: 'Quetzaltenango', departamentoId: '9', slug: 'xela' },
    { id: '902', nombre: 'Salcajá', departamentoId: '9', slug: 'salcaja' },
    { id: '903', nombre: 'Coatepeque', departamentoId: '9', slug: 'coatepeque' },

    { id: '1601', nombre: 'Cobán', departamentoId: '16', slug: 'coban' },
    { id: '1602', nombre: 'San Pedro Carchá', departamentoId: '16', slug: 'san-pedro-carcha' },
    
    { id: '1701', nombre: 'Flores', departamentoId: '17', slug: 'flores' },
    { id: '1702', nombre: 'San Benito', departamentoId: '17', slug: 'san-benito' },
    { id: '1703', nombre: 'Santa Elena', departamentoId: '17', slug: 'santa-elena' },

    { id: '1801', nombre: 'Puerto Barrios', departamentoId: '18', slug: 'puerto-barrios' },
    { id: '1802', nombre: 'Morales', departamentoId: '18', slug: 'morales' }
  ]
}

export const proyectoMock = BASE_MOCKS;

export default { proyectoMock, MOCK_UBICACIONES }

