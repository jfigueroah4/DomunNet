import { clienteSupabase } from '@/configuracion/cliente-supabase'
import { logger } from '@/shared/utils/logger'

class PostgresError extends Error {
  statusCode: number
  errorCode: string
  campo?: string

  constructor(message: string, statusCode: number, errorCode: string, campo?: string) {
    super(message)
    this.statusCode = statusCode
    this.errorCode = errorCode
    this.campo = campo
  }
}

async function registrarFallo(tabla: string, operacion: string, errorObj: any, payload: any, usuario_id?: string) {
  logger.error(`Operación fallida en ${tabla} [${operacion}]`, { error: errorObj, payload, usuario_id })
  try {
    await clienteSupabase.from('seguridad_log').insert([{
      usuario_id: usuario_id || null,
      accion: `Fallo ${operacion} en ${tabla}`,
      exitoso: false,
      detalles: { error: errorObj, payload }
    }])
  } catch (e) {
    logger.error('No se pudo escribir en seguridad_log', e)
  }
}

function traducirErrorPostgres(error: any): PostgresError {
  const code = error.code
  let mensaje = 'Error inesperado en la base de datos'
  let statusCode = 500
  let errorCode = 'DB_ERROR'
  let campo = undefined

  if (code === '23505') {
    // UNIQUE
    statusCode = 409
    errorCode = 'UNIQUE_VIOLATION'
    mensaje = 'Ya existe un registro con ese valor'
    const match = error.message.match(/unique constraint "(.*?)"/i)
    if (match) campo = match[1]
  } else if (code === '23503') {
    // FOREIGN KEY
    statusCode = 409
    errorCode = 'FK_VIOLATION'
    mensaje = 'Este registro está relacionado con otra información en el sistema'
    const match = error.message.match(/foreign key constraint "(.*?)"/i)
    if (match) campo = match[1]
  } else if (code === '23502') {
    // NOT NULL
    statusCode = 400
    errorCode = 'NOT_NULL_VIOLATION'
    mensaje = 'Falta un valor obligatorio'
  } else if (code === '22P02') {
    // INVALID TEXT REPRESENTATION
    statusCode = 400
    errorCode = 'INVALID_TYPE'
    mensaje = 'Formato de dato inválido'
  } else if (!code) {
    statusCode = 503
    errorCode = 'NETWORK_ERROR'
    mensaje = 'No se pudo conectar con la base de datos. Verifica tu conexión e intenta de nuevo.'
  }

  return new PostgresError(mensaje, statusCode, errorCode, campo)
}

export async function listarRegistros(
  tabla: string, 
  columnasPermitidas: string,
  pagina: number,
  limite: number,
  busqueda?: string,
  columnaOrden?: string,
  direccionOrden: 'asc' | 'desc' = 'asc',
  filtros: Record<string, any> = {}
) {
  let query = clienteSupabase.from(tabla).select(columnasPermitidas, { count: 'exact' })

  if (busqueda) {
    // Buscar globalmente en nombre, descripcion (campos comunes) si aplica
    // En un esquema 100% genérico es complejo hacer un ilike a todas las columnas, 
    // asumiremos que se busca por 'nombre' o 'descripcion' como base genérica
    query = query.or(`nombre.ilike.%${busqueda}%,descripcion.ilike.%${busqueda}%`)
  }

  for (const [key, value] of Object.entries(filtros)) {
    if (value !== undefined && value !== null && value !== '') {
      query = query.eq(key, value)
    }
  }

  if (columnaOrden) {
    query = query.order(columnaOrden, { ascending: direccionOrden === 'asc' })
  }

  const from = (pagina - 1) * limite
  const to = from + limite - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) throw new Error(`Error al listar ${tabla}: ${error.message}`)
  return { data, total: count || 0 }
}

export async function obtenerRegistro(tabla: string, id: string, columnasPermitidas: string) {
  const { data, error } = await clienteSupabase
    .from(tabla)
    .select(columnasPermitidas)
    .eq('id', id)
    .single()

  if (error) throw new Error(`Error al obtener ${tabla}: ${error.message}`)
  return data
}

export async function crearRegistro(tabla: string, payload: any, usuario_id?: string) {
  const { data, error } = await clienteSupabase
    .from(tabla)
    .insert([payload])
    .select()
    .single()

  if (error) {
    await registrarFallo(tabla, 'CREAR', error, payload, usuario_id)
    throw traducirErrorPostgres(error)
  }
  return data
}

export async function actualizarRegistro(tabla: string, id: string, payload: any, usuario_id?: string) {
  const { data, error } = await clienteSupabase
    .from(tabla)
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    await registrarFallo(tabla, 'ACTUALIZAR', error, { id, ...payload }, usuario_id)
    throw traducirErrorPostgres(error)
  }
  return data
}

// Verificación explícita pre-eliminación
async function chequearDependenciasFK(tabla: string, id: string) {
  // Ejemplos específicos mapeados:
  if (tabla === 'catalogo') {
    const { count } = await clienteSupabase.from('catalogo_item').select('id', { count: 'exact' }).eq('catalogo_id', id)
    if (count && count > 0) throw new PostgresError(`Existen ${count} ítems asociados a este catálogo`, 409, 'FK_VIOLATION')
  }
  if (tabla === 'proyecto') {
    const { count } = await clienteSupabase.from('fase_proyecto').select('id', { count: 'exact' }).eq('proyecto_id', id)
    if (count && count > 0) throw new PostgresError(`Existen ${count} fases de proyecto asociadas a este registro`, 409, 'FK_VIOLATION')
  }
  if (tabla === 'departamento') {
    const { count } = await clienteSupabase.from('municipio').select('id', { count: 'exact' }).eq('departamento_id', id)
    if (count && count > 0) throw new PostgresError(`Existen ${count} municipios asociados a este departamento`, 409, 'FK_VIOLATION')
  }
}

export async function eliminarRegistro(tabla: string, id: string, usuario_id?: string) {
  await chequearDependenciasFK(tabla, id)

  const { error } = await clienteSupabase
    .from(tabla)
    .delete()
    .eq('id', id)

  if (error) {
    await registrarFallo(tabla, 'ELIMINAR', error, { id }, usuario_id)
    throw traducirErrorPostgres(error)
  }
  return true
}
