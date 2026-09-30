'use client'

import { useState, useMemo } from 'react'
import {
  ArrowLeft, Download, Trash2, Search, Plus, RotateCcw, ChevronLeft, ChevronRight, X, ShieldAlert, HardDrive
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const POPPINS = "'Poppins', sans-serif"

interface BackupItem {
  id: number
  nombre: string
  tipo: 'Completo' | 'Incremental'
  modulos?: string[]
  fechaRaw: string // YYYY-MM-DD
  fecha: string
  size: string
  usuario: string
  estado: string
}

interface ModuloItem {
  id: string
  nombre: string
  tablas: string[]
}

const MODULOS_DISPONIBLES: ModuloItem[] = [
  { id: 'proyectos', nombre: 'Proyectos y Obras', tablas: ['proyectos', 'proyecto_contratista'] },
  { id: 'bitacoras', nombre: 'Bitácoras de Campo', tablas: ['bitacora_obra', 'bitacora_pendiente_ajuste'] },
  { id: 'fotografias', nombre: 'Evidencia Fotográfica', tablas: ['fotografias_proyecto', 'albumes_obra'] },
  { id: 'laboratorio', nombre: 'Pruebas de Laboratorio', tablas: ['muestras_laboratorio', 'ensayos_compresion'] },
  { id: 'tickets', nombre: 'Mesa de Ayuda / Tickets', tablas: ['tickets_soporte', 'respuestas_tickets'] }
]

export default function BackupPage() {
  const router = useRouter()
  const [tabActiva, setTabActiva] = useState<'Todos' | 'Backup Completo' | 'Backup Incremental'>('Todos')
  const [busqueda, setBusqueda] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  
  // Módulos seleccionados en Incremental
  const [modulosIncremental, setModulosIncremental] = useState<string[]>([])

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1)
  const [registrosPorPagina, setRegistrosPorPagina] = useState(8)

  // Lista de copias de seguridad
  const [backups, setBackups] = useState<BackupItem[]>([
    {
      id: 1,
      nombre: 'Backup_DomunNet_Full_20260815.sql',
      tipo: 'Completo',
      fechaRaw: '2026-08-15',
      fecha: '15/08/2026 02:00',
      size: '245.8 MB',
      usuario: 'Sistema (Programado)',
      estado: 'Completado'
    },
    {
      id: 2,
      nombre: 'Backup_DomunNet_Inc_20260808.sql',
      tipo: 'Incremental',
      modulos: ['proyectos', 'bitacoras'],
      fechaRaw: '2026-08-08',
      fecha: '08/08/2026 02:00',
      size: '42.3 MB',
      usuario: 'admin@domunnet.com',
      estado: 'Completado'
    },
    {
      id: 3,
      nombre: 'Backup_DomunNet_Full_20260801.sql',
      tipo: 'Completo',
      fechaRaw: '2026-08-01',
      fecha: '01/08/2026 02:00',
      size: '221.5 MB',
      usuario: 'Sistema (Programado)',
      estado: 'Completado'
    },
    {
      id: 4,
      nombre: 'Backup_DomunNet_Inc_20260725.sql',
      tipo: 'Incremental',
      modulos: ['fotografias', 'tickets'],
      fechaRaw: '2026-07-25',
      fecha: '25/07/2026 02:00',
      size: '18.9 MB',
      usuario: 'admin@domunnet.com',
      estado: 'Completado'
    }
  ])

  // Modales
  const [modalGenerarAbierto, setModalGenerarAbierto] = useState(false)
  const [nuevoTipoModal, setNuevoTipoModal] = useState<'Completo' | 'Incremental'>('Completo')
  const [modulosModal, setModulosModal] = useState<string[]>([])
  const [generando, setGenerando] = useState(false)

  const [itemAEliminar, setItemAEliminar] = useState<BackupItem | null>(null)

  const toggleModuloIncrementalFilter = (id: string) => {
    setModulosIncremental(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  const toggleModuloModal = (id: string) => {
    setModulosModal(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  // Filtrado general
  const backupsFiltrados = useMemo(() => {
    return backups.filter(b => {
      // Filtro por Tab
      if (tabActiva === 'Backup Completo' && b.tipo !== 'Completo') return false
      if (tabActiva === 'Backup Incremental' && b.tipo !== 'Incremental') return false

      // Filtro por Módulos (si está en tab Incremental y hay seleccionados)
      if (tabActiva === 'Backup Incremental' && modulosIncremental.length > 0) {
        if (!b.modulos || !b.modulos.some(m => modulosIncremental.includes(m))) return false
      }

      // Filtro por Texto
      const texto = busqueda.toLowerCase()
      const coincideTexto = b.nombre.toLowerCase().includes(texto) || b.usuario.toLowerCase().includes(texto)
      if (!coincideTexto) return false

      // Filtro por Rango de Fechas
      if (fechaInicio && b.fechaRaw < fechaInicio) return false
      if (fechaFin && b.fechaRaw > fechaFin) return false

      return true
    })
  }, [backups, tabActiva, modulosIncremental, busqueda, fechaInicio, fechaFin])

  // Paginación
  const totalPaginas = Math.ceil(backupsFiltrados.length / registrosPorPagina)
  const backupsPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * registrosPorPagina
    return backupsFiltrados.slice(inicio, inicio + registrosPorPagina)
  }, [backupsFiltrados, paginaActual, registrosPorPagina])

  // Generar Backup
  const handleGenerarBackup = () => {
    if (nuevoTipoModal === 'Incremental' && modulosModal.length === 0) {
      toast.error('Debe seleccionar al menos un módulo para el backup incremental')
      return
    }

    setGenerando(true)
    setTimeout(() => {
      setGenerando(false)
      setModalGenerarAbierto(false)

      const fechaHoyObj = new Date()
      const fechaRawStr = fechaHoyObj.toISOString().slice(0, 10)
      const fechaFormatStr = fechaHoyObj.toLocaleString('es-GT', { dateStyle: 'short', timeStyle: 'short' })
      const extension = nuevoTipoModal === 'Completo' ? 'Full' : 'Inc'
      const nombreNuevo = `Backup_DomunNet_${extension}_${fechaRawStr.replace(/-/g, '')}.sql`
      const sizeNuevo = nuevoTipoModal === 'Completo' ? '252.1 MB' : '18.4 MB'

      const nuevo: BackupItem = {
        id: Date.now(),
        nombre: nombreNuevo,
        tipo: nuevoTipoModal,
        modulos: nuevoTipoModal === 'Incremental' ? [...modulosModal] : undefined,
        fechaRaw: fechaRawStr,
        fecha: fechaFormatStr,
        size: sizeNuevo,
        usuario: 'Usuario Actual',
        estado: 'Completado'
      }

      setBackups([nuevo, ...backups])
      toast.success('Copia de seguridad generada exitosamente')
    }, 2000)
  }

  // Descargar Backup
  const handleDescargar = (item: BackupItem) => {
    const element = document.createElement('a')
    const file = new Blob([`-- DomunNet Database Backup\n-- Archivo: ${item.nombre}\n-- Fecha: ${item.fecha}\n\n`], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = item.nombre
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    toast.success(`Descargando ${item.nombre}...`)
  }

  // Confirmar Eliminación
  const handleConfirmarEliminar = () => {
    if (!itemAEliminar) return
    setBackups(backups.filter(b => b.id !== itemAEliminar.id))
    toast.success(`Copia de seguridad ${itemAEliminar.nombre} eliminada`)
    setItemAEliminar(null)
  }

  return (
    <div style={{ fontFamily: POPPINS, padding: '16px 20px', maxWidth: 1400, margin: '0 auto', minHeight: 'calc(100vh - 100px)' }}>
      {/* Encabezado Principal con Flecha sin Fondo y Botón de Restauración al lado de Generar Backup */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard/configuracion')}
            className="p-1.5 text-gray-500 hover:text-gray-900 transition-colors focus:outline-none"
            title="Regresar a Configuración"
          >
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">Copias de Seguridad (Backup)</h1>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">Genera y administra los respaldos programados y manuales de la base de datos</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Botón para enviar a Restauración */}
          <button
            type="button"
            onClick={() => router.push('/dashboard/configuracion/restauracion')}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg transition-colors shadow-2xs"
          >
            <RotateCcw size={15} />
            <span>Restaurar Backup</span>
          </button>

          {/* Botón Principal Generar Backup */}
          <button
            type="button"
            onClick={() => {
              setModulosModal([])
              setNuevoTipoModal(tabActiva === 'Backup Incremental' ? 'Incremental' : 'Completo')
              setModalGenerarAbierto(true)
            }}
            style={{ backgroundColor: '#9B0F06' }}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm"
          >
            <Plus size={15} />
            Generar Backup
          </button>
        </div>
      </div>

      {/* Tabs Principales de Filtrado (Todos, Backup Completo, Backup Incremental) */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl mb-4 max-w-md">
        {(['Todos', 'Backup Completo', 'Backup Incremental'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setTabActiva(tab)
              setPaginaActual(1)
            }}
            className={`flex-1 py-1.5 text-xs transition-colors rounded-lg cursor-pointer text-center ${
              tabActiva === tab
                ? 'bg-white text-gray-900 shadow-2xs font-bold'
                : 'text-gray-500 hover:text-gray-700 font-medium'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Opciones Seleccionables por Módulo al Seleccionar Backup Incremental */}
      {tabActiva === 'Backup Incremental' && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              Filtrar Módulos para Backup Incremental
            </span>
            <button
              type="button"
              onClick={() => setModulosIncremental([])}
              className="text-[11px] text-[#9B0F06] font-semibold hover:underline"
            >
              Limpiar Selección
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {MODULOS_DISPONIBLES.map((m) => {
              const checked = modulosIncremental.includes(m.id)
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleModuloIncrementalFilter(m.id)}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                    checked
                      ? 'border-[#9B0F06] bg-red-50/30 text-[#9B0F06] font-bold'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}}
                      className="accent-[#9B0F06] rounded"
                    />
                    <span className="truncate">{m.nombre}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Toolbar con Buscador y Filtro por Fecha (Inicio / Fin) */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 mb-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value)
              setPaginaActual(1)
            }}
            placeholder="Buscar backup por nombre o usuario..."
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#9B0F06]"
          />
        </div>

        {/* Filtro Rango de Fechas (Inicio / Fin) */}
        <div className="flex items-center gap-2 w-full md:w-auto text-xs text-gray-600">
          <span className="font-medium whitespace-nowrap text-[11px]">Fecha Inicio:</span>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => {
              setFechaInicio(e.target.value)
              setPaginaActual(1)
            }}
            className="text-xs p-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#9B0F06] bg-white"
          />

          <span className="font-medium whitespace-nowrap text-[11px] ml-1">Fecha Fin:</span>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => {
              setFechaFin(e.target.value)
              setPaginaActual(1)
            }}
            className="text-xs p-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#9B0F06] bg-white"
          />

          {(fechaInicio || fechaFin) && (
            <button
              onClick={() => {
                setFechaInicio('')
                setFechaFin('')
              }}
              className="text-[11px] text-[#9B0F06] font-semibold hover:underline ml-1"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Tabla estilo Usuarios (sin bordes cargados, tamaño reducido 1px, sin iconos en nombre/fecha/tipo) */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-2.5 px-3.5">Archivo / Copia de Seguridad</th>
                <th className="py-2.5 px-3.5">Tipo</th>
                <th className="py-2.5 px-3.5">Fecha y Hora</th>
                <th className="py-2.5 px-3.5">Tamaño</th>
                <th className="py-2.5 px-3.5">Origen / Usuario</th>
                <th className="py-2.5 px-3.5">Estado</th>
                <th className="py-2.5 px-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-[11px] text-gray-700">
              {backupsPaginados.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                  {/* Nombre del archivo (sin icono) */}
                  <td className="py-2.5 px-3.5 font-semibold text-gray-900 font-mono">
                    {item.nombre}
                  </td>

                  {/* Tipo (sin colores en la insignia) */}
                  <td className="py-2.5 px-3.5 text-gray-600 font-medium">
                    {item.tipo}
                  </td>

                  {/* Fecha y Hora (sin icono de reloj) */}
                  <td className="py-2.5 px-3.5 text-gray-600">
                    {item.fecha}
                  </td>

                  {/* Tamaño */}
                  <td className="py-2.5 px-3.5 font-mono text-gray-600">
                    {item.size}
                  </td>

                  {/* Usuario */}
                  <td className="py-2.5 px-3.5 text-gray-600">
                    {item.usuario}
                  </td>

                  {/* Estado al estilo Usuarios (texto plano / separado) */}
                  <td className="py-2.5 px-3.5 text-gray-800 font-medium">
                    {item.estado}
                  </td>

                  {/* Acciones */}
                  <td className="py-2.5 px-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleDescargar(item)}
                        className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Descargar archivo"
                      >
                        <Download size={15} />
                      </button>
                      <button
                        onClick={() => setItemAEliminar(item)}
                        className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Eliminar respaldo"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {backupsPaginados.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400 text-xs">
                    No se encontraron copias de seguridad.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación Footer */}
        {backupsFiltrados.length > 0 && (
          <div className="p-3 border-t border-gray-100 bg-white flex items-center justify-between gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span>Mostrar</span>
              <select
                value={registrosPorPagina}
                onChange={(e) => {
                  setRegistrosPorPagina(Number(e.target.value))
                  setPaginaActual(1)
                }}
                className="h-7 border border-gray-200 rounded px-1.5 bg-white focus:outline-none focus:border-[#9B0F06]"
              >
                {[8, 16, 24, 50].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <span>registros por página</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                disabled={paginaActual === 1}
                className="p-1 border border-gray-200 rounded text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-2 font-medium text-gray-700 text-[11px]">
                Página {paginaActual} de {totalPaginas || 1}
              </span>
              <button
                onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                disabled={paginaActual === totalPaginas || totalPaginas === 0}
                className="p-1 border border-gray-200 rounded text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal "+ Generar Backup" */}
      {modalGenerarAbierto && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in duration-150">
            <button
              onClick={() => setModalGenerarAbierto(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 text-[#9B0F06] flex items-center justify-center flex-shrink-0">
                <HardDrive size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Generar Copia de Seguridad</h3>
                <p className="text-xs text-gray-500">Configure los parámetros del respaldo instantáneo</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {/* Selector de Tipo */}
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block mb-2">
                  Tipo de Respaldo
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNuevoTipoModal('Completo')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      nuevoTipoModal === 'Completo'
                        ? 'border-[#9B0F06] bg-red-50/30 ring-1 ring-[#9B0F06]'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <span className="text-xs font-bold text-gray-900 block">Completo</span>
                    <span className="text-[11px] text-gray-500 mt-0.5 block">Respaldo total de la base de datos.</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNuevoTipoModal('Incremental')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      nuevoTipoModal === 'Incremental'
                        ? 'border-[#9B0F06] bg-red-50/30 ring-1 ring-[#9B0F06]'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <span className="text-xs font-bold text-gray-900 block">Incremental</span>
                    <span className="text-[11px] text-gray-500 mt-0.5 block">Respaldo parcial por módulos.</span>
                  </button>
                </div>
              </div>

              {/* Si es Incremental, opciones por módulo */}
              {nuevoTipoModal === 'Incremental' && (
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block mb-2">
                    Seleccionar Módulos a Incluir
                  </label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {MODULOS_DISPONIBLES.map((m) => {
                      const checked = modulosModal.includes(m.id)
                      return (
                        <label
                          key={m.id}
                          className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer ${
                            checked ? 'border-[#9B0F06] bg-red-50/20 text-gray-900 font-medium' : 'border-gray-200 text-gray-600'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleModuloModal(m.id)}
                            className="accent-[#9B0F06] rounded"
                          />
                          <span>{m.nombre}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalGenerarAbierto(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGenerarBackup}
                disabled={generando}
                style={{ backgroundColor: '#9B0F06' }}
                className="inline-flex items-center gap-2 text-white px-5 py-2 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {generando ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    Generar Backup Ahora
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {itemAEliminar && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl relative animate-in fade-in zoom-in duration-150">
            <button
              onClick={() => setItemAEliminar(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <ShieldAlert className="text-[#9B0F06]" size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">¿Eliminar Respaldo?</h3>
                <p className="text-xs text-gray-500">Esta acción no se puede deshacer</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 mb-5 leading-relaxed">
              ¿Está seguro de que desea eliminar permanentemente la copia <strong className="text-gray-900 font-mono">{itemAEliminar.nombre}</strong>?
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setItemAEliminar(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEliminar}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
              >
                Eliminar Archivo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
