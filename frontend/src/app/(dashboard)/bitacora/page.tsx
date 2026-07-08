'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, Plus, FileText, Calendar, X, ChevronRight,
  FolderOpen, User, MapPin, Paperclip, ClipboardList,
  AlertTriangle, Users, Package
} from 'lucide-react'
import { BITACORA_MOCK } from '@/data/bitacora.mock'
import { PROYECTOS_MOCK } from '@/data/proyectos.mock'
import { BitacoraEstadoBadge } from '@/components/modules/bitacora/BitacoraEstadoBadge'

const COLORES_TIPO: Record<string, { bg: string, color: string, borde: string }> = {
  actividad:   { bg: '#FEF2F2', color: '#9B0F06', borde: '#9B0F06' },
  incidente:   { bg: '#FEE2E2', color: '#DC2626', borde: '#DC2626' },
  visita:      { bg: '#EFF6FF', color: '#2563EB', borde: '#2563EB' },
  inspeccion:  { bg: '#F5F3FF', color: '#7C3AED', borde: '#7C3AED' },
  observacion: { bg: '#FFFBEB', color: '#D97706', borde: '#D97706' },
  material:    { bg: '#F0FDF4', color: '#16A34A', borde: '#16A34A' },
}

export default function BitacoraPage() {
  const router = useRouter()
  const [busqueda, setBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [filtroProyecto, setFiltroProyecto] = useState('todos')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [mostrarInforme, setMostrarInforme] = useState(false)

  const registrosFiltrados = BITACORA_MOCK.filter(reg => {
    const cumpleBusqueda = busqueda === '' || reg.titulo.toLowerCase().includes(busqueda.toLowerCase())
    const cumpleTipo = filtroTipo === 'todos' || reg.tipo === filtroTipo
    const cumpleProyecto = filtroProyecto === 'todos' || reg.proyectoId === filtroProyecto
    const cumpleEstado = filtroEstado === 'todos' || reg.estado === filtroEstado
    return cumpleBusqueda && cumpleTipo && cumpleProyecto && cumpleEstado
  })

  return (
    <div className="flex gap-4 h-full">
      {/* Columna izquierda 65% */}
      <div className="flex-[65] flex flex-col gap-3 min-w-0">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-800">Bitácora de Obra</h1>
            <p className="text-[10px] text-gray-400">Registro diario de actividades</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setMostrarInforme(true)}
              className="flex items-center gap-1.5 border border-[#9B0F06] text-[#9B0F06] text-[10px] px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
              <FileText size={12} /> Generar Informe
            </button>
            <button onClick={() => router.push('/bitacora/nuevo')}
              className="flex items-center gap-1.5 bg-[#9B0F06] text-white text-[10px] px-3 py-1.5 rounded-lg hover:bg-[#5E0006] transition-colors">
              <Plus size={12} /> Nuevo Registro
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input placeholder="Buscar registro..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)}
              className="pl-7 pr-3 py-1.5 border border-gray-200 rounded-lg text-[10px] text-gray-700 placeholder:text-gray-400 bg-white w-44 focus:outline-none focus:border-[#9B0F06]" />
          </div>

          <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-[10px] text-gray-700 bg-white focus:outline-none focus:border-[#9B0F06]">
            <option value="todos">Todos los tipos</option>
            <option value="actividad">Actividad</option>
            <option value="incidente">Incidente</option>
            <option value="visita">Visita</option>
            <option value="inspeccion">Inspección</option>
            <option value="material">Material</option>
            <option value="observacion">Observación</option>
          </select>

          <select value={filtroProyecto} onChange={e => setFiltroProyecto(e.target.value)}
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-[10px] text-gray-700 bg-white focus:outline-none focus:border-[#9B0F06]">
            <option value="todos">Todos los proyectos</option>
            {PROYECTOS_MOCK.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>

          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-[10px] text-gray-700 bg-white focus:outline-none focus:border-[#9B0F06]">
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="en_proceso">En Proceso</option>
            <option value="resuelto">Resuelto</option>
            <option value="cerrado">Cerrado</option>
          </select>

          <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white">
            <Calendar size={11} className="text-gray-400" />
            <span className="text-[9px] text-gray-400">Desde</span>
            <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
              className="text-[10px] text-gray-700 bg-transparent focus:outline-none w-28" />
          </div>

          <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white">
            <Calendar size={11} className="text-gray-400" />
            <span className="text-[9px] text-gray-400">Hasta</span>
            <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
              className="text-[10px] text-gray-700 bg-transparent focus:outline-none w-28" />
          </div>
        </div>

        {/* Feed de registros agrupados por fecha */}
        <div className="flex-1 overflow-y-auto">
          {Object.entries(
            registrosFiltrados.reduce((acc, reg) => {
              if (!acc[reg.fecha]) acc[reg.fecha] = []
              acc[reg.fecha].push(reg)
              return acc
            }, {} as Record<string, typeof BITACORA_MOCK>)
          ).map(([fecha, registros]) => (
            <div key={fecha}>
              {/* Separador de fecha */}
              <div className="flex items-center gap-3 my-3">
                <div className="h-px bg-gray-200 flex-1" />
                <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide px-2">
                  {fecha}
                </span>
                <div className="h-px bg-gray-200 flex-1" />
              </div>

              {/* Cards del día */}
              {registros.map(reg => {
                const tipoStyle = COLORES_TIPO[reg.tipo] || COLORES_TIPO.actividad
                return (
                  <div key={reg.id}
                    onClick={() => router.push(`/bitacora/${reg.id}`)}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 mb-2 hover:shadow-md cursor-pointer transition-all flex gap-3">

                    {/* Indicador de color */}
                    <div className="w-1 self-stretch rounded-full flex-shrink-0"
                      style={{ background: tipoStyle.borde }} />

                    <div className="flex-1 min-w-0">
                      {/* Fila superior */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: tipoStyle.bg, color: tipoStyle.color }}>
                            {reg.tipo.charAt(0).toUpperCase() + reg.tipo.slice(1)}
                          </span>
                          <BitacoraEstadoBadge estado={reg.estado} />
                          {reg.etiquetas.map(e => (
                            <span key={e} className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{e}</span>
                          ))}
                        </div>
                        <span className="text-[9px] text-gray-400 flex-shrink-0">{reg.hora}</span>
                      </div>

                      <p className="text-xs font-semibold text-gray-800 mt-1.5">{reg.titulo}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{reg.descripcion}</p>

                      {/* Meta */}
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="text-[9px] text-gray-400 flex items-center gap-1">
                          <FolderOpen size={10} /> {reg.proyectoNombre}
                        </span>
                        <span className="text-[9px] text-gray-400 flex items-center gap-1">
                          <User size={10} /> {reg.autor}
                        </span>
                        <span className="text-[9px] text-gray-400 flex items-center gap-1">
                          <MapPin size={10} /> {reg.ubicacion}
                        </span>
                        {reg.adjuntos.length > 0 && (
                          <span className="text-[9px] text-gray-400 flex items-center gap-1">
                            <Paperclip size={10} /> {reg.adjuntos.length} adjuntos
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight size={13} className="text-gray-300 self-center flex-shrink-0" />
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Columna derecha 35% */}
      <div className="flex-[35] flex flex-col gap-3">
        
        {/* Panel resumen sticky */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 sticky top-4">

          {/* Resumen de hoy */}
          <p className="text-xs font-semibold text-gray-800 mb-3">Resumen de Hoy</p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { label: 'Actividades', count: BITACORA_MOCK.filter(b => b.tipo === 'actividad').length, color: '#9B0F06', Icon: ClipboardList },
              { label: 'Incidentes',  count: BITACORA_MOCK.filter(b => b.tipo === 'incidente').length,  color: '#D53E0F', Icon: AlertTriangle },
              { label: 'Visitas',     count: BITACORA_MOCK.filter(b => b.tipo === 'visita').length,     color: '#2563EB', Icon: Users },
              { label: 'Materiales',  count: BITACORA_MOCK.filter(b => b.tipo === 'material').length,  color: '#16A34A', Icon: Package },
            ].map(item => (
              <div key={item.label} className="bg-gray-50 rounded-xl p-2.5 flex items-center gap-2">
                <item.Icon size={13} style={{ color: item.color }} />
                <div>
                  <p className="text-base font-bold text-gray-800 leading-none">{item.count}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">{item.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Gráfica semanal */}
          <p className="text-[10px] font-semibold text-gray-700 mb-2">Esta Semana</p>
          <div className="flex items-end gap-1.5 h-16 mb-4">
            {[
              { dia: 'L', val: 60 }, { dia: 'M', val: 80 }, { dia: 'M', val: 40 },
              { dia: 'J', val: 100 }, { dia: 'V', val: 70 }, { dia: 'S', val: 30 }, { dia: 'D', val: 20 }
            ].map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t-sm transition-all"
                  style={{ height: `${d.val}%`, background: i === 3 ? '#9B0F06' : '#EED9B9' }} />
                <span className="text-[8px] text-gray-400">{d.dia}</span>
              </div>
            ))}
          </div>

          {/* Último registro */}
          <p className="text-[10px] font-semibold text-gray-700 mb-2">Último Registro</p>
          <div className="bg-[#9B0F06]/5 rounded-xl p-3 border border-[#9B0F06]/10">
            <p className="text-[10px] font-semibold text-[#9B0F06] line-clamp-2">
              {BITACORA_MOCK[0]?.titulo || 'Sin registros'}
            </p>
            <p className="text-[9px] text-gray-500 mt-0.5">
              {BITACORA_MOCK[0]?.hora} • {BITACORA_MOCK[0]?.autor}
            </p>
          </div>
        </div>
      </div>

      {/* Modal Generar Informe */}
      {mostrarInforme && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-800">Generar Informe de Bitácora</h2>
              <button onClick={() => setMostrarInforme(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-[10px] font-medium text-gray-600 mb-1 block">Título del informe</label>
                <input placeholder="Ej: Actividades Semana 18"
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[10px] text-gray-700 focus:outline-none focus:border-[#9B0F06]" />
              </div>
              <div>
                <label className="text-[10px] font-medium text-gray-600 mb-1 block">Proyecto</label>
                <select className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[10px] text-gray-700 focus:outline-none focus:border-[#9B0F06]">
                  <option value="">Todos los proyectos</option>
                  {PROYECTOS_MOCK.map(p => <option key={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-medium text-gray-600 mb-1 block">Fecha desde</label>
                  <input type="date" className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[10px] text-gray-700 focus:outline-none focus:border-[#9B0F06]" />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-gray-600 mb-1 block">Fecha hasta</label>
                  <input type="date" className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[10px] text-gray-700 focus:outline-none focus:border-[#9B0F06]" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-medium text-gray-600 mb-2 block">Incluir tipos</label>
                <div className="flex flex-wrap gap-2">
                  {['Actividades', 'Incidentes', 'Visitas', 'Inspecciones', 'Materiales', 'Observaciones'].map(tipo => (
                    <label key={tipo} className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-3 h-3 accent-[#9B0F06]" />
                      <span className="text-[9px] text-gray-600">{tipo}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Vista previa simulada */}
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 mb-4">
              <p className="text-[9px] text-gray-400 uppercase tracking-wide font-semibold mb-2">Vista previa</p>
              <div className="bg-[#9B0F06] text-white p-2.5 rounded-lg mb-2">
                <p className="text-[10px] font-bold">Informe de Bitácora</p>
                <p className="text-[9px] opacity-70">Período seleccionado</p>
              </div>
              <div className="space-y-1.5">
                {[100, 85, 70].map((w, i) => (
                  <div key={i} className="h-2 bg-gray-200 rounded" style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setMostrarInforme(false)}
                className="flex-1 border border-gray-200 text-gray-500 text-[10px] py-2 rounded-lg hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={() => { console.log('Generando informe...'); setMostrarInforme(false) }}
                className="flex-1 bg-[#9B0F06] text-white text-[10px] py-2 rounded-lg hover:bg-[#5E0006] flex items-center justify-center gap-1.5">
                <FileText size={11} /> Generar Informe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
