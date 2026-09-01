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
      empresa_contratante_id: datosFormulario.empresaContratanteId || null,
      empresa_contratista_id: datosFormulario.empresaContratista || null,
      empresa_supervisora: datosFormulario.empresaSupervisora || null,
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


