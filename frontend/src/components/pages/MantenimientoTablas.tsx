'use client'

import { useState, useEffect } from 'react'
import { Plus, Filter, Search, ChevronDown, ChevronLeft, ChevronRight, Edit2, Trash2, Eye, ChevronUp } from 'lucide-react'
import { api } from '@/lib/api/cliente'
import { useCustomToast } from '@/hooks/useCustomToast'
import MantenimientoDrawer from '@/components/modules/mantenimiento/MantenimientoDrawer'
import { MantenimientoDeleteModal } from '@/components/modules/mantenimiento/MantenimientoDeleteModal'
import { EstadoVacio } from '@/components/ui/EstadoVacio'

const TABLAS_MANTENIMIENTO: any[] = [
  {"id": "catalogo", "nombre": "Catálogos", "endpoint": "/mantenimiento/catalogo", "grupo": "Operacionales", "relaciones": ["Catálogo Items"], "columnasFiltroMenu": [{"columna": "activo", "tipo": "boolean", "opciones": ["true", "false"]}]},
  {"id": "catalogo_item", "nombre": "Ítems de Catálogo", "endpoint": "/mantenimiento/catalogo_item", "grupo": "Operacionales", "columnasFiltroMenu": [{"columna": "activo", "tipo": "boolean", "opciones": ["true", "false"]}]},
  {"id": "unidad_medida", "nombre": "Unidades de Medida", "endpoint": "/mantenimiento/unidad_medida", "grupo": "Operacionales"},
  {"id": "usuario", "nombre": "Usuarios", "endpoint": "/mantenimiento/usuario", "grupo": "Seguridad", "relaciones": ["Datos", "Roles"], "columnasFiltroMenu": [{"columna": "activo", "tipo": "boolean", "opciones": ["true", "false"]}]},
  {"id": "dato_usuario", "nombre": "Datos de Usuario", "endpoint": "/mantenimiento/dato_usuario", "grupo": "Seguridad", "columnasFiltroMenu": [{"columna": "estado", "tipo": "enum", "opciones": ["Activo"]}]},
  {"id": "rol", "nombre": "Roles", "endpoint": "/mantenimiento/rol", "grupo": "Seguridad", "relaciones": ["Usuarios"], "columnasFiltroMenu": [{"columna": "activo", "tipo": "boolean", "opciones": ["true", "false"]}]},
  {"id": "empresa", "nombre": "Empresas Sistema", "endpoint": "/mantenimiento/empresa", "grupo": "Entidades"},
      {"id": "proyecto", "nombre": "Proyectos", "endpoint": "/mantenimiento/proyecto", "grupo": "Proyectos", "relaciones": ["Fases", "Detalles", "Usuarios"], "columnasFiltroMenu": [{"columna": "estado_id", "tipo": "foreign_key", "tablaReferencia": "catalogo_item", "columnaLabel": "nombre", "renderizado": "select", "filtroFijo": {"catalogo_id": "aa548cb3-8382-4a62-8b90-1185b2418326"}}]},
  {"id": "proyecto_usuario", "nombre": "Usuarios por Proyecto", "endpoint": "/mantenimiento/proyecto_usuario", "grupo": "Proyectos", "columnasFiltroMenu": [{"columna": "activo", "tipo": "boolean", "opciones": ["true", "false"]}]},
  {"id": "proyecto_detalle", "nombre": "Detalles de Proyecto", "endpoint": "/mantenimiento/proyecto_detalle", "grupo": "Proyectos", "columnasFiltroMenu": [{"columna": "municipio_id", "tipo": "foreign_key", "tablaReferencia": "municipio", "columnaLabel": "nombre", "renderizado": "combobox"}]},
  {"id": "fase_proyecto", "nombre": "Fases de Proyecto", "endpoint": "/mantenimiento/fase_proyecto", "grupo": "Proyectos", },
  {"id": "documento_proyecto", "nombre": "Documentos de Proyecto", "endpoint": "/mantenimiento/documento_proyecto", "grupo": "Proyectos"},
  {"id": "categoria_actividad", "nombre": "Categorías de Actividad", "endpoint": "/mantenimiento/categoria_actividad", "grupo": "Proyectos", "columnasFiltroMenu": [{"columna": "activo", "tipo": "boolean", "opciones": ["true", "false"]}]},
  {"id": "capitulo_sabana", "nombre": "Capítulos (Sábana)", "endpoint": "/mantenimiento/capitulo_sabana", "grupo": "Proyectos"},
  {"id": "renglon_trabajo", "nombre": "Renglones de Trabajo", "endpoint": "/mantenimiento/renglon_trabajo", "grupo": "Proyectos", "columnasFiltroMenu": [{"columna": "aplica_indirectos", "tipo": "boolean", "opciones": ["true", "false"]}, {"columna": "aplica_iva", "tipo": "boolean", "opciones": ["true", "false"]}]},
  {"id": "modificativo_renglon", "nombre": "Modificativos de Renglón", "endpoint": "/mantenimiento/modificativo_renglon", "grupo": "Proyectos"},
  {"id": "catalogo_descuento_tecnico", "nombre": "Descuentos Técnicos", "endpoint": "/mantenimiento/catalogo_descuento_tecnico", "grupo": "Proyectos"},
  {"id": "departamento", "nombre": "Departamentos", "endpoint": "/mantenimiento/departamento", "grupo": "Geografía", "relaciones": ["Municipios"]},
  {"id": "municipio", "nombre": "Municipios", "endpoint": "/mantenimiento/municipio", "grupo": "Geografía", "columnasFiltroMenu": [{"columna": "departamento_id", "tipo": "foreign_key", "tablaReferencia": "departamento", "columnaLabel": "nombre", "renderizado": "select"}]},
  {"id": "especificacion_tecnica", "nombre": "Especificaciones Técnicas", "endpoint": "/mantenimiento/especificacion_tecnica", "grupo": "Laboratorio"},
  {"id": "tipo_ensayo", "nombre": "Tipos de Ensayo", "endpoint": "/mantenimiento/tipo_ensayo", "grupo": "Laboratorio", "columnasFiltroMenu": [{"columna": "activo", "tipo": "boolean", "opciones": ["true", "false"]}]},
  {"id": "ensayo_laboratorio", "nombre": "Ensayos de Laboratorio", "endpoint": "/mantenimiento/ensayo_laboratorio", "grupo": "Laboratorio", "columnasFiltroMenu": [{"columna": "aprobado", "tipo": "boolean", "opciones": ["true", "false"]}]},
  {"id": "configuracion_general", "nombre": "Configuración General", "endpoint": "/mantenimiento/configuracion_general", "grupo": "Configuración"},
  {"id": "parametro_proyecto", "nombre": "Parámetros de Proyecto", "endpoint": "/mantenimiento/parametro_proyecto", "grupo": "Configuración"},
  {"id": "cronograma_planificado", "nombre": "Cronogramas Planificados", "endpoint": "/mantenimiento/cronograma_planificado", "grupo": "Configuración", "columnasFiltroMenu": [{"columna": "linea_base", "tipo": "boolean", "opciones": ["true", "false"]}]},
  {"id": "control_anticipo", "nombre": "Controles de Anticipo", "endpoint": "/mantenimiento/control_anticipo", "grupo": "Configuración"},
  {"id": "control_plazo", "nombre": "Controles de Plazo", "endpoint": "/mantenimiento/control_plazo", "grupo": "Configuración"},
  {"id": "suspension_plazo", "nombre": "Suspensiones de Plazo", "endpoint": "/mantenimiento/suspension_plazo", "grupo": "Configuración"},
  {"id": "condicion_climatica", "nombre": "Condiciones Climáticas", "endpoint": "/mantenimiento/condicion_climatica", "grupo": "Bitácora"},
  {"id": "estacion_kilometrica", "nombre": "Estaciones Kilométricas", "endpoint": "/mantenimiento/estacion_kilometrica", "grupo": "Bitácora"},
  {"id": "bitacora_entrada", "nombre": "Entradas de Bitácora", "endpoint": "/mantenimiento/bitacora_entrada", "grupo": "Bitácora", "columnasFiltroMenu": [{"columna": "publicada", "tipo": "boolean", "opciones": ["true", "false"]}, {"columna": "bloqueada", "tipo": "boolean", "opciones": ["true", "false"]}]},
  {"id": "bitacora_avance", "nombre": "Avances de Bitácora", "endpoint": "/mantenimiento/bitacora_avance", "grupo": "Bitácora"},
  {"id": "bitacora_pendiente", "nombre": "Pendientes de Bitácora", "endpoint": "/mantenimiento/bitacora_pendiente", "grupo": "Bitácora", "columnasFiltroMenu": [{"columna": "lado_via", "tipo": "enum", "opciones": ["Izquierdo", "Derecho", "Sección Completa"]}, {"columna": "es_derrumbre", "tipo": "boolean", "opciones": ["true", "false"]}]},
  {"id": "bitacora_pendiente_ajuste", "nombre": "Ajustes de Pendientes", "endpoint": "/mantenimiento/bitacora_pendiente_ajuste", "grupo": "Bitácora"},
  {"id": "incidente_obra", "nombre": "Incidentes de Obra", "endpoint": "/mantenimiento/incidente_obra", "grupo": "Bitácora"},
  {"id": "incidente_evidencia", "nombre": "Evidencias de Incidente", "endpoint": "/mantenimiento/incidente_evidencia", "grupo": "Bitácora"},
  {"id": "evidencia_fotografica", "nombre": "Evidencias Fotográficas", "endpoint": "/mantenimiento/evidencia_fotografica", "grupo": "Bitácora"},
  {"id": "estado_usuario", "nombre": "Estados de Usuario", "endpoint": "/mantenimiento/estado_usuario", "grupo": "Auditoría", "esAuditoria": true, },
  {"id": "backup_sistema", "nombre": "Backups del Sistema", "endpoint": "/mantenimiento/backup_sistema", "grupo": "Auditoría", "esAuditoria": true, },
  {"id": "restauracion_sistema", "nombre": "Restauraciones del Sistema", "endpoint": "/mantenimiento/restauracion_sistema", "grupo": "Auditoría", "esAuditoria": true, },
  {"id": "reporte", "nombre": "Reportes Generados", "endpoint": "/mantenimiento/reporte", "grupo": "Auditoría", "esAuditoria": true, "columnasFiltroMenu": [{"columna": "estado", "tipo": "enum", "opciones": []}, {"columna": "logo_incluido", "tipo": "boolean", "opciones": ["true", "false"]}, {"columna": "marca_agua_incluida", "tipo": "boolean", "opciones": ["true", "false"]}]},
  {"id": "auditoria_operativa", "nombre": "Auditorías Operativas", "endpoint": "/mantenimiento/auditoria_operativa", "grupo": "Auditoría", "esAuditoria": true},
  {"id": "seguridad_log", "nombre": "Logs de Seguridad", "endpoint": "/mantenimiento/seguridad_log", "grupo": "Auditoría", "esAuditoria": true, "columnasFiltroMenu": [{"columna": "exitoso", "tipo": "boolean", "opciones": ["true", "false"]}]},
]


function ComboboxFiltro({ options, value, onChange, placeholder = "Buscar..." }: { options: any[], value: any, onChange: (v: any) => void, placeholder?: string }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  
  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
  const selectedOpt = options.find(o => o.value === value);

  return (
    <div className="relative">
      <div 
        onClick={() => setOpen(!open)}
        className="w-full text-left px-2 py-1.5 text-[9px] border border-gray-200 rounded-md cursor-pointer flex justify-between items-center hover:bg-gray-50"
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
  const [selectedTable, setSelectedTable] = useState<any>(TABLAS_MANTENIMIENTO[0])
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [totalRecords, setTotalRecords] = useState(0)

  // Estados UI
  const [globalFilter, setGlobalFilter] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc'|'desc'} | null>(null)
  const [foreignKeyOptions, setForeignKeyOptions] = useState<Record<string, any[]>>({})
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

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
      if (globalFilter) params.append('busqueda', globalFilter)
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
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        showErrorToast('No tienes permisos para ver esta tabla.')
        setData([])
        setTotalRecords(0)
      } else {
        showErrorToast('Error al cargar datos.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedTable, currentPage, itemsPerPage, globalFilter, sortConfig, filters])

  useEffect(() => {
    setCurrentPage(1)
  }, [globalFilter, sortConfig, filters])

  // Fetch options for foreign_key filters whenever the selected table changes
  useEffect(() => {
    const fkFiltros = selectedTable.columnasFiltroMenu?.filter((f: any) => f.tipo === 'foreign_key') || []
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
  }, [selectedTable])

  const handleTableChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const table = TABLAS_MANTENIMIENTO.find(t => t.id === e.target.value)
    if (table) {
      setSelectedTable(table)
      setGlobalFilter('')
      setFilters({})
      setSortConfig(null)
      setCurrentPage(1)
    }
  }

  // Filtrar id y dependenciasCount de las columnas visibles
  const columns = data.length > 0 ? Object.keys(data[0]).filter(k => k !== 'id' && k !== 'dependenciasCount') : []

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const handleCreate = () => {
    setDrawerMode('create')
    setSelectedRecord(null)
    setIsDrawerOpen(true)
  }

  const handleEdit = (record: any) => {
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
      const msg = error.response?.data?.error?.mensaje || 'Error al eliminar el registro'
      showErrorToast(msg)
    } finally {
      setIsDeleteModalOpen(false)
      setRecordToDelete(null)
    }
  }

  const handleSave = () => {
    fetchData()
    setIsDrawerOpen(false)
  }

  const totalPages = Math.ceil(totalRecords / itemsPerPage)

  return (
    <div className="flex flex-col h-full bg-[#F3F4F7] relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 px-6 pt-4 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">Mantenimiento de Datos</h1>
          <p className="text-sm text-gray-500">
            Administra los catálogos y tablas maestras del sistema
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72 flex flex-col gap-1">
            <div className="relative w-full">
              <select
                value={selectedTable.id}
                onChange={handleTableChange}
                className="w-full pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#9B0F06] focus:border-[#9B0F06] appearance-none text-[11px] font-semibold text-gray-700 cursor-pointer"
              >
                {TABLAS_MANTENIMIENTO.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.nombre || t.id} {t.esAuditoria ? '(Solo lectura)' : ''}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDown size={14} className="text-gray-400" />
              </div>
            </div>
            <div className="text-[9px] text-gray-500 flex gap-1 items-center mt-0.5">
              {selectedTable.esAuditoria && (
                <span className="font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-sm border border-orange-100 flex items-center gap-1">
                  🔒 Solo lectura
                </span>
              )}
              {selectedTable.relaciones && selectedTable.relaciones.length > 0 && (
                <span className="font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-sm border border-blue-100">
                  Relacionado con: {selectedTable.relaciones.join(', ')}
                </span>
              )}
            </div>
          </div>
          
          {!selectedTable.esAuditoria && (
            <button
              onClick={handleCreate}
              className="flex items-center gap-1.5 bg-[#9B0F06] hover:bg-[#7a0c05] text-white px-3 py-1.5 rounded-lg transition-colors shadow-sm whitespace-nowrap text-[11px] font-bold h-[34px] self-start"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">Nuevo Registro</span>
            </button>
          )}
        </div>
      </div>

      <div className="mx-6 mb-6 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden flex-1 relative">
        <div className="p-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-white flex-shrink-0">
          <div className="relative w-full sm:w-64 group flex-shrink-0">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <Search size={14} className="text-gray-400 group-focus-within:text-[#9B0F06] transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Buscar registros..."
              className="w-full pl-8 pr-3 py-1.5 text-[10px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#9B0F06] transition-colors text-gray-700"
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center flex-1 justify-start">
            {!selectedTable.esAuditoria && selectedTable.columnasFiltroMenu && selectedTable.columnasFiltroMenu.length > 0 && (
              <div className="relative group/filters">
                <button 
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors bg-white shadow-sm"
                >
                  <Filter size={12} />
                  <span>Filtros</span>
                  {Object.keys(filters).length > 0 && (
                    <span className="bg-[#9B0F06] text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px] ml-1">
                      {Object.keys(filters).length}
                    </span>
                  )}
                </button>
                
                <div className="absolute top-full mt-1 left-0 w-64 bg-white border border-gray-100 shadow-xl rounded-xl p-3 z-50 hidden group-hover/filters:block">
                  {selectedTable.columnasFiltroMenu.filter((filtro: any) =>
                    filtro.tipo === 'boolean' ||
                    filtro.tipo === 'foreign_key' ||
                    (filtro.tipo === 'enum' && filtro.opciones && filtro.opciones.length > 0)
                  ).map((filtro: any) => (
                    <div key={filtro.columna} className="mb-3 last:mb-0">
                      <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1.5">{filtro.columna.replace('_', ' ')}</label>
                      <div className="flex flex-wrap gap-1">
                        <button
                          onClick={() => { const newFilters = {...filters}; delete newFilters[filtro.columna]; setFilters(newFilters); }}
                          className={`px-2 py-1 text-[9px] transition-all rounded-md ${!filters[filtro.columna] ? 'bg-gray-100 text-gray-800 font-bold shadow-2xs' : 'text-gray-400 hover:bg-gray-50'}`}
                        >
                          Todos
                        </button>
                                                {filtro.tipo === 'foreign_key' ? (
                          <div className="w-full mt-1">
                            {filtro.renderizado === 'combobox' ? (
                              <ComboboxFiltro 
                                options={(foreignKeyOptions[filtro.columna] || []).map((row: any) => ({ value: row.id, label: row[filtro.columnaLabel || 'nombre'] }))}
                                value={filters[filtro.columna]}
                                onChange={(val) => {
                                  const newFilters = {...filters};
                                  if (val === null) delete newFilters[filtro.columna];
                                  else newFilters[filtro.columna] = val;
                                  setFilters(newFilters);
                                }}
                              />
                            ) : (
                              <select 
                                className="w-full text-[9px] px-2 py-1 border border-gray-200 rounded-md outline-none bg-white"
                                value={filters[filtro.columna] || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const newFilters = {...filters};
                                  if (!val) delete newFilters[filtro.columna];
                                  else newFilters[filtro.columna] = val;
                                  setFilters(newFilters);
                                }}
                              >
                                <option value="">Todos</option>
                                {(foreignKeyOptions[filtro.columna] || []).map((row: any) => (
                                  <option key={row.id} value={row.id}>{row[filtro.columnaLabel || 'nombre']}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        ) : (
                          filtro.opciones?.map((opt: string) => {
                            const isSelected = filters[filtro.columna] === opt;
                            return (
                              <button
                                key={opt}
                                onClick={() => setFilters({...filters, [filtro.columna]: opt})}
                                className={`px-2 py-1 text-[9px] transition-all rounded-md ${isSelected ? 'bg-white text-[#9B0F06] border border-[#9B0F06] font-bold shadow-2xs' : 'text-gray-500 border border-transparent hover:bg-gray-50'}`}
                              >
                                {opt === 'true' ? 'Sí' : opt === 'false' ? 'No' : opt}
                              </button>
                            )
                          })
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
                      <span className="text-[10px] font-medium">Cargando datos...</span>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-6 py-16 text-center bg-gray-50/30">
                    <div className="flex justify-center w-full">
                       <EstadoVacio onCrear={handleCreate} />
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
                        {!selectedTable.esAuditoria && (
                          <>
                            <button onClick={() => handleEdit(row)} className="p-1.5 text-gray-400 transition-colors hover:text-green-600" title="Editar">
                              <Edit2 size={12} />
                            </button>
                            {row.dependenciasCount && row.dependenciasCount > 0 ? (
                              <button disabled className="p-1.5 text-gray-300 opacity-50 cursor-not-allowed" title={`No se puede eliminar: tiene ${row.dependenciasCount} dependencia(s) asignada(s).`}>
                                <Trash2 size={12} />
                              </button>
                            ) : (
                              <button onClick={() => handleDelete(row)} className="p-1.5 text-gray-400 transition-colors hover:text-red-600" title="Eliminar">
                                <Trash2 size={12} />
                              </button>
                            )}
                          </>
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
                <option value={10}>10</option>
                <option value={25}>25</option>
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