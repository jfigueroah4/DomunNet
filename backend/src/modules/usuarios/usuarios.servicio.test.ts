import { test } from 'node:test'
import assert from 'node:assert'
import { normalizar, formatearFecha, mapearUsuario } from './usuarios.servicio'
import type { FilaUsuarioJoin } from './usuarios.servicio'

test('normalizar - vacío', () => {
  assert.strictEqual(normalizar(''), '')
})

test('normalizar - espacios múltiples', () => {
  assert.strictEqual(normalizar('  Hola  Mundo  '), 'hola mundo')
})

test('normalizar - mayúsculas/minúsculas', () => {
  assert.strictEqual(normalizar('HoLa MuNdO'), 'hola mundo')
})

test('formatearFecha - null', () => {
  assert.strictEqual(formatearFecha(null), 'Nunca')
})

test('formatearFecha - fecha válida', () => {
  const fecha = '2024-01-15T10:30:00.000Z'
  const resultado = formatearFecha(fecha)
  // La fecha formateada depende de la locale, solo verificamos que no sea 'Nunca'
  assert.notStrictEqual(resultado, 'Nunca')
})

test('formatearFecha - fecha inválida', () => {
  const resultado = formatearFecha('fecha-invalida')
  assert.strictEqual(resultado, 'fecha-invalida')
})

test('mapearUsuario - dato_usuario como array', () => {
  const fila: FilaUsuarioJoin = {
    id: '1',
    auth_user_id: 'auth-1',
    correo: 'test@example.com',
    rol_id: 'rol-1',
    activo: true,
    ultimo_acceso: '2024-01-15T10:30:00.000Z',
    fecha_registro: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-15T10:30:00.000Z',
    dato_usuario: [
      {
        primer_nombre: 'Juan',
        segundo_nombre: 'Carlos',
        primer_apellido: 'Pérez',
        segundo_apellido: 'López',
        telefono: '12345678',
        avatar_url: null,
        username: 'jperez',
      },
    ],
  }
  const resultado = mapearUsuario(fila, 'Administrador')
  assert.strictEqual(resultado.nombre, 'Juan Carlos Pérez López')
  assert.strictEqual(resultado.correo, 'test@example.com')
  assert.strictEqual(resultado.rol, 'Administrador')
})

test('mapearUsuario - dato_usuario como objeto', () => {
  const fila: FilaUsuarioJoin = {
    id: '1',
    auth_user_id: 'auth-1',
    correo: 'test@example.com',
    rol_id: 'rol-1',
    activo: true,
    ultimo_acceso: '2024-01-15T10:30:00.000Z',
    fecha_registro: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-15T10:30:00.000Z',
    dato_usuario: {
      primer_nombre: 'María',
      segundo_nombre: null,
      primer_apellido: 'García',
      segundo_apellido: null,
      telefono: '87654321',
      avatar_url: null,
      username: 'mgarcia',
    },
  }
  const resultado = mapearUsuario(fila, 'Gerencia')
  assert.strictEqual(resultado.nombre, 'María García')
  assert.strictEqual(resultado.correo, 'test@example.com')
  assert.strictEqual(resultado.rol, 'Gerencia')
})

test('mapearUsuario - campos nulos', () => {
  const fila: FilaUsuarioJoin = {
    id: '1',
    auth_user_id: 'auth-1',
    correo: 'test@example.com',
    rol_id: 'rol-1',
    activo: true,
    ultimo_acceso: null,
    fecha_registro: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-15T10:30:00.000Z',
    dato_usuario: null,
  }
  const resultado = mapearUsuario(fila, null)
  assert.strictEqual(resultado.nombre, 'Sin Nombre')
  assert.strictEqual(resultado.rol, 'Sin asignar')
})

test('mapearUsuario - nombre completo vacío', () => {
  const fila: FilaUsuarioJoin = {
    id: '1',
    auth_user_id: 'auth-1',
    correo: 'test@example.com',
    rol_id: 'rol-1',
    activo: true,
    ultimo_acceso: '2024-01-15T10:30:00.000Z',
    fecha_registro: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-15T10:30:00.000Z',
    dato_usuario: {
      primer_nombre: '',
      segundo_nombre: '',
      primer_apellido: '',
      segundo_apellido: '',
      telefono: null,
      avatar_url: null,
      username: null,
    },
  }
  const resultado = mapearUsuario(fila, 'Administrador')
  assert.strictEqual(resultado.nombre, 'Sin Nombre')
})
