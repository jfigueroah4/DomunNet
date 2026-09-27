import { describe, it, expect } from 'vitest';
import { calcularLiquidacionEstimacion } from './liquidacion';

describe('Módulo de Liquidación Financiera (liquidacion.ts)', () => {
  it('CASO 1: Liquidación Financiera Base (Q3,158,311.30 a favor del contratista)', () => {
    const res = calcularLiquidacionEstimacion({
      montoDirectoPeriodo: 2163863.69,
      porcentajeIndirectos: 45,
      porcentajeIva: 12,
      montoRenglonGlobal: 433774.49,
      excluirIndirectosIvaGlobal: true,
      porcentajeAmortizacionAnticipo: 20,
      porcentajeRetencionGarantia: 0,
      anticipoRecibidoTotal: 5000000,
    });

    expect(res.indirectos).toBe(973738.66);
    expect(res.iva).toBe(376512.28);
    expect(res.valorTotalEstimacion).toBe(3947889.12);
    expect(res.amortizacionPeriodo).toBe(789577.82);
    expect(res.totalAFavorContratista).toBe(3158311.30);
  });

  it('CASO 2: Verificación del flag excluirIndirectosIvaGlobal = false', () => {
    const res = calcularLiquidacionEstimacion({
      montoDirectoPeriodo: 2163863.69,
      porcentajeIndirectos: 45,
      porcentajeIva: 12,
      montoRenglonGlobal: 433774.49,
      excluirIndirectosIvaGlobal: false,
      porcentajeAmortizacionAnticipo: 20,
      porcentajeRetencionGarantia: 0,
      anticipoRecibidoTotal: 5000000,
    });

    expect(res.valorTotalEstimacion).toBe(4218564.40);
    expect(res.amortizacionPeriodo).toBe(843712.88);
    expect(res.totalAFavorContratista).toBe(3374851.52);
  });

  it('CASO 7: Anticipo en 3 estimaciones seguidas (consistencia de amortizaciones y saldos remanentes)', () => {
    const anticipoTotal = 1000000;
    let amortizadoAcumulado = 0;

    // Estimación 1
    const est1 = calcularLiquidacionEstimacion({
      montoDirectoPeriodo: 2000000,
      porcentajeIndirectos: 0,
      porcentajeIva: 0,
      montoRenglonGlobal: 0,
      excluirIndirectosIvaGlobal: true,
      porcentajeAmortizacionAnticipo: 20,
      anticipoRecibidoTotal: anticipoTotal,
      anticipoAmortizadoAnterior: amortizadoAcumulado,
    });
    expect(est1.amortizacionPeriodo).toBe(400000);
    expect(est1.saldoAnticipoRemanente).toBe(600000);
    amortizadoAcumulado += est1.amortizacionPeriodo;

    // Estimación 2
    const est2 = calcularLiquidacionEstimacion({
      montoDirectoPeriodo: 1500000,
      porcentajeIndirectos: 0,
      porcentajeIva: 0,
      montoRenglonGlobal: 0,
      excluirIndirectosIvaGlobal: true,
      porcentajeAmortizacionAnticipo: 20,
      anticipoRecibidoTotal: anticipoTotal,
      anticipoAmortizadoAnterior: amortizadoAcumulado,
    });
    expect(est2.amortizacionPeriodo).toBe(300000);
    expect(est2.saldoAnticipoRemanente).toBe(300000);
    amortizadoAcumulado += est2.amortizacionPeriodo;

    // Estimación 3: Amortización teórica sería 400,000, pero solo quedan 300,000 disponibles
    const est3 = calcularLiquidacionEstimacion({
      montoDirectoPeriodo: 2000000,
      porcentajeIndirectos: 0,
      porcentajeIva: 0,
      montoRenglonGlobal: 0,
      excluirIndirectosIvaGlobal: true,
      porcentajeAmortizacionAnticipo: 20,
      anticipoRecibidoTotal: anticipoTotal,
      anticipoAmortizadoAnterior: amortizadoAcumulado,
    });
    expect(est3.amortizacionPeriodo).toBe(300000);
    expect(est3.saldoAnticipoRemanente).toBe(0);
    amortizadoAcumulado += est3.amortizacionPeriodo;

    expect(amortizadoAcumulado).toBe(anticipoTotal);
  });

  it('Caso de Borde: anticipoRecibidoTotal ausente o undefined debe lanzar un Error explícito', () => {
    expect(() => {
      // @ts-expect-error probando valor faltante en tiempo de ejecución
      calcularLiquidacionEstimacion({
        montoDirectoPeriodo: 1000,
        porcentajeIndirectos: 10,
        porcentajeIva: 12,
        montoRenglonGlobal: 0,
        excluirIndirectosIvaGlobal: true,
        porcentajeAmortizacionAnticipo: 10,
      });
    }).toThrow('anticipoRecibidoTotal es obligatorio para calcular la liquidación.');
  });

  it('Caso de Borde: Anticipo totalmente agotado en estimaciones previas', () => {
    const res = calcularLiquidacionEstimacion({
      montoDirectoPeriodo: 100000,
      porcentajeIndirectos: 0,
      porcentajeIva: 0,
      montoRenglonGlobal: 0,
      excluirIndirectosIvaGlobal: true,
      porcentajeAmortizacionAnticipo: 20,
      anticipoRecibidoTotal: 50000,
      anticipoAmortizadoAnterior: 50000, // Ya totalmente amortizado
    });

    expect(res.amortizacionPeriodo).toBe(0);
    expect(res.saldoAnticipoRemanente).toBe(0);
    expect(res.totalAFavorContratista).toBe(100000);
  });
});
