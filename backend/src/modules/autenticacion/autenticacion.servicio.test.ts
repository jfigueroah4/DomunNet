import { describe, it, expect } from 'vitest'
import { obtenerNombreCompleto, esCorreo, detectarNombreDispositivo, LimiteDispositivosError } from './autenticacion.servicio'
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

  it('detectarNombreDispositivo - detecta navegadores y sistemas operativos', () => {
    expect(detectarNombreDispositivo('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36')).toBe('Windows PC (Chrome)')
    expect(detectarNombreDispositivo('Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1')).toBe('iPhone (Safari)')
    expect(detectarNombreDispositivo('Mozilla/5.0 (Linux; Android 13; SM-S908B) Chrome/120.0.0.0 Mobile Safari/537.36')).toBe('Android (Chrome)')
    expect(detectarNombreDispositivo('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15')).toBe('Mac (Safari)')
    expect(detectarNombreDispositivo('')).toBe('Dispositivo Desconocido')
  })

  it('LimiteDispositivosError - almacena lista de dispositivos activos correctamente', () => {
    const dispositivos = [
      { id: 'log-1', dispositivo: 'Windows PC (Chrome)', ip: '192.168.1.10', fechaHora: '2026-10-17T08:00:00Z' },
      { id: 'log-2', dispositivo: 'iPhone (Safari)', ip: '192.168.1.20', fechaHora: '2026-10-17T09:00:00Z' },
    ]
    const err = new LimiteDispositivosError(dispositivos)
    expect(err.message).toBe('LIMITE_DISPOSITIVOS_ALCANZADO')
    expect(err.dispositivosActivos).toHaveLength(2)
    expect(err.dispositivosActivos[0].dispositivo).toBe('Windows PC (Chrome)')
    expect(err.dispositivosActivos[1].dispositivo).toBe('iPhone (Safari)')
  })
})
