/**
 * MÓDULO PURO DE CÁLCULO DE PLAZOS Y SUSPENSIONES — DOMUNNET
 * Fuente Única de Verdad (Single Source of Truth)
 */
export interface RangoSuspension {
    fecha_inicio: Date | string;
    fecha_fin: Date | string;
}
export declare function calcularDiasSuspendidosUnicos(suspensiones: RangoSuspension[], maxFechaCorte?: Date | string, fechaInicioProyecto?: Date | string): number;
export declare function fechaFinActualizada(params: {
    fechaInicio: Date | string;
    plazoContractual: number;
    suspensiones?: RangoSuspension[];
}): Date;
export declare function diasEmpleados(params: {
    fechaInicio: Date | string;
    plazoContractual: number;
    fechaCorte: Date | string;
    suspensiones?: RangoSuspension[];
}): number;
export declare function diasPorEmplearse(params: {
    fechaInicio: Date | string;
    plazoContractual: number;
    fechaCorte: Date | string;
    suspensiones?: RangoSuspension[];
}): number;
//# sourceMappingURL=plazos.d.ts.map