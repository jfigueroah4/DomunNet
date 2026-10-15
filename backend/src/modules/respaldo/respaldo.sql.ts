import { Pool, PoolClient } from 'pg'
import { entorno } from '@/configuracion/entorno'
import { clienteSupabase } from '@/configuracion/cliente-supabase'

type TipoRespaldoSql = 'Completo' | 'Incremental'

type OpcionesRespaldoSql = {
  tipo: TipoRespaldoSql
  modulos?: string[]
  desde?: string
}

type Tabla = {
  schema: string
  nombre: string
  columnas: Array<{
    nombre: string
    tipo: string
    udt: string
    nullable: boolean
    defecto: string | null
  }>
  llavePrimaria: string[]
  tieneUpdatedAt: boolean
}

export const tablasPorModulo: Record<string, string[]> = {
  proyectos: [
    'proyecto',
    'proyecto_detalle',
    'proyecto_usuario',
    'documento_proyecto',
    'fase_proyecto',
    'parametro_proyecto',
    'estacion_kilometrica',
    'renglon_trabajo',
    'cronograma_planificado',
    'control_anticipo',
    'control_plazo',
    'suspension_plazo',
    'modificativo_renglon',
    'capitulo_sabana',
  ],
  bitacoras: [
    'bitacora_entrada',
    'bitacora_avance',
    'bitacora_pendiente',
    'bitacora_pendiente_ajuste',
    'condicion_climatica',
  ],
  fotografias: [
    'evidencia_fotografica',
    'incidente_obra',
    'incidente_evidencia',
  ],
  laboratorio: [
    'ensayo_laboratorio',
    'tipo_ensayo',
    'especificacion_tecnica',
  ],
  tickets: [
    'ticket_soporte',
    'ticket_mensaje',
  ],
  empresas: [
    'empresa',
    'entidad_contratante',
    'empresa_contratista',
    'empresa_externa',
    'contacto_entidad',
    'contacto_contratista',
    'contacto_empresa_externa',
  ],
  usuarios: [
    'rol',
    'usuario',
    'dato_usuario',
    'estado_usuario',
  ],
  configuracion: [
    'configuracion_general',
    'catalogo',
    'catalogo_item',
    'catalogo_descuento_tecnico',
    'departamento',
    'municipio',
    'unidad_medida',
    'categoria_actividad',
  ],
}

export const todasLasTablasOrdenadas: string[] = [
  'rol',
  'estado_usuario',
  'departamento',
  'municipio',
  'catalogo',
  'catalogo_item',
  'catalogo_descuento_tecnico',
  'unidad_medida',
  'categoria_actividad',
  'configuracion_general',
  'usuario',
  'dato_usuario',
  'empresa',
  'entidad_contratante',
  'empresa_contratista',
  'empresa_externa',
  'contacto_entidad',
  'contacto_contratista',
  'contacto_empresa_externa',
  'proyecto',
  'proyecto_detalle',
  'proyecto_usuario',
  'fase_proyecto',
  'documento_proyecto',
  'parametro_proyecto',
  'estacion_kilometrica',
  'renglon_trabajo',
  'cronograma_planificado',
  'control_anticipo',
  'control_plazo',
  'suspension_plazo',
  'modificativo_renglon',
  'capitulo_sabana',
  'condicion_climatica',
  'bitacora_entrada',
  'bitacora_avance',
  'bitacora_pendiente',
  'bitacora_pendiente_ajuste',
  'evidencia_fotografica',
  'incidente_obra',
  'incidente_evidencia',
  'tipo_ensayo',
  'especificacion_tecnica',
  'ensayo_laboratorio',
  'ticket_soporte',
  'ticket_mensaje',
]

let pool: Pool | null = null

export function obtenerPool(): Pool | null {
  if (!entorno.databaseUrl) {
    return null
  }

  if (!pool) {
    pool = new Pool({
      connectionString: entorno.databaseUrl,
      ssl: entorno.databaseUrl.includes('localhost') ? undefined : { rejectUnauthorized: false },
      max: 3,
      connectionTimeoutMillis: 10_000,
      statement_timeout: 120_000,
    })
  }

  return pool
}

function identifier(value: string) {
  return `"${value.replace(/"/g, '""')}"`
}

function literal(value: string) {
  return `'${value.replace(/'/g, "''")}'`
}

function valorSql(value: unknown, udt: string): string {
  if (value === null || value === undefined) return 'NULL'
  if (Buffer.isBuffer(value)) return `decode(${literal(value.toString('hex'))}, 'hex')`
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE'
  if (typeof value === 'number' || typeof value === 'bigint') return String(value)

  if (Array.isArray(value)) {
    const elementos = value.map((item) => valorSql(item, udt.replace(/^_/, '')))
    return `ARRAY[${elementos.join(', ')}]`
  }

  const texto = typeof value === 'object' ? JSON.stringify(value) : String(value)
  if (udt === 'json' || udt === 'jsonb') return `${literal(texto)}::${udt}`
  if (udt === 'uuid') return `${literal(texto)}::uuid`
  if (udt === 'date') return `${literal(texto)}::date`
  if (udt === 'timestamp' || udt === 'timestamptz') return `${literal(texto)}::${udt}`
  return literal(texto)
}

async function obtenerTablas(client: PoolClient, opciones: OpcionesRespaldoSql): Promise<Tabla[]> {
  const nombresSolicitados =
    opciones.tipo === 'Completo'
      ? null
      : [...new Set((opciones.modulos || []).flatMap((modulo) => tablasPorModulo[modulo] || []))]

  if (opciones.tipo === 'Incremental' && (!opciones.modulos || opciones.modulos.length === 0)) {
    throw new Error('Debe seleccionar al menos un módulo para el respaldo incremental')
  }

  const parametros: unknown[] = ['public']
  let filtro = ''
  if (nombresSolicitados && nombresSolicitados.length > 0) {
    parametros.push(nombresSolicitados)
    filtro = `and table_name = any($${parametros.length}::text[])`
  }

  const columnas = await client.query<{
    table_schema: string
    table_name: string
    column_name: string
    tipo_sql: string
    udt_name: string
    is_nullable: string
    column_default: string | null
  }>(
    `select c.table_schema, c.table_name, c.column_name,
            format_type(a.atttypid, a.atttypmod) as tipo_sql,
            c.udt_name, c.is_nullable, c.column_default
       from information_schema.columns c
       join pg_namespace n on n.nspname = c.table_schema
       join pg_class t on t.relnamespace = n.oid and t.relname = c.table_name
       join pg_attribute a on a.attrelid = t.oid and a.attname = c.column_name
      where c.table_schema = $1 ${filtro}
      order by c.table_name, c.ordinal_position`,
    parametros
  )

  const nombres = [...new Set(columnas.rows.map((fila) => fila.table_name))]
  if (nombres.length === 0) return []

  const llaves = await client.query<{ table_name: string; column_name: string }>(
    `select c.relname as table_name, a.attname as column_name
       from pg_constraint con
       join pg_class c on c.oid = con.conrelid
       join pg_namespace n on n.oid = c.relnamespace
       cross join lateral unnest(con.conkey) with ordinality k(attnum, posicion)
       join pg_attribute a on a.attrelid = c.oid and a.attnum = k.attnum
      where n.nspname = 'public' and con.contype = 'p'
      order by c.relname, k.posicion`
  )

  return nombres.map((nombre) => {
    const filas = columnas.rows.filter((fila) => fila.table_name === nombre)
    return {
      schema: 'public',
      nombre,
      columnas: filas.map((fila) => ({
        nombre: fila.column_name,
        tipo: fila.tipo_sql,
        udt: fila.udt_name,
        nullable: fila.is_nullable === 'YES',
        defecto: fila.column_default,
      })),
      llavePrimaria: llaves.rows.filter((llave) => llave.table_name === nombre).map((llave) => llave.column_name),
      tieneUpdatedAt: filas.some((fila) => fila.column_name === 'updated_at'),
    }
  })
}

async function agregarEsquema(client: PoolClient, tablas: Tabla[], partes: string[]) {
  partes.push('-- ESQUEMA Y OBJETOS DE BASE DE DATOS')
  partes.push('CREATE SCHEMA IF NOT EXISTS "public";')

  const secuencias = await client.query<{
    sequence_name: string
    data_type: string
    start_value: string
    increment_by: string
    min_value: string
    max_value: string
    cycle: boolean
  }>(
    `select sequence_name, data_type, start_value, increment_by, min_value, max_value, cycle
       from pg_sequences
      where schemaname = 'public'
      order by sequence_name`
  )
  for (const secuencia of secuencias.rows) {
    partes.push(
      `CREATE SEQUENCE IF NOT EXISTS ${identifier('public')}.${identifier(secuencia.sequence_name)} AS ${secuencia.data_type} ` +
        `INCREMENT BY ${secuencia.increment_by} MINVALUE ${secuencia.min_value} MAXVALUE ${secuencia.max_value} ` +
        `START WITH ${secuencia.start_value}${secuencia.cycle ? ' CYCLE' : ''};`
    )
  }

  for (const tabla of tablas) {
    const columnas = tabla.columnas
      .map((columna) => {
        const tipo = columna.udt.startsWith('_') ? `${columna.udt.slice(1)}[]` : columna.tipo
        const defecto = columna.defecto ? ` DEFAULT ${columna.defecto}` : ''
        return `  ${identifier(columna.nombre)} ${tipo}${columna.nullable ? '' : ' NOT NULL'}${defecto}`
      })
      .join(',\n')
    const primaryKey = tabla.llavePrimaria.length
      ? `,\n  PRIMARY KEY (${tabla.llavePrimaria.map(identifier).join(', ')})`
      : ''
    partes.push(`CREATE TABLE IF NOT EXISTS ${identifier(tabla.schema)}.${identifier(tabla.nombre)} (\n${columnas}${primaryKey}\n);`)
  }

  const restricciones = await client.query<{ definicion: string; tabla: string; nombre: string }>(
    `select con.conname as nombre, c.relname as tabla, pg_get_constraintdef(con.oid) as definicion
       from pg_constraint con
       join pg_class c on c.oid = con.conrelid
       join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and con.contype in ('f', 'u', 'c', 'x')
      order by c.relname, con.conname`
  )
  for (const restriccion of restricciones.rows) {
    if (!tablas.some((tabla) => tabla.nombre === restriccion.tabla)) continue
    partes.push(
      `ALTER TABLE ${identifier('public')}.${identifier(restriccion.tabla)} ADD CONSTRAINT ${identifier(restriccion.nombre)} ${restriccion.definicion};`
    )
  }

  const indices = await client.query<{ tablename: string; indexdef: string }>(
    `select tablename, indexdef
       from pg_indexes i
      where schemaname = 'public'
        and not exists (
          select 1 from pg_index pi
           join pg_class ci on ci.oid = pi.indexrelid
           where ci.relname = i.indexname and pi.indisprimary
        )
      order by tablename, indexname`
  )
  for (const indice of indices.rows) {
    if (tablas.some((tabla) => tabla.nombre === indice.tablename)) {
      partes.push(`${indice.indexdef.replace(/^CREATE (UNIQUE )?INDEX/, 'CREATE $1INDEX IF NOT EXISTS')};`)
    }
  }
}

async function agregarDatos(
  client: PoolClient,
  tablas: Tabla[],
  opciones: OpcionesRespaldoSql,
  partes: string[]
) {
  for (const tabla of tablas) {
    const nombresColumnas = tabla.columnas.map((columna) => identifier(columna.nombre)).join(', ')
    const filtro = opciones.tipo === 'Incremental' && opciones.desde && tabla.tieneUpdatedAt ? ' where "updated_at" >= $1' : ''
    const valores = filtro ? [opciones.desde] : []
    const filas = await client.query<Record<string, unknown>>(
      `select ${nombresColumnas} from ${identifier(tabla.schema)}.${identifier(tabla.nombre)}${filtro}`,
      valores
    )
    if (filas.rows.length === 0) continue

    partes.push(`-- DATOS: ${tabla.nombre}`)
    for (const fila of filas.rows) {
      const values = tabla.columnas
        .map((columna) => valorSql(fila[columna.nombre], columna.udt))
        .join(', ')
      const conflicto =
        opciones.tipo === 'Incremental' && tabla.llavePrimaria.length
          ? (() => {
              const actualizables = tabla.columnas.filter((columna) => !tabla.llavePrimaria.includes(columna.nombre))
              if (actualizables.length === 0) {
                return ` ON CONFLICT (${tabla.llavePrimaria.map(identifier).join(', ')}) DO NOTHING`
              }
              return ` ON CONFLICT (${tabla.llavePrimaria.map(identifier).join(', ')}) DO UPDATE SET ${actualizables
                .map((columna) => `${identifier(columna.nombre)} = EXCLUDED.${identifier(columna.nombre)}`)
                .join(', ')}`
            })()
          : ''
      partes.push(
        `INSERT INTO ${identifier(tabla.schema)}.${identifier(tabla.nombre)} (${nombresColumnas}) VALUES (${values})${conflicto};`
      )
    }
  }
}

async function agregarObjetos(client: PoolClient, tablas: Tabla[], partes: string[]) {
  const nombres = tablas.map((tabla) => tabla.nombre)
  const funciones = await client.query<{ definicion: string }>(
    `select pg_get_functiondef(p.oid) as definicion
       from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.prokind in ('f', 'p')`
  )
  for (const funcion of funciones.rows) partes.push(`${funcion.definicion}\n`)

  const triggers = await client.query<{ tabla: string; definicion: string }>(
    `select c.relname as tabla, pg_get_triggerdef(t.oid) as definicion
       from pg_trigger t join pg_class c on c.oid = t.tgrelid
       join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and not t.tgisinternal`
  )
  for (const trigger of triggers.rows) {
    if (nombres.includes(trigger.tabla)) partes.push(`${trigger.definicion};`)
  }

  const vistas = await client.query<{ nombre: string; definicion: string }>(
    `select c.relname as nombre, pg_get_viewdef(c.oid, true) as definicion
       from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'v'`
  )
  for (const vista of vistas.rows) partes.push(`CREATE OR REPLACE VIEW ${identifier('public')}.${identifier(vista.nombre)} AS\n${vista.definicion};`)

  const politicas = await client.query<{
    tabla: string
    nombre: string
    permisiva: string
    roles: string[]
    comando: string
    usando: string | null
    verificacion: string | null
  }>(
    `select tablename as tabla, policyname as nombre, permissive as permisiva,
            roles, cmd as comando, qual as usando, with_check as verificacion
       from pg_policies
      where schemaname = 'public'`
  )
  for (const politica of politicas.rows) {
    if (!nombres.includes(politica.tabla)) continue
    const roles = politica.roles?.length ? politica.roles.map(identifier).join(', ') : 'public'
    const usando = politica.usando ? ` USING (${politica.usando})` : ''
    const verificacion = politica.verificacion ? ` WITH CHECK (${politica.verificacion})` : ''
    partes.push(
      `CREATE POLICY ${identifier(politica.nombre)} ON ${identifier('public')}.${identifier(politica.tabla)} ` +
        `AS ${politica.permisiva.toUpperCase()} FOR ${politica.comando} TO ${roles}${usando}${verificacion};`
    )
  }
}

function valorSqlDinamico(value: unknown): string {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'object') {
    if (value instanceof Date) return `'${value.toISOString()}'`
    return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`
  }
  const str = String(value)
  return `'${str.replace(/'/g, "''")}'`
}

function generarInsertsParaTabla(tabla: string, filas: any[], partes: string[]) {
  if (!filas || filas.length === 0) return
  const columnas = Object.keys(filas[0])
  const colIdentificadores = columnas.map((c) => `"${c.replace(/"/g, '""')}"`).join(', ')

  partes.push(`-- ----------------------------------------------------------------------------`)
  partes.push(`-- TABLA: public."${tabla}" (${filas.length} registros)`)
  partes.push(`-- ----------------------------------------------------------------------------`)

  const chunkSize = 50
  for (let i = 0; i < filas.length; i += chunkSize) {
    const chunk = filas.slice(i, i + chunkSize)
    const valuesRows = chunk
      .map((fila) => {
        const rowVals = columnas.map((col) => valorSqlDinamico(fila[col])).join(', ')
        return `  (${rowVals})`
      })
      .join(',\n')

    const hasId = columnas.includes('id')
    const onConflict = hasId ? ' ON CONFLICT ("id") DO NOTHING' : ''
    partes.push(`INSERT INTO "public"."${tabla}" (${colIdentificadores}) VALUES\n${valuesRows}${onConflict};`)
  }
  partes.push('')
}

async function generarRespaldoSqlViaSupabase(
  opciones: OpcionesRespaldoSql,
  generadoPor = 'Sistema'
): Promise<{ contenido: string; tablas: string[]; generadoEn: string; desde?: string }> {
  const tablasAExportar: string[] =
    opciones.tipo === 'Completo'
      ? todasLasTablasOrdenadas
      : [
          ...new Set(
            (opciones.modulos || []).flatMap((modulo) => tablasPorModulo[modulo] || [])
          ),
        ]

  if (opciones.tipo === 'Incremental' && tablasAExportar.length === 0) {
    throw new Error('Debe seleccionar al menos un módulo para el respaldo incremental')
  }

  const fechaGeneracion = new Date().toISOString()
  const partes: string[] = [
    '-- ============================================================================',
    '-- DOMUN CONTROL OBRA - RESPALDO DE BASE DE DATOS (SQL DUMP)',
    `-- Tipo: ${opciones.tipo}`,
    `-- Generado: ${fechaGeneracion}`,
    `-- Generado por: ${generadoPor}`,
    opciones.desde ? `-- Cambios desde: ${opciones.desde}` : '-- Alcance: Datos completos de las entidades seleccionadas',
    `-- Total tablas objetivo: ${tablasAExportar.length}`,
    '-- ============================================================================',
    '',
    'BEGIN;',
    'SET statement_timeout = 0;',
    'SET client_encoding = \'UTF8\';',
    '',
  ]

  const tablasProcesadas: string[] = []

  for (const tabla of tablasAExportar) {
    try {
      let query = clienteSupabase.from(tabla).select('*')
      if (opciones.tipo === 'Incremental' && opciones.desde) {
        query = query.gte('updated_at', opciones.desde)
      }
      const { data, error } = await query
      if (error) {
        const retry = await clienteSupabase.from(tabla).select('*')
        if (!retry.error && retry.data && retry.data.length > 0) {
          generarInsertsParaTabla(tabla, retry.data, partes)
          tablasProcesadas.push(tabla)
        }
      } else if (data && data.length > 0) {
        generarInsertsParaTabla(tabla, data, partes)
        tablasProcesadas.push(tabla)
      }
    } catch (err) {
      console.warn(`[BACKUP SQL] No se pudo exportar tabla ${tabla}:`, err)
    }
  }

  partes.push('COMMIT;')
  partes.push('')
  partes.push(`-- Respaldo completado exitosamente: ${tablasProcesadas.length} tablas con datos.`)

  return {
    contenido: partes.join('\n'),
    tablas: tablasProcesadas,
    generadoEn: fechaGeneracion,
    desde: opciones.desde,
  }
}

export async function generarRespaldoSql(opciones: OpcionesRespaldoSql, generadoPor = 'Sistema') {
  const pgPool = obtenerPool()
  if (pgPool) {
    try {
      const cliente = await pgPool.connect()
      try {
        const tablas = await obtenerTablas(cliente, opciones)
        let desde = opciones.desde
        if (opciones.tipo === 'Incremental' && !desde) {
          const ultimo = await cliente.query<{ fecha_generacion: string }>(
            `select fecha_generacion
               from backup_sistema
              where formato = 'sql'
              order by fecha_generacion desc
              limit 1`
          ).catch(() => ({ rows: [] }))
          desde = ultimo.rows[0]?.fecha_generacion
        }

        const opcionesEfectivas = { ...opciones, desde }
        const partes = [
          '-- ============================================================================',
          '-- DOMUNNET - RESPALDO SQL DE BASE DE DATOS (PG DUMP)',
          `-- Tipo: ${opciones.tipo}`,
          `-- Generado: ${new Date().toISOString()}`,
          `-- Generado por: ${generadoPor}`,
          desde ? `-- Cambios desde: ${desde}` : '-- Alcance: datos completos de los módulos seleccionados',
          '-- ============================================================================',
          '',
          'BEGIN;',
          'SET lock_timeout = \'30s\';',
          'SET statement_timeout = \'120s\';',
        ]

        if (opciones.tipo === 'Completo') await agregarEsquema(cliente, tablas, partes)
        await agregarDatos(cliente, tablas, opcionesEfectivas, partes)
        if (opciones.tipo === 'Completo') await agregarObjetos(cliente, tablas, partes)
        partes.push('COMMIT;')

        return {
          contenido: `${partes.join('\n\n')}\n`,
          tablas: tablas.map((tabla) => tabla.nombre),
          generadoEn: new Date().toISOString(),
          desde,
        }
      } finally {
        cliente.release()
      }
    } catch (pgErr) {
      console.warn('[BACKUP SQL] Falló conexión directa Postgres, recurriendo a Supabase Client:', pgErr)
    }
  }

  return generarRespaldoSqlViaSupabase(opciones, generadoPor)
}

export async function ejecutarRestauracionSql(contenido: string) {
  if (!contenido.trim()) throw new Error('El archivo SQL está vacío')
  if (!/\b(begin|create|insert|alter|set|select)\b/i.test(contenido)) {
    throw new Error('El contenido no parece ser un respaldo SQL válido')
  }

  const pgPool = obtenerPool()
  if (pgPool) {
    const cliente = await pgPool.connect()
    try {
      await cliente.query('BEGIN')
      await cliente.query(contenido)
      await cliente.query('COMMIT')
      return
    } catch (error) {
      await cliente.query('ROLLBACK')
      throw error
    } finally {
      cliente.release()
    }
  }

  console.log('[RESTAURAR SQL] Archivo SQL recibido para restauración')
}
