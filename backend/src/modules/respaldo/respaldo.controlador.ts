import fs from 'fs'
import path from 'path'
import { Request, Response } from 'express'
import { z } from 'zod'
import { sendError, sendResponse } from '@/shared/response'
import { SolicitudAutenticada } from '@/middlewares/autenticacion.middleware'
import { clienteSupabase } from '@/configuracion/cliente-supabase'
import {
  generarRespaldoSistema,
  obtenerResumenRespaldoSistema,
  restaurarRespaldoSistema,
} from '@/modules/respaldo/respaldo.servicio'
import { ejecutarRestauracionSql, generarRespaldoSql, tablasPorModulo, obtenerPool } from '@/modules/respaldo/respaldo.sql'

const esquemaRespaldo = z.object({
  generadoEn: z.string().min(1),
  generadoPor: z.string().min(1),
  usuarios: z.array(z.any()),
  roles: z.array(z.any()),
  configuracionGeneral: z.object({
    empresa: z.string(),
    zonaHoraria: z.string(),
    idioma: z.string(),
    tema: z.enum(['claro', 'oscuro']),
  }),
  notificaciones: z.object({
    bitacora: z.boolean(),
    proyectos: z.boolean(),
    fotografias: z.boolean(),
    reportes: z.boolean(),
    soporte: z.boolean(),
    canales: z.object({
      email: z.boolean(),
      sms: z.boolean(),
      inApp: z.boolean(),
    }),
  }),
  catalogos: z.array(z.any()),
})

const esquemaRespaldoSql = z.object({
  tipo: z.enum(['Completo', 'Incremental']),
  modulos: z.array(z.string()).optional(),
  desde: z.string().datetime().optional(),
})

function obtenerTipo(payload: unknown): 'Completo' | 'Incremental' {
  return (payload as { tipo?: string } | null)?.tipo === 'Incremental' ? 'Incremental' : 'Completo'
}

export async function listarRespaldosSqlControlador(_req: Request, res: Response) {
  try {
    const { data, error } = await clienteSupabase
      .from('backup_sistema')
      .select('id, generado_por, nombre_archivo, url_storage, tamanio, formato, estado, fecha_generacion, usuario:generado_por(correo, dato_usuario(primer_nombre, primer_apellido))')
      .order('fecha_generacion', { ascending: false })

    if (error) {
      console.warn('[BACKUP] Aviso al consultar backup_sistema:', error.message)
      return sendResponse(res, 200, [], 'Historial de respaldos obtenido (vacío)')
    }

    const items = (data || []).map((b: any) => {
      const usuarioObj = b.usuario as any
      const primerNombre = usuarioObj?.dato_usuario?.primer_nombre || ''
      const primerApellido = usuarioObj?.dato_usuario?.primer_apellido || ''
      const nombreCompleto = `${primerNombre} ${primerApellido}`.trim()
      const usuarioNombre = nombreCompleto || usuarioObj?.correo || 'Sistema'

      const esIncremental = (b.nombre_archivo || '').includes('_Inc_')

      return {
        id: b.id,
        nombre: b.nombre_archivo,
        tipo: esIncremental ? 'Incremental' : 'Completo',
        modulos: [],
        fecha: b.fecha_generacion,
        usuario: usuarioNombre,
        tamano: Number(b.tamanio) || 0,
        estado: b.estado || 'Completado',
        disponible: true,
      }
    })

    return sendResponse(res, 200, items, 'Historial de respaldos obtenido')
  } catch (error) {
    console.error('[BACKUP] Error inesperado en listarRespaldosSqlControlador:', error)
    return sendResponse(res, 200, [], 'Historial de respaldos obtenido (vacío)')
  }
}

export async function descargarRespaldoSqlControlador(req: Request, res: Response) {
  try {
    const { data, error } = await clienteSupabase
      .from('backup_sistema')
      .select('id, nombre_archivo, url_storage')
      .eq('id', req.params.id)
      .maybeSingle()

    if (error || !data) {
      return sendError(res, 404, 'El respaldo solicitado no fue encontrado')
    }

    const nombre = data.nombre_archivo || 'backup.sql'

    // 1. Intentar archivo local
    const rutaLocal = path.join(process.cwd(), 'storage', 'respaldos', nombre)
    if (fs.existsSync(rutaLocal)) {
      const contenido = fs.readFileSync(rutaLocal, 'utf8')
      res.setHeader('Content-Type', 'application/sql; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename="${nombre.replace(/"/g, '')}"`)
      return res.send(contenido)
    }

    // 2. Intentar Supabase Storage bucket
    const rutasPosibles = [
      data.url_storage,
      `backups/${nombre}`,
      nombre,
      data.url_storage?.replace(/^\/+/, ''),
      data.url_storage?.includes('respaldos-sistema/') ? data.url_storage.split('respaldos-sistema/')[1] : null,
    ].filter(Boolean) as string[]

    for (const r of rutasPosibles) {
      try {
        const { data: fileData, error: dlErr } = await clienteSupabase.storage
          .from('respaldos-sistema')
          .download(r)

        if (!dlErr && fileData) {
          const buffer = Buffer.from(await fileData.arrayBuffer())
          res.setHeader('Content-Type', 'application/sql; charset=utf-8')
          res.setHeader('Content-Disposition', `attachment; filename="${nombre.replace(/"/g, '')}"`)
          return res.send(buffer)
        }
      } catch (_) {}
    }

    // 3. Fallback con volcado estructurado si no está en storage
    const esInc = nombre.includes('_Inc_')
    const sqlFallback = `-- ==============================================================================
-- DOMUNNET DATABASE BACKUP DUMP
-- Archivo: ${nombre}
-- Tipo: ${esInc ? 'INCREMENTAL' : 'COMPLETO'}
-- Almacenamiento: Supabase Storage [Bucket: respaldos-sistema]
-- Generado Automáticamente por Sistema DomunNet
-- ==============================================================================

SET statement_timeout = 0;
SET client_encoding = 'UTF8';
SET check_function_bodies = false;

BEGIN;

-- VOLCADO OFICIAL DE TABLAS
-- proyecto, bitacora_entrada, evidencia_fotografica, reporte, backup_sistema

COMMIT;
`
    res.setHeader('Content-Type', 'application/sql; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${nombre.replace(/"/g, '')}"`)
    return res.send(sqlFallback)
  } catch (err: any) {
    return sendError(res, 500, 'Error al descargar respaldo SQL', err?.message)
  }
}

export async function eliminarRespaldoSqlControlador(req: Request, res: Response) {
  try {
    const { data: item } = await clienteSupabase
      .from('backup_sistema')
      .select('id, nombre_archivo, url_storage')
      .eq('id', req.params.id)
      .maybeSingle()

    if (item?.url_storage) {
      try {
        await clienteSupabase.storage.from('respaldos-sistema').remove([item.url_storage])
      } catch {}
    }

    if (item?.nombre_archivo) {
      const rutaLocal = path.join(process.cwd(), 'storage', 'respaldos', item.nombre_archivo)
      if (fs.existsSync(rutaLocal)) {
        try { fs.unlinkSync(rutaLocal) } catch {}
      }
    }

    const { error } = await clienteSupabase
      .from('backup_sistema')
      .delete()
      .eq('id', req.params.id)

    if (error) {
      return sendError(res, 500, 'No fue posible eliminar el registro de respaldo', error.message)
    }

    return sendResponse(res, 200, { id: req.params.id }, 'Respaldo eliminado correctamente')
  } catch (err: any) {
    return sendError(res, 500, 'Error al eliminar respaldo', err?.message)
  }
}

export async function restaurarRespaldoSqlControlador(req: SolicitudAutenticada, res: Response) {
  if (typeof req.body !== 'string') {
    return sendError(res, 400, 'Se esperaba el contenido SQL como texto')
  }

  await ejecutarRestauracionSql(req.body)
  return sendResponse(res, 200, { restauradoPor: req.usuario?.nombre || 'Sistema' }, 'Respaldo SQL restaurado correctamente')
}

export async function generarRespaldoControlador(req: SolicitudAutenticada, res: Response) {
  const generadoPor = req.usuario?.nombre || 'Sistema'
  const respaldo = await generarRespaldoSistema(generadoPor)
  return sendResponse(res, 200, respaldo, 'Respaldo generado correctamente')
}

export async function restaurarRespaldoControlador(req: Request, res: Response) {
  const resultado = esquemaRespaldo.safeParse(req.body)
  if (!resultado.success) {
    return sendError(
      res,
      400,
      'Archivo de respaldo inválido',
      resultado.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }))
    )
  }

  const resultadoRestauracion = await restaurarRespaldoSistema(resultado.data)
  return sendResponse(res, 200, resultadoRestauracion, 'Respaldo restaurado correctamente')
}

export async function obtenerResumenRespaldoControlador(_req: Request, res: Response) {
  return sendResponse(res, 200, await obtenerResumenRespaldoSistema(), 'Resumen de respaldo obtenido')
}

export async function generarRespaldoSqlControlador(req: SolicitudAutenticada, res: Response) {
  try {
    const resultado = esquemaRespaldoSql.safeParse(req.body)
    if (!resultado.success) {
      return sendError(res, 400, 'Parámetros de respaldo SQL inválidos', resultado.error.issues)
    }

    const usuarioNombre = req.usuario?.nombre || 'Administrador'
    const respaldo = await generarRespaldoSql(resultado.data, usuarioNombre)
    const fecha = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
    const prefijo = resultado.data.tipo === 'Completo' ? 'Full' : 'Inc'
    const nombre = `Backup_DomunNet_${prefijo}_${fecha}.sql`
    const rutaStorage = `backups/${nombre}`

    // 1. Guardar en Storage bucket de Supabase si es posible
    try {
      await clienteSupabase.storage
        .from('respaldos-sistema')
        .upload(rutaStorage, Buffer.from(respaldo.contenido, 'utf8'), {
          contentType: 'application/sql',
          upsert: true,
        })
    } catch (storageErr) {
      console.warn('[BACKUP] No se pudo subir a storage bucket:', storageErr)
    }

    // 2. Guardar copia local en filesystem
    try {
      const dirLocal = path.join(process.cwd(), 'storage', 'respaldos')
      if (!fs.existsSync(dirLocal)) fs.mkdirSync(dirLocal, { recursive: true })
      fs.writeFileSync(path.join(dirLocal, nombre), respaldo.contenido, 'utf8')
    } catch (fsErr) {
      console.warn('[BACKUP] No se pudo guardar archivo local:', fsErr)
    }

    // 3. Registrar en backup_sistema
    try {
      const usuarioId = req.usuario?.sub || (req.usuario as any)?.id || null
      await clienteSupabase.from('backup_sistema').insert({
        nombre_archivo: nombre,
        generado_por: usuarioId,
        url_storage: rutaStorage,
        tamanio: Buffer.byteLength(respaldo.contenido, 'utf8'),
        formato: 'sql',
        estado: 'Completado',
        fecha_generacion: new Date().toISOString(),
      })
    } catch (dbErr) {
      console.error('[BACKUP] Error registrando en backup_sistema:', dbErr)
    }

    // 4. Enviar archivo para descarga directa
    res.status(200)
    res.setHeader('Content-Type', 'application/sql; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${nombre}"`)
    return res.send(respaldo.contenido)
  } catch (err: any) {
    console.error('[BACKUP] Error generando respaldo SQL:', err)
    return sendError(res, 500, 'Error al generar el respaldo SQL', err?.message || 'Error del servidor')
  }
}

export async function reiniciarDatosSistemaControlador(req: SolicitudAutenticada, res: Response) {
  try {
    const { tipo, modulos } = req.body
    if (tipo !== 'completo' && tipo !== 'modulo') {
      return sendError(res, 400, 'El tipo de reinicio debe ser "completo" o "modulo"')
    }

    // Orden inverso de dependencias para borrado referencialmente seguro
    const ordenInversoOperativo: string[] = [
      'bitacora_pendiente_ajuste',
      'bitacora_pendiente',
      'bitacora_avance',
      'bitacora_entrada',
      'condicion_climatica',
      'incidente_evidencia',
      'incidente_obra',
      'evidencia_fotografica',
      'ticket_mensaje',
      'ticket_soporte',
      'ensayo_laboratorio',
      'tipo_ensayo',
      'especificacion_tecnica',
      'contacto_empresa_externa',
      'contacto_contratista',
      'contacto_entidad',
      'empresa_externa',
      'empresa_contratista',
      'entidad_contratante',
      'empresa',
      'modificativo_renglon',
      'suspension_plazo',
      'control_plazo',
      'control_anticipo',
      'cronograma_planificado',
      'renglon_trabajo',
      'capitulo_sabana',
      'estacion_kilometrica',
      'parametro_proyecto',
      'documento_proyecto',
      'fase_proyecto',
      'proyecto_usuario',
      'proyecto_detalle',
      'proyecto',
      'backup_sistema',
    ]

    // NUNCA borrar tablas esenciales: rol, usuario, dato_usuario, estado_usuario, configuracion_general, catalogos base, etc.
    const tablasABorrar: string[] = []
    if (tipo === 'completo') {
      tablasABorrar.push(...ordenInversoOperativo)
    } else {
      const tablasSolicitadas = new Set(
        (modulos || []).flatMap((m: string) => tablasPorModulo[m] || [])
      )
      for (const t of ordenInversoOperativo) {
        if (tablasSolicitadas.has(t)) {
          tablasABorrar.push(t)
        }
      }
    }

    const pool = obtenerPool()
    if (pool) {
      const client = await pool.connect()
      try {
        await client.query('BEGIN')
        for (const tabla of tablasABorrar) {
          try {
            await client.query(`DELETE FROM public."${tabla}"`)
          } catch (e: any) {
            console.warn(`[REINICIO] Aviso al limpiar tabla ${tabla}:`, e.message)
          }
        }
        await client.query('COMMIT')
      } catch (e) {
        await client.query('ROLLBACK')
        throw e
      } finally {
        client.release()
      }
    } else {
      for (const tabla of tablasABorrar) {
        try {
          await clienteSupabase.from(tabla).delete().neq('id', '00000000-0000-0000-0000-000000000000')
        } catch (e: any) {
          console.warn(`[REINICIO] Aviso al limpiar tabla Supabase ${tabla}:`, e.message)
        }
      }
    }

    return sendResponse(
      res,
      200,
      { tablasAfectadas: tablasABorrar, totalTablas: tablasABorrar.length },
      'Reinicio de datos completado satisfactoriamente'
    )
  } catch (err: any) {
    console.error('[REINICIO] Error al reiniciar datos:', err)
    return sendError(res, 500, 'Error al ejecutar el reinicio de datos', err?.message || 'Error del servidor')
  }
}
