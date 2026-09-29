import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { clienteSupabase } from '@/configuracion/cliente-supabase'
import {
  crearProyecto,
  obtenerProyectoPorId,
  actualizarProyecto,
  eliminarProyecto,
  ValidationError,
} from './proyectos.servicio'

describe('Suite de Pruebas: Creación y Edición de Proyectos (6 Pasos & Contratos)', () => {
  let proyectoBorradorId: string | null = null
  let proyectoActivoId: string | null = null

  afterAll(async () => {
    // Limpieza de datos de prueba
    if (proyectoBorradorId) {
      await eliminarProyecto(proyectoBorradorId).catch(() => {})
    }
    if (proyectoActivoId) {
      await eliminarProyecto(proyectoActivoId).catch(() => {})
    }
  })

  it('1. Debe permitir crear un proyecto en estado BORRADOR con solo el Nombre Oficial', async () => {
    const datosBorrador = {
      nombreOficial: 'PROYECTO TEST AUTOMATIZADO BORRADOR VIAL 2026',
      estado: 'borrador',
    }

    const resultadoId = await crearProyecto(datosBorrador)
    expect(resultadoId).toBeDefined()
    expect(typeof resultadoId).toBe('string')
    proyectoBorradorId = resultadoId

    // Verificar en base de datos
    const proyBD = await obtenerProyectoPorId(resultadoId)
    expect(proyBD).toBeDefined()
    expect(proyBD?.nombreOficial || proyBD?.nombre).toContain('TEST AUTOMATIZADO BORRADOR')
    expect(proyBD?.estado).toBe('borrador')
  })

  it('2. Debe rechazar la creación de proyecto si no se provee Nombre Oficial', async () => {
    const datosVacios = {
      nombreOficial: '',
      estado: 'borrador',
    }

    await expect(crearProyecto(datosVacios)).rejects.toThrow()
  })

  it('3. Debe guardar y recuperar contratos de Ejecución y Supervisión en proyecto_contrato', async () => {
    const dynamicCode = `TEST-DOM-${Date.now()}`
    const datosActivo = {
      codigo: dynamicCode,
      nombreOficial: 'PROYECTO TEST AUTOMATIZADO ACTIVO CON CONTRATOS 2026',
      descripcion: 'Construcción y mejoramiento de tramo carretero de prueba',
      entidadContratante: 'DIRECCION GENERAL DE CAMINOS',
      direccion: 'Km 15 CA-9 Norte',
      ubicacionFisica: 'Guatemala - El Progreso',
      kilometroInicio: '15.00',
      kilometroFin: '35.50',
      estado: 'activo',
      contratoEjecucion: {
        tipo: 'EJECUCION',
        empresaNombre: 'CONSTRUCTORA NACIONAL S.A.',
        propietario: 'Ing. Carlos Mendoza',
        registroMercantil: 'RM-994812',
        direccion: 'Zona 10, Ciudad de Guatemala',
        telefono: '2333-4455',
        correo: 'contacto@constructoranacional.gt',
        responsable: 'Ing. Roberto Silva',
        licitacionNumero: 'DGC-LNC-010-2026',
        actaInicioNumero: 'Acta No. 12-2026',
        programa: 'TRANSPORTE POR CARRETERA',
        subprograma: 'MEJORAMIENTO CARRETERAS',
        fuenteFinanciamiento: 'Fondos Nacionales',
        partidaFondos: '2026-11130013-202-001',
        cdp: 'CDP-88391',
        contratoNumero: '045-2026-DGC-OBRA',
        acuerdoMinisterial: 'AM-332-2026',
        montoOriginal: 50000000.0,
        porcentajeAnticipo: 15.0,
        montoAnticipo: 7500000.0,
        fechaInicio: '2026-03-01',
        plazoMesesDetalle: '18 meses',
        fechaFin: '2027-09-01',
      },
      contratoSupervision: {
        tipo: 'SUPERVISION',
        empresaNombre: 'SERVICIOS DE SUPERVISION INTEGRAL S.A.',
        propietario: 'Ing. Elena Gómez',
        registroMercantil: 'RM-773821',
        direccion: 'Zona 14, Ciudad de Guatemala',
        telefono: '2444-5566',
        correo: 'info@supervisionintegral.gt',
        responsable: 'Ing. Fernando Ortiz',
        licitacionNumero: 'DGC-LNC-011-2026-SUP',
        actaInicioNumero: 'Acta No. 13-2026',
        programa: 'TRANSPORTE POR CARRETERA',
        subprograma: 'SUPERVISION CARRETERAS',
        fuenteFinanciamiento: 'Fondos Nacionales',
        partidaFondos: '2026-11130013-202-002',
        cdp: 'CDP-88392',
        contratoNumero: '046-2026-DGC-SUP',
        acuerdoMinisterial: 'AM-333-2026',
        montoOriginal: 4500000.0,
        porcentajeAnticipo: 10.0,
        montoAnticipo: 450000.0,
        fechaInicio: '2026-03-01',
        plazoMesesDetalle: '20 meses',
        fechaFin: '2027-11-01',
      },
    }

    const resultadoId = await crearProyecto(datosActivo)
    expect(resultadoId).toBeDefined()
    expect(typeof resultadoId).toBe('string')
    proyectoActivoId = resultadoId

    // Leer el proyecto y verificar que los contratos se cargaron
    const proy = await obtenerProyectoPorId(resultadoId)
    expect(proy).toBeDefined()
    expect(proy?.contratoEjecucion).toBeDefined()
    expect(proy?.contratoEjecucion?.empresaNombre).toBe('CONSTRUCTORA NACIONAL S.A.')
    expect(proy?.contratoEjecucion?.montoOriginal).toBe(50000000.0)
    expect(proy?.contratoEjecucion?.montoAnticipo).toBe(7500000.0)

    expect(proy?.contratoSupervision).toBeDefined()
    expect(proy?.contratoSupervision?.empresaNombre).toBe('SERVICIOS DE SUPERVISION INTEGRAL S.A.')
    expect(proy?.contratoSupervision?.montoOriginal).toBe(4500000.0)
    expect(proy?.contratoSupervision?.montoAnticipo).toBe(450000.0)
  })

  it('4. Debe actualizar datos de contratos correctamente en modo EDICIÓN', async () => {
    if (!proyectoActivoId) return

    const actualizacion = {
      contratoEjecucion: {
        tipo: 'EJECUCION',
        empresaNombre: 'CONSTRUCTORA NACIONAL MODIFICADA S.A.',
        montoOriginal: 52000000.0,
        porcentajeAnticipo: 15.0,
        montoAnticipo: 7800000.0,
        plazoMesesDetalle: '20 meses',
      },
    }

    await actualizarProyecto(proyectoActivoId, actualizacion)

    const proy = await obtenerProyectoPorId(proyectoActivoId)
    expect(proy?.contratoEjecucion?.empresaNombre).toBe('CONSTRUCTORA NACIONAL MODIFICADA S.A.')
    expect(proy?.contratoEjecucion?.montoOriginal).toBe(52000000.0)
    expect(proy?.contratoEjecucion?.montoAnticipo).toBe(7800000.0)
  })
})
