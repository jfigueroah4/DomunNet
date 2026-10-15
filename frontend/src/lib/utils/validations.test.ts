import { test, expect } from 'vitest'
import { isValidEmail, isValidUsername, validateLoginInput, validarFechaNacimiento } from './validations'

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

test('validarFechaNacimiento - fecha incompleta', () => {
  expect(validarFechaNacimiento('', '', '').valida).toBe(false)
  expect(validarFechaNacimiento('12', '05', '99').valida).toBe(false)
})

test('validarFechaNacimiento - valores inválidos o mes fuera de rango', () => {
  expect(validarFechaNacimiento('32', '05', '2000').valida).toBe(false)
  expect(validarFechaNacimiento('15', '13', '2000').valida).toBe(false)
  expect(validarFechaNacimiento('29', '02', '2023').valida).toBe(false) // no bisiesto
})

test('validarFechaNacimiento - menor de 18 años debe fallar', () => {
  const hoy = new Date()
  const anio = hoy.getFullYear() - 15
  const res = validarFechaNacimiento('01', '01', anio)
  expect(res.valida).toBe(false)
  expect(res.mensajeError).toBe('El usuario debe ser mayor de 18 años')
})

test('validarFechaNacimiento - mayor de 100 años debe fallar', () => {
  const hoy = new Date()
  const anio = hoy.getFullYear() - 105
  const res = validarFechaNacimiento('01', '01', anio)
  expect(res.valida).toBe(false)
  expect(res.mensajeError).toBe('La edad no puede exceder los 100 años')
})

test('validarFechaNacimiento - año 1900 excede los 100 años', () => {
  const res = validarFechaNacimiento('15', '06', '1900')
  expect(res.valida).toBe(false)
  expect(res.mensajeError).toBe('La edad no puede exceder los 100 años')
})

test('validarFechaNacimiento - edad válida (ej. 25 años)', () => {
  const hoy = new Date()
  const anio = hoy.getFullYear() - 25
  const res = validarFechaNacimiento('01', '01', anio)
  expect(res.valida).toBe(true)
  expect(res.edad).toBe(25)
  expect(res.mensaje).toContain('Fecha válida (25 años, mayor de edad)')
})

test('validarFechaNacimiento - edad límite válida (18 años cumplidos)', () => {
  const hoy = new Date()
  const anio = hoy.getFullYear() - 18
  const mes = String(hoy.getMonth() + 1).padStart(2, '0')
  const dia = String(hoy.getDate()).padStart(2, '0')
  const res = validarFechaNacimiento(dia, mes, anio)
  expect(res.valida).toBe(true)
  expect(res.edad).toBe(18)
})

test('validarFechaNacimiento - edad límite válida (100 años cumplidos)', () => {
  const hoy = new Date()
  const anio = hoy.getFullYear() - 100
  const mes = String(hoy.getMonth() + 1).padStart(2, '0')
  const dia = String(hoy.getDate()).padStart(2, '0')
  const res = validarFechaNacimiento(dia, mes, anio)
  expect(res.valida).toBe(true)
  expect(res.edad).toBe(100)
})

test('validarFechaNacimiento - 101 años cumplidos debe fallar', () => {
  const hoy = new Date()
  const anio = hoy.getFullYear() - 101
  const mes = String(hoy.getMonth() + 1).padStart(2, '0')
  const dia = String(hoy.getDate()).padStart(2, '0')
  const res = validarFechaNacimiento(dia, mes, anio)
  expect(res.valida).toBe(false)
  expect(res.mensajeError).toBe('La edad no puede exceder los 100 años')
})
