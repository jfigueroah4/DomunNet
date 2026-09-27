import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  validarOperacionProyectoPermitida,
  iniciarReplanificacionProyecto,
  activarReplanificacionProyecto,
  actualizarEstadoProyecto,
  ValidationError
} from './proyectos.servicio'
import { clienteSupabase } from '../../configuracion/cliente-supabase'
import { requierePermisos } from '../../middlewares/permisos.middleware'

describe('Módulo Proyectos: Comportamiento Real de Pausado y Replanificación', () => {
  let proyectoPruebaId: string
  let estadoActivoId: string
  let estadoPausadoId: string

  beforeAll(async () => {
    // 1. Obtener IDs reales de catálogo para 'activo' y 'pausado'
    const { data: estados } = await clienteSupabase
      .from('catalogo_item')
      .select('id, codigo')
      .in('codigo', ['activo', 'pausado'])

    estadoActivoId = estados?.find(e => e.codigo === 'activo')?.id || ''
    estadoPausadoId = estados?.find(e => e.codigo === 'pausado')?.id || ''

    const { data: empresa } = await clienteSupabase.from('empresa').select('id').limit(1).single()
    const empresaId = empresa?.id

    // 2. Crear proyecto de prueba real
    const { data: proy, error } = await clienteSupabase
      .from('proyecto')
      .insert({
        codigo: `TEST-PAUSA-${Date.now()}`,
        nombre: 'Proyecto Test Pausado y Replanificación',
        descripcion: 'Verificación de comportamiento en backend real',
        empresa_id: empresaId,
        estado_id: estadoActivoId,
        fecha_inicio: '2026-09-01',
        fecha_fin_estimada: '2026-12-31',
        en_replanificacion: false
      })
      .select('id')
      .single()

    if (error || !proy) {
      throw new Error(`No se pudo crear proyecto de prueba: ${error?.message}`)
    }
    proyectoPruebaId = proy.id
  })

  afterAll(async () => {
    // Limpieza de datos de prueba
    if (proyectoPruebaId) {
      await clienteSupabase.from('suspension_plazo').delete().eq('proyecto_id', proyectoPruebaId)
      await clienteSupabase.from('proyecto').delete().eq('id', proyectoPruebaId)
    }
  })

  it('1. Debe permitir operaciones (bitacora, analitico, fechas) cuando el proyecto está ACTIVO', async () => {
    await expect(validarOperacionProyectoPermitida(proyectoPruebaId, 'bitacora')).resolves.not.toThrow()
    await expect(validarOperacionProyectoPermitida(proyectoPruebaId, 'analitico')).resolves.not.toThrow()
    await expect(validarOperacionProyectoPermitida(proyectoPruebaId, 'fechas')).resolves.not.toThrow()
  })

  it('2. Debe BLOQUEAR bitácora, analítico y edición de fechas cuando el proyecto se cambia a PAUSADO', async () => {
    // Cambiar estado a pausado
    await clienteSupabase
      .from('proyecto')
      .update({ estado_id: estadoPausadoId })
      .eq('id', proyectoPruebaId)

    // Intento de registrar bitácora -> debe lanzar ValidationError con campo 'estado'
    await expect(validarOperacionProyectoPermitida(proyectoPruebaId, 'bitacora')).rejects.toThrowError(ValidationError)
    await expect(validarOperacionProyectoPermitida(proyectoPruebaId, 'bitacora')).rejects.toThrow(/No se pueden registrar avances de Bitácora cuando el proyecto está en estado 'pausado'/)

    // Intento de analítico -> debe lanzar ValidationError
    await expect(validarOperacionProyectoPermitida(proyectoPruebaId, 'analitico')).rejects.toThrowError(ValidationError)
    await expect(validarOperacionProyectoPermitida(proyectoPruebaId, 'analitico')).rejects.toThrow(/Operación no permitida en Analítico para el estado 'pausado'/)

    // Intento de edición de fechas -> debe lanzar ValidationError
    await expect(validarOperacionProyectoPermitida(proyectoPruebaId, 'fechas')).rejects.toThrowError(ValidationError)
    await expect(validarOperacionProyectoPermitida(proyectoPruebaId, 'fechas')).rejects.toThrow(/No se pueden editar las fechas/)
  })

  it('3. Debe BLOQUEAR operaciones cuando en_replanificacion = true (ciclo de modificación activo)', async () => {
    // Regresar a activo pero iniciar ciclo de replanificación
    await clienteSupabase
      .from('proyecto')
      .update({ estado_id: estadoActivoId })
      .eq('id', proyectoPruebaId)

    await iniciarReplanificacionProyecto(proyectoPruebaId)

    // Verificar en BD que en_replanificacion está en true
    const { data: proyCheck } = await clienteSupabase
      .from('proyecto')
      .select('en_replanificacion')
      .eq('id', proyectoPruebaId)
      .single()

    expect(proyCheck?.en_replanificacion).toBe(true)

    // Todas las operaciones deben ser rechazadas
    await expect(validarOperacionProyectoPermitida(proyectoPruebaId, 'bitacora')).rejects.toThrow(/en ciclo de modificación de plazo/)
    await expect(validarOperacionProyectoPermitida(proyectoPruebaId, 'analitico')).rejects.toThrow(/en ciclo de modificación de plazo/)
    await expect(validarOperacionProyectoPermitida(proyectoPruebaId, 'fechas')).rejects.toThrow(/en ciclo de modificación de plazo/)
  })

  it('4. Debe reanudar y cerrar suspensión al ejecutar activarReplanificacionProyecto', async () => {
    // Insertar suspensión de plazo
    await clienteSupabase
      .from('suspension_plazo')
      .insert({
        proyecto_id: proyectoPruebaId,
        fecha_inicio: '2026-09-01',
        fecha_fin: '2026-09-05',
        motivo: 'Suspensión de prueba para reactivación',
        numero_acta_resolucion: 'ACTA-TEST-001'
      })

    await activarReplanificacionProyecto({
      proyectoId: proyectoPruebaId,
      esReanudacionPausa: true,
      fechaReanudacion: '2026-09-15',
      nuevaFechaFin: '2026-12-31'
    })

    // Verificar en BD que en_replanificacion regresó a false y la suspensión tiene fecha_fin actualizada
    const { data: proyActivo } = await clienteSupabase
      .from('proyecto')
      .select('en_replanificacion, estado_id')
      .eq('id', proyectoPruebaId)
      .single()

    expect(proyActivo?.en_replanificacion).toBe(false)
    expect(proyActivo?.estado_id).toBe(estadoActivoId)

    const { data: suspCerrada } = await clienteSupabase
      .from('suspension_plazo')
      .select('fecha_fin')
      .eq('proyecto_id', proyectoPruebaId)
      .single()

    expect(suspCerrada?.fecha_fin).toBe('2026-09-15')
  })

  it('5. Middleware de permisos debe RECHAZAR con 403 activación de proyecto o cambio de estado para roles sin permisos', () => {
    const middleware = requierePermisos('proyectos.write')
    
    // Mock de req con usuario sin permisos de proyectos
    const reqSinPermiso = {
      usuario: {
        id: 'user-sin-permiso',
        rol: 'Visitante',
        permisos: ['usuarios.read'] // NO tiene permisos de proyectos
      }
    } as any

    let statusCode = 0
    let jsonResponse: any = null
    const resMock = {
      status: (code: number) => {
        statusCode = code
        return {
          json: (data: any) => { jsonResponse = data }
        }
      }
    } as any

    let nextCalled = false
    const nextMock = () => { nextCalled = true }

    middleware(reqSinPermiso, resMock, nextMock)

    expect(nextCalled).toBe(false)
    expect(statusCode).toBe(403)
    expect(jsonResponse?.message).toMatch(/No tienes permisos/i)
  })
})
