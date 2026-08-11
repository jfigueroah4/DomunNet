#!/usr/bin/env node
/**
 * run-tests.js — Ejecuta todos los *.test.ts con node:test nativo.
 *
 * Replica el mismo mecanismo de resolución de módulos que usa ts-node-dev en dev:
 *   -r tsconfig-paths/register  →  resuelve los alias @/* del tsconfig.json
 *   -r ts-node/register         →  transpila TypeScript on-the-fly sin compilar a disco
 *
 * Por qué no usamos "tsc && node --test dist/**\/*.test.js":
 *   - En Windows el shell no expande globs, así que el patrón llega literal a node.
 *   - El dist compilado no tiene tsconfig-paths aplicado, así que @/ falla en runtime.
 *
 * Por qué resolvemos ts-node desde ts-node-dev:
 *   - pnpm hoisting estricto: ts-node no está en node_modules del backend directamente.
 *   - ts-node-dev depende de ts-node, así que lo encontramos a través de él.
 */

const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

/** Busca recursivamente todos los archivos *.test.ts bajo `dir` */
function findTestFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return findTestFiles(full)
    if (entry.name.endsWith('.test.ts')) return [full]
    return []
  })
}

/**
 * Resuelve un módulo desde un directorio de búsqueda alternativo.
 * Con pnpm, ts-node no está en node_modules directo del backend,
 * pero sí está en las dependencias de ts-node-dev (que sí está).
 */
function resolveFrom(modulePath, fromDir) {
  try {
    return require.resolve(modulePath, { paths: [fromDir] })
  } catch {
    return null
  }
}

const tsNodeDevDir = path.dirname(require.resolve('ts-node-dev'))
const tsNodeRegister = resolveFrom('ts-node/register', tsNodeDevDir)
const tsconfigPathsRegister = resolveFrom('tsconfig-paths/register', path.join(__dirname, 'node_modules', 'tsconfig-paths'))
  ?? resolveFrom('tsconfig-paths/register', tsNodeDevDir)

if (!tsNodeRegister) {
  console.error('❌ No se encontró ts-node/register. Instala ts-node como dependencia del backend.')
  process.exit(1)
}
if (!tsconfigPathsRegister) {
  console.error('❌ No se encontró tsconfig-paths/register.')
  process.exit(1)
}

const testFiles = findTestFiles(path.join(__dirname, 'src'))

if (testFiles.length === 0) {
  console.error('No se encontraron archivos *.test.ts')
  process.exit(1)
}

console.log(`Ejecutando ${testFiles.length} suites de prueba...\n`)

const result = spawnSync(
  process.execPath,
  [
    '--require', tsconfigPathsRegister,
    '--require', tsNodeRegister,
    '--test',
    ...testFiles,
  ],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      TS_NODE_PROJECT: path.join(__dirname, 'tsconfig.json'),
      TS_NODE_TRANSPILE_ONLY: 'true', // más rápido, sin type-check completo
    },
  }
)

process.exit(result.status ?? 1)
