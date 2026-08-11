import { test } from 'node:test'
import assert from 'node:assert'
import { obtenerNombreCompleto, esCorreo } from './autenticacion.servicio'
import type { FilaUsuarioAutenticacion } from './autenticacion.servicio'

test('obtenerNombreCompleto - dato como array', () => {
  const dato: FilaUsuarioAutenticacion['dato_usuario'] = [
    {
      primer_nombre: 'Juan',
      segundo_nombre: 'Carlos',
      primer_apellido: 'Pérez',
      segundo_apellido: 'López',
      telefono: '12345678',
      avatar_url: null,
    },
  ]
  const resultado = obtenerNombreCompleto(dato)
  assert.strictEqual(resultado, 'Juan Carlos Pérez López')
})

test('obtenerNombreCompleto - dato como objeto', () => {
  const dato: FilaUsuarioAutenticacion['dato_usuario'] = {
    primer_nombre: 'María',
    segundo_nombre: null,
    primer_apellido: 'García',
    segundo_apellido: null,
    telefono: '87654321',
    avatar_url: null,
  }
  const resultado = obtenerNombreCompleto(dato)
  assert.strictEqual(resultado, 'María García')
})

test('obtenerNombreCompleto - dato null', () => {
  const resultado = obtenerNombreCompleto(null)
  assert.strictEqual(resultado, 'Usuario')
})

test('obtenerNombreCompleto - campos parciales', () => {
  const dato: FilaUsuarioAutenticacion['dato_usuario'] = {
    primer_nombre: 'Pedro',
    segundo_nombre: null,
    primer_apellido: 'Martínez',
    segundo_apellido: null,
    telefono: null,
    avatar_url: null,
  }
  const resultado = obtenerNombreCompleto(dato)
  assert.strictEqual(resultado, 'Pedro Martínez')
})

test('obtenerNombreCompleto - todos campos nulos', () => {
  const dato: FilaUsuarioAutenticacion['dato_usuario'] = {
    primer_nombre: '',
    segundo_nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    telefono: null,
    avatar_url: null,
  }
  const resultado = obtenerNombreCompleto(dato)
  assert.strictEqual(resultado, 'Usuario')
})

test('esCorreo - vacío', () => {
  assert.strictEqual(esCorreo(''), false)
})

test('esCorreo - múltiples @', () => {
  assert.strictEqual(esCorreo('user@@domain.com'), true)
})

test('esCorreo - sin @', () => {
  assert.strictEqual(esCorreo('username'), false)
})

test('esCorreo - con @', () => {
  assert.strictEqual(esCorreo('user@domain.com'), true)
})

test('esCorreo - solo @', () => {
  assert.strictEqual(esCorreo('@'), true)
})
