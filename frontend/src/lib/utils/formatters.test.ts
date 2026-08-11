import { test } from 'node:test'
import assert from 'node:assert'
import { formatFullName } from './formatters'

test('formatFullName - todos los campos', () => {
  const resultado = formatFullName('Juan', 'Pérez', 'Carlos', 'López')
  assert.strictEqual(resultado, 'Juan Carlos Pérez López')
})

test('formatFullName - sin segundo nombre', () => {
  const resultado = formatFullName('María', 'García', null, null)
  assert.strictEqual(resultado, 'María García')
})

test('formatFullName - sin segundo apellido', () => {
  const resultado = formatFullName('Pedro', 'Martínez', 'José', null)
  assert.strictEqual(resultado, 'Pedro José Martínez')
})

test('formatFullName - solo nombres y apellido', () => {
  const resultado = formatFullName('Ana', 'Rodríguez', null, 'María')
  assert.strictEqual(resultado, 'Ana Rodríguez María')
})

test('formatFullName - campos vacíos', () => {
  const resultado = formatFullName('', '', '', '')
  assert.strictEqual(resultado, 'Usuario')
})

test('formatFullName - solo primer nombre y apellido', () => {
  const resultado = formatFullName('Luis', 'Sánchez', null, null)
  assert.strictEqual(resultado, 'Luis Sánchez')
})

test('formatFullName - con espacios en blanco', () => {
  const resultado = formatFullName('  Juan  ', '  Pérez  ', '  Carlos  ', '  López  ')
  assert.strictEqual(resultado, 'Juan Carlos Pérez López')
})
