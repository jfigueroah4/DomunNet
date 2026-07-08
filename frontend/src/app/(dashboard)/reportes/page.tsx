'use client'

import { 
  Download, AlertTriangle, TrendingUp, Users, 
  ChevronRight, FolderOpen
} from 'lucide-react'
import { PROYECTOS_MOCK } from '@/data/proyectos.mock'
import { BITACORA_MOCK } from '@/data/bitacora.mock'
import ProyectoEstadoBadge from '@/components/modules/proyectos/ProyectoEstadoBadge'

export default function ReportesPage() {
  // ========== SECCIÓN 1: KPIs ==========
  const kpis = [
    {
      label: 'Proyectos Activos',
      value: PROYECTOS_MOCK.filter(p => p.estado === 'activo').length,
      color: '#D53E0F',
      icon: FolderOpen,
    },
    {
      label: 'Avance Promedio',
      value: '72%',
      color: '#3B82F6',
      icon: TrendingUp,
    },
    {
      label: 'Registros Bitácora',
      value: BITACORA_MOCK.length,
      color: '#2563EB',
      icon: AlertTriangle,
    },
    {
      label: 'Fotos Capturadas',
      value: '284',
      color: '#16A34A',
      icon: Users,
    },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-gray-800">Reportes</h1>
          <p className="text-[10px] text-gray-400">Dashboard de actividades y proyectos</p>
        </div>
        <button className="flex items-center gap-1.5 bg-[#9B0F06] text-white text-[10px] px-3 py-1.5 rounded-lg hover:bg-[#5E0006]">
          <Download size={12} /> Exportar
        </button>
      </div>

      {/* ===== Sección 1: KPI Cards ===== */}
      <div className="grid grid-cols-4 gap-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" 
                  style={{ background: kpi.color + '20' }}>
                  <Icon size={16} style={{ color: kpi.color }} />
                </div>
              </div>
              <p className="text-[9px] text-gray-400 uppercase tracking-wide font-semibold mb-1">
                {kpi.label}
              </p>
              <p className="text-2xl font-bold text-gray-800 leading-none">{kpi.value}</p>
              <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2" style={{
                background: `linear-gradient(to right, ${kpi.color} 0%, ${kpi.color} 72%, #E5E7EB 72%)`
              }} />
            </div>
          )
        })}
      </div>

      {/* ===== Sección 2: Project Progress Bar ===== */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <p className="text-xs font-semibold text-gray-800 mb-3">Avance por Proyecto</p>
        <div className="space-y-2.5">
          {PROYECTOS_MOCK.slice(0, 3).map(p => (
            <div key={p.id} className="flex items-center gap-3">
              <span className="text-[10px] font-medium text-gray-600 w-28 truncate">{p.nombre}</span>
              <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ 
                  width: `${p.avance}%`,
                  background: p.avance >= 75 ? '#16A34A' : p.avance >= 50 ? '#3B82F6' : '#F97316'
                }} />
              </div>
              <span className="text-[9px] text-gray-500 w-10 text-right">{p.avance}%</span>
              <ProyectoEstadoBadge estado={p.estado} />
            </div>
          ))}
        </div>
      </div>

      {/* ===== Sección 3: Charts Grid (3-2 layout) ===== */}
      <div className="grid grid-cols-5 gap-3">
        {/* Vertical Bar Chart (col-span-3) */}
        <div className="col-span-3 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-800 mb-3">Actividad Esta Semana</p>
          <div className="flex items-end gap-1.5 h-32">
            {[
              { dia: 'L', val: 45 }, { dia: 'M', val: 80 }, { dia: 'M', val: 60 },
              { dia: 'J', val: 95 }, { dia: 'V', val: 70 }, { dia: 'S', val: 30 }, { dia: 'D', val: 20 }
            ].map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t-sm transition-all" style={{
                  height: `${d.val}%`,
                  background: i >= 4 ? '#D1D5DB' : '#9B0F06'
                }} />
                <span className="text-[8px] text-gray-400 mt-1">{d.dia}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Donut Chart (col-span-2) */}
        <div className="col-span-2 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-800 mb-3">Distribución por Tipo</p>
          <div className="flex items-center gap-3">
            {/* SVG Donut simplificado */}
            <svg width="80" height="80" className="flex-shrink-0">
              <circle cx="40" cy="40" r="30" fill="none" stroke="#FEF2F2" strokeWidth="8" strokeDasharray="56 113" />
              <circle cx="40" cy="40" r="30" fill="none" stroke="#FEE2E2" strokeWidth="8" strokeDasharray="28 113" strokeDashoffset="-56" transform="rotate(-90 40 40)" />
            </svg>
            <div className="space-y-1.5 text-[9px]">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: '#9B0F06' }} />
                <span className="text-gray-600">Actividades 45%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: '#DC2626' }} />
                <span className="text-gray-600">Incidentes 25%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: '#2563EB' }} />
                <span className="text-gray-600">Visitas 30%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Sección 4: Projects Table ===== */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 overflow-x-auto">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-800">Proyectos</p>
          <button className="flex items-center gap-1 text-[9px] text-[#9B0F06] hover:bg-red-50 px-2 py-1 rounded">
            <Download size={11} /> Exportar
          </button>
        </div>
        <table className="w-full text-[9px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-gray-400 font-semibold py-2 px-1">Proyecto</th>
              <th className="text-left text-gray-400 font-semibold py-2 px-1">Estado</th>
              <th className="text-left text-gray-400 font-semibold py-2 px-1">Responsable</th>
              <th className="text-left text-gray-400 font-semibold py-2 px-1">Avance</th>
              <th className="text-left text-gray-400 font-semibold py-2 px-1">Presupuesto</th>
              <th className="text-left text-gray-400 font-semibold py-2 px-1">Fecha Fin</th>
              <th className="text-left text-gray-400 font-semibold py-2 px-1">Registros</th>
            </tr>
          </thead>
          <tbody>
            {PROYECTOS_MOCK.map(p => (
              <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-2 px-1 font-medium text-gray-800">{p.nombre}</td>
                <td className="py-2 px-1"><ProyectoEstadoBadge estado={p.estado} /></td>
                <td className="py-2 px-1 text-gray-600">{p.responsable}</td>
                <td className="py-2 px-1">
                  <div className="flex items-center gap-1">
                    <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full" style={{ width: `${p.avance}%`, background: '#9B0F06' }} />
                    </div>
                    <span className="text-gray-500">{p.avance}%</span>
                  </div>
                </td>
                <td className="py-2 px-1 text-gray-600">${(p.presupuesto / 1000).toFixed(0)}k</td>
                <td className="py-2 px-1 text-gray-500">{p.fechaFin}</td>
                <td className="py-2 px-1">{BITACORA_MOCK.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ===== Sección 5: Active Incidents ===== */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={14} className="text-[#D53E0F]" />
          <h3 className="text-xs font-semibold text-gray-800">Incidentes Activos</h3>
          <span className="ml-auto bg-[#D53E0F] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
            {BITACORA_MOCK.filter(b => b.tipo === 'incidente').length}
          </span>
        </div>
        <div className="space-y-2">
          {BITACORA_MOCK.filter(b => b.tipo === 'incidente').slice(0, 3).map(incident => (
            <div key={incident.id} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: '#DC2626' }} />
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-medium text-gray-800 line-clamp-1">{incident.titulo}</p>
                <p className="text-[8px] text-gray-500 mt-0.5">{incident.proyectoNombre} • {incident.fecha}</p>
              </div>
              <ChevronRight size={12} className="text-gray-300 flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
