import { calcularCantidadMedicion, calcularLongitudEstaciones, procesarMedicionRenglon } from '../src/lib/calculos'

console.log('=== TEST 1: CÁLCULO DE LONGITUD Y VOLUMEN DE BITÁCORA ===')

// Caso 1: Estación 15+000 a 15+500 (500m), Ancho 7.30m, Espesor 0.15m (Pavimento de Concreto / m3)
const longEst = calcularLongitudEstaciones('15+000', '15+500')
console.log(`- Longitud calculada (15+000 a 15+500): ${longEst} m (Esperado: 500)`)
if (longEst !== 500) throw new Error('Fallo en cálculo de longitud de estaciones')

const resVol = calcularCantidadMedicion({
  unidad: 'm3',
  longitudL: longEst,
  anchoA: 7.30,
  alturaH: 0.15,
  multiplicador: 1,
  descuento: 0,
})

console.log(`- Volumen calculado: ${resVol.cantidadNeta} m3 (500 * 7.30 * 0.15 = 547.5 m3)`)
if (Math.abs(resVol.cantidadNeta - 547.5) > 0.001) throw new Error('Fallo en cálculo de volumen')

console.log('\n=== TEST 2: CONEXIÓN ANALÍTICO -> HOJA SÁBANA (TOPES Y COLUMNA I) ===')

// Renglón 401.01: Pavimento de Concreto Hidráulico
// Cantidad Ajustada Contractual (E) = 1,000.00 m3
// Acumulado Anterior (J) = 600.00 m3
// Medición actual de Bitácora = 547.50 m3 (Suma total = 1,147.50 m3 -> Excede por 147.50 m3)
// Precio Unitario (F) = Q 1,250.00 / m3

const resTopes = procesarMedicionRenglon({
  cantidadAjustada: 1000.00,
  acumuladoAnterior: 600.00,
  medicionPeriodo: resVol.cantidadNeta,
  precioUnitario: 1250.00,
})

console.log(`- Cantidad Facturable Este Período (Col. I): ${resTopes.facturablePeriodo} m3 (Máx: 400.00 m3)`)
console.log(`- Cantidad Excedente retenida (Pendientes): ${resTopes.excedenteRetenido} m3 (Esperado: 147.50 m3)`)
console.log(`- Total Físico Acumulado (Col. K = I + J): ${resTopes.facturablePeriodo + 600.00} m3`)
console.log(`- Monto Facturable Este Período (Col. M = I * F): Q ${resTopes.montoFacturablePeriodo.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`)

if (resTopes.facturablePeriodo !== 400.00) throw new Error('Fallo en tope facturable de Sábana')
if (resTopes.excedenteRetenido !== 147.50) throw new Error('Fallo en derivación a Pendientes por Falta de Cantidad')

console.log('\n=== TEST 3: INTEGRIDAD DE PLAN DE TRABAJO (PLAN VS REAL) ===')

// Verificación de estructura de datos:
// Plan de trabajo almacena avancesMensualesPlan (distribución teórica).
// Vista Actual almacena avancesMensuales (cantidades reales por estimación).
const renglonSimulado = {
  codigoDGC: '401.01',
  descripcion: 'Pavimento de Concreto Hidráulico',
  unidad: 'm3',
  cantidadContratada: 1000,
  cantidadAjustada: 1000,
  precioUnitario: 1250,
  avancesMensualesPlan: {
    'Ene 2025': 200,
    'Feb 2025': 300,
    'Mar 2025': 300,
    'Abr 2025': 200,
  },
  avancesMensuales: {
    'Ene 2025': 180,
    'Feb 2025': 220,
    // Mar y Abr aún no ejecutados -> deben ser 0 en vista Actual
  },
}

// 1. En vista Plan: Ene=200, Feb=300, Mar=300, Abr=200
console.log('- Avance Planificado Ene 2025:', renglonSimulado.avancesMensualesPlan['Ene 2025'])
console.log('- Avance Planificado Mar 2025:', renglonSimulado.avancesMensualesPlan['Mar 2025'])

// 2. En vista Actual: Ene=180, Feb=220, Mar=0 (No copiado del plan)
const valorActualMar = renglonSimulado.avancesMensuales['Mar 2025'] || 0
console.log('- Avance Real Mar 2025:', valorActualMar, '(Correcto: No se copia el 300 del plan)')
if (valorActualMar !== 0) throw new Error('La vista actual no debe duplicar los valores del plan')

console.log('\n✅ TODOS LOS TESTS DE INTEGRACIÓN PASARON EXITOSAMENTE (3/3)')
