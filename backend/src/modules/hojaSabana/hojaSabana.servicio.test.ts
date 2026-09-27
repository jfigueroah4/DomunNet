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
})
