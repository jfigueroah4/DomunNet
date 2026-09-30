import { describe, it, expect } from 'vitest'
import { tablasPermitidas } from './models'
import { crearRegistro, actualizarRegistro, eliminarRegistro } from './mantenimiento.servicio'

describe('Suite de Pruebas: Mantenimiento de Tablas e Integridad Referencial', () => {
  it('Debe tener configuradas todas las 53 tablas de la base de datos de producción', () => {
    const tableKeys = Object.keys(tablasPermitidas)
    expect(tableKeys.length).toBe(53)
    expect(tableKeys).toContain('proyecto')
    expect(tableKeys).toContain('auditoria_operativa')
    expect(tableKeys).toContain('seguridad_log')
    expect(tableKeys).toContain('backup_sistema')
    expect(tableKeys).toContain('restauracion_sistema')
    expect(tableKeys).toContain('estado_usuario')
    expect(tableKeys).toContain('ticket_soporte')
    expect(tableKeys).toContain('ticket_mensaje')
    expect(tableKeys).toContain('bitacora_pendiente_ajuste')
  })

  it('Debe bloquear la creación y edición directa en tablas de auditoría y registros protegidos', async () => {
    const auditConfig = tablasPermitidas['auditoria_operativa']
    expect(auditConfig.soloLectura).toBe(true)
    expect(auditConfig.bloquearCreacion).toBe(true)
    expect(auditConfig.bloquearModificacion).toBe(true)
    expect(auditConfig.bloquearEliminacion).toBe(true)

    await expect(crearRegistro(auditConfig, { accion: 'TEST' })).rejects.toThrow(
      /auditoría operativa son generados automáticamente/i
    )

    await expect(actualizarRegistro(auditConfig, '00000000-0000-0000-0000-000000000000', { accion: 'TEST' })).rejects.toThrow(
      /auditoría operativa son generados automáticamente/i
    )

    await expect(eliminarRegistro(auditConfig, '00000000-0000-0000-0000-000000000000')).rejects.toThrow(
      /auditoría operativa son generados automáticamente/i
    )
  })

  it('Debe bloquear creación en tablas secundarias dependientes de flujos específicos', async () => {
    const ajusteConfig = tablasPermitidas['bitacora_pendiente_ajuste']
    expect(ajusteConfig.bloquearCreacion).toBe(true)

    await expect(crearRegistro(ajusteConfig, { valor_descuento: 10 })).rejects.toThrow(
      /flujo de aprobación en la Bitácora/i
    )

    const modConfig = tablasPermitidas['modificativo_renglon']
    expect(modConfig.bloquearCreacion).toBe(true)
    await expect(crearRegistro(modConfig, { cantidad_delta: 5 })).rejects.toThrow(
      /módulo de Modificatorios/i
    )
  })

  it('Debe tener configuradas dependencias referenciales en tablas maestras', () => {
    const proyectoConfig = tablasPermitidas['proyecto']
    expect(proyectoConfig.dependenciasDelete).toBeDefined()
    expect(proyectoConfig.dependenciasDelete!.length).toBeGreaterThanOrEqual(10)
    
    const depTableNames = proyectoConfig.dependenciasDelete!.map(d => d.tablaDependiente)
    expect(depTableNames).toContain('bitacora_entrada')
    expect(depTableNames).toContain('bitacora_avance')
    expect(depTableNames).toContain('renglon_trabajo')
    expect(depTableNames).toContain('fase_proyecto')
    expect(depTableNames).toContain('documento_proyecto')
  })
})
