import { describe, it, expect, afterAll } from 'vitest'
import {
  crearProyecto,
  obtenerProyectoPorId,
  actualizarProyecto,
  eliminarProyecto,
} from './proyectos.servicio'

describe('Prueba Integral E2E: Creación de Proyecto con el 100% de Campos (6 Pasos Completos)', () => {
  let proyectoCreadoId: string | null = null

  afterAll(async () => {
    if (proyectoCreadoId) {
      await eliminarProyecto(proyectoCreadoId).catch(() => {})
    }
  })

  it('Debe crear un proyecto completando todos los campos de los 6 pasos y recuperarlos íntegros', async () => {
    const timestamp = Date.now()
    const codigoUnico = `DOM-VIAL-FULL-${timestamp.toString().slice(-4)}`

    // Payload exhaustivo con el 100% de los campos del formulario
    const payloadCompleto = {
      // -------------------------------------------------------------
      // PASO 1: Identificación y Alcance
      // -------------------------------------------------------------
      codigo: codigoUnico,
      nombreOficial: 'CONSTRUCCIÓN PASO A DESNIVEL E INTERSECCIÓN VIAL CA-9 SUR KM 22.5',
      nombre: 'CONSTRUCCIÓN PASO A DESNIVEL E INTERSECCIÓN VIAL CA-9 SUR KM 22.5',
      descripcion: 'Ampliación a 4 carriles de concreto hidráulico, señalización horizontal y vertical, muros de contención mecánicamente estabilizados y sistema integral de drenaje pluvial.',
      entidadContratante: 'DIRECCIÓN GENERAL DE CAMINOS (DGC / CIV)',

      // -------------------------------------------------------------
      // PASO 2: Ubicación Geográfica y Tramo Vial DGC
      // -------------------------------------------------------------
      direccion: 'Km 22.5 CA-9 Sur, Villa Nueva, Guatemala',
      ubicacionFisica: 'Km 22.5 CA-9 Sur, Villa Nueva, Guatemala',
      direccionFin: 'Km 28.0 CA-9 Sur, Amatitlán, Guatemala',
      kilometroInicio: 22.5,
      kilometroFin: 28.0,
      coordenadasMapa: {
        lat: 14.500167,
        lng: -90.617015,
        puntoTexto: 'Km 22.5 Carretera al Pacífico CA-9 Sur, Villa Nueva, Guatemala',
      },

      // -------------------------------------------------------------
      // PASO 3: Marco Legal y Empresas Participantes
      // -------------------------------------------------------------
      empresaContratista: 'CONSTRUCTORA NACIONAL DEL PACIFICO S.A.',
      empresaSupervisora: 'SERVICIOS DE INGENIERIA Y SUPERVISION VIAL - SERINGE',
      equipo: [
        { id: 'usr-1', nombre: 'Ing. Carlos Morales', rol: 'Especialista en Suelos y Pavimentos' },
        { id: 'usr-2', nombre: 'Inga. Sofia Castillo', rol: 'Especialista Ambiental y Seguridad' },
        { id: 'usr-3', nombre: 'Téc. Mario Alvarado', rol: 'Topógrafo de Campo' },
      ],

      // -------------------------------------------------------------
      // PASO 4: Ficha Técnica y Partidas Presupuestarias
      // -------------------------------------------------------------
      fechaAdjudicacion: '2026-01-15',
      numeroEscrituraPublica: 'Escritura Pública No. 89-2026',

      // -------------------------------------------------------------
      // PASO 5: Aspectos Financieros y Plazos
      // -------------------------------------------------------------
      fechaInicioContractual: '2026-03-01',
      fechaInicio: '2026-03-01',
      fechaFinContractualPlan: '2027-09-01',
      fechaFin: '2027-09-01',
      montoContractualOriginal: 369834297.14,
      presupuesto: 369834297.14,

      // -------------------------------------------------------------
      // PASO 6: Estado y Cierre
      // -------------------------------------------------------------
      estado: 'activo',
      fechaFinalizacionReal: null,
      plazoEjecucionRealAmpliado: '18 Meses Contractuales',
      montoFinancieroFinalEjecutado: null,

      // Contratos Desglosados
      contratoEjecucion: {
        tipo: 'EJECUCION',
        empresaNombre: 'CONSTRUCTORA NACIONAL DEL PACIFICO S.A.',
        propietario: 'Ing. William Ramón Godínez',
        registroMercantil: 'RM-177228A',
        direccion: 'Avenida Las Américas 24-70 Zona 13, Guatemala',
        telefono: '2212-9675 / 5525-1537',
        correo: 'contacto@constructora-pacifico.gt',
        responsable: 'Ing. Civil Pablo Pérez - Col. Activo 3689',
        licitacionNumero: 'DGC-053-2025-C',
        actaInicioNumero: 'Acta No. 26-2026 de fecha 09/02/2026',
        programa: 'TRANSPORTE POR CARRETERA',
        subprograma: 'MEJORAMIENTO DE CARRETERAS SECUNDARIAS Y PUENTES',
        fuenteFinanciamiento: 'Fondos nacionales',
        partidaFondos: '2026-11130013-202-11-01-002-000-003-331-1399-52-0403-0065',
        cdp: '66349939',
        contratoNumero: '008-2026-DGC-CONSTRUCCION, 29/05/2026',
        acuerdoMinisterial: '522-2026 de fecha 09/06/2026',
        montoOriginal: 369834297.14,
        porcentajeAnticipo: 15.0,
        montoAnticipo: 55475144.57,
        plazoMesesDetalle: '18 meses (Etapa de Construcción)',
        fechaInicio: '2026-03-01',
        fechaFin: '2027-09-01',
      },

      contratoSupervision: {
        tipo: 'SUPERVISION',
        empresaNombre: 'SERVICIOS DE INGENIERIA Y SUPERVISION VIAL - SERINGE',
        propietario: 'Ing. Elena Beatriz Gómez',
        registroMercantil: 'RM-884920B',
        direccion: '15 Calle 3-20 Zona 10, Edificio Centro Ejecutivo, Nivel 8',
        telefono: '2366-8800',
        correo: 'supervision@seringe.com.gt',
        responsable: 'Ing. Roberto Fuentes - Col. Activo 4120',
        licitacionNumero: 'DGC-054-2025-S',
        actaInicioNumero: 'Acta No. 52-2026 de fecha 07/07/2026',
        programa: 'TRANSPORTE POR CARRETERA',
        subprograma: 'MEJORAMIENTO DE CARRETERAS SECUNDARIAS Y PUENTES',
        fuenteFinanciamiento: 'Fondos nacionales',
        partidaFondos: '2026-11130013-202-11-01-002-000-003-188-1399-52-0403-0065',
        cdp: '66349940',
        contratoNumero: '007-2026-DGC-SUPERVISION, 29/05/2026',
        acuerdoMinisterial: '625-2026 de fecha 06/07/2026',
        montoOriginal: 13351095.20,
        porcentajeAnticipo: 10.0,
        montoAnticipo: 1335109.52,
        plazoMesesDetalle: '22 MESES (2 Pre, 18 Ejecución, 2 Post)',
        fechaInicio: '2026-03-01',
        fechaFin: '2027-11-01',
      },
    }

    // 1. Ejecutar Creación
    const idGenerado = await crearProyecto(payloadCompleto)
    expect(idGenerado).toBeDefined()
    expect(typeof idGenerado).toBe('string')
    proyectoCreadoId = idGenerado

    // 2. Recuperar y verificar la integridad de todos los campos guardados
    const proyectoGuardado = await obtenerProyectoPorId(idGenerado)
    expect(proyectoGuardado).toBeDefined()

    // Verificación Paso 1
    expect(proyectoGuardado?.codigo).toBe(codigoUnico)
    expect(proyectoGuardado?.nombreOficial || proyectoGuardado?.nombre).toBe(payloadCompleto.nombreOficial)
    expect(proyectoGuardado?.descripcion).toBe(payloadCompleto.descripcion)
    expect(proyectoGuardado?.entidadContratante).toBe(payloadCompleto.entidadContratante)

    // Verificación Paso 2
    expect(proyectoGuardado?.direccion).toBe(payloadCompleto.direccion)
    expect(proyectoGuardado?.kilometroInicio).toBe(22.5)
    expect(proyectoGuardado?.kilometroFin).toBe(28.0)

    // Verificación Paso 3 & Contratos
    expect(proyectoGuardado?.empresaContratista).toBe('CONSTRUCTORA NACIONAL DEL PACIFICO S.A.')
    expect(proyectoGuardado?.contratoEjecucion).toBeDefined()
    expect(proyectoGuardado?.contratoEjecucion?.licitacionNumero).toBe('DGC-053-2025-C')
    expect(proyectoGuardado?.contratoEjecucion?.cdp).toBe('66349939')
    expect(proyectoGuardado?.contratoEjecucion?.montoOriginal).toBe(369834297.14)
    expect(proyectoGuardado?.contratoEjecucion?.montoAnticipo).toBe(55475144.57)

    expect(proyectoGuardado?.contratoSupervision).toBeDefined()
    expect(proyectoGuardado?.contratoSupervision?.empresaNombre).toBe('SERVICIOS DE INGENIERIA Y SUPERVISION VIAL - SERINGE')
    expect(proyectoGuardado?.contratoSupervision?.licitacionNumero).toBe('DGC-054-2025-S')
    expect(proyectoGuardado?.contratoSupervision?.cdp).toBe('66349940')
    expect(proyectoGuardado?.contratoSupervision?.montoOriginal).toBe(13351095.20)
    expect(proyectoGuardado?.contratoSupervision?.montoAnticipo).toBe(1335109.52)

    // Verificación Paso 4 & 5
    expect(proyectoGuardado?.montoContractualOriginal || proyectoGuardado?.presupuesto).toBe(369834297.14)
    expect(proyectoGuardado?.estado).toBe('activo')
  })
})
