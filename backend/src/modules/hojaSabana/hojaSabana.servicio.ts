import { clienteSupabase } from '../../configuracion/cliente-supabase'
import { validarOperacionProyectoPermitida, ValidationError } from '../proyectos/proyectos.servicio'
import {
  calcularCantidadMedicion,
  calcularLongitudEstaciones,
  parseEstacionAMetros,
  ResultadoCantidadMedicion,
  procesarMedicionRenglon,
  redondearCentavos,
  calcularLiquidacionEstimacion,
} from '../../lib/calculos'

export interface MedicionAnaliticaPayload {
  proyectoId: string
  renglonId?: string
  codigoDGC: string
  estacionInicio: string
  estacionFin: string
  longitudL?: number
  anchoA?: number
  alturaH?: number
  ladoVia?: 'Izquierdo' | 'Derecho' | 'Sección Completa'
  multiplicador?: number
  descuento?: number
  tipoDescuento?: 'monto' | 'factor'
  cantidadDirecta?: number
  origenTipo: 'Plano' | 'Libreta' | 'Otro'
  referenciaOrigen: string
  estimacionNum?: string
  unidad?: string
  cantidadAjustada?: number
  acumuladoAnterior?: number
  precioUnitario?: number
  bitacoraEntradaId?: string
  observaciones?: string
  usuarioId?: string
}

// Almacenamiento en memoria como respaldo cuando la base de datos no tiene la tabla migrada aún
const medicionesAnaliticasMemoriaStore: Map<string, any[]> = new Map()
const estimacionesFinalizadasSet: Set<string> = new Set() // Claves: `${proyectoId}_${estimacionNum}`

export class HojaSabanaServicio {
  static async listarMediciones(proyectoId: string, estimacionNum?: string, codigoDGC?: string) {
    try {
      const query = clienteSupabase
        .from('medicion_analitica')
        .select('*')
        .eq('proyecto_id', proyectoId)

      if (estimacionNum) {
        query.eq('estimacion_num', estimacionNum)
      }
      if (codigoDGC) {
        query.eq('codigo_dgc', codigoDGC)
      }

      const { data, error } = await query

      if (!error && data) {
        return data
      }
    } catch (e) {
      // Fallback a memoria local de respaldo
    }

    const enMemoria = medicionesAnaliticasMemoriaStore.get(proyectoId) || []
    return enMemoria.filter((m) => {
      const matchEst = !estimacionNum || m.estimacionNum === estimacionNum || m.estimacion_num === estimacionNum
      const matchCod = !codigoDGC || m.codigoDGC === codigoDGC || m.codigo_dgc === codigoDGC
      return matchEst && matchCod
    })
  }

  static async crearMedicion(payload: MedicionAnaliticaPayload) {
    const estimacion = payload.estimacionNum || 'Est. 01'
    const keyEst = `${payload.proyectoId}_${estimacion}`

    // Regla DURA 4 & 7: Bloqueo si la estimación está finalizada
    if (estimacionesFinalizadasSet.has(keyEst)) {
      throw new Error(`La estimación ${estimacion} está finalizada/cerrada y no se pueden agregar nuevas mediciones.`)
    }

    if (payload.proyectoId) {
      await validarOperacionProyectoPermitida(payload.proyectoId, 'analitico')
    }

    if (!payload.referenciaOrigen || !payload.referenciaOrigen.trim()) {
      throw new Error('La referencia u origen (folio/plano) es obligatoria.')
    }

    // 1. Longitud L calculada desde estaciones km+m
    const longitudCalculada = calcularLongitudEstaciones(payload.estacionInicio, payload.estacionFin)
    const longitudUsar = payload.longitudL && payload.longitudL > 0 ? payload.longitudL : longitudCalculada

    // 2. Cantidad calculada por la Memoria de Cálculo
    const resMemoria: ResultadoCantidadMedicion = calcularCantidadMedicion({
      unidad: payload.unidad || 'm3',
      longitudL: longitudUsar,
      anchoA: payload.anchoA || 0,
      alturaH: payload.alturaH || 0,
      multiplicador: payload.multiplicador || 1,
      descuento: payload.descuento || 0,
      tipoDescuento: payload.tipoDescuento || 'monto',
      cantidadDirecta: payload.cantidadDirecta,
    })

    // 3. Procesar sobreejecución y topes (procesarMedicionRenglon)
    const cantAjustada = payload.cantidadAjustada || 999999
    const acumuladoAnt = payload.acumuladoAnterior || 0
    const precioUnit = payload.precioUnitario || 1

    const resTopes = procesarMedicionRenglon({
      cantidadAjustada: cantAjustada,
      acumuladoAnterior: acumuladoAnt,
      medicionPeriodo: resMemoria.cantidadNeta || 0,
      precioUnitario: precioUnit,
    })

    const cantidadFacturable = resTopes.facturablePeriodo
    const cantidadRetenida = resTopes.retenidoPendiente

    const registroNuevo = {
      id: `med-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      proyecto_id: payload.proyectoId,
      renglon_id: payload.renglonId || null,
      codigo_dgc: payload.codigoDGC,
      codigoDGC: payload.codigoDGC,
      estacion_inicio: payload.estacionInicio,
      estacionInicio: payload.estacionInicio,
      estacion_fin: payload.estacionFin,
      estacionFin: payload.estacionFin,
      longitud_l: longitudUsar,
      longitudL: longitudUsar,
      ancho_a: payload.anchoA || 0,
      anchoA: payload.anchoA || 0,
      altura_h: payload.alturaH || 0,
      alturaH: payload.alturaH || 0,
      lado_via: payload.ladoVia || 'Sección Completa',
      ladoVia: payload.ladoVia || 'Sección Completa',
      multiplicador: payload.multiplicador || 1,
      descuento: payload.descuento || 0,
      tipo_descuento: payload.tipoDescuento || 'monto',
      cantidad_calculada: resMemoria.cantidadNeta,
      cantidadCalculada: resMemoria.cantidadNeta,
      cantidad_facturable: cantidadFacturable,
      cantidadFacturable: cantidadFacturable,
      cantidad_retenida: cantidadRetenida,
      cantidadRetenida: cantidadRetenida,
      origen_tipo: payload.origenTipo,
      origenTipo: payload.origenTipo,
      referencia_origen: payload.referenciaOrigen,
      referenciaOrigen: payload.referenciaOrigen,
      estimacion_num: estimacion,
      estimacionNum: estimacion,
      estado_linea: 'Confirmada',
      estadoLinea: 'Confirmada',
      bitacora_entrada_id: payload.bitacoraEntradaId || null,
      observaciones: payload.observaciones || '',
      created_at: new Date().toISOString(),
    }

    // Si hubo sobreejecución y retención, crear fila en bitacora_pendiente
    if (cantidadRetenida > 0) {
      try {
        await clienteSupabase.from('bitacora_pendiente').insert({
          proyecto_id: payload.proyectoId,
          renglon_id: payload.renglonId || null,
          registrado_por: payload.usuarioId || null,
          fecha_medicion: new Date().toISOString().slice(0, 10),
          estimacion_origen: parseInt(estimacion.replace(/[^\d]/g, ''), 10) || 1,
          lado_via: payload.ladoVia || 'Sección Completa',
          ubicacion_especifica: `${payload.estacionInicio} al ${payload.estacionFin}`,
          estacion_inicial: parseEstacionAMetros(payload.estacionInicio),
          estacion_final: parseEstacionAMetros(payload.estacionFin),
          longitud_medida: longitudUsar,
          ancho: payload.anchoA || 0,
          altura_espesor: payload.alturaH || 0,
          cantidad_neta_cobrar: cantidadRetenida,
          estado_conciliacion: 'Pendiente',
          observaciones: `Exceso de volumen retenido por tope contractual E. (${payload.codigoDGC})`,
        })
      } catch (errEx) {
        // Loguear sin romper
      }
    }

    // Intentar BD Supabase
    try {
      const { data, error } = await clienteSupabase
        .from('medicion_analitica')
        .insert({
          proyecto_id: payload.proyectoId,
          renglon_id: payload.renglonId || null,
          codigo_dgc: payload.codigoDGC,
          estacion_inicio: payload.estacionInicio,
          estacion_fin: payload.estacionFin,
          longitud_l: longitudUsar,
          ancho_a: payload.anchoA || 0,
          altura_h: payload.alturaH || 0,
          lado_via: payload.ladoVia || 'Sección Completa',
          multiplicador: payload.multiplicador || 1,
          descuento: payload.descuento || 0,
          tipo_descuento: payload.tipoDescuento || 'monto',
          cantidad_calculada: resMemoria.cantidadNeta,
          cantidad_facturable: cantidadFacturable,
          cantidad_retenida: cantidadRetenida,
          origen_tipo: payload.origenTipo,
          referencia_origen: payload.referenciaOrigen,
          estimacion_num: estimacion,
          estado_linea: 'Confirmada',
          bitacora_entrada_id: payload.bitacoraEntradaId || null,
          observaciones: payload.observaciones || '',
        })
        .select()
        .single()

      if (!error && data) {
        return data
      }
    } catch (e) {
      // Usar store en memoria
    }

    const prevStore = medicionesAnaliticasMemoriaStore.get(payload.proyectoId) || []
    medicionesAnaliticasMemoriaStore.set(payload.proyectoId, [registroNuevo, ...prevStore])
    return registroNuevo
  }

  static async actualizarMedicion(proyectoId: string, medicionId: string, updates: Partial<MedicionAnaliticaPayload>) {
    if (!proyectoId || !medicionId) {
      throw new Error('ID del proyecto y de la medición son requeridos.')
    }

    // Comprobar bloqueo de estimación finalizada
    const list = medicionesAnaliticasMemoriaStore.get(proyectoId) || []
    const enc = list.find((m) => m.id === medicionId)
    const estNum = updates.estimacionNum || enc?.estimacion_num || enc?.estimacionNum || 'Est. 01'
    const keyEst = `${proyectoId}_${estNum}`

    if (estimacionesFinalizadasSet.has(keyEst)) {
      throw new Error(`La estimación ${estNum} está finalizada. No se pueden modificar mediciones.`)
    }

    // Recalcular si se enviaron dimensiones o estaciones
    let longitudUsar = updates.longitudL
    if (updates.estacionInicio && updates.estacionFin) {
      const calcL = calcularLongitudEstaciones(updates.estacionInicio, updates.estacionFin)
      longitudUsar = updates.longitudL && updates.longitudL > 0 ? updates.longitudL : calcL
    } else if (enc && (!updates.longitudL || updates.longitudL <= 0)) {
      longitudUsar = enc.longitud_l || enc.longitudL || 0
    }

    const resMemoria = calcularCantidadMedicion({
      unidad: updates.unidad || enc?.unidad || 'm3',
      longitudL: longitudUsar ?? enc?.longitud_l ?? 0,
      anchoA: updates.anchoA ?? enc?.ancho_a ?? enc?.anchoA ?? 0,
      alturaH: updates.alturaH ?? enc?.altura_h ?? enc?.alturaH ?? 0,
      multiplicador: updates.multiplicador ?? enc?.multiplicador ?? 1,
      descuento: updates.descuento ?? enc?.descuento ?? 0,
      tipoDescuento: updates.tipoDescuento ?? enc?.tipo_descuento ?? 'monto',
      cantidadDirecta: updates.cantidadDirecta ?? enc?.cantidadDirecta,
    })

    const cantAjustada = updates.cantidadAjustada ?? enc?.cantidadAjustada ?? 999999
    const acumuladoAnt = updates.acumuladoAnterior ?? enc?.acumuladoAnterior ?? 0
    const precioUnit = updates.precioUnitario ?? enc?.precioUnitario ?? 1

    const resTopes = procesarMedicionRenglon({
      cantidadAjustada: cantAjustada,
      acumuladoAnterior: acumuladoAnt,
      medicionPeriodo: resMemoria.cantidadNeta || 0,
      precioUnitario: precioUnit,
    })

    const camposActualizados: any = {
      ...(updates.codigoDGC ? { codigo_dgc: updates.codigoDGC, codigoDGC: updates.codigoDGC } : {}),
      ...(updates.estacionInicio ? { estacion_inicio: updates.estacionInicio, estacionInicio: updates.estacionInicio } : {}),
      ...(updates.estacionFin ? { estacion_fin: updates.estacionFin, estacionFin: updates.estacionFin } : {}),
      ...(longitudUsar !== undefined ? { longitud_l: longitudUsar, longitudL: longitudUsar } : {}),
      ...(updates.anchoA !== undefined ? { ancho_a: updates.anchoA, anchoA: updates.anchoA } : {}),
      ...(updates.alturaH !== undefined ? { altura_h: updates.alturaH, alturaH: updates.alturaH } : {}),
      ...(updates.ladoVia ? { lado_via: updates.ladoVia, ladoVia: updates.ladoVia } : {}),
      ...(updates.multiplicador !== undefined ? { multiplicador: updates.multiplicador } : {}),
      ...(updates.descuento !== undefined ? { descuento: updates.descuento } : {}),
      ...(updates.tipoDescuento ? { tipo_descuento: updates.tipoDescuento, tipoDescuento: updates.tipoDescuento } : {}),
      cantidad_calculada: resMemoria.cantidadNeta,
      cantidadCalculada: resMemoria.cantidadNeta,
      cantidad_facturable: resTopes.facturablePeriodo,
      cantidadFacturable: resTopes.facturablePeriodo,
      cantidad_retenida: resTopes.retenidoPendiente,
      cantidadRetenida: resTopes.retenidoPendiente,
      ...(updates.referenciaOrigen ? { referencia_origen: updates.referenciaOrigen, referenciaOrigen: updates.referenciaOrigen } : {}),
      ...(updates.observaciones !== undefined ? { observaciones: updates.observaciones } : {}),
      updated_at: new Date().toISOString(),
    }

    try {
      const { data, error } = await clienteSupabase
        .from('medicion_analitica')
        .update(camposActualizados)
        .eq('id', medicionId)
        .select()
        .single()

      if (!error && data) {
        return data
      }
    } catch (e) {}

    // Fallback memoria
    const storeActual = medicionesAnaliticasMemoriaStore.get(proyectoId) || []
    const updatedStore = storeActual.map((item) => (item.id === medicionId ? { ...item, ...camposActualizados } : item))
    medicionesAnaliticasMemoriaStore.set(proyectoId, updatedStore)

    return { id: medicionId, ...camposActualizados }
  }

  static async eliminarMedicion(proyectoId: string, medicionId: string) {
    const list = medicionesAnaliticasMemoriaStore.get(proyectoId) || []
    const enc = list.find((m) => m.id === medicionId)

    if (enc) {
      const keyEst = `${proyectoId}_${enc.estimacion_num || enc.estimacionNum}`
      if (estimacionesFinalizadasSet.has(keyEst)) {
        throw new Error(`La estimación está finalizada. No se puede eliminar esta medición.`)
      }
    }

    try {
      await clienteSupabase.from('medicion_analitica').delete().eq('id', medicionId)
    } catch (e) {}

    const filtered = list.filter((m) => m.id !== medicionId)
    medicionesAnaliticasMemoriaStore.set(proyectoId, filtered)
    return { ok: true }
  }

  static async finalizarEstimacion(proyectoId: string, estimacionIdOrNum?: string, usuarioId?: string) {
    if (!proyectoId) {
      throw new ValidationError('El ID del proyecto es obligatorio', 'proyectoId')
    }

    // 1. Obtener la estimación que se desea cerrar
    let estimacionQuery = clienteSupabase.from('estimacion').select('*').eq('proyecto_id', proyectoId)

    if (estimacionIdOrNum) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(estimacionIdOrNum)
      if (isUuid) {
        estimacionQuery = estimacionQuery.eq('id', estimacionIdOrNum)
      } else {
        const numInt = parseInt(estimacionIdOrNum.replace(/[^\d]/g, ''), 10) || 1
        estimacionQuery = estimacionQuery.eq('numero_estimacion', numInt)
      }
    } else {
      estimacionQuery = estimacionQuery.eq('estado', 'En progreso')
    }

    const { data: est, error: errEst } = await estimacionQuery.maybeSingle()

    if (errEst || !est) {
      if (estimacionIdOrNum) {
        estimacionesFinalizadasSet.add(`${proyectoId}_${estimacionIdOrNum}`)
        return {
          ok: true,
          mensaje: `Estimación ${estimacionIdOrNum} finalizada con éxito.`,
        }
      }
      throw new ValidationError('No existe una estimación en progreso para el proyecto especificado.', 'estimacion')
    }

    if (est.estado === 'Finalizada') {
      throw new ValidationError(`La estimación ${est.numero_estimacion} (${est.codigo_estimacion}) ya se encuentra finalizada e inmutable.`, 'estado')
    }

    const estId = est.id
    const estNum = est.numero_estimacion

    // 2. Seleccionar filas aprobadas en bitacora_pendiente para esta estimación
    const { data: pendientesAprobados, error: errPend } = await clienteSupabase
      .from('bitacora_pendiente')
      .select(`
        *,
        renglon:renglon_id(
          id,
          codigo,
          descripcion,
          cantidad_contractual,
          cantidad_ajustada,
          precio_unitario_directo,
          tipo_renglon,
          aplica_indirectos,
          aplica_iva
        )
      `)
      .eq('proyecto_id', proyectoId)
      .eq('estado_conciliacion', 'Aprobado')
      .is('anulado_en', null)
      .or(`estimacion_id.eq.${estId},estimacion_origen.eq.${estNum}`)

    if (errPend || !pendientesAprobados || pendientesAprobados.length === 0) {
      throw new ValidationError(`No hay registros aprobados para trasladar en la estimación ${estNum}.`, 'pendientes')
    }

    // 3. Agrupar pendientes por renglon_id
    const pendientesPorRenglon = new Map<string, any[]>()
    for (const p of pendientesAprobados) {
      const list = pendientesPorRenglon.get(p.renglon_id) || []
      list.push(p)
      pendientesPorRenglon.set(p.renglon_id, list)
    }

    // 4. Procesar cada renglón: disponible, topes, split y fotografia en estimacion_detalle
    const detallesInsertar: any[] = []
    let sumaMontoDirectoPeriodo = 0
    let sumaMontoRenglonGlobal = 0

    for (const [renglonId, filasPendientes] of pendientesPorRenglon.entries()) {
      const primerPend = filasPendientes[0]
      const renglon = Array.isArray(primerPend.renglon) ? (primerPend.renglon[0] || {}) : (primerPend.renglon || {})

      const cantContractual = Number(renglon.cantidad_contractual) || 0
      const cantAjustada = Number(renglon.cantidad_ajustada) || 0
      const precioUnitario = Number(renglon.precio_unitario_directo) || 0
      const tipoRenglon = renglon.tipo_renglon || 'COSTO_DIRECTO'
      const aplicaIndirectos = renglon.aplica_indirectos !== false

      // Consultar acumulado anterior exclusivamente de la última estimación 'Finalizada' en estimacion_detalle
      const { data: ultDetalle } = await clienteSupabase
        .from('estimacion_detalle')
        .select('cantidad_acumulada, estimacion:estimacion_id!inner(estado, proyecto_id)')
        .eq('renglon_id', renglonId)
        .eq('estimacion.proyecto_id', proyectoId)
        .eq('estimacion.estado', 'Finalizada')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const cantidadAnterior = Number(ultDetalle?.cantidad_acumulada) || 0
      const cantidadDisponible = Math.max(0, cantAjustada - cantidadAnterior)

      let disponibleRestante = cantidadDisponible
      let cantidadPeriodoTrasladada = 0

      for (const fila of filasPendientes) {
        const montoFila = Number(fila.cantidad_neta_cobrar) || 0

        if (montoFila <= disponibleRestante) {
          // Caso A: Cabe completo dentro del disponible
          disponibleRestante -= montoFila
          cantidadPeriodoTrasladada += montoFila

          await clienteSupabase
            .from('bitacora_pendiente')
            .update({
              estimacion_id: estId,
              estimacion_origen: estNum,
              estado_conciliacion: 'Trasladado' // Dispara trigger a bitacora_avance
            })
            .eq('id', fila.id)
        } else if (disponibleRestante > 0) {
          // Caso B: Excede el disponible. Realizar SPLIT.
          const porcionTrasladable = disponibleRestante
          const excesoRemanente = montoFila - porcionTrasladable
          disponibleRestante = 0
          cantidadPeriodoTrasladada += porcionTrasladable

          // Update fila original con porcion dentro del tope y traslada
          await clienteSupabase
            .from('bitacora_pendiente')
            .update({
              cantidad_neta_cobrar: porcionTrasladable,
              estimacion_id: estId,
              estimacion_origen: estNum,
              estado_conciliacion: 'Trasladado'
            })
            .eq('id', fila.id)

          const insertPayload: any = {
            proyecto_id: proyectoId,
            renglon_id: renglonId,
            bitacora_entrada_id: fila.bitacora_entrada_id,
            registrado_por: fila.registrado_por,
            fecha_medicion: fila.fecha_medicion,
            estacion_inicial: fila.estacion_inicial,
            estacion_final: fila.estacion_final,
            longitud_medida: null,
            ancho: null,
            altura_espesor: null,
            cantidad_neta_cobrar: excesoRemanente,
            estado_conciliacion: 'Aprobado',
            estimacion_id: null,
            estimacion_origen: null,
            observaciones: `Exceso derivado por tope contractual en Est. ${estNum} (Origen: ${fila.id})`
          }

          const { error: errSplit } = await clienteSupabase
            .from('bitacora_pendiente')
            .insert({
              ...insertPayload,
              bitacora_pendiente_origen_id: fila.id
            })

          if (errSplit) {
            // Si la columna bitacora_pendiente_origen_id no existe aún en la BD (error PG 42703 o PostgREST PGRST204), reintentar sin ella
            if (errSplit.code === '42703' || errSplit.code === 'PGRST204' || errSplit.message?.includes('bitacora_pendiente_origen_id')) {
              const { error: errSplitFallback } = await clienteSupabase
                .from('bitacora_pendiente')
                .insert(insertPayload)
              if (errSplitFallback) {
                throw new Error(`Error al crear fila remanente de split: ${errSplitFallback.message}`)
              }
            } else {
              throw new Error(`Error al crear fila remanente de split: ${errSplit.message}`)
            }
          }
        } else {
          // Disponible agotado: Permanece 'Aprobado' con estimacion_id = NULL
          await clienteSupabase
            .from('bitacora_pendiente')
            .update({
              estimacion_id: null,
              estimacion_origen: null,
              observaciones: `Sin cantidad contractual disponible en Est. ${estNum}`
            })
            .eq('id', fila.id)
        }
      }

      // Guard contra división por cero
      const cantidadAcumulada = cantidadAnterior + cantidadPeriodoTrasladada
      const montoAnterior = redondearCentavos(cantidadAnterior * precioUnitario)
      const montoPeriodo = redondearCentavos(cantidadPeriodoTrasladada * precioUnitario)
      const montoAcumulado = redondearCentavos(cantidadAcumulada * precioUnitario)

      const pctAvancePeriodo = cantAjustada > 0 ? Number(((cantidadPeriodoTrasladada / cantAjustada) * 100).toFixed(2)) : 0
      const pctAvanceAcumulado = cantAjustada > 0 ? Number(((cantidadAcumulada / cantAjustada) * 100).toFixed(2)) : 0

      // Clasificar monto en las bolsas según tipo_renglon y aplica_indirectos
      if (tipoRenglon === 'COSTO_DIRECTO' || aplicaIndirectos) {
        sumaMontoDirectoPeriodo += montoPeriodo
      } else {
        sumaMontoRenglonGlobal += montoPeriodo
      }

      detallesInsertar.push({
        estimacion_id: estId,
        renglon_id: renglonId,
        cantidad_contractual: cantContractual,
        cantidad_ajustada: cantAjustada,
        cantidad_anterior: cantidadAnterior,
        cantidad_periodo: cantidadPeriodoTrasladada,
        cantidad_acumulada: cantidadAcumulada,
        precio_unitario: precioUnitario,
        monto_anterior: montoAnterior,
        monto_periodo: montoPeriodo,
        monto_acumulado: montoAcumulado,
        porcentaje_avance_periodo: pctAvancePeriodo,
        porcentaje_avance_acumulado: pctAvanceAcumulado
      })
    }

    // Insertar fotografías en estimacion_detalle
    const { error: errDet } = await clienteSupabase
      .from('estimacion_detalle')
      .insert(detallesInsertar)

    if (errDet) {
      throw new Error(`Error al registrar detalle de estimación: ${errDet.message}`)
    }

    // 5. Consultar parametro_proyecto para parámetros reales
    const { data: paramProy } = await clienteSupabase
      .from('parametro_proyecto')
      .select('*')
      .eq('proyecto_id', proyectoId)
      .maybeSingle()

    const normalizarPorcentaje = (val: any, fallback: number = 0): number => {
      const num = Number(val)
      if (isNaN(num) || num === 0) return fallback
      return num > 0 && num <= 1 ? num * 100 : num
    }

    const porcentajeIndirectos = normalizarPorcentaje(paramProy?.porcentaje_indirectos ?? est.porcentaje_indirectos, 0)
    const porcentajeIva = normalizarPorcentaje(paramProy?.porcentaje_iva ?? est.porcentaje_iva, 12.00)
    const porcentajeAmortAnticipo = normalizarPorcentaje(paramProy?.porcentaje_amortizacion_anticipo ?? est.porcentaje_amortizacion_anticipo, 0)
    const porcentajeRetencionGarantia = normalizarPorcentaje(paramProy?.porcentaje_retencion_garantia ?? est.porcentaje_retencion_garantia, 0)

    // Consultar total anticipo y amortización acumulada anterior
    const { data: estsPrevias } = await clienteSupabase
      .from('estimacion')
      .select('monto_amortizacion_anticipo')
      .eq('proyecto_id', proyectoId)
      .eq('estado', 'Finalizada')

    const anticipoAmortizadoAnterior = (estsPrevias || []).reduce((sum, e) => sum + (Number(e.monto_amortizacion_anticipo) || 0), 0)
    const anticipoRecibidoTotal = Number(paramProy?.monto_anticipo_total ?? paramProy?.monto_anticipo ?? paramProy?.anticipo_total_recibido) || 0

    // Invocar liquidacion.ts
    const resLiq = calcularLiquidacionEstimacion({
      montoDirectoPeriodo: sumaMontoDirectoPeriodo,
      porcentajeIndirectos,
      porcentajeIva,
      montoRenglonGlobal: sumaMontoRenglonGlobal,
      excluirIndirectosIvaGlobal: sumaMontoRenglonGlobal > 0,
      porcentajeAmortizacionAnticipo: porcentajeAmortAnticipo,
      porcentajeRetencionGarantia: porcentajeRetencionGarantia,
      anticipoRecibidoTotal,
      anticipoAmortizadoAnterior
    })

    // 6. Marcar estimación como 'Finalizada' con la auditoría exigida
    const fechaActual = new Date().toISOString()
    const updatesEst = {
      monto_costo_directo_periodo: sumaMontoDirectoPeriodo,
      porcentaje_indirectos: porcentajeIndirectos,
      monto_indirectos: resLiq.indirectos,
      monto_renglones_globales: sumaMontoRenglonGlobal,
      porcentaje_iva: porcentajeIva,
      monto_iva: resLiq.iva,
      monto_subtotal: resLiq.valorTotalEstimacion - resLiq.iva,
      monto_total_estimacion: resLiq.valorTotalEstimacion,
      porcentaje_amortizacion_anticipo: porcentajeAmortAnticipo,
      monto_amortizacion_anticipo: resLiq.amortizacionPeriodo,
      porcentaje_retencion_garantia: porcentajeRetencionGarantia,
      monto_retencion_garantia: resLiq.retencionGarantia,
      monto_neto_pagar: resLiq.totalAFavorContratista,
      saldo_anticipo_remanente: resLiq.saldoAnticipoRemanente,
      estado: 'Finalizada',
      finalizada_en: fechaActual,
      finalizada_por: usuarioId || null
    }

    const { error: errUpdEst } = await clienteSupabase
      .from('estimacion')
      .update(updatesEst)
      .eq('id', estId)

    if (errUpdEst) {
      throw new Error(`Error al finalizar la estimación: ${errUpdEst.message}`)
    }

    return {
      ok: true,
      estimacionId: estId,
      numeroEstimacion: estNum,
      codigoEstimacion: est.codigo_estimacion,
      estado: 'Finalizada',
      montoDirectoPeriodo: sumaMontoDirectoPeriodo,
      montoTotalEstimacion: resLiq.valorTotalEstimacion,
      montoNetoPagar: resLiq.totalAFavorContratista,
      detallesContados: detallesInsertar.length
    }
  }
}
