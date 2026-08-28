'use client'

import React from 'react'
import { Download, FileSpreadsheet } from 'lucide-react'
import { PROYECTOS_MOCK } from '@/data/proyectos.mock'
import { FOTOGRAFIAS_MOCK } from '@/data/fotografias.mock'

export function EstadisticasRegistros({ exportSvgChart }: { exportSvgChart: (name: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Top Renglones con más Fotos */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 className="text-xs font-bold text-gray-900">Top Renglones con más Fotografías</h3>
            <button
              type="button"
              onClick={() => exportSvgChart('Top Renglones Fotos')}
              className="p-1 text-gray-400 hover:text-[#9B0F06] transition-colors"
              title="Exportar como SVG"
            >
              <Download size={13} />
            </button>
          </div>
          <div className="space-y-2 text-[10px]">
            {[
              { cod: '551.03 Pavimento Concreto', cant: 28 },
              { cod: '201.01 Excavación en Vía', cant: 22 },
              { cod: '601.01 Alcantarillas Tubulares', cant: 16 },
              { cod: '304.01 Subbase Granular', cant: 12 },
            ].map((r) => (
              <div key={r.cod} className="space-y-0.5">
                <div className="flex justify-between text-[9.5px]">
                  <span className="text-gray-700 truncate">{r.cod}</span>
                  <span className="font-mono font-bold text-gray-900">{r.cant} fotos</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#9B0F06] h-full rounded-full" style={{ width: `${(r.cant / 30) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Evidencia por Proyecto */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 className="text-xs font-bold text-gray-900">Evidencia por Proyecto</h3>
            <button
              type="button"
              onClick={() => exportSvgChart('Evidencia por Proyecto')}
              className="p-1 text-gray-400 hover:text-[#9B0F06] transition-colors"
              title="Exportar como SVG"
            >
              <Download size={13} />
            </button>
          </div>
          <div className="space-y-2.5 text-[10px]">
            {PROYECTOS_MOCK.map((p, idx) => (
              <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-200">
                <span className="text-gray-800 font-medium truncate max-w-[180px]">{p.nombre}</span>
                <span className="font-mono font-bold text-[#9B0F06] bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  {35 + idx * 12} fotos
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Línea de Tiempo de Registros */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 className="text-xs font-bold text-gray-900">Línea de Tiempo de Evidencias</h3>
            <button
              type="button"
              onClick={() => exportSvgChart('Línea de Tiempo')}
              className="p-1 text-gray-400 hover:text-[#9B0F06] transition-colors"
              title="Exportar como SVG"
            >
              <Download size={13} />
            </button>
          </div>
          <div className="space-y-2 text-[10px]">
            {[
              { fecha: 'Hoy, 20/01/2026', desc: '14 fotos capturadas en Frentes Vista Hermosa' },
              { fecha: 'Ayer, 19/01/2026', desc: '8 fotos de ensayos en Laboratorio Central' },
              { fecha: '18/01/2026', desc: '19 fotos de avance en Calzada Roosevelt' },
            ].map((f) => (
              <div key={f.fecha} className="p-2 rounded-lg border border-gray-200 bg-gray-50/50 space-y-0.5">
                <span className="font-mono font-bold text-[#9B0F06] block text-[9.5px]">{f.fecha}</span>
                <p className="text-gray-600 font-sans">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla de Datos Crudos - Fotografías */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs">
        <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
          <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
            <FileSpreadsheet size={14} className="text-gray-400" />
            Datos Crudos: Fotografías de Evidencia
          </h3>
        </div>
        <div className="overflow-x-auto rounded border border-gray-200">
          <table className="w-full text-left font-mono text-[10px]">
            <thead>
              <tr className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200 text-[9px] uppercase">
                <th className="p-2 min-w-[120px]">Título de Fotografía</th>
                <th className="p-2">Fecha y Hora</th>
                <th className="p-2 min-w-[120px]">Proyecto</th>
                <th className="p-2 min-w-[120px]">Bitácora Vinculada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {FOTOGRAFIAS_MOCK.slice(0, 5).map((row, idx) => (
                <tr key={row.id || idx} className="hover:bg-gray-50/80">
                  <td className="p-2 font-sans font-medium text-gray-800">{row.titulo}</td>
                  <td className="p-2 text-gray-600">{row.fecha} {row.hora}</td>
                  <td className="p-2 font-sans text-gray-700">{row.proyectoNombre}</td>
                  <td className="p-2 font-sans text-gray-700">{row.bitacoraTitulo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between text-[10px] pt-3 text-gray-500">
          <span>Mostrando 1 - 5 de {FOTOGRAFIAS_MOCK.length} registros</span>
          <div className="flex gap-1">
            <button className="px-2 py-0.5 rounded border border-gray-200 bg-white disabled:opacity-40" disabled>Anterior</button>
            <button className="px-2 py-0.5 rounded border border-gray-200 bg-white disabled:opacity-40">Siguiente</button>
          </div>
        </div>
      </div>
    </div>
  )
}
