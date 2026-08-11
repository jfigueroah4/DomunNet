import { test } from 'node:test'
import assert from 'node:assert'
import { permisosDeRol, tienePermiso } from './permisos.middleware'

test('permisosDeRol - rol existe', () => {
  const permisos = permisosDeRol('Administrador')
  assert.ok(permisos.length > 0)
  assert.ok(permisos.includes('*.read'))
  assert.ok(permisos.includes('*.write'))
})

test('permisosDeRol - rol no existe', () => {
  const permisos = permisosDeRol('RolInexistente')
  assert.deepStrictEqual(permisos, [])
})

test('tienePermiso - wildcard *', () => {
  const permisosUsuario = ['*']
  assert.strictEqual(tienePermiso(permisosUsuario, 'cualquier.permiso'), true)
})

test('tienePermiso - modulo.*', () => {
  const permisosUsuario = ['usuarios.*']
  assert.strictEqual(tienePermiso(permisosUsuario, 'usuarios.read'), true)
  assert.strictEqual(tienePermiso(permisosUsuario, 'usuarios.write'), true)
  assert.strictEqual(tienePermiso(permisosUsuario, 'proyectos.read'), false)
})

test('tienePermiso - *.accion', () => {
  const permisosUsuario = ['*.read']
  assert.strictEqual(tienePermiso(permisosUsuario, 'usuarios.read'), true)
  assert.strictEqual(tienePermiso(permisosUsuario, 'proyectos.read'), true)
  assert.strictEqual(tienePermiso(permisosUsuario, 'usuarios.write'), false)
})

test('tienePermiso - permiso exacto', () => {
  const permisosUsuario = ['usuarios.read']
  assert.strictEqual(tienePermiso(permisosUsuario, 'usuarios.read'), true)
  assert.strictEqual(tienePermiso(permisosUsuario, 'usuarios.write'), false)
})

test('tienePermiso - permiso no incluido', () => {
  const permisosUsuario = ['usuarios.read']
  assert.strictEqual(tienePermiso(permisosUsuario, 'proyectos.read'), false)
})

test('tienePermiso - combinación de wildcards', () => {
  const permisosUsuario = ['*.read', 'usuarios.*']
  assert.strictEqual(tienePermiso(permisosUsuario, 'usuarios.read'), true)
  assert.strictEqual(tienePermiso(permisosUsuario, 'usuarios.write'), true)
  assert.strictEqual(tienePermiso(permisosUsuario, 'proyectos.read'), true)
  assert.strictEqual(tienePermiso(permisosUsuario, 'proyectos.write'), false)
})

test('tienePermiso - permiso sin acción', () => {
  const permisosUsuario = ['usuarios']
  assert.strictEqual(tienePermiso(permisosUsuario, 'usuarios'), true)
  assert.strictEqual(tienePermiso(permisosUsuario, 'usuarios.read'), false)
})
