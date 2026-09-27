import { describe, it, expect } from 'vitest';
import {
  calcularLongitudEstaciones,
  parseEstacionAMetros,
  calcularCantidadMedicion,
  obtenerDimensionesRequeridas,
} from './memoria.ts';

describe('Módulo de Memoria de Cálculo (memoria.ts)', () => {
  it('debe parsear estaciones en formato km+m y calcular distancias cruzando kilómetros', () => {
    expect(parseEstacionAMetros('14+700')).toBe(14700);
    expect(parseEstacionAMetros('15+100')).toBe(15100);
    expect(calcularLongitudEstaciones('14+700', '15+100')).toBe(400);
    expect(calcularLongitudEstaciones('14+200', '14+700')).toBe(500);
  });

  it('debe calcular cantidad según la unidad del catálogo (m2 -> L*A, m3 -> L*A*H, m -> L, Glb -> 1/directo)', () => {
    // 1D: m
    const res1D = calcularCantidadMedicion({ unidad: 'm', longitudL: 400 });
    expect(res1D.cantidadNeta).toBe(400);

    // 2D: m2
    const res2D = calcularCantidadMedicion({ unidad: 'm2', longitudL: 500, anchoA: 7.3 });
    expect(res2D.cantidadNeta).toBe(3650);

    // 3D: m3
    const res3D = calcularCantidadMedicion({ unidad: 'm3', longitudL: 500, anchoA: 7.3, alturaH: 0.95 });
    expect(res3D.cantidadNeta).toBe(3467.5);

    // Conteo / Glb
    const resGlb = calcularCantidadMedicion({ unidad: 'Glb', cantidadDirecta: 0.25 });
    expect(resGlb.cantidadNeta).toBe(0.25);
  });

  it('debe aplicar multiplicadores y descuentos técnicos (monto absoluto o factor)', () => {
    // Multiplicador 2 en m2
    const resMult = calcularCantidadMedicion({ unidad: 'm2', longitudL: 100, anchoA: 3, multiplicador: 2 });
    expect(resMult.cantidadNeta).toBe(600); // (100 * 3) * 2

    // Descuento por monto absoluto
    const resDescMonto = calcularCantidadMedicion({
      unidad: 'm3',
      longitudL: 10,
      anchoA: 10,
      alturaH: 2, // 200 m3
      descuento: 50,
      tipoDescuento: 'monto',
    });
    expect(resDescMonto.cantidadNeta).toBe(150); // 200 - 50

    // Descuento por factor (ej. 10%)
    const resDescFactor = calcularCantidadMedicion({
      unidad: 'm3',
      longitudL: 10,
      anchoA: 10,
      alturaH: 2, // 200 m3
      descuento: 0.1,
      tipoDescuento: 'factor',
    });
    expect(resDescFactor.cantidadNeta).toBe(180); // 200 - 20
  });

  it('debe requerir dimensiones según la unidad del catálogo', () => {
    expect(obtenerDimensionesRequeridas('m3')).toEqual({ requiereAncho: true, requiereAltura: true, dimension: '3D' });
    expect(obtenerDimensionesRequeridas('m2')).toEqual({ requiereAncho: true, requiereAltura: false, dimension: '2D' });
    expect(obtenerDimensionesRequeridas('m')).toEqual({ requiereAncho: false, requiereAltura: false, dimension: '1D' });
    expect(obtenerDimensionesRequeridas('Glb')).toEqual({ requiereAncho: false, requiereAltura: false, dimension: 'conteo' });
  });
});
