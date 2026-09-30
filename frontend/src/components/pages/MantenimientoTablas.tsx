'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Combobox } from '@/components/ui/Combobox'
import { Plus, Search, ChevronDown, ChevronLeft, ChevronRight, Edit2, Trash2, Eye, ChevronUp, X, Lock, Info, ArrowLeft } from 'lucide-react'
import { api } from '@/lib/api/cliente'
import { useCustomToast } from '@/hooks/useCustomToast'
import MantenimientoDrawer, { TABLES_SCHEMA } from '@/components/modules/mantenimiento/MantenimientoDrawer'
import { MantenimientoDeleteModal } from '@/components/modules/mantenimiento/MantenimientoDeleteModal'
import { EstadoVacio } from '@/components/ui/EstadoVacio'

export const TABLAS_MANTENIMIENTO: any[] = [
  {
    "id": "auditoria_operativa",
    "nombre": "Auditoría Operativa",
    "endpoint": "/mantenimiento/auditoria_operativa",
    "grupo": "Auditoría y Sistema",
    "esAuditoria": true
  },
  {
    "id": "backup_sistema",
    "nombre": "Respaldos del Sistema",
    "endpoint": "/mantenimiento/backup_sistema",
    "grupo": "Auditoría y Sistema",
    "esAuditoria": true
  },
  {
    "id": "bitacora_avance",
    "nombre": "Avances Físicos de Bitácora",
    "endpoint": "/mantenimiento/bitacora_avance",
    "grupo": "Bitácora de Campo",
    "esAuditoria": false
  },
  {
    "id": "bitacora_entrada",
    "nombre": "Entradas de Bitácora",
    "endpoint": "/mantenimiento/bitacora_entrada",
    "grupo": "Bitácora de Campo",
    "esAuditoria": false
  },
  {
    "id": "bitacora_pendiente",
    "nombre": "Pendientes de Bitácora",
    "endpoint": "/mantenimiento/bitacora_pendiente",
    "grupo": "Bitácora de Campo",
    "esAuditoria": false
  },
  {
    "id": "bitacora_pendiente_ajuste",
    "nombre": "Ajustes de Pendientes",
    "endpoint": "/mantenimiento/bitacora_pendiente_ajuste",
    "grupo": "Bitácora de Campo",
    "esAuditoria": false
  },
  {
    "id": "capitulo_sabana",
    "nombre": "Capítulos (Sábana)",
    "endpoint": "/mantenimiento/capitulo_sabana",
    "grupo": "Catálogos y Maestros",
    "esAuditoria": false
  },
  {
    "id": "catalogo",
    "nombre": "Catálogos",
    "endpoint": "/mantenimiento/catalogo",
    "grupo": "Catálogos y Maestros",
    "esAuditoria": false
  },
  {
    "id": "catalogo_descuento_tecnico",
    "nombre": "Descuentos Técnicos",
    "endpoint": "/mantenimiento/catalogo_descuento_tecnico",
    "grupo": "Catálogos y Maestros",
    "esAuditoria": false
  },
  {
    "id": "catalogo_item",
    "nombre": "Ítems de Catálogo",
    "endpoint": "/mantenimiento/catalogo_item",
    "grupo": "Catálogos y Maestros",
    "esAuditoria": false
  },
  {
    "id": "categoria_actividad",
    "nombre": "Categorías de Actividad",
    "endpoint": "/mantenimiento/categoria_actividad",
    "grupo": "Catálogos y Maestros",
    "esAuditoria": false
  },
  {
    "id": "condicion_climatica",
    "nombre": "Condiciones Climáticas",
    "endpoint": "/mantenimiento/condicion_climatica",
    "grupo": "Bitácora de Campo",
    "esAuditoria": false
  },
  {
    "id": "configuracion_general",
    "nombre": "Configuración General del Sistema",
    "endpoint": "/mantenimiento/configuracion_general",
    "grupo": "Configuración y Parámetros",
    "esAuditoria": false
  },
  {
    "id": "contacto_contratista",
    "nombre": "Contactos de Contratista",
    "endpoint": "/mantenimiento/contacto_contratista",
    "grupo": "Entidades y Contactos",
    "esAuditoria": false
  },
  {
    "id": "contacto_empresa_externa",
    "nombre": "Contactos de Empresa Externa",
    "endpoint": "/mantenimiento/contacto_empresa_externa",
    "grupo": "Entidades y Contactos",
    "esAuditoria": false
  },
  {
    "id": "contacto_entidad",
    "nombre": "Contactos de Entidad Contratante",
    "endpoint": "/mantenimiento/contacto_entidad",
    "grupo": "Entidades y Contactos",
    "esAuditoria": false
  },
  {
    "id": "control_anticipo",
    "nombre": "Controles de Anticipo",
    "endpoint": "/mantenimiento/control_anticipo",
    "grupo": "Planificación y Control",
    "esAuditoria": false
  },
  {
    "id": "control_plazo",
    "nombre": "Controles de Plazo",
    "endpoint": "/mantenimiento/control_plazo",
    "grupo": "Planificación y Control",
    "esAuditoria": false
  },
  {
    "id": "cronograma_planificado",
    "nombre": "Cronogramas Planificados",
    "endpoint": "/mantenimiento/cronograma_planificado",
    "grupo": "Planificación y Control",
    "esAuditoria": false
  },
  {
    "id": "dato_usuario",
    "nombre": "Datos de Usuario",
    "endpoint": "/mantenimiento/dato_usuario",
    "grupo": "Seguridad y Acceso",
    "esAuditoria": false
  },
  {
    "id": "departamento",
    "nombre": "Departamentos",
    "endpoint": "/mantenimiento/departamento",
    "grupo": "Geografía",
    "esAuditoria": false
  },
  {
    "id": "documento_proyecto",
    "nombre": "Documentos del Proyecto",
    "endpoint": "/mantenimiento/documento_proyecto",
    "grupo": "Proyectos y Obra",
    "esAuditoria": false
  },
  {
    "id": "empresa",
    "nombre": "Empresas Propietarias",
    "endpoint": "/mantenimiento/empresa",
    "grupo": "Entidades y Contactos",
    "esAuditoria": false
  },
  {
    "id": "empresa_contratista",
    "nombre": "Empresas Contratistas",
    "endpoint": "/mantenimiento/empresa_contratista",
    "grupo": "Entidades y Contactos",
    "esAuditoria": false
  },
  {
    "id": "empresa_externa",
    "nombre": "Empresas Externas",
    "endpoint": "/mantenimiento/empresa_externa",
    "grupo": "Entidades y Contactos",
    "esAuditoria": false
  },
  {
    "id": "ensayo_laboratorio",
    "nombre": "Ensayos de Laboratorio",
    "endpoint": "/mantenimiento/ensayo_laboratorio",
    "grupo": "Laboratorio y Calidad",
    "esAuditoria": false
  },
  {
    "id": "entidad_contratante",
    "nombre": "Entidades Contratantes",
    "endpoint": "/mantenimiento/entidad_contratante",
    "grupo": "Entidades y Contactos",
    "esAuditoria": false
  },
  {
    "id": "especificacion_tecnica",
    "nombre": "Especificaciones Técnicas",
    "endpoint": "/mantenimiento/especificacion_tecnica",
    "grupo": "Laboratorio y Calidad",
    "esAuditoria": false
  },
  {
    "id": "estacion_kilometrica",
    "nombre": "Estaciones Kilométricas",
    "endpoint": "/mantenimiento/estacion_kilometrica",
    "grupo": "Bitácora de Campo",
    "esAuditoria": false
  },
  {
    "id": "estado_usuario",
    "nombre": "Historial de Estados de Usuario",
    "endpoint": "/mantenimiento/estado_usuario",
    "grupo": "Seguridad y Acceso",
    "esAuditoria": false
  },
  {
    "id": "evidencia_fotografica",
    "nombre": "Evidencias Fotográficas",
    "endpoint": "/mantenimiento/evidencia_fotografica",
    "grupo": "Bitácora de Campo",
    "esAuditoria": false
  },
  {
    "id": "fase_proyecto",
    "nombre": "Fases de Proyecto",
    "endpoint": "/mantenimiento/fase_proyecto",
    "grupo": "Proyectos y Obra",
    "esAuditoria": false
  },
  {
    "id": "incidente_evidencia",
    "nombre": "Evidencias de Incidentes",
    "endpoint": "/mantenimiento/incidente_evidencia",
    "grupo": "Bitácora de Campo",
    "esAuditoria": false
  },
  {
    "id": "incidente_obra",
    "nombre": "Incidentes de Obra",
    "endpoint": "/mantenimiento/incidente_obra",
    "grupo": "Bitácora de Campo",
    "esAuditoria": false
  },
  {
    "id": "modificativo_renglon",
    "nombre": "Modificativos de Renglón",
    "endpoint": "/mantenimiento/modificativo_renglon",
    "grupo": "Proyectos y Obra",
    "esAuditoria": false
  },
  {
    "id": "municipio",
    "nombre": "Municipios",
    "endpoint": "/mantenimiento/municipio",
    "grupo": "Geografía",
    "esAuditoria": false
  },
  {
    "id": "parametro_proyecto",
    "nombre": "Parámetros del Proyecto",
    "endpoint": "/mantenimiento/parametro_proyecto",
    "grupo": "Configuración y Parámetros",
    "esAuditoria": false
  },
  {
    "id": "proyecto",
    "nombre": "Proyectos",
    "endpoint": "/mantenimiento/proyecto",
    "grupo": "Proyectos y Obra",
    "esAuditoria": false
  },
  {
    "id": "proyecto_detalle",
    "nombre": "Ficha Técnica y Detalle del Proyecto",
    "endpoint": "/mantenimiento/proyecto_detalle",
    "grupo": "Proyectos y Obra",
    "esAuditoria": false
  },
  {
    "id": "proyecto_usuario",
    "nombre": "Asignación de Usuarios a Proyecto",
    "endpoint": "/mantenimiento/proyecto_usuario",
    "grupo": "Proyectos y Obra",
    "esAuditoria": false
  },
  {
    "id": "renglon_trabajo",
    "nombre": "Renglones de Trabajo",
    "endpoint": "/mantenimiento/renglon_trabajo",
    "grupo": "Proyectos y Obra",
    "esAuditoria": false
  },
  {
    "id": "renglon_trabajo_catalogo",
    "nombre": "Catálogo Maestro de Renglones",
    "endpoint": "/mantenimiento/renglon_trabajo_catalogo",
    "grupo": "Proyectos y Obra",
    "esAuditoria": false
  },
  {
    "id": "renglon_trabajo_plantilla",
    "nombre": "Plantillas de Renglones",
    "endpoint": "/mantenimiento/renglon_trabajo_plantilla",
    "grupo": "Proyectos y Obra",
    "esAuditoria": false
  },
  {
    "id": "reporte",
    "nombre": "Historial de Reportes",
    "endpoint": "/mantenimiento/reporte",
    "grupo": "Auditoría y Sistema",
    "esAuditoria": true
  },
  {
    "id": "restauracion_sistema",
    "nombre": "Restauraciones del Sistema",
    "endpoint": "/mantenimiento/restauracion_sistema",
    "grupo": "Auditoría y Sistema",
    "esAuditoria": true
  },
  {
    "id": "rol",
    "nombre": "Roles del Sistema",
    "endpoint": "/mantenimiento/rol",
    "grupo": "Seguridad y Acceso",
    "esAuditoria": false
  },
  {
    "id": "seguridad_log",
    "nombre": "Logs de Seguridad",
    "endpoint": "/mantenimiento/seguridad_log",
    "grupo": "Auditoría y Sistema",
    "esAuditoria": true
  },
  {
    "id": "suspension_plazo",
    "nombre": "Suspensiones de Plazo",
    "endpoint": "/mantenimiento/suspension_plazo",
    "grupo": "Planificación y Control",
    "esAuditoria": false
  },
  {
    "id": "ticket_mensaje",
    "nombre": "Mensajes de Ticket",
    "endpoint": "/mantenimiento/ticket_mensaje",
    "grupo": "Soporte y Tickets",
    "esAuditoria": false
  },
  {
    "id": "ticket_soporte",
    "nombre": "Tickets de Soporte",
    "endpoint": "/mantenimiento/ticket_soporte",
    "grupo": "Soporte y Tickets",
    "esAuditoria": false
  },
  {
    "id": "tipo_ensayo",
    "nombre": "Tipos de Ensayo",
    "endpoint": "/mantenimiento/tipo_ensayo",
    "grupo": "Laboratorio y Calidad",
    "esAuditoria": false
  },
  {
    "id": "unidad_medida",
    "nombre": "Unidades de Medida",
    "endpoint": "/mantenimiento/unidad_medida",
    "grupo": "Catálogos y Maestros",
    "esAuditoria": false
  },
  {
    "id": "usuario",
    "nombre": "Usuarios",
    "endpoint": "/mantenimiento/usuario",
    "grupo": "Seguridad y Acceso",
    "esAuditoria": false
  }
];

function ComboboxFiltro({ options, value, onChange, placeholder = "Buscar..." }: { options: any[], value: any, onChange: (v: any) => void, placeholder?: string }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  
  const filtered = options.filter(o => (o.label || '').toLowerCase().includes(search.toLowerCase()));
  const selectedOpt = options.find(o => o.value === value);

  return (
    <div className="relative">
      <div 
        onClick={() => setOpen(!open)}
        className="w-full text-left px-2 py-1.5 text-[9px] border border-gray-200 rounded-md cursor-pointer flex justify-between items-center hover:bg-gray-50 bg-white"
      >
        <span className={selectedOpt ? 'text-gray-800 font-medium' : 'text-gray-400'}>{selectedOpt ? selectedOpt.label : 'Todos...'}</span>
        <ChevronDown size={10} className="text-gray-400" />
      </div>
      {open && (
        <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-100 shadow-xl rounded-md z-50 max-h-40 flex flex-col">
          <input 
            type="text" 
            autoFocus
            className="w-full text-[9px] px-2 py-1.5 border-b border-gray-100 outline-none" 
            placeholder={placeholder}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="overflow-y-auto">
            <div 
              className="px-2 py-1.5 text-[9px] hover:bg-gray-50 cursor-pointer text-gray-400"
              onClick={() => { onChange(null); setOpen(false); }}
            >
              Todos
            </div>
            {filtered.map(o => (
              <div 
                key={o.value} 
                className="px-2 py-1.5 text-[9px] hover:bg-[#FDF4F3] hover:text-[#9B0F06] cursor-pointer"
                onClick={() => { onChange(o.value); setOpen(false); }}
              >
                {o.label}
              </div>
            ))}
            {filtered.length === 0 && <div className="px-2 py-1.5 text-[9px] text-gray-400">No hay resultados</div>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MantenimientoTablas() {
  const router = useRouter()
  const [selectedTable, setSelectedTable] = useState<any>(TABLAS_MANTENIMIENTO[0])
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [totalRecords, setTotalRecords] = useState(0)

  const relatedTables = useMemo(() => {
    const schema = TABLES_SCHEMA[selectedTable.id] || []
    const refs = schema
      .map((f: any) => f.refTable)
      .filter((ref: any): ref is string => Boolean(ref) && ref !== selectedTable.id)
    return Array.from(new Set(refs))
  }, [selectedTable.id])

  // Estados UI
  const [globalFilter, setGlobalFilter] = useState('')
  const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc'|'desc'} | null>(null)
  const [foreignKeyOptions, setForeignKeyOptions] = useState<Record<string, any[]>>({})
  const [filtroMenuActivo, setFiltroMenuActivo] = useState<any[]>([])
  const [columnasVisibles, setColumnasVisibles] = useState<string[]>([])

  // Restricciones de tabla
  const [tableRestrictions, setTableRestrictions] = useState<{
    soloLectura: boolean
    bloquearCreacion: boolean
    bloquearModificacion: boolean
    bloquearEliminacion: boolean
    mensajeBloqueo: string | null
    descripcion: string | null
  }>({
    soloLectura: false,
    bloquearCreacion: false,
    bloquearModificacion: false,
    bloquearEliminacion: false,
    mensajeBloqueo: null,
    descripcion: null
  })

  // Debounce globalFilter -> debouncedGlobalFilter (400ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedGlobalFilter(globalFilter)
    }, 400)
    return () => clearTimeout(handler)
  }, [globalFilter])
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(8)

  // Modal y Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'view'>('create')
  const [selectedRecord, setSelectedRecord] = useState<any>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<any>(null)

  const { showSuccessToast, showErrorToast } = useCustomToast()

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('pagina', currentPage.toString())
      params.append('limite', itemsPerPage.toString())
      if (debouncedGlobalFilter) params.append('busqueda', debouncedGlobalFilter)
      if (sortConfig) {
        params.append('columnaOrden', sortConfig.key)
        params.append('direccionOrden', sortConfig.direction)
      }
      if (Object.keys(filters).length > 0) {
        params.append('filtros', JSON.stringify(filters))
      }

      const baseUrl = selectedTable.esAuditoria ? '/auditoria' : '/mantenimiento'
      const endpoint = selectedTable.endpoint.replace('/mantenimiento', baseUrl)
      const res = await api.get(`${endpoint}?${params.toString()}`)
      if (res.data?.success) {
        setData(res.data.data)
        setTotalRecords(res.data.total)
        if (res.data.columnasVisibles) {
          setColumnasVisibles(res.data.columnasVisibles.split(',').map((c: string) => c.trim()))
        }
        if (res.data.columnasFiltroMenu) {
          setFiltroMenuActivo(res.data.columnasFiltroMenu)
        } else {
          setFiltroMenuActivo([])
        }

        setTableRestrictions({
          soloLectura: Boolean(res.data.soloLectura || selectedTable.esAuditoria),
          bloquearCreacion: Boolean(res.data.bloquearCreacion || res.data.soloLectura || selectedTable.esAuditoria),
          bloquearModificacion: Boolean(res.data.bloquearModificacion || res.data.soloLectura || selectedTable.esAuditoria),
          bloquearEliminacion: Boolean(res.data.bloquearEliminacion || res.data.soloLectura || selectedTable.esAuditoria),
          mensajeBloqueo: res.data.mensajeBloqueo || null,
          descripcion: res.data.descripcion || null
        })
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        showErrorToast('No tienes permisos para ver esta tabla.')
        setData([])
        setTotalRecords(0)
      } else {
        showErrorToast('Error al cargar datos de la tabla.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedTable.id, currentPage, itemsPerPage, debouncedGlobalFilter, sortConfig, filters])

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedGlobalFilter, sortConfig, filters])

  // Fetch options for foreign_key filters whenever the active filter menu changes
  useEffect(() => {
    const fkFiltros = filtroMenuActivo?.filter((f: any) => f.tipo === 'foreign_key') || []
    if (fkFiltros.length === 0) {
      setForeignKeyOptions({})
      return
    }
    const fetchAll = async () => {
      const results: Record<string, any[]> = {}
      await Promise.all(fkFiltros.map(async (f: any) => {
        try {
          const extraParams = f.filtroFijo ? '&' + new URLSearchParams(f.filtroFijo).toString() : ''
          const res = await api.get(`/mantenimiento/${f.tablaReferencia}?pagina=1&limite=500${extraParams}`)
          if (res.data?.success) results[f.columna] = res.data.data
        } catch {
          results[f.columna] = []
        }
      }))
      setForeignKeyOptions(results)
    }
    fetchAll()
  }, [filtroMenuActivo])

  const handleTableChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const table = TABLAS_MANTENIMIENTO.find(t => t.id === e.target.value)
    if (table) {
      setFiltroMenuActivo([])
      setSelectedTable(table)
      setGlobalFilter('')
      setFilters({})
      setSortConfig(null)
      setCurrentPage(1)
      setTableRestrictions({
        soloLectura: Boolean(table.esAuditoria),
        bloquearCreacion: Boolean(table.esAuditoria),
        bloquearModificacion: Boolean(table.esAuditoria),
        bloquearEliminacion: Boolean(table.esAuditoria),
        mensajeBloqueo: null,
        descripcion: null
      })
    }
  }

  const columns = data.length > 0 
    ? Object.keys(data[0]).filter(k => k !== 'id' && k !== 'dependenciasCount') 
    : columnasVisibles.filter(k => k !== 'id' && k !== 'dependenciasCount');

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const handleCreate = () => {
    if (tableRestrictions.bloquearCreacion) {
      showErrorToast(tableRestrictions.mensajeBloqueo || 'No se permite la creación directa en esta tabla.')
      return
    }
    setDrawerMode('create')
    setSelectedRecord(null)
    setIsDrawerOpen(true)
  }

  const handleEdit = (record: any) => {
    if (tableRestrictions.bloquearModificacion) {
      handleView(record)
      return
    }
    setDrawerMode('edit')
    setSelectedRecord(record)
    setIsDrawerOpen(true)
  }

  const handleView = (record: any) => {
    setDrawerMode('view')
    setSelectedRecord(record)
    setIsDrawerOpen(true)
  }

  const handleDelete = (record: any) => {
    if (tableRestrictions.bloquearEliminacion) {
      showErrorToast(tableRestrictions.mensajeBloqueo || 'No se permite la eliminación de registros en esta tabla.')
      return
    }
    setRecordToDelete(record)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!recordToDelete) return
    try {
      await api.delete(`${selectedTable.endpoint}/${recordToDelete.id}`)
      showSuccessToast('Registro eliminado correctamente')
      fetchData()
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al eliminar el registro. Compruebe si tiene registros dependientes.'
      showErrorToast(msg)
    } finally {
      setIsDeleteModalOpen(false)
      setRecordToDelete(null)
    }
  }

  const handleSave = async (payload: any) => {
    try {
      if (drawerMode === 'create') {
        await api.post(selectedTable.endpoint, payload)
        showSuccessToast('Registro creado correctamente')
      } else if (drawerMode === 'edit') {
        await api.put(`${selectedTable.endpoint}/${selectedRecord.id}`, payload)
        showSuccessToast('Registro actualizado correctamente')
      }
      setIsDrawerOpen(false)
      fetchData()
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al procesar el registro'
      showErrorToast(msg)
      throw error
    }
  }

  const totalPages = Math.ceil(totalRecords / itemsPerPage)

  return (
    <div className="flex flex-col h-full bg-[#F3F4F7] relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-3 px-6 pt-4 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => router.push('/dashboard/configuracion')}
            className="p-1.5 text-gray-500 hover:text-[#9B0F06] transition-colors rounded-lg flex items-center justify-center -ml-1"
            title="Regresar a Configuración General"
          >
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">Mantenimiento de Tablas del Sistema</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Administración centralizada y control de integridad de datos según el Diccionario de Datos Oficial
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-80 flex flex-col gap-1">
            <Combobox
              options={TABLAS_MANTENIMIENTO.map(t => ({ 
                value: t.id, 
                label: `${t.nombre}${t.esAuditoria ? ' (Solo lectura)' : ''}` 
              }))}
              value={selectedTable.id}
              onChange={(val) => handleTableChange({ target: { value: val } } as any)}
              placeholder="Buscar tabla..."
            />
            <div className="text-[9px] text-gray-500 flex gap-2 items-center mt-0.5 flex-wrap">
              <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono text-[9px]">
                {selectedTable.id}
              </span>
              {tableRestrictions.soloLectura && (
                <span className="font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                  <Lock size={9} /> Solo lectura
                </span>
              )}
              {relatedTables.length > 0 && (
                <div className="text-[10px] text-gray-600 flex items-center gap-1 flex-wrap">
                  <span className="font-semibold text-gray-700">Relación de tablas con:</span>
                  {relatedTables.map((ref) => (
                    <span key={ref} className="bg-white text-gray-700 font-mono text-[9px] px-1.5 py-0.5 rounded border border-gray-200">
                      {ref}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {!tableRestrictions.bloquearCreacion && (
            <button
              onClick={handleCreate}
              className="inline-flex h-8 items-center gap-1.5 bg-[#9B0F06] hover:bg-[#5E0006] text-white px-3.5 rounded-md transition-colors shadow-sm whitespace-nowrap text-[11px] font-bold self-start"
            >
              <Plus size={13} />
              <span className="hidden sm:inline">Nuevo Registro</span>
            </button>
          )}
        </div>
      </div>

      {tableRestrictions.mensajeBloqueo && (
        <div className="mx-6 mb-3 p-2.5 bg-amber-50/90 border border-amber-200/80 rounded-xl flex items-center gap-2 text-amber-900 text-xs shadow-2xs">
          <Info size={16} className="text-amber-600 flex-shrink-0" />
          <span className="text-[11px] font-medium">{tableRestrictions.mensajeBloqueo}</span>
        </div>
      )}

      <div className="mx-6 mb-6 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden flex-1 relative">
        <div className="p-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-white flex-shrink-0">
          <div className="relative w-full sm:w-64 group flex-shrink-0">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <Search size={14} className="text-gray-400 group-focus-within:text-[#9B0F06] transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Buscar en registros..."
              className="w-full pl-8 pr-3 py-1.5 text-[10px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#9B0F06] transition-colors text-gray-700"
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center flex-1 justify-start">
            {!selectedTable.esAuditoria && filtroMenuActivo && filtroMenuActivo.length > 0 && (
              filtroMenuActivo.map((filtro: any) => {
                if (filtro.tipo === 'foreign_key') {
                  if (filtro.renderizado === 'combobox') {
                    return (
                      <div key={filtro.columna} className="w-44">
                        <ComboboxFiltro 
                          options={(foreignKeyOptions[filtro.columna] || []).map((row: any) => ({ 
                            value: row.id, 
                            label: row[filtro.columnaLabel || 'nombre'] || row.descripcion || row.codigo || row.id 
                          }))}
                          value={filters[filtro.columna]}
                          placeholder={`Filtrar por ${filtro.columna.replace('_', ' ')}...`}
                          onChange={(val) => {
                            const newFilters = {...filters};
                            if (val === null) delete newFilters[filtro.columna];
                            else newFilters[filtro.columna] = val;
                            setFilters(newFilters);
                          }}
                        />
                      </div>
                    )
                  }
                  return (
                    <select
                      key={filtro.columna}
                      className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-[10px] text-gray-700 bg-white focus:outline-none focus:border-[#9B0F06] w-40"
                      value={filters[filtro.columna] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const newFilters = {...filters};
                        if (!val) delete newFilters[filtro.columna];
                        else newFilters[filtro.columna] = val;
                        setFilters(newFilters);
                      }}
                    >
                      <option value="">Todos ({filtro.columna.replace('_', ' ')})</option>
                      {(foreignKeyOptions[filtro.columna] || []).map((row: any) => (
                        <option key={row.id} value={row.id}>
                          {row[filtro.columnaLabel || 'nombre'] || row.descripcion || row.codigo || row.id}
                        </option>
                      ))}
                    </select>
                  )
                }

                if (filtro.tipo === 'boolean') {
                  return (
                    <select
                      key={filtro.columna}
                      className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-[10px] text-gray-700 bg-white focus:outline-none focus:border-[#9B0F06] w-32"
                      value={filters[filtro.columna] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const newFilters = {...filters};
                        if (!val) delete newFilters[filtro.columna];
                        else newFilters[filtro.columna] = val;
                        setFilters(newFilters);
                      }}
                    >
                      <option value="">Todos ({filtro.columna.replace('_', ' ')})</option>
                      <option value="true">Sí</option>
                      <option value="false">No</option>
                    </select>
                  )
                }

                if (filtro.tipo === 'enum' && filtro.opciones && filtro.opciones.length > 0) {
                  return (
                    <select
                      key={filtro.columna}
                      className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-[10px] text-gray-700 bg-white focus:outline-none focus:border-[#9B0F06] w-36"
                      value={filters[filtro.columna] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const newFilters = {...filters};
                        if (!val) delete newFilters[filtro.columna];
                        else newFilters[filtro.columna] = val;
                        setFilters(newFilters);
                      }}
                    >
                      <option value="">Todos ({filtro.columna.replace('_', ' ')})</option>
                      {filtro.opciones.map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )
                }

                return null
              })
            )}

            {(Object.keys(filters).length > 0 || globalFilter !== '') && (
              <button
                onClick={() => { setFilters({}); setGlobalFilter(''); }}
                className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-[#9B0F06] transition-colors ml-1"
              >
                <X size={12} />
                <span>Limpiar filtros</span>
              </button>
            )}
            
            {selectedTable.esAuditoria && (
              <div className="flex gap-2 items-center flex-wrap">
                <input 
                  type="date" 
                  className="px-2 py-1.5 text-[10px] border border-gray-200 rounded-lg text-gray-600 focus:outline-none focus:border-[#9B0F06]"
                  title="Fecha de Inicio"
                  onChange={e => setFilters({...filters, fecha_inicio: e.target.value})}
                />
                <input 
                  type="date" 
                  className="px-2 py-1.5 text-[10px] border border-gray-200 rounded-lg text-gray-600 focus:outline-none focus:border-[#9B0F06]"
                  title="Fecha de Fin"
                  onChange={e => setFilters({...filters, fecha_fin: e.target.value})}
                />
                <input 
                  type="text" 
                  placeholder="ID Usuario"
                  className="px-2 py-1.5 text-[10px] w-24 border border-gray-200 rounded-lg text-gray-600 focus:outline-none focus:border-[#9B0F06]"
                  onChange={e => setFilters({...filters, usuario_id: e.target.value})}
                />
              </div>
            )}
            
            <div className="text-[9px] text-gray-400 font-medium ml-auto">
              {totalRecords} registro{totalRecords !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <div className="w-full overflow-x-auto relative flex-1">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-20">
              <tr>
                {columns.map(col => (
                  <th 
                    key={col} 
                    className="px-4 py-3 text-[9px] text-gray-400 uppercase tracking-wide font-semibold cursor-pointer group hover:bg-gray-100 transition-colors whitespace-nowrap"
                    onClick={() => handleSort(col)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.replace(/_/g, ' ')}</span>
                      {sortConfig?.key === col ? (
                        sortConfig.direction === 'asc' ? <ChevronUp size={10} className="text-[#9B0F06]" /> : <ChevronDown size={10} className="text-[#9B0F06]" />
                      ) : (
                        <ChevronUp size={10} className="opacity-0 group-hover:opacity-40 transition-opacity" />
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-[9px] text-gray-400 uppercase tracking-wide font-semibold text-right sticky right-0 bg-gray-50 z-30 shadow-[-4px_0_10px_rgba(0,0,0,0.02)] whitespace-nowrap w-28 border-l border-gray-100">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-gray-500 bg-white">
                    <div className="flex flex-col items-center">
                      <div className="h-6 w-6 border-2 border-[#9B0F06] border-t-transparent rounded-full animate-spin mb-3"></div>
                      <span className="text-[10px] font-medium">Cargando registros...</span>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-6 py-16 text-center bg-gray-50/30">
                    <div className="flex justify-center w-full">
                       <EstadoVacio onCrear={tableRestrictions.bloquearCreacion ? undefined : handleCreate} />
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-gray-50 border-t border-gray-50 transition-colors group">
                    {columns.map(col => (
                      <td key={col} className="px-4 py-3 text-[10px] text-gray-600 font-medium whitespace-nowrap">
                        {typeof row[col] === 'boolean' || row[col] === 'true' || row[col] === 'false'
                          ? (String(row[col]) === 'true' ? <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold text-[8px] uppercase tracking-wider border border-emerald-100">SÍ</span> : <span className="bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full font-bold text-[8px] uppercase tracking-wider border border-gray-200">NO</span>)
                          : row[col] === null || row[col] === undefined
                            ? <span className="text-gray-300">-</span> 
                            : <span className="truncate block max-w-[280px]" title={String(row[col])}>{String(row[col])}</span>}
                      </td>
                    ))}
                    <td className="px-4 py-3 whitespace-nowrap text-right sticky right-0 bg-white z-10 shadow-[-4px_0_10px_rgba(0,0,0,0.02)] group-hover:bg-gray-50 transition-colors border-l border-gray-50">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleView(row)} className="p-1.5 text-gray-400 transition-colors hover:text-[#9B0F06]" title="Ver detalle">
                          <Eye size={12} />
                        </button>
                        {!tableRestrictions.bloquearModificacion ? (
                          <button onClick={() => handleEdit(row)} className="p-1.5 text-gray-400 transition-colors hover:text-green-600" title="Editar">
                            <Edit2 size={12} />
                          </button>
                        ) : (
                          <span className="p-1.5 text-gray-400 opacity-40" title="Modificación no permitida">
                            <Lock size={12} />
                          </span>
                        )}
                        {!tableRestrictions.bloquearEliminacion ? (
                          <button onClick={() => handleDelete(row)} className="p-1.5 text-gray-400 transition-colors hover:text-red-600" title="Eliminar">
                            <Trash2 size={12} />
                          </button>
                        ) : (
                          <span className="p-1.5 text-gray-400 opacity-40" title="Eliminación no permitida">
                            <Lock size={12} />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación Footer */}
        {data.length > 0 && (
          <div className="p-3 border-t border-gray-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0 z-20">
            <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium">
              <span>Mostrar</span>
              <select 
                value={itemsPerPage} 
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="border border-gray-200 rounded-md px-1.5 py-0.5 focus:outline-none focus:border-[#9B0F06] bg-white text-gray-700 cursor-pointer"
              >
                <option value={8}>8</option>
                <option value={16}>16</option>
                <option value={24}>24</option>
                <option value={50}>50</option>
              </select>
              <span>registros por página</span>
            </div>

            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              
              <div className="text-[10px] text-gray-600 font-medium px-2">
                Página {currentPage} de {totalPages || 1}
              </div>
              
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-1 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <MantenimientoDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        mode={drawerMode}
        table={selectedTable.id}
        tableFriendlyName={selectedTable.nombre || selectedTable.id}
        record={selectedRecord}
        onSave={handleSave}
        dataKeys={columns}
      />

      <MantenimientoDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setRecordToDelete(null)
        }}
        onConfirm={handleConfirmDelete}
        record={recordToDelete}
        tableName={selectedTable.nombre || selectedTable.id}
      />
    </div>
  )
}
