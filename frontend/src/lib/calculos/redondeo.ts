/**
 * MÓDULO PURO DE REDONDEO Y PRECISIÓN DECIMAL — DOMUNNET
 * Fuente Única de Verdad (Single Source of Truth)
 */

export function redondearCentavos(val: number): number {
  if (isNaN(val) || !isFinite(val)) return 0;
  const signo = val < 0 ? -1 : 1;
  return signo * Math.round(Number((Math.abs(val) * 100).toPrecision(15))) / 100;
}

export function redondearCuatroDecimales(val: number): number {
  if (isNaN(val) || !isFinite(val)) return 0;
  const signo = val < 0 ? -1 : 1;
  return signo * Math.round(Number((Math.abs(val) * 10000).toPrecision(15))) / 10000;
}
