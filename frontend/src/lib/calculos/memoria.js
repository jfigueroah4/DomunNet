"use strict";
/**
 * MÓDULO PURO DE CÁLCULO DE MEMORIA DE CÁLCULO / MEDIDAS (ANALÍTICO) — DOMUNNET
 * Fuente Única de Verdad (Single Source of Truth)
 * Importa redondearCentavos desde redondeo.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseEstacionAMetros = parseEstacionAMetros;
exports.calcularLongitudEstaciones = calcularLongitudEstaciones;
exports.obtenerDimensionesRequeridas = obtenerDimensionesRequeridas;
exports.calcularCantidadMedicion = calcularCantidadMedicion;
const redondeo_ts_1 = require("./redondeo.ts");
/**
 * Parsea estaciones en formato km+m (ej. "14+700", "15+100", "14.2", 14200) y calcula la distancia en metros.
 */
function parseEstacionAMetros(estacion) {
    if (typeof estacion === 'number')
        return Math.max(0, estacion);
    if (!estacion || typeof estacion !== 'string')
        return 0;
    const str = estacion.trim();
    if (str.includes('+')) {
        const parts = str.split('+');
        const km = parseFloat(parts[0]) || 0;
        const m = parseFloat(parts[1]) || 0;
        return Math.max(0, km * 1000 + m);
    }
    const num = parseFloat(str);
    if (isNaN(num))
        return 0;
    return Math.max(0, num);
}
/**
 * Calcula la longitud en metros entre dos estaciones en formato km+m.
 */
function calcularLongitudEstaciones(estacionInicio, estacionFin) {
    const mInicio = parseEstacionAMetros(estacionInicio);
    const mFin = parseEstacionAMetros(estacionFin);
    if (mFin < mInicio)
        return 0;
    return (0, redondeo_ts_1.redondearCentavos)(mFin - mInicio);
}
/**
 * Normaliza la unidad de medida según el catálogo oficial DGC.
 */
function obtenerDimensionesRequeridas(unidad) {
    const u = (unidad || '').toLowerCase().trim();
    if (['m3', 'm³', 'metro cubico', 'metro cúbico'].includes(u)) {
        return { requiereAncho: true, requiereAltura: true, dimension: '3D' };
    }
    if (['m2', 'm²', 'metro cuadrado', 'ha', 'hectarea'].includes(u)) {
        return { requiereAncho: true, requiereAltura: false, dimension: '2D' };
    }
    if (['m', 'ml', 'm.l.', 'metro', 'metro lineal'].includes(u)) {
        return { requiereAncho: false, requiereAltura: false, dimension: '1D' };
    }
    return { requiereAncho: false, requiereAltura: false, dimension: 'conteo' };
}
/**
 * Calcula la cantidad calculada bruta, descuentos y neta facturable según la unidad del catálogo y dimensiones.
 */
function calcularCantidadMedicion(params) {
    const { unidad, longitudL = 0, anchoA = 0, alturaH = 0, multiplicador = 1, descuento = 0, tipoDescuento = 'monto', cantidadDirecta, } = params;
    const mult = multiplicador > 0 ? multiplicador : 1;
    const dim = obtenerDimensionesRequeridas(unidad);
    let baseBruta = 0;
    let formulaAplicada = '';
    if (cantidadDirecta !== undefined && cantidadDirecta !== null && cantidadDirecta > 0) {
        baseBruta = cantidadDirecta;
        formulaAplicada = `Valor directo plano/libreta (${baseBruta})`;
    }
    else {
        switch (dim.dimension) {
            case '3D':
                baseBruta = (longitudL || 0) * (anchoA || 0) * (alturaH || 0);
                formulaAplicada = `L (${longitudL}) × A (${anchoA}) × H (${alturaH})`;
                break;
            case '2D':
                baseBruta = (longitudL || 0) * (anchoA || 0);
                formulaAplicada = `L (${longitudL}) × A (${anchoA})`;
                break;
            case '1D':
                baseBruta = longitudL || 0;
                formulaAplicada = `Longitud L (${longitudL})`;
                break;
            case 'conteo':
            default:
                baseBruta = longitudL > 0 ? longitudL : 1;
                formulaAplicada = `Conteo / Unidad (${baseBruta})`;
                break;
        }
    }
    const cantidadBruta = (0, redondeo_ts_1.redondearCentavos)(baseBruta * mult);
    let descuentoMonto = 0;
    if (descuento > 0) {
        if (tipoDescuento === 'factor') {
            descuentoMonto = (0, redondeo_ts_1.redondearCentavos)(cantidadBruta * descuento);
        }
        else {
            descuentoMonto = (0, redondeo_ts_1.redondearCentavos)(descuento);
        }
    }
    const cantidadNeta = Math.max(0, (0, redondeo_ts_1.redondearCentavos)(cantidadBruta - descuentoMonto));
    return {
        baseBruta: (0, redondeo_ts_1.redondearCentavos)(baseBruta),
        multiplicador: mult,
        cantidadBruta,
        descuentoMonto,
        cantidadNeta,
        formulaAplicada,
    };
}
//# sourceMappingURL=memoria.js.map