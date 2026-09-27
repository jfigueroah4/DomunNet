/**
 * SCRIPT DE VERIFICACIÓN DE CONEXIÓN Y FUENTE ÚNICA DE VERDAD — DOMUNNET (test:wiring)
 * Comprueba que el componente de frontend y las capas de backend están cableadas correctamente
 * a las funciones centrales de src/lib/calculos.
 */

import fs from 'fs';
import path from 'path';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

console.log(`${colors.cyan}${colors.bold}=====================================================================${colors.reset}`);
console.log(`${colors.cyan}${colors.bold}  VERIFICACIÓN DE CONEXIÓN (WIRING CHECK) — DOMUNNET ${colors.reset}`);
console.log(`${colors.cyan}${colors.bold}=====================================================================${colors.reset}\n`);

let failed = false;

// 1. Verificar Frontend: HojaSabanaView.tsx
const hojaSabanaPath = path.resolve(__dirname, '../src/components/modules/proyectos/HojaSabanaView.tsx');
if (!fs.existsSync(hojaSabanaPath)) {
  console.log(`  ${colors.red}✖ FAIL: No se encontró HojaSabanaView.tsx en ${hojaSabanaPath}${colors.reset}`);
  failed = true;
} else {
  const content = fs.readFileSync(hojaSabanaPath, 'utf8');

  // Check 1.a: Llama a calcularLiquidacionEstimacion(
  if (!content.includes('calcularLiquidacionEstimacion(')) {
    console.log(`  ${colors.red}✖ FAIL: HojaSabanaView.tsx NO LLAMA a calcularLiquidacionEstimacion(${colors.reset}`);
    failed = true;
  } else {
    console.log(`  ${colors.green}✔ PASS: HojaSabanaView.tsx llama a calcularLiquidacionEstimacion(${colors.reset}`);
  }

  // Check 1.b: Llama a procesarMedicionRenglon(
  if (!content.includes('procesarMedicionRenglon(')) {
    console.log(`  ${colors.red}✖ FAIL: HojaSabanaView.tsx NO LLAMA a procesarMedicionRenglon(${colors.reset}`);
    failed = true;
  } else {
    console.log(`  ${colors.green}✔ PASS: HojaSabanaView.tsx llama a procesarMedicionRenglon(${colors.reset}`);
  }

  // Check 1.c: Lógica duplicada en componente
  const forbiddenPatterns = ['0.45', '* 0.12', 'porcentajeIndirectos /'];
  const contentWithoutImports = content.split('\n').filter(line => !line.trim().startsWith('import') && !line.trim().startsWith('//')).join('\n');
  
  for (const pattern of forbiddenPatterns) {
    if (contentWithoutImports.includes(pattern)) {
      console.log(`  ${colors.red}✖ FAIL: HojaSabanaView.tsx contiene lógica duplicada (${pattern})${colors.reset}`);
      failed = true;
    }
  }
}

// 2. Verificar Backend: backend/src/lib/calculos/index.ts
const backendIndexCalculosPath = path.resolve(__dirname, '../../../backend/src/lib/calculos/index.ts');
if (!fs.existsSync(backendIndexCalculosPath)) {
  console.log(`  ${colors.red}✖ FAIL: No se encontró backend/src/lib/calculos/index.ts${colors.reset}`);
  failed = true;
} else {
  const beContent = fs.readFileSync(backendIndexCalculosPath, 'utf8');
  if (
    beContent.includes('calcularLiquidacionEstimacion') &&
    beContent.includes('procesarMedicionRenglon') &&
    beContent.includes('fechaFinActualizada')
  ) {
    console.log(`  ${colors.green}✔ PASS: El backend importa y re-exporta las mismas funciones puras de producción${colors.reset}`);
  } else {
    console.log(`  ${colors.red}✖ FAIL: El backend no re-exporta todas las funciones puras de cálculo${colors.reset}`);
    failed = true;
  }
}

console.log(`\n${colors.bold}---------------------------------------------------------------------${colors.reset}`);
if (failed) {
  console.log(`  ${colors.red}${colors.bold}RESULTADO: FALLÓ LA VERIFICACIÓN DE CONEXIÓN (EXIT CODE 1)${colors.reset}`);
  console.log(`${colors.bold}---------------------------------------------------------------------${colors.reset}\n`);
  process.exit(1);
} else {
  console.log(`  ${colors.green}${colors.bold}RESULTADO: VERIFICACIÓN DE CONEXIÓN CORRECTA (EXIT CODE 0)${colors.reset}`);
  console.log(`${colors.bold}---------------------------------------------------------------------${colors.reset}\n`);
  process.exit(0);
}
