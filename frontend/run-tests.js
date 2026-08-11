#!/usr/bin/env node
/**
 * run-tests.js — Ejecuta los *.test.ts de src/lib/utils con node:test nativo.
 *
 * Solo prueba funciones puras sin dependencias de React/DOM.
 *
 * Por qué resolvemos ts-node desde el store pnpm global:
 *   El frontend es un proyecto Next.js y no tiene ts-node-dev como dependencia
 *   directa. Sin embargo, el workspace raíz de pnpm tiene ts-node en su store
 *   como dependencia transitiva de ts-node-dev (que está en backend).
 *   Lo resolvemos usando esa ruta conocida del store como punto de búsqueda.
 */

const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

/** Busca recursivamente todos los archivos *.test.ts bajo `dir` */
function findTestFiles(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return findTestFiles(full)
    if (entry.name.endsWith('.test.ts')) return [full]
    return []
  })
}

/**
 * Intenta resolver un módulo desde una lista de directorios de búsqueda.
 * Retorna la primera ruta que funcione, o null si ninguna sirve.
 */
function resolveFrom(modulePath, searchDirs) {
  for (const dir of searchDirs) {
    try {
      return require.resolve(modulePath, { paths: [dir] })
    } catch { /* siguiente */ }
  }
  return null
}

// El store pnpm es compartido por todo el workspace. ts-node vive aquí
// como dependencia transitiva de ts-node-dev (instalado en backend).
const PNPM_STORE_TS_NODE_DEV = path.join(
  __dirname, '..', 'node_modules', '.pnpm',
  'ts-node-dev@2.0.0_@types+node@20.19.41_typescript@5.9.3',
  'node_modules', 'ts-node-dev'
)

const searchDirs = [
  PNPM_STORE_TS_NODE_DEV,
  path.join(__dirname, '..', 'backend', 'node_modules'),
  path.join(__dirname, '..', 'node_modules'),
  path.join(__dirname, 'node_modules'),
]

const tsNodeRegister = resolveFrom('ts-node/register', searchDirs)
const tsconfigPathsRegister = resolveFrom('tsconfig-paths/register', searchDirs)

if (!tsNodeRegister) {
  console.error('❌ No se encontró ts-node/register en el store de pnpm.')
  process.exit(1)
}
if (!tsconfigPathsRegister) {
  console.error('❌ No se encontró tsconfig-paths/register.')
  process.exit(1)
}

// Solo probamos src/lib/utils — sin React, sin DOM
const testFiles = findTestFiles(path.join(__dirname, 'src', 'lib', 'utils'))

if (testFiles.length === 0) {
  console.error('No se encontraron archivos *.test.ts en src/lib/utils')
  process.exit(1)
}

console.log(`Ejecutando ${testFiles.length} suites de prueba del frontend...\n`)
console.log('NOTA: Solo se prueban funciones puras (sin React/DOM).\n')

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
      TS_NODE_PROJECT: path.join(__dirname, 'tsconfig.test.json'),
      TS_NODE_TRANSPILE_ONLY: 'true',
    },
  }
)

process.exit(result.status ?? 1)
