'use client'

import { useState, useRef, useMemo } from 'react'
import {
  ArrowLeft, RotateCcw, UploadCloud, FileArchive, CheckCircle2, ShieldAlert, X, Search, ChevronLeft, ChevronRight
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const POPPINS = "'Poppins', sans-serif"

interface HistorialRestauracion {
  id: number
  archivo: string
  tipo: 'Completo' | 'Incremental'
  fechaRaw: string // YYYY-MM-DD
  fecha: string
  usuario: string
  tamano: string
  estado: string
}

export default function RestauracionDatosPage() {
  const router = useRouter()
  const [restaurando, setRestaurando] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1)
  const [registrosPorPagina, setRegistrosPorPagina] = useState(8)

  // Modal
  const [modalConfirmacionAbierto, setModalConfirmacionAbierto] = useState(false)
  const [confirmacionTexto, setConfirmacionTexto] = useState('')

  const [historial, setHistorial] = useState<HistorialRestauracion[]>([
    {
      id: 1,
      archivo: 'Backup_DomunNet_Full_20260801.sql',
      tipo: 'Completo',
      fechaRaw: '2026-08-10',
      fecha: '10/08/2026 14:30',
      usuario: 'admin@domunnet.com',
      tamano: '221.5 MB',
      estado: 'Exitoso'
    },
    {
      id: 2,
      archivo: 'Backup_DomunNet_Inc_20260725.sql',
      tipo: 'Incremental',
      fechaRaw: '2026-07-28',
      fecha: '28/07/2026 09:15',
      usuario: 'admin@domunnet.com',
      tamano: '18.9 MB',
      estado: 'Exitoso'
    }
  ])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0]
      if (f.name.endsWith('.sql') || f.name.endsWith('.zip')) {
        setFile(f)
      } else {
        toast.error('Formato no soportado. Seleccione un archivo .sql o .zip')
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0]
      if (f.name.endsWith('.sql') || f.name.endsWith('.zip')) {
        setFile(f)
      } else {
        toast.error('Formato no soportado. Seleccione un archivo .sql o .zip')
      }
    }
  }

  const handleIniciarProceso = () => {
    if (!file) return
    setConfirmacionTexto('')
    setModalConfirmacionAbierto(true)
  }

  const handleEjecutarRestauracion = () => {
    if (confirmacionTexto.trim().toUpperCase() !== 'CONFIRMAR RESTAURACION') {
      toast.error('El texto de confirmación no coincide')
      return
    }

    setRestaurando(true)
    setTimeout(() => {
      setRestaurando(false)
      setModalConfirmacionAbierto(false)

      const fechaHoyObj = new Date()
      const fechaRawStr = fechaHoyObj.toISOString().slice(0, 10)
      const fechaFormatStr = fechaHoyObj.toLocaleString('es-GT', { dateStyle: 'short', timeStyle: 'short' })
      const esInc = file?.name.toLowerCase().includes('inc')

      const nuevoRegistro: HistorialRestauracion = {
        id: Date.now(),
        archivo: file ? file.name : 'Backup_Cargado.sql',
        tipo: esInc ? 'Incremental' : 'Completo',
        fechaRaw: fechaRawStr,
        fecha: fechaFormatStr,
        usuario: 'Usuario Actual',
        tamano: file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : '150 MB',
        estado: 'Exitoso'
      }

      setHistorial([nuevoRegistro, ...historial])
      setFile(null)
      toast.success('La base de datos se ha restaurado con éxito')
    }, 3500)
  }

  // Filtrado de historial
  const historialFiltrado = useMemo(() => {
    return historial.filter(h => {
      const texto = busqueda.toLowerCase()
      const cumpleTexto = h.archivo.toLowerCase().includes(texto) || h.usuario.toLowerCase().includes(texto)
      if (!cumpleTexto) return false

      if (fechaInicio && h.fechaRaw < fechaInicio) return false
      if (fechaFin && h.fechaRaw > fechaFin) return false

      return true
    })
  }, [historial, busqueda, fechaInicio, fechaFin])

  // Paginación
  const totalPaginas = Math.ceil(historialFiltrado.length / registrosPorPagina)
  const historialPaginado = useMemo(() => {
    const inicio = (paginaActual - 1) * registrosPorPagina
    return historialFiltrado.slice(inicio, inicio + registrosPorPagina)
  }, [historialFiltrado, paginaActual, registrosPorPagina])

  return (
    <div style={{ fontFamily: POPPINS, padding: '16px 20px', maxWidth: 1400, margin: '0 auto', minHeight: 'calc(100vh - 100px)' }}>
      {/* Encabezado con Flecha sin Fondo */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push('/dashboard/configuracion')}
          className="p-1.5 text-gray-500 hover:text-gray-900 transition-colors focus:outline-none"
          title="Regresar a Configuración"
        >
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">Restauración de Datos</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">Recupera la estructura y registros del sistema desde una copia de seguridad</p>
        </div>
      </div>

      {/* Área de Carga / Selección de Archivo Backup */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
        <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide mb-3">1. Seleccionar Archivo de Respaldo (.SQL o .ZIP)</h2>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".zip,.sql"
          className="hidden"
        />

        {!file ? (
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 hover:border-[#9B0F06] bg-gray-50/40 hover:bg-red-50/10 rounded-xl p-6 text-center transition-all cursor-pointer group"
          >
            <UploadCloud size={40} className="mx-auto text-gray-400 group-hover:text-[#9B0F06] mb-2 transition-colors" />
            <h3 className="text-xs md:text-sm font-bold text-gray-800 mb-0.5">Haga clic o arrastre el archivo de Backup aquí</h3>
            <p className="text-[11px] text-gray-500">Admite archivos .SQL o .ZIP generados por DomunNet</p>
          </div>
        ) : (
          <div className="border border-red-200 bg-red-50/20 rounded-xl p-4 relative">
            <button
              onClick={() => setFile(null)}
              className="absolute top-4 right-4 text-xs font-semibold text-[#9B0F06] hover:underline"
            >
              Cambiar Archivo
            </button>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 text-[#9B0F06] flex items-center justify-center flex-shrink-0">
                  <FileArchive size={20} />
                </div>
                <div>
                  <h3 className="text-xs md:text-sm font-bold text-gray-900 font-mono">{file.name}</h3>
                  <div className="flex items-center gap-3 mt-0.5 text-[11px] text-gray-500">
                    <span>Tamaño: <strong className="text-gray-700">{(file.size / (1024 * 1024)).toFixed(2)} MB</strong></span>
                    <span>•</span>
                    <span className="text-emerald-700 font-medium">Validación preliminar: Correcta</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleIniciarProceso}
                style={{ backgroundColor: '#9B0F06' }}
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 text-white px-5 py-2 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm"
              >
                <RotateCcw size={15} />
                Iniciar Restauración
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Historial de Restauraciones con Tabla Corporativa */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        {/* Toolbar con Buscador y Filtro por Fecha (Inicio / Fin) */}
        <div className="p-3 border-b border-gray-200 bg-gray-50/80 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value)
                setPaginaActual(1)
              }}
              placeholder="Buscar en historial..."
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#9B0F06] bg-white"
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

        {/* Tabla (1px menor, sin colores en estado) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-2.5 px-3.5">Archivo de Respaldo</th>
                <th className="py-2.5 px-3.5">Tipo</th>
                <th className="py-2.5 px-3.5">Fecha y Hora</th>
                <th className="py-2.5 px-3.5">Tamaño</th>
                <th className="py-2.5 px-3.5">Ejecutado por</th>
                <th className="py-2.5 px-3.5 text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-[11px] text-gray-700">
              {historialPaginado.map((h) => (
                <tr key={h.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-2.5 px-3.5 font-semibold text-gray-900 font-mono">
                    {h.archivo}
                  </td>
                  <td className="py-2.5 px-3.5 text-gray-600 font-medium">
                    {h.tipo}
                  </td>
                  <td className="py-2.5 px-3.5 text-gray-600">{h.fecha}</td>
                  <td className="py-2.5 px-3.5 font-mono text-gray-600">{h.tamano}</td>
                  <td className="py-2.5 px-3.5 text-gray-600">{h.usuario}</td>
                  {/* Estado (sin color de fondo) */}
                  <td className="py-2.5 px-3.5 text-right text-gray-800 font-medium">
                    {h.estado}
                  </td>
                </tr>
              ))}

              {historialPaginado.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400 text-xs">
                    No se registran restauraciones en el historial.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación Footer */}
        {historialFiltrado.length > 0 && (
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

      {/* Modal de Confirmación de Restauración */}
      {modalConfirmacionAbierto && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in duration-150">
            <button
              onClick={() => setModalConfirmacionAbierto(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <ShieldAlert className="text-[#9B0F06]" size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">¿Confirmar Restauración?</h3>
                <p className="text-xs text-gray-500">Se sobreescribirá la base de datos con este respaldo</p>
              </div>
            </div>

            <div className="bg-red-50/70 border border-red-200 rounded-xl p-3.5 text-xs text-red-900 mb-4 space-y-1">
              <p><strong>Archivo a Restaurar:</strong> <span className="font-mono">{file?.name}</span></p>
              <p><strong>Tamaño:</strong> {file ? (file.size / (1024 * 1024)).toFixed(2) : 0} MB</p>
            </div>

            <p className="text-xs text-gray-600 mb-2 font-medium">
              Escriba <span className="font-bold text-gray-900 uppercase">CONFIRMAR RESTAURACION</span> para autorizar:
            </p>

            <input
              type="text"
              value={confirmacionTexto}
              onChange={(e) => setConfirmacionTexto(e.target.value)}
              placeholder="CONFIRMAR RESTAURACION"
              className="w-full text-xs p-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-[#9B0F06] focus:ring-1 focus:ring-[#9B0F06] mb-5 font-mono"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalConfirmacionAbierto(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEjecutarRestauracion}
                disabled={restaurando || confirmacionTexto.trim().toUpperCase() !== 'CONFIRMAR RESTAURACION'}
                style={{ backgroundColor: '#9B0F06' }}
                className="inline-flex items-center gap-2 text-white px-5 py-2 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {restaurando ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Restaurando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} />
                    Confirmar e Iniciar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
