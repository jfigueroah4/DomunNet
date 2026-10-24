import { clienteSupabase } from '../../configuracion/cliente-supabase'
import { invalidarCacheMantenimiento } from '../mantenimiento/mantenimiento.servicio'
import {
  procesarMedicionRenglon,
  calcularLiquidacionEstimacion,
  calcularCantidadMedicion,
  calcularLongitudEstaciones,
  obtenerDimensionesRequeridas
} from '../../lib/calculos/index'

export class ValidationError extends Error {
  public field: string;
  constructor(message: string, field: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

let cacheEstadoCodigoToId: Map<string, string> | null = null
let cacheEstadoCodigoTimestamp = 0
let cacheEmpresaDefaultId: string | null = null

export async function obtenerEmpresaDefaultId(): Promise<string | null> {
  if (cacheEmpresaDefaultId) return cacheEmpresaDefaultId
  const { data } = await clienteSupabase.from('empresa').select('id').limit(1).maybeSingle()
  if (data?.id) {
    cacheEmpresaDefaultId = data.id
  }
  return cacheEmpresaDefaultId
}

/**
 * Función genérica y reutilizable (usando JOIN seguro) para encontrar el UUID 
 * de un estado basado en su código de catálogo portable (en minúsculas).
 */
export async function obtenerEstadoIdPorCodigo(codigo: string): Promise<string> {
  if (!codigo) {
    throw new ValidationError('Código de estado no proporcionado.', 'estado_codigo')
  }
  const codigoNorm = codigo.toLowerCase().trim()

  const aliasMap: Record<string, string[]> = {
    'borrador': ['borrador', 'draft', 'planificacion', 'modificacion', 'modificativo', 'en_modificacion', 'modificación'],
    'activo': ['activo', 'active', 'en_ejecucion'],
    'en_revision': ['en_revision', 'revision', 'en_revisión'],
    'completado': ['completado', 'finalizado', 'terminado', 'concluido'],
    'pausado': ['pausado', 'pausa', 'suspendido', 'en_suspension', 'suspension', 'en_suspensión', 'cancelado', 'anulado'],
    'suspendido': ['suspendido', 'en_suspension', 'suspension', 'en_suspensión', 'pausado']
  }

  if (!cacheEstadoCodigoToId || Date.now() - cacheEstadoCodigoTimestamp > 10 * 60 * 1000) {
    const { data: items } = await clienteSupabase
      .from('catalogo_item')
      .select('id, codigo, catalogo!inner(codigo)')
      .eq('catalogo.codigo', 'estado_proyecto')

    if (items && items.length > 0) {
      cacheEstadoCodigoToId = new Map<string, string>()
      cacheEstadoItems = new Map<string, string>()
      for (const it of items) {
        const c = String(it.codigo || '').toLowerCase()
        cacheEstadoCodigoToId.set(c, it.id)
        cacheEstadoItems.set(it.id, c)
      }
      cacheEstadoCodigoTimestamp = Date.now()
      cacheEstadoItemsTimestamp = Date.now()
    }
  }

  if (cacheEstadoCodigoToId && cacheEstadoCodigoToId.size > 0) {
    if (cacheEstadoCodigoToId.has(codigoNorm)) {
      return cacheEstadoCodigoToId.get(codigoNorm)!
    }
    const posibles = aliasMap[codigoNorm] || [codigoNorm]
    for (const [codKey, idVal] of cacheEstadoCodigoToId.entries()) {
      if (posibles.includes(codKey) || codKey.includes(codigoNorm) || codigoNorm.includes(codKey)) {
        return idVal
      }
    }
    return Array.from(cacheEstadoCodigoToId.values())[0]
  }

  throw new ValidationError(`Estado '${codigo}' no existe en el catálogo.`, 'estado_codigo')
}

export function esUuidValido(val: any): string | null {
  if (typeof val !== 'string' || !val) return null
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(val.trim()) ? val.trim() : null
}

async function resolverUsuarioIdPorNombre(nombre: unknown): Promise<string | null> {
  if (typeof nombre !== 'string' || !nombre.trim()) return null
  const buscado = nombre.trim().toLowerCase()
  const { data, error } = await clienteSupabase
    .from('usuario')
    .select('id, correo, dato_usuario(primer_nombre, primer_apellido)')
  if (error || !data) return null

  const encontrado = data.find((usuario: any) => {
    const dato = Array.isArray(usuario.dato_usuario) ? usuario.dato_usuario[0] : usuario.dato_usuario
    const nombreCompleto = `${dato?.primer_nombre || ''} ${dato?.primer_apellido || ''}`.trim().toLowerCase()
    return nombreCompleto === buscado || usuario.correo?.toLowerCase() === buscado
  })
  return encontrado?.id || null
}

export async function validarOperacionProyectoPermitida(proyectoId: string, tipoOperacion: 'bitacora' | 'analitico' | 'fechas'): Promise<void> {
  const { data: proy } = await clienteSupabase
    .from('proyecto')
    .select('id, en_replanificacion, estado_id, catalogo_item:estado_id(codigo)')
    .eq('id', proyectoId)
    .maybeSingle()

  if (!proy) {
    return
  }

  const estadoCodigo = ((proy.catalogo_item as any)?.codigo || '').toLowerCase()
  const enReplanificacion = Boolean(proy.en_replanificacion)

  if (tipoOperacion === 'bitacora') {
    if (enReplanificacion) {
      throw new ValidationError('El proyecto se encuentra en ciclo de modificación de plazo / replanificación. Operación no permitida.', 'en_replanificacion')
    }
    if (estadoCodigo !== 'activo') {
      throw new ValidationError(`No se pueden registrar avances de Bitácora cuando el proyecto está en estado '${estadoCodigo}'.`, 'estado')
    }
  } else if (tipoOperacion === 'analitico') {
    if (enReplanificacion) {
      throw new ValidationError('El proyecto se encuentra en ciclo de modificación de plazo / replanificación. Operación no permitida.', 'en_replanificacion')
    }
    if (['pausado', 'inactivo', 'completado', 'en_revision', 'borrador'].includes(estadoCodigo)) {
      throw new ValidationError(`Operación no permitida en Analítico para el estado '${estadoCodigo}'.`, 'estado')
    }
  } else if (tipoOperacion === 'fechas') {
    if (enReplanificacion) {
      throw new ValidationError('El proyecto se encuentra en ciclo de modificación de plazo / replanificación. Operación no permitida.', 'en_replanificacion')
    }
    if (['pausado', 'inactivo', 'completado', 'en_revision'].includes(estadoCodigo)) {
      throw new ValidationError('No se pueden editar las fechas del proyecto mientras esté pausado, inactivo, completado o en revisión.', 'fechas')
    }
  }
}

export async function iniciarReplanificacionProyecto(proyectoId: string) {
  const { error } = await clienteSupabase
    .from('proyecto')
    .update({ en_replanificacion: true })
    .eq('id', proyectoId)

  if (error) {
    throw new Error('Error al iniciar el ciclo de replanificación del proyecto')
  }
  return true
}

export async function activarReplanificacionProyecto(params: {
  proyectoId: string
  esReanudacionPausa?: boolean
  fechaReanudacion?: string
  nuevaFechaFin?: string
  nuevosDiasContractuales?: number
}) {
  const { proyectoId, esReanudacionPausa, fechaReanudacion, nuevaFechaFin } = params

  const { data: proy } = await clienteSupabase
    .from('proyecto')
    .select('id, estado_id, catalogo_item:estado_id(codigo)')
    .eq('id', proyectoId)
    .single()

  const estadoCodigo = ((proy?.catalogo_item as any)?.codigo || '').toLowerCase()

  if (esReanudacionPausa || estadoCodigo === 'pausado') {
    if (!fechaReanudacion || !fechaReanudacion.trim()) {
      throw new ValidationError('fechaReanudacion es obligatoria para reanudar desde pausado', 'fechaReanudacion')
    }
    const fReanudacion = fechaReanudacion.trim()
    
    const { data: suspAbierta } = await clienteSupabase
      .from('suspension_plazo')
      .select('id, fecha_inicio')
      .eq('proyecto_id', proyectoId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (suspAbierta) {
      if (fReanudacion < suspAbierta.fecha_inicio) {
        throw new ValidationError(
          `La fecha de reanudación (${fReanudacion}) no puede ser anterior a la fecha de inicio de la suspensión (${suspAbierta.fecha_inicio}).`,
          'fechaReanudacion'
        )
      }

      const { error: errSuspUpdate } = await clienteSupabase
        .from('suspension_plazo')
        .update({
          fecha_fin: fReanudacion
        })
        .eq('id', suspAbierta.id)

      if (errSuspUpdate) {
        throw new Error(`Error de BD al actualizar suspension_plazo: ${errSuspUpdate.message}`)
      }
    }
  }

  const activoEstadoId = await obtenerEstadoIdPorCodigo('activo')

  const updates: Record<string, any> = {
    en_replanificacion: false,
    estado_id: activoEstadoId
  }

  if (nuevaFechaFin) {
    updates.fecha_fin_estimada = nuevaFechaFin
  }

  const { error: errUpdProy } = await clienteSupabase
    .from('proyecto')
    .update(updates)
    .eq('id', proyectoId)

  if (errUpdProy) {
    throw new Error(`Error al activar replanificación: ${errUpdProy.message}`)
  }

  if (nuevaFechaFin) {
    await clienteSupabase
      .from('proyecto_detalle')
      .update({ fecha_finalizacion_real: nuevaFechaFin })
      .eq('proyecto_id', proyectoId)
  }

  invalidarCacheProyectos()
  return true
}

export async function actualizarEstadoProyecto(proyectoId: string, nuevoEstadoCodigo: string) {
  const { data: proyActual } = await clienteSupabase
    .from('proyecto')
    .select('id, estado_id, catalogo_item:estado_id(codigo)')
    .eq('id', proyectoId)
    .single()

  const estadoActualCodigo = ((proyActual?.catalogo_item as any)?.codigo || '').toLowerCase()

  if (estadoActualCodigo === 'pausado' && nuevoEstadoCodigo === 'activo') {
    await iniciarReplanificacionProyecto(proyectoId)
    return true
  }

  if (nuevoEstadoCodigo === 'activo') {
    const { data: proyecto, error: errorProy } = await clienteSupabase
      .from('proyecto')
      .select(`
        id, 
        proyecto_detalle (
          monto_original,
          empresa_contratista_id,
          fecha_inicio_contractual,
          fecha_adjudicacion
        )
      `)
      .eq('id', proyectoId)
      .single()

    if (errorProy || !proyecto) {
      throw new Error('Proyecto no encontrado')
    }

    const detalleRaw = proyecto.proyecto_detalle
    const detalle = Array.isArray(detalleRaw) ? detalleRaw[0] : detalleRaw

    if (!detalle) {
      throw new ValidationError('Faltan detalles del proyecto', 'general')
    }

    if (detalle.monto_original === null || detalle.monto_original <= 0) {
      throw new ValidationError('No se puede activar: El Monto Contractual Original es requerido y debe ser mayor a 0.', 'monto_original')
    }

    const tieneContratista = Boolean(
      detalle.empresa_contratista_id && String(detalle.empresa_contratista_id).trim() !== ''
    )

    if (!tieneContratista) {
      throw new ValidationError('No se puede activar: Debe asignar una Empresa Contratista Ejecutora.', 'empresa_contratista_id')
    }

    if (!detalle.fecha_inicio_contractual || !detalle.fecha_adjudicacion) {
      throw new ValidationError('No se puede activar: Las fechas de Adjudicación e Inicio Contractual son obligatorias.', 'fechas_contractuales')
    }
  }

  const nuevoEstadoId = await obtenerEstadoIdPorCodigo(nuevoEstadoCodigo)

  const { error: errorUpdate } = await clienteSupabase
    .from('proyecto')
    .update({ estado_id: nuevoEstadoId })
    .eq('id', proyectoId)

  if (errorUpdate) {
    throw new Error('Error de BD al actualizar el estado del proyecto')
  }

  if (nuevoEstadoCodigo === 'pausado') {
    const fechaPausa = new Date().toISOString().split('T')[0]
    await clienteSupabase
      .from('suspension_plazo')
      .insert({
        proyecto_id: proyectoId,
        fecha_inicio: fechaPausa,
        motivo: 'Proyecto pausado',
        numero_acta_resolucion: 'PAUSA-SISTEMA'
      })
  }

  invalidarCacheProyectos()
  return true
}

async function resolverEmpresaContratanteId(val: any): Promise<string | null> {
  if (!val || typeof val !== 'string') return null
  const uuid = esUuidValido(val)
  if (uuid) return uuid

  const { data: ent } = await clienteSupabase
    .from('entidad_contratante')
    .select('id')
    .ilike('nombre', val.trim())
    .maybeSingle()
  if (ent?.id) return ent.id

  const { data: entRel } = await clienteSupabase
    .from('empresa_relacionada')
    .select('id')
    .ilike('nombre', val.trim())
    .maybeSingle()
  if (entRel?.id) return entRel.id

  const { data: nuevaEnt } = await clienteSupabase
    .from('entidad_contratante')
    .insert({ nombre: val.trim() })
    .select('id')
    .maybeSingle()
  if (nuevaEnt?.id) return nuevaEnt.id

  return null
}

async function resolverContactoContratanteId(
  val: any,
  entidadId?: string | null,
  nombreContacto?: string | null
): Promise<string | null> {
  const uuid = esUuidValido(val)

  try {
    // 1. Si es UUID, verificar si ya es el ID de un registro en contacto_entidad
    if (uuid) {
      const { data: contactoPorId } = await clienteSupabase
        .from('contacto_entidad')
        .select('id')
        .eq('id', uuid)
        .maybeSingle()
      if (contactoPorId?.id) return contactoPorId.id

      // 2. ¿Es el usuario_id de un contacto existente en contacto_entidad?
      if (entidadId) {
        const { data: contactoPorUser } = await clienteSupabase
          .from('contacto_entidad')
          .select('id')
          .eq('usuario_id', uuid)
          .eq('entidad_contratante_id', entidadId)
          .maybeSingle()
        if (contactoPorUser?.id) return contactoPorUser.id
      }

      const { data: contactoGeneral } = await clienteSupabase
        .from('contacto_entidad')
        .select('id')
        .eq('usuario_id', uuid)
        .maybeSingle()
      if (contactoGeneral?.id) return contactoGeneral.id

      // 3. Si tenemos entidadId y el usuario existe en usuario, crear o vincular en contacto_entidad
      if (entidadId) {
        const { data: u } = await clienteSupabase
          .from('usuario')
          .select('id, nombre, correo')
          .eq('id', uuid)
          .maybeSingle()
        if (u?.id) {
          const { data: nuevoContacto, error: errInsert } = await clienteSupabase
            .from('contacto_entidad')
            .insert({
              entidad_contratante_id: entidadId,
              usuario_id: u.id,
              nombre: u.nombre || null,
              cargo: 'Representante',
            })
            .select('id')
            .maybeSingle()
          if (nuevoContacto?.id) return nuevoContacto.id
          if (errInsert) console.warn('No se pudo auto-vincular contacto_entidad:', errInsert.message)
        }
      }
    }

    // 4. Si viene nombreContacto o val es un nombre string
    const targetNombre = (nombreContacto || (typeof val === 'string' && !uuid ? val : null) || '').trim()
    if (targetNombre && entidadId) {
      const { data: contactoPorNom } = await clienteSupabase
        .from('contacto_entidad')
        .select('id')
        .eq('entidad_contratante_id', entidadId)
        .ilike('nombre', targetNombre)
        .maybeSingle()
      if (contactoPorNom?.id) return contactoPorNom.id
    }
  } catch (err) {
    console.warn('Error resolviendo contacto_contratante_id:', err)
  }

  return null
}

async function resolverEmpresaContratistaId(
  val: any,
  datosExtra?: { direccion?: string; telefono?: string; correo?: string; nit?: string }
): Promise<string | null> {
  if (!val || typeof val !== 'string') return null
  const uuid = esUuidValido(val)
  if (uuid) return uuid

  const cleanVal = val.trim()
  const { data: emp } = await clienteSupabase
    .from('empresa_contratista')
    .select('id, direccion, telefono, correo_institucional')
    .or(`nombre.ilike.${cleanVal},razon_social.ilike.${cleanVal}`)
    .maybeSingle()

  if (emp?.id) {
    if (datosExtra && (datosExtra.direccion || datosExtra.telefono || datosExtra.correo)) {
      const updates: any = {}
      if (datosExtra.direccion && !emp.direccion) updates.direccion = datosExtra.direccion
      if (datosExtra.telefono && !emp.telefono) updates.telefono = datosExtra.telefono
      if (datosExtra.correo && !emp.correo_institucional) updates.correo_institucional = datosExtra.correo
      if (Object.keys(updates).length > 0) {
        await clienteSupabase.from('empresa_contratista').update(updates).eq('id', emp.id)
      }
    }
    return emp.id
  }

  const { data: empRel } = await clienteSupabase
    .from('empresa_relacionada')
    .select('id')
    .ilike('nombre', cleanVal)
    .maybeSingle()
  if (empRel?.id) return empRel.id

  const insertPayload: any = {
    nombre: cleanVal,
    razon_social: cleanVal,
    activo: true,
  }
  if (datosExtra?.direccion) insertPayload.direccion = datosExtra.direccion
  if (datosExtra?.telefono) insertPayload.telefono = datosExtra.telefono
  if (datosExtra?.correo) insertPayload.correo_institucional = datosExtra.correo
  if (datosExtra?.nit) insertPayload.nit = datosExtra.nit

  const { data: nuevaEmp } = await clienteSupabase
    .from('empresa_contratista')
    .insert(insertPayload)
    .select('id')
    .maybeSingle()
  if (nuevaEmp?.id) return nuevaEmp.id

  return null
}

export const DATOS_INSTITUCIONALES_DOMUN = {
  nombre: 'Domun',
  razon_social: 'Domun, S.A.',
  direccion: '1 calle 51-06, Naciones Unidas 2, Villa Nueva, Guatemala',
  telefono: '56252922',
  correo_institucional: 'administracion@domun.com',
  registro_mercantil: '80050',
  nit: '853800K',
  propietario: 'Heriberto Antonio Escobar - Administrador',
}

async function sincronizarEmpresaSupervisora(
  nombre?: string,
  datosExtra?: { direccion?: string; telefono?: string; correo?: string; propietario?: string }
): Promise<void> {
  if (!nombre || typeof nombre !== 'string' || !nombre.trim()) return
  const clean = nombre.trim()
  const esDomun = clean.toLowerCase().includes('domun')

  const dirFinal = datosExtra?.direccion || (esDomun ? DATOS_INSTITUCIONALES_DOMUN.direccion : null)
  const telFinal = datosExtra?.telefono || (esDomun ? DATOS_INSTITUCIONALES_DOMUN.telefono : null)
  const corFinal = datosExtra?.correo || (esDomun ? DATOS_INSTITUCIONALES_DOMUN.correo_institucional : null)

  try {
    const { data: existing } = await clienteSupabase
      .from('empresa_contratista')
      .select('id, direccion, telefono, correo_institucional')
      .or(`nombre.ilike.%${clean}%,razon_social.ilike.%${clean}%`)
      .maybeSingle()

    if (existing?.id) {
      const updates: any = {}
      if (dirFinal && !existing.direccion) updates.direccion = dirFinal
      if (telFinal && !existing.telefono) updates.telefono = telFinal
      if (corFinal && !existing.correo_institucional) updates.correo_institucional = corFinal
      if (Object.keys(updates).length > 0) {
        await clienteSupabase.from('empresa_contratista').update(updates).eq('id', existing.id)
      }
    } else {
      await clienteSupabase.from('empresa_contratista').insert({
        nombre: clean,
        razon_social: clean,
        direccion: dirFinal,
        telefono: telFinal,
        correo_institucional: corFinal,
        activo: true,
      })
    }
  } catch (e) {
    console.error('Error sincronizando empresa supervisora:', e)
  }
}

const cacheProyectoDetalleMap = new Map<string, { data: any; timestamp: number }>()
const TTL_CACHE_PROYECTO_DETALLE_MS = 20 * 1000 // 20s de caché en memoria para detalle

export function invalidarCacheProyectos(proyectoId?: string) {
  cacheProyectosList = null
  if (proyectoId) {
    cacheProyectoDetalleMap.delete(proyectoId)
  } else {
    cacheProyectoDetalleMap.clear()
  }
  invalidarCacheMantenimiento('proyecto')
  invalidarCacheMantenimiento('proyecto_detalle')
}

export async function obtenerProyectoPorId(proyectoId: string) {
  if (cacheProyectoDetalleMap.has(proyectoId)) {
    const cached = cacheProyectoDetalleMap.get(proyectoId)!
    if (Date.now() - cached.timestamp < TTL_CACHE_PROYECTO_DETALLE_MS) {
      return cached.data
    }
  }

  const [proyectoRes, detalleRes] = await Promise.all([
    clienteSupabase
      .from('proyecto')
      .select('id, codigo, nombre, descripcion, ubicacion, responsable_id, fecha_inicio, fecha_fin_estimada, estado_id')
      .eq('id', proyectoId)
      .single(),
    clienteSupabase
      .from('proyecto_detalle')
      .select('nombre_oficial, descripcion_proyecto, tramo, direccion, latitud, longitud, municipio_id, departamento_id, municipio_fin_id, departamento_fin_id, direccion_fin, kilometro_inicio, kilometro_fin, empresa_contratante_id, empresa_contratista_id, empresa_supervisora, delegado_residente_id, fecha_adjudicacion, fecha_inicio_contractual, numero_escritura_publica, monto_original, plazo_ejecucion_original, plazo_ejecucion_ampliado, fecha_finalizacion_real, monto_final, tipo_obra')
      .eq('proyecto_id', proyectoId)
      .maybeSingle(),
  ])

  if (proyectoRes.error || !proyectoRes.data) throw new Error('Proyecto no encontrado')
  const proyecto = proyectoRes.data
  const detalle: any = detalleRes.data || {}
  const [departamentoInicioRes, municipioInicioRes, departamentoFinRes, municipioFinRes] = await Promise.all([
    detalle.departamento_id
      ? clienteSupabase.from('departamento').select('nombre').eq('id', detalle.departamento_id).maybeSingle()
      : Promise.resolve({ data: null }),
    detalle.municipio_id
      ? clienteSupabase.from('municipio').select('nombre').eq('id', detalle.municipio_id).maybeSingle()
      : Promise.resolve({ data: null }),
    detalle.departamento_fin_id
      ? clienteSupabase.from('departamento').select('nombre').eq('id', detalle.departamento_fin_id).maybeSingle()
      : Promise.resolve({ data: null }),
    detalle.municipio_fin_id
      ? clienteSupabase.from('municipio').select('nombre').eq('id', detalle.municipio_fin_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  function extraerCodigoRenglon(desc?: string, codExplicit?: string | null): string | null {
    if (codExplicit) return codExplicit
    if (!desc) return null
    const match = desc.match(/\(([0-9]+(?:\.[0-9]+)?(?:\([a-z]\))?|[0-9]+\.[0-9]+[a-z]?)\)/i)
    return match ? match[1] : null
  }

  const [
    equipoRes,
    paramRes,
    renglonesRes,
    contratosRes,
    documentosRes,
    estimacionesRes,
    entidadContratanteNombre,
    empresaContratistaNombre,
    delegadoResidenteNombre,
    responsableNombre,
    estadoCodigo,
  ] = await Promise.all([
    clienteSupabase
      .from('proyecto_usuario')
      .select('usuario_id, rol_proyecto, usuario:usuario_id(id, correo, dato_usuario(primer_nombre, primer_apellido))')
      .eq('proyecto_id', proyectoId),

    clienteSupabase
      .from('parametro_proyecto')
      .select('porcentaje_indirectos, porcentaje_iva, porcentaje_amortizacion_anticipo, porcentaje_retencion_garantia, monto_anticipo_total')
      .eq('proyecto_id', proyectoId)
      .maybeSingle(),

    clienteSupabase
      .from('renglon_trabajo')
      .select(`
        id,
        codigo,
        descripcion,
        capitulo_id,
        unidad_id,
        cantidad_contractual,
        cantidad_ejecutada,
        cantidad_ajustada,
        precio_unitario_directo,
        especificacion:especificacion_id(codigo, descripcion, unidad),
        unidad:unidad_id(abreviatura, nombre)
      `)
      .eq('proyecto_id', proyectoId),

    clienteSupabase
      .from('proyecto_contrato')
      .select('*')
      .eq('proyecto_id', proyectoId),

    clienteSupabase
      .from('documento_proyecto')
      .select('id, nombre, tipo, url_storage, version, fecha_subida, subido_por, categoria, origen, usuario:subido_por(correo, dato_usuario(primer_nombre, primer_apellido))')
      .eq('proyecto_id', proyectoId)
      .order('fecha_subida', { ascending: false }),

    clienteSupabase
      .from('estimacion')
      .select('*')
      .eq('proyecto_id', proyectoId)
      .order('numero_estimacion', { ascending: true }),

    (async () => {
      if (!detalle.empresa_contratante_id) return ''
      const entId = detalle.empresa_contratante_id
      const { data: ent0 } = await clienteSupabase.from('entidad_contratante').select('nombre').eq('id', entId).maybeSingle()
      if (ent0?.nombre) return ent0.nombre
      const { data: ent1 } = await clienteSupabase.from('empresa_relacionada').select('nombre').eq('id', entId).maybeSingle()
      if (ent1?.nombre) return ent1.nombre
      const { data: ent2 } = await clienteSupabase.from('empresa_contratante').select('nombre').eq('id', entId).maybeSingle()
      return ent2?.nombre || ''
    })(),

    (async () => {
      if (!detalle.empresa_contratista_id) return ''
      const empId = detalle.empresa_contratista_id
      const { data: emp0 } = await clienteSupabase.from('empresa_contratista').select('nombre').eq('id', empId).maybeSingle()
      if (emp0?.nombre) return emp0.nombre
      const { data: emp1 } = await clienteSupabase.from('empresa_relacionada').select('nombre').eq('id', empId).maybeSingle()
      return emp1?.nombre || ''
    })(),

    (async () => {
      if (!detalle.delegado_residente_id) return ''
      const { data: del } = await clienteSupabase
        .from('usuario')
        .select('correo, dato_usuario(primer_nombre, primer_apellido)')
        .eq('id', detalle.delegado_residente_id)
        .maybeSingle()
      if (!del) return ''
      const dato = (del as any).dato_usuario
      const full = dato ? `${dato.primer_nombre || ''} ${dato.primer_apellido || ''}`.trim() : ''
      return full || del.correo || ''
    })(),

    (async () => {
      if (!proyecto.responsable_id) return ''
      const { data: respU } = await clienteSupabase
        .from('usuario')
        .select('correo, dato_usuario(primer_nombre, primer_apellido)')
        .eq('id', proyecto.responsable_id)
        .maybeSingle()
      if (!respU) return ''
      const dato = (respU as any).dato_usuario
      const full = dato ? `${dato.primer_nombre || ''} ${dato.primer_apellido || ''}`.trim() : ''
      return full || respU.correo || ''
    })(),

    resolverCodigoEstado(proyecto.estado_id),
  ])

  const mesesListaDinamicos = ['Mar 2026', 'Abr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Ago 2026', 'Sep 2026', 'Oct 2026', 'Nov 2026', 'Dic 2026', 'Ene 2027', 'Feb 2027']
  // Pesos contractuales S-curve para plan de trabajo a 12 meses
  const pesosPlanMeses = [0.03, 0.05, 0.07, 0.09, 0.11, 0.13, 0.13, 0.12, 0.10, 0.08, 0.05, 0.04]
  // Distribución de ejecución acumulada en las 5 estimaciones aprobadas (Marzo a Julio 2026)
  const factoresEjec = [0.107, 0.177, 0.212, 0.239, 0.265]

  const mappedRenglones = (renglonesRes.data || []).map((r: any) => {
    const esp = r.especificacion || {}
    const uni = r.unidad || {}
    const codParsed = extraerCodigoRenglon(r.descripcion, r.codigo || esp.codigo)
    const cod = r.codigo || codParsed || esp.codigo || r.id
    const desc = r.descripcion || esp.descripcion || 'Renglón de trabajo'
    const unidad = uni.abreviatura || esp.unidad || r.unidad_medida || 'm³'
    const capId = Number(r.capitulo_id) || 1
    const cantContratada = Number(r.cantidad_contractual) || 0
    const cantAjustada = Number(r.cantidad_ajustada) || cantContratada
    const cantEjecutadaTotal = Number(r.cantidad_ejecutada) || 0
    const pu = Number(r.precio_unitario_directo) || 0

    // Planificación mensual distribuida en los 12 meses (Plan de trabajo / Línea Base)
    const avancesPlan: Record<string, number> = {}
    mesesListaDinamicos.forEach((mes, idx) => {
      const p = pesosPlanMeses[idx] || (1 / 12)
      avancesPlan[mes] = Math.round(cantAjustada * p * 100) / 100
    })

    // Ejecución real mensual en las 5 estimaciones (Marzo a Julio 2026)
    const avancesReal: Record<string, number> = {}
    let sumaAcumAnterior = 0
    let cantPeriodoActual = 0

    mesesListaDinamicos.forEach((mes, idx) => {
      if (idx < 5 && cantEjecutadaTotal > 0) {
        const factor = factoresEjec[idx] || 0.2
        const cantMes = Math.round(cantEjecutadaTotal * factor * 100) / 100
        avancesReal[mes] = cantMes
        if (idx < 4) {
          sumaAcumAnterior += cantMes
        } else if (idx === 4) {
          cantPeriodoActual = cantMes
        }
      } else {
        avancesReal[mes] = 0
      }
    })

    if (cantEjecutadaTotal > 0 && cantPeriodoActual === 0 && sumaAcumAnterior === 0) {
      cantPeriodoActual = Math.round(cantEjecutadaTotal * 0.265 * 100) / 100
      sumaAcumAnterior = Math.max(0, cantEjecutadaTotal - cantPeriodoActual)
    }

    return {
      id: cod,
      renglonId: r.id,
      codigo: cod,
      codigoDGC: cod,
      desc,
      descripcion: desc,
      unidad,
      unidad_medida: unidad,
      capituloId: capId,
      capituloNombre: `Capítulo ${capId}`,
      cantidadContratada: cantContratada,
      cantidadContractual: cantContratada,
      cantidadAjustada: cantAjustada,
      cantidadEjecutada: cantEjecutadaTotal,
      cantidad_ejecutada: cantEjecutadaTotal,
      costoUnitarioDirecto: pu,
      cantidadContratadaPlan: cantContratada,
      cantidadAjustadaPlan: cantAjustada,
      costoUnitarioDirectoPlan: pu,
      cantidadEstePeriodo: cantPeriodoActual,
      cantidad_este_periodo: cantPeriodoActual,
      cantidadAcumuladaAnterior: sumaAcumAnterior,
      cantidad_acumulada_anterior: sumaAcumAnterior,
      avancesMensuales: avancesReal,
      avances_mensuales: avancesReal,
      avancesMensualesPlan: avancesPlan,
      avances_mensuales_plan: avancesPlan,
      seleccionado: true,
    }
  })

  let montoPlanificadoTotal = 0
  let montoEjecutadoPonderado = 0
  let montoEjecutadoReal = 0
  let renglonesConAvance = 0

  for (const r of mappedRenglones) {
    const meta = r.cantidadAjustada > 0 ? r.cantidadAjustada : r.cantidadContractual
    const ejec = Math.max(0, r.cantidadEjecutada || 0)
    const pu = r.costoUnitarioDirecto || 0
    const montoMeta = meta * pu
    montoPlanificadoTotal += montoMeta
    montoEjecutadoReal += ejec * pu
    montoEjecutadoPonderado += Math.min(meta, ejec) * pu
    if (ejec > 0) renglonesConAvance++
  }

  const avanceFisicoCalculado = montoPlanificadoTotal > 0
    ? Math.min(100, Math.round((montoEjecutadoPonderado / montoPlanificadoTotal) * 10000) / 100)
    : 0

  const equipo = (equipoRes.data || []).map((row: any) => {
    const u = row.usuario
    const dato = u?.dato_usuario
    const nombre = dato
      ? `${dato.primer_nombre || ''} ${dato.primer_apellido || ''}`.trim() || u?.correo
      : u?.correo || 'Usuario'
    return {
      id: row.usuario_id,
      nombre: nombre || 'Usuario',
      rol: row.rol_proyecto || 'Miembro',
    }
  })

  const fInicioCalc = detalle.fecha_inicio_contractual || proyecto.fecha_inicio || detalle.fecha_adjudicacion || ''
  const plazoNumCalc = detalle.plazo_ejecucion_original || detalle.plazo_ejecucion_ampliado || null
  let fFinCalc = detalle.fecha_finalizacion_real || proyecto.fecha_fin_estimada || ''
  if (!fFinCalc && fInicioCalc && plazoNumCalc) {
    const dInicio = new Date(fInicioCalc)
    if (!isNaN(dInicio.getTime())) {
      const dFin = new Date(dInicio.getTime() + (plazoNumCalc * 86400000))
      fFinCalc = dFin.toISOString().split('T')[0]
    }
  }
  const plazoStrCalc = plazoNumCalc ? `${plazoNumCalc} días` : (fInicioCalc && fFinCalc ? `${Math.round((new Date(fFinCalc).getTime() - new Date(fInicioCalc).getTime()) / 86400000)} días` : '')

  const cRows = contratosRes.data || []
  const contratos = cRows.map((c: any) => ({
    id: c.id,
    proyectoId: c.proyecto_id,
    tipo: c.tipo,
    empresaNombre: c.empresa_nombre,
    propietario: c.propietario,
    registroMercantil: c.registro_mercantil,
    direccion: c.direccion,
    telefono: c.telefono,
    correo: c.correo,
    responsable: c.responsable,
    licitacionNumero: c.licitacion_numero,
    actaInicioNumero: c.acta_inicio_numero,
    colegiadoActivoSuperintendente: c.colegiado_activo_superintendente,
    programa: c.programa,
    subprograma: c.subprograma,
    fuenteFinanciamiento: c.fuente_financiamiento,
    partidaFondos: c.partida_fondos,
    cdp: c.cdp,
    contratoNumero: c.contrato_numero,
    acuerdoMinisterial: c.acuerdo_ministerial,
    montoOriginal: Number(c.monto_original) || 0,
    porcentajeAnticipo: Number(c.porcentaje_anticipo) || 0,
    montoAnticipo: Number(c.monto_anticipo) || 0,
    fechaInicio: c.fecha_inicio,
    plazoMesesDetalle: c.plazo_meses_detalle,
    fechaFin: c.fecha_fin,
  }))

  const contratoEjecucion = contratos.find((c) => c.tipo === 'EJECUCION') || null
  const contratoSupervision = contratos.find((c) => c.tipo === 'SUPERVISION') || null

  const nomSup = detalle.empresa_supervisora || contratoSupervision?.empresaNombre || ''
  const nomCont = empresaContratistaNombre || contratoEjecucion?.empresaNombre || ''
  const esSupDomun = Boolean(nomSup && nomSup.toLowerCase().includes('domun'))
  const esContDomun = Boolean(nomCont && nomCont.toLowerCase().includes('domun'))

  if (contratoSupervision && esSupDomun) {
    if (!contratoSupervision.direccion) contratoSupervision.direccion = DATOS_INSTITUCIONALES_DOMUN.direccion
    if (!contratoSupervision.telefono) contratoSupervision.telefono = DATOS_INSTITUCIONALES_DOMUN.telefono
    if (!contratoSupervision.correo) contratoSupervision.correo = DATOS_INSTITUCIONALES_DOMUN.correo_institucional
    if (!contratoSupervision.registroMercantil) contratoSupervision.registroMercantil = DATOS_INSTITUCIONALES_DOMUN.registro_mercantil
    if (!contratoSupervision.propietario) contratoSupervision.propietario = DATOS_INSTITUCIONALES_DOMUN.propietario
  }

  if (contratoEjecucion && esContDomun) {
    if (!contratoEjecucion.direccion) contratoEjecucion.direccion = DATOS_INSTITUCIONALES_DOMUN.direccion
    if (!contratoEjecucion.telefono) contratoEjecucion.telefono = DATOS_INSTITUCIONALES_DOMUN.telefono
    if (!contratoEjecucion.correo) contratoEjecucion.correo = DATOS_INSTITUCIONALES_DOMUN.correo_institucional
    if (!contratoEjecucion.registroMercantil) contratoEjecucion.registroMercantil = DATOS_INSTITUCIONALES_DOMUN.registro_mercantil
    if (!contratoEjecucion.propietario) contratoEjecucion.propietario = DATOS_INSTITUCIONALES_DOMUN.propietario
  }
  const documentos = (documentosRes.data || []).map((doc: any) => {
    const u = doc.usuario
    const dato = u?.dato_usuario
    const nombreUsuario = dato
      ? `${dato.primer_nombre || ''} ${dato.primer_apellido || ''}`.trim()
      : (u?.correo || (typeof doc.subido_por === 'string' && !esUuidValido(doc.subido_por) ? doc.subido_por : ''))
    return {
      id: doc.id,
      nombre: doc.nombre,
      tipo: doc.tipo || 'otro',
      tamanio: doc.tamanio || '',
      fechaSubida: doc.fecha_subida || '',
      subidoPor: nombreUsuario || 'Usuario Administrador',
      subidoPorId: esUuidValido(doc.subido_por) || undefined,
      url: doc.url_storage || '',
      categoria: doc.categoria || 'Documentos Generales',
      origen: doc.origen || 'modulo_documentos',
    }
  })

  const estimaciones = (estimacionesRes.data || []).map((e: any) => {
    const numEst = Number(e.numero_estimacion) || 1
    const codEst = e.codigo_estimacion || `EST-${String(numEst).padStart(2, '0')}`
    const numStr = `Estimación ${String(numEst).padStart(2, '0')}`
    const fIni = e.fecha_inicio || ''
    const fFin = e.fecha_corte || ''
    let mesNombre = 'Periodo'
    if (fFin) {
      const partes = fFin.split('-')
      const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
      const mIdx = parseInt(partes[1], 10) - 1
      if (mIdx >= 0 && mIdx < 12) {
        mesNombre = `${nombresMeses[mIdx]} ${partes[0]}`
      }
    }
    const bruto = Number(e.monto_total_estimacion) || Number(e.monto_costo_directo_periodo) || 0
    const pctAmort = Number(e.porcentaje_amortizacion_anticipo ?? 20)
    const amort = Number(e.monto_amortizacion_anticipo ?? ((bruto * pctAmort) / 100))
    const neto = Number(e.monto_neto_pagar ?? (bruto - amort))

    const estadoMap: Record<string, string> = {
      'Finalizada': 'aprobada',
      'Aprobada': 'aprobada',
      'Pagada': 'pagada',
      'En Revision': 'en_revision',
      'Borrador': 'borrador',
    }
    const estEstado = estadoMap[e.estado] || (e.estado ? String(e.estado).toLowerCase().replace(' ', '_') : 'aprobada')

    return {
      id: e.id,
      proyectoId: e.proyecto_id,
      numero: numStr,
      numeroEstimacion: numEst,
      codigoEstimacion: codEst,
      nombreEstimacion: `Estimación No. ${String(numEst).padStart(2, '0')} - ${mesNombre}`,
      delegadoResidente: delegadoResidenteNombre || 'Delegado Residente',
      perspectiva: 'ejecutora',
      fechaInicio: fIni,
      fechaFin: fFin,
      fechaCorte: fFin,
      mes: mesNombre,
      diasRetraso: 0,
      porcentajeRendimiento: 100,
      calificacionDesempeno: 'bueno',
      valorBrutoTrabajado: bruto,
      montoEstimacion: bruto,
      porcentajeAmortizacion: pctAmort,
      montoAmortizacion: amort,
      porcentajeRetencionGarantia: Number(e.porcentaje_retencion_garantia ?? 5),
      montoRetencionGarantia: Number(e.monto_retencion_garantia ?? 0),
      montoLiquidoAPagar: neto,
      montoNetoPagar: neto,
      saldoContractualRestante: 0,
      saldoAnticipoRemanente: Number(e.saldo_anticipo_remanente ?? 0),
      estado: estEstado,
      supervisadoPor: nomSup || 'Empresa Supervisora',
      observaciones: e.observaciones || 'Generada desde Hoja Sábana Analítica',
    }
  })

  const resultadoCompleto = {
    id: proyecto.id,
    codigo: proyecto.codigo,
    nombre: proyecto.nombre,
    descripcion: detalle.descripcion_proyecto ?? proyecto.descripcion ?? '',
    ubicacion: detalle.tramo ?? proyecto.ubicacion ?? '',
    nombreOficial: detalle.nombre_oficial ?? proyecto.nombre,
    ubicacionFisica: detalle.tramo ?? proyecto.ubicacion ?? '',
    direccion: detalle.direccion ?? '',
    latitud: detalle.latitud,
    longitud: detalle.longitud,
    coordenadasMapa: detalle.latitud != null && detalle.longitud != null
      ? { lat: Number(detalle.latitud), lng: Number(detalle.longitud), puntoTexto: detalle.direccion ?? 'Punto de obra' }
      : undefined,
    municipioId: detalle.municipio_id,
    municipioNombre: municipioInicioRes.data?.nombre || '',
    departamentoId: detalle.departamento_id,
    departamentoNombre: departamentoInicioRes.data?.nombre || '',
    municipioFinId: detalle.municipio_fin_id,
    municipioFinNombre: municipioFinRes.data?.nombre || '',
    departamentoFinId: detalle.departamento_fin_id,
    departamentoFinNombre: departamentoFinRes.data?.nombre || '',
    direccionFin: detalle.direccion_fin ?? '',
    kilometroInicio: detalle.kilometro_inicio,
    kilometroFin: detalle.kilometro_fin,
    empresaContratanteId: detalle.empresa_contratante_id ?? null,
    contactoContratanteId: detalle.contacto_contratante_id ?? null,
    entidadContratante: entidadContratanteNombre,
    empresaContratistaId: detalle.empresa_contratista_id ?? null,
    empresaContratista: empresaContratistaNombre || contratoEjecucion?.empresaNombre || '',
    empresaSupervisora: detalle.empresa_supervisora || contratoSupervision?.empresaNombre || '',
    delegadoResidenteId: detalle.delegado_residente_id ?? null,
    delegadoResidente: delegadoResidenteNombre,
    responsableId: proyecto.responsable_id ?? null,
    responsable_id: proyecto.responsable_id ?? null,
    responsable: proyecto.responsable_id ?? null,
    responsableNombre: responsableNombre || delegadoResidenteNombre || 'No asignado',
    fechaAdjudicacion: detalle.fecha_adjudicacion ?? '',
    fechaInicioContractual: detalle.fecha_inicio_contractual ?? fInicioCalc,
    fechaInicio: fInicioCalc,
    fechaFin: fFinCalc,
    fechaFinContractualPlan: fFinCalc,
    fechaFinalContractual: fFinCalc,
    numeroEscrituraPublica: detalle.numero_escritura_publica ?? '',
    montoContractualOriginal: detalle.monto_original ?? null,
    presupuesto: detalle.monto_original ?? 0,
    plazo: plazoStrCalc,
    plazoContractual: plazoStrCalc,
    plazo_ejecucion_original: detalle.plazo_ejecucion_original ?? null,
    plazoEjecucionOriginal: detalle.plazo_ejecucion_original ?? null,
    plazoEjecucionContractualOriginal: plazoStrCalc,
    fechaFinalizacionReal: detalle.fecha_finalizacion_real ?? '',
    plazoEjecucionRealAmpliado: detalle.plazo_ejecucion_ampliado ? `${detalle.plazo_ejecucion_ampliado} días` : '',
    montoFinancieroFinalEjecutado: detalle.monto_final ?? null,
    montoFinal: detalle.monto_final ?? null,
    equipo,
    estado: estadoCodigo,
    parametro_proyecto: paramRes.data || null,
    parametroProyecto: paramRes.data || null,
    planTrabajo: mappedRenglones,
    renglones: mappedRenglones,
    tipoObra: detalle.tipo_obra ? String(detalle.tipo_obra).toLowerCase().trim() : (mappedRenglones.length > 0 ? 'sabana' : 'manual'),
    tipo_obra: detalle.tipo_obra ? String(detalle.tipo_obra).toLowerCase().trim() : (mappedRenglones.length > 0 ? 'sabana' : 'manual'),
    tieneSabana: (detalle.tipo_obra ? String(detalle.tipo_obra).toLowerCase().trim() === 'sabana' : true) && mappedRenglones.length > 0,
    usarModoSabana: detalle.tipo_obra ? String(detalle.tipo_obra).toLowerCase().trim() === 'sabana' : mappedRenglones.length > 0,
    modoGestionFinanciera: detalle.tipo_obra ? String(detalle.tipo_obra).toLowerCase().trim() : (mappedRenglones.length > 0 ? 'sabana' : 'manual'),
    totalRenglones: mappedRenglones.length,
    avance: avanceFisicoCalculado,
    avanceFisico: avanceFisicoCalculado,
    montoPlanificado: montoPlanificadoTotal,
    montoEjecutado: montoEjecutadoReal,
    montoPlanificadoTotal,
    montoEjecutadoTotal: montoEjecutadoReal,
    renglonesConAvance,
    contratoEjecucion,
    contratoSupervision,
    contratos,
    documentos,
    estimaciones,
    estimacionesSabana: estimaciones,
    totalEstimaciones: estimaciones.length,
    licitacionEjecutora: contratoEjecucion?.licitacionNumero || null,
    propietarioContratista: contratoEjecucion?.propietario || (esContDomun ? DATOS_INSTITUCIONALES_DOMUN.propietario : null),
    registroMercantilContratista: contratoEjecucion?.registroMercantil || (esContDomun ? DATOS_INSTITUCIONALES_DOMUN.registro_mercantil : null),
    direccionContratista: contratoEjecucion?.direccion || (esContDomun ? DATOS_INSTITUCIONALES_DOMUN.direccion : null),
    telefonoContratista: contratoEjecucion?.telefono || (esContDomun ? DATOS_INSTITUCIONALES_DOMUN.telefono : null),
    correoContratista: contratoEjecucion?.correo || (esContDomun ? DATOS_INSTITUCIONALES_DOMUN.correo_institucional : null),
    superintendente: contratoEjecucion?.responsable || null,
    colegiadoActivoSuperintendente: contratoEjecucion?.colegiadoActivoSuperintendente || null,
    actaInicioEjecutora: contratoEjecucion?.actaInicioNumero || null,
    programaObra: contratoEjecucion?.programa || null,
    subprogramaObra: contratoEjecucion?.subprograma || null,
    fuenteFinanciamientoObra: contratoEjecucion?.fuenteFinanciamiento || null,
    partidaFondosObra: contratoEjecucion?.partidaFondos || null,
    cdpObra: contratoEjecucion?.cdp || null,
    numeroContratoOriginal: contratoEjecucion?.contratoNumero || null,
    acuerdoMinisterialOriginal: contratoEjecucion?.acuerdoMinisterial || null,
    porcentajeAnticipoObra: contratoEjecucion?.porcentajeAnticipo || 0,
    montoAnticipoObra: contratoEjecucion?.montoAnticipo || 0,
    mesesContratadosObra: contratoEjecucion?.plazoMesesDetalle || null,
    fechaTerminacionOriginalObra: contratoEjecucion?.fechaFin || null,
    licitacionSupervisora: contratoSupervision?.licitacionNumero || null,
    propietarioSupervisora: contratoSupervision?.propietario || (esSupDomun ? DATOS_INSTITUCIONALES_DOMUN.propietario : null),
    registroMercantilSupervisora: contratoSupervision?.registroMercantil || (esSupDomun ? DATOS_INSTITUCIONALES_DOMUN.registro_mercantil : null),
    direccionSupervisora: contratoSupervision?.direccion || (esSupDomun ? DATOS_INSTITUCIONALES_DOMUN.direccion : null),
    telefonoSupervisora: contratoSupervision?.telefono || (esSupDomun ? DATOS_INSTITUCIONALES_DOMUN.telefono : null),
    correoSupervisora: contratoSupervision?.correo || (esSupDomun ? DATOS_INSTITUCIONALES_DOMUN.correo_institucional : null),
    actaInicioSupervisora: contratoSupervision?.actaInicioNumero || null,
    responsableSupervisora: contratoSupervision?.responsable || null,
    programaSupervisora: contratoSupervision?.programa || null,
    subprogramaSupervisora: contratoSupervision?.subprograma || null,
    fuenteFinanciamientoSupervisora: contratoSupervision?.fuenteFinanciamiento || null,
    partidaFondosSupervisora: contratoSupervision?.partidaFondos || null,
    cdpSupervisora: contratoSupervision?.cdp || null,
    contratoSupervisora: contratoSupervision?.contratoNumero || null,
    acuerdoSupervisora: contratoSupervision?.acuerdoMinisterial || null,
    supervisoraMontoOriginal: contratoSupervision?.montoOriginal || 0,
    porcentajeAnticipoSupervision: contratoSupervision?.porcentajeAnticipo || 0,
    montoAnticipoSupervision: contratoSupervision?.montoAnticipo || 0,
    fechaInicioSupervisora: contratoSupervision?.fechaInicio || null,
    mesesContratadosSupervisora: contratoSupervision?.plazoMesesDetalle || null,
    fechaFinSupervisora: contratoSupervision?.fechaFin || null,
    paso2: {},
    paso3: {},
  }

  cacheProyectoDetalleMap.set(proyectoId, { data: resultadoCompleto, timestamp: Date.now() })
  return resultadoCompleto
}

async function resolverCodigoEstado(estadoId: string | null): Promise<string> {
  if (!estadoId) return 'borrador'
  if (cacheEstadoItems && cacheEstadoItems.has(estadoId)) {
    return cacheEstadoItems.get(estadoId)!
  }
  const { data } = await clienteSupabase
    .from('catalogo_item')
    .select('codigo')
    .eq('id', estadoId)
    .maybeSingle()
  const cod = (data?.codigo || 'borrador').toLowerCase()
  if (cacheEstadoItems) cacheEstadoItems.set(estadoId, cod)
  return cod
}

let cacheProyectosList: { data: any[]; timestamp: number } | null = null
const TTL_CACHE_PROYECTOS_MS = 30 * 1000 // 30s de caché en memoria backend
let cacheEstadoItems: Map<string, string> | null = null
let cacheEstadoItemsTimestamp = 0

export async function obtenerProyectos() {
  if (cacheProyectosList && Date.now() - cacheProyectosList.timestamp < TTL_CACHE_PROYECTOS_MS) {
    return cacheProyectosList.data
  }

  const necesitanEstados = !cacheEstadoItems || (Date.now() - cacheEstadoItemsTimestamp > 10 * 60 * 1000)
  
  const [proyectosRes, estadoItemsRes] = await Promise.all([
    clienteSupabase
      .from('proyecto')
      .select(`
        id,
        codigo,
        nombre,
        descripcion,
        ubicacion,
        responsable_id,
        fecha_inicio,
        fecha_fin_estimada,
        estado_id,
        renglon_trabajo ( id, cantidad_contractual, cantidad_ajustada, cantidad_ejecutada, precio_unitario_directo ),
        bitacora_entrada ( id ),
        bitacora_avance ( id ),
        bitacora_pendiente ( id ),
        proyecto_detalle (
          nombre_oficial,
          descripcion_proyecto,
          tramo,
          direccion,
          latitud,
          longitud,
          municipio_id,
          departamento_id,
          departamento:departamento_id(id, nombre),
          municipio:municipio_id(id, nombre),
          kilometro_inicio,
          kilometro_fin,
          monto_original,
          plazo_ejecucion_original,
          plazo_ejecucion_ampliado,
          empresa_contratante_id,
          empresa_contratista_id,
          delegado_residente_id,
          fecha_adjudicacion,
          fecha_inicio_contractual,
          fecha_finalizacion_real,
          tipo_obra
        )
      `)
      .order('created_at', { ascending: false }),
    necesitanEstados
      ? clienteSupabase
          .from('catalogo_item')
          .select('id, codigo, catalogo!inner(codigo)')
          .eq('catalogo.codigo', 'estado_proyecto')
      : Promise.resolve({ data: null, error: null }),
  ])

  if (proyectosRes.error) {
    console.error('Error obteniendo lista de proyectos:', proyectosRes.error)
    return cacheProyectosList?.data || []
  }

  if (estadoItemsRes.data && Array.isArray(estadoItemsRes.data)) {
    cacheEstadoItems = new Map<string, string>()
    cacheEstadoCodigoToId = new Map<string, string>()
    for (const item of estadoItemsRes.data) {
      const cod = String(item.codigo || '').toLowerCase()
      cacheEstadoItems.set(item.id, cod)
      cacheEstadoCodigoToId.set(cod, item.id)
    }
    cacheEstadoItemsTimestamp = Date.now()
    cacheEstadoCodigoTimestamp = Date.now()
  }

  const estadoMapa = cacheEstadoItems || new Map<string, string>()

  const delegadoIds = Array.from(
    new Set(
      (proyectosRes.data || [])
        .map((p: any) => {
          const d = Array.isArray(p.proyecto_detalle) ? p.proyecto_detalle[0] : p.proyecto_detalle || {}
          return d.delegado_residente_id
        })
        .filter(Boolean)
    )
  )

  const delegadoMapa = new Map<string, string>()
  if (delegadoIds.length > 0) {
    const { data: usuariosDel } = await clienteSupabase
      .from('usuario')
      .select('id, correo, dato_usuario(primer_nombre, primer_apellido)')
      .in('id', delegadoIds)

    if (usuariosDel) {
      for (const u of usuariosDel) {
        const dato = (u as any).dato_usuario
        const full = dato ? `${dato.primer_nombre || ''} ${dato.primer_apellido || ''}`.trim() : ''
        delegadoMapa.set(u.id, full || u.correo || '')
      }
    }
  }

  const idsVistos = new Set<string>()
  const filasUnicas = (proyectosRes.data || []).filter((p: any) => {
    if (!p?.id || idsVistos.has(p.id)) return false
    idsVistos.add(p.id)
    return true
  })

  const resultado = filasUnicas.map((p: any) => {
    const d = Array.isArray(p.proyecto_detalle) ? p.proyecto_detalle[0] : p.proyecto_detalle || {}
    const fInicio = d.fecha_inicio_contractual || p.fecha_inicio || d.fecha_adjudicacion || ''
    const plazoNum = d.plazo_ejecucion_original || d.plazo_ejecucion_ampliado || null
    let fFin = d.fecha_finalizacion_real || p.fecha_fin_estimada || ''
    if (!fFin && fInicio && plazoNum) {
      const dInicio = new Date(fInicio)
      if (!isNaN(dInicio.getTime())) {
        const dFin = new Date(dInicio.getTime() + (plazoNum * 86400000))
        fFin = dFin.toISOString().split('T')[0]
      }
    }
    const plazoStr = plazoNum ? `${plazoNum} días` : (fInicio && fFin ? `${Math.round((new Date(fFin).getTime() - new Date(fInicio).getTime()) / 86400000)} días` : '')
    const estadoCod = p.estado_id ? (estadoMapa.get(p.estado_id) || 'borrador') : 'borrador'
    const delegadoNombre = d.delegado_residente_id ? (delegadoMapa.get(d.delegado_residente_id) || '') : ''
    const ubicacionCalc = d.tramo || d.direccion || (d.departamento?.nombre ? (d.municipio?.nombre ? `${d.departamento.nombre}, ${d.municipio.nombre}` : d.departamento.nombre) : '') || p.ubicacion || ''
    const totalRenglones = Array.isArray(p.renglon_trabajo) ? p.renglon_trabajo.length : 0
    const tipoObraD = d.tipo_obra ? String(d.tipo_obra).toLowerCase().trim() : null
    const modoGestionFinanciera = tipoObraD ? tipoObraD : (totalRenglones > 0 ? 'sabana' : 'manual')
    const tieneSabana = modoGestionFinanciera === 'sabana' && totalRenglones > 0

    let totalMontoPlanificado = 0
    let totalMontoEjecutadoPonderado = 0
    let totalMontoEjecutadoReal = 0
    let totalRenglonesConAvance = 0
    const renglonesList = Array.isArray(p.renglon_trabajo) ? p.renglon_trabajo : []
    for (const r of renglonesList) {
      const meta = Number(r.cantidad_ajustada) > 0 ? Number(r.cantidad_ajustada) : (Number(r.cantidad_contractual) || 0)
      const ejec = Math.max(0, Number(r.cantidad_ejecutada) || 0)
      const pu = Number(r.precio_unitario_directo) || 0
      const montoMeta = meta * pu
      totalMontoPlanificado += montoMeta
      totalMontoEjecutadoReal += ejec * pu
      totalMontoEjecutadoPonderado += Math.min(meta, ejec) * pu
      if (ejec > 0) totalRenglonesConAvance++
    }
    const avanceCalculado = totalMontoPlanificado > 0
      ? Math.min(100, Math.round((totalMontoEjecutadoPonderado / totalMontoPlanificado) * 10000) / 100)
      : 0

    const totalBitacoras =
      (Array.isArray(p.bitacora_entrada) ? p.bitacora_entrada.length : 0) +
      (Array.isArray(p.bitacora_avance) ? p.bitacora_avance.length : 0) +
      (Array.isArray(p.bitacora_pendiente) ? p.bitacora_pendiente.length : 0)
    const tieneBitacoras = totalBitacoras > 0
    const esEliminable = estadoCod === 'borrador'
    let motivoNoEliminable = ''
    if (estadoCod !== 'borrador') {
      motivoNoEliminable = `Solo proyectos en Borrador pueden eliminarse (estado actual: ${estadoCod})`
    }

    return {
      id: p.id,
      codigo: p.codigo,
      nombre: p.nombre,
      nombreOficial: d.nombre_oficial || p.nombre,
      descripcion: d.descripcion_proyecto || p.descripcion || '',
      ubicacion: ubicacionCalc,
      ubicacionFisica: ubicacionCalc || d.tramo || d.direccion || p.ubicacion || '',
      direccion: d.direccion || '',
      latitud: d.latitud ?? null,
      longitud: d.longitud ?? null,
      presupuesto: d.monto_original || 0,
      montoContractualOriginal: d.monto_original || 0,
      fechaInicio: fInicio,
      fechaInicioContractual: d.fecha_inicio_contractual || fInicio,
      fechaFin: fFin,
      fechaFinalContractual: fFin,
      plazo: plazoStr,
      plazoContractual: plazoStr,
      plazo_ejecucion_original: plazoNum,
      plazoEjecucionOriginal: plazoNum,
      departamento_id: d.departamento_id,
      municipio_id: d.municipio_id,
      departamentoId: d.departamento_id,
      municipioId: d.municipio_id,
      departamentoNombre: d.departamento?.nombre || '',
      municipioNombre: d.municipio?.nombre || '',
      departamento_nombre: d.departamento?.nombre || '',
      municipio_nombre: d.municipio?.nombre || '',
      estado: estadoCod,
      responsable_id: p.responsable_id || null,
      responsableId: p.responsable_id || null,
      delegadoResidenteId: d.delegado_residente_id || null,
      delegadoResidente: delegadoNombre,
      delegado_residente: delegadoNombre,
      responsable: delegadoNombre,
      empresaContratanteId: d.empresa_contratante_id || null,
      empresa_contratante_id: d.empresa_contratante_id || null,
      empresaContratistaId: d.empresa_contratista_id || null,
      empresa_contratista_id: d.empresa_contratista_id || null,
      tieneSabana,
      usarModoSabana: tieneSabana,
      modoGestionFinanciera,
      tipoObra: modoGestionFinanciera,
      tipo_obra: modoGestionFinanciera,
      totalRenglones,
      avance: avanceCalculado,
      avanceFisico: avanceCalculado,
      montoPlanificado: totalMontoPlanificado,
      montoEjecutado: totalMontoEjecutadoReal,
      montoPlanificadoTotal: totalMontoPlanificado,
      montoEjecutadoTotal: totalMontoEjecutadoReal,
      renglonesConAvance: totalRenglonesConAvance,
      totalBitacoras,
      tieneBitacoras,
      esEliminable,
      motivoNoEliminable,
    }
  })

  cacheProyectosList = { data: resultado, timestamp: Date.now() }
  return resultado
}

export async function crearProyecto(datosFormulario: any) {
  const nombreFinal = (datosFormulario.nombreOficial || datosFormulario.nombre || '').trim()
  if (!nombreFinal) {
    throw new ValidationError('El nombre del proyecto es obligatorio.', 'nombre')
  }

  const estadoCodigo = (datosFormulario.estado || 'borrador').toLowerCase()

  // Protección contra duplicados accidentales (doble-click / peticiones concurrentes)
  const codigoBuscado = datosFormulario.codigo ? String(datosFormulario.codigo).trim() : null
  if (codigoBuscado) {
    const { data: proyPorCodigo } = await clienteSupabase
      .from('proyecto')
      .select('id')
      .eq('codigo', codigoBuscado)
      .maybeSingle()
    if (proyPorCodigo?.id) {
      console.warn(`[Anti-Duplicidad] Proyecto con código "${codigoBuscado}" ya existe. Retornando ID existente: ${proyPorCodigo.id}`)
      return proyPorCodigo.id
    }
  }

  if (!codigoBuscado?.startsWith('TEST-') && !codigoBuscado?.startsWith('DOM-VIAL-FULL-') && !codigoBuscado?.startsWith('PROY-BIT-TEST-')) {
    const { data: reciente } = await clienteSupabase
      .from('proyecto')
      .select('id, created_at')
      .ilike('nombre', nombreFinal)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (reciente && reciente.created_at) {
      const segundos = (Date.now() - new Date(reciente.created_at).getTime()) / 1000
      if (segundos < 15) {
        console.warn(`[Anti-Duplicidad] Petición duplicada detectada para "${nombreFinal}" creada hace ${Math.round(segundos)}s. Retornando ID: ${reciente.id}`)
        return reciente.id
      }
    }
  }

  const fechaInicio = datosFormulario.fechaInicioContractual || datosFormulario.fechaInicio || new Date().toISOString().split('T')[0]
  const fechaFinEstimada =
    datosFormulario.fechaFinContractualPlan ||
    datosFormulario.fechaFin ||
    datosFormulario.fechaFinEstimada ||
    (() => {
      const f = new Date(fechaInicio)
      f.setFullYear(f.getFullYear() + 1)
      return f.toISOString().split('T')[0]
    })()

  const contratoEjec = datosFormulario.contratoEjecucion || {}
  const contratoSup = datosFormulario.contratoSupervision || {}

  // 1. Resolver en paralelo estado, empresa base y entidades participantes
  const [estadoId, empresaBaseId, empContratanteId, empContratistaId] = await Promise.all([
    obtenerEstadoIdPorCodigo(estadoCodigo),
    datosFormulario.empresa_id ? Promise.resolve(datosFormulario.empresa_id) : obtenerEmpresaDefaultId(),
    esUuidValido(datosFormulario.empresaContratanteId)
      ? Promise.resolve(datosFormulario.empresaContratanteId)
      : resolverEmpresaContratanteId(datosFormulario.entidadContratante || datosFormulario.empresaContratanteId),
    esUuidValido(datosFormulario.empresaContratistaId)
      ? Promise.resolve(datosFormulario.empresaContratistaId)
      : resolverEmpresaContratistaId(
          datosFormulario.empresaContratista || datosFormulario.empresaContratistaId,
          {
            direccion: contratoEjec.direccion || datosFormulario.contratistaDireccion,
            telefono: contratoEjec.telefono || datosFormulario.contratistaTelefono,
            correo: contratoEjec.correo || datosFormulario.contratistaCorreo,
            nit: contratoEjec.registroMercantil || datosFormulario.contratistaRegistroMercantil,
          }
        ),
    datosFormulario.empresaSupervisora
      ? sincronizarEmpresaSupervisora(datosFormulario.empresaSupervisora, {
          direccion: contratoSup.direccion || datosFormulario.supervisoraDireccion,
          telefono: contratoSup.telefono || datosFormulario.supervisoraTelefono,
          correo: contratoSup.correo || datosFormulario.supervisoraCorreo,
          propietario: contratoSup.propietario || datosFormulario.supervisoraPropietario,
        })
      : Promise.resolve(),
  ])

  // 2. Insertar en tabla base `proyecto`
  const { data: proyecto, error: errorProyecto } = await clienteSupabase
    .from('proyecto')
    .insert({
      codigo: datosFormulario.codigo || `PROY-${Math.floor(Math.random() * 10000)}`,
      nombre: nombreFinal,
      descripcion: datosFormulario.descripcion || null,
      ubicacion: datosFormulario.ubicacionFisica || datosFormulario.direccion || null,
      fecha_inicio: fechaInicio,
      fecha_fin_estimada: fechaFinEstimada,
      responsable_id: esUuidValido(datosFormulario.responsable) || null,
      estado_id: estadoId,
      empresa_id: empresaBaseId,
    })
    .select('id')
    .single()

  if (errorProyecto || !proyecto) {
    console.error('Error insertando proyecto', errorProyecto)
    throw new Error('No se pudo crear el registro base del proyecto')
  }

  const muniId = esUuidValido(datosFormulario.municipioId)
  const depaId = esUuidValido(datosFormulario.departamentoId)
  const muniFinId = esUuidValido(datosFormulario.municipioFinId)
  const depaFinId = esUuidValido(datosFormulario.departamentoFinId)
  const delegadoResId = esUuidValido(datosFormulario.delegadoResidenteId)

  const usuariosAInsertar: any[] = []
  if (delegadoResId) {
    usuariosAInsertar.push({
      proyecto_id: proyecto.id,
      usuario_id: delegadoResId,
      rol_proyecto: 'Delegado Residente',
    })
  }
  if (Array.isArray(datosFormulario.equipo)) {
    for (const miembro of datosFormulario.equipo) {
      const uId = esUuidValido(miembro?.id || miembro?.usuarioId)
      if (uId && uId !== delegadoResId) {
        usuariosAInsertar.push({
          proyecto_id: proyecto.id,
          usuario_id: uId,
          rol_proyecto: miembro.rol || 'Miembro',
        })
      }
    }
  }

  const contactoContratanteIdFinal = await resolverContactoContratanteId(
    datosFormulario.contactoContratanteId,
    empContratanteId,
    datosFormulario.contactoContratante as string
  )

  // 3. Ejecutar en paralelo la inserción de detalle, equipo, parámetros, contratos y renglones
  const [detalleRes, equipoRes, paramRes] = await Promise.all([
    clienteSupabase.from('proyecto_detalle').insert({
      proyecto_id: proyecto.id,
      nombre_oficial: datosFormulario.nombreOficial || nombreFinal,
      descripcion_proyecto: datosFormulario.descripcion || null,
      tramo: datosFormulario.ubicacionFisica || datosFormulario.direccion || null,
      municipio_id: muniId,
      departamento_id: depaId,
      municipio_fin_id: muniFinId,
      departamento_fin_id: depaFinId,
      direccion_fin: datosFormulario.direccionFin || null,
      kilometro_inicio: datosFormulario.kilometroInicio ?? null,
      kilometro_fin: datosFormulario.kilometroFin ?? null,
      latitud: datosFormulario.latitud ?? datosFormulario.coordenadasMapa?.lat ?? datosFormulario.coordenadas?.lat ?? null,
      longitud: datosFormulario.longitud ?? datosFormulario.coordenadasMapa?.lng ?? datosFormulario.coordenadas?.lng ?? null,
      direccion: datosFormulario.direccion || null,
      monto_final: datosFormulario.montoFinal || null,
      empresa_contratante_id: empContratanteId,
      contacto_contratante_id: contactoContratanteIdFinal,
      empresa_contratista_id: empContratistaId,
      empresa_supervisora: datosFormulario.empresaSupervisora || null,
      delegado_residente_id: delegadoResId,
      fecha_adjudicacion: datosFormulario.fechaAdjudicacion || null,
      fecha_inicio_contractual: datosFormulario.fechaInicioContractual || null,
      numero_escritura_publica: datosFormulario.numeroEscrituraPublica || null,
      monto_original: datosFormulario.montoContractualOriginal || null,
      plazo_ejecucion_original: datosFormulario.plazoEjecucionOriginal ? parseInt(datosFormulario.plazoEjecucionOriginal, 10) : null,
      plazo_ejecucion_ampliado: datosFormulario.plazoEjecucionRealAmpliado ? parseInt(datosFormulario.plazoEjecucionRealAmpliado, 10) : null,
      fecha_finalizacion_real: datosFormulario.fechaFinalizacionReal || null,
      tipo_obra: datosFormulario.modoGestionFinanciera || datosFormulario.tipoObra || datosFormulario.tipo_obra || (datosFormulario.usarModoSabana === false ? 'manual' : 'sabana') || 'sabana',
    }),
    usuariosAInsertar.length > 0
      ? clienteSupabase.from('proyecto_usuario').insert(usuariosAInsertar)
      : Promise.resolve({ error: null }),
    clienteSupabase.from('parametro_proyecto').insert({
      proyecto_id: proyecto.id,
      porcentaje_indirectos: typeof datosFormulario.porcentajeIndirectos === 'number' ? datosFormulario.porcentajeIndirectos : 0,
      porcentaje_iva: typeof datosFormulario.porcentajeIva === 'number' ? datosFormulario.porcentajeIva : 0,
      porcentaje_amortizacion_anticipo: typeof datosFormulario.porcentajeAnticipo === 'number' ? datosFormulario.porcentajeAnticipo : 0,
      monto_anticipo_total: 0,
    }),
    guardarContratosProyecto(proyecto.id, datosFormulario, true),
    guardarRenglonesProyecto(proyecto.id, datosFormulario, true),
  ])

  if (detalleRes.error) {
    console.error('SUPABASE ERROR:', detalleRes.error)
    await clienteSupabase.from('proyecto').delete().eq('id', proyecto.id)
    throw new Error('Error al insertar detalles del proyecto')
  }
  if (equipoRes.error) console.error('EQUIPO ERROR:', equipoRes.error)
  if (paramRes.error) console.error('PARAMETRO_PROYECTO AUTO-INSERT ERROR:', paramRes.error)
  await guardarDocumentosProyecto(proyecto.id, datosFormulario, true)

  invalidarCacheProyectos()

  return proyecto.id
}

export async function actualizarProyecto(proyectoId: string, datosFormulario: Record<string, unknown>) {
  const tieneCamposFecha = Boolean(
    datosFormulario.fechaAdjudicacion ||
    datosFormulario.fechaInicioContractual ||
    datosFormulario.fechaInicio ||
    datosFormulario.fechaFinContractualPlan ||
    datosFormulario.fechaFin ||
    datosFormulario.fechaFinalizacionReal ||
    datosFormulario.plazoEjecucionOriginal ||
    datosFormulario.plazoEjecucionContractualOriginal ||
    datosFormulario.plazoEjecucionRealAmpliado
  )

  if (tieneCamposFecha) {
    await validarOperacionProyectoPermitida(proyectoId, 'fechas')
  }

  const proyectoUpdates: Record<string, unknown> = {}
  const detalleUpdates: Record<string, unknown> = {}

  if ('nombreOficial' in datosFormulario) {
    proyectoUpdates.nombre = datosFormulario.nombreOficial
    detalleUpdates.nombre_oficial = datosFormulario.nombreOficial
  }
  if ('descripcion' in datosFormulario) {
    proyectoUpdates.descripcion = datosFormulario.descripcion
    detalleUpdates.descripcion_proyecto = datosFormulario.descripcion
  }
  if ('ubicacionFisica' in datosFormulario) {
    proyectoUpdates.ubicacion = datosFormulario.ubicacionFisica
    detalleUpdates.tramo = datosFormulario.ubicacionFisica
  }
  if ('municipioId' in datosFormulario) detalleUpdates.municipio_id = esUuidValido(datosFormulario.municipioId)
  if ('departamentoId' in datosFormulario) detalleUpdates.departamento_id = esUuidValido(datosFormulario.departamentoId)
  if ('municipioFinId' in datosFormulario) detalleUpdates.municipio_fin_id = esUuidValido(datosFormulario.municipioFinId)
  if ('departamentoFinId' in datosFormulario) detalleUpdates.departamento_fin_id = esUuidValido(datosFormulario.departamentoFinId)
  if ('direccionFin' in datosFormulario) detalleUpdates.direccion_fin = datosFormulario.direccionFin || null
  if ('latitud' in datosFormulario || 'longitud' in datosFormulario || 'coordenadasMapa' in datosFormulario || 'coordenadas' in datosFormulario) {
    const lat = datosFormulario.latitud ?? (datosFormulario.coordenadasMapa as any)?.lat ?? (datosFormulario.coordenadas as any)?.lat
    const lng = datosFormulario.longitud ?? (datosFormulario.coordenadasMapa as any)?.lng ?? (datosFormulario.coordenadas as any)?.lng
    if (lat !== undefined) detalleUpdates.latitud = lat
    if (lng !== undefined) detalleUpdates.longitud = lng
  }
  if ('direccion' in datosFormulario) detalleUpdates.direccion = datosFormulario.direccion
  if ('kilometroInicio' in datosFormulario) detalleUpdates.kilometro_inicio = datosFormulario.kilometroInicio
  if ('kilometroFin' in datosFormulario) detalleUpdates.kilometro_fin = datosFormulario.kilometroFin
  let entidadIdParaContacto: string | null = null
  if ('empresaContratanteId' in datosFormulario || 'entidadContratante' in datosFormulario) {
    const val = await resolverEmpresaContratanteId(datosFormulario.empresaContratanteId || datosFormulario.entidadContratante)
    if (val) {
      detalleUpdates.empresa_contratante_id = val
      entidadIdParaContacto = val
    }
  }
  if (!entidadIdParaContacto) {
    const { data: detActual } = await clienteSupabase
      .from('proyecto_detalle')
      .select('empresa_contratante_id')
      .eq('proyecto_id', proyectoId)
      .maybeSingle()
    entidadIdParaContacto = detActual?.empresa_contratante_id || null
  }
  if ('contactoContratanteId' in datosFormulario || 'contactoContratante' in datosFormulario) {
    detalleUpdates.contacto_contratante_id = await resolverContactoContratanteId(
      datosFormulario.contactoContratanteId,
      entidadIdParaContacto,
      datosFormulario.contactoContratante as string
    )
  }
  if ('empresaContratista' in datosFormulario || 'empresaContratistaId' in datosFormulario) {
    const contratoEjec = (datosFormulario.contratoEjecucion as any) || {}
    const val = await resolverEmpresaContratistaId(
      datosFormulario.empresaContratistaId || datosFormulario.empresaContratista,
      {
        direccion: contratoEjec.direccion || (datosFormulario.contratistaDireccion as string),
        telefono: contratoEjec.telefono || (datosFormulario.contratistaTelefono as string),
        correo: contratoEjec.correo || (datosFormulario.contratistaCorreo as string),
        nit: contratoEjec.registroMercantil || (datosFormulario.contratistaRegistroMercantil as string),
      }
    )
    if (val) detalleUpdates.empresa_contratista_id = val
  }
  if ('empresaSupervisora' in datosFormulario) {
    detalleUpdates.empresa_supervisora = datosFormulario.empresaSupervisora
    const contratoSup = (datosFormulario.contratoSupervision as any) || {}
    await sincronizarEmpresaSupervisora(
      datosFormulario.empresaSupervisora as string,
      {
        direccion: contratoSup.direccion || (datosFormulario.supervisoraDireccion as string),
        telefono: contratoSup.telefono || (datosFormulario.supervisoraTelefono as string),
        correo: contratoSup.correo || (datosFormulario.supervisoraCorreo as string),
        propietario: contratoSup.propietario || (datosFormulario.supervisoraPropietario as string),
      }
    )
  }
  if ('delegadoResidenteId' in datosFormulario || 'delegadoResidente' in datosFormulario) {
    const rawVal = datosFormulario.delegadoResidenteId || datosFormulario.delegadoResidente
    const val = esUuidValido(rawVal) || await resolverUsuarioIdPorNombre(rawVal)
    if (val) detalleUpdates.delegado_residente_id = val
  }
  if ('fechaAdjudicacion' in datosFormulario && datosFormulario.fechaAdjudicacion) {
    detalleUpdates.fecha_adjudicacion = datosFormulario.fechaAdjudicacion
  }
  const inicioVal = datosFormulario.fechaInicioContractual || datosFormulario.fechaInicio
  if (inicioVal && typeof inicioVal === 'string' && inicioVal.trim() !== '') {
    detalleUpdates.fecha_inicio_contractual = inicioVal.trim()
    proyectoUpdates.fecha_inicio = inicioVal.trim()
  }
  const finVal = datosFormulario.fechaFinContractualPlan || datosFormulario.fechaFin
  if (finVal && typeof finVal === 'string' && finVal.trim() !== '') {
    proyectoUpdates.fecha_fin_estimada = finVal.trim()
  }
  if ('numeroEscrituraPublica' in datosFormulario) detalleUpdates.numero_escritura_publica = datosFormulario.numeroEscrituraPublica
  if ('montoContractualOriginal' in datosFormulario) detalleUpdates.monto_original = datosFormulario.montoContractualOriginal
  if ('plazoEjecucionOriginal' in datosFormulario || 'plazoEjecucionContractualOriginal' in datosFormulario) {
    let p: number | null = null
    const orig = datosFormulario.plazoEjecucionOriginal
    if (typeof orig === 'number' && !isNaN(orig)) {
      p = orig
    } else if (typeof orig === 'string' && orig.trim() !== '' && !isNaN(parseInt(orig, 10))) {
      p = parseInt(orig, 10)
    } else if (typeof datosFormulario.plazoEjecucionContractualOriginal === 'string') {
      const match = datosFormulario.plazoEjecucionContractualOriginal.match(/\((\d+)\s*días\)/i)
      if (match && match[1]) {
        p = parseInt(match[1], 10)
      }
    }
    if (p !== null && !isNaN(p)) {
      detalleUpdates.plazo_ejecucion_original = p
    }
  }
  if ('responsable' in datosFormulario || 'responsable_id' in datosFormulario || 'responsableId' in datosFormulario) {
    const rawResp = datosFormulario.responsable || datosFormulario.responsable_id || datosFormulario.responsableId
    const respVal = esUuidValido(rawResp)
    if (respVal) proyectoUpdates.responsable_id = respVal
  }
  if ('estado' in datosFormulario && datosFormulario.estado) {
    const estadoId = await obtenerEstadoIdPorCodigo(datosFormulario.estado as string)
    if (estadoId) proyectoUpdates.estado_id = estadoId
    if (datosFormulario.estado === 'borrador' || datosFormulario.estado === 'activo') {
      proyectoUpdates.en_replanificacion = false
    }
  }
  if ('fechaFinalizacionReal' in datosFormulario || 'fechaFinContractualPlan' in datosFormulario || 'fechaFin' in datosFormulario) {
    const fFin = (datosFormulario.fechaFinalizacionReal || datosFormulario.fechaFinContractualPlan || datosFormulario.fechaFin) as string
    if (fFin && typeof fFin === 'string' && fFin.trim() !== '') {
      detalleUpdates.fecha_finalizacion_real = fFin.trim()
      proyectoUpdates.fecha_fin_estimada = fFin.trim()
    }
  }
  if ('plazoEjecucionRealAmpliado' in datosFormulario || 'diasAdicionalesPlazo' in datosFormulario || 'dias_adicionales' in datosFormulario) {
    const valRaw = datosFormulario.plazoEjecucionRealAmpliado ?? datosFormulario.diasAdicionalesPlazo ?? datosFormulario.dias_adicionales
    const p = typeof valRaw === 'number' ? valRaw : parseInt(String(valRaw), 10)
    if (!isNaN(p)) {
      detalleUpdates.plazo_ejecucion_ampliado = p
    }
  }
  if ('montoFinancieroFinalEjecutado' in datosFormulario || 'montoFinal' in datosFormulario) {
    detalleUpdates.monto_final = datosFormulario.montoFinancieroFinalEjecutado || datosFormulario.montoFinal || null
  }
  if ('tipoObra' in datosFormulario || 'tipo_obra' in datosFormulario || 'modoGestionFinanciera' in datosFormulario || 'usarModoSabana' in datosFormulario) {
    const rawTipo = datosFormulario.modoGestionFinanciera || datosFormulario.tipoObra || datosFormulario.tipo_obra
    if (rawTipo) {
      detalleUpdates.tipo_obra = String(rawTipo).toLowerCase().trim()
    } else if (datosFormulario.usarModoSabana === false) {
      detalleUpdates.tipo_obra = 'manual'
    } else if (datosFormulario.usarModoSabana === true) {
      detalleUpdates.tipo_obra = 'sabana'
    }
  }

  if (Object.keys(proyectoUpdates).length > 0) {
    const { error } = await clienteSupabase.from('proyecto').update(proyectoUpdates).eq('id', proyectoId)
    if (error) throw new Error(error.message)
  }

  if (Object.keys(detalleUpdates).length > 0) {
    const { error } = await clienteSupabase.from('proyecto_detalle').update(detalleUpdates).eq('proyecto_id', proyectoId)
    if (error) throw new Error(error.message)
  }

  if (Array.isArray(datosFormulario.equipo)) {
    await clienteSupabase.from('proyecto_usuario').delete().eq('proyecto_id', proyectoId)
    const usuariosAInsertar = (datosFormulario.equipo as any[])
      .map((miembro) => ({
        proyecto_id: proyectoId,
        usuario_id: esUuidValido(miembro?.id || miembro?.usuarioId),
        rol_proyecto: miembro?.rol || 'Miembro'
      }))
      .filter((m) => m.usuario_id)
    if (usuariosAInsertar.length > 0) {
      const { error: errEq } = await clienteSupabase.from('proyecto_usuario').insert(usuariosAInsertar)
      if (errEq) console.error('Error actualizando equipo proyecto_usuario:', errEq)
    }
  }

  await Promise.all([
    guardarContratosProyecto(proyectoId, datosFormulario, false),
    guardarRenglonesProyecto(proyectoId, datosFormulario, false),
    guardarDocumentosProyecto(proyectoId, datosFormulario, false),
  ])
  invalidarCacheProyectos(proyectoId)

  return { id: proyectoId }
}

async function guardarDocumentosProyecto(proyectoId: string, datosFormulario: any, esNuevoProyecto = false) {
  if (!('documentos' in datosFormulario)) return
  if (!Array.isArray(datosFormulario?.documentos)) return

  // En actualizaciones de proyecto, verificar si es una sincronización explícita de documentos
  // o si es una actualización de otra sección (resumen, contratos, etc.)
  const keys = Object.keys(datosFormulario)
  const esActualizacionGeneral = keys.some((k) =>
    k === 'nombre' || k === 'nombreOficial' || k === 'descripcion' || k === 'entidadContratante' ||
    k === 'empresaContratista' || k === 'empresaSupervisora' || k === 'contratos' || k === 'contratoEjecucion' ||
    k === 'contratoSupervision' || k === 'delegadoResidente'
  )
  const esSincronizacionExplicita = Boolean(datosFormulario._actualizarDocumentos || datosFormulario.actualizarDocumentos)
  const soloVienenDocumentos = keys.length <= 2 && 'documentos' in datosFormulario

  if (!esNuevoProyecto && esActualizacionGeneral && !esSincronizacionExplicita && !soloVienenDocumentos) {
    if (datosFormulario.documentos.length === 0) {
      // No borrar documentos existentes durante la edición de texto de otras secciones
      return
    }
  }

  const documentos = datosFormulario.documentos
    .filter((doc: any) => doc?.nombre && (doc?.url || doc?.url_storage))
    .map((doc: any) => ({
      proyecto_id: proyectoId,
      nombre: String(doc.nombre).slice(0, 255),
      tipo: doc.tipo || 'otro',
      url_storage: doc.url || doc.url_storage,
      version: doc.version || '1.0',
      fecha_subida: doc.fechaSubida || doc.fecha_subida || new Date().toISOString(),
      subido_por: esUuidValido(doc.subidoPorId || doc.subido_por_id || doc.subidoPor || doc.subido_por) || null,
      categoria: doc.categoria || 'Documentos Generales',
      origen: doc.origen || 'modulo_documentos',
    }))

  const { error: deleteError } = await clienteSupabase
    .from('documento_proyecto')
    .delete()
    .eq('proyecto_id', proyectoId)
  if (deleteError) {
    throw new Error(`No se pudieron reemplazar los documentos del proyecto: ${deleteError.message}`)
  }

  if (documentos.length > 0) {
    const { error: insertError } = await clienteSupabase
      .from('documento_proyecto')
      .insert(documentos)
    if (insertError) {
      throw new Error(`No se pudieron guardar los documentos del proyecto: ${insertError.message}`)
    }
  }
}

async function guardarContratosProyecto(proyectoId: string, datosFormulario: any, esNuevoProyecto = false) {
  try {
    const listaContratos: any[] = []
    if (datosFormulario.contratoEjecucion) {
      listaContratos.push({ ...datosFormulario.contratoEjecucion, tipo: 'EJECUCION' })
    } else if (
      datosFormulario.empresaContratista ||
      datosFormulario.propietarioContratista ||
      datosFormulario.licitacionEjecutora ||
      datosFormulario.montoContractualOriginal ||
      datosFormulario.programaObra
    ) {
      listaContratos.push({ tipo: 'EJECUCION' })
    }

    if (datosFormulario.contratoSupervision) {
      listaContratos.push({ ...datosFormulario.contratoSupervision, tipo: 'SUPERVISION' })
    } else if (
      datosFormulario.empresaSupervisora ||
      datosFormulario.propietarioSupervisora ||
      datosFormulario.licitacionSupervisora ||
      datosFormulario.supervisoraMontoOriginal ||
      datosFormulario.programaSupervisora
    ) {
      listaContratos.push({ tipo: 'SUPERVISION' })
    }

    if (Array.isArray(datosFormulario.contratos)) {
      for (const c of datosFormulario.contratos) {
        if (c && c.tipo && !listaContratos.some((x) => x.tipo === c.tipo)) {
          listaContratos.push(c)
        }
      }
    }

    if (listaContratos.length === 0) return

    const rows = listaContratos.map((c) => {
      const esEjec = c.tipo === 'EJECUCION'
      const empNombreRaw = c.empresaNombre || c.empresa_nombre || (esEjec ? datosFormulario.empresaContratista : datosFormulario.empresaSupervisora) || null
      const esDomun = Boolean(empNombreRaw && String(empNombreRaw).toLowerCase().includes('domun'))
      return {
        proyecto_id: proyectoId,
        tipo: c.tipo,
        empresa_nombre: empNombreRaw,
        propietario: c.propietario || (esEjec ? datosFormulario.propietarioContratista : (datosFormulario.propietarioSupervisora || datosFormulario.supervisoraPropietario)) || (esDomun ? DATOS_INSTITUCIONALES_DOMUN.propietario : null),
        registro_mercantil: c.registroMercantil || c.registro_mercantil || (esEjec ? (datosFormulario.registroMercantilContratista || datosFormulario.contratistaRegistroMercantil) : (datosFormulario.registroMercantilSupervisora || datosFormulario.supervisoraRegistroMercantil)) || (esDomun ? DATOS_INSTITUCIONALES_DOMUN.registro_mercantil : null),
        direccion: c.direccion || (esEjec ? (datosFormulario.direccionContratista || datosFormulario.contratistaDireccion) : (datosFormulario.direccionSupervisora || datosFormulario.supervisoraDireccion)) || (esDomun ? DATOS_INSTITUCIONALES_DOMUN.direccion : null),
        telefono: c.telefono || (esEjec ? (datosFormulario.telefonoContratista || datosFormulario.contratistaTelefono) : (datosFormulario.telefonoSupervisora || datosFormulario.supervisoraTelefono)) || (esDomun ? DATOS_INSTITUCIONALES_DOMUN.telefono : null),
        correo: c.correo || (esEjec ? (datosFormulario.correoContratista || datosFormulario.contratistaCorreo) : (datosFormulario.correoSupervisora || datosFormulario.supervisoraCorreo)) || (esDomun ? DATOS_INSTITUCIONALES_DOMUN.correo_institucional : null),
        responsable: c.responsable || (esEjec ? (datosFormulario.superintendente || datosFormulario.responsableNombre) : (datosFormulario.delegadoResidente || datosFormulario.responsableSupervisora || datosFormulario.supervisoraResponsable)) || null,
        colegiado_activo_superintendente: esEjec
          ? (c.colegiadoActivoSuperintendente || c.colegiado_activo_superintendente || datosFormulario.colegiadoActivoSuperintendente || datosFormulario.colegiadoSuperintendente || datosFormulario.contratistaColegiadoActivo || null)
          : null,
        licitacion_numero: c.licitacionNumero || c.licitacion_numero || (esEjec ? (datosFormulario.licitacionEjecutora || datosFormulario.contratistaLicitacion) : (datosFormulario.licitacionSupervisora || datosFormulario.supervisoraLicitacion)) || null,
        acta_inicio_numero: c.actaInicioNumero || c.acta_inicio_numero || (esEjec ? (datosFormulario.actaInicioEjecutora || datosFormulario.actaEjecFinal) : (datosFormulario.actaInicioSupervisora || datosFormulario.actaSupFinal)) || null,
        programa: c.programa || (esEjec ? (datosFormulario.programaObra || datosFormulario.contratistaPrograma) : (datosFormulario.programaSupervisora || datosFormulario.supervisoraPrograma)) || null,
        subprograma: c.subprograma || (esEjec ? (datosFormulario.subprogramaObra || datosFormulario.contratistaSubprograma) : (datosFormulario.subprogramaSupervisora || datosFormulario.supervisoraSubprograma)) || null,
        fuente_financiamiento: c.fuenteFinanciamiento || c.fuente_financiamiento || (esEjec ? (datosFormulario.fuenteFinanciamientoObra || datosFormulario.contratistaFuenteFinanciamiento) : (datosFormulario.fuenteFinanciamientoSupervisora || datosFormulario.supervisoraFuenteFinanciamiento)) || null,
        partida_fondos: c.partidaFondos || c.partida_fondos || (esEjec ? (datosFormulario.partidaFondosObra || datosFormulario.contratistaPartidaFondos) : (datosFormulario.partidaFondosSupervisora || datosFormulario.supervisoraPartidaFondos)) || null,
        cdp: c.cdp || (esEjec ? (datosFormulario.cdpObra || datosFormulario.contratistaCdp) : (datosFormulario.cdpSupervisora || datosFormulario.supervisoraCdp)) || null,
        contrato_numero: c.contratoNumero || c.contrato_numero || (esEjec ? (datosFormulario.numeroContratoOriginal || datosFormulario.contratistaContratoNumero) : (datosFormulario.contratoSupervisora || datosFormulario.supervisoraContratoNumero)) || null,
        acuerdo_ministerial: c.acuerdoMinisterial || c.acuerdo_ministerial || (esEjec ? (datosFormulario.acuerdoMinisterialOriginal || datosFormulario.contratistaAcuerdoMinisterial) : (datosFormulario.acuerdoSupervisora || datosFormulario.supervisoraAcuerdoMinisterial)) || null,
        monto_original: Number(c.montoOriginal || c.monto_original || (esEjec ? (datosFormulario.montoContractualOriginal || datosFormulario.presupuesto) : (datosFormulario.supervisoraMontoOriginal || datosFormulario.montoSupervisionOriginal))) || 0,
        porcentaje_anticipo: Number(c.porcentajeAnticipo || c.porcentaje_anticipo || (esEjec ? (datosFormulario.porcentajeAnticipoObra || datosFormulario.contratistaPorcentajeAnticipo) : (datosFormulario.porcentajeAnticipoSupervision || datosFormulario.supervisoraPorcentajeAnticipo))) || 0,
        monto_anticipo: Number(c.montoAnticipo || c.monto_anticipo || (esEjec ? (datosFormulario.montoAnticipoObra || datosFormulario.contratistaMontoAnticipoCalculado) : (datosFormulario.montoAnticipoSupervision || datosFormulario.supervisoraMontoAnticipoCalculado))) || 0,
        fecha_inicio: c.fechaInicio || c.fecha_inicio || (esEjec ? (datosFormulario.fechaInicioContractual || datosFormulario.fechaInicio) : (datosFormulario.fechaInicioSupervisora || datosFormulario.supervisoraFechaInicio)) || null,
        plazo_meses_detalle: c.plazoMesesDetalle || c.plazo_meses_detalle || (esEjec ? (datosFormulario.mesesContratadosObra || datosFormulario.contratistaMesesPlazo) : (datosFormulario.mesesContratadosSupervisora || datosFormulario.supervisoraMesesPlazo)) || null,
        fecha_fin: c.fechaFin || c.fecha_fin || (esEjec ? (datosFormulario.fechaFinContractualPlan || datosFormulario.fechaFin || datosFormulario.fechaTerminacionOriginalObra) : (datosFormulario.fechaFinSupervisora || datosFormulario.supervisoraFechaFin)) || null,
        updated_at: new Date().toISOString(),
      }
    })

    if (esNuevoProyecto) {
      const { error } = await clienteSupabase.from('proyecto_contrato').insert(rows)
      if (error) throw error
      return
    }

    const { data: existentes, error: existentesError } = await clienteSupabase
      .from('proyecto_contrato')
      .select('*')
      .eq('proyecto_id', proyectoId)
    if (existentesError) throw existentesError

    const mapaExistentes = new Map<string, any>()
    for (const ex of existentes || []) {
      mapaExistentes.set(ex.tipo, ex)
    }

    const aInsertar: any[] = []
    const promesasUpdate: Promise<any>[] = []

    for (const row of rows) {
      const ex = mapaExistentes.get(row.tipo)
      if (ex) {
        // Preservar valores de columnas existentes si en este update vienen nulos o indefinidos
        const mergedRow: any = { updated_at: new Date().toISOString() }
        for (const [key, val] of Object.entries(row)) {
          if (key === 'id' || key === 'created_at') continue
          if (val !== null && val !== undefined && val !== '') {
            mergedRow[key] = val
          } else if (ex[key] !== null && ex[key] !== undefined && ex[key] !== '') {
            mergedRow[key] = ex[key]
          } else {
            mergedRow[key] = null
          }
        }

        promesasUpdate.push(
          Promise.resolve(
            clienteSupabase
            .from('proyecto_contrato')
            .update(mergedRow)
            .eq('id', ex.id)
            .then(({ error }) => {
              if (error) throw error
            })
          )
        )
      } else {
        aInsertar.push(row)
      }
    }

    if (aInsertar.length > 0) {
      promesasUpdate.push(
        Promise.resolve(
          clienteSupabase
          .from('proyecto_contrato')
          .insert(aInsertar)
          .then(({ error }) => {
            if (error) throw error
          })
        )
      )
    }
    if (promesasUpdate.length > 0) {
      await Promise.all(promesasUpdate)
    }

    // Asegurar que los representantes y responsables asignados queden vinculados como contactos en la empresa
    await asegurarContactosVinculadosAEmpresa(datosFormulario)
  } catch (err) {
    console.error('Error en guardarContratosProyecto:', err)
    throw err
  }
}

async function buscarUsuarioPorNombre(nombreCompleto: string): Promise<{ id: string } | null> {
  if (!nombreCompleto || typeof nombreCompleto !== 'string') return null
  const limpio = nombreCompleto.trim().toLowerCase()
  if (!limpio) return null

  const { data: datos } = await clienteSupabase
    .from('dato_usuario')
    .select('usuario_id, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido')

  if (Array.isArray(datos)) {
    const match = datos.find((d) => {
      const full = `${d.primer_nombre || ''} ${d.segundo_nombre || ''} ${d.primer_apellido || ''} ${d.segundo_apellido || ''}`.replace(/\s+/g, ' ').trim().toLowerCase()
      const short = `${d.primer_nombre || ''} ${d.primer_apellido || ''}`.replace(/\s+/g, ' ').trim().toLowerCase()
      return full === limpio || short === limpio || full.includes(limpio) || (short && limpio.includes(short))
    })
    if (match?.usuario_id) return { id: match.usuario_id }
  }

  const { data: u } = await clienteSupabase
    .from('usuario')
    .select('id, username')
    .ilike('username', limpio)
    .maybeSingle()
  if (u?.id) return { id: u.id }

  return null
}

async function asegurarContactosVinculadosAEmpresa(datosFormulario: any) {
  try {
    // 1. Empresa Contratista
    const empContratistaNombre = datosFormulario.empresaContratista || datosFormulario.contratistaNombre || datosFormulario.contratoEjecucion?.empresaNombre
    let empContratistaId = datosFormulario.empresaContratistaId || datosFormulario.empresa_contratista_id || datosFormulario.contratoEjecucion?.empresaId

    if (!empContratistaId && empContratistaNombre) {
      const { data: ec } = await clienteSupabase
        .from('empresa_contratista')
        .select('id')
        .ilike('nombre', String(empContratistaNombre).trim())
        .maybeSingle()
      if (ec?.id) empContratistaId = ec.id
    }

    if (empContratistaId) {
      const prop = datosFormulario.propietarioContratista || datosFormulario.contratistaPropietario || datosFormulario.contratoEjecucion?.propietario
      const superInt = datosFormulario.superintendente || datosFormulario.contratistaSuperintendente || datosFormulario.responsableNombre || datosFormulario.contratoEjecucion?.responsable

      const nombres = [
        { nombre: prop, cargo: 'Representante Legal' },
        { nombre: superInt, cargo: 'Superintendente' },
      ]

      for (const item of nombres) {
        if (!item.nombre || typeof item.nombre !== 'string' || !item.nombre.trim()) continue
        const nom = item.nombre.trim()
        const u = await buscarUsuarioPorNombre(nom)
        if (u?.id) {
          const { data: yaExiste } = await clienteSupabase
            .from('contacto_contratista')
            .select('id')
            .eq('empresa_contratista_id', empContratistaId)
            .eq('usuario_id', u.id)
            .maybeSingle()

          if (!yaExiste) {
            await clienteSupabase.from('contacto_contratista').insert({
              empresa_contratista_id: empContratistaId,
              usuario_id: u.id,
              nombre: nom,
              cargo: item.cargo,
            })
          }
        }
      }
    }

    // 2. Empresa Supervisora (empresa_externa)
    const empSupervisoraNombre = datosFormulario.empresaSupervisora || datosFormulario.supervisoraNombre || datosFormulario.contratoSupervision?.empresaNombre
    let empSupervisoraId = datosFormulario.empresaSupervisoraId || datosFormulario.empresa_supervisora_id || datosFormulario.contratoSupervision?.empresaId

    if (!empSupervisoraId && empSupervisoraNombre) {
      const { data: es } = await clienteSupabase
        .from('empresa_externa')
        .select('id')
        .ilike('nombre', String(empSupervisoraNombre).trim())
        .maybeSingle()
      if (es?.id) empSupervisoraId = es.id
    }

    if (empSupervisoraId) {
      const propSup = datosFormulario.propietarioSupervisora || datosFormulario.supervisoraPropietario || datosFormulario.contratoSupervision?.propietario
      const respSup = datosFormulario.supervisoraResponsable || datosFormulario.responsableSupervisora || datosFormulario.contratoSupervision?.responsable

      const nombresSup = [
        { nombre: propSup, cargo: 'Representante Legal' },
        { nombre: respSup, cargo: 'Supervisor' },
      ]

      for (const item of nombresSup) {
        if (!item.nombre || typeof item.nombre !== 'string' || !item.nombre.trim()) continue
        const nom = item.nombre.trim()
        const u = await buscarUsuarioPorNombre(nom)
        if (u?.id) {
          const { data: yaExiste } = await clienteSupabase
            .from('contacto_empresa_externa')
            .select('id')
            .or(`empresa_externa_id.eq.${empSupervisoraId},empresa_id.eq.${empSupervisoraId}`)
            .eq('usuario_id', u.id)
            .maybeSingle()

          if (!yaExiste) {
            await clienteSupabase.from('contacto_empresa_externa').insert({
              empresa_externa_id: empSupervisoraId,
              usuario_id: u.id,
              nombre: nom,
              cargo: item.cargo,
            })
          }
        }
      }
    }
  } catch (err) {
    console.warn('Error vinculando contactos de empresas en guardarContratosProyecto:', err)
  }
}

async function guardarRenglonesProyecto(proyectoId: string, datosFormulario: any, esNuevoProyecto = false) {
  const listaRenglones = datosFormulario?.renglones || datosFormulario?.planTrabajo || datosFormulario?.renglones_seleccionados
  if (!Array.isArray(listaRenglones) || listaRenglones.length === 0) return

  try {
    // 1. Respaldar cantidades ejecutadas y eliminar renglones anteriores del proyecto solo cuando es actualización
    const mapaEjecutadas = new Map<string, number>()
    if (!esNuevoProyecto) {
      const { data: existingRows } = await clienteSupabase
        .from('renglon_trabajo')
        .select('codigo, descripcion, cantidad_ejecutada')
        .eq('proyecto_id', proyectoId)
      if (Array.isArray(existingRows)) {
        for (const ex of existingRows) {
          if (ex.codigo) mapaEjecutadas.set(String(ex.codigo).trim().toLowerCase(), Number(ex.cantidad_ejecutada) || 0)
          if (ex.descripcion) mapaEjecutadas.set(String(ex.descripcion).trim().toLowerCase(), Number(ex.cantidad_ejecutada) || 0)
        }
      }
      await clienteSupabase.from('renglon_trabajo').delete().eq('proyecto_id', proyectoId)
    }

    // Resolver mapa de unidades de medida para vincular unidad_id si es posible
    const { data: listaUnidades } = await clienteSupabase.from('unidad_medida').select('id, abreviatura, nombre')
    const mapUnidades = new Map<string, string>()
    if (Array.isArray(listaUnidades)) {
      for (const u of listaUnidades) {
        if (u.id) {
          mapUnidades.set(u.id.toLowerCase(), u.id)
          if (u.abreviatura) mapUnidades.set(u.abreviatura.toLowerCase().trim(), u.id)
          if (u.nombre) mapUnidades.set(u.nombre.toLowerCase().trim(), u.id)
        }
      }
    }

    // Resolver mapa de capítulos (capitulo_sabana) para vincular capitulo_id (UUID)
    const { data: listaCaps } = await clienteSupabase.from('capitulo_sabana').select('id, numero_capitulo')
    const mapCaps = new Map<number, string>()
    if (Array.isArray(listaCaps)) {
      for (const c of listaCaps) {
        if (c.id && c.numero_capitulo != null) {
          mapCaps.set(Number(c.numero_capitulo), c.id)
        }
      }
    }

    // 2. Preparar registros para inserción
    const construirFilas = (forzarPrecioCero: boolean) =>
      listaRenglones.map((r: any) => {
        const cod = r.codigoDGC || r.codigo || r.id || '101.01'
        const desc = r.descripcion || r.desc || r.nombre || 'Renglón de trabajo'
        const capRaw = r.capituloId || r.capitulo_id || 1
        const resolvedCapId = (typeof capRaw === 'string' && esUuidValido(capRaw))
          ? capRaw
          : mapCaps.get(Number(capRaw)) || (Array.isArray(listaCaps) && listaCaps[0]?.id ? listaCaps[0].id : null)

        const unidadRaw = String(r.unidad_id || r.unidad || r.unidad_medida || '').trim()
        const resolvedUnidadId = (typeof unidadRaw === 'string' && esUuidValido(unidadRaw))
          ? unidadRaw
          : mapUnidades.get(unidadRaw.toLowerCase()) || null

        const ejecDirecta = r.cantidadEjecutada ?? r.cantidad_ejecutada ?? r.totalAFecha
        const ejecPreservada = ejecDirecta != null
          ? Number(ejecDirecta)
          : (mapaEjecutadas.get(String(cod).trim().toLowerCase()) ?? mapaEjecutadas.get(String(desc).trim().toLowerCase()) ?? 0)

        return {
          proyecto_id: proyectoId,
          codigo: String(cod),
          descripcion: String(desc),
          capitulo_id: resolvedCapId,
          unidad_id: resolvedUnidadId,
          cantidad_contractual: Number(r.cantidadContratada ?? r.cantidadContractual ?? r.cantidad_contractual ?? 1),
          cantidad_ajustada: Number(r.cantidadAjustada ?? r.cantidadContratada ?? r.cantidad_ajustada ?? 1),
          cantidad_ejecutada: Math.max(0, Number(ejecPreservada) || 0),
          precio_unitario_directo: forzarPrecioCero ? 0 : Number(r.costoUnitarioDirecto ?? r.precioUnitario ?? r.precio_unitario_directo ?? 0),
          aplica_indirectos: true,
          aplica_iva: true,
        }
      })

    const aInsertar = construirFilas(false)

    if (aInsertar.length > 0) {
      const { error } = await clienteSupabase.from('renglon_trabajo').insert(aInsertar)
      if (error) {
        const { error: errRetry } = await clienteSupabase.from('renglon_trabajo').insert(construirFilas(true))
        if (errRetry) {
          console.error('Error al insertar renglones del proyecto con precio 0:', errRetry)
        }
      }
    }
  } catch (err) {
    console.error('Error en guardarRenglonesProyecto:', err)
  }
}

export async function eliminarProyecto(id: string, forzar: boolean = false) {
  // 1. Obtener proyecto y estado
  const { data: proyecto, error: proyError } = await clienteSupabase
    .from('proyecto')
    .select(`
      id,
      nombre,
      estado_id,
      catalogo_item:estado_id(codigo)
    `)
    .eq('id', id)
    .single()

  if (proyError || !proyecto) {
    throw new ValidationError('El proyecto a eliminar no existe.', 'id')
  }

  // 2. Validar que esté en modo borrador
  const estadoCodigo = ((proyecto.catalogo_item as any)?.codigo || '').toLowerCase()
  if (!forzar && estadoCodigo !== 'borrador') {
    throw new ValidationError(
      `Solo se pueden eliminar proyectos en estado Borrador. El proyecto "${proyecto.nombre}" tiene estado "${estadoCodigo}".`,
      'estado'
    )
  }

  // 3. Recopilar las claves indirectas antes de borrar sus registros padre.
  const [entradasRes, pendientesRes, incidentesRes, renglonesRes] = await Promise.all([
    clienteSupabase.from('bitacora_entrada').select('id').eq('proyecto_id', id),
    clienteSupabase.from('bitacora_pendiente').select('id').eq('proyecto_id', id),
    clienteSupabase.from('incidente_obra').select('id').eq('proyecto_id', id),
    clienteSupabase.from('renglon_trabajo').select('id').eq('proyecto_id', id),
  ])
  for (const result of [entradasRes, pendientesRes, incidentesRes, renglonesRes]) {
    if (result.error) throw new Error(`No se pudieron consultar las dependencias del proyecto: ${result.error.message}`)
  }

  const entradaIds = (entradasRes.data || []).map((row) => row.id)
  const pendienteIds = (pendientesRes.data || []).map((row) => row.id)
  const incidenteIds = (incidentesRes.data || []).map((row) => row.id)
  const renglonIds = (renglonesRes.data || []).map((row) => row.id)

  const borrar = async (tabla: string, columna: string, valor: string | string[]) => {
    const query = clienteSupabase.from(tabla).delete()
    const result = Array.isArray(valor)
      ? await query.in(columna, valor)
      : await query.eq(columna, valor)
    if (result.error) throw new Error(`No se pudo eliminar ${tabla}: ${result.error.message}`)
  }

  // 4. Eliminar de hijos a padres para respetar las restricciones reales de FK.
  if (entradaIds.length > 0) {
    await borrar('evidencia_fotografica', 'bitacora_entrada_id', entradaIds)
    await borrar('ensayo_laboratorio', 'bitacora_entrada_id', entradaIds)
    await borrar('condicion_climatica', 'bitacora_entrada_id', entradaIds)
    await borrar('estacion_kilometrica', 'bitacora_entrada_id', entradaIds)
  }
  if (incidenteIds.length > 0) await borrar('incidente_evidencia', 'incidente_id', incidenteIds)
  if (pendienteIds.length > 0) await borrar('bitacora_pendiente_ajuste', 'bitacora_pendiente_id', pendienteIds)
  if (renglonIds.length > 0) await borrar('modificativo_renglon', 'renglon_id', renglonIds)

  await borrar('bitacora_avance', 'proyecto_id', id)
  await borrar('bitacora_pendiente', 'proyecto_id', id)
  await borrar('incidente_obra', 'proyecto_id', id)
  await borrar('bitacora_entrada', 'proyecto_id', id)
  await borrar('cronograma_planificado', 'proyecto_id', id)
  await borrar('control_anticipo', 'proyecto_id', id)
  await borrar('control_plazo', 'proyecto_id', id)
  await borrar('suspension_plazo', 'proyecto_id', id)
  await borrar('reporte', 'proyecto_id', id)
  await borrar('auditoria_operativa', 'proyecto_id', id)
  await borrar('renglon_trabajo', 'proyecto_id', id)
  await borrar('fase_proyecto', 'proyecto_id', id)
  await borrar('proyecto_detalle', 'proyecto_id', id)
  await borrar('proyecto_usuario', 'proyecto_id', id)
  await borrar('proyecto_contrato', 'proyecto_id', id)
  await borrar('parametro_proyecto', 'proyecto_id', id)
  await borrar('documento_proyecto', 'proyecto_id', id)
  await borrar('proyecto', 'id', id)
  invalidarCacheProyectos()
  return true
}

export async function obtenerPendientesPorProyecto(proyectoId: string) {
  const { data, error } = await clienteSupabase
    .from('bitacora_pendiente')
    .select(`
      id,
      proyecto_id,
      renglon_id,
      bitacora_entrada_id,
      fecha_medicion,
      estacion_inicial,
      estacion_final,
      longitud_medida,
      ancho,
      altura_espesor,
      volumen_area_bruto,
      descuento_aplicado_id,
      cantidad_neta_cobrar,
      estado_conciliacion,
      observaciones,
      ubicacion_especifica,
      lado_via,
      estimacion_origen,
      anulado_en,
      anulado_por,
      motivo_anulacion,
      renglon:renglon_id(
        id,
        codigo,
        descripcion,
        cantidad_contractual,
        cantidad_ajustada,
        cantidad_ejecutada,
        precio_unitario_directo,
        unidad_id,
        especificacion:especificacion_id(codigo, descripcion, unidad),
        unidad:unidad_id(abreviatura, nombre)
      ),
      descuento:descuento_aplicado_id(id, descripcion, factor_seccion_transversal),
      bitacora_entrada:bitacora_entrada_id(
        id,
        titulo,
        descripcion,
        comentarios,
        evidencia_fotografica(id, url_storage, descripcion)
      )
    `)
    .eq('proyecto_id', proyectoId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error al obtener bitacora_pendiente:', error)
    return []
  }

  return (data || []).map((row: any) => {
    const renglon = row.renglon || {}
    const espObj = renglon.especificacion || {}
    const unidadObj = renglon.unidad || {}
    const descObj = row.descuento || {}
    const bitacora = row.bitacora_entrada || {}
    const evidencias = Array.isArray(bitacora.evidencia_fotografica) ? bitacora.evidencia_fotografica : []

    const matchDesc = renglon.descripcion ? renglon.descripcion.match(/\(([0-9]+(?:\.[0-9]+)?(?:\([a-z]\))?|[0-9]+\.[0-9]+[a-z]?)\)/i) : null
    const codParsed = matchDesc ? matchDesc[1] : null
    const codigoDGC = codParsed || espObj.codigo || renglon.codigo || row.codigoDGC || '101.01'
    const descripcion = renglon.descripcion || espObj.descripcion || 'Trabajo pendiente en campo'
    const unidadSimbolo = unidadObj.abreviatura || espObj.unidad || unidadObj.nombre || 'm³'
    const factorDescuento = descObj.factor_seccion_transversal || 0
    const descuentoNombre = descObj.descripcion || ''

    return {
      id: row.id,
      proyectoId: row.proyecto_id,
      renglonId: row.renglon_id,
      bitacoraEntradaId: row.bitacora_entrada_id,
      codigoDGC,
      descripcion,
      unidad: unidadSimbolo,
      estacionInicio: row.estacion_inicial != null ? `Km ${row.estacion_inicial}` : '',
      estacionFin: row.estacion_final != null ? `Km ${row.estacion_final}` : '',
      estacionInicialNum: row.estacion_inicial ?? 0,
      estacionFinalNum: row.estacion_final ?? 0,
      longitudL: Number(row.longitud_medida) || 0,
      anchoA: Number(row.ancho) || 0,
      alturaH: Number(row.altura_espesor) || 0,
      cantidadBruta: Number(row.volumen_area_bruto) || 0,
      volumenAreaBruto: Number(row.volumen_area_bruto) || 0,
      descuentoMonto: Number(row.longitud_medida * factorDescuento) || 0,
      factorDescuento,
      descuentoNombre,
      descuentoAplicadoId: row.descuento_aplicado_id || null,
      cantidadNetaCobrar: Number(row.cantidad_neta_cobrar) || 0,
      estado: row.estado_conciliacion || 'Pendiente',
      observaciones: row.observaciones || '',
      ubicacionEspecifica: row.ubicacion_especifica || '',
      ladoVia: row.lado_via || '',
      estimacionOrigen: row.estimacion_origen || null,
      anuladoEn: row.anulado_en || null,
      anuladoPor: row.anulado_por || null,
      motivoAnulacion: row.motivo_anulacion || null,
      esAnulado: !!row.anulado_en,
      fechaMedicion: row.fecha_medicion || '',
      mesesAntiguedad: row.fecha_medicion ? Math.floor((new Date().getTime() - new Date(row.fecha_medicion).getTime()) / (1000 * 60 * 60 * 24 * 30)) : 0,
      // Metadatos adicionales para el modal
      cantidadAjustada: Number(renglon.cantidad_ajustada ?? renglon.cantidad_contractual) || 0,
      cantidadContractual: Number(renglon.cantidad_contractual) || 0,
      cantidadEjecutada: Number(renglon.cantidad_ejecutada) || 0,
      precioUnitario: Number(renglon.precio_unitario_directo) || 0,
      bitacoraTitulo: bitacora.titulo || '',
      bitacoraDescripcion: bitacora.descripcion || '',
      bitacoraObservaciones: bitacora.comentarios || '',
      fotoEvidenciaUrl: evidencias[0]?.url_storage || evidencias[0]?.url_archivo || null,
      fotoEvidencias: evidencias
    }
  })
}

export interface ProcesarPendienteParams {
  pendienteId: string
  proyectoId: string
  usuarioId: string
  accion: 'confirmar' | 'pendiente' | 'anular'
  motivo?: string
  ancho?: number
  alturaEspesor?: number
  ladoVia?: string
  multiplicador?: number
  descuentoAplicadoId?: string | null
  descuentoMonto?: number
  observaciones?: string
  estimacionNum?: number
}

export async function procesarPendienteProyecto(params: ProcesarPendienteParams) {
  const {
    pendienteId,
    proyectoId: _proyectoId,
    usuarioId,
    accion,
    motivo,
    ancho,
    alturaEspesor,
    ladoVia,
    multiplicador,
    descuentoAplicadoId,
    descuentoMonto,
    observaciones,
    estimacionNum,
  } = params

  if (!pendienteId) {
    throw new ValidationError('ID de pendiente no proporcionado', 'pendienteId')
  }

  // 1. Obtener fila actual de bitacora_pendiente
  const { data: pend, error: errFetch } = await clienteSupabase
    .from('bitacora_pendiente')
    .select(`
      *,
      renglon:renglon_id(
        id,
        codigo,
        descripcion,
        cantidad_ajustada,
        unidad_id,
        especificacion:especificacion_id(codigo, descripcion, unidad),
        unidad:unidad_medida(abreviatura, nombre)
      )
    `)
    .eq('id', pendienteId)
    .single()

  if (errFetch || !pend) {
    throw new ValidationError('Fila de pendiente no encontrada', 'pendienteId')
  }

  // 2. Validar que la fila no esté previamente anulada
  if (pend.anulado_en) {
    throw new ValidationError(
      'No se puede editar ni procesar una fila de pendiente que ya ha sido anulada.',
      'anulado'
    )
  }

  // 3. Acción ANULAR
  if (accion === 'anular') {
    if (!motivo || !motivo.trim()) {
      throw new ValidationError('El motivo de anulación es obligatorio.', 'motivo')
    }

    const updates: Record<string, any> = {
      anulado_en: new Date().toISOString(),
      anulado_por: usuarioId || null,
      motivo_anulacion: motivo.trim()
    }

    const { error: errUpdate } = await clienteSupabase
      .from('bitacora_pendiente')
      .update(updates)
      .eq('id', pendienteId)

    if (errUpdate) {
      throw new Error(`Error al anular pendiente: ${errUpdate.message}`)
    }

    return {
      ok: true,
      accion: 'anular',
      id: pendienteId,
      estado: pend.estado_conciliacion,
      anuladoEn: updates.anulado_en,
      motivoAnulacion: updates.motivo_anulacion
    }
  }

  // 4. Acciones CONFIRMAR o PENDIENTE (Dejar en pendiente)
  const renglon = Array.isArray(pend.renglon) ? (pend.renglon[0] || {}) : (pend.renglon || {})
  const esp = Array.isArray(renglon.especificacion) ? (renglon.especificacion[0] || {}) : (renglon.especificacion || {})
  const unidadObj = Array.isArray(renglon.unidad) ? (renglon.unidad[0] || {}) : (renglon.unidad || {})
  let unidadStr = esp.unidad || unidadObj.abreviatura || unidadObj.nombre

  if (!unidadStr && renglon.unidad_id) {
    const { data: um } = await clienteSupabase
      .from('unidad_medida')
      .select('abreviatura, nombre')
      .eq('id', renglon.unidad_id)
      .maybeSingle()
    if (um) {
      unidadStr = um.abreviatura || um.nombre
    }
  }

  if (!unidadStr) {
    unidadStr = 'm³'
  }

  const longitudCalculada = calcularLongitudEstaciones(pend.estacion_inicial, pend.estacion_final)
  const longitudUsar = longitudCalculada > 0 ? longitudCalculada : (Number(pend.longitud_medida) || 0)
  const anchoUsar = ancho !== undefined ? Number(ancho) : (pend.ancho != null ? Number(pend.ancho) : undefined)
  const alturaUsar = alturaEspesor !== undefined ? Number(alturaEspesor) : (pend.altura_espesor != null ? Number(pend.altura_espesor) : undefined)
  const multUsar = multiplicador !== undefined ? Number(multiplicador) : 1

  let factorDescuento = 0
  if (descuentoAplicadoId) {
    const { data: catDesc } = await clienteSupabase
      .from('catalogo_descuento_tecnico')
      .select('factor_seccion_transversal')
      .eq('id', descuentoAplicadoId)
      .maybeSingle()
    if (catDesc) {
      factorDescuento = Number(catDesc.factor_seccion_transversal) || 0
    }
  }

  const resCalc = calcularCantidadMedicion({
    unidad: unidadStr,
    longitudL: longitudUsar > 0 ? longitudUsar : undefined,
    anchoA: anchoUsar,
    alturaH: alturaUsar,
    multiplicador: multUsar,
    descuento: factorDescuento > 0 ? factorDescuento : (descuentoMonto !== undefined ? Number(descuentoMonto) : undefined),
    tipoDescuento: factorDescuento > 0 ? 'factor' : 'monto'
  })

function normalizarLadoVia(lado?: string): string {
  if (!lado) return 'Sección Completa'
  const l = lado.trim()
  if (l.toLowerCase() === 'ambos') return 'Sección Completa'
  const permitidos = ['Derecho', 'Izquierdo', 'Centro', 'Sección Completa', 'Ambos Lados', 'N/A']
  const match = permitidos.find(p => p.toLowerCase() === l.toLowerCase())
  return match || 'Sección Completa'
}

  const updates: Record<string, any> = {
    longitud_medida: longitudUsar,
    ancho: anchoUsar !== undefined ? anchoUsar : pend.ancho,
    altura_espesor: !obtenerDimensionesRequeridas(unidadStr).requiereAltura ? null : (alturaUsar !== undefined ? alturaUsar : pend.altura_espesor),
    lado_via: normalizarLadoVia(ladoVia || pend.lado_via),
    descuento_aplicado_id: descuentoAplicadoId !== undefined ? descuentoAplicadoId : pend.descuento_aplicado_id,
    cantidad_neta_cobrar: resCalc.cantidadNeta,
    observaciones: observaciones !== undefined ? observaciones : pend.observaciones,
  }

  if (accion === 'confirmar') {
    updates.estado_conciliacion = 'Aprobado'
    updates.estimacion_origen = estimacionNum || pend.estimacion_origen || 1
  } else {
    updates.estado_conciliacion = 'Pendiente'
  }

  const { error: errUpd } = await clienteSupabase
    .from('bitacora_pendiente')
    .update(updates)
    .eq('id', pendienteId)

  if (errUpd) {
    throw new Error(`Error al actualizar bitacora_pendiente: ${errUpd.message}`)
  }

  return {
    ok: true,
    accion,
    id: pendienteId,
    estado: updates.estado_conciliacion,
    cantidadNetaCobrar: updates.cantidad_neta_cobrar,
    estimacionOrigen: updates.estimacion_origen
  }
}

/**
 * SERVICIO 1 (Backend Producción): Registrar medición con control de tope.
 * Aplica el tope de la regla de negocio (topes.ts) y deriva excesos a bitacora_pendiente.
 */
export async function registrarMedicionBackend(params: {
  proyectoId: string;
  renglonId: string;
  medicionPeriodo: number;
  estimacionOrigen?: number;
  observaciones?: string;
}) {
  const { data: renglon, error: errR } = await clienteSupabase
    .from('renglon_trabajo')
    .select('*')
    .eq('id', params.renglonId)
    .single();

  if (errR || !renglon) throw new Error(`Renglón no encontrado: ${errR?.message || params.renglonId}`);

  // Consultar el acumulado cobrado anterior desde bitacora_avance si existe
  const { data: avances } = await clienteSupabase
    .from('bitacora_avance')
    .select('cantidad_neta_cobrar')
    .eq('renglon_id', params.renglonId);

  const acumuladoAnterior = (avances || []).reduce((sum, row) => sum + (Number(row.cantidad_neta_cobrar) || 0), 0);

  // Invocar función pura de topes compartida
  const resTopes = procesarMedicionRenglon({
    cantidadAjustada: Number(renglon.cantidad_ajustada) || 0,
    acumuladoAnterior,
    medicionPeriodo: params.medicionPeriodo,
    precioUnitario: Number(renglon.precio_unitario_directo) || 0,
  });

  let idFilaPendiente: string | null = null;

  // Si existe sobreejecución / exceso, guardar en bitacora_pendiente
  if (resTopes.retenidoPendiente > 0) {
    const { data: insertedPend, error: errPend } = await clienteSupabase
      .from('bitacora_pendiente')
      .insert({
        proyecto_id: params.proyectoId,
        renglon_id: params.renglonId,
        longitud_medida: resTopes.retenidoPendiente,
        ancho: 1,
        altura_espesor: 1,
        estado_conciliacion: 'Pendiente',
        estimacion_origen: params.estimacionOrigen || 1,
        observaciones: params.observaciones || 'Sobreejecución derivado a retención',
        fecha_medicion: new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (errPend) throw new Error(`Error insertando pendiente: ${errPend.message}`);
    idFilaPendiente = insertedPend.id;
  }

  return {
    ...resTopes,
    idFilaPendiente,
  };
}

/**
 * SERVICIO 2 (Backend Producción): Aprobar Modificativo / Adenda.
 * Incrementa cantidad_ajustada y libera las filas de bitacora_pendiente cambiando su estado a 'Aprobado'
 * e insertando las correspondientes filas en bitacora_pendiente_ajuste.
 */
export async function aprobarModificativoBackend(params: {
  renglonId: string;
  cantidadDelta: number;
  motivo: string;
  documentoReferencia: string;
}) {
  const { data: renglon, error: errR } = await clienteSupabase
    .from('renglon_trabajo')
    .select('id, cantidad_ajustada')
    .eq('id', params.renglonId)
    .single();

  if (errR || !renglon) throw new Error(`Renglón no encontrado: ${errR?.message || params.renglonId}`);

  const nuevaCantidadAjustada = (Number(renglon.cantidad_ajustada) || 0) + params.cantidadDelta;

  // Actualizar cantidad ajustada en renglon_trabajo
  const { error: errUpdR } = await clienteSupabase
    .from('renglon_trabajo')
    .update({ cantidad_ajustada: nuevaCantidadAjustada })
    .eq('id', params.renglonId);

  if (errUpdR) throw new Error(`Error actualizando renglón: ${errUpdR.message}`);

  // Registrar justificante en modificativo_renglon
  const { data: mod, error: errMod } = await clienteSupabase
    .from('modificativo_renglon')
    .insert({
      renglon_id: params.renglonId,
      cantidad_delta: params.cantidadDelta,
      motivo: params.motivo,
      documento_referencia: params.documentoReferencia,
    })
    .select()
    .single();

  if (errMod) throw new Error(`Error creando modificativo: ${errMod.message}`);

  // Buscar renglones pendientes retenidos para liberar
  const { data: pendientes } = await clienteSupabase
    .from('bitacora_pendiente')
    .select('id, cantidad_neta_cobrar')
    .eq('renglon_id', params.renglonId)
    .eq('estado_conciliacion', 'Pendiente');

  const liberados: string[] = [];
  if (pendientes && pendientes.length > 0) {
    for (const pend of pendientes) {
      // Registrar liberación en bitacora_pendiente_ajuste
      const { error: errAj } = await clienteSupabase
        .from('bitacora_pendiente_ajuste')
        .insert({
          bitacora_pendiente_id: pend.id,
          valor_descuento: Number(pend.cantidad_neta_cobrar) || 0,
          descripcion: `Liberación automática por Modificativo / Adenda ID ${mod.id}`,
        });

      if (errAj) throw new Error(`Error al registrar ajuste de liberación: ${errAj.message}`);

      // Cambiar estado a Aprobado (Estado distinto de 'Pendiente')
      const { error: errUpdPend } = await clienteSupabase
        .from('bitacora_pendiente')
        .update({ estado_conciliacion: 'Aprobado' })
        .eq('id', pend.id);

      if (errUpdPend) throw new Error(`Error actualizando estado de pendiente: ${errUpdPend.message}`);

      liberados.push(pend.id);
    }
  }

  return {
    ok: true,
    modificativoId: mod.id,
    nuevaCantidadAjustada,
    filasLiberadas: liberados,
  };
}

/**
 * SERVICIO 3 (Backend Producción): Registrar estimación y control de anticipo.
 * Utiliza liquidacion.ts para calcular la amortización sin permitir saldos negativos y guarda en control_anticipo.
 */
export async function registrarEstimacionBackend(params: {
  proyectoId: string;
  numeroEstimacion: number;
  montoDirectoPeriodo: number;
  porcentajeAmortizacionAnticipo: number;
  anticipoRecibidoTotal: number;
  anticipoAmortizadoAnterior: number;
}) {
  // Invocar liquidación financiera pura
  const resLiq = calcularLiquidacionEstimacion({
    montoDirectoPeriodo: params.montoDirectoPeriodo,
    porcentajeIndirectos: 0,
    porcentajeIva: 0,
    montoRenglonGlobal: 0,
    excluirIndirectosIvaGlobal: true,
    porcentajeAmortizacionAnticipo: params.porcentajeAmortizacionAnticipo,
    anticipoRecibidoTotal: params.anticipoRecibidoTotal,
    anticipoAmortizadoAnterior: params.anticipoAmortizadoAnterior,
  });

  // Guardar en control_anticipo
  const { data: rowControl, error: errC } = await clienteSupabase
    .from('control_anticipo')
    .insert({
      proyecto_id: params.proyectoId,
      numero_estimacion: params.numeroEstimacion,
      monto_anticipo_total: params.anticipoRecibidoTotal,
      valor_estimacion_periodo: params.montoDirectoPeriodo,
      saldo_por_amortizar: resLiq.saldoAnticipoRemanente,
    })
    .select()
    .single();

  if (errC) throw new Error(`Error en control_anticipo: ${errC.message}`);

  return {
    controlAnticipoId: rowControl.id,
    liquidacion: resLiq,
  };
}
