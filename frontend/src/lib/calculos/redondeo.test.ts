import { describe, it, expect } from 'vitest';
import { redondearCentavos, redondearCuatroDecimales } from './redondeo';
import Decimal from 'decimal.js';

describe('Módulo de Redondeo y Precisión Decimal (redondeo.ts)', () => {
  it('Prueba de precisión 1: 1259322.90 x 45% debe ser exactamente 566695.31', () => {
    const val = 1259322.90 * 0.45; // Raw JS floating point calculation
    const redondeado = redondearCentavos(val);
    expect(redondeado).toBe(566695.31);
  });

  it('Prueba de precisión 2: 2419893.90 x 45% debe ser exactamente 1088952.26', () => {
    const val = 2419893.90 * 0.45;
    const redondeado = redondearCentavos(val);
    expect(redondeado).toBe(1088952.26);
  });

  it('Prueba de Propiedad: 10,000 montos aleatorios comparados contra Decimal.js (0 discrepancias)', () => {
    let discrepancias = 0;
    const TOTAL_PRUEBAS = 10000;

    for (let i = 0; i < TOTAL_PRUEBAS; i++) {
      // Generar valores numéricos aleatorios positivos y negativos con decimales variados
      const signo = Math.random() < 0.5 ? -1 : 1;
      const entero = Math.floor(Math.random() * 10000000);
      const decimales = Math.random();
      const val = signo * (entero + decimales);

      // Referencia de precisión arbitraria exacta vía Decimal.js
      const refExacta = new Decimal(val).mul(100).round().div(100).toNumber();
      const resultadoRedondeo = redondearCentavos(val);

      if (Math.abs(resultadoRedondeo - refExacta) > 0.00001) {
        discrepancias++;
        console.error(`Discrepancia en val=${val}: Obtenido=${resultadoRedondeo}, Esperado=${refExacta}`);
      }
    }

    expect(discrepancias).toBe(0);
  });

  it('Redondeo a cuatro decimales', () => {
    expect(redondearCuatroDecimales(12.345678)).toBe(12.3457);
    expect(redondearCuatroDecimales(0.00004)).toBe(0.0000);
  });
});
