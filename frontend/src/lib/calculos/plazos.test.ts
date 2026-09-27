import { describe, it, expect } from 'vitest';
import { fechaFinActualizada, diasEmpleados, diasPorEmplearse, calcularDiasSuspendidosUnicos } from './plazos';

describe('Módulo de Control de Plazos y Suspensiones (plazos.ts)', () => {
  it('CASO 10: Benchmark Control de Plazos (Inicio 22-mar-2023, Plazo 1080, Suspendidos 243)', () => {
    const fechaInicio = '2023-03-22';
    const plazoContractual = 1080;
    const suspensiones = [{ fecha_inicio: '2023-06-01', fecha_fin: '2024-01-29' }]; // 243 días
    const fechaCorte = '2026-04-30';

    const fin = fechaFinActualizada({ fechaInicio, plazoContractual, suspensiones });
    const formatFecha = (d: Date) =>
      `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

    expect(formatFecha(fin)).toBe('03/11/2026');

    const empleados = diasEmpleados({ fechaInicio, plazoContractual, fechaCorte, suspensiones });
    expect(empleados).toBe(893);

    const porEmplearse = diasPorEmplearse({ fechaInicio, plazoContractual, fechaCorte, suspensiones });
    expect(porEmplearse).toBe(187);
  });

  it('Prueba de Suspensiones Traslapadas: Unifica rangos sin doble conteo de días', () => {
    const suspensiones = [
      { fecha_inicio: '2024-05-01', fecha_fin: '2024-05-10' }, // 10 días (1 al 10 de mayo)
      { fecha_inicio: '2024-05-05', fecha_fin: '2024-05-15' }, // 11 días (5 al 15 de mayo)
    ];

    // La unión cubre del 1 al 15 de mayo inclusive = 15 días únicos
    const diasUnicos = calcularDiasSuspendidosUnicos(suspensiones);
    expect(diasUnicos).toBe(15);
  });

  it('Prueba de Suspensión Posterior a la Fecha de Corte: No altera los días empleados del corte actual', () => {
    const fechaInicio = '2025-01-01';
    const plazoContractual = 100;
    const fechaCorte = '2025-01-31'; // 31 días transcurridos
    const suspensiones = [
      { fecha_inicio: '2025-02-15', fecha_fin: '2025-02-28' }, // Ocurre DESPUÉS de la fecha de corte
    ];

    const empleados = diasEmpleados({ fechaInicio, plazoContractual, fechaCorte, suspensiones });
    expect(empleados).toBe(31); // No debe descontar la suspensión futura

    const fin = fechaFinActualizada({ fechaInicio, plazoContractual, suspensiones });
    const formatFecha = (d: Date) =>
      `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    expect(formatFecha(fin)).toBe('24/04/2025'); // 01/01/2025 + 99 + 14 = 24/04/2025
  });
});
