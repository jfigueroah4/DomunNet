'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PauseCircle,
  Filter,
  Plus,
  Info,
} from 'lucide-react'
import { Portal } from '@/components/ui/Portal'

interface BitacoraCalendarioModalProps {
  abierto: boolean
  onCerrar: () => void
  proyecto: any
  registrosBitacora: any[]
  onFiltrarFecha?: (fecha: string) => void
  onCrearRegistroEnFecha?: (fecha: string) => void
}

export function BitacoraCalendarioModal({
  abierto,
  onCerrar,
  proyecto,
  registrosBitacora = [],
  onFiltrarFecha,
  onCrearRegistroEnFecha,
}: BitacoraCalendarioModalProps) {
  // Fecha actual de hoy en formato YYYY-MM-DD
  const hoyStr = useMemo(() => new Date().toISOString().slice(0, 10), [])

  // Fechas límites del proyecto
  const fechaInicioProy = useMemo(() => {
    const f = proyecto?.fecha_inicio || proyecto?.fechaInicio || ''
    return f ? f.slice(0, 10) : ''
  }, [proyecto])

  const fechaFinProy = useMemo(() => {
    const f = proyecto?.fecha_fin_estimada || proyecto?.fecha_fin || proyecto?.fechaFinEstimada || proyecto?.fechaFin || ''
    return f ? f.slice(0, 10) : ''
  }, [proyecto])

  // Generar lista de todos los meses comprendidos entre fecha_inicio y fecha_fin
  const mesesDisponibles = useMemo(() => {
    const anioActual = new Date().getFullYear()
    const mesActual = new Date().getMonth()

    let fIni = fechaInicioProy ? new Date(fechaInicioProy + 'T00:00:00') : new Date(anioActual, 0, 1)
    let fFin = fechaFinProy ? new Date(fechaFinProy + 'T00:00:00') : new Date(anioActual, 11, 31)

    if (isNaN(fIni.getTime())) fIni = new Date(anioActual, 0, 1)
    if (isNaN(fFin.getTime())) fFin = new Date(anioActual, 11, 31)
    if (fFin < fIni) fFin = new Date(fIni.getFullYear() + 1, fIni.getMonth(), fIni.getDate())

    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]

    const lista: { year: number; month: number; label: string; key: string }[] = []
    const cursor = new Date(fIni.getFullYear(), fIni.getMonth(), 1)
    const limite = new Date(fFin.getFullYear(), fFin.getMonth(), 1)

    while (cursor <= limite) {
      const y = cursor.getFullYear()
      const m = cursor.getMonth()
      lista.push({
        year: y,
        month: m,
        label: `${meses[m]} ${y}`,
        key: `${y}-${String(m + 1).padStart(2, '0')}`,
      })
      cursor.setMonth(cursor.getMonth() + 1)
    }

    if (lista.length === 0) {
      lista.push({
        year: anioActual,
        month: mesActual,
        label: `${meses[mesActual]} ${anioActual}`,
        key: `${anioActual}-${String(mesActual + 1).padStart(2, '0')}`,
      })
    }

    return lista
  }, [fechaInicioProy, fechaFinProy])

  // Mes actualmente visualizado (inicializa en el mes de hoy o en el primer mes del proyecto)
  const [mesIndex, setMesIndex] = useState<number>(0)
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null)

  useEffect(() => {
    if (!abierto) return
    const keyHoy = hoyStr.slice(0, 7)
    const idxHoy = mesesDisponibles.findIndex((m) => m.key === keyHoy)
    if (idxHoy !== -1) {
      setMesIndex(idxHoy)
    } else {
      setMesIndex(0)
    }
    setDiaSeleccionado(hoyStr)
  }, [abierto, mesesDisponibles, hoyStr])

  const mesActualObj = mesesDisponibles[mesIndex] || mesesDisponibles[0]

  // Mapa de bitácoras por fecha YYYY-MM-DD
  const bitacorasPorFecha = useMemo(() => {
    const mapa = new Map<string, any[]>()
    ;(registrosBitacora || []).forEach((reg: any) => {
      const f = (reg.fecha || reg.fecha_hora || '').slice(0, 10)
      if (f) {
        const arr = mapa.get(f) || []
        arr.push(reg)
        mapa.set(f, arr)
      }
    })
    return mapa
  }, [registrosBitacora])

  // Identificar si una bitácora contiene suspensión de labores
  const esBitacoraSuspendida = (reg: any): boolean => {
    if (reg.suspensionActividades || reg.suspension_actividades || reg.se_suspendio) return true
    const txt = `${reg.titulo || ''} ${reg.descripcion || ''} ${reg.comentarios || ''}`.toLowerCase()
    return txt.includes('suspensión') || txt.includes('suspension') || txt.includes('suspendid')
  }

  // Cuadrícula de días para el mes seleccionado
  const gridDias = useMemo(() => {
    if (!mesActualObj) return []
    const { year, month } = mesActualObj

    const primerDiaSemana = new Date(year, month, 1).getDay() // 0 = Domingo, 1 = Lunes...
    // Ajustar para que Lunes sea 0 y Domingo sea 6
    const offsetLunes = (primerDiaSemana + 6) % 7

    const totalDiasMes = new Date(year, month + 1, 0).getDate()

    const dias = []
    // Celdas vacías antes del primer día
    for (let i = 0; i < offsetLunes; i++) {
      dias.push({ esVacio: true, id: `vacio-prev-${i}` })
    }

    // Días del mes
    for (let d = 1; d <= totalDiasMes; d++) {
      const fechaStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const registros = bitacorasPorFecha.get(fechaStr) || []
      const tieneRegistros = registros.length > 0
      const tieneSuspension = registros.some(esBitacoraSuspendida)

      // Reglas de periodo del proyecto
      const dentroDeRangoProy =
        (!fechaInicioProy || fechaStr >= fechaInicioProy) &&
        (!fechaFinProy || fechaStr <= fechaFinProy)

      const esHoy = fechaStr === hoyStr
      const esPasado = fechaStr < hoyStr
      const esFuturo = fechaStr > hoyStr

      // Estado de color
      let estadoColor: 'verde' | 'rojo' | 'ambar' | 'gris' = 'gris'
      let estadoTexto = 'Programado'

      if (tieneSuspension) {
        estadoColor = 'ambar'
        estadoTexto = 'Día con Suspensión'
      } else if (tieneRegistros) {
        estadoColor = 'verde'
        estadoTexto = `${registros.length} registro(s)`
      } else if (esPasado && dentroDeRangoProy) {
        estadoColor = 'rojo'
        estadoTexto = 'Sin registro (Atrasado)'
      } else {
        estadoColor = 'gris'
        estadoTexto = dentroDeRangoProy ? 'Programado' : 'Fuera de plazo'
      }

      dias.push({
        esVacio: false,
        id: fechaStr,
        dia: d,
        fechaStr,
        registros,
        tieneRegistros,
        tieneSuspension,
        dentroDeRangoProy,
        esHoy,
        esPasado,
        esFuturo,
        estadoColor,
        estadoTexto,
      })
    }

    return dias
  }, [mesActualObj, bitacorasPorFecha, fechaInicioProy, fechaFinProy, hoyStr])

  // Métricas globales del proyecto para los badges
  const metricasProyecto = useMemo(() => {
    let diasLaborados = 0
    let diasSuspendidos = 0
    let diasAtrasados = 0
    let diasProgramados = 0

    // Si hay fechas definidas, calcular en base al rango total
    if (fechaInicioProy && fechaFinProy) {
      const fIni = new Date(fechaInicioProy + 'T00:00:00')
      const fFin = new Date(fechaFinProy + 'T00:00:00')
      const cursor = new Date(fIni)

      while (cursor <= fFin) {
        const fStr = cursor.toISOString().slice(0, 10)
        const regs = bitacorasPorFecha.get(fStr) || []
        const susp = regs.some(esBitacoraSuspendida)

        if (susp) {
          diasSuspendidos++
        } else if (regs.length > 0) {
          diasLaborados++
        } else if (fStr < hoyStr) {
          diasAtrasados++
        } else {
          diasProgramados++
        }
        cursor.setDate(cursor.getDate() + 1)
      }
    } else {
      // Cálculo sobre los registros existentes
      bitacorasPorFecha.forEach((regs) => {
        if (regs.some(esBitacoraSuspendida)) diasSuspendidos++
        else diasLaborados++
      })
    }

    return { diasLaborados, diasSuspendidos, diasAtrasados, diasProgramados }
  }, [fechaInicioProy, fechaFinProy, bitacorasPorFecha, hoyStr])

  // Registros del día seleccionado
  const registrosDelDia = useMemo(() => {
    if (!diaSeleccionado) return []
    return bitacorasPorFecha.get(diaSeleccionado) || []
  }, [diaSeleccionado, bitacorasPorFecha])

  const diaSeleccionadoObj = useMemo(() => {
    return gridDias.find((d) => !d.esVacio && d.fechaStr === diaSeleccionado)
  }, [gridDias, diaSeleccionado])

  if (!abierto) return null

  return (
    <Portal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 font-[Poppins]">
        {/* Backdrop con desenfoque suave */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          onClick={onCerrar}
        />

        {/* Tarjeta flotante modal */}
        <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
          {/* Header Superior Flotante */}
          <div className="p-3.5 sm:p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 via-white to-gray-50 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-[#9B0F06]/10 text-[#9B0F06] flex items-center justify-center shrink-0 border border-[#9B0F06]/20">
                <CalendarIcon size={18} className="stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                    Calendario de Obra
                  </h2>
                  <span className="hidden xs:inline-block text-[9.5px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 shrink-0">
                    Días laborados y suspendidos
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-gray-500 truncate mt-0.5">
                  {proyecto?.nombre || proyecto?.nombre_oficial || 'Proyecto Activo'} ·{' '}
                  <span className="font-mono text-gray-600 font-semibold">{proyecto?.codigo || 'S/C'}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onCerrar}
              className="h-8 w-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Cerrar calendario"
            >
              <X size={17} />
            </button>
          </div>

          {/* Subheader: Rango contractual y Resumen de días */}
          <div className="px-3.5 sm:px-4 py-2 bg-gray-50/70 border-b border-gray-100 space-y-2 shrink-0">
            <div className="flex flex-wrap items-center justify-between gap-1.5 text-[10.5px]">
              <div className="flex items-center gap-1.5 text-gray-600">
                <Clock size={12} className="text-gray-400" />
                <span className="font-semibold text-gray-700">Plazo contractual:</span>
                <span className="font-mono text-gray-600">
                  {fechaInicioProy || 'Inicio S/F'} al {fechaFinProy || 'Fin S/F'}
                </span>
              </div>

              {/* Botón rápido para volver al mes actual */}
              <button
                type="button"
                onClick={() => {
                  const keyHoy = hoyStr.slice(0, 7)
                  const idx = mesesDisponibles.findIndex((m) => m.key === keyHoy)
                  if (idx !== -1) setMesIndex(idx)
                  setDiaSeleccionado(hoyStr)
                }}
                className="text-[10px] font-semibold text-[#9B0F06] hover:underline cursor-pointer"
              >
                Ir a hoy
              </button>
            </div>

            {/* Badges de métricas rápidas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-0.5">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-900">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-[10px] font-medium truncate">Laborados:</span>
                <strong className="text-[11px] font-bold ml-auto">{metricasProyecto.diasLaborados}</strong>
              </div>

              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-50 border border-red-200/80 text-red-900">
                <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                <span className="text-[10px] font-medium truncate">Atrasados:</span>
                <strong className="text-[11px] font-bold ml-auto">{metricasProyecto.diasAtrasados}</strong>
              </div>

              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-900">
                <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                <span className="text-[10px] font-medium truncate">Suspendidos:</span>
                <strong className="text-[11px] font-bold ml-auto">{metricasProyecto.diasSuspendidos}</strong>
              </div>

              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-100 border border-gray-200 text-gray-700">
                <span className="h-2 w-2 rounded-full bg-gray-400 shrink-0" />
                <span className="text-[10px] font-medium truncate">Programados:</span>
                <strong className="text-[11px] font-bold ml-auto">{metricasProyecto.diasProgramados}</strong>
              </div>
            </div>
          </div>

          {/* Navegador de Meses */}
          <div className="px-3.5 sm:px-4 py-2 border-b border-gray-100 flex items-center justify-between gap-2 shrink-0">
            <button
              type="button"
              disabled={mesIndex <= 0}
              onClick={() => setMesIndex((prev) => Math.max(0, prev - 1))}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Mes anterior"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Selector dropdown de mes y año */}
            <div className="flex items-center gap-1.5">
              <select
                value={mesIndex}
                onChange={(e) => setMesIndex(Number(e.target.value))}
                className="h-[30px] rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#9B0F06] cursor-pointer shadow-2xs font-[Poppins]"
              >
                {mesesDisponibles.map((m, idx) => (
                  <option key={m.key} value={idx}>
                    {m.label} {m.key === hoyStr.slice(0, 7) ? '· Actual' : ''}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              disabled={mesIndex >= mesesDisponibles.length - 1}
              onClick={() => setMesIndex((prev) => Math.min(mesesDisponibles.length - 1, prev + 1))}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Mes siguiente"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Área Scrolleable: Cuadrícula y Detalle */}
          <div className="overflow-y-auto flex-1 p-3 sm:p-4 space-y-3">
            {/* Cabecera Días de la semana */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-gray-500 uppercase tracking-wider pb-1">
              <div>Lun</div>
              <div>Mar</div>
              <div>Mié</div>
              <div>Jue</div>
              <div>Vie</div>
              <div className="text-gray-400">Sáb</div>
              <div className="text-gray-400">Dom</div>
            </div>

            {/* Grilla mensual de 7 columnas */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {gridDias.map((d) => {
                if (d.esVacio) {
                  return <div key={d.id} className="min-h-[46px] sm:min-h-[54px] rounded-xl bg-gray-50/40" />
                }

                const esSeleccionado = diaSeleccionado === d.fechaStr

                // Configuración de estilo según estado
                let estiloContenedor = 'bg-gray-50/70 border-gray-200/80 text-gray-600'

                if (d.estadoColor === 'verde') {
                  estiloContenedor = 'bg-emerald-50/90 border-emerald-300 text-emerald-950 hover:bg-emerald-100/80'
                } else if (d.estadoColor === 'rojo') {
                  estiloContenedor = 'bg-red-50/80 border-red-300 text-red-950 hover:bg-red-100/70'
                } else if (d.estadoColor === 'ambar') {
                  estiloContenedor = 'bg-amber-50/90 border-amber-300 text-amber-950 hover:bg-amber-100/80'
                } else {
                  estiloContenedor = 'bg-gray-50/80 border-gray-200 text-gray-500 hover:bg-gray-100/70'
                }

                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDiaSeleccionado(d.fechaStr!)}
                    className={`relative min-h-[46px] sm:min-h-[54px] p-1 sm:p-1.5 rounded-xl border flex flex-col justify-between items-start transition-all cursor-pointer text-left ${estiloContenedor} ${
                      esSeleccionado
                        ? 'ring-2 ring-[#9B0F06] ring-offset-1 shadow-md scale-[1.02] z-10'
                        : 'shadow-2xs hover:shadow-xs'
                    }`}
                  >
                    {/* Fila superior: número de día y badge de estado */}
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-[11px] sm:text-xs font-bold ${d.esHoy ? 'text-[#9B0F06]' : ''}`}>
                        {d.dia}
                      </span>

                      {d.esHoy && (
                        <span className="text-[8px] font-bold bg-[#9B0F06] text-white px-1 py-0.2 rounded shrink-0">
                          Hoy
                        </span>
                      )}
                    </div>

                    {/* Indicador inferior de contenido */}
                    <div className="w-full mt-1">
                      {d.tieneSuspension ? (
                        <span className="flex items-center gap-0.5 text-[8.5px] font-bold text-amber-800 leading-tight">
                          <PauseCircle size={10} className="shrink-0" />
                          <span className="truncate hidden xs:inline">Susp.</span>
                        </span>
                      ) : d.tieneRegistros ? (
                        <span className="flex items-center gap-0.5 text-[8.5px] font-bold text-emerald-800 leading-tight">
                          <CheckCircle2 size={10} className="shrink-0" />
                          <span className="truncate">{d.registros.length}</span>
                        </span>
                      ) : d.estadoColor === 'rojo' ? (
                        <span className="flex items-center gap-0.5 text-[8px] font-semibold text-red-700 leading-tight">
                          <AlertTriangle size={9} className="shrink-0" />
                          <span className="truncate hidden xs:inline">Atraso</span>
                        </span>
                      ) : (
                        <span className="text-[8px] text-gray-400 block truncate">
                          {d.esFuturo ? 'Prog.' : ''}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Detalle del Día Seleccionado (Drawer inferior contextual) */}
            {diaSeleccionadoObj && (
              <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50/80 p-3 space-y-2.5 animate-in fade-in duration-150">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                        diaSeleccionadoObj.estadoColor === 'verde'
                          ? 'bg-emerald-500'
                          : diaSeleccionadoObj.estadoColor === 'rojo'
                          ? 'bg-red-500'
                          : diaSeleccionadoObj.estadoColor === 'ambar'
                          ? 'bg-amber-500'
                          : 'bg-gray-400'
                      }`}
                    />
                    <h3 className="text-xs font-bold text-gray-900">
                      Fecha: {diaSeleccionadoObj.fechaStr} {diaSeleccionadoObj.esHoy ? '(Hoy)' : ''}
                    </h3>
                    <span
                      className={`text-[9.5px] font-semibold px-2 py-0.5 rounded-full border ${
                        diaSeleccionadoObj.estadoColor === 'verde'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : diaSeleccionadoObj.estadoColor === 'rojo'
                          ? 'bg-red-100 text-red-900 border-red-300'
                          : diaSeleccionadoObj.estadoColor === 'ambar'
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-gray-200 text-gray-800 border-gray-300'
                      }`}
                    >
                      {diaSeleccionadoObj.estadoTexto}
                    </span>
                  </div>

                  {/* Acciones para el día */}
                  <div className="flex items-center gap-1.5">
                    {diaSeleccionadoObj.tieneRegistros && onFiltrarFecha && (
                      <button
                        type="button"
                        onClick={() => {
                          onFiltrarFecha(diaSeleccionadoObj.fechaStr!)
                          onCerrar()
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#9B0F06] text-white hover:bg-[#7D0C05] text-[10.5px] font-semibold transition-all cursor-pointer shadow-2xs active:scale-95"
                      >
                        <Filter size={11} />
                        <span>Ver en lista</span>
                      </button>
                    )}

                    {diaSeleccionadoObj.estadoColor === 'rojo' && onCrearRegistroEnFecha && (
                      <button
                        type="button"
                        onClick={() => {
                          onCrearRegistroEnFecha(diaSeleccionadoObj.fechaStr!)
                          onCerrar()
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#9B0F06] text-white hover:bg-[#7D0C05] text-[10.5px] font-semibold transition-all cursor-pointer shadow-2xs active:scale-95"
                      >
                        <Plus size={12} />
                        <span>Registrar bitácora atrasada</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Desglose de registros de la fecha */}
                {registrosDelDia.length > 0 ? (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {registrosDelDia.map((reg: any, i: number) => (
                      <div
                        key={reg.id || `reg-${i}`}
                        className="p-2 rounded-lg bg-white border border-gray-200 text-[11px] space-y-1 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-gray-800 truncate">
                            {reg.titulo || 'Registro de Bitácora'}
                          </span>
                          <span className="text-[10px] font-mono text-gray-500 shrink-0">
                            {reg.hora || '12:00'} · {reg.turno || 'Diurno'}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-gray-600 line-clamp-2">
                          {reg.descripcion || 'Sin descripción'}
                        </p>
                        <div className="flex items-center justify-between text-[9.5px] text-gray-400 pt-0.5">
                          <span>Por: {reg.autor || 'Ingeniero Residente'}</span>
                          <span>Ubicación: {reg.ubicacion || 'Frente de Obra'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : diaSeleccionadoObj.estadoColor === 'rojo' ? (
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-red-100/50 border border-red-200 text-red-900 text-[10.5px]">
                    <AlertTriangle size={14} className="text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Día laboral transcurrido sin registro de campo.</p>
                      <p className="text-[10px] text-red-700 mt-0.5">
                        Este día corresponde al plazo contractual pero no tiene ninguna bitácora registrada o publicada.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-500 text-[10.5px] py-1">
                    <Info size={13} className="text-gray-400" />
                    <span>Día programado dentro del calendario contractual de la obra vial.</span>
                  </div>
                )}
              </div>
            )}

            {/* Leyenda explicativa al pie */}
            <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-[10px] text-gray-500">
              <span className="font-bold text-gray-700">Leyenda:</span>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span>Día con registro (Laborado)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  <span>Sin registro (Atrasado)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span>Con suspensión laboral</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
                  <span>Programado / Futuro</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  )
}
