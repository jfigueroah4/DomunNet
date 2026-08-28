'use client'

import React from 'react'
import { Download, FileSpreadsheet } from 'lucide-react'

export function EstadisticasPlanificacion({ exportSvgChart }: { exportSvgChart: (name: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Gráfica Curva S */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 className="text-xs font-bold text-gray-900">Curva S (Programado vs Ejecutado)</h3>
            <button
              type="button"
              onClick={() => exportSvgChart('Curva S')}
              className="p-1 text-gray-400 hover:text-[#9B0F06] transition-colors"
              title="Exportar como SVG"
            >
              <Download size={13} />
            </button>
          </div>
          <div className="h-44 w-full flex items-end justify-between gap-1 pt-4 pb-2 px-2 border-b border-gray-100 bg-gray-50/50 rounded-lg">
            {[20, 35, 52, 68, 82, 91, 100].map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div className="w-full max-w-[12px] bg-red-200 rounded-t" style={{ height: `${val}%` }} />
                <div className="w-full max-w-[12px] bg-[#9B0F06] rounded-t" style={{ height: `${Math.round(val * 0.85)}%` }} />
                <span className="text-[8px] text-gray-400 font-mono">M{i + 1}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[9px] text-gray-500 font-mono">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-200 inline-block"/> Programado</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[#9B0F06] inline-block"/> Ejecutado (85%)</span>
          </div>
        </div>

        {/* Gráfica Avance por Capítulo */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 className="text-xs font-bold text-gray-900">Avance por Capítulo (% Completado)</h3>
            <button
              type="button"
              onClick={() => exportSvgChart('Avance por Capítulo')}
              className="p-1 text-gray-400 hover:text-[#9B0F06] transition-colors"
              title="Exportar como SVG"
            >
              <Download size={13} />
            </button>
          </div>
          <div className="space-y-2 text-[10px]">
            {[
              { cap: 'Cap I: Preliminares', pct: 90 },
              { cap: 'Cap II: Movimiento Tierras', pct: 75 },
              { cap: 'Cap III: Terraplenes', pct: 60 },
              { cap: 'Cap IV: Subbases', pct: 45 },
              { cap: 'Cap V: Pavimentos', pct: 30 },
            ].map((c) => (
              <div key={c.cap} className="space-y-0.5">
                <div className="flex justify-between text-[9.5px]">
                  <span className="text-gray-700 truncate">{c.cap}</span>
                  <span className="font-mono font-bold text-gray-900">{c.pct}%</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#9B0F06] h-full rounded-full" style={{ width: `${c.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfica Distribución de Renglones */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 className="text-xs font-bold text-gray-900">Distribución por Estado</h3>
            <button
              type="button"
              onClick={() => exportSvgChart('Distribución por Estado')}
              className="p-1 text-gray-400 hover:text-[#9B0F06] transition-colors"
              title="Exportar como SVG"
            >
              <Download size={13} />
            </button>
          </div>
          <div className="flex items-center justify-center h-36">
            <div className="relative w-28 h-28 rounded-full border-8 border-gray-100 flex items-center justify-center" style={{ background: 'conic-gradient(#059669 0% 50%, #E85D04 50% 80%, #9B0F06 80% 100%)' }}>
              <div className="w-16 h-16 bg-white rounded-full flex flex-col items-center justify-center">
                <span className="text-xs font-bold font-mono text-gray-900">88</span>
                <span className="text-[7.5px] text-gray-400 uppercase">Renglones</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 text-center text-[9px] font-mono pt-1">
            <span className="text-emerald-700">Aprobados: 44</span>
            <span className="text-orange-700">En Proceso: 26</span>
            <span className="text-red-700">Pendientes: 18</span>
          </div>
        </div>
      </div>

      {/* Tabla de Datos Crudos - Planificación */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs">
        <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
          <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
            <FileSpreadsheet size={14} className="text-gray-400" />
            Datos Crudos: Planificación y Avance Físico
          </h3>
        </div>
        <div className="overflow-x-auto rounded border border-gray-200">
          <table className="w-full text-left font-mono text-[10px]">
            <thead>
              <tr className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200 text-[9px] uppercase">
                <th className="p-2 min-w-[120px]">Capítulo</th>
                <th className="p-2 text-right">Renglones Totales</th>
                <th className="p-2 text-right">% Programado</th>
                <th className="p-2 text-right">% Ejecutado</th>
                <th className="p-2 text-center w-24">Estado General</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { cap: 'Cap I: Preliminares', total: 12, prog: 100, ejec: 90, estado: 'En tiempo' },
                { cap: 'Cap II: Movimiento Tierras', total: 8, prog: 80, ejec: 75, estado: 'Retraso leve' },
                { cap: 'Cap III: Terraplenes', total: 15, prog: 60, ejec: 60, estado: 'En tiempo' },
                { cap: 'Cap IV: Subbases', total: 5, prog: 50, ejec: 45, estado: 'Retraso leve' },
                { cap: 'Cap V: Pavimentos', total: 10, prog: 20, ejec: 30, estado: 'Adelantado' },
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50/80">
                  <td className="p-2 font-sans font-medium text-gray-800">{row.cap}</td>
                  <td className="p-2 text-right">{row.total}</td>
                  <td className="p-2 text-right">{row.prog}%</td>
                  <td className="p-2 text-right">{row.ejec}%</td>
                  <td className="p-2 text-center font-sans text-[9px]">
                    <span className={`px-2 py-0.5 rounded-full border ${row.estado === 'En tiempo' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : row.estado === 'Adelantado' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                      {row.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between text-[10px] pt-3 text-gray-500">
          <span>Mostrando 1 - 5 de 5 capítulos</span>
          <div className="flex gap-1">
            <button className="px-2 py-0.5 rounded border border-gray-200 bg-white disabled:opacity-40" disabled>Anterior</button>
            <button className="px-2 py-0.5 rounded border border-gray-200 bg-white disabled:opacity-40" disabled>Siguiente</button>
          </div>
        </div>
      </div>
    </div>
  )
}
