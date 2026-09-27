/**
 * MÓDULO PURO DE CONTROL DE TOPES Y SOBREEJECUCIÓN (K <= E) — DOMUNNET
 * Fuente Única de Verdad (Single Source of Truth)
 * Importa redondearCentavos y redondearCuatroDecimales desde redondeo.ts
 */
export interface ParametrosProcesamientoRenglon {
    cantidadAjustada: number;
    acumuladoAnterior: number;
    medicionPeriodo: number;
    precioUnitario: number;
}
export interface ResultadoProcesamientoRenglon {
    facturablePeriodo: number;
    retenidoPendiente: number;
    montoFacturablePeriodo: number;
    porcentajeAvance: number;
    estado: 'Normal' | 'Sobreejecutado';
}
export declare function procesarMedicionRenglon(params: ParametrosProcesamientoRenglon): ResultadoProcesamientoRenglon;
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
export declare function obtenerAcumuladoAnteriorGuardado(renglonId: string, estimacionActualNumero: number, historialEstimaciones: RegistroEstimacionHistorial[]): {
    cantidadAcumulada: number;
    montoAcumulado: number;
};
//# sourceMappingURL=topes.d.ts.map