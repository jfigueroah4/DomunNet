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

export async function actualizarEstadoProyecto(proyectoId: string, nuevoEstadoCodigo: string) {
  // 1. Validaciones de Negocio si el nuevo estado es 'activo'
  if (nuevoEstadoCodigo === 'activo') {
    const { data: proyecto, error: errorProy } = await clienteSupabase
      .from('proyecto')
      .select(`
        id, 
        proyecto_detalle (
          monto_original,
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

    if (!detalle.empresa_contratista_ejecutora || detalle.empresa_contratista_ejecutora.trim() === '') {
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

export async function obtenerProyectoPorId(proyectoId: string) {
  const { data: proyecto, error: proyectoError } = await clienteSupabase
    .from('proyecto')
    .select('id, codigo, nombre, descripcion, ubicacion, responsable_id, fecha_inicio, fecha_fin_estimada, estado_id')
    .eq('id', proyectoId)
    .single()

  if (proyectoError || !proyecto) throw new Error('Proyecto no encontrado')

  const { data: detalle, error: detalleError } = await clienteSupabase
    .from('proyecto_detalle')
    .select('nombre_oficial, descripcion_proyecto, tramo, direccion, latitud, longitud, municipio_id, departamento_id, kilometro_inicio, kilometro_fin, empresa_contratante_id, empresa_contratista_id, empresa_supervisora, delegado_residente_id, fecha_adjudicacion, fecha_inicio_contractual, numero_escritura_publica, monto_original')
    .eq('proyecto_id', proyectoId)
    .single()

  if (detalleError || !detalle) throw new Error('Detalle del proyecto no encontrado')

  const { data: equipoRows } = await clienteSupabase
    .from('proyecto_usuario')
    .select('usuario_id, rol_proyecto, usuario(id, primer_nombre, primer_apellido, correo)')
    .eq('proyecto_id', proyectoId)

  const equipo = (equipoRows || []).map((row: any) => ({
    id: row.usuario_id,
    nombre: row.usuario ? `${row.usuario.primer_nombre || ''} ${row.usuario.primer_apellido || ''}`.trim() || row.usuario.correo : 'Usuario',
    rol: row.rol_proyecto || 'Miembro'
  }))

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
    kilometroInicio: detalle.kilometro_inicio,
    kilometroFin: detalle.kilometro_fin,
    empresaContratanteId: detalle.empresa_contratante_id ?? null,
    empresaContratistaId: detalle.empresa_contratista_id ?? null,
    empresaSupervisora: detalle.empresa_supervisora ?? '',
    delegadoResidenteId: detalle.delegado_residente_id ?? null,
    fechaAdjudicacion: detalle.fecha_adjudicacion ?? '',
    fechaInicioContractual: detalle.fecha_inicio_contractual ?? '',
    numeroEscrituraPublica: detalle.numero_escritura_publica ?? '',
    montoContractualOriginal: detalle.monto_original ?? null,
    equipo,
    estado: 'borrador',
    paso2: {},
    paso3: {},
  }
}

export async function crearProyecto(datosFormulario: any) {
  // 1. Resolver estado 'borrador' por default para nuevos proyectos
  const estadoBorradorId = await obtenerEstadoIdPorCodigo('borrador')

  // 2. Insertar en tabla base `proyecto`
  const { data: proyecto, error: errorProyecto } = await clienteSupabase
    .from('proyecto')
    .insert({
      codigo: datosFormulario.codigo || `PROY-${Math.floor(Math.random()*10000)}`, // Provisional
      nombre: datosFormulario.nombreOficial,
      descripcion: datosFormulario.descripcion,
      // Se replica el mismo texto para conservar la ubicación resumida del proyecto
      // y el tramo técnico de su ficha de detalle sincronizados durante la creación.
      ubicacion: datosFormulario.ubicacionFisica,
      fecha_inicio: datosFormulario.fechaInicioContractual || null,
      fecha_fin_estimada: datosFormulario.fechaFinContractualPlan || datosFormulario.fechaInicioContractual || null,
      responsable_id: datosFormulario.responsable || null,
      estado_id: estadoBorradorId,
      empresa_id: datosFormulario.empresa_id || (await clienteSupabase.from('empresa').select('id').limit(1).single()).data?.id
    })
    .select('id')
    .single()

  if (errorProyecto || !proyecto) {
    console.error('Error insertando proyecto', errorProyecto)
    throw new Error('No se pudo crear el registro base del proyecto')
  }

  // 3. Insertar en `proyecto_detalle`
  const { error: errorDetalle } = await clienteSupabase
    .from('proyecto_detalle')
    .insert({
      proyecto_id: proyecto.id,
      nombre_oficial: datosFormulario.nombreOficial,
      descripcion_proyecto: datosFormulario.descripcion,
      tramo: datosFormulario.ubicacionFisica,
      
      municipio_id: datosFormulario.municipioId || null,
      departamento_id: datosFormulario.departamentoId || null,
      kilometro_inicio: datosFormulario.kilometroInicio ?? null,
      kilometro_fin: datosFormulario.kilometroFin ?? null,
      latitud: datosFormulario.latitud || null,
      longitud: datosFormulario.longitud || null,
      direccion: datosFormulario.direccion || null,
      monto_final: datosFormulario.montoFinal || null,

      empresa_contratante_id: datosFormulario.empresaContratanteId || null,
      empresa_contratista_id: datosFormulario.empresaContratista || null,
      empresa_supervisora: datosFormulario.empresaSupervisora || null,
      delegado_residente_id: datosFormulario.delegadoResidenteId || null,
      fecha_adjudicacion: datosFormulario.fechaAdjudicacion || null,
      fecha_inicio_contractual: datosFormulario.fechaInicioContractual || null,
      numero_escritura_publica: datosFormulario.numeroEscrituraPublica || null,
      monto_original: datosFormulario.montoContractualOriginal || null,
      plazo_ejecucion_original: datosFormulario.plazoEjecucionOriginal ? parseInt(datosFormulario.plazoEjecucionOriginal, 10) : null,
      plazo_ejecucion_ampliado: datosFormulario.plazoEjecucionRealAmpliado ? parseInt(datosFormulario.plazoEjecucionRealAmpliado, 10) : null,
      fecha_finalizacion_real: datosFormulario.fechaFinalizacionReal || null
    })

  if (errorDetalle) { console.error("SUPABASE ERROR:", errorDetalle); console.error("SUPABASE ERROR:", errorDetalle);
    // Manejo de error: idealmente hacer rollback (delete) del proyecto base en un entorno sin transacciones RPC
    await clienteSupabase.from('proyecto').delete().eq('id', proyecto.id)
    throw new Error('Error al insertar detalles del proyecto')
  }

  // 4. Insertar equipo en `proyecto_usuario`
  const usuariosAInsertar: any[] = [];
  
  if (datosFormulario.delegadoResidenteId) {
    usuariosAInsertar.push({
      proyecto_id: proyecto.id,
      usuario_id: datosFormulario.delegadoResidenteId,
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
    // Mantener sincronizados proyecto.ubicacion y proyecto_detalle.tramo.
    proyectoUpdates.ubicacion = datosFormulario.ubicacionFisica
    detalleUpdates.tramo = datosFormulario.ubicacionFisica
  }
  if ('municipioId' in datosFormulario) detalleUpdates.municipio_id = datosFormulario.municipioId
  if ('departamentoId' in datosFormulario) detalleUpdates.departamento_id = datosFormulario.departamentoId
  if ('latitud' in datosFormulario) detalleUpdates.latitud = datosFormulario.latitud
  if ('longitud' in datosFormulario) detalleUpdates.longitud = datosFormulario.longitud
  if ('direccion' in datosFormulario) detalleUpdates.direccion = datosFormulario.direccion
  if ('kilometroInicio' in datosFormulario) detalleUpdates.kilometro_inicio = datosFormulario.kilometroInicio
  if ('kilometroFin' in datosFormulario) detalleUpdates.kilometro_fin = datosFormulario.kilometroFin
  if ('empresaContratanteId' in datosFormulario) detalleUpdates.empresa_contratante_id = datosFormulario.empresaContratanteId
  if ('empresaContratista' in datosFormulario) detalleUpdates.empresa_contratista_id = datosFormulario.empresaContratista
  if ('empresaSupervisora' in datosFormulario) detalleUpdates.empresa_supervisora = datosFormulario.empresaSupervisora
  if ('delegadoResidenteId' in datosFormulario) detalleUpdates.delegado_residente_id = datosFormulario.delegadoResidenteId

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
    const usuariosAInsertar = (datosFormulario.equipo as any[]).map((miembro) => ({
      proyecto_id: proyectoId,
      usuario_id: miembro.id,
      rol_proyecto: miembro.rol || 'Miembro'
    }))
    if (usuariosAInsertar.length > 0) {
      const { error: errEq } = await clienteSupabase.from('proyecto_usuario').insert(usuariosAInsertar)
      if (errEq) console.error('Error actualizando equipo proyecto_usuario:', errEq)
    }
  }

  return { id: proyectoId }
}


