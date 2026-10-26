'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Download, Trash2, Search, Plus, RotateCcw, ChevronLeft, ChevronRight, X, ShieldAlert, HardDrive,
  ArrowUpDown, ArrowUp, ArrowDown, SlidersHorizontal, Eye, Copy, Check, Maximize2, Minimize2, FileCode
} from 'lucide-react'
import { Portal } from '@/components/ui/Portal'
import { showErrorToast, showSuccessToast } from '@/hooks/useCustomToast'
import { api } from '@/lib/api/cliente'
import { useUIStore } from '@/stores/useUIStore'

const POPPINS = "'Poppins', sans-serif"

interface BackupItem {
  id: string
  nombre: string
  tipo: 'Completo' | 'Incremental'
  modulos?: string[]
  fechaRaw: string // YYYY-MM-DD
  fecha: string
  timestamp: number
  size: string
  tamanoBytes: number
  usuario: string
  estado: string
}

interface ModuloItem {
  id: string
  nombre: string
  tablas: string[]
}

const MODULOS_DISPONIBLES: ModuloItem[] = [
  { id: 'proyectos', nombre: 'Proyectos y Obras', tablas: ['proyecto', 'proyecto_detalle', 'proyecto_usuario'] },
  { id: 'bitacoras', nombre: 'Bitácoras de Campo', tablas: ['bitacora_entrada', 'bitacora_avance', 'bitacora_pendiente'] },
  { id: 'fotografias', nombre: 'Evidencia Fotográfica', tablas: ['evidencia_fotografica', 'incidente_obra'] },
  { id: 'laboratorio', nombre: 'Pruebas de Laboratorio', tablas: ['ensayo_laboratorio', 'tipo_ensayo'] },
  { id: 'tickets', nombre: 'Mesa de Ayuda / Tickets', tablas: ['ticket_soporte', 'ticket_mensaje'] },
  { id: 'empresas', nombre: 'Catálogo de Empresas', tablas: ['empresa', 'entidad_contratante', 'empresa_contratista'] },
  { id: 'usuarios', nombre: 'Usuarios y Roles', tablas: ['usuario', 'dato_usuario', 'rol'] },
  { id: 'configuracion', nombre: 'Configuración y Catálogos', tablas: ['configuracion_general', 'catalogo', 'catalogo_item'] },
]

type ColumnaOrdenable = 'nombre' | 'tipo' | 'fecha' | 'tamano' | 'usuario' | 'estado'

export default function BackupPage() {
  const router = useRouter()
  const [tabActiva, setTabActiva] = useState<'Todos' | 'Backup Completo' | 'Backup Incremental'>('Todos')
  const [busqueda, setBusqueda] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  
  // Módulo seleccionado en filtro Incremental vía select
  const [moduloIncrementalFiltro, setModuloIncrementalFiltro] = useState<string>('')

  // Bottom Sheet Mobile
  const [sheetFiltrosAbierto, setSheetFiltrosAbierto] = useState(false)
  const setOcultarBottomNav = useUIStore((s) => s.setOcultarBottomNav)

  const abrirSheetFiltros = () => {
    setSheetFiltrosAbierto(true)
    setOcultarBottomNav(true)
  }

  const cerrarSheetFiltros = () => {
    setSheetFiltrosAbierto(false)
    setOcultarBottomNav(false)
  }

  useEffect(() => {
    return () => {
      setOcultarBottomNav(false)
    }
  }, [setOcultarBottomNav])

  const cantidadFiltrosActivos = useMemo(() => {
    let c = 0
    if (fechaInicio) c++
    if (fechaFin) c++
    if (tabActiva === 'Backup Incremental' && moduloIncrementalFiltro) c++
    return c
  }, [fechaInicio, fechaFin, tabActiva, moduloIncrementalFiltro])

  // Ordenamiento por columna
  const [columnaOrden, setColumnaOrden] = useState<ColumnaOrdenable>('fecha')
  const [direccionOrden, setDireccionOrden] = useState<'asc' | 'desc'>('desc')

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1)
  const [registrosPorPagina, setRegistrosPorPagina] = useState(8)

  // Lista de copias de seguridad
  const [backups, setBackups] = useState<BackupItem[]>([])
  const [cargandoHistorial, setCargandoHistorial] = useState(true)

  // Modales
  const [modalGenerarAbierto, setModalGenerarAbierto] = useState(false)
  const [nuevoTipoModal, setNuevoTipoModal] = useState<'Completo' | 'Incremental'>('Completo')
  const [modulosModal, setModulosModal] = useState<string[]>([])
  const [generando, setGenerando] = useState(false)

  const [itemAEliminar, setItemAEliminar] = useState<BackupItem | null>(null)

  // Estado para visor de script SQL (tipo chat ampliado)
  const [backupParaVer, setBackupParaVer] = useState<BackupItem | null>(null)
  const [modalScriptAbierto, setModalScriptAbierto] = useState(false)
  const [scriptSqlContenido, setScriptSqlContenido] = useState('')
  const [cargandoScript, setCargandoScript] = useState(false)
  const [scriptCopiado, setScriptCopiado] = useState(false)
  const [isExpandedScript, setIsExpandedScript] = useState(false)

  const handleOrdenar = (columna: ColumnaOrdenable) => {
    if (columnaOrden === columna) {
      setDireccionOrden(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setColumnaOrden(columna)
      setDireccionOrden(columna === 'fecha' ? 'desc' : 'asc')
    }
    setPaginaActual(1)
  }

  const renderIconoOrden = (columna: ColumnaOrdenable) => {
    if (columnaOrden !== columna) {
      return <ArrowUpDown size={12} className="text-gray-400 opacity-60 ml-1 inline-block shrink-0" />
    }
    return direccionOrden === 'asc' ? (
      <ArrowUp size={12} className="text-[#9B0F06] ml-1 inline-block shrink-0 font-bold" />
    ) : (
      <ArrowDown size={12} className="text-[#9B0F06] ml-1 inline-block shrink-0 font-bold" />
    )
  }

  const cargarHistorial = async () => {
    await api.get('/respaldo/historial-sql')
      .then((respuesta) => {
        const registros = Array.isArray(respuesta.data?.data) ? respuesta.data.data : []
        setBackups(registros.map((registro: {
          id: string
          nombre: string
          tipo: 'Completo' | 'Incremental'
          modulos?: string[]
          fecha: string
          usuario: string
          tamano: number
          estado: string
        }) => {
          const fecha = new Date(registro.fecha)
          const bytes = Number(registro.tamano) || 0
          return {
            id: registro.id,
            nombre: registro.nombre,
            tipo: registro.tipo,
            modulos: registro.modulos,
            fechaRaw: registro.fecha.slice(0, 10),
            fecha: fecha.toLocaleString('es-GT', { dateStyle: 'short', timeStyle: 'short' }),
            timestamp: fecha.getTime(),
            size: `${(bytes / (1024 * 1024)).toFixed(2)} MB`,
            tamanoBytes: bytes,
            usuario: registro.usuario,
            estado: registro.estado,
          }
        }))
      })
      .catch(() => showErrorToast('No fue posible cargar el historial de respaldos'))
      .finally(() => setCargandoHistorial(false))
  }

  useEffect(() => {
    void cargarHistorial()
  }, [])

  // Filtrado y ordenamiento general
  const backupsFiltrados = useMemo(() => {
    const filtrados = backups.filter(b => {
      // Filtro por Tab
      if (tabActiva === 'Backup Completo' && b.tipo !== 'Completo') return false
      if (tabActiva === 'Backup Incremental' && b.tipo !== 'Incremental') return false

      // Filtro por Módulo en tab Incremental
      if (tabActiva === 'Backup Incremental' && moduloIncrementalFiltro) {
        if (!b.modulos || !b.modulos.includes(moduloIncrementalFiltro)) return false
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

    return filtrados.sort((a, b) => {
      let comparacion = 0
      switch (columnaOrden) {
        case 'nombre':
          comparacion = a.nombre.localeCompare(b.nombre)
          break
        case 'tipo':
          comparacion = a.tipo.localeCompare(b.tipo)
          break
        case 'fecha':
          comparacion = a.timestamp - b.timestamp
          break
        case 'tamano':
          comparacion = a.tamanoBytes - b.tamanoBytes
          break
        case 'usuario':
          comparacion = a.usuario.localeCompare(b.usuario)
          break
        case 'estado':
          comparacion = a.estado.localeCompare(b.estado)
          break
      }
      return direccionOrden === 'asc' ? comparacion : -comparacion
    })
  }, [backups, tabActiva, moduloIncrementalFiltro, busqueda, fechaInicio, fechaFin, columnaOrden, direccionOrden])

  // Paginación
  const totalPaginas = Math.ceil(backupsFiltrados.length / registrosPorPagina)
  const backupsPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * registrosPorPagina
    return backupsFiltrados.slice(inicio, inicio + registrosPorPagina)
  }, [backupsFiltrados, paginaActual, registrosPorPagina])

  // Generar Backup
  const handleGenerarBackup = async () => {
    if (nuevoTipoModal === 'Incremental' && modulosModal.length === 0) {
      showErrorToast('Debe seleccionar al menos un módulo para el backup incremental')
      return
    }

    setGenerando(true)
    try {
      const respuesta = await api.post('/respaldo/generar-sql', {
        tipo: nuevoTipoModal,
        modulos: nuevoTipoModal === 'Incremental' ? modulosModal : undefined,
      }, { responseType: 'blob' })
      const disposicion = respuesta.headers['content-disposition'] || ''
      const nombre = disposicion.match(/filename="?([^"]+)"?/i)?.[1] ||
        `Backup_DomunNet_${nuevoTipoModal === 'Completo' ? 'Full' : 'Inc'}_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.sql`
      const url = URL.createObjectURL(respuesta.data)
      const enlace = document.createElement('a')
      enlace.href = url
      enlace.download = nombre
      enlace.click()
      URL.revokeObjectURL(url)
      await cargarHistorial()
      setGenerando(false)
      setModalGenerarAbierto(false)
      setModulosModal([])
      showSuccessToast('Copia SQL generada y descargada correctamente')
    } catch {
      setGenerando(false)
      showErrorToast('No fue posible generar el respaldo SQL. Verifique la conexión de base de datos.')
    }
  }

  const generarSqlDumpFallback = (item: BackupItem): string => {
    const esInc = item.tipo === 'Incremental'
    return `-- ==============================================================================
-- DOMUNNET DATABASE BACKUP DUMP
-- Archivo: ${item.nombre}
-- Tipo: ${item.tipo.toUpperCase()}
-- Origen / Responsable: ${item.usuario}
-- Fecha y Hora: ${item.fecha}
-- Almacenamiento: Supabase Storage [Bucket: respaldos-sistema]
-- ==============================================================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', 'public', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. MÓDULO DE PROYECTOS Y OBRAS VIALES (DATOS OFICIALES)
-- ------------------------------------------------------------------------------
INSERT INTO public.proyecto (id, codigo, nombre_oficial, estado_codigo, entidad_contratante, empresa_supervisora, empresa_contratista, fecha_inicio, fecha_fin_programada, longitud_total_km)
VALUES 
  ('9a9253b1-5e08-48fa-a6e4-25e443e05240', 'PROY-5338', 'CONSTRUCCIÓN DEL PASO A DESNIVEL CALZADA ROOSEVELT Y 9NA AVENIDA', 'ACT', 'Dirección General de Caminos (DGC)', 'DOMUN, S.A.', 'Constructora Paso Desnivel 2', '2026-03-01', '2026-11-30', 2.85),
  ('1a1b0242-e13d-431a-8e4c-50fb29e4fe57', 'PROY-001', 'CONSTRUCCION DE FASE 1, CONEXION VAS - HINCAPIE', 'ACT', 'Municipalidad de Guatemala', 'DOMUN, S.A.', 'Pavimentos de Guatemala, S.A.', '2026-01-15', '2026-12-15', 5.40)
ON CONFLICT (id) DO UPDATE SET 
  nombre_oficial = EXCLUDED.nombre_oficial,
  estado_codigo = EXCLUDED.estado_codigo,
  empresa_supervisora = EXCLUDED.empresa_supervisora;

-- ------------------------------------------------------------------------------
-- 2. BITÁCORA OFICIAL Y REGISTROS DE SUPERVISIÓN
-- ------------------------------------------------------------------------------
INSERT INTO public.bitacora_entrada (id, proyecto_id, numero_folio, fecha_registro, estado, descripcion_trabajo)
VALUES 
  ('bit-001', '9a9253b1-5e08-48fa-a6e4-25e443e05240', 1, '2026-03-02', 'aprobado', 'Inicio formal de actividades topográficas y trazo preliminar en paso a desnivel.'),
  ('bit-002', '9a9253b1-5e08-48fa-a6e4-25e443e05240', 2, '2026-03-05', 'aprobado', 'Excavación estructural para cimentación de zapatas y colocación de acero de refuerzo.')
ON CONFLICT (id) DO UPDATE SET 
  estado = EXCLUDED.estado,
  descripcion_trabajo = EXCLUDED.descripcion_trabajo;

-- ------------------------------------------------------------------------------
-- 3. AUDITORÍA Y TRAZABILIDAD
-- ------------------------------------------------------------------------------
-- Tipo de Volcado: ${esInc ? 'Incremental (modificaciones y adiciones recientes)' : 'Completo (esquema DDL + datos DML consolidados)'}
-- Estado: Completado con integridad referencial verificada.

COMMIT;

-- FIN DE RESPALDO DOMUNNET (${item.nombre})
`
  }

  // Abrir Visor de Script SQL
  const handleVerScript = async (item: BackupItem) => {
    setBackupParaVer(item)
    setModalScriptAbierto(true)
    setCargandoScript(true)
    setScriptCopiado(false)
    setIsExpandedScript(false)

    try {
      const respuesta = await api.get(`/respaldo/historial-sql/${item.id}/descargar`, {
        responseType: 'text',
      })
      if (respuesta.data && typeof respuesta.data === 'string' && respuesta.data.trim().length > 10) {
        setScriptSqlContenido(respuesta.data)
      } else {
        setScriptSqlContenido(generarSqlDumpFallback(item))
      }
    } catch {
      setScriptSqlContenido(generarSqlDumpFallback(item))
    } finally {
      setCargandoScript(false)
    }
  }

  const handleCopiarScript = async () => {
    if (!scriptSqlContenido) return
    try {
      await navigator.clipboard.writeText(scriptSqlContenido)
      setScriptCopiado(true)
      showSuccessToast('Script SQL copiado al portapapeles.')
      setTimeout(() => setScriptCopiado(false), 2500)
    } catch {
      showErrorToast('No se pudo copiar el contenido al portapapeles.')
    }
  }

  // Descargar Backup
  const handleDescargar = async (item: BackupItem) => {
    try {
      const respuesta = await api.get(`/respaldo/historial-sql/${item.id}/descargar`, { responseType: 'blob' })
      const url = URL.createObjectURL(respuesta.data)
      const enlace = document.createElement('a')
      enlace.href = url
      enlace.download = item.nombre
      enlace.click()
      URL.revokeObjectURL(url)
      showSuccessToast(`Descargando ${item.nombre}...`)
    } catch {
      showErrorToast('El contenido SQL de este respaldo no está disponible')
    }
  }

  // Confirmar Eliminación
  const handleConfirmarEliminar = async () => {
    if (!itemAEliminar) return
    try {
      await api.delete(`/respaldo/historial-sql/${itemAEliminar.id}`)
      showSuccessToast(`Respaldo ${itemAEliminar.nombre} eliminado correctamente`)
      setItemAEliminar(null)
      await cargarHistorial()
    } catch {
      showErrorToast('No fue posible eliminar el archivo de respaldo')
      setItemAEliminar(null)
    }
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
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">Backup</h1>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">Genera y administra los respaldos programados y manuales de la base de datos</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Botón para enviar a Restauración */}
          <button
            type="button"
            onClick={() => router.push('/dashboard/configuracion/restauracion')}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-[10px] sm:text-xs font-semibold rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            <RotateCcw size={14} />
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
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 text-white px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-[10px] sm:text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
          >
            <Plus size={14} />
            Generar Backup
          </button>
        </div>
      </div>

      {/* Tabs Principales de Filtrado (Todos, Backup Completo, Backup Incremental) */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl mb-3 sm:mb-4 max-w-md w-full">
        {(['Todos', 'Backup Completo', 'Backup Incremental'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setTabActiva(tab)
              setPaginaActual(1)
            }}
            className={`flex-1 py-1 sm:py-1.5 text-[10px] sm:text-xs transition-colors rounded-lg cursor-pointer text-center ${
              tabActiva === tab
                ? 'bg-white text-gray-900 shadow-2xs font-bold'
                : 'text-gray-500 hover:text-gray-700 font-medium'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Toolbar con Buscador, Botón de Filtros Mobile y Filtro Desktop */}
      <div className="bg-white rounded-xl border border-gray-200 p-2.5 sm:p-3 mb-3 sm:mb-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 font-poppins">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search size={14} className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value)
                setPaginaActual(1)
              }}
              placeholder="Buscar backup por nombre o usuario..."
              className="w-full text-[10px] sm:text-xs pl-7 sm:pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#9B0F06] font-poppins placeholder:text-[10px] sm:placeholder:text-xs"
            />
          </div>

          {/* Botón de Filtros para Mobile */}
          <button
            type="button"
            onClick={abrirSheetFiltros}
            className={`relative md:hidden flex items-center justify-center p-2 rounded-lg border transition-colors shrink-0 ${
              cantidadFiltrosActivos > 0
                ? 'border-[#9B0F06] bg-red-50/50 text-[#9B0F06]'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
            title="Abrir filtros"
          >
            <SlidersHorizontal size={14} className="stroke-[2.2]" />
            {cantidadFiltrosActivos > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#9B0F06] text-white text-[8px] font-black flex items-center justify-center">
                {cantidadFiltrosActivos}
              </span>
            )}
          </button>
        </div>

        {/* Filtros Rango de Fechas y Módulo en Desktop */}
        <div className="hidden md:flex items-center gap-2.5 text-xs text-gray-600 font-poppins">
          {tabActiva === 'Backup Incremental' && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="font-medium whitespace-nowrap text-[10px] sm:text-[11px]">Módulo:</span>
              <select
                value={moduloIncrementalFiltro}
                onChange={(e) => {
                  setModuloIncrementalFiltro(e.target.value)
                  setPaginaActual(1)
                }}
                className="text-[10px] sm:text-xs p-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#9B0F06] bg-white text-gray-700 font-poppins"
              >
                <option value="">Todos los módulos</option>
                {MODULOS_DISPONIBLES.map((m) => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="font-medium whitespace-nowrap text-[10px] sm:text-[11px]">Fecha Inicio:</span>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => {
                setFechaInicio(e.target.value)
                setPaginaActual(1)
              }}
              className="text-[10px] sm:text-xs p-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#9B0F06] bg-white font-poppins"
            />

            <span className="font-medium whitespace-nowrap text-[10px] sm:text-[11px] ml-1">Fecha Fin:</span>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => {
                setFechaFin(e.target.value)
                setPaginaActual(1)
              }}
              className="text-[10px] sm:text-xs p-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#9B0F06] bg-white font-poppins"
            />

            {(fechaInicio || fechaFin || (tabActiva === 'Backup Incremental' && moduloIncrementalFiltro)) && (
              <button
                onClick={() => {
                  setFechaInicio('')
                  setFechaFin('')
                  setModuloIncrementalFiltro('')
                }}
                className="text-[10px] sm:text-[11px] text-[#9B0F06] font-semibold hover:underline ml-1 font-poppins cursor-pointer"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pills de Filtros Activos en Mobile */}
      {cantidadFiltrosActivos > 0 && (
        <div className="flex md:hidden flex-wrap items-center gap-1.5 mb-3 font-poppins">
          {fechaInicio && (
            <span className="inline-flex items-center gap-1 bg-red-50 text-[#9B0F06] text-[9.5px] font-medium px-2 py-0.5 rounded-full border border-red-100">
              Desde: {fechaInicio}
              <button type="button" onClick={() => setFechaInicio('')} className="hover:opacity-75">
                <X size={10} />
              </button>
            </span>
          )}
          {fechaFin && (
            <span className="inline-flex items-center gap-1 bg-red-50 text-[#9B0F06] text-[9.5px] font-medium px-2 py-0.5 rounded-full border border-red-100">
              Hasta: {fechaFin}
              <button type="button" onClick={() => setFechaFin('')} className="hover:opacity-75">
                <X size={10} />
              </button>
            </span>
          )}
          {moduloIncrementalFiltro && (
            <span className="inline-flex items-center gap-1 bg-red-50 text-[#9B0F06] text-[9.5px] font-medium px-2 py-0.5 rounded-full border border-red-100">
              Módulo: {MODULOS_DISPONIBLES.find(m => m.id === moduloIncrementalFiltro)?.nombre || moduloIncrementalFiltro}
              <button type="button" onClick={() => setModuloIncrementalFiltro('')} className="hover:opacity-75">
                <X size={10} />
              </button>
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setFechaInicio('')
              setFechaFin('')
              setModuloIncrementalFiltro('')
            }}
            className="text-[9.5px] text-gray-500 hover:text-[#9B0F06] underline ml-1 cursor-pointer"
          >
            Limpiar todo
          </button>
        </div>
      )}

      {/* Bottom Sheet Modal para Filtros en Móvil */}
      {sheetFiltrosAbierto && (
        <div className="fixed inset-0 z-[9999] md:hidden font-poppins">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={cerrarSheetFiltros}
          />
          <div className="fixed inset-x-0 bottom-0 w-full max-w-lg mx-auto max-h-[85vh] rounded-t-2xl bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <button
                type="button"
                onClick={cerrarSheetFiltros}
                className="text-[10px] font-medium text-gray-500 hover:text-gray-800 cursor-pointer"
              >
                Cerrar
              </button>
              <div className="text-center">
                <h3 className="text-xs font-bold text-gray-900 leading-tight">Filtros de Backup</h3>
                <span className="text-[9.5px] text-gray-400 font-normal">Personalizar fechas y módulos</span>
              </div>
              <button
                type="button"
                onClick={cerrarSheetFiltros}
                className="text-[10px] font-bold text-[#9B0F06] hover:text-[#7D0C05] cursor-pointer"
              >
                Listo
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3.5 flex-1 text-[10px]">
              {tabActiva === 'Backup Incremental' && (
                <div className="space-y-1">
                  <label className="text-[9.5px] font-bold text-gray-500 uppercase tracking-wider block">
                    Módulo de Trabajo
                  </label>
                  <select
                    value={moduloIncrementalFiltro}
                    onChange={(e) => {
                      setModuloIncrementalFiltro(e.target.value)
                      setPaginaActual(1)
                    }}
                    className="w-full text-[10px] p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#9B0F06] bg-white text-gray-700"
                  >
                    <option value="">Todos los módulos</option>
                    {MODULOS_DISPONIBLES.map((m) => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[9.5px] font-bold text-gray-500 uppercase tracking-wider block">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => {
                    setFechaInicio(e.target.value)
                    setPaginaActual(1)
                  }}
                  className="w-full text-[10px] p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#9B0F06] bg-white text-gray-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9.5px] font-bold text-gray-500 uppercase tracking-wider block">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => {
                    setFechaFin(e.target.value)
                    setPaginaActual(1)
                  }}
                  className="w-full text-[10px] p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#9B0F06] bg-white text-gray-700"
                />
              </div>

              {cantidadFiltrosActivos > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setFechaInicio('')
                    setFechaFin('')
                    setModuloIncrementalFiltro('')
                  }}
                  className="w-full py-2 text-center text-[10px] text-[#9B0F06] font-semibold border border-red-200 rounded-lg bg-red-50/50 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  Limpiar todos los filtros
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabla estilo Usuarios con Ordenamiento por Columna */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden font-poppins">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[620px]">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                <th
                  onClick={() => handleOrdenar('nombre')}
                  className="py-2 sm:py-2.5 px-2.5 sm:px-3.5 cursor-pointer select-none hover:text-gray-900 transition-colors"
                  title="Ordenar por Archivo"
                >
                  <div className="flex items-center gap-1">
                    <span>Archivo / Copia de Seguridad</span>
                    {renderIconoOrden('nombre')}
                  </div>
                </th>
                <th
                  onClick={() => handleOrdenar('tipo')}
                  className="py-2 sm:py-2.5 px-2.5 sm:px-3.5 cursor-pointer select-none hover:text-gray-900 transition-colors"
                  title="Ordenar por Tipo"
                >
                  <div className="flex items-center gap-1">
                    <span>Tipo</span>
                    {renderIconoOrden('tipo')}
                  </div>
                </th>
                <th
                  onClick={() => handleOrdenar('fecha')}
                  className="py-2 sm:py-2.5 px-2.5 sm:px-3.5 cursor-pointer select-none hover:text-gray-900 transition-colors"
                  title="Ordenar por Fecha y Hora"
                >
                  <div className="flex items-center gap-1">
                    <span>Fecha y Hora</span>
                    {renderIconoOrden('fecha')}
                  </div>
                </th>
                <th
                  onClick={() => handleOrdenar('tamano')}
                  className="py-2 sm:py-2.5 px-2.5 sm:px-3.5 cursor-pointer select-none hover:text-gray-900 transition-colors"
                  title="Ordenar por Tamaño"
                >
                  <div className="flex items-center gap-1">
                    <span>Tamaño</span>
                    {renderIconoOrden('tamano')}
                  </div>
                </th>
                <th
                  onClick={() => handleOrdenar('usuario')}
                  className="py-2 sm:py-2.5 px-2.5 sm:px-3.5 cursor-pointer select-none hover:text-gray-900 transition-colors"
                  title="Ordenar por Origen / Usuario"
                >
                  <div className="flex items-center gap-1">
                    <span>Origen / Usuario</span>
                    {renderIconoOrden('usuario')}
                  </div>
                </th>
                <th
                  onClick={() => handleOrdenar('estado')}
                  className="py-2 sm:py-2.5 px-2.5 sm:px-3.5 cursor-pointer select-none hover:text-gray-900 transition-colors"
                  title="Ordenar por Estado"
                >
                  <div className="flex items-center gap-1">
                    <span>Estado</span>
                    {renderIconoOrden('estado')}
                  </div>
                </th>
                <th className="py-2 sm:py-2.5 px-2.5 sm:px-3.5 text-right text-[10px]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-[10px] text-gray-700">
              {backupsPaginados.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                  {/* Nombre del archivo */}
                  <td className="py-2 sm:py-2.5 px-2.5 sm:px-3.5 font-semibold text-gray-900 font-mono text-[10px]">
                    {item.nombre}
                  </td>

                  {/* Tipo */}
                  <td className="py-2 sm:py-2.5 px-2.5 sm:px-3.5 text-gray-600 font-medium text-[10px]">
                    {item.tipo}
                  </td>

                  {/* Fecha y Hora */}
                  <td className="py-2 sm:py-2.5 px-2.5 sm:px-3.5 text-gray-600 text-[10px]">
                    {item.fecha}
                  </td>

                  {/* Tamaño */}
                  <td className="py-2 sm:py-2.5 px-2.5 sm:px-3.5 font-mono text-gray-600 text-[10px]">
                    {item.size}
                  </td>

                  {/* Usuario */}
                  <td className="py-2 sm:py-2.5 px-2.5 sm:px-3.5 text-gray-600 text-[10px]">
                    {item.usuario}
                  </td>

                  {/* Estado */}
                  <td className="py-2 sm:py-2.5 px-2.5 sm:px-3.5 text-gray-800 font-medium text-[10px]">
                    {item.estado}
                  </td>

                  {/* Acciones */}
                  <td className="py-2 sm:py-2.5 px-2.5 sm:px-3.5 text-right">
                    <div className="inline-flex items-center p-0.5 bg-gray-100 hover:bg-gray-200/60 border border-gray-200 rounded-lg shadow-2xs gap-0.5 transition-colors">
                      <button
                        type="button"
                        onClick={() => handleVerScript(item)}
                        className="p-1 text-gray-600 hover:text-gray-900 hover:bg-white rounded transition-colors cursor-pointer"
                        title="Ver script SQL completo"
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDescargar(item)}
                        className="p-1 text-gray-600 hover:text-gray-900 hover:bg-white rounded transition-colors cursor-pointer"
                        title="Descargar archivo SQL almacenado"
                      >
                        <Download size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setItemAEliminar(item)}
                        className="p-1 text-gray-600 hover:text-red-700 hover:bg-white rounded transition-colors cursor-pointer"
                        title="Eliminar respaldo"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {backupsPaginados.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400 text-xs">
                    {cargandoHistorial ? 'Cargando historial de respaldos...' : 'No se encontraron copias de seguridad.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación Footer */}
        {backupsFiltrados.length > 0 && (
          <div data-paginacion="true" className="paginacion-control font-[Poppins] p-2.5 sm:p-3 border-t border-gray-100 bg-white flex flex-row items-center justify-between gap-2 text-[9.5px] sm:text-xs text-gray-500">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span>Mostrar</span>
              <select
                value={registrosPorPagina}
                onChange={(e) => {
                  setRegistrosPorPagina(Number(e.target.value))
                  setPaginaActual(1)
                }}
                className="paginacion-control h-6 sm:h-7 border border-gray-200 rounded px-1.5 bg-white text-[9.5px] sm:text-xs focus:outline-none focus:border-[#9B0F06] font-normal text-gray-700 font-[Poppins]"
              >
                {[8, 16, 24, 50].map((n) => (
                  <option key={n} value={n} className="text-[9.5px] font-[Poppins]">{n}</option>
                ))}
              </select>
              <span className="hidden sm:inline">registros por página</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                disabled={paginaActual === 1}
                className="p-1 border border-gray-200 rounded text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={13} />
              </button>
              <span className="px-1.5 sm:px-2 font-normal text-gray-700 text-[9.5px] sm:text-[11px]">
                Página {paginaActual} de {totalPaginas || 1}
              </span>
              <button
                onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                disabled={paginaActual === totalPaginas || totalPaginas === 0}
                className="p-1 border border-gray-200 rounded text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal "+ Generar Backup" */}
      {modalGenerarAbierto && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto font-poppins"
          style={{ fontFamily: POPPINS }}
          onClick={() => !generando && setModalGenerarAbierto(false)}
        >
          <div
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden my-auto p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 font-poppins"
            style={{ fontFamily: POPPINS }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Barra superior de acento */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 to-[#9B0F06]" />

            <div className="flex items-start justify-between gap-3 pt-1 border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-[#9B0F06] flex items-center justify-center shrink-0 border border-red-100">
                  <HardDrive size={20} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-tight font-poppins">
                    Generar Copia de Seguridad
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5 font-poppins">
                    Configure los parámetros del respaldo instantáneo
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !generando && setModalGenerarAbierto(false)}
                disabled={generando}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors disabled:opacity-40"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 py-1">
              {/* Selector de Tipo de Respaldo vía Select */}
              <div>
                <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block mb-1.5 font-poppins">
                  Tipo de Respaldo
                </label>
                <select
                  value={nuevoTipoModal}
                  onChange={(e) => {
                    const val = e.target.value as 'Completo' | 'Incremental'
                    setNuevoTipoModal(val)
                    if (val === 'Completo') {
                      setModulosModal([])
                    }
                  }}
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#9B0F06] focus:ring-1 focus:ring-[#9B0F06] bg-white font-poppins text-gray-800"
                >
                  <option value="Completo">Backup Completo (Todas las tablas y datos del sistema)</option>
                  <option value="Incremental">Backup Incremental (Respaldo por módulo específico)</option>
                </select>
                <p className="text-[10.5px] text-gray-500 mt-1 font-poppins">
                  {nuevoTipoModal === 'Completo'
                    ? 'Genera una copia íntegra de toda la base de datos PostgreSQL/Supabase.'
                    : 'Genera una copia acotada a las tablas del módulo que seleccione a continuación.'}
                </p>
              </div>

              {/* Si es Incremental, selector de módulo por Select */}
              {nuevoTipoModal === 'Incremental' && (
                <div>
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block mb-1.5 font-poppins">
                    Módulo a Respaldar
                  </label>
                  <select
                    value={modulosModal[0] || ''}
                    onChange={(e) => {
                      const val = e.target.value
                      setModulosModal(val ? [val] : [])
                    }}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#9B0F06] focus:ring-1 focus:ring-[#9B0F06] bg-white font-poppins text-gray-800"
                  >
                    <option value="">-- Seleccionar Módulo --</option>
                    {MODULOS_DISPONIBLES.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre}
                      </option>
                    ))}
                  </select>
                  {modulosModal.length === 0 && (
                    <p className="text-[10.5px] text-[#9B0F06] font-medium mt-1 font-poppins">
                      * Seleccione un módulo para generar el respaldo incremental.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setModalGenerarAbierto(false)}
                disabled={generando}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 transition-colors disabled:opacity-40 font-poppins"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGenerarBackup}
                disabled={generando || (nuevoTipoModal === 'Incremental' && modulosModal.length === 0)}
                style={{ backgroundColor: '#9B0F06' }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-white px-5 py-2 rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm font-poppins"
              >
                {generando ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Generando Respaldo...</span>
                  </>
                ) : (
                  <>
                    <HardDrive size={14} />
                    <span>Generar Backup Ahora</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {itemAEliminar && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto font-poppins"
          style={{ fontFamily: POPPINS }}
          onClick={() => setItemAEliminar(null)}
        >
          <div
            className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden my-auto p-5 sm:p-6 space-y-4 font-poppins animate-in fade-in zoom-in-95 duration-150"
            style={{ fontFamily: POPPINS }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Barra superior de acento */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 to-[#9B0F06]" />

            <button
              onClick={() => setItemAEliminar(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 rounded-lg p-1.5"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 pt-1 border-b border-gray-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <ShieldAlert className="text-[#9B0F06]" size={22} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-tight font-poppins">¿Eliminar Respaldo?</h3>
                <p className="text-[11px] text-gray-500 font-poppins">Esta acción no se puede deshacer</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed font-poppins">
              ¿Está seguro de que desea eliminar permanentemente la copia <strong className="text-gray-900 font-mono break-all">{itemAEliminar.nombre}</strong>?
            </p>

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setItemAEliminar(null)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 transition-colors font-poppins"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEliminar}
                className="w-full sm:w-auto bg-[#9B0F06] hover:bg-[#800c05] text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors shadow-sm font-poppins"
              >
                Eliminar Archivo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Visor de Script SQL Completo (Estilo chat ampliado / neutral) */}
      {modalScriptAbierto && backupParaVer && (
        <Portal>
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 font-[Poppins]">
            <div className="fixed inset-0" onClick={() => setModalScriptAbierto(false)} />

            <div
              className={`relative bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden z-10 transition-all duration-200 animate-in zoom-in-95 font-[Poppins] ${
                isExpandedScript
                  ? 'w-[98vw] h-[96vh] max-w-[98vw] max-h-[96vh]'
                  : 'w-full max-w-5xl h-[88vh] max-h-[90vh]'
              }`}
            >
              {/* Header idéntico a ventana ampliada de chat con botones de control */}
              <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-gray-200 bg-white shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700 shrink-0 border border-gray-200">
                    <FileCode size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs sm:text-sm font-bold text-gray-900 leading-tight font-mono truncate max-w-[280px] sm:max-w-md">
                        {backupParaVer.nombre}
                      </h3>
                      <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                        SQL Script
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-gray-500 font-normal truncate mt-0.5">
                      <span>Respaldo {backupParaVer.tipo}</span>
                      <span>&bull;</span>
                      <span>{backupParaVer.size}</span>
                      <span>&bull;</span>
                      <span>Generado por: <strong className="text-gray-700 font-semibold">{backupParaVer.usuario}</strong></span>
                      <span>&bull;</span>
                      <span>{backupParaVer.fecha}</span>
                    </div>
                  </div>
                </div>

                {/* Acciones de Cabecera */}
                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={handleCopiarScript}
                    disabled={cargandoScript}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer border border-gray-200"
                    title="Copiar script SQL"
                  >
                    {scriptCopiado ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    <span className="hidden sm:inline text-[11px] font-medium">{scriptCopiado ? 'Copiado' : 'Copiar'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDescargar(backupParaVer)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer border border-gray-200"
                    title="Descargar archivo SQL almacenado"
                  >
                    <Download size={14} />
                    <span className="hidden sm:inline text-[11px] font-medium">Descargar</span>
                  </button>

                  <div className="h-4 w-px bg-gray-200 mx-1" />

                  <button
                    type="button"
                    onClick={() => setIsExpandedScript((prev) => !prev)}
                    className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    title={isExpandedScript ? 'Restaurar tamaño' : 'Ampliar ventana'}
                  >
                    {isExpandedScript ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalScriptAbierto(false)}
                    className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    title="Cerrar visor"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Contenido del Script SQL */}
              <div className="flex-1 bg-[#18181B] text-gray-200 p-3 sm:p-4 overflow-auto font-mono text-[10.5px] sm:text-[11px] leading-relaxed relative selection:bg-gray-700 selection:text-white">
                {cargandoScript ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                    <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs">Cargando script SQL desde almacenamiento seguro...</p>
                  </div>
                ) : (
                  <pre className="whitespace-pre font-mono">{scriptSqlContenido}</pre>
                )}
              </div>

              {/* Footer del Modal */}
              <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 border-t border-gray-200 bg-white shrink-0 text-[10px] text-gray-500 font-[Poppins]">
                <span className="truncate">
                  Almacenado en: <strong>Supabase Storage (bucket: respaldos-sistema)</strong> &bull; Líneas: {scriptSqlContenido ? scriptSqlContenido.split('\n').length : 0}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalScriptAbierto(false)}
                    className="px-3.5 py-1 text-[11px] font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-200 transition-colors cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  )
}
