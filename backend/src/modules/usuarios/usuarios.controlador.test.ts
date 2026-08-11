import { test } from 'node:test'
import assert from 'node:assert'
import { esquemaUsuario } from './usuarios.controlador'

test('esquemaUsuario - nombre de 1 carácter (válido)', () => {
  const resultado = esquemaUsuario.safeParse({
    primer_nombre: 'J',
    segundo_nombre: null,
    primer_apellido: 'P',
    segundo_apellido: null,
    correo: 'test@example.com',
    telefono: '1234',
    rol: 'Admin',
    estado: 'Activo',
    contrasena: '123456',
    proyectosAsignados: [],
    username: 'j.perez',
  })
  assert.strictEqual(resultado.success, true)
})

test('esquemaUsuario - apellido con espacios (válido)', () => {
  const resultado = esquemaUsuario.safeParse({
    primer_nombre: 'Juan',
    segundo_nombre: null,
    primer_apellido: 'De La Cruz',
    segundo_apellido: null,
    correo: 'test@example.com',
    telefono: '1234',
    rol: 'Admin',
    estado: 'Activo',
    contrasena: '123456',
    proyectosAsignados: [],
    username: 'j.delacruz',
  })
  assert.strictEqual(resultado.success, true)
})

test('esquemaUsuario - username con caracteres inválidos (debe fallar)', () => {
  const resultado = esquemaUsuario.safeParse({
    primer_nombre: 'Juan',
    segundo_nombre: null,
    primer_apellido: 'Pérez',
    segundo_apellido: null,
    correo: 'test@example.com',
    telefono: '1234',
    rol: 'Admin',
    estado: 'Activo',
    contrasena: '123456',
    proyectosAsignados: [],
    username: 'juan@perez',
  })
  assert.strictEqual(resultado.success, false)
  if (!resultado.success) {
    assert.ok(resultado.error.issues.some(issue => issue.message.includes('Nombre de usuario inválido')))
  }
})

test('esquemaUsuario - username válido', () => {
  const resultado = esquemaUsuario.safeParse({
    primer_nombre: 'Juan',
    segundo_nombre: null,
    primer_apellido: 'Pérez',
    segundo_apellido: null,
    correo: 'test@example.com',
    telefono: '1234',
    rol: 'Admin',
    estado: 'Activo',
    contrasena: '123456',
    proyectosAsignados: [],
    username: 'juan.perez_123',
  })
  assert.strictEqual(resultado.success, true)
})

test('esquemaUsuario - campos requeridos faltantes', () => {
  const resultado = esquemaUsuario.safeParse({
    primer_nombre: '',
    segundo_nombre: null,
    primer_apellido: '',
    segundo_apellido: null,
    correo: 'test@example.com',
    telefono: '1234',
    rol: 'Admin',
    estado: 'Activo',
    contrasena: '123456',
    proyectosAsignados: [],
    username: 'juan.perez',
  })
  assert.strictEqual(resultado.success, false)
  if (!resultado.success) {
    assert.ok(resultado.error.issues.some(issue => issue.path.includes('primer_nombre')))
    assert.ok(resultado.error.issues.some(issue => issue.path.includes('primer_apellido')))
  }
})

test('esquemaUsuario - username vacío (válido, opcional)', () => {
  const resultado = esquemaUsuario.safeParse({
    primer_nombre: 'Juan',
    segundo_nombre: null,
    primer_apellido: 'Pérez',
    segundo_apellido: null,
    correo: 'test@example.com',
    telefono: '1234',
    rol: 'Admin',
    estado: 'Activo',
    contrasena: '123456',
    proyectosAsignados: [],
    username: '',
  })
  assert.strictEqual(resultado.success, true)
})

test('esquemaUsuario - username null (válido, opcional)', () => {
  const resultado = esquemaUsuario.safeParse({
    primer_nombre: 'Juan',
    segundo_nombre: null,
    primer_apellido: 'Pérez',
    segundo_apellido: null,
    correo: 'test@example.com',
    telefono: '1234',
    rol: 'Admin',
    estado: 'Activo',
    contrasena: '123456',
    proyectosAsignados: [],
    username: null,
  })
  assert.strictEqual(resultado.success, true)
})

test('esquemaUsuario - username muy corto (debe fallar)', () => {
  const resultado = esquemaUsuario.safeParse({
    primer_nombre: 'Juan',
    segundo_nombre: null,
    primer_apellido: 'Pérez',
    segundo_apellido: null,
    correo: 'test@example.com',
    telefono: '1234',
    rol: 'Admin',
    estado: 'Activo',
    contrasena: '123456',
    proyectosAsignados: [],
    username: 'ab',
  })
  assert.strictEqual(resultado.success, false)
})

test('esquemaUsuario - username muy largo (debe fallar)', () => {
  const resultado = esquemaUsuario.safeParse({
    primer_nombre: 'Juan',
    segundo_nombre: null,
    primer_apellido: 'Pérez',
    segundo_apellido: null,
    correo: 'test@example.com',
    telefono: '1234',
    rol: 'Admin',
    estado: 'Activo',
    contrasena: '123456',
    proyectosAsignados: [],
    username: 'a'.repeat(31),
  })
  assert.strictEqual(resultado.success, false)
})

test('esquemaUsuario - correo inválido (debe fallar)', () => {
  const resultado = esquemaUsuario.safeParse({
    primer_nombre: 'Juan',
    segundo_nombre: null,
    primer_apellido: 'Pérez',
    segundo_apellido: null,
    correo: 'correo-invalido',
    telefono: '1234',
    rol: 'Admin',
    estado: 'Activo',
    contrasena: '123456',
    proyectosAsignados: [],
    username: 'juan.perez',
  })
  assert.strictEqual(resultado.success, false)
})

test('esquemaUsuario - estado inválido (debe fallar)', () => {
  const resultado = esquemaUsuario.safeParse({
    primer_nombre: 'Juan',
    segundo_nombre: null,
    primer_apellido: 'Pérez',
    segundo_apellido: null,
    correo: 'test@example.com',
    telefono: '1234',
    rol: 'Admin',
    estado: 'Pendiente',
    contrasena: '123456',
    proyectosAsignados: [],
    username: 'juan.perez',
  })
  assert.strictEqual(resultado.success, false)
})
