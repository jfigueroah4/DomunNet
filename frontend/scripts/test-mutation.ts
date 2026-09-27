/**
 * SCRIPT DE PRUEBAS DE MUTACIÓN AUTOMÁTICAS — DOMUNNET (test:mutation)
 * Aplica mutaciones dirigidas a los módulos centrales de cálculo, ejecuta la suite de Vitest,
 * confirma que al menos una prueba FALLE (mutación muerta) y restaura el código original en un bloque finally.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  bold: '\x1b[1m',
};

interface MutationSpec {
  id: string;
  name: string;
  file: string;
  target: string;
  replacement: string;
}

const mutations: MutationSpec[] = [
  {
    id: 'a',
    name: 'Indirectos: (porcentajeIndirectos - 1) / 100',
    file: path.resolve(process.cwd(), 'src/lib/calculos/liquidacion.ts'),
    target: 'baseIndirectos * (porcentajeIndirectos / 100)',
    replacement: 'baseIndirectos * ((porcentajeIndirectos - 1) / 100)',
  },
  {
    id: 'b',
    name: 'IVA aplicado antes que indirectos (sobre costo directo puro)',
    file: path.resolve(process.cwd(), 'src/lib/calculos/liquidacion.ts'),
    target: 'const baseIva = excluirIndirectosIvaGlobal\n    ? montoDirectoPeriodo + indirectos\n    : montoDirectoPeriodo + indirectos + montoRenglonGlobal;',
    replacement: 'const baseIva = montoDirectoPeriodo;',
  },
  {
    id: 'c',
    name: 'Anticipo calculado sobre subtotal sin IVA (montoDirectoPeriodo)',
    file: path.resolve(process.cwd(), 'src/lib/calculos/liquidacion.ts'),
    target: 'valorTotalEstimacion * (porcentajeAmortizacionAnticipo / 100)',
    replacement: 'montoDirectoPeriodo * (porcentajeAmortizacionAnticipo / 100)',
  },
  {
    id: 'd',
    name: 'Topes: Quitar Math.min en topes.ts (usar medicionPeriodo directamente)',
    file: path.resolve(process.cwd(), 'src/lib/calculos/topes.ts'),
    target: 'const facturablePeriodo = Math.min(medicionPeriodo, disponible);',
    replacement: 'const facturablePeriodo = medicionPeriodo;',
  },
  {
    id: 'e',
    name: 'Plazos: Fin de plazo sin el "- 1"',
    file: path.resolve(process.cwd(), 'src/lib/calculos/plazos.ts'),
    target: 'const totalDiasSumar = (params.plazoContractual - 1) + diasSuspendidosTotales;',
    replacement: 'const totalDiasSumar = params.plazoContractual + diasSuspendidosTotales;',
  },
  {
    id: 'f',
    name: 'Plazos: Quitar la resta de días suspendidos en diasEmpleados',
    file: path.resolve(process.cwd(), 'src/lib/calculos/plazos.ts'),
    target: 'return Math.max(0, diasCalendarioTranscurridos - diasSuspendidosHastaCorte);',
    replacement: 'return Math.max(0, diasCalendarioTranscurridos);',
  },
];

console.log(`\n${colors.cyan}${colors.bold}=====================================================================${colors.reset}`);
console.log(`${colors.cyan}${colors.bold}  SUITE DE PRUEBAS DE MUTACIÓN AUTOMÁTICAS — DOMUNNET ${colors.reset}`);
console.log(`${colors.cyan}${colors.bold}=====================================================================${colors.reset}\n`);

const results: Array<{ id: string; name: string; status: string; killedBy: string }> = [];

for (const m of mutations) {
  console.log(`${colors.bold}Ejecutando Mutación [${m.id}]: ${m.name}...${colors.reset}`);
  
  if (!fs.existsSync(m.file)) {
    console.error(`  ${colors.red}Error: No existe el archivo ${m.file}${colors.reset}`);
    process.exit(1);
  }

  const originalContent = fs.readFileSync(m.file, 'utf8');

  if (!originalContent.includes(m.target)) {
    console.error(`  ${colors.red}Error: No se encontró el patrón objetivo para la mutación [${m.id}]${colors.reset}`);
    process.exit(1);
  }

  let testPassed = false;
  let output = '';

  try {
    // 1. Aplicar mutación
    const mutatedContent = originalContent.replace(m.target, m.replacement);
    fs.writeFileSync(m.file, mutatedContent, 'utf8');

    // 2. Ejecutar Vitest
    const vitestCmd = `npx vitest run --reporter=verbose`;
    try {
      output = execSync(vitestCmd, { cwd: path.resolve(__dirname, '..'), encoding: 'utf8', stdio: 'pipe' });
      testPassed = true; // Si no lanzó excepción, Vitest pasó (la mutación sobrevivió -> MAL)
    } catch (err: any) {
      output = err.stdout || err.stderr || err.message || '';
      testPassed = false; // Vitest falló (la mutación murió -> BIEN)
    }
  } finally {
    // 3. RESTAURACIÓN OBLIGATORIA EN BLOQUE FINALLY
    fs.writeFileSync(m.file, originalContent, 'utf8');
  }

  // 4. Analizar resultado de la mutación
  if (!testPassed) {
    // Extraer qué prueba falló en la salida
    const failMatches = output.match(/FAIL\s+([^\n]+)|×\s+([^\n]+)/g);
    const killedBy = failMatches ? failMatches.slice(0, 2).join(' | ').replace(/[\r\n]+/g, ' ') : 'Prueba de regresión Vitest';
    console.log(`  ${colors.green}✔ MUERTA${colors.reset} (La suite detectó el error: ${killedBy})\n`);
    results.push({ id: m.id, name: m.name, status: 'MUERTA', killedBy });
  } else {
    console.log(`  ${colors.red}✖ SOBREVIVIÓ${colors.reset} (ADVERTENCIA: Ninguna prueba falló con esta mutación)\n`);
    results.push({ id: m.id, name: m.name, status: 'SOBREVIVIÓ', killedBy: 'Ninguna (Falta prueba)' });
  }
}

// 5. Verificar git diff limpio
let gitClean = true;
try {
  const diff = execSync('git status --porcelain src/lib/calculos/', { cwd: path.resolve(__dirname, '..'), encoding: 'utf8' });
  if (diff.trim().length > 0) {
    gitClean = false;
  }
} catch (e) {
  // Ignorar si git status no está disponible
}

// 6. Imprimir Tabla Final
console.log(`\n${colors.cyan}${colors.bold}=====================================================================${colors.reset}`);
console.log(`${colors.cyan}${colors.bold}  TABLA RESUMEN DE PRUEBAS DE MUTACIÓN ${colors.reset}`);
console.log(`${colors.cyan}${colors.bold}=====================================================================${colors.reset}\n`);

console.log(`| Mutación | Estado | Prueba(s) que la Mataron |`);
console.log(`|---|---|---|`);
results.forEach(r => {
  const statusFormatted = r.status === 'MUERTA' ? `**MUERTA** (Exit != 0)` : `**SOBREVIVIÓ**`;
  console.log(`| [${r.id}] ${r.name} | ${statusFormatted} | ${r.killedBy} |`);
});

console.log(`\n${colors.bold}Verificación de Limpieza Git:${colors.reset} ${gitClean ? `${colors.green}100% Limpio (Sin cambios residuales en src/lib/calculos)${colors.reset}` : `${colors.red}Cambios pendientes detectados${colors.reset}`}\n`);

const allKilled = results.every(r => r.status === 'MUERTA');
if (allKilled && gitClean) {
  console.log(`${colors.green}${colors.bold}100% MUTACIONES MUERTAS — EXIT CODE 0${colors.reset}\n`);
  process.exit(0);
} else {
  console.log(`${colors.red}${colors.bold}MUTACIONES SOBREVIVIENTES O CÓDIGO SUCIO — EXIT CODE 1${colors.reset}\n`);
  process.exit(1);
}
