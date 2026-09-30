import { clienteSupabase } from '../../configuracion/cliente-supabase'
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

/**
 * Función genérica y reutilizable (usando JOIN seguro) para encontrar el UUID 
 * de un estado basado en su código de catálogo portable (en minúsculas).
 */
export async function obtenerEstadoIdPorCodigo(codigo: string): Promise<string> {
  if (!codigo) {
    throw new ValidationError('Código de estado no proporcionado.', 'estado_codigo')
  }
  const codigoNorm = codigo.toLowerCase().trim()

  const { data: exact } = await clienteSupabase
    .from('catalogo_item')
    .select('id, codigo, catalogo!inner(codigo)')
    .eq('catalogo.codigo', 'estado_proyecto')
    .eq('codigo', codigoNorm)
    .maybeSingle()

  if (exact?.id) return exact.id

  const aliasMap: Record<string, string[]> = {
    'borrador': ['borrador', 'draft', 'planificacion', 'modificacion', 'modificativo', 'en_modificacion', 'modificación'],
    'activo': ['activo', 'active', 'en_ejecucion'],
    'en_revision': ['en_revision', 'revision', 'en_revisión'],
    'completado': ['completado', 'finalizado', 'terminado', 'concluido'],
    'pausado': ['pausado', 'pausa', 'suspendido', 'en_suspension', 'suspension', 'en_suspensión', 'cancelado', 'anulado'],
    'suspendido': ['suspendido', 'en_suspension', 'suspension', 'en_suspensión', 'pausado']
  }

  const posibles = aliasMap[codigoNorm] || [codigoNorm]

  const { data: items } = await clienteSupabase
    .from('catalogo_item')
    .select('id, codigo, catalogo!inner(codigo)')
    .eq('catalogo.codigo', 'estado_proyecto')

  if (items && items.length > 0) {
    const match = items.find((it: any) =>
      posibles.includes(it.codigo.toLowerCase()) ||
      it.codigo.toLowerCase().includes(codigoNorm) ||
      codigoNorm.includes(it.codigo.toLowerCase())
    )
    if (match?.id) return match.id
    return items[0].id
  }

  throw new ValidationError(`Estado '${codigo}' no existe en el catálogo.`, 'estado_codigo')
}

export function esUuidValido(val: any): string | null {
  if (typeof val !== 'string' || !val) return null
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(val.trim()) ? val.trim() : null
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

  if (enReplanificacion) {
    throw new ValidationError('El proyecto se encuentra en ciclo de modificación de plazo / replanificación. Operación no permitida.', 'en_replanificacion')
  }

  if (tipoOperacion === 'bitacora') {
    if (estadoCodigo !== 'activo') {
      throw new ValidationError(`No se pueden registrar avances de Bitácora cuando el proyecto está en estado '${estadoCodigo}'.`, 'estado')
    }
  } else if (tipoOperacion === 'analitico') {
    if (['pausado', 'inactivo', 'completado', 'en_revision', 'borrador'].includes(estadoCodigo)) {
      throw new ValidationError(`Operación no permitida en Analítico para el estado '${estadoCodigo}'.`, 'estado')
    }
  } else if (tipoOperacion === 'fechas') {
    if (['pausado', 'inactivo', 'completado', 'en_revision'].includes(estadoCodigo) || enReplanificacion) {
      throw new ValidationError('No se pueden editar las fechas del proyecto mientras esté pausado, inactivo, completado, en revisión o en replanificación.', 'fechas')
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

async function resolverEmpresaContratistaId(val: any): Promise<string | null> {
  if (!val || typeof val !== 'string') return null
  const uuid = esUuidValido(val)
  if (uuid) return uuid

  const { data: emp } = await clienteSupabase
    .from('empresa_contratista')
    .select('id')
    .or(`nombre.ilike.${val.trim()},razon_social.ilike.${val.trim()}`)
    .maybeSingle()
  if (emp?.id) return emp.id

  const { data: empRel } = await clienteSupabase
    .from('empresa_relacionada')
    .select('id')
    .ilike('nombre', val.trim())
    .maybeSingle()
  if (empRel?.id) return empRel.id

  const { data: nuevaEmp } = await clienteSupabase
    .from('empresa_contratista')
    .insert({ nombre: val.trim(), razon_social: val.trim() })
    .select('id')
    .maybeSingle()
  if (nuevaEmp?.id) return nuevaEmp.id

  return null
}

export async function obtenerProyectoPorId(proyectoId: string) {
  const { data: proyecto, error: proyectoError } = await clienteSupabase
    .from('proyecto')
    .select('id, codigo, nombre, descripcion, ubicacion, responsable_id, fecha_inicio, fecha_fin_estimada, estado_id')
    .eq('id', proyectoId)
    .single()

  if (proyectoError || !proyecto) throw new Error('Proyecto no encontrado')

  const { data: detalle, error: detalleError } = await clienteSupabase
    .from('proyecto_detalle')
    .select('nombre_oficial, descripcion_proyecto, tramo, direccion, latitud, longitud, municipio_id, departamento_id, municipio_fin_id, departamento_fin_id, direccion_fin, kilometro_inicio, kilometro_fin, empresa_contratante_id, empresa_contratista_id, empresa_supervisora, delegado_residente_id, fecha_adjudicacion, fecha_inicio_contractual, numero_escritura_publica, monto_original, plazo_ejecucion_original, plazo_ejecucion_ampliado, fecha_finalizacion_real, monto_final')
    .eq('proyecto_id', proyectoId)
    .single()

  if (detalleError || !detalle) throw new Error('Detalle del proyecto no encontrado')

  const { data: equipoRows } = await clienteSupabase
    .from('proyecto_usuario')
    .select('usuario_id, rol_proyecto, usuario:usuario_id(id, correo, dato_usuario(primer_nombre, primer_apellido))')
    .eq('proyecto_id', proyectoId)

  const { data: paramRow } = await clienteSupabase
    .from('parametro_proyecto')
    .select('porcentaje_indirectos, porcentaje_iva, porcentaje_amortizacion_anticipo, porcentaje_retencion_garantia, monto_anticipo_total')
    .eq('proyecto_id', proyectoId)
    .maybeSingle()

  const { data: renglonesRows } = await clienteSupabase
    .from('renglon_trabajo')
    .select(`
      id,
      descripcion,
      cantidad_contractual,
      cantidad_ejecutada,
      cantidad_ajustada,
      precio_unitario_directo,
      especificacion:especificacion_id(codigo, descripcion, unidad),
      unidad:unidad_id(abreviatura, nombre)
    `)
    .eq('proyecto_id', proyectoId)

  function extraerCodigoRenglon(desc?: string, codExplicit?: string | null): string | null {
    if (codExplicit) return codExplicit
    if (!desc) return null
    const match = desc.match(/\(([0-9]+(?:\.[0-9]+)?(?:\([a-z]\))?|[0-9]+\.[0-9]+[a-z]?)\)/i)
    return match ? match[1] : null
  }

  const mappedRenglones = (renglonesRows || []).map((r: any) => {
    const esp = r.especificacion || {}
    const uni = r.unidad || {}
    const codParsed = extraerCodigoRenglon(r.descripcion, esp.codigo || r.codigo)
    const cod = codParsed || esp.codigo || r.codigo || r.id
    const desc = r.descripcion || esp.descripcion || 'Renglón de trabajo'
    const unidad = uni.abreviatura || esp.unidad || r.unidad_medida || ''
    return {
      id: cod,
      renglonId: r.id,
      codigo: cod,
      codigoDGC: cod,
      desc,
      descripcion: desc,
      unidad,
      unidad_medida: unidad,
      cantidadContratada: Number(r.cantidad_contractual) || 0,
      cantidadAjustada: Number(r.cantidad_ajustada) || 0,
      costoUnitarioDirecto: Number(r.precio_unitario_directo) || 0,
    }
  })

  const equipo = (equipoRows || []).map((row: any) => {
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

  let entidadContratanteNombre = ''
  if (detalle.empresa_contratante_id) {
    const { data: ent0 } = await clienteSupabase
      .from('entidad_contratante')
      .select('nombre')
      .eq('id', detalle.empresa_contratante_id)
      .maybeSingle()
    if (ent0?.nombre) {
      entidadContratanteNombre = ent0.nombre
    } else {
      const { data: ent } = await clienteSupabase
        .from('empresa_relacionada')
        .select('nombre')
        .eq('id', detalle.empresa_contratante_id)
        .maybeSingle()
      if (ent?.nombre) {
        entidadContratanteNombre = ent.nombre
      } else {
        const { data: ent2 } = await clienteSupabase
          .from('empresa_contratante')
          .select('nombre')
          .eq('id', detalle.empresa_contratante_id)
          .maybeSingle()
        if (ent2?.nombre) entidadContratanteNombre = ent2.nombre
      }
    }
  }

  let empresaContratistaNombre = ''
  if (detalle.empresa_contratista_id) {
    const { data: emp0 } = await clienteSupabase
      .from('empresa_contratista')
      .select('nombre')
      .eq('id', detalle.empresa_contratista_id)
      .maybeSingle()
    if (emp0?.nombre) {
      empresaContratistaNombre = emp0.nombre
    } else {
      const { data: emp } = await clienteSupabase
        .from('empresa_relacionada')
        .select('nombre')
        .eq('id', detalle.empresa_contratista_id)
        .maybeSingle()
      if (emp?.nombre) {
        empresaContratistaNombre = emp.nombre
      }
    }
  }

  let delegadoResidenteNombre = ''
  if (detalle.delegado_residente_id) {
    const { data: del } = await clienteSupabase
      .from('usuario')
      .select('correo, dato_usuario(primer_nombre, primer_apellido)')
      .eq('id', detalle.delegado_residente_id)
      .maybeSingle()
    if (del) {
      const dato = (del as any).dato_usuario
      const full = dato ? `${dato.primer_nombre || ''} ${dato.primer_apellido || ''}`.trim() : ''
      delegadoResidenteNombre = full || del.correo || ''
    }
  }

  let responsableNombre = ''
  if (proyecto.responsable_id) {
    const { data: respU } = await clienteSupabase
      .from('usuario')
      .select('correo, dato_usuario(primer_nombre, primer_apellido)')
      .eq('id', proyecto.responsable_id)
      .maybeSingle()
    if (respU) {
      const dato = (respU as any).dato_usuario
      const full = dato ? `${dato.primer_nombre || ''} ${dato.primer_apellido || ''}`.trim() : ''
      responsableNombre = full || respU.correo || ''
    }
  }

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

  let contratos: any[] = []
  try {
    const { data: cRows } = await clienteSupabase
      .from('proyecto_contrato')
      .select('*')
      .eq('proyecto_id', proyectoId)
    if (cRows && cRows.length > 0) {
      contratos = cRows.map((c: any) => ({
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
    }
  } catch (err) {
    console.error('Error cargando proyecto_contrato:', err)
  }

  const contratoEjecucion = contratos.find((c) => c.tipo === 'EJECUCION') || null
  const contratoSupervision = contratos.find((c) => c.tipo === 'SUPERVISION') || null

  return {
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
    departamentoId: detalle.departamento_id,
    municipioFinId: detalle.municipio_fin_id,
    departamentoFinId: detalle.departamento_fin_id,
    direccionFin: detalle.direccion_fin ?? '',
    kilometroInicio: detalle.kilometro_inicio,
    kilometroFin: detalle.kilometro_fin,
    empresaContratanteId: detalle.empresa_contratante_id ?? null,
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
    estado: await resolverCodigoEstado(proyecto.estado_id),
    parametro_proyecto: paramRow || null,
    parametroProyecto: paramRow || null,
    planTrabajo: mappedRenglones,
    renglones: mappedRenglones,
    contratoEjecucion,
    contratoSupervision,
    contratos,
    paso2: {},
    paso3: {},
  }
}

async function resolverCodigoEstado(estadoId: string | null): Promise<string> {
  if (!estadoId) return 'borrador'
  const { data } = await clienteSupabase
    .from('catalogo_item')
    .select('codigo')
    .eq('id', estadoId)
    .maybeSingle()
  return (data?.codigo || 'borrador').toLowerCase()
}

let cacheProyectosList: { data: any[]; timestamp: number } | null = null
const TTL_CACHE_PROYECTOS_MS = 30 * 1000 // 30s de caché en memoria backend
let cacheEstadoItems: Map<string, string> | null = null
let cacheEstadoItemsTimestamp = 0

export function invalidarCacheProyectos() {
  cacheProyectosList = null
}

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
        proyecto_detalle (
          nombre_oficial,
          descripcion_proyecto,
          tramo,
          direccion,
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
          fecha_finalizacion_real
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
    for (const item of estadoItemsRes.data) {
      cacheEstadoItems.set(item.id, item.codigo.toLowerCase())
    }
    cacheEstadoItemsTimestamp = Date.now()
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

  const resultado = (proyectosRes.data || []).map((p: any) => {
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
    const responsableNombre = delegadoNombre || 'No asignado'

    return {
      id: p.id,
      codigo: p.codigo,
      nombre: p.nombre,
      nombreOficial: d.nombre_oficial || p.nombre,
      descripcion: d.descripcion_proyecto || p.descripcion || '',
      ubicacionFisica: d.tramo || d.direccion || p.ubicacion || '',
      direccion: d.direccion || '',
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
      estado: estadoCod,
      delegadoResidenteId: d.delegado_residente_id || null,
      delegadoResidente: delegadoNombre,
      delegado_residente: delegadoNombre,
      responsable: responsableNombre,
    }
  })

  return resultado
}

export async function crearProyecto(datosFormulario: any) {
  const nombreFinal = (datosFormulario.nombreOficial || datosFormulario.nombre || '').trim()
  if (!nombreFinal) {
    throw new ValidationError('El nombre del proyecto es obligatorio.', 'nombre')
  }

  // 1. Resolver estado ('borrador', 'activo', etc.) desde datosFormulario
  const estadoCodigo = (datosFormulario.estado || 'borrador').toLowerCase()
  const estadoId = await obtenerEstadoIdPorCodigo(estadoCodigo)

  const fechaInicio = datosFormulario.fechaInicioContractual || datosFormulario.fechaInicio || new Date().toISOString().split('T')[0]
  let fechaFinEstimada = datosFormulario.fechaFinContractualPlan || datosFormulario.fechaFin
  if (!fechaFinEstimada) {
    const dt = new Date(fechaInicio)
    if (isNaN(dt.getTime())) {
      fechaFinEstimada = new Date().toISOString().split('T')[0]
    } else {
      dt.setDate(dt.getDate() + 30)
      fechaFinEstimada = dt.toISOString().split('T')[0]
    }
  }

  // 2. Insertar en tabla base `proyecto`
  const { data: proyecto, error: errorProyecto } = await clienteSupabase
    .from('proyecto')
    .insert({
      codigo: datosFormulario.codigo || `PROY-${Math.floor(Math.random()*10000)}`, // Provisional
      nombre: nombreFinal,
      descripcion: datosFormulario.descripcion || null,
      ubicacion: datosFormulario.ubicacionFisica || null,
      fecha_inicio: fechaInicio,
      fecha_fin_estimada: fechaFinEstimada,
      responsable_id: esUuidValido(datosFormulario.responsable) || null,
      estado_id: estadoId,
      empresa_id: datosFormulario.empresa_id || (await clienteSupabase.from('empresa').select('id').limit(1).single()).data?.id
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
  const empContratanteId = esUuidValido(datosFormulario.empresaContratanteId) 
    ? datosFormulario.empresaContratanteId 
    : await resolverEmpresaContratanteId(datosFormulario.entidadContratante || datosFormulario.empresaContratanteId)
  const empContratistaId = esUuidValido(datosFormulario.empresaContratistaId)
    ? datosFormulario.empresaContratistaId
    : await resolverEmpresaContratistaId(datosFormulario.empresaContratista || datosFormulario.empresaContratistaId)
  const delegadoResId = esUuidValido(datosFormulario.delegadoResidenteId)

  // 3. Insertar en `proyecto_detalle`
  const { error: errorDetalle } = await clienteSupabase
    .from('proyecto_detalle')
    .insert({
      proyecto_id: proyecto.id,
      nombre_oficial: datosFormulario.nombreOficial,
      descripcion_proyecto: datosFormulario.descripcion,
      tramo: datosFormulario.ubicacionFisica,
      
      municipio_id: muniId,
      departamento_id: depaId,
      municipio_fin_id: muniFinId,
      departamento_fin_id: depaFinId,
      direccion_fin: datosFormulario.direccionFin || null,
      kilometro_inicio: datosFormulario.kilometroInicio ?? null,
      kilometro_fin: datosFormulario.kilometroFin ?? null,
      latitud: datosFormulario.latitud || null,
      longitud: datosFormulario.longitud || null,
      direccion: datosFormulario.direccion || null,
      monto_final: datosFormulario.montoFinal || null,

      empresa_contratante_id: empContratanteId,
      empresa_contratista_id: empContratistaId,
      empresa_supervisora: datosFormulario.empresaSupervisora || null,
      delegado_residente_id: delegadoResId,
      fecha_adjudicacion: datosFormulario.fechaAdjudicacion || null,
      fecha_inicio_contractual: datosFormulario.fechaInicioContractual || null,
      numero_escritura_publica: datosFormulario.numeroEscrituraPublica || null,
      monto_original: datosFormulario.montoContractualOriginal || null,
      plazo_ejecucion_original: datosFormulario.plazoEjecucionOriginal ? parseInt(datosFormulario.plazoEjecucionOriginal, 10) : null,
      plazo_ejecucion_ampliado: datosFormulario.plazoEjecucionRealAmpliado ? parseInt(datosFormulario.plazoEjecucionRealAmpliado, 10) : null,
      fecha_finalizacion_real: datosFormulario.fechaFinalizacionReal || null
    })

  if (errorDetalle) {
    console.error("SUPABASE ERROR:", errorDetalle);
    await clienteSupabase.from('proyecto').delete().eq('id', proyecto.id)
    throw new Error('Error al insertar detalles del proyecto')
  }

  // 4. Insertar equipo en `proyecto_usuario`
  const usuariosAInsertar: any[] = [];
  
  if (delegadoResId) {
    usuariosAInsertar.push({
      proyecto_id: proyecto.id,
      usuario_id: delegadoResId,
      rol_proyecto: 'Delegado Residente'
    });
  }
  
  if (Array.isArray(datosFormulario.equipo)) {
    for (const miembro of datosFormulario.equipo) {
      const uId = esUuidValido(miembro?.id || miembro?.usuarioId)
      if (uId && uId !== delegadoResId) {
        usuariosAInsertar.push({
          proyecto_id: proyecto.id,
          usuario_id: uId,
          rol_proyecto: miembro.rol || 'Miembro'
        });
      }
    }
  }
  
  if (usuariosAInsertar.length > 0) {
    const { error: errorEq } = await clienteSupabase.from('proyecto_usuario').insert(usuariosAInsertar);
    if (errorEq) console.error('EQUIPO ERROR:', errorEq);
  }

  // 5. Insertar parámetros por defecto en `parametro_proyecto`
  const { error: errorParam } = await clienteSupabase
    .from('parametro_proyecto')
    .insert({
      proyecto_id: proyecto.id,
      porcentaje_indirectos: typeof datosFormulario.porcentajeIndirectos === 'number' ? datosFormulario.porcentajeIndirectos : 0.45,
      porcentaje_iva: typeof datosFormulario.porcentajeIva === 'number' ? datosFormulario.porcentajeIva : 0.12,
      porcentaje_amortizacion_anticipo: typeof datosFormulario.porcentajeAnticipo === 'number' ? datosFormulario.porcentajeAnticipo : 0.20,
      monto_anticipo_total: 0
    });
  if (errorParam) console.error('PARAMETRO_PROYECTO AUTO-INSERT ERROR:', errorParam);

  await guardarContratosProyecto(proyecto.id, datosFormulario);
  invalidarCacheProyectos();

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
  if ('latitud' in datosFormulario) detalleUpdates.latitud = datosFormulario.latitud
  if ('longitud' in datosFormulario) detalleUpdates.longitud = datosFormulario.longitud
  if ('direccion' in datosFormulario) detalleUpdates.direccion = datosFormulario.direccion
  if ('kilometroInicio' in datosFormulario) detalleUpdates.kilometro_inicio = datosFormulario.kilometroInicio
  if ('kilometroFin' in datosFormulario) detalleUpdates.kilometro_fin = datosFormulario.kilometroFin
  if ('empresaContratanteId' in datosFormulario || 'entidadContratante' in datosFormulario) {
    const val = await resolverEmpresaContratanteId(datosFormulario.empresaContratanteId || datosFormulario.entidadContratante)
    if (val) detalleUpdates.empresa_contratante_id = val
  }
  if ('empresaContratista' in datosFormulario || 'empresaContratistaId' in datosFormulario) {
    const val = await resolverEmpresaContratistaId(datosFormulario.empresaContratistaId || datosFormulario.empresaContratista)
    if (val) detalleUpdates.empresa_contratista_id = val
  }
  if ('empresaSupervisora' in datosFormulario) detalleUpdates.empresa_supervisora = datosFormulario.empresaSupervisora
  if ('delegadoResidenteId' in datosFormulario) {
    const val = esUuidValido(datosFormulario.delegadoResidenteId)
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

  await guardarContratosProyecto(proyectoId, datosFormulario)
  invalidarCacheProyectos()

  return { id: proyectoId }
}

async function guardarContratosProyecto(proyectoId: string, datosFormulario: any) {
  try {
    const listaContratos: any[] = []
    if (datosFormulario.contratoEjecucion) {
      listaContratos.push({ ...datosFormulario.contratoEjecucion, tipo: 'EJECUCION' })
    }
    if (datosFormulario.contratoSupervision) {
      listaContratos.push({ ...datosFormulario.contratoSupervision, tipo: 'SUPERVISION' })
    }
    if (Array.isArray(datosFormulario.contratos)) {
      for (const c of datosFormulario.contratos) {
        if (c && c.tipo && !listaContratos.some((x) => x.tipo === c.tipo)) {
          listaContratos.push(c)
        }
      }
    }

    for (const c of listaContratos) {
      const row: any = {
        proyecto_id: proyectoId,
        tipo: c.tipo,
        empresa_nombre: c.empresaNombre || c.empresa_nombre || null,
        propietario: c.propietario || null,
        registro_mercantil: c.registroMercantil || c.registro_mercantil || null,
        direccion: c.direccion || null,
        telefono: c.telefono || null,
        correo: c.correo || null,
        responsable: c.responsable || null,
        licitacion_numero: c.licitacionNumero || c.licitacion_numero || null,
        acta_inicio_numero: c.actaInicioNumero || c.acta_inicio_numero || null,
        programa: c.programa || null,
        subprograma: c.subprograma || null,
        fuente_financiamiento: c.fuenteFinanciamiento || c.fuente_financiamiento || null,
        partida_fondos: c.partidaFondos || c.partida_fondos || null,
        cdp: c.cdp || null,
        contrato_numero: c.contratoNumero || c.contrato_numero || null,
        acuerdo_ministerial: c.acuerdoMinisterial || c.acuerdo_ministerial || null,
        monto_original: Number(c.montoOriginal || c.monto_original) || 0,
        porcentaje_anticipo: Number(c.porcentajeAnticipo || c.porcentaje_anticipo) || 0,
        monto_anticipo: Number(c.montoAnticipo || c.monto_anticipo) || 0,
        fecha_inicio: c.fechaInicio || c.fecha_inicio || null,
        plazo_meses_detalle: c.plazoMesesDetalle || c.plazo_meses_detalle || null,
        fecha_fin: c.fechaFin || c.fecha_fin || null,
        updated_at: new Date().toISOString(),
      }

      const { data: existing } = await clienteSupabase
        .from('proyecto_contrato')
        .select('id')
        .eq('proyecto_id', proyectoId)
        .eq('tipo', c.tipo)
        .maybeSingle()

      if (existing?.id) {
        await clienteSupabase.from('proyecto_contrato').update(row).eq('id', existing.id)
      } else {
        await clienteSupabase.from('proyecto_contrato').insert(row)
      }
    }
  } catch (err) {
    console.error('Error en guardarContratosProyecto:', err)
  }
}

export async function eliminarProyecto(id: string) {
  await clienteSupabase.from('proyecto_detalle').delete().eq('proyecto_id', id)
  await clienteSupabase.from('proyecto_usuario').delete().eq('proyecto_id', id)
  const { error } = await clienteSupabase.from('proyecto').delete().eq('id', id)
  if (error) throw new Error(error.message)
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
        evidencia_fotografica(id, url_archivo, descripcion)
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
      fotoEvidenciaUrl: evidencias[0]?.url_archivo || null,
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



