import { test, expect } from 'vitest'
import { formatFullName, formatearNombrePropio } from './formatters'

test('formatFullName - todos los campos', () => {
  const resultado = formatFullName('Juan', 'Pérez', 'Carlos', 'López')
  expect(resultado).toBe('Juan Carlos Pérez López')
})

test('formatFullName - sin segundo nombre', () => {
  const resultado = formatFullName('María', 'García', null, null)
  expect(resultado).toBe('María García')
})

test('formatFullName - sin segundo apellido', () => {
  const resultado = formatFullName('Pedro', 'Martínez', 'José', null)
  expect(resultado).toBe('Pedro José Martínez')
})

test('formatFullName - solo nombres y apellido', () => {
  const resultado = formatFullName('Ana', 'Rodríguez', null, 'María')
  expect(resultado).toBe('Ana Rodríguez María')
})

test('formatFullName - campos vacíos', () => {
  const resultado = formatFullName('', '', '', '')
  expect(resultado).toBe('Usuario')
})

test('formatFullName - solo primer nombre y apellido', () => {
  const resultado = formatFullName('Luis', 'Sánchez', null, null)
  expect(resultado).toBe('Luis Sánchez')
})

test('formatFullName - con espacios en blanco', () => {
  const resultado = formatFullName('  Juan  ', '  Pérez  ', '  Carlos  ', '  López  ')
  expect(resultado).toBe('Juan Carlos Pérez López')
})

test('formatearNombrePropio - convierte minúsculas a capitalizada', () => {
  expect(formatearNombrePropio('joshua')).toBe('Joshua')
  expect(formatearNombrePropio('da')).toBe('Da')
  expect(formatearNombrePropio('figue')).toBe('Figue')
  expect(formatearNombrePropio('figueroa')).toBe('Figueroa')
})

test('formatearNombrePropio - no permite mayúsculas sostenidas', () => {
  expect(formatearNombrePropio('JOSHUA')).toBe('Joshua')
  expect(formatearNombrePropio('FIGUEROA')).toBe('Figueroa')
  expect(formatearNombrePropio('JOSHUA DAVID FIGUEROA')).toBe('Joshua David Figueroa')
})

test('formatearNombrePropio - maneja tildes y caracteres especiales en español', () => {
  expect(formatearNombrePropio('ÁNGEL MARÍA')).toBe('Ángel María')
  expect(formatearNombrePropio('pérez')).toBe('Pérez')
  expect(formatearNombrePropio('ñáñez')).toBe('Ñáñez')
  expect(formatearNombrePropio('GÜEREÑA')).toBe('Güereña')
})
