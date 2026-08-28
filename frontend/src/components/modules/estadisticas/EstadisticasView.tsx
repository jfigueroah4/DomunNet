'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Filter,
  TrendingUp,
  BarChart2,
  Camera,
} from 'lucide-react'
import { PROYECTOS_MOCK } from '@/data/proyectos.mock'
import { toast } from 'sonner'

import { EstadisticasPlanificacion } from './EstadisticasPlanificacion'
import { EstadisticasBitacora } from './EstadisticasBitacora'
import { EstadisticasRegistros } from './EstadisticasRegistros'

export function EstadisticasView() {
  const router = useRouter()

  const [proyectoId, setProyectoId] = useState<string>(PROYECTOS_MOCK[0]?.id || '1')
  const [fechaDesde, setFechaDesde] = useState<string>('2025-01-20')
  const todayStr = new Date().toISOString().split('T')[0]
  const [fechaHasta, setFechaHasta] = useState<string>(todayStr)
  const [categoriaAnalisis, setCategoriaAnalisis] = useState<string>('todas')

  const [tabActivo, setTabActivo] = useState<'planificacion' | 'bitacora' | 'registros'>('planificacion')

  const exportSvgChart = (nombreGrafica: string) => {
    toast.success(`Exportando gráfica "${nombreGrafica}" como SVG...`)
  }

  return (
    <div className="space-y-4 font-[Poppins] p-1">
      {/* HEADER PROPIO */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => router.push('/dashboard/reportes')}
            className="rounded-md border border-gray-200 bg-white p-1.5 text-gray-600 hover:bg-gray-100 hover:text-[#9B0F06] transition-colors"
            title="Volver a Reportes"
          >
            <ArrowLeft size={15} />
          </button>
          <div>
            <div className="flex items-center gap-1.5 text-[9.5px] text-gray-500 font-mono">
              <span>Reportes</span>
              <span>/</span>
              <span className="text-[#9B0F06] font-bold">Estadísticas y Análisis</span>
            </div>
            <h1 className="text-base font-bold text-gray-900 leading-tight">Estadísticas y Análisis de Obra Vial</h1>
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.push('/dashboard/reportes')}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-[#9B0F06] hover:text-[#9B0F06] transition-colors shadow-2xs cursor-pointer"
        >
          <ArrowLeft size={13} />
          <span>Volver a Reportes</span>
        </button>
      </div>

      {/* BARRA DE FILTROS GLOBAL EN UNA SOLA LÍNEA */}
      <div className="w-full rounded-xl border border-gray-200 bg-white p-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Filter size={13} className="text-[#9B0F06]" />
            <span className="font-semibold text-gray-700 text-[11px]">Filtros:</span>
          </div>

          <select
            value={proyectoId}
            onChange={(e) => setProyectoId(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-md px-2 py-1 text-[11px] text-gray-800 focus:border-[#9B0F06] focus:outline-none cursor-pointer max-w-[220px] truncate font-medium"
          >
            <option value="todos">Todos los proyectos</option>
            {PROYECTOS_MOCK.map((p) => (
              <option key={p.id} value={p.id}>
                {p.codigo} · {p.nombre}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 text-[10.5px]">
            <span className="text-gray-500">Desde:</span>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-md px-1.5 py-1 text-[10.5px] text-gray-800 focus:border-[#9B0F06] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 text-[10.5px]">
            <span className="text-gray-500">Hasta:</span>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-md px-1.5 py-1 text-[10.5px] text-gray-800 focus:border-[#9B0F06] focus:outline-none"
            />
          </div>

          <select
            value={categoriaAnalisis}
            onChange={(e) => {
              setCategoriaAnalisis(e.target.value)
              if (e.target.value !== 'todas') {
                setTabActivo(e.target.value as any)
              }
            }}
            className="bg-gray-50 border border-gray-200 rounded-md px-2 py-1 text-[11px] text-gray-800 focus:border-[#9B0F06] focus:outline-none cursor-pointer font-medium"
          >
            <option value="todas">Categoría: Todas</option>
            <option value="planificacion">Planificación</option>
            <option value="bitacora">Bitácora</option>
            <option value="registros">Registros</option>
          </select>
        </div>
      </div>

      {/* TABS INTERNOS (3 SECCIONES) */}
      <div className="border-b border-gray-200 bg-white px-2 rounded-t-lg">
        <div className="flex gap-2">
          {[
            { id: 'planificacion', label: 'Planificación', icon: TrendingUp },
            { id: 'bitacora', label: 'Bitácora', icon: BarChart2 },
            { id: 'registros', label: 'Registros y Evidencia', icon: Camera },
          ].map((t) => {
            const Icon = t.icon
            const active = tabActivo === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTabActivo(t.id as any)}
                className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                  active
                    ? 'border-[#9B0F06] text-[#9B0F06] bg-red-50/30'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <Icon size={14} />
                <span>{t.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {tabActivo === 'planificacion' && <EstadisticasPlanificacion exportSvgChart={exportSvgChart} />}
      {tabActivo === 'bitacora' && <EstadisticasBitacora exportSvgChart={exportSvgChart} />}
      {tabActivo === 'registros' && <EstadisticasRegistros exportSvgChart={exportSvgChart} />}
    </div>
  )
}
