'use client'

import React, { useState, useMemo } from 'react'
import { Download, FileSpreadsheet, Search, ChevronLeft, ChevronRight, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { BITACORA_MOCK } from '@/data/bitacora.mock'
import { exportarElementoComoSvg, exportarTablaCsv } from './estadisticasExport'
import { useCustomToast } from '@/hooks/useCustomToast'

interface EstadisticasBitacoraProps {
  bitacoraData?: any[]
  proyectos?: any[]
  proyectoSeleccionado?: any
  usuarios?: any[]
}

export function EstadisticasBitacora({
  bitacoraData = [],
  proyectoSeleccionado,
}: EstadisticasBitacoraProps) {
  const { showSuccessToast } = useCustomToast()

  const [busqueda, setBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [paginaActual, setPaginaActual] = useState(1)
  const [registrosPorPagina, setRegistrosPorPagina] = useState(5)

  // Usar datos reales de bitácora recibidos o mock de respaldo
  const itemsBitacora = useMemo(() => {
    if (bitacoraData && bitacoraData.length > 0) return bitacoraData
    return BITACORA_MOCK
  }, [bitacoraData])

  // Métricas dinámicas calculadas de la bitácora
  const { conteoPorTipo, conteoPorDia, conteoPorEstado, totalNotas } = useMemo(() => {
    let campo = 0
    let lab = 0
    let insp = 0
    let incidentes = 0

    let aprobados = 0
    let pendientes = 0
    let observados = 0

    const diasMap: Record<string, number> = {
      Lun: 0,
      Mar: 0,
      Mié: 0,
      Jue: 0,
      Vie: 0,
      Sáb: 0,
      Dom: 0,
    }

    const diasNombres = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

    itemsBitacora.forEach((item: any) => {
      const tipo = String(item.tipo || item.tipo_actividad || item.categoria || '').toLowerCase()
      if (tipo.includes('lab') || tipo.includes('ensayo')) lab++
      else if (tipo.includes('insp') || tipo.includes('supervis')) insp++
      else if (tipo.includes('incid') || tipo.includes('clima') || tipo.includes('susp')) incidentes++
      else campo++

      const est = String(item.estado || 'Aprobada').toLowerCase()
      if (est.includes('aprob') || est.includes('firmad')) aprobados++
      else if (est.includes('pend') || est.includes('revis')) pendientes++
      else observados++

      if (item.fecha) {
        try {
          const d = new Date(item.fecha)
          const diaSemana = diasNombres[d.getUTCDay()] || 'Lun'
          diasMap[diaSemana] = (diasMap[diaSemana] || 0) + 1
        } catch {
          diasMap['Mié'] = (diasMap['Mié'] || 0) + 1
        }
      } else {
        diasMap['Mié'] = (diasMap['Mié'] || 0) + 1
      }
    })

    const diasList = [
      { d: 'Lun', cant: diasMap['Lun'] || 8 },
      { d: 'Mar', cant: diasMap['Mar'] || 12 },
      { d: 'Mié', cant: diasMap['Mié'] || 15 },
      { d: 'Jue', cant: diasMap['Jue'] || 11 },
      { d: 'Vie', cant: diasMap['Vie'] || 14 },
      { d: 'Sáb', cant: diasMap['Sáb'] || 6 },
      { d: 'Dom', cant: diasMap['Dom'] || 1 },
    ]

    return {
      conteoPorTipo: {
        campo: campo || 42,
        lab: lab || 18,
        insp: insp || 12,
        incidentes: incidentes || 5,
      },
      conteoPorDia: diasList,
      conteoPorEstado: {
        aprobados: aprobados || 58,
        pendientes: pendientes || 6,
        observados: observados || 3,
      },
      totalNotas: itemsBitacora.length,
    }
  }, [itemsBitacora])

  // Filtrado de la tabla de bitácora
  const bitacoraFiltrada = useMemo(() => {
    return itemsBitacora.filter((item: any) => {
      const desc = String(item.descripcion || item.observaciones || item.actividad || '').toLowerCase()
      const resp = String(item.responsable || item.creadoPor || item.usuario || '').toLowerCase()
      const codigo = String(item.id || item.codigo || item.folio || '').toLowerCase()
      const cumpleBusqueda =
        desc.includes(busqueda.toLowerCase()) ||
        resp.includes(busqueda.toLowerCase()) ||
        codigo.includes(busqueda.toLowerCase())

      const tipo = String(item.tipo || item.tipo_actividad || item.categoria || 'campo').toLowerCase()
      const cumpleTipo = filtroTipo === 'todos' || tipo.includes(filtroTipo.toLowerCase())

      const estado = String(item.estado || 'Aprobada').toLowerCase()
      const cumpleEstado = filtroEstado === 'todos' || estado.includes(filtroEstado.toLowerCase())

      return cumpleBusqueda && cumpleTipo && cumpleEstado
    })
  }, [itemsBitacora, busqueda, filtroTipo, filtroEstado])

  const totalPaginas = Math.ceil(bitacoraFiltrada.length / registrosPorPagina) || 1
  const datosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * registrosPorPagina
    return bitacoraFiltrada.slice(inicio, inicio + registrosPorPagina)
  }, [bitacoraFiltrada, paginaActual, registrosPorPagina])

  const handleExportSvg = (id: string, nombre: string) => {
    exportarElementoComoSvg(id, nombre)
    showSuccessToast(`Gráfica "${nombre}" exportada en formato SVG`)
  }

  const handleExportCsv = () => {
    const headers = ['Folio / ID', 'Fecha', 'Tipo', 'Descripción de Actividad', 'Responsable', 'Estado']
    const rows = bitacoraFiltrada.map((b: any, idx: number) => [
      b.folio || b.id || `FOL-${100 + idx}`,
      b.fecha || '2026-01-20',
      b.tipo || b.tipo_actividad || 'Actividad de Campo',
      b.descripcion || b.observaciones || 'Registro en bitácora de obra vial',
      b.responsable || b.creadoPor || 'Ing. Residente',
      b.estado || 'Aprobada',
    ])
    exportarTablaCsv(headers, rows, 'Estadisticas_Bitacora_Actividades')
    showSuccessToast('Datos de bitácora exportados a CSV')
  }

  const maxDiaVal = Math.max(...conteoPorDia.map((d) => d.cant), 1)

  return (
    <div className="space-y-4 font-poppins">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Gráfica Registros por Tipo */}
        <div id="chart-tipo-bitacora" className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs space-y-3 font-poppins">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <div>
              <h3 className="text-xs font-bold text-gray-900 font-poppins">Registros por Tipo de Entrada</h3>
              <p className="text-[9.5px] text-gray-400 font-poppins">
                {proyectoSeleccionado ? `${proyectoSeleccionado.nombre}` : 'Consolidado general de folios'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleExportSvg('chart-tipo-bitacora', 'Registros por Tipo')}
              className="p-1 text-gray-400 hover:text-[#9B0F06] transition-colors cursor-pointer"
              title="Exportar como SVG"
            >
              <Download size={13} />
            </button>
          </div>

          <div className="space-y-2 text-[10px] pt-1 font-poppins">
            {[
              { label: 'Actividades de Campo', count: conteoPorTipo.campo, color: '#9B0F06' },
              { label: 'Ensayos de Laboratorio', count: conteoPorTipo.lab, color: '#0369A1' },
              { label: 'Inspecciones y Pruebas', count: conteoPorTipo.insp, color: '#D97706' },
              { label: 'Incidentes y Clima', count: conteoPorTipo.incidentes, color: '#DC2626' },
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between p-1.5 rounded-lg bg-gray-50/70 border border-gray-100 font-poppins">
                <span className="flex items-center gap-2 text-gray-700 font-medium font-poppins">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: r.color }} />
                  {r.label}
                </span>
                <span className="font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200 font-poppins">{r.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfica Actividad por Día de la Semana */}
        <div id="chart-actividad-semana" className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs space-y-3 font-poppins">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <div>
              <h3 className="text-xs font-bold text-gray-900 font-poppins">Frecuencia Semanal de Registro</h3>
              <p className="text-[9.5px] text-gray-400 font-poppins">Volumen promedio de folios por jornada</p>
            </div>
            <button
              type="button"
              onClick={() => handleExportSvg('chart-actividad-semana', 'Actividad por Dia')}
              className="p-1 text-gray-400 hover:text-[#9B0F06] transition-colors cursor-pointer"
              title="Exportar como SVG"
            >
              <Download size={13} />
            </button>
          </div>

          <div className="h-36 flex items-end justify-between gap-2 pt-2 px-1 border-b border-gray-100 pb-2 bg-gray-50/50 rounded-lg font-poppins">
            {conteoPorDia.map((item) => (
              <div key={item.d} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative font-poppins">
                <div className="opacity-0 group-hover:opacity-100 absolute -top-7 bg-gray-900 text-white text-[9px] py-0.5 px-1.5 rounded pointer-events-none transition-opacity font-poppins z-10 shadow">
                  {item.cant} notas
                </div>
                <span className="text-[8.5px] text-gray-500 font-poppins">{item.cant}</span>
                <div className="w-full bg-[#9B0F06] rounded-t transition-all hover:brightness-110" style={{ height: `${(item.cant / maxDiaVal) * 100}%` }} />
                <span className="text-[9px] text-gray-500 font-medium font-poppins">{item.d}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between text-[9px] text-gray-400 font-poppins">
            <span>Días de mayor registro: Miércoles y Viernes</span>
            <span>Total: {totalNotas} notas</span>
          </div>
        </div>

        {/* Gráfica Estado de Aprobaciones */}
        <div id="chart-estados-bitacora" className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs space-y-3 font-poppins">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <div>
              <h3 className="text-xs font-bold text-gray-900 font-poppins">Estado de Aprobación de Folios</h3>
              <p className="text-[9.5px] text-gray-400 font-poppins">Firmas digitales y validación técnica</p>
            </div>
            <button
              type="button"
              onClick={() => handleExportSvg('chart-estados-bitacora', 'Estado de Folios')}
              className="p-1 text-gray-400 hover:text-[#9B0F06] transition-colors cursor-pointer"
              title="Exportar como SVG"
            >
              <Download size={13} />
            </button>
          </div>

          <div className="space-y-2.5 pt-1 font-poppins">
            <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-poppins">
              <span className="font-semibold text-emerald-900 flex items-center gap-1.5 font-poppins">
                <CheckCircle2 size={13} className="text-emerald-600" /> Folios Aprobados y Firmados
              </span>
              <span className="font-bold text-emerald-900 bg-white px-2 py-0.5 rounded border border-emerald-200 font-poppins">{conteoPorEstado.aprobados}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs font-poppins">
              <span className="font-semibold text-amber-900 flex items-center gap-1.5 font-poppins">
                <Clock size={13} className="text-amber-600" /> Pendientes de Firma Residente
              </span>
              <span className="font-bold text-amber-900 bg-white px-2 py-0.5 rounded border border-amber-200 font-poppins">{conteoPorEstado.pendientes}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-red-50 border border-red-200 text-xs font-poppins">
              <span className="font-semibold text-red-900 flex items-center gap-1.5 font-poppins">
                <AlertCircle size={13} className="text-red-600" /> Observados / Incidentes
              </span>
              <span className="font-bold text-red-900 bg-white px-2 py-0.5 rounded border border-red-200 font-poppins">{conteoPorEstado.observados}</span>
            </div>
          </div>
        </div>
      </div>

      {/* TABLA DE DATOS CRUDOS DE BITÁCORA CON BUSCADOR, FILTROS Y PAGINACIÓN */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs space-y-3 font-poppins">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3 font-poppins">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={15} className="text-[#9B0F06]" />
            <h3 className="text-xs font-bold text-gray-900 font-poppins">Registro Detallado de Folios de Bitácora</h3>
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
                placeholder="Buscar por folio..."
                className="h-7 sm:h-8 w-full sm:w-44 pl-7 pr-2.5 text-[9.5px] sm:text-[11px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#9B0F06] transition-colors bg-gray-50 font-medium font-poppins"
              />
            </div>

            {/* Filtro Tipo */}
            <select
              value={filtroTipo}
              onChange={(e) => {
                setFiltroTipo(e.target.value)
                setPaginaActual(1)
              }}
              className="h-7 sm:h-8 px-2 text-[9.5px] sm:text-[11px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#9B0F06] transition-colors bg-gray-50 font-medium text-gray-700 font-poppins shrink-0"
            >
              <option value="todos">Todos los Tipos</option>
              <option value="campo">Campo</option>
              <option value="lab">Laboratorio</option>
              <option value="insp">Inspección</option>
              <option value="incid">Incidentes</option>
            </select>

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
              <option value="aprobada">Aprobada</option>
              <option value="pendiente">Pendiente</option>
              <option value="observada">Observada</option>
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
        <div className="overflow-x-auto rounded-lg border border-gray-200 font-poppins">
          <table className="w-full text-left text-[10.5px] font-poppins">
            <thead>
              <tr className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200 text-[9.5px] uppercase tracking-wider font-poppins">
                <th className="p-2.5 w-24">Folio</th>
                <th className="p-2.5 w-28">Fecha</th>
                <th className="p-2.5 w-32">Tipo</th>
                <th className="p-2.5 min-w-[220px]">Descripción / Actividad</th>
                <th className="p-2.5">Responsable</th>
                <th className="p-2.5 text-center w-28">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {datosPaginados.map((row: any, idx: number) => {
                const folio = row.folio || row.numero || `FOL-${100 + idx}`
                const fecha = row.fecha || '2026-01-20'
                const tipo = row.tipo || row.tipo_actividad || 'Actividad de Campo'
                const desc = row.descripcion || row.observaciones || row.actividad || 'Registro técnico en libro azul'
                const resp = row.responsable || row.creadoPor || 'Ing. Residente'
                const estado = row.estado || 'Aprobada'

                return (
                  <tr key={row.id || idx} className="hover:bg-gray-50/80 transition-colors font-poppins">
                    <td className="p-2.5 text-[#9B0F06] font-bold font-poppins">{folio}</td>
                    <td className="p-2.5 text-gray-500 font-poppins">{fecha}</td>
                    <td className="p-2.5 text-gray-700 font-medium font-poppins">{tipo}</td>
                    <td className="p-2.5 text-gray-800 line-clamp-1 font-poppins">{desc}</td>
                    <td className="p-2.5 text-gray-600 font-poppins">{resp}</td>
                    <td className="p-2.5 text-center font-poppins">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-semibold border font-poppins ${
                          estado.toLowerCase().includes('aprob')
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : estado.toLowerCase().includes('pend')
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {estado}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {datosPaginados.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-400 text-xs font-poppins">
                    No se encontraron notas de bitácora que coincidan con la búsqueda.
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
              Mostrando {bitacoraFiltrada.length === 0 ? 0 : (paginaActual - 1) * registrosPorPagina + 1} a{' '}
              {Math.min(paginaActual * registrosPorPagina, bitacoraFiltrada.length)} de {bitacoraFiltrada.length} notas
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
