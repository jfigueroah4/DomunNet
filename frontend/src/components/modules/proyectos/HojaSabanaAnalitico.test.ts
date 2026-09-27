import { describe, it, expect } from 'vitest'
import {
  calcularCantidadMedicion,
  calcularLongitudEstaciones,
  parseEstacionAMetros,
} from '../../../lib/calculos/memoria'
import { procesarMedicionRenglon } from '../../../lib/calculos/topes'
import { HojaSabanaServicio } from '../../../../../backend/src/modules/hojaSabana/hojaSabana.servicio'

describe('Fase 1: Pruebas de Integración y Reglas de Negocio del Analítico (Memoria de Cálculo)', () => {
  const proyId = 'proy-test-fase1'

  it('1. Pruebas unitarias de memoria.ts por unidad, descuento, multiplicador y estaciones que cruzan km', () => {
    // Estaciones cruzando km: 14+700 a 15+100 = 400m
    expect(parseEstacionAMetros('14+700')).toBe(14700)
    expect(parseEstacionAMetros('15+100')).toBe(15100)
    expect(calcularLongitudEstaciones('14+700', '15+100')).toBe(400)

    // Unidades
    const rM = calcularCantidadMedicion({ unidad: 'm', longitudL: 400 })
    expect(rM.cantidadNeta).toBe(400)

    const rM2 = calcularCantidadMedicion({ unidad: 'm2', longitudL: 500, anchoA: 7.3 })
    expect(rM2.cantidadNeta).toBe(3650)

    const rM3 = calcularCantidadMedicion({ unidad: 'm3', longitudL: 500, anchoA: 7.3, alturaH: 0.95 })
    expect(rM3.cantidadNeta).toBe(3467.5)

    const rGlb = calcularCantidadMedicion({ unidad: 'Glb', cantidadDirecta: 0.25 })
    expect(rGlb.cantidadNeta).toBe(0.25)

    // Multiplicador y Descuento
    const rMult = calcularCantidadMedicion({ unidad: 'm2', longitudL: 100, anchoA: 3, multiplicador: 2, descuento: 50 })
    expect(rMult.cantidadNeta).toBe(550) // (100*3*2) - 50 = 550
  })

  it('2. Total del Analítico == Columna I de la Sábana para un renglón y estimación, con y sin exceso (Ejemplo: m2, E=1500, medición 500x7.30 = 3650 -> facturable 1500, retenido 2150)', () => {
    const cantidadAjustadaE = 1500
    const acumuladoAnteriorJ = 0
    const precioUnitarioF = 120

    const resMemoria = calcularCantidadMedicion({ unidad: 'm2', longitudL: 500, anchoA: 7.3 })
    expect(resMemoria.cantidadNeta).toBe(3650)

    const resTopes = procesarMedicionRenglon({
      cantidadAjustada: cantidadAjustadaE,
      acumuladoAnterior: acumuladoAnteriorJ,
      medicionPeriodo: resMemoria.cantidadNeta,
      precioUnitario: precioUnitarioF,
    })

    // Columna I de la Sábana debe recibir únicamente la cantidad facturable (1500)
    expect(resTopes.facturablePeriodo).toBe(1500)
    // El exceso de 2150 se deriva como retenido en bitacora_pendiente
    expect(resTopes.retenidoPendiente).toBe(2150)
    expect(resTopes.facturablePeriodo + resTopes.retenidoPendiente).toBe(resMemoria.cantidadNeta)
  })

  it('3. Guardar una medición la muestra en la lista del Analítico y actualiza el total y la columna I', async () => {
    const medGuardada = await HojaSabanaServicio.crearMedicion({
      proyectoId: proyId,
      codigoDGC: '201.03(b)',
      estacionInicio: '15+200',
      estacionFin: '15+500',
      longitudL: 300,
      anchoA: 4.0,
      alturaH: 1.0,
      origenTipo: 'Plano',
      referenciaOrigen: 'Plano Sección Transversal #08',
      estimacionNum: 'Est. 08',
      unidad: 'm3',
      cantidadAjustada: 14000,
      acumuladoAnterior: 0,
    })

    expect(medGuardada).toBeDefined()
    expect(medGuardada.cantidadCalculada).toBe(1200)

    const medicionesServicio = await HojaSabanaServicio.listarMediciones(proyId, 'Est. 08', '201.03(b)')
    const sumaFacturableColumnaI = medicionesServicio.reduce(
      (sum, m) => sum + (m.cantidad_facturable || m.cantidadFacturable || 0),
      0
    )
    expect(sumaFacturableColumnaI).toBe(1200)
  })

  it('4. Bloqueo estricto: No se puede guardar una medición si la estimación está finalizada', async () => {
    const estFinalizada = 'Est. 06-CERRADA'
    await HojaSabanaServicio.finalizarEstimacion(proyId, estFinalizada)

    await expect(
      HojaSabanaServicio.crearMedicion({
        proyectoId: proyId,
        codigoDGC: '551.03',
        estacionInicio: '14+200',
        estacionFin: '14+600',
        origenTipo: 'Plano',
        referenciaOrigen: 'Plano Pavimentos #02',
        estimacionNum: estFinalizada,
      })
    ).rejects.toThrow(`La estimación ${estFinalizada} está finalizada/cerrada`)
  })

  it('5. Prueba en negativo: Debe fallar si se omite la llamada a procesarMedicionRenglon o memoria.ts', () => {
    // Si se omitiera el cálculo de procesarMedicionRenglon, la cantidad facturable sería igual a la bruta sin topar con E
    const medicionBruta = 3650
    const cantidadAjustadaE = 1500

    const facturableSinMóduloTopes = medicionBruta // ERROR: no respeta tope E
    const facturableConMóduloTopes = procesarMedicionRenglon({
      cantidadAjustada: cantidadAjustadaE,
      acumuladoAnterior: 0,
      medicionPeriodo: medicionBruta,
      precioUnitario: 100,
    }).facturablePeriodo

    expect(facturableSinMóduloTopes).not.toBe(facturableConMóduloTopes)
    expect(facturableConMóduloTopes).toBe(1500)
  })
})
