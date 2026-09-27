"use strict";
/**
 * MÓDULO PURO DE CONTROL DE TOPES Y SOBREEJECUCIÓN (K <= E) — DOMUNNET
 * Fuente Única de Verdad (Single Source of Truth)
 * Importa redondearCentavos y redondearCuatroDecimales desde redondeo.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.procesarMedicionRenglon = procesarMedicionRenglon;
exports.obtenerAcumuladoAnteriorGuardado = obtenerAcumuladoAnteriorGuardado;
const redondeo_ts_1 = require("./redondeo.ts");
function procesarMedicionRenglon(params) {
    const { cantidadAjustada, acumuladoAnterior, medicionPeriodo, precioUnitario } = params;
    const acumuladoPrevio = acumuladoAnterior || 0;
    // Regla para Mediciones Negativas (Ajustes / Notas de crédito)
    if (medicionPeriodo < 0) {
        const facturablePeriodo = medicionPeriodo;
        const retenidoPendiente = 0;
        const montoFacturablePeriodo = (0, redondeo_ts_1.redondearCentavos)(facturablePeriodo * precioUnitario);
        const nuevoAcumulado = acumuladoPrevio + facturablePeriodo;
        const porcentajeAvance = cantidadAjustada > 0
            ? (0, redondeo_ts_1.redondearCentavos)((nuevoAcumulado / cantidadAjustada) * 100)
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
    const montoFacturablePeriodo = (0, redondeo_ts_1.redondearCentavos)(facturablePeriodo * precioUnitario);
    const avanceTotalUnidades = acumuladoPrevio + facturablePeriodo;
    const porcentajeAvance = cantidadAjustada > 0
        ? (0, redondeo_ts_1.redondearCentavos)((avanceTotalUnidades / cantidadAjustada) * 100)
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
function obtenerAcumuladoAnteriorGuardado(renglonId, estimacionActualNumero, historialEstimaciones) {
    const estimacionPrevia = historialEstimaciones.find((e) => e.renglonId === renglonId && e.numeroEstimacion === estimacionActualNumero - 1);
    if (!estimacionPrevia) {
        return { cantidadAcumulada: 0, montoAcumulado: 0 };
    }
    // Se retorna el monto histórico guardado N en lugar de recalcularlo con el precio del catálogo actual
    return {
        cantidadAcumulada: estimacionPrevia.cantidadAcumuladaGuardada,
        montoAcumulado: estimacionPrevia.montoAcumuladoGuardado,
    };
}
//# sourceMappingURL=topes.js.map