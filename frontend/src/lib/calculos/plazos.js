"use strict";
/**
 * MÓDULO PURO DE CÁLCULO DE PLAZOS Y SUSPENSIONES — DOMUNNET
 * Fuente Única de Verdad (Single Source of Truth)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcularDiasSuspendidosUnicos = calcularDiasSuspendidosUnicos;
exports.fechaFinActualizada = fechaFinActualizada;
exports.diasEmpleados = diasEmpleados;
exports.diasPorEmplearse = diasPorEmplearse;
function toDate(d) {
    if (d instanceof Date)
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
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
function diffDaysInclusive(start, end) {
    const dStart = toDate(start);
    const dEnd = toDate(end);
    if (dEnd < dStart)
        return 0;
    const diffMs = dEnd.getTime() - dStart.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
}
function calcularDiasSuspendidosUnicos(suspensiones, maxFechaCorte, fechaInicioProyecto) {
    if (!suspensiones || suspensiones.length === 0)
        return 0;
    const minBoundary = fechaInicioProyecto ? toDate(fechaInicioProyecto) : null;
    const maxBoundary = maxFechaCorte ? toDate(maxFechaCorte) : null;
    const rangesClamped = [];
    for (const s of suspensiones) {
        let sStart = toDate(s.fecha_inicio);
        let sEnd = toDate(s.fecha_fin);
        if (sEnd < sStart)
            continue;
        if (minBoundary && sStart < minBoundary)
            sStart = minBoundary;
        if (maxBoundary && sEnd > maxBoundary)
            sEnd = maxBoundary;
        if (sEnd >= sStart && (!maxBoundary || sStart <= maxBoundary) && (!minBoundary || sEnd >= minBoundary)) {
            rangesClamped.push({
                start: sStart.getTime(),
                end: sEnd.getTime(),
            });
        }
    }
    if (rangesClamped.length === 0)
        return 0;
    rangesClamped.sort((a, b) => a.start - b.start);
    const merged = [];
    let current = rangesClamped[0];
    const msInDay = 1000 * 60 * 60 * 24;
    for (let i = 1; i < rangesClamped.length; i++) {
        const next = rangesClamped[i];
        if (next.start <= current.end + msInDay) {
            current.end = Math.max(current.end, next.end);
        }
        else {
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
function fechaFinActualizada(params) {
    const inicio = toDate(params.fechaInicio);
    const diasSuspendidosTotales = calcularDiasSuspendidosUnicos(params.suspensiones || [], undefined, inicio);
    const totalDiasSumar = (params.plazoContractual - 1) + diasSuspendidosTotales;
    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + totalDiasSumar);
    return fin;
}
function diasEmpleados(params) {
    const inicio = toDate(params.fechaInicio);
    const corte = toDate(params.fechaCorte);
    if (corte < inicio)
        return 0;
    const diasCalendarioTranscurridos = diffDaysInclusive(inicio, corte);
    const diasSuspendidosHastaCorte = calcularDiasSuspendidosUnicos(params.suspensiones || [], corte, inicio);
    return Math.max(0, diasCalendarioTranscurridos - diasSuspendidosHastaCorte);
}
function diasPorEmplearse(params) {
    const empleados = diasEmpleados(params);
    return Math.max(0, params.plazoContractual - empleados);
}
//# sourceMappingURL=plazos.js.map