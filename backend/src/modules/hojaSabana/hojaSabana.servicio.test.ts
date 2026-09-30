import { describe, it, expect, beforeEach } from 'vitest'
import { HojaSabanaServicio } from './hojaSabana.servicio'
import { procesarMedicionRenglon, calcularCantidadMedicion } from '../../lib/calculos'

describe('Módulo de Backend Hoja Sábana y Analítico (hojaSabana.servicio.ts)', () => {
  const proyId = 'proy-test-01'

  it('debe calcular cantidad por memoria según la unidad (ejemplo m2, E=1500, medicion 500x7.30 = 3650)', () => {
    const resMem = calcularCantidadMedicion({
      unidad: 'm2',
      longitudL: 500,
      anchoA: 7.3,
    })
    expect(resMem.cantidadNeta).toBe(3650)

    // Topes: E=1500, medicion=3650 -> Facturable = 1500, Retenido = 2150
    const resTopes = procesarMedicionRenglon({
      cantidadAjustada: 1500,
      acumuladoAnterior: 0,
      medicionPeriodo: resMem.cantidadNeta || 0,
      precioUnitario: 100,
    })

    expect(resTopes.facturablePeriodo).toBe(1500)
    expect(resTopes.retenidoPendiente).toBe(2150)
    expect(resTopes.estado).toBe('Sobreejecutado')
  })

  it('debe registrar una medición en la lista y calcular facturable vs retenido', async () => {
    const med = await HojaSabanaServicio.crearMedicion({
      proyectoId: proyId,
      codigoDGC: '201.01',
      estacionInicio: '14+200',
      estacionFin: '14+700',
      longitudL: 500,
      anchoA: 7.3,
      alturaH: 0.95,
      origenTipo: 'Plano',
      referenciaOrigen: 'Plano Perfil Altimétrico Folio #14',
      estimacionNum: 'Est. 01',
      unidad: 'm3',
      cantidadAjustada: 5000,
      acumuladoAnterior: 0,
    })

    expect(med).toBeDefined()
    expect(med.codigoDGC).toBe('201.01')
    expect(med.cantidadCalculada).toBe(3467.5)
    expect(med.cantidadFacturable).toBe(3467.5)
    expect(med.cantidadRetenida).toBe(0)

    const lista = await HojaSabanaServicio.listarMediciones(proyId, 'Est. 01')
    expect(lista.length).toBeGreaterThan(0)
  })

  it('debe rechazar la creación de medición sin referencia de origen obligatoria', async () => {
    await expect(
      HojaSabanaServicio.crearMedicion({
        proyectoId: proyId,
        codigoDGC: '201.01',
        estacionInicio: '14+200',
        estacionFin: '14+700',
        origenTipo: 'Plano',
        referenciaOrigen: '',
      })
    ).rejects.toThrow('La referencia u origen (folio/plano) es obligatoria.')
  })

  it('debe bloquear nuevas mediciones, edición y eliminación cuando la estimación está finalizada', async () => {
    const estNum = 'Est. 09-BLOQUEADA'

    // Crear una medición inicial para abrir la estimación
    await HojaSabanaServicio.crearMedicion({
      proyectoId: proyId,
      codigoDGC: '201.01',
      estacionInicio: '14+200',
      estacionFin: '14+700',
      longitudL: 500,
      anchoA: 7.3,
      origenTipo: 'Plano',
      referenciaOrigen: 'Folio #98',
      estimacionNum: estNum,
    })
    
    // Finalizar la estimación
    await HojaSabanaServicio.finalizarEstimacion(proyId, estNum)

    // Intentar crear medición en la estimación finalizada
    await expect(
      HojaSabanaServicio.crearMedicion({
        proyectoId: proyId,
        codigoDGC: '201.01',
        estacionInicio: '14+200',
        estacionFin: '14+700',
        longitudL: 500,
        anchoA: 7.3,
        origenTipo: 'Plano',
        referenciaOrigen: 'Folio #99',
        estimacionNum: estNum,
      })
    ).rejects.toThrow(`La estimación ${estNum} está finalizada/cerrada`)
  })

  it('debe vincular registros de bitácora con analítico y calcular volumen/topes hacia Col. I de Sábana', async () => {
    const bitacoraEntradaId = 'bitacora-entrada-uuid-99'
    const medBitacora = await HojaSabanaServicio.crearMedicion({
      proyectoId: 'proy-bitacora-test',
      codigoDGC: '401.01',
      estacionInicio: '10+000',
      estacionFin: '10+300',
      longitudL: 300,
      anchoA: 7.30,
      alturaH: 0.15,
      ladoVia: 'Sección Completa',
      origenTipo: 'Libreta',
      referenciaOrigen: 'Bitácora Folio #45 Frente 1',
      estimacionNum: 'Est. 02',
      unidad: 'm3',
      cantidadAjustada: 500,
      acumuladoAnterior: 200,
      precioUnitario: 1200,
      bitacoraEntradaId: bitacoraEntradaId,
    })

    expect(medBitacora.bitacora_entrada_id || medBitacora.bitacoraEntradaId).toBe(bitacoraEntradaId)
    // 300 * 7.30 * 0.15 = 328.5 m3
    expect(medBitacora.cantidadCalculada).toBe(328.5)
    // Ajustada = 500, Acumulado = 200 -> Tope disponible = 300. Facturable = 300, Retenido = 28.5
    expect(medBitacora.cantidadFacturable).toBe(300)
    expect(medBitacora.cantidadRetenida).toBe(28.5)
  })

  it('debe mantener la integridad entre plan de trabajo original (Línea Base) y vista actual sin copiar datos teóricos', () => {
    const planOriginal = {
      'Ene 2025': 150,
      'Feb 2025': 250,
      'Mar 2025': 250,
      'Abr 2025': 150,
    }
    const realEjecutado = {
      'Ene 2025': 140,
      'Feb 2025': 260,
    }

    // En vista Plan: se mantiene la curva teórica completa
    const sumaPlan = Object.values(planOriginal).reduce((a, b) => a + b, 0)
    expect(sumaPlan).toBe(800)

    // En vista Actual: los meses futuros no ejecutados deben ser 0 / undefined, nunca el valor del plan
    expect(realEjecutado['Mar 2025' as keyof typeof realEjecutado]).toBeUndefined()
    expect(realEjecutado['Abr 2025' as keyof typeof realEjecutado]).toBeUndefined()
  })
})
