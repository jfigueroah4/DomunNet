import { clienteSupabase } from '../../configuracion/cliente-supabase'
import { validarOperacionProyectoPermitida } from '../proyectos/proyectos.servicio'
import {
  calcularCantidadMedicion,
  calcularLongitudEstaciones,
  parseEstacionAMetros,
  ResultadoCantidadMedicion,
  procesarMedicionRenglon,
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

  static async finalizarEstimacion(proyectoId: string, estimacionNum: string) {
    const keyEst = `${proyectoId}_${estimacionNum}`
    estimacionesFinalizadasSet.add(keyEst)

    try {
      await clienteSupabase
        .from('medicion_analitica')
        .update({ estado_linea: 'Bloqueada' })
        .eq('proyecto_id', proyectoId)
        .eq('estimacion_num', estimacionNum)
    } catch (e) {}

    const list = medicionesAnaliticasMemoriaStore.get(proyectoId) || []
    const updated = list.map((m) => {
      if (m.estimacion_num === estimacionNum || m.estimacionNum === estimacionNum) {
        return { ...m, estado_linea: 'Bloqueada', estadoLinea: 'Bloqueada' }
      }
      return m
    })
    medicionesAnaliticasMemoriaStore.set(proyectoId, updated)

    return { ok: true, mensaje: `Estimación ${estimacionNum} finalizada y bloqueada exitosamente.` }
  }
}
