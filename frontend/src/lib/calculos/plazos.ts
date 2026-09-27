/**
 * MÓDULO PURO DE CÁLCULO DE PLAZOS Y SUSPENSIONES — DOMUNNET
 * Fuente Única de Verdad (Single Source of Truth)
 */

export interface RangoSuspension {
  fecha_inicio: Date | string;
  fecha_fin: Date | string;
}

function toDate(d: Date | string): Date {
  if (d instanceof Date) return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const str = String(d).trim();
  const clean = str.split('T')[0];
  if (clean.includes('/')) {
    const parts = clean.split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
  }
  const parts = clean.split('-');
  if (parts.length === 3) {
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }
  const parsed = new Date(str);
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function diffDaysInclusive(start: Date, end: Date): number {
  const dStart = toDate(start);
  const dEnd = toDate(end);
  if (dEnd < dStart) return 0;
  const diffMs = dEnd.getTime() - dStart.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

export function calcularDiasSuspendidosUnicos(
  suspensiones: RangoSuspension[],
  maxFechaCorte?: Date | string,
  fechaInicioProyecto?: Date | string
): number {
  if (!suspensiones || suspensiones.length === 0) return 0;

  const minBoundary = fechaInicioProyecto ? toDate(fechaInicioProyecto) : null;
  const maxBoundary = maxFechaCorte ? toDate(maxFechaCorte) : null;

  const rangesClamped: Array<{ start: number; end: number }> = [];

  for (const s of suspensiones) {
    let sStart = toDate(s.fecha_inicio);
    let sEnd = toDate(s.fecha_fin);

    if (sEnd < sStart) continue;

    if (minBoundary && sStart < minBoundary) sStart = minBoundary;
    if (maxBoundary && sEnd > maxBoundary) sEnd = maxBoundary;

    if (sEnd >= sStart && (!maxBoundary || sStart <= maxBoundary) && (!minBoundary || sEnd >= minBoundary)) {
      rangesClamped.push({
        start: sStart.getTime(),
        end: sEnd.getTime(),
      });
    }
  }

  if (rangesClamped.length === 0) return 0;

  rangesClamped.sort((a, b) => a.start - b.start);

  const merged: Array<{ start: number; end: number }> = [];
  let current = rangesClamped[0];
  const msInDay = 1000 * 60 * 60 * 24;

  for (let i = 1; i < rangesClamped.length; i++) {
    const next = rangesClamped[i];
    if (next.start <= current.end + msInDay) {
      current.end = Math.max(current.end, next.end);
    } else {
      merged.push(current);
      current = next;
    }
  }
  merged.push(current);

  let totalDias = 0;
  for (const r of merged) {
    const diffMs = r.end - r.start;
    totalDias += Math.round(diffMs / msInDay) + 1;
  }

  return totalDias;
}

export function fechaFinActualizada(params: {
  fechaInicio: Date | string;
  plazoContractual: number;
  suspensiones?: RangoSuspension[];
}): Date {
  const inicio = toDate(params.fechaInicio);
  const diasSuspendidosTotales = calcularDiasSuspendidosUnicos(params.suspensiones || [], undefined, inicio);
  const totalDiasSumar = (params.plazoContractual - 1) + diasSuspendidosTotales;
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + totalDiasSumar);
  return fin;
}

export function diasEmpleados(params: {
  fechaInicio: Date | string;
  plazoContractual: number;
  fechaCorte: Date | string;
  suspensiones?: RangoSuspension[];
}): number {
  const inicio = toDate(params.fechaInicio);
  const corte = toDate(params.fechaCorte);
  if (corte < inicio) return 0;

  const diasCalendarioTranscurridos = diffDaysInclusive(inicio, corte);
  const diasSuspendidosHastaCorte = calcularDiasSuspendidosUnicos(params.suspensiones || [], corte, inicio);

  return Math.max(0, diasCalendarioTranscurridos - diasSuspendidosHastaCorte);
}

export function diasPorEmplearse(params: {
  fechaInicio: Date | string;
  plazoContractual: number;
  fechaCorte: Date | string;
  suspensiones?: RangoSuspension[];
}): number {
  const empleados = diasEmpleados(params);
  return Math.max(0, params.plazoContractual - empleados);
}
