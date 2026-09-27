import { test, expect } from 'vitest'
import { isValidEmail, isValidUsername, validateLoginInput } from './validations'

test('isValidEmail - email válido', () => {
  expect(isValidEmail('test@example.com')).toBe(true)
})

test('isValidEmail - email inválido sin @', () => {
  expect(isValidEmail('testexample.com')).toBe(false)
})

test('isValidEmail - email inválido sin dominio', () => {
  expect(isValidEmail('test@')).toBe(false)
})

test('isValidEmail - email vacío', () => {
  expect(isValidEmail('')).toBe(false)
})

test('isValidEmail - email con espacios', () => {
  expect(isValidEmail('test @example.com')).toBe(false)
})

test('isValidUsername - username válido', () => {
  expect(isValidUsername('juan.perez')).toBe(true)
})

test('isValidUsername - username con guiones', () => {
  expect(isValidUsername('juan_perez-123')).toBe(true)
})

test('isValidUsername - username muy corto (debe fallar)', () => {
  expect(isValidUsername('ab')).toBe(false)
})

test('isValidUsername - username muy largo (debe fallar)', () => {
  expect(isValidUsername('a'.repeat(31))).toBe(false)
})

test('isValidUsername - username con espacios (debe fallar)', () => {
  expect(isValidUsername('juan perez')).toBe(false)
})

test('isValidUsername - username con @ (debe fallar)', () => {
  expect(isValidUsername('juan@perez')).toBe(false)
})

test('validateLoginInput - identificador vacío', () => {
  const resultado = validateLoginInput('', 'password123')
  expect(resultado.valid).toBe(false)
  expect(resultado.error).toBe('Ingrese su usuario')
})

test('validateLoginInput - password vacío', () => {
  const resultado = validateLoginInput('juan', '')
  expect(resultado.valid).toBe(false)
  expect(resultado.error).toBe('Ingrese su contraseña')
})

test('validateLoginInput - ambos vacíos', () => {
  const resultado = validateLoginInput('', '')
  expect(resultado.valid).toBe(false)
  expect(resultado.error).toBe('Ingrese su usuario')
})

test('validateLoginInput - ambos válidos', () => {
  const resultado = validateLoginInput('juan@example.com', 'password123')
  expect(resultado.valid).toBe(true)
  expect(resultado.error).toBe(undefined)
})

test('validateLoginInput - identificador con espacios', () => {
  const resultado = validateLoginInput('  ', 'password123')
  expect(resultado.valid).toBe(false)
  expect(resultado.error).toBe('Ingrese su usuario')
})
