"use strict";
/**
 * MÓDULO PURO DE CÁLCULO FINANCIERO Y LIQUIDACIÓN — DOMUNNET
 * Fuente Única de Verdad (Single Source of Truth)
 * Importa redondearCentavos desde redondeo.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcularLiquidacionEstimacion = calcularLiquidacionEstimacion;
const redondeo_ts_1 = require("./redondeo.ts");
function calcularLiquidacionEstimacion(params) {
    if (params.anticipoRecibidoTotal === undefined || params.anticipoRecibidoTotal === null || typeof params.anticipoRecibidoTotal !== 'number') {
        throw new Error('anticipoRecibidoTotal es obligatorio para calcular la liquidación.');
    }
    const { montoDirectoPeriodo, porcentajeIndirectos, porcentajeIva, montoRenglonGlobal, excluirIndirectosIvaGlobal, porcentajeAmortizacionAnticipo, porcentajeRetencionGarantia = 0, anticipoRecibidoTotal, anticipoAmortizadoAnterior = 0, } = params;
    // 1. Indirectos aplicados sobre el costo directo (y global si no se excluye)
    const baseIndirectos = excluirIndirectosIvaGlobal
        ? montoDirectoPeriodo
        : montoDirectoPeriodo + montoRenglonGlobal;
    const indirectos = (0, redondeo_ts_1.redondearCentavos)(baseIndirectos * (porcentajeIndirectos / 100));
    // 2. Base imponible para IVA
    const baseIva = excluirIndirectosIvaGlobal
        ? montoDirectoPeriodo + indirectos
        : montoDirectoPeriodo + indirectos + montoRenglonGlobal;
    // 3. IVA aplicado sobre la base imponible
    const iva = (0, redondeo_ts_1.redondearCentavos)(baseIva * (porcentajeIva / 100));
    // 4. Valor total de la estimación (con IVA y renglones globales)
    const valorTotalEstimacion = (0, redondeo_ts_1.redondearCentavos)(montoDirectoPeriodo + indirectos + iva + montoRenglonGlobal);
    // 5. Amortización de anticipo (sobre el total con IVA)
    const amortizacionTeorica = (0, redondeo_ts_1.redondearCentavos)(valorTotalEstimacion * (porcentajeAmortizacionAnticipo / 100));
    const saldoAnticipoPrevio = Math.max(0, (0, redondeo_ts_1.redondearCentavos)(anticipoRecibidoTotal - anticipoAmortizadoAnterior));
    const amortizacionPeriodo = Math.min(amortizacionTeorica, saldoAnticipoPrevio);
    const saldoAnticipoRemanente = (0, redondeo_ts_1.redondearCentavos)(saldoAnticipoPrevio - amortizacionPeriodo);
    // 6. Retención de garantía
    const retencionGarantia = (0, redondeo_ts_1.redondearCentavos)(valorTotalEstimacion * (porcentajeRetencionGarantia / 100));
    // 7. Total neto a favor del contratista
    const totalAFavorContratista = (0, redondeo_ts_1.redondearCentavos)(valorTotalEstimacion - amortizacionPeriodo - retencionGarantia);
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
//# sourceMappingURL=liquidacion.js.map