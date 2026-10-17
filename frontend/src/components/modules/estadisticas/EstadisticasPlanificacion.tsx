'use client'

import React, { useState, useMemo } from 'react'
import { Download, FileSpreadsheet, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { exportarElementoComoSvg, exportarTablaCsv } from './estadisticasExport'
import { useCustomToast } from '@/hooks/useCustomToast'

interface EstadisticasPlanificacionProps {
  proyectos?: any[]
  proyectoSeleccionado?: any
  proyectoDetalle?: any
  renglonesProyecto?: any[]
  renglonesCatalogo?: any[]
}

export function EstadisticasPlanificacion({
  proyectos: _proyectos = [],
  proyectoSeleccionado,
  proyectoDetalle,
  renglonesProyecto = [],
  renglonesCatalogo = [],
}: EstadisticasPlanificacionProps) {
  const { showSuccessToast } = useCustomToast()

  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [paginaActual, setPaginaActual] = useState(1)
  const [registrosPorPagina, setRegistrosPorPagina] = useState(5)

  // Consolidar información detallada del proyecto seleccionado
  const proy = useMemo(() => {
    return { ...(proyectoSeleccionado || {}), ...(proyectoDetalle || {}) }
  }, [proyectoSeleccionado, proyectoDetalle])

  // Obtener lista real de renglones del proyecto
  const listaRenglones = useMemo(() => {
    if (Array.isArray(renglonesProyecto) && renglonesProyecto.length > 0) {
      return renglonesProyecto
    }
    if (Array.isArray(proy.renglones) && proy.renglones.length > 0) {
      return proy.renglones
    }
    if (Array.isArray(proy.renglones_sabana) && proy.renglones_sabana.length > 0) {
      return proy.renglones_sabana
    }
    const idProy = String(proy.id || '')
    const deCat = renglonesCatalogo.filter((r) => String(r.proyecto_id) === idProy)
    if (deCat.length > 0) return deCat
    return []
  }, [renglonesProyecto, proy, renglonesCatalogo])

  // Determinar los datos de planificación dinámicamente según el proyecto seleccionado
  const { avanceFisicoReal, avanceProgramadoReal, totalRenglones, renglonesAprobados, renglonesEnProceso, renglonesPendientes } = useMemo(() => {
    const avanceBase = Number(proy.avance_fisico ?? proy.porcentaje_avance ?? proy.avance ?? 0)

    // Fechas contractuales reales
    const fIniStr = proy.fecha_inicio_contractual || proy.fecha_inicio || proy.fechaInicioContractual || '2026-01-01'
    const fFinStr = proy.fecha_finalizacion_real || proy.fecha_fin_estimada || proy.fecha_fin || proy.fechaFinContractualPlan || '2026-12-31'
    const dIni = new Date(fIniStr)
    const dFin = new Date(fFinStr)
    const dHoy = new Date()

    let progCalculado = Number(proy.avance_programado ?? 0)
    if (!progCalculado && !isNaN(dIni.getTime()) && !isNaN(dFin.getTime())) {
      const totalDias = Math.max(1, (dFin.getTime() - dIni.getTime()) / (1000 * 3600 * 24))
      const transcurridos = Math.max(0, Math.min(totalDias, (dHoy.getTime() - dIni.getTime()) / (1000 * 3600 * 24)))
      const t = transcurridos / totalDias
      progCalculado = Math.round((3 * t * t - 2 * t * t * t) * 100)
    }

    if (listaRenglones.length > 0) {
      let aprob = 0
      let enProc = 0
      let pend = 0
      let sumaCantContrato = 0
      let sumaCantEjec = 0

      listaRenglones.forEach((r: any) => {
        const cantCont = Number(r.cantidadContratada ?? r.cantidad_contractual ?? r.cantidadAjustada ?? 1)
        const cantEjec = Number(r.cantidadAcumuladaAnterior ?? r.cantidad_ejecutada ?? 0) + Number(r.cantidadEstePeriodo ?? 0)
        const pct = cantCont > 0 ? (cantEjec / cantCont) * 100 : Number(r.porcentajeAvance ?? 0)

        sumaCantContrato += cantCont * Number(r.costoUnitarioDirecto ?? r.precio_unitario_directo ?? 1)
        sumaCantEjec += cantEjec * Number(r.costoUnitarioDirecto ?? r.precio_unitario_directo ?? 1)

        if (pct >= 100 || r.estado === 'Aprobado' || r.estado === 'Trasladado') {
          aprob++
        } else if (pct > 0 || r.estado === 'En Progreso') {
          enProc++
        } else {
          pend++
        }
      })

      const avancePonderado = sumaCantContrato > 0
        ? Math.min(100, Math.round((sumaCantEjec / sumaCantContrato) * 100))
        : avanceBase

      return {
        avanceFisicoReal: avanceBase > 0 ? avanceBase : avancePonderado,
        avanceProgramadoReal: progCalculado > 0 ? progCalculado : Math.min(100, avanceBase + 5),
        totalRenglones: listaRenglones.length,
        renglonesAprobados: aprob,
        renglonesEnProceso: enProc,
        renglonesPendientes: pend,
      }
    }

    // Si no hay renglones en el proyecto, mantener métricas reales en 0
    return {
      avanceFisicoReal: avanceBase,
      avanceProgramadoReal: progCalculado,
      totalRenglones: 0,
      renglonesAprobados: 0,
      renglonesEnProceso: 0,
      renglonesPendientes: 0,
    }
  }, [proy, listaRenglones])

  // Capítulos de obra vial dinámicos calculados exclusivamente a partir de los renglones reales del proyecto
  const capitulosData = useMemo(() => {
    // Si existen renglones reales, agruparlos por capítulo
    if (listaRenglones.length > 0) {
      const grupos: Record<string, { id: string; codigo: string; cap: string; renglones: any[] }> = {}

      listaRenglones.forEach((r: any) => {
        const cId = String(r.capituloId || r.capitulo_id || 1)
        const capNombre = r.capituloNombre || r.capitulo_nombre || `Capítulo ${cId}`
        const capCod = r.capituloCodigo || `CAP-${cId}`

        if (!grupos[cId]) {
          grupos[cId] = { id: cId, codigo: capCod, cap: capNombre, renglones: [] }
        }
        grupos[cId].renglones.push(r)
      })

      const resultado = Object.values(grupos).map((g) => {
        let sumaCont = 0
        let sumaEjec = 0
        g.renglones.forEach((r) => {
          const cont = Number(r.cantidadContratada ?? r.cantidad_contractual ?? 1)
          const ejec = Number(r.cantidadAcumuladaAnterior ?? r.cantidad_ejecutada ?? 0) + Number(r.cantidadEstePeriodo ?? 0)
          const pu = Number(r.costoUnitarioDirecto ?? r.precio_unitario_directo ?? 1)
          sumaCont += cont * pu
          sumaEjec += ejec * pu
        })

        const pctEjec = sumaCont > 0 ? Math.min(100, Math.round((sumaEjec / sumaCont) * 100)) : 0
        const pctProg = avanceProgramadoReal

        let estado = 'En tiempo'
        if (pctEjec >= 100) estado = 'Completado'
        else if (pctEjec > pctProg) estado = 'Adelantado'
        else if (pctProg - pctEjec > 12) estado = 'Retraso leve'
        else if (pctEjec === 0) estado = 'Por Iniciar'

        return {
          id: g.id,
          codigo: g.codigo,
          cap: g.cap,
          total: g.renglones.length,
          prog: pctProg,
          ejec: pctEjec,
          estado,
        }
      })

      if (resultado.length > 0) {
        return resultado.sort((a, b) => Number(a.id) - Number(b.id))
      }
    }

    return []
  }, [listaRenglones, avanceProgramadoReal])

  // Puntos mensuales de la Curva S dinámicos basados en la línea de tiempo real del proyecto
  const mesesCurvaS = useMemo(() => {
    const fIniRaw = proy.fecha_inicio_contractual || proy.fecha_inicio || proy.fechaInicioContractual
    const fFinRaw = proy.fecha_finalizacion_real || proy.fecha_fin_estimada || proy.fecha_fin || proy.fechaFinContractualPlan

    if (!fIniRaw || !fFinRaw) return []

    const dIni = new Date(fIniRaw.length === 10 ? fIniRaw + 'T00:00:00' : fIniRaw)
    const dFin = new Date(fFinRaw.length === 10 ? fFinRaw + 'T00:00:00' : fFinRaw)

    if (isNaN(dIni.getTime()) || isNaN(dFin.getTime()) || dFin <= dIni) return []

    const mesesNombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    const listaMeses: Array<{ mes: string; año: number; mesIdx: number }> = []

    const cursor = new Date(dIni.getFullYear(), dIni.getMonth(), 1)
    const limite = new Date(dFin.getFullYear(), dFin.getMonth(), 1)

    let safety = 0
    while (cursor <= limite && safety < 36) {
      listaMeses.push({
        mes: `${mesesNombres[cursor.getMonth()]} ${String(cursor.getFullYear()).slice(-2)}`,
        año: cursor.getFullYear(),
        mesIdx: cursor.getMonth(),
      })
      cursor.setMonth(cursor.getMonth() + 1)
      safety++
    }

    if (listaMeses.length === 0) return []

    const total = listaMeses.length
    const dHoy = new Date()
    const mesesTranscurridos = Math.max(
      0,
      Math.min(
        total - 1,
        (dHoy.getFullYear() - dIni.getFullYear()) * 12 + (dHoy.getMonth() - dIni.getMonth())
      )
    )

    return listaMeses.map((m, idx) => {
      // Función S-curve estándar: S(t) = 3t^2 - 2t^3
      const t = idx / Math.max(1, total - 1)
      const progVal = Math.min(100, Math.round((3 * t * t - 2 * t * t * t) * 100))

      let ejecVal = 0
      if (idx <= mesesTranscurridos) {
        const factorAvance = mesesTranscurridos > 0 ? idx / mesesTranscurridos : 0
        ejecVal = Math.min(100, Math.round(avanceFisicoReal * (3 * factorAvance * factorAvance - 2 * factorAvance * factorAvance * factorAvance)))
      }

      return {
        mes: m.mes,
        programado: progVal,
        ejecutado: ejecVal,
      }
    })
  }, [proy, avanceFisicoReal, avanceProgramadoReal])

  const capitulosFiltrados = useMemo(() => {
    return capitulosData.filter((c) => {
      const matchText =
        c.cap.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.codigo.toLowerCase().includes(busqueda.toLowerCase())
      const matchEstado = filtroEstado === 'todos' || c.estado.toLowerCase() === filtroEstado.toLowerCase()
      return matchText && matchEstado
    })
  }, [capitulosData, busqueda, filtroEstado])

  const totalPaginas = Math.ceil(capitulosFiltrados.length / registrosPorPagina) || 1
  const datosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * registrosPorPagina
    return capitulosFiltrados.slice(inicio, inicio + registrosPorPagina)
  }, [capitulosFiltrados, paginaActual, registrosPorPagina])

  const handleExportSvg = (id: string, nombre: string) => {
    exportarElementoComoSvg(id, nombre)
    showSuccessToast(`Gráfica "${nombre}" exportada en formato SVG`)
  }

  const handleExportCsv = () => {
    const headers = ['Código', 'Capítulo de Obra', 'Total Renglones', '% Programado', '% Ejecutado', 'Estado']
    const rows = capitulosFiltrados.map((c) => [
      c.codigo,
      c.cap,
      c.total,
      `${c.prog}%`,
      `${c.ejec}%`,
      c.estado,
    ])
    exportarTablaCsv(headers, rows, 'Estadisticas_Planificacion_Avance_Fisico')
    showSuccessToast('Datos de planificación exportados a CSV')
  }

  return (
    <div className="space-y-4 font-poppins">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Gráfica Curva S Dinámica */}
        <div id="chart-curva-s" className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs space-y-3 font-poppins">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <div>
              <h3 className="text-xs font-bold text-gray-900 font-poppins">Curva S (Programado vs Ejecutado)</h3>
              <p className="text-[9.5px] text-gray-400 font-poppins truncate max-w-[280px]">
                {proy.codigo ? `${proy.codigo} · ` : ''}{proy.nombre || proy.nombre_oficial || 'Proyecto en ejecución'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleExportSvg('chart-curva-s', 'Curva S Cronograma')}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-600 hover:text-[#9B0F06] transition-colors border border-gray-200 rounded px-2 py-1 bg-white hover:bg-gray-50 cursor-pointer font-poppins"
            >
              <Download size={12} />
              <span>SVG</span>
            </button>
          </div>

          {mesesCurvaS.length === 0 ? (
            <div className="h-44 w-full flex flex-col items-center justify-center p-4 text-center bg-gray-50/50 rounded-lg border border-dashed border-gray-200 text-gray-400 font-poppins">
              <p className="text-xs font-semibold text-gray-500">Sin cronograma contractual</p>
              <p className="text-[9.5px] mt-1 text-gray-400">Defina las fechas de inicio y terminación del proyecto para visualizar la Curva S.</p>
            </div>
          ) : (
            <div className="h-44 w-full flex items-end justify-between gap-1.5 pt-4 pb-2 px-2 border-b border-gray-100 bg-gray-50/50 rounded-lg font-poppins">
              {mesesCurvaS.map((item, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-gray-900 text-white text-[9px] py-0.5 px-1.5 rounded pointer-events-none transition-opacity font-poppins z-10 whitespace-nowrap shadow">
                    Prog: {item.programado}% {item.ejecutado > 0 ? `· Ejec: ${item.ejecutado}%` : ''}
                  </div>
                  <div className="w-full flex items-end justify-center gap-0.5 h-full">
                    <div className="w-full max-w-[10px] bg-red-200 rounded-t transition-all" style={{ height: `${item.programado}%` }} />
                    {item.ejecutado > 0 && (
                      <div className="w-full max-w-[10px] bg-[#9B0F06] rounded-t transition-all" style={{ height: `${item.ejecutado}%` }} />
                    )}
                  </div>
                  <span className="text-[8.5px] text-gray-500 font-poppins truncate max-w-[45px]">{item.mes}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between text-[9.5px] text-gray-500 font-poppins pt-1">
            <span className="flex items-center gap-1.5 font-poppins">
              <span className="w-2.5 h-2.5 rounded bg-red-200 inline-block" /> Programado ({avanceProgramadoReal}%)
            </span>
            <span className="flex items-center gap-1.5 font-poppins font-bold text-[#9B0F06]">
              <span className="w-2.5 h-2.5 rounded bg-[#9B0F06] inline-block" /> Ejecutado ({avanceFisicoReal}%)
            </span>
          </div>
        </div>

        {/* Gráfica Avance por Capítulo */}
        <div id="chart-avance-capitulo" className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs space-y-3 font-poppins">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <div>
              <h3 className="text-xs font-bold text-gray-900 font-poppins">Avance por Capítulo (% Ejecutado)</h3>
              <p className="text-[9.5px] text-gray-400 font-poppins">Cumplimiento físico por especialidad vial</p>
            </div>
            <button
              type="button"
              onClick={() => handleExportSvg('chart-avance-capitulo', 'Avance por Capitulo')}
              className="p-1 text-gray-400 hover:text-[#9B0F06] transition-colors cursor-pointer"
              title="Exportar como SVG"
            >
              <Download size={13} />
            </button>
          </div>

          <div className="space-y-2.5 text-[10px] font-poppins">
            {capitulosData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-36 text-center text-gray-400 font-poppins">
                <p className="text-xs font-semibold text-gray-500">Sin capítulos registrados</p>
                <p className="text-[9.5px] text-gray-400 mt-1">Este proyecto aún no tiene partidas ni capítulos configurados.</p>
              </div>
            ) : (
              capitulosData.slice(0, 5).map((c) => (
                <div key={c.codigo} className="space-y-1">
                  <div className="flex justify-between text-[9.5px]">
                    <span className="text-gray-700 font-medium truncate max-w-[200px] font-poppins">{c.cap}</span>
                    <span className="font-bold text-gray-900 font-poppins">{c.ejec}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#9B0F06] h-full rounded-full transition-all" style={{ width: `${c.ejec}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Gráfica Distribución de Renglones */}
        <div id="chart-distribucion-renglones" className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs space-y-3 font-poppins">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <div>
              <h3 className="text-xs font-bold text-gray-900 font-poppins">Distribución de Renglones</h3>
              <p className="text-[9.5px] text-gray-400 font-poppins">Total partidas activas en proyecto</p>
            </div>
            <button
              type="button"
              onClick={() => handleExportSvg('chart-distribucion-renglones', 'Distribucion por Estado')}
              className="p-1 text-gray-400 hover:text-[#9B0F06] transition-colors cursor-pointer"
              title="Exportar como SVG"
            >
              <Download size={13} />
            </button>
          </div>

          <div className="flex items-center justify-center h-36">
            <div
              className="relative w-28 h-28 rounded-full border-8 border-gray-100 flex items-center justify-center shadow-inner"
              style={{
                background: totalRenglones > 0
                  ? `conic-gradient(#059669 0% ${Math.round((renglonesAprobados / (totalRenglones || 1)) * 100)}%, #E85D04 ${Math.round((renglonesAprobados / (totalRenglones || 1)) * 100)}% ${Math.round(((renglonesAprobados + renglonesEnProceso) / (totalRenglones || 1)) * 100)}%, #9B0F06 ${Math.round(((renglonesAprobados + renglonesEnProceso) / (totalRenglones || 1)) * 100)}% 100%)`
                  : '#F3F4F6',
              }}
            >
              <div className="w-16 h-16 bg-white rounded-full flex flex-col items-center justify-center shadow-xs">
                <span className="text-xs font-bold text-gray-900 font-poppins">{totalRenglones}</span>
                <span className="text-[7px] text-gray-400 uppercase tracking-widest font-poppins">Partidas</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 text-center text-[9px] font-poppins pt-1">
            <span className="text-emerald-700 font-semibold font-poppins">Aprobadas: {renglonesAprobados}</span>
            <span className="text-orange-700 font-semibold font-poppins">En Proceso: {renglonesEnProceso}</span>
            <span className="text-red-700 font-semibold font-poppins">Pendientes: {renglonesPendientes}</span>
          </div>
        </div>
      </div>

      {/* TABLA DE DATOS CRUDOS DE PLANIFICACIÓN CON BUSCADOR, FILTROS Y PAGINACIÓN */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs space-y-3 font-poppins">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={15} className="text-[#9B0F06]" />
            <h3 className="text-xs font-bold text-gray-900 font-poppins">Datos Crudos: Planificación y Avance Físico por Capítulo</h3>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 font-poppins w-full sm:w-auto">
            {/* Buscador */}
            <div className="relative flex-1 sm:flex-initial min-w-[130px]">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value)
                  setPaginaActual(1)
                }}
                placeholder="Buscar por código..."
                className="h-7 sm:h-8 w-full sm:w-44 pl-7 pr-2.5 text-[9.5px] sm:text-[11px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#9B0F06] transition-colors bg-gray-50 font-medium font-poppins"
              />
            </div>

            {/* Filtro Estado */}
            <select
              value={filtroEstado}
              onChange={(e) => {
                setFiltroEstado(e.target.value)
                setPaginaActual(1)
              }}
              className="h-7 sm:h-8 px-2 text-[9.5px] sm:text-[11px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#9B0F06] transition-colors bg-gray-50 font-medium text-gray-700 font-poppins shrink-0"
            >
              <option value="todos">Todos los Estados</option>
              <option value="completado">Completado</option>
              <option value="en tiempo">En tiempo</option>
              <option value="adelantado">Adelantado</option>
              <option value="retraso leve">Retraso leve</option>
              <option value="por iniciar">Por Iniciar</option>
            </select>

            {/* Exportar CSV */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="h-7 sm:h-8 inline-flex items-center gap-1 px-2.5 sm:px-3 bg-white border border-gray-200 hover:border-[#9B0F06] hover:text-[#9B0F06] text-gray-700 text-[9.5px] sm:text-[11px] font-semibold rounded-lg transition-colors shadow-2xs cursor-pointer font-poppins shrink-0"
            >
              <Download size={11} />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-left text-[10.5px] font-poppins">
            <thead>
              <tr className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200 text-[9.5px] uppercase tracking-wider font-poppins">
                <th className="p-2.5 w-24">Código</th>
                <th className="p-2.5 min-w-[200px]">Capítulo / Tramo</th>
                <th className="p-2.5 text-right">Renglones</th>
                <th className="p-2.5 text-right">% Programado</th>
                <th className="p-2.5 text-right">% Ejecutado</th>
                <th className="p-2.5 text-center w-28">Estado General</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {datosPaginados.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/80 transition-colors font-poppins">
                  <td className="p-2.5 text-[#9B0F06] font-bold font-poppins">{row.codigo}</td>
                  <td className="p-2.5 font-medium text-gray-800 font-poppins">{row.cap}</td>
                  <td className="p-2.5 text-right text-gray-700 font-poppins">{row.total}</td>
                  <td className="p-2.5 text-right text-gray-500 font-poppins">{row.prog}%</td>
                  <td className="p-2.5 text-right font-bold text-gray-900 font-poppins">{row.ejec}%</td>
                  <td className="p-2.5 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-semibold border font-poppins ${
                        row.estado === 'Completado'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : row.estado === 'En tiempo'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : row.estado === 'Adelantado'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : row.estado === 'Retraso leve'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-gray-100 text-gray-600 border-gray-200'
                      }`}
                    >
                      {row.estado}
                    </span>
                  </td>
                </tr>
              ))}
              {datosPaginados.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400 text-xs font-poppins">
                    No se encontraron capítulos ni renglones de trabajo para el proyecto seleccionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div data-paginacion="true" className="paginacion-control flex flex-wrap items-center justify-between text-[9.5px] sm:text-[11px] pt-2 text-gray-500 gap-2 font-[Poppins]">
          <div className="flex items-center gap-2">
            <span className="font-[Poppins]">
              Mostrando {capitulosFiltrados.length === 0 ? 0 : (paginaActual - 1) * registrosPorPagina + 1} a{' '}
              {Math.min(paginaActual * registrosPorPagina, capitulosFiltrados.length)} de {capitulosFiltrados.length} registros
            </span>
            <select
              value={registrosPorPagina}
              onChange={(e) => {
                setRegistrosPorPagina(Number(e.target.value))
                setPaginaActual(1)
              }}
              className="paginacion-control h-6 px-1.5 text-[9.5px] sm:text-[10.5px] border border-gray-200 rounded bg-white font-normal text-gray-700 focus:outline-none font-[Poppins]"
            >
              <option value={5} className="text-[9.5px] font-[Poppins]">5 por pág.</option>
              <option value={10} className="text-[9.5px] font-[Poppins]">10 por pág.</option>
              <option value={20} className="text-[9.5px] font-[Poppins]">20 por pág.</option>
            </select>
          </div>

          <div className="flex items-center gap-1 font-[Poppins]">
            <button
              type="button"
              onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
              disabled={paginaActual === 1}
              className="h-6 sm:h-7 px-2 inline-flex items-center gap-1 rounded border border-gray-200 bg-white text-gray-700 font-normal hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-[Poppins] text-[9.5px]"
            >
              <ChevronLeft size={12} />
              <span>Anterior</span>
            </button>
            <span className="px-1.5 text-[9.5px] sm:text-[10.5px] font-normal text-gray-800 font-[Poppins]">
              {paginaActual} / {totalPaginas}
            </span>
            <button
              type="button"
              onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
              disabled={paginaActual >= totalPaginas}
              className="h-6 sm:h-7 px-2 inline-flex items-center gap-1 rounded border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-[Poppins] text-[9.5px]"
            >
              <span>Siguiente</span>
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
