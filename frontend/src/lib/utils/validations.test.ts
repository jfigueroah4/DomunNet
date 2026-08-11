import { test } from 'node:test'
import assert from 'node:assert'
import { isValidEmail, isValidUsername, validateLoginInput } from './validations'

test('isValidEmail - email válido', () => {
  assert.strictEqual(isValidEmail('test@example.com'), true)
})

test('isValidEmail - email inválido sin @', () => {
  assert.strictEqual(isValidEmail('testexample.com'), false)
})

test('isValidEmail - email inválido sin dominio', () => {
  assert.strictEqual(isValidEmail('test@'), false)
})

test('isValidEmail - email vacío', () => {
  assert.strictEqual(isValidEmail(''), false)
})

test('isValidEmail - email con espacios', () => {
  assert.strictEqual(isValidEmail('test @example.com'), false)
})

test('isValidUsername - username válido', () => {
  assert.strictEqual(isValidUsername('juan.perez'), true)
})

test('isValidUsername - username con guiones', () => {
  assert.strictEqual(isValidUsername('juan_perez-123'), true)
})

test('isValidUsername - username muy corto (debe fallar)', () => {
  assert.strictEqual(isValidUsername('ab'), false)
})

test('isValidUsername - username muy largo (debe fallar)', () => {
  assert.strictEqual(isValidUsername('a'.repeat(31)), false)
})

test('isValidUsername - username con espacios (debe fallar)', () => {
  assert.strictEqual(isValidUsername('juan perez'), false)
})

test('isValidUsername - username con @ (debe fallar)', () => {
  assert.strictEqual(isValidUsername('juan@perez'), false)
})

test('validateLoginInput - identificador vacío', () => {
  const resultado = validateLoginInput('', 'password123')
  assert.strictEqual(resultado.valid, false)
  assert.strictEqual(resultado.error, 'Ingrese su usuario')
})

test('validateLoginInput - password vacío', () => {
  const resultado = validateLoginInput('juan', '')
  assert.strictEqual(resultado.valid, false)
  assert.strictEqual(resultado.error, 'Ingrese su contraseña')
})

test('validateLoginInput - ambos vacíos', () => {
  const resultado = validateLoginInput('', '')
  assert.strictEqual(resultado.valid, false)
  assert.strictEqual(resultado.error, 'Ingrese su usuario')
})

test('validateLoginInput - ambos válidos', () => {
  const resultado = validateLoginInput('juan@example.com', 'password123')
  assert.strictEqual(resultado.valid, true)
  assert.strictEqual(resultado.error, undefined)
})

test('validateLoginInput - identificador con espacios', () => {
  const resultado = validateLoginInput('  ', 'password123')
  assert.strictEqual(resultado.valid, false)
  assert.strictEqual(resultado.error, 'Ingrese su usuario')
})
