import { describe, it, expect } from 'vitest'
import { esquemaUsuario } from './usuarios.controlador'

describe('Módulo Usuarios: Controlador (esquemaUsuario)', () => {
  it('esquemaUsuario - nombre de 1 carácter (válido)', () => {
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
    expect(resultado.success).toBe(true)
  })

  it('esquemaUsuario - apellido con espacios (válido)', () => {
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
    expect(resultado.success).toBe(true)
  })

  it('esquemaUsuario - username con caracteres inválidos (debe fallar)', () => {
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
    expect(resultado.success).toBe(false)
    if (!resultado.success) {
      expect(resultado.error.issues.some(issue => issue.message.includes('Nombre de usuario inválido'))).toBe(true)
    }
  })

  it('esquemaUsuario - username válido', () => {
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
    expect(resultado.success).toBe(true)
  })

  it('esquemaUsuario - campos requeridos faltantes', () => {
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
    expect(resultado.success).toBe(false)
    if (!resultado.success) {
      expect(resultado.error.issues.some(issue => issue.path.includes('primer_nombre'))).toBe(true)
      expect(resultado.error.issues.some(issue => issue.path.includes('primer_apellido'))).toBe(true)
    }
  })

  it('esquemaUsuario - username vacío (válido, opcional)', () => {
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
    expect(resultado.success).toBe(true)
  })

  it('esquemaUsuario - username null (válido, opcional)', () => {
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
    expect(resultado.success).toBe(true)
  })

  it('esquemaUsuario - username muy corto (debe fallar)', () => {
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
    expect(resultado.success).toBe(false)
  })

  it('esquemaUsuario - username muy largo (debe fallar)', () => {
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
    expect(resultado.success).toBe(false)
  })

  it('esquemaUsuario - correo inválido (debe fallar)', () => {
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
    expect(resultado.success).toBe(false)
  })

  it('esquemaUsuario - estado inválido (debe fallar)', () => {
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
    expect(resultado.success).toBe(false)
  })
})
