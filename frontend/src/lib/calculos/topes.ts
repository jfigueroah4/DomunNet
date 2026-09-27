/**
 * MÓDULO PURO DE CONTROL DE TOPES Y SOBREEJECUCIÓN (K <= E) — DOMUNNET
 * Fuente Única de Verdad (Single Source of Truth)
 * Importa redondearCentavos y redondearCuatroDecimales desde redondeo.ts
 */

import { redondearCentavos } from './redondeo';

export interface ParametrosProcesamientoRenglon {
  cantidadAjustada: number; // E
  acumuladoAnterior: number; // J
  medicionPeriodo: number; // I
  precioUnitario: number; // F
}

export interface ResultadoProcesamientoRenglon {
  facturablePeriodo: number;
  retenidoPendiente: number;
  montoFacturablePeriodo: number;
  porcentajeAvance: number;
  estado: 'Normal' | 'Sobreejecutado';
}

export function procesarMedicionRenglon(params: ParametrosProcesamientoRenglon): ResultadoProcesamientoRenglon {
  const { cantidadAjustada, acumuladoAnterior, medicionPeriodo, precioUnitario } = params;

  const acumuladoPrevio = acumuladoAnterior || 0;

  // Regla para Mediciones Negativas (Ajustes / Notas de crédito)
  if (medicionPeriodo < 0) {
    const facturablePeriodo = medicionPeriodo;
    const retenidoPendiente = 0;
    const montoFacturablePeriodo = redondearCentavos(facturablePeriodo * precioUnitario);
    const nuevoAcumulado = acumuladoPrevio + facturablePeriodo;
    const porcentajeAvance = cantidadAjustada > 0
      ? redondearCentavos((nuevoAcumulado / cantidadAjustada) * 100)
      : 0;

    return {
      facturablePeriodo,
      retenidoPendiente,
      montoFacturablePeriodo,
      porcentajeAvance,
      estado: 'Normal',
    };
  }

  // Capacidad disponible respetando la cantidad ajustada E
  const disponible = Math.max(0, cantidadAjustada - acumuladoPrevio);

  // Tope estricto de facturación: no permite cobrar por encima de la cantidad ajustada E
  const facturablePeriodo = Math.min(medicionPeriodo, disponible);
  
  // El exceso se deriva a la cola de retenidos (bitacora_pendiente)
  const retenidoPendiente = Math.max(0, medicionPeriodo - facturablePeriodo);

  const montoFacturablePeriodo = redondearCentavos(facturablePeriodo * precioUnitario);

  const avanceTotalUnidades = acumuladoPrevio + facturablePeriodo;
  const porcentajeAvance = cantidadAjustada > 0
    ? redondearCentavos((avanceTotalUnidades / cantidadAjustada) * 100)
    : 0;

  const estado = (retenidoPendiente > 0 || (acumuladoPrevio > cantidadAjustada)) ? 'Sobreejecutado' : 'Normal';

  return {
    facturablePeriodo,
    retenidoPendiente,
    montoFacturablePeriodo,
    porcentajeAvance,
    estado,
  };
}

/**
 * Función para obtener el monto acumulado anterior guardado (N) desde el historial de estimaciones.
 * Garantiza la INMUTABILIDAD del histórico N frente a cambios posteriores en precio unitario.
 */
export interface RegistroEstimacionHistorial {
  renglonId: string;
  numeroEstimacion: number;
  montoAcumuladoGuardado: number;
  cantidadAcumuladaGuardada: number;
}

export function obtenerAcumuladoAnteriorGuardado(
  renglonId: string,
  estimacionActualNumero: number,
  historialEstimaciones: RegistroEstimacionHistorial[]
): { cantidadAcumulada: number; montoAcumulado: number } {
  const estimacionPrevia = historialEstimaciones.find(
    (e) => e.renglonId === renglonId && e.numeroEstimacion === estimacionActualNumero - 1
  );

  if (!estimacionPrevia) {
    return { cantidadAcumulada: 0, montoAcumulado: 0 };
  }

  // Se retorna el monto histórico guardado N en lugar de recalcularlo con el precio del catálogo actual
  return {
    cantidadAcumulada: estimacionPrevia.cantidadAcumuladaGuardada,
    montoAcumulado: estimacionPrevia.montoAcumuladoGuardado,
  };
}
