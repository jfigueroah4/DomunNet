'use client'

import React, { useState, useMemo } from 'react'
import { Download, FileSpreadsheet, Search, ChevronLeft, ChevronRight, Camera } from 'lucide-react'
import { exportarElementoComoSvg, exportarTablaCsv } from './estadisticasExport'
import { useCustomToast } from '@/hooks/useCustomToast'

interface EstadisticasRegistrosProps {
  fotografiasData?: any[]
  proyectosList?: any[]
  proyectoSeleccionado?: any
  exportSvgChart?: (name: string) => void
}

export function EstadisticasRegistros({
  fotografiasData = [],
  proyectosList: _proyectosList = [],
  proyectoSeleccionado,
}: EstadisticasRegistrosProps) {
  const { showSuccessToast } = useCustomToast()

  const [busqueda, setBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [paginaActual, setPaginaActual] = useState(1)
  const [registrosPorPagina, setRegistrosPorPagina] = useState(5)

  const itemsFotos = useMemo(() => {
    if (fotografiasData && fotografiasData.length > 0) return fotografiasData
    return fotografiasData || []
  }, [fotografiasData])

  // Top Renglones calculados dinámicamente con las fotos reales del proyecto
  const topRenglones = useMemo(() => {
    const counts: Record<string, number> = {}
    itemsFotos.forEach((f: any) => {
      const reng = f.renglon || f.codigoDGC || f.titulo || 'Partida General'
      counts[reng] = (counts[reng] || 0) + 1
    })

    const sorted = Object.entries(counts)
      .map(([cod, cant]) => ({ cod, cant }))
      .sort((a, b) => b.cant - a.cant)
      .slice(0, 5)

    if (sorted.length > 0) {
      const maxC = Math.max(...sorted.map((s) => s.cant), 1)
      return sorted.map((s) => ({ ...s, pct: Math.round((s.cant / maxC) * 100) }))
    }

    return []
  }, [itemsFotos])

  // Distribución de evidencias por categoría/tipo en el proyecto seleccionado
  const distribucionCategorias = useMemo(() => {
    if (itemsFotos.length === 0) return []
    const catCounts: Record<string, number> = {}
    itemsFotos.forEach((f: any) => {
      const cat = f.tipo || f.categoria || 'Avance de Obra'
      catCounts[cat] = (catCounts[cat] || 0) + 1
    })
    return Object.entries(catCounts)
      .map(([categoria, count]) => ({
        categoria,
        count,
        pct: Math.round((count / itemsFotos.length) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4)
  }, [itemsFotos])

  // Línea de tiempo real con los registros de evidencias más recientes
  const timelineFotos = useMemo(() => {
    if (itemsFotos.length === 0) return []
    return [...itemsFotos]
      .sort((a: any, b: any) => new Date(b.fecha || 0).getTime() - new Date(a.fecha || 0).getTime())
      .slice(0, 3)
      .map((f: any) => ({
        fecha: f.fecha || 'Sin fecha',
        desc: f.descripcion || f.titulo || 'Registro de evidencia fotográfica',
        tipo: f.tipo || f.categoria || 'Avance',
      }))
  }, [itemsFotos])

  // Filtrado de fotos
  const fotosFiltradas = useMemo(() => {
    return itemsFotos.filter((item: any) => {
      const desc = String(item.descripcion || item.titulo || item.observaciones || '').toLowerCase()
      const autor = String(item.usuario || item.autor || item.creadoPor || '').toLowerCase()
      const renglon = String(item.renglon || item.codigoDGC || '').toLowerCase()
      const cumpleBusqueda =
        desc.includes(busqueda.toLowerCase()) ||
        autor.includes(busqueda.toLowerCase()) ||
        renglon.includes(busqueda.toLowerCase())

      const tipo = String(item.tipo || item.categoria || 'Avance').toLowerCase()
      const cumpleTipo = filtroTipo === 'todos' || tipo.includes(filtroTipo.toLowerCase())

      return cumpleBusqueda && cumpleTipo
    })
  }, [itemsFotos, busqueda, filtroTipo])

  const totalPaginas = Math.ceil(fotosFiltradas.length / registrosPorPagina) || 1
  const datosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * registrosPorPagina
    return fotosFiltradas.slice(inicio, inicio + registrosPorPagina)
  }, [fotosFiltradas, paginaActual, registrosPorPagina])

  const handleExportSvg = (id: string, nombre: string) => {
    exportarElementoComoSvg(id, nombre)
    showSuccessToast(`Gráfica "${nombre}" exportada en formato SVG`)
  }

  const handleExportCsv = () => {
    const headers = ['ID', 'Fecha', 'Título / Descripción', 'Tipo', 'Renglón Asociado', 'Autor / Responsable', 'Ubicación']
    const rows = fotosFiltradas.map((f: any, idx: number) => [
      f.id || `FOT-${100 + idx}`,
      f.fecha || '2026-01-20',
      f.descripcion || f.titulo || 'Registro fotográfico de obra',
      f.tipo || 'Avance',
      f.renglon || '551.03 Pavimento',
      f.usuario || f.autor || 'Ingeniero Residente',
      f.estacion || f.ubicacion || 'Km 42+150',
    ])
    exportarTablaCsv(headers, rows, 'Estadisticas_Evidencias_Fotograficas')
    showSuccessToast('Datos de evidencias fotográficas exportados a CSV')
  }

  return (
    <div className="space-y-4 font-poppins">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-poppins">
        {/* Top Renglones con más Fotografías */}
        <div id="chart-top-renglones-fotos" className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs space-y-3 font-poppins">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <div>
              <h3 className="text-xs font-bold text-gray-900 font-poppins">Top Renglones con más Evidencias</h3>
              <p className="text-[9.5px] text-gray-400 font-poppins">Partidas con mayor registro gráfico</p>
            </div>
            <button
              type="button"
              onClick={() => handleExportSvg('chart-top-renglones-fotos', 'Top Renglones con Fotos')}
              className="p-1 text-gray-400 hover:text-[#9B0F06] transition-colors cursor-pointer"
              title="Exportar como SVG"
            >
              <Download size={13} />
            </button>
          </div>

          <div className="space-y-2 text-[10px] font-poppins">
            {topRenglones.length > 0 ? (
              topRenglones.map((r) => (
                <div key={r.cod} className="space-y-0.5">
                  <div className="flex justify-between text-[9.5px] font-poppins">
                    <span className="text-gray-700 truncate max-w-[210px] font-poppins">{r.cod}</span>
                    <span className="font-bold text-gray-900 font-poppins">{r.cant} fotos</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#9B0F06] h-full rounded-full transition-all" style={{ width: `${r.pct}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-gray-400 text-[10px]">
                No hay renglones con evidencias fotográficas registradas en este proyecto.
              </div>
            )}
          </div>
        </div>

        {/* Distribución por Categoría de Evidencia */}
        <div id="chart-evidencia-categorias" className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs space-y-3 font-poppins">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <div>
              <h3 className="text-xs font-bold text-gray-900 font-poppins">Distribución por Categoría</h3>
              <p className="text-[9.5px] text-gray-400 font-poppins">
                {proyectoSeleccionado ? `${proyectoSeleccionado.nombre}` : 'Tipos de registro en el proyecto'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleExportSvg('chart-evidencia-categorias', 'Distribución por Categoría')}
              className="p-1 text-gray-400 hover:text-[#9B0F06] transition-colors cursor-pointer"
              title="Exportar como SVG"
            >
              <Download size={13} />
            </button>
          </div>

          <div className="space-y-2 text-[10px] pt-1 font-poppins">
            {distribucionCategorias.length > 0 ? (
              distribucionCategorias.map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-200 font-poppins">
                  <span className="text-gray-800 font-medium truncate max-w-[180px] font-poppins">{cat.categoria}</span>
                  <span className="font-bold text-[#9B0F06] bg-red-50 px-2 py-0.5 rounded border border-red-200 font-poppins">
                    {cat.count} fotos ({cat.pct}%)
                  </span>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-gray-400 text-[10px]">
                Sin evidencias clasificadas para este proyecto.
              </div>
            )}
          </div>
        </div>

        {/* Línea de Tiempo de Registros Fotográficos */}
        <div id="chart-timeline-fotos" className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs space-y-3 font-poppins">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <div>
              <h3 className="text-xs font-bold text-gray-900 font-poppins">Línea de Tiempo de Evidencias</h3>
              <p className="text-[9.5px] text-gray-400 font-poppins">Últimos registros fotográficos</p>
            </div>
            <button
              type="button"
              onClick={() => handleExportSvg('chart-timeline-fotos', 'Linea de Tiempo Evidencias')}
              className="p-1 text-gray-400 hover:text-[#9B0F06] transition-colors cursor-pointer"
              title="Exportar como SVG"
            >
              <Download size={13} />
            </button>
          </div>

          <div className="space-y-2 text-[10px] font-poppins">
            {timelineFotos.length > 0 ? (
              timelineFotos.map((f, idx) => (
                <div key={idx} className="p-2 rounded-lg border border-gray-200 bg-gray-50/50 space-y-0.5 font-poppins">
                  <div className="flex items-center justify-between font-poppins">
                    <span className="font-bold text-[#9B0F06] text-[9.5px] font-poppins">{f.fecha}</span>
                    <span className="text-[8.5px] px-1.5 py-0.2 rounded bg-gray-200 text-gray-700 font-semibold font-poppins">{f.tipo}</span>
                  </div>
                  <p className="text-gray-600 line-clamp-1 font-poppins">{f.desc}</p>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-gray-400 text-[10px]">
                No hay registros fotográficos recientes para este proyecto.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TABLA DE DATOS CRUDOS DE FOTOGRAFÍAS CON BUSCADOR, FILTROS Y PAGINACIÓN */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs space-y-3 font-poppins">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3 font-poppins">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={15} className="text-[#9B0F06]" />
            <h3 className="text-xs font-bold text-gray-900 font-poppins">Registro Documental de Fotografías y Evidencias</h3>
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
                placeholder="Buscar por descripción..."
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
              <option value="avance">Avance</option>
              <option value="laboratorio">Laboratorio</option>
              <option value="incidente">Incidente</option>
              <option value="inspeccion">Inspección</option>
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
                <th className="p-2.5 w-14">Vista</th>
                <th className="p-2.5 w-24">ID</th>
                <th className="p-2.5 w-28">Fecha</th>
                <th className="p-2.5 w-28">Tipo</th>
                <th className="p-2.5 min-w-[220px]">Descripción / Observaciones</th>
                <th className="p-2.5 min-w-[150px]">Renglón</th>
                <th className="p-2.5">Autor</th>
                <th className="p-2.5 text-right">Ubicación / Estación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {datosPaginados.map((row: any, idx: number) => {
                const id = row.id || `FOT-${100 + idx}`
                const fecha = row.fecha || '2026-01-20'
                const tipo = row.tipo || row.categoria || 'Avance'
                const desc = row.descripcion || row.titulo || 'Registro de inspección en campo'
                const renglon = row.renglon || row.codigoDGC || '551.03 Pavimento'
                const autor = row.usuario || row.autor || 'Ing. Residente'
                const estacion = row.estacion || row.ubicacion || 'Est. 42+150'

                return (
                  <tr key={row.id || idx} className="hover:bg-gray-50/80 transition-colors font-poppins">
                    <td className="p-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 overflow-hidden">
                        {row.url || row.imagenUrl || row.url_storage ? (
                          <img src={row.url || row.imagenUrl || row.url_storage} alt="Foto" className="w-full h-full object-cover" />
                        ) : (
                          <Camera size={14} className="text-gray-400" />
                        )}
                      </div>
                    </td>
                    <td className="p-2.5 text-[#9B0F06] font-bold font-poppins">{id}</td>
                    <td className="p-2.5 text-gray-500 font-poppins">{fecha}</td>
                    <td className="p-2.5 font-poppins">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-semibold bg-gray-100 text-gray-700 border border-gray-200 font-poppins">
                        {tipo}
                      </span>
                    </td>
                    <td className="p-2.5 text-gray-800 line-clamp-1 font-poppins">{desc}</td>
                    <td className="p-2.5 font-medium text-gray-700 font-poppins">{renglon}</td>
                    <td className="p-2.5 text-gray-600 font-poppins">{autor}</td>
                    <td className="p-2.5 text-right text-gray-500 font-poppins">{estacion}</td>
                  </tr>
                )
              })}
              {datosPaginados.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-gray-400 text-xs font-poppins">
                    No se encontraron registros fotográficos que coincidan con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div data-paginacion="true" className="paginacion-control flex flex-wrap items-center justify-between text-[9.5px] sm:text-[11px] pt-2 text-gray-500 gap-2 font-[Poppins]">
          <div className="flex items-center gap-2 font-[Poppins]">
            <span className="font-[Poppins]">
              Mostrando {fotosFiltradas.length === 0 ? 0 : (paginaActual - 1) * registrosPorPagina + 1} a{' '}
              {Math.min(paginaActual * registrosPorPagina, fotosFiltradas.length)} de {fotosFiltradas.length} fotos
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
