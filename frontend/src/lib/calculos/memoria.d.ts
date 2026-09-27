/**
 * MÓDULO PURO DE CÁLCULO DE MEMORIA DE CÁLCULO / MEDIDAS (ANALÍTICO) — DOMUNNET
 * Fuente Única de Verdad (Single Source of Truth)
 * Importa redondearCentavos desde redondeo.ts
 */
export interface ParametrosEstacion {
    estacionInicio: string;
    estacionFin: string;
}
export interface ParametrosMedicion {
    unidad: string;
    longitudL?: number;
    anchoA?: number;
    alturaH?: number;
    multiplicador?: number;
    descuento?: number;
    tipoDescuento?: 'monto' | 'factor';
    cantidadDirecta?: number;
    origen?: string;
    referenciaOrigen?: string;
}
export interface ResultadoCantidadMedicion {
    baseBruta: number;
    multiplicador: number;
    cantidadBruta: number;
    descuentoMonto: number;
    cantidadNeta: number;
    formulaAplicada: string;
}
/**
 * Parsea estaciones en formato km+m (ej. "14+700", "15+100", "14.2", 14200) y calcula la distancia en metros.
 */
export declare function parseEstacionAMetros(estacion: string | number): number;
/**
 * Calcula la longitud en metros entre dos estaciones en formato km+m.
 */
export declare function calcularLongitudEstaciones(estacionInicio: string, estacionFin: string): number;
/**
 * Normaliza la unidad de medida según el catálogo oficial DGC.
 */
export declare function obtenerDimensionesRequeridas(unidad: string): {
    requiereAncho: boolean;
    requiereAltura: boolean;
    dimension: '1D' | '2D' | '3D' | 'conteo';
};
/**
 * Calcula la cantidad calculada bruta, descuentos y neta facturable según la unidad del catálogo y dimensiones.
 */
export declare function calcularCantidadMedicion(params: ParametrosMedicion): ResultadoCantidadMedicion;
//# sourceMappingURL=memoria.d.ts.map