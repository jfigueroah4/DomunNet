import { clienteSupabase } from '@/configuracion/cliente-supabase'

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
  const { data, error } = await clienteSupabase
    .from('catalogo_item')
    .select('id, catalogo!inner(codigo)')
    .eq('catalogo.codigo', 'estado_proyecto')
    .eq('codigo', codigo)
    .single()

  if (error || !data) {
    // AJUSTE: Lanza un ValidationError claro que el controlador atrapará como HTTP 400
    throw new ValidationError(`Estado '${codigo}' no es válido o no existe en el catálogo.`, 'estado_codigo')
  }
  
  return data.id
}

export function esUuidValido(val: any): string | null {
  if (typeof val !== 'string' || !val) return null
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(val.trim()) ? val.trim() : null
}

export async function actualizarEstadoProyecto(proyectoId: string, nuevoEstadoCodigo: string) {
  // 1. Validaciones de Negocio si el nuevo estado es 'activo'
  if (nuevoEstadoCodigo === 'activo') {
    const { data: proyecto, error: errorProy } = await clienteSupabase
      .from('proyecto')
      .select(`
        id, 
        proyecto_detalle (
          monto_original,
          empresa_contratista_id,
          empresa_contratista_ejecutora,
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
      (detalle.empresa_contratista_id && String(detalle.empresa_contratista_id).trim() !== '') ||
      (detalle.empresa_contratista_ejecutora && String(detalle.empresa_contratista_ejecutora).trim() !== '')
    )

    if (!tieneContratista) {
      throw new ValidationError('No se puede activar: Debe asignar una Empresa Contratista Ejecutora.', 'empresa_contratista_ejecutora')
    }

    if (!detalle.fecha_inicio_contractual || !detalle.fecha_adjudicacion) {
      throw new ValidationError('No se puede activar: Las fechas de Adjudicación e Inicio Contractual son obligatorias.', 'fechas_contractuales')
    }
  }

  // 2. Obtener UUID del nuevo estado
  const nuevoEstadoId = await obtenerEstadoIdPorCodigo(nuevoEstadoCodigo)

  // 3. Actualizar estado
  const { error: errorUpdate } = await clienteSupabase
    .from('proyecto')
    .update({ estado_id: nuevoEstadoId })
    .eq('id', proyectoId)

  if (errorUpdate) {
    throw new Error('Error de BD al actualizar el estado del proyecto')
  }

  return true
}

async function resolverEmpresaContratanteId(val: any): Promise<string | null> {
  if (!val || typeof val !== 'string') return null
  const uuid = esUuidValido(val)
  if (uuid) return uuid

  const { data: ent } = await clienteSupabase
    .from('entidad_contratante')
    .select('id')
    .eq('nombre', val.trim())
    .maybeSingle()
  if (ent?.id) return ent.id

  const { data: entRel } = await clienteSupabase
    .from('empresa_relacionada')
    .select('id')
    .eq('nombre', val.trim())
    .maybeSingle()
  if (entRel?.id) return entRel.id

  return null
}

async function resolverEmpresaContratistaId(val: any): Promise<string | null> {
  if (!val || typeof val !== 'string') return null
  const uuid = esUuidValido(val)
  if (uuid) return uuid

  const { data: emp } = await clienteSupabase
    .from('empresa_contratista')
    .select('id')
    .or(`nombre.eq.${val.trim()},razon_social.eq.${val.trim()}`)
    .maybeSingle()
  if (emp?.id) return emp.id

  const { data: empRel } = await clienteSupabase
    .from('empresa_relacionada')
    .select('id')
    .eq('nombre', val.trim())
    .maybeSingle()
  if (empRel?.id) return empRel.id

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
      empresaContratista: empresaContratistaNombre,
      empresaSupervisora: detalle.empresa_supervisora ?? '',
      delegadoResidenteId: detalle.delegado_residente_id ?? null,
      delegadoResidente: delegadoResidenteNombre,
      responsable: delegadoResidenteNombre || 'No asignado',
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

export async function obtenerProyectos() {
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
    clienteSupabase
      .from('catalogo_item')
      .select('id, codigo, catalogo!inner(codigo)')
      .eq('catalogo.codigo', 'estado_proyecto'),
  ])

  if (proyectosRes.error) {
    console.error('Error obteniendo lista de proyectos:', proyectosRes.error)
    return []
  }

  const estadoMapa = new Map<string, string>()
  if (estadoItemsRes.data) {
    for (const item of estadoItemsRes.data) {
      estadoMapa.set(item.id, item.codigo.toLowerCase())
    }
  }

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

  return (proyectosRes.data || []).map((p: any) => {
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
}

export async function crearProyecto(datosFormulario: any) {
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
      nombre: datosFormulario.nombreOficial,
      descripcion: datosFormulario.descripcion,
      ubicacion: datosFormulario.ubicacionFisica,
      fecha_inicio: fechaInicio,
      fecha_fin_estimada: fechaFinEstimada,
      responsable_id: datosFormulario.responsable || null,
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
  const empContratanteId = await resolverEmpresaContratanteId(datosFormulario.empresaContratanteId || datosFormulario.entidadContratante)
  const empContratistaId = await resolverEmpresaContratistaId(datosFormulario.empresaContratistaId || datosFormulario.empresaContratista)
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
      if (miembro.id && miembro.id !== datosFormulario.delegadoResidenteId) {
        usuariosAInsertar.push({
          proyecto_id: proyecto.id,
          usuario_id: miembro.id,
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

  return proyecto.id
}

export async function actualizarProyecto(proyectoId: string, datosFormulario: Record<string, unknown>) {
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
  if ('responsable' in datosFormulario) proyectoUpdates.responsable_id = datosFormulario.responsable
  if ('estado' in datosFormulario && datosFormulario.estado) {
    const estadoId = await obtenerEstadoIdPorCodigo(datosFormulario.estado as string)
    if (estadoId) proyectoUpdates.estado_id = estadoId
  }
  if ('fechaFinalizacionReal' in datosFormulario) {
    detalleUpdates.fecha_finalizacion_real = datosFormulario.fechaFinalizacionReal || null
  }
  if ('plazoEjecucionRealAmpliado' in datosFormulario) {
    const p = parseInt(datosFormulario.plazoEjecucionRealAmpliado as string, 10)
    detalleUpdates.plazo_ejecucion_ampliado = isNaN(p) ? null : p
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
      .filter((miembro) => miembro && (miembro.id || miembro.usuarioId))
      .map((miembro) => ({
        proyecto_id: proyectoId,
        usuario_id: miembro.id || miembro.usuarioId,
        rol_proyecto: miembro.rol || 'Miembro'
      }))
    if (usuariosAInsertar.length > 0) {
      const { error: errEq } = await clienteSupabase.from('proyecto_usuario').insert(usuariosAInsertar)
      if (errEq) console.error('Error actualizando equipo proyecto_usuario:', errEq)
    }
  }

  return { id: proyectoId }
}

export async function eliminarProyecto(id: string) {
  await clienteSupabase.from('proyecto_detalle').delete().eq('proyecto_id', id)
  await clienteSupabase.from('proyecto_usuario').delete().eq('proyecto_id', id)
  const { error } = await clienteSupabase.from('proyecto').delete().eq('id', id)
  if (error) throw new Error(error.message)
  return true
}

export async function obtenerPendientesPorProyecto(proyectoId: string) {
  const { data, error } = await clienteSupabase
    .from('bitacora_pendiente')
    .select(`
      id,
      proyecto_id,
      renglon_id,
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
      renglon:renglon_id(
        id,
        descripcion,
        unidad_id,
        unidad:unidad_id(abreviatura, nombre)
      ),
      descuento:descuento_aplicado_id(id, descripcion, factor_seccion_transversal)
    `)
    .eq('proyecto_id', proyectoId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error al obtener bitacora_pendiente:', error)
    return []
  }

  return (data || []).map((row: any) => {
    const renglon = row.renglon || {}
    const unidadObj = renglon.unidad || {}
    const descObj = row.descuento || {}

    const codigoDGC = '201.03(b)'
    const descripcion = renglon.descripcion || 'Trabajo pendiente en campo'
    const unidadSimbolo = unidadObj.abreviatura || unidadObj.nombre || 'm³'
    const factorDescuento = descObj.factor_seccion_transversal || 0
    const descuentoNombre = descObj.descripcion || ''

    return {
      id: row.id,
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
      cantidadNetaCobrar: Number(row.cantidad_neta_cobrar) || 0,
      estado: row.estado_conciliacion || 'Pendiente',
      observaciones: row.observaciones || '',
      ubicacionEspecifica: row.ubicacion_especifica || '',
      ladoVia: row.lado_via || '',
      fechaMedicion: row.fecha_medicion || '',
      mesesAntiguedad: row.fecha_medicion ? Math.floor((new Date().getTime() - new Date(row.fecha_medicion).getTime()) / (1000 * 60 * 60 * 24 * 30)) : 0
    }
  })
}


