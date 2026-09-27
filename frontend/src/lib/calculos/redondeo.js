"use strict";
/**
 * MÓDULO PURO DE REDONDEO Y PRECISIÓN DECIMAL — DOMUNNET
 * Fuente Única de Verdad (Single Source of Truth)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.redondearCentavos = redondearCentavos;
exports.redondearCuatroDecimales = redondearCuatroDecimales;
function redondearCentavos(val) {
    if (isNaN(val) || !isFinite(val))
        return 0;
    const signo = val < 0 ? -1 : 1;
    return signo * Math.round(Number((Math.abs(val) * 100).toPrecision(15))) / 100;
}
function redondearCuatroDecimales(val) {
    if (isNaN(val) || !isFinite(val))
        return 0;
    const signo = val < 0 ? -1 : 1;
    return signo * Math.round(Number((Math.abs(val) * 10000).toPrecision(15))) / 10000;
}
//# sourceMappingURL=redondeo.js.map