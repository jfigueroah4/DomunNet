/**
 * MÓDULO PURO DE CÁLCULO FINANCIERO Y LIQUIDACIÓN — DOMUNNET
 * Fuente Única de Verdad (Single Source of Truth)
 * Importa redondearCentavos desde redondeo.ts
 */
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
export declare function calcularLiquidacionEstimacion(params: ParametrosLiquidacion): ResultadoLiquidacion;
//# sourceMappingURL=liquidacion.d.ts.map