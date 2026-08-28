'use client'

import React from 'react'
import { Download, FileSpreadsheet } from 'lucide-react'
import { BITACORA_MOCK } from '@/data/bitacora.mock'

export function EstadisticasBitacora({ exportSvgChart }: { exportSvgChart: (name: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Gráfica Registros por Tipo (Dona) */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 className="text-xs font-bold text-gray-900">Registros por Tipo (Bitácora)</h3>
            <button
              type="button"
              onClick={() => exportSvgChart('Registros por Tipo')}
              className="p-1 text-gray-400 hover:text-[#9B0F06] transition-colors"
              title="Exportar como SVG"
            >
              <Download size={13} />
            </button>
          </div>
          <div className="space-y-2 text-[10px]">
            {[
              { label: 'Actividades de Campo', count: 42, color: '#9B0F06' },
              { label: 'Ensayos Laboratorio', count: 18, color: '#0369A1' },
              { label: 'Inspecciones', count: 12, color: '#D97706' },
              { label: 'Incidentes', count: 5, color: '#DC2626' },
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-gray-700">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: r.color }} />
                  {r.label}
                </span>
                <span className="font-mono font-bold text-gray-900">{r.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfica Actividad por Día */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 className="text-xs font-bold text-gray-900">Actividad por Día de la Semana</h3>
            <button
              type="button"
              onClick={() => exportSvgChart('Actividad por Día')}
              className="p-1 text-gray-400 hover:text-[#9B0F06] transition-colors"
              title="Exportar como SVG"
            >
              <Download size={13} />
            </button>
          </div>
          <div className="h-36 flex items-end justify-between gap-2 pt-2 px-1">
            {[
              { d: 'Lun', cant: 8 },
              { d: 'Mar', cant: 12 },
              { d: 'Mié', cant: 15 },
              { d: 'Jue', cant: 11 },
              { d: 'Vie', cant: 14 },
              { d: 'Sáb', cant: 6 },
              { d: 'Dom', cant: 1 },
            ].map((item) => (
              <div key={item.d} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <span className="text-[8.5px] font-mono text-gray-500">{item.cant}</span>
                <div className="w-full bg-[#9B0F06] rounded-t" style={{ height: `${(item.cant / 15) * 100}%` }} />
                <span className="text-[9px] text-gray-500">{item.d}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfica Incidentes por Estado */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 className="text-xs font-bold text-gray-900">Incidentes por Estado</h3>
            <button
              type="button"
              onClick={() => exportSvgChart('Incidentes por Estado')}
              className="p-1 text-gray-400 hover:text-[#9B0F06] transition-colors"
              title="Exportar como SVG"
            >
              <Download size={13} />
            </button>
          </div>
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-2 rounded-lg bg-red-50 border border-red-200 text-xs">
              <span className="font-semibold text-red-900">Abiertos / Críticos</span>
              <span className="font-mono font-bold text-red-900">2</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs">
              <span className="font-semibold text-amber-900">En Revisión</span>
              <span className="font-mono font-bold text-amber-900">3</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
              <span className="font-semibold text-emerald-900">Resueltos / Cerrados</span>
              <span className="font-mono font-bold text-emerald-900">14</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Datos Crudos - Bitácora */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs">
        <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
          <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
            <FileSpreadsheet size={14} className="text-gray-400" />
            Datos Crudos: Registros de Bitácora
          </h3>
        </div>
        <div className="overflow-x-auto rounded border border-gray-200">
          <table className="w-full text-left font-mono text-[10px]">
            <thead>
              <tr className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200 text-[9px] uppercase">
                <th className="p-2 min-w-[120px]">Título del Registro</th>
                <th className="p-2">Fecha</th>
                <th className="p-2">Tipo</th>
                <th className="p-2">Autor</th>
                <th className="p-2 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {BITACORA_MOCK.slice(0, 5).map((row, idx) => (
                <tr key={row.id || idx} className="hover:bg-gray-50/80">
                  <td className="p-2 font-sans font-medium text-gray-800">{row.titulo}</td>
                  <td className="p-2 text-gray-600">{row.fecha}</td>
                  <td className="p-2 font-sans text-[9px]">
                    <span className="px-2 py-0.5 rounded-full border bg-gray-100 text-gray-700 border-gray-200 capitalize">
                      {row.tipo}
                    </span>
                  </td>
                  <td className="p-2 font-sans text-gray-700">{row.autor}</td>
                  <td className="p-2 text-center font-sans text-[9px]">
                    <span className={`px-2 py-0.5 rounded-full border capitalize ${String(row.estado) === 'aprobado' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : String(row.estado) === 'en_revision' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                      {String(row.estado).replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between text-[10px] pt-3 text-gray-500">
          <span>Mostrando 1 - 5 de {BITACORA_MOCK.length} registros</span>
          <div className="flex gap-1">
            <button className="px-2 py-0.5 rounded border border-gray-200 bg-white disabled:opacity-40" disabled>Anterior</button>
            <button className="px-2 py-0.5 rounded border border-gray-200 bg-white disabled:opacity-40">Siguiente</button>
          </div>
        </div>
      </div>
    </div>
  )
}
