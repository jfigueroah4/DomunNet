import { describe, it, expect } from 'vitest'
import { obtenerNombreCompleto, esCorreo } from './autenticacion.servicio'
import type { FilaUsuarioAutenticacion } from './autenticacion.servicio'

describe('Módulo Autenticación: Servicio', () => {
  it('obtenerNombreCompleto - dato como array', () => {
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
    expect(resultado).toBe('Juan Carlos Pérez López')
  })

  it('obtenerNombreCompleto - dato como objeto', () => {
    const dato: FilaUsuarioAutenticacion['dato_usuario'] = {
      primer_nombre: 'María',
      segundo_nombre: null,
      primer_apellido: 'García',
      segundo_apellido: null,
      telefono: '87654321',
      avatar_url: null,
    }
    const resultado = obtenerNombreCompleto(dato)
    expect(resultado).toBe('María García')
  })

  it('obtenerNombreCompleto - dato null', () => {
    const resultado = obtenerNombreCompleto(null)
    expect(resultado).toBe('Usuario')
  })

  it('obtenerNombreCompleto - campos parciales', () => {
    const dato: FilaUsuarioAutenticacion['dato_usuario'] = {
      primer_nombre: 'Pedro',
      segundo_nombre: null,
      primer_apellido: 'Martínez',
      segundo_apellido: null,
      telefono: null,
      avatar_url: null,
    }
    const resultado = obtenerNombreCompleto(dato)
    expect(resultado).toBe('Pedro Martínez')
  })

  it('obtenerNombreCompleto - todos campos nulos', () => {
    const dato: FilaUsuarioAutenticacion['dato_usuario'] = {
      primer_nombre: '',
      segundo_nombre: '',
      primer_apellido: '',
      segundo_apellido: '',
      telefono: null,
      avatar_url: null,
    }
    const resultado = obtenerNombreCompleto(dato)
    expect(resultado).toBe('Usuario')
  })

  it('esCorreo - vacío', () => {
    expect(esCorreo('')).toBe(false)
  })

  it('esCorreo - múltiples @', () => {
    expect(esCorreo('user@@domain.com')).toBe(true)
  })

  it('esCorreo - sin @', () => {
    expect(esCorreo('username')).toBe(false)
  })

  it('esCorreo - con @', () => {
    expect(esCorreo('user@domain.com')).toBe(true)
  })

  it('esCorreo - solo @', () => {
    expect(esCorreo('@')).toBe(true)
  })
})
