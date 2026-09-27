import { describe, it, expect } from 'vitest'
import { normalizar, formatearFecha, mapearUsuario } from './usuarios.servicio'
import type { FilaUsuarioJoin } from './usuarios.servicio'

describe('Módulo Usuarios: Servicio', () => {
  it('normalizar - vacío', () => {
    expect(normalizar('')).toBe('')
  })

  it('normalizar - espacios múltiples', () => {
    expect(normalizar('  Hola  Mundo  ')).toBe('hola mundo')
  })

  it('normalizar - mayúsculas/minúsculas', () => {
    expect(normalizar('HoLa MuNdO')).toBe('hola mundo')
  })

  it('formatearFecha - null', () => {
    expect(formatearFecha(null)).toBe('Nunca')
  })

  it('formatearFecha - fecha válida', () => {
    const fecha = '2024-01-15T10:30:00.000Z'
    const resultado = formatearFecha(fecha)
    expect(resultado).not.toBe('Nunca')
  })

  it('formatearFecha - fecha inválida', () => {
    const resultado = formatearFecha('fecha-invalida')
    expect(resultado).toBe('fecha-invalida')
  })

  it('mapearUsuario - dato_usuario como array', () => {
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
    expect(resultado.nombre).toBe('Juan Carlos Pérez López')
    expect(resultado.correo).toBe('test@example.com')
    expect(resultado.rol).toBe('Administrador')
  })

  it('mapearUsuario - dato_usuario como objeto', () => {
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
    expect(resultado.nombre).toBe('María García')
    expect(resultado.correo).toBe('test@example.com')
    expect(resultado.rol).toBe('Gerencia')
  })

  it('mapearUsuario - campos nulos', () => {
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
    expect(resultado.nombre).toBe('Sin Nombre')
    expect(resultado.rol).toBe('Sin asignar')
  })

  it('mapearUsuario - nombre completo vacío', () => {
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
    expect(resultado.nombre).toBe('Sin Nombre')
  })
})
