import { describe, it, expect } from 'vitest';
import { procesarMedicionRenglon, obtenerAcumuladoAnteriorGuardado } from './topes';

describe('Módulo de Control de Topes y Sobreejecución (topes.ts)', () => {
  it('CASO 3: Tope de sobreejecución básico (E=1000, K=1200 -> facturable 1000, retenido 200)', () => {
    const res = procesarMedicionRenglon({
      cantidadAjustada: 1000,
      acumuladoAnterior: 0,
      medicionPeriodo: 1200,
      precioUnitario: 50,
    });

    expect(res.facturablePeriodo).toBe(1000);
    expect(res.retenidoPendiente).toBe(200);
    expect(res.estado).toBe('Sobreejecutado');
  });

  it('CASO 4: Protección contra división por cero (E=0, K=0)', () => {
    const res = procesarMedicionRenglon({
      cantidadAjustada: 0,
      acumuladoAnterior: 0,
      medicionPeriodo: 0,
      precioUnitario: 50,
    });

    expect(res.porcentajeAvance).toBe(0.00);
    expect(res.facturablePeriodo).toBe(0.00);
  });

  it('CASO 5: Tope acumulado (E=1000, J=900, Medición I=200 -> facturable 100, retenido 100)', () => {
    const res = procesarMedicionRenglon({
      cantidadAjustada: 1000,
      acumuladoAnterior: 900,
      medicionPeriodo: 200,
      precioUnitario: 45,
    });

    expect(res.facturablePeriodo).toBe(100);
    expect(res.retenidoPendiente).toBe(100);
    expect(res.estado).toBe('Sobreejecutado');
    expect(res.porcentajeAvance).toBe(100.00);
  });

  it('CASO 6: E=0 con medición I > 0 (E=0, Medición I=150 -> todo a pendientes)', () => {
    const res = procesarMedicionRenglon({
      cantidadAjustada: 0,
      acumuladoAnterior: 0,
      medicionPeriodo: 150,
      precioUnitario: 100,
    });

    expect(res.facturablePeriodo).toBe(0);
    expect(res.retenidoPendiente).toBe(150);
    expect(res.porcentajeAvance).toBe(0.00);
    expect(res.estado).toBe('Sobreejecutado');
  });

  it('CASO 8: Liberación de pendientes vía modificativo / adenda', () => {
    const previa = procesarMedicionRenglon({
      cantidadAjustada: 1000,
      acumuladoAnterior: 1000,
      medicionPeriodo: 100,
      precioUnitario: 50,
    });
    expect(previa.retenidoPendiente).toBe(100);

    const nuevaCantidadAjustada = 1000 + 200;

    const posterior = procesarMedicionRenglon({
      cantidadAjustada: nuevaCantidadAjustada,
      acumuladoAnterior: 1000,
      medicionPeriodo: previa.retenidoPendiente,
      precioUnitario: 50,
    });

    expect(posterior.facturablePeriodo).toBe(100);
    expect(posterior.retenidoPendiente).toBe(0);
    expect(posterior.estado).toBe('Normal');
  });

  it('CASO 9 (Inmutabilidad Real): El acumulado anterior N debe leerse del historial guardado', () => {
    const historialGuardado = [
      {
        renglonId: 'RENG-001',
        numeroEstimacion: 1,
        cantidadAcumuladaGuardada: 500.0,
        montoAcumuladoGuardado: 25000.0, // Calculado en su momento a Q50/unidad
      },
    ];

    // Simular que el precio unitario del catálogo cambia a Q65 en la Estimación 2
    const nuevoPrecioCatalogo = 65.0;

    const datosAnteriores = obtenerAcumuladoAnteriorGuardado('RENG-001', 2, historialGuardado);

    // El monto acumulado N leído del historial DEBE ser Q25,000.00 inmutable
    expect(datosAnteriores.montoAcumulado).toBe(25000.0);
    // Verificar que N NO se recalcula con el precio del catálogo nuevo (500 * 65 = 32,500)
    expect(datosAnteriores.montoAcumulado).not.toBe(datosAnteriores.cantidadAcumulada * nuevoPrecioCatalogo);
  });

  it('Caso de Borde: Medición Negativa (Ajustes / Descuentos / Notas de crédito)', () => {
    const res = procesarMedicionRenglon({
      cantidadAjustada: 1000,
      acumuladoAnterior: 500,
      medicionPeriodo: -100,
      precioUnitario: 50,
    });

    expect(res.facturablePeriodo).toBe(-100);
    expect(res.montoFacturablePeriodo).toBe(-5000);
    expect(res.retenidoPendiente).toBe(0);
    expect(res.porcentajeAvance).toBe(40.00); // (500 - 100) / 1000 * 100
  });

  it('Caso de Borde: E menor que lo ya pagado anterior (J > E por adenda de reducción de alcance)', () => {
    const res = procesarMedicionRenglon({
      cantidadAjustada: 800, // Se redujo el alcance de 1000 a 800
      acumuladoAnterior: 900, // Ya se habían pagado 900 anteriormente
      medicionPeriodo: 50,
      precioUnitario: 50,
    });

    expect(res.facturablePeriodo).toBe(0);
    expect(res.retenidoPendiente).toBe(50);
    expect(res.estado).toBe('Sobreejecutado');
  });
});
