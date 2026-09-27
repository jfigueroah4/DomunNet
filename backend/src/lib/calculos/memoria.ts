/**
 * MÓDULO PURO DE CÁLCULO DE MEMORIA DE CÁLCULO / MEDIDAS (ANALÍTICO) — DOMUNNET
 * Fuente Única de Verdad (Single Source of Truth)
 * Importa redondearCentavos desde redondeo.ts
 */

import { redondearCentavos } from './redondeo';

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
  cantidadNeta: number | null;
  formulaAplicada: string;
}

/**
 * Parsea estaciones en formato km+m (ej. "14+700", "15+100", "14.2", 14200) y calcula la distancia en metros.
 */
export function parseEstacionAMetros(estacion: string | number): number {
  if (typeof estacion === 'number') return Math.max(0, estacion);
  if (!estacion || typeof estacion !== 'string') return 0;

  const str = estacion.trim();
  if (str.includes('+')) {
    const parts = str.split('+');
    const km = parseFloat(parts[0]) || 0;
    const m = parseFloat(parts[1]) || 0;
    return Math.max(0, km * 1000 + m);
  }

  const num = parseFloat(str);
  if (isNaN(num)) return 0;
  return Math.max(0, num);
}

/**
 * Calcula la longitud en metros entre dos estaciones en formato km+m.
 */
export function calcularLongitudEstaciones(estacionInicio: string, estacionFin: string): number {
  const mInicio = parseEstacionAMetros(estacionInicio);
  const mFin = parseEstacionAMetros(estacionFin);

  if (mFin < mInicio) return 0;
  return redondearCentavos(mFin - mInicio);
}

/**
 * Normaliza la unidad de medida según el catálogo oficial DGC.
 */
export function obtenerDimensionesRequeridas(unidad: string): { requiereAncho: boolean; requiereAltura: boolean; dimension: '1D' | '2D' | '3D' | 'conteo' } {
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
export function calcularCantidadMedicion(params: ParametrosMedicion): ResultadoCantidadMedicion {
  const {
    unidad,
    longitudL = 0,
    anchoA = 0,
    alturaH = 0,
    multiplicador = 1,
    descuento = 0,
    tipoDescuento = 'monto',
    cantidadDirecta,
  } = params;

  const mult = multiplicador > 0 ? multiplicador : 1;
  const dim = obtenerDimensionesRequeridas(unidad);

  let baseBruta = 0;
  let formulaAplicada = '';
  let incompleto = false;

  if (cantidadDirecta !== undefined && cantidadDirecta !== null && cantidadDirecta > 0) {
    baseBruta = cantidadDirecta;
    formulaAplicada = `Valor directo plano/libreta (${baseBruta})`;
  } else {
    switch (dim.dimension) {
      case '3D':
        if (!longitudL || !anchoA || !alturaH) {
          incompleto = true;
          formulaAplicada = `Dimensiones incompletas para 3D (L: ${longitudL || '-'}, A: ${anchoA || '-'}, H: ${alturaH || '-'})`;
        } else {
          baseBruta = longitudL * anchoA * alturaH;
          formulaAplicada = `L (${longitudL}) × A (${anchoA}) × H (${alturaH})`;
        }
        break;
      case '2D':
        if (!longitudL || !anchoA) {
          incompleto = true;
          formulaAplicada = `Dimensiones incompletas para 2D (L: ${longitudL || '-'}, A: ${anchoA || '-'})`;
        } else {
          baseBruta = longitudL * anchoA;
          formulaAplicada = `L (${longitudL}) × A (${anchoA})`;
        }
        break;
      case '1D':
        if (!longitudL) {
          incompleto = true;
          formulaAplicada = `Dimensiones incompletas para 1D (L: ${longitudL || '-'})`;
        } else {
          baseBruta = longitudL;
          formulaAplicada = `Longitud L (${longitudL})`;
        }
        break;
      case 'conteo':
      default:
        baseBruta = longitudL > 0 ? longitudL : 1;
        formulaAplicada = `Conteo / Unidad (${baseBruta})`;
        break;
    }
  }

  if (incompleto) {
    return {
      baseBruta: 0,
      multiplicador: mult,
      cantidadBruta: 0,
      descuentoMonto: 0,
      cantidadNeta: null,
      formulaAplicada,
    };
  }

  const cantidadBruta = redondearCentavos(baseBruta * mult);
  let descuentoMonto = 0;

  if (descuento > 0) {
    if (tipoDescuento === 'factor') {
      descuentoMonto = redondearCentavos(cantidadBruta * descuento);
    } else {
      descuentoMonto = redondearCentavos(descuento);
    }
  }

  const cantidadNeta = Math.max(0, redondearCentavos(cantidadBruta - descuentoMonto));

  return {
    baseBruta: redondearCentavos(baseBruta),
    multiplicador: mult,
    cantidadBruta,
    descuentoMonto,
    cantidadNeta,
    formulaAplicada,
  };
}
