/**
 * MÓDULO PURO DE CÁLCULO FINANCIERO Y LIQUIDACIÓN — DOMUNNET
 * Fuente Única de Verdad (Single Source of Truth)
 * Importa redondearCentavos desde redondeo.ts
 */

import { redondearCentavos } from './redondeo';

export interface ParametrosLiquidacion {
  montoDirectoPeriodo: number;
  porcentajeIndirectos: number;
  porcentajeIva: number;
  montoRenglonGlobal: number;
  excluirIndirectosIvaGlobal: boolean;
  porcentajeAmortizacionAnticipo: number;
  porcentajeRetencionGarantia?: number;
  anticipoRecibidoTotal: number;
  anticipoAmortizadoAnterior?: number;
}

export interface ResultadoLiquidacion {
  indirectos: number;
  iva: number;
  valorTotalEstimacion: number;
  amortizacionPeriodo: number;
  retencionGarantia: number;
  totalAFavorContratista: number;
  saldoAnticipoRemanente: number;
}

export function calcularLiquidacionEstimacion(params: ParametrosLiquidacion): ResultadoLiquidacion {
  if (params.anticipoRecibidoTotal === undefined || params.anticipoRecibidoTotal === null || typeof params.anticipoRecibidoTotal !== 'number') {
    throw new Error('anticipoRecibidoTotal es obligatorio para calcular la liquidación.');
  }

  const {
    montoDirectoPeriodo,
    porcentajeIndirectos,
    porcentajeIva,
    montoRenglonGlobal,
    excluirIndirectosIvaGlobal,
    porcentajeAmortizacionAnticipo,
    porcentajeRetencionGarantia = 0,
    anticipoRecibidoTotal,
    anticipoAmortizadoAnterior = 0,
  } = params;

  // 1. Indirectos aplicados sobre el costo directo (y global si no se excluye)
  const baseIndirectos = excluirIndirectosIvaGlobal
    ? montoDirectoPeriodo
    : montoDirectoPeriodo + montoRenglonGlobal;
  const indirectos = redondearCentavos(baseIndirectos * (porcentajeIndirectos / 100));

  // 2. Base imponible para IVA
  const baseIva = excluirIndirectosIvaGlobal
    ? montoDirectoPeriodo + indirectos
    : montoDirectoPeriodo + indirectos + montoRenglonGlobal;

  // 3. IVA aplicado sobre la base imponible
  const iva = redondearCentavos(baseIva * (porcentajeIva / 100));

  // 4. Valor total de la estimación (con IVA y renglones globales)
  const valorTotalEstimacion = redondearCentavos(
    montoDirectoPeriodo + indirectos + iva + montoRenglonGlobal
  );

  // 5. Amortización de anticipo (sobre el total con IVA)
  const amortizacionTeorica = redondearCentavos(
    valorTotalEstimacion * (porcentajeAmortizacionAnticipo / 100)
  );

  const saldoAnticipoPrevio = Math.max(0, redondearCentavos(anticipoRecibidoTotal - anticipoAmortizadoAnterior));
  const amortizacionPeriodo = Math.min(amortizacionTeorica, saldoAnticipoPrevio);
  const saldoAnticipoRemanente = redondearCentavos(saldoAnticipoPrevio - amortizacionPeriodo);

  // 6. Retención de garantía
  const retencionGarantia = redondearCentavos(
    valorTotalEstimacion * (porcentajeRetencionGarantia / 100)
  );

  // 7. Total neto a favor del contratista
  const totalAFavorContratista = redondearCentavos(
    valorTotalEstimacion - amortizacionPeriodo - retencionGarantia
  );

  return {
    indirectos,
    iva,
    valorTotalEstimacion,
    amortizacionPeriodo,
    retencionGarantia,
    totalAFavorContratista,
    saldoAnticipoRemanente,
  };
}
