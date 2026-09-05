'use client'

import { useState, useEffect } from 'react'
import { Combobox } from '@/components/ui/Combobox'
import { Plus, Search, ChevronDown, ChevronLeft, ChevronRight, Edit2, Trash2, Eye, ChevronUp, X } from 'lucide-react'
import { api } from '@/lib/api/cliente'
import { useCustomToast } from '@/hooks/useCustomToast'
import MantenimientoDrawer from '@/components/modules/mantenimiento/MantenimientoDrawer'
import { MantenimientoDeleteModal } from '@/components/modules/mantenimiento/MantenimientoDeleteModal'
import { EstadoVacio } from '@/components/ui/EstadoVacio'

const TABLAS_MANTENIMIENTO: any[] = [
  {"id": "catalogo", "nombre": "Catálogos", "endpoint": "/mantenimiento/catalogo", "grupo": "Operacionales", "relaciones": ["Catálogo Items"]},
  {"id": "catalogo_item", "nombre": "Ítems de Catálogo", "endpoint": "/mantenimiento/catalogo_item", "grupo": "Operacionales"},
  {"id": "unidad_medida", "nombre": "Unidades de Medida", "endpoint": "/mantenimiento/unidad_medida", "grupo": "Operacionales"},
  {"id": "usuario", "nombre": "Usuarios", "endpoint": "/mantenimiento/usuario", "grupo": "Seguridad", "relaciones": ["Datos", "Roles"]},
  {"id": "dato_usuario", "nombre": "Datos de Usuario", "endpoint": "/mantenimiento/dato_usuario", "grupo": "Seguridad"},
  {"id": "rol", "nombre": "Roles", "endpoint": "/mantenimiento/rol", "grupo": "Seguridad", "relaciones": ["Usuarios"]},
  {"id": "empresa", "nombre": "Empresas Sistema", "endpoint": "/mantenimiento/empresa", "grupo": "Entidades"},
  {"id": "empresa_externa", "nombre": "Empresas Externas", "endpoint": "/mantenimiento/empresa_externa", "grupo": "Entidades"},
  {"id": "entidad_contratante", "nombre": "Entidades Contratantes", "endpoint": "/mantenimiento/entidad_contratante", "grupo": "Entidades"},
  {"id": "contacto_entidad", "nombre": "Contactos de Entidad", "endpoint": "/mantenimiento/contacto_entidad", "grupo": "Entidades"},
  {"id": "empresa_contratista", "nombre": "Empresas Contratistas", "endpoint": "/mantenimiento/empresa_contratista", "grupo": "Entidades"},
  {"id": "contacto_contratista", "nombre": "Contactos de Contratista", "endpoint": "/mantenimiento/contacto_contratista", "grupo": "Entidades"},
  {"id": "contacto_empresa_externa", "nombre": "Contactos de Empresa Externa", "endpoint": "/mantenimiento/contacto_empresa_externa", "grupo": "Entidades"},
  {"id": "proyecto", "nombre": "Proyectos", "endpoint": "/mantenimiento/proyecto", "grupo": "Proyectos", "relaciones": ["Fases", "Detalles", "Usuarios"]},
  {"id": "proyecto_usuario", "nombre": "Usuarios por Proyecto", "endpoint": "/mantenimiento/proyecto_usuario", "grupo": "Proyectos"},
  {"id": "proyecto_detalle", "nombre": "Detalles de Proyecto", "endpoint": "/mantenimiento/proyecto_detalle", "grupo": "Proyectos"},
  {"id": "fase_proyecto", "nombre": "Fases de Proyecto", "endpoint": "/mantenimiento/fase_proyecto", "grupo": "Proyectos"},
  {"id": "documento_proyecto", "nombre": "Documentos de Proyecto", "endpoint": "/mantenimiento/documento_proyecto", "grupo": "Proyectos"},
  {"id": "categoria_actividad", "nombre": "Categorías de Actividad", "endpoint": "/mantenimiento/categoria_actividad", "grupo": "Proyectos"},
  {"id": "capitulo_sabana", "nombre": "Capítulos (Sábana)", "endpoint": "/mantenimiento/capitulo_sabana", "grupo": "Proyectos"},
  {"id": "renglon_trabajo", "nombre": "Renglones de Trabajo", "endpoint": "/mantenimiento/renglon_trabajo", "grupo": "Proyectos"},
  {"id": "renglon_trabajo_catalogo", "nombre": "Catálogo de Renglones", "endpoint": "/mantenimiento/renglon_trabajo_catalogo", "grupo": "Proyectos"},
  {"id": "renglon_trabajo_plantilla", "nombre": "Plantilla de Renglones", "endpoint": "/mantenimiento/renglon_trabajo_plantilla", "grupo": "Proyectos"},
  {"id": "modificativo_renglon", "nombre": "Modificativos de Renglón", "endpoint": "/mantenimiento/modificativo_renglon", "grupo": "Proyectos"},
  {"id": "catalogo_descuento_tecnico", "nombre": "Descuentos Técnicos", "endpoint": "/mantenimiento/catalogo_descuento_tecnico", "grupo": "Proyectos"},
  {"id": "departamento", "nombre": "Departamentos", "endpoint": "/mantenimiento/departamento", "grupo": "Geografía", "relaciones": ["Municipios"]},
  {"id": "municipio", "nombre": "Municipios", "endpoint": "/mantenimiento/municipio", "grupo": "Geografía"},
  {"id": "especificacion_tecnica", "nombre": "Especificaciones Técnicas", "endpoint": "/mantenimiento/especificacion_tecnica", "grupo": "Laboratorio"},
  {"id": "tipo_ensayo", "nombre": "Tipos de Ensayo", "endpoint": "/mantenimiento/tipo_ensayo", "grupo": "Laboratorio"},
  {"id": "ensayo_laboratorio", "nombre": "Ensayos de Laboratorio", "endpoint": "/mantenimiento/ensayo_laboratorio", "grupo": "Laboratorio"},
  {"id": "configuracion_general", "nombre": "Configuración General", "endpoint": "/mantenimiento/configuracion_general", "grupo": "Configuración"},
  {"id": "parametro_proyecto", "nombre": "Parámetros de Proyecto", "endpoint": "/mantenimiento/parametro_proyecto", "grupo": "Configuración"},
  {"id": "cronograma_planificado", "nombre": "Cronogramas Planificados", "endpoint": "/mantenimiento/cronograma_planificado", "grupo": "Configuración"},
  {"id": "control_anticipo", "nombre": "Controles de Anticipo", "endpoint": "/mantenimiento/control_anticipo", "grupo": "Configuración"},
  {"id": "control_plazo", "nombre": "Controles de Plazo", "endpoint": "/mantenimiento/control_plazo", "grupo": "Configuración"},
  {"id": "suspension_plazo", "nombre": "Suspensiones de Plazo", "endpoint": "/mantenimiento/suspension_plazo", "grupo": "Configuración"},
  {"id": "condicion_climatica", "nombre": "Condiciones Climáticas", "endpoint": "/mantenimiento/condicion_climatica", "grupo": "Bitácora"},
  {"id": "estacion_kilometrica", "nombre": "Estaciones Kilométricas", "endpoint": "/mantenimiento/estacion_kilometrica", "grupo": "Bitácora"},
  {"id": "bitacora_entrada", "nombre": "Entradas de Bitácora", "endpoint": "/mantenimiento/bitacora_entrada", "grupo": "Bitácora"},
  {"id": "bitacora_avance", "nombre": "Avances de Bitácora", "endpoint": "/mantenimiento/bitacora_avance", "grupo": "Bitácora"},
  {"id": "bitacora_pendiente", "nombre": "Pendientes de Bitácora", "endpoint": "/mantenimiento/bitacora_pendiente", "grupo": "Bitácora"},
  {"id": "bitacora_pendiente_ajuste", "nombre": "Ajustes de Pendientes", "endpoint": "/mantenimiento/bitacora_pendiente_ajuste", "grupo": "Bitácora"},
  {"id": "incidente_obra", "nombre": "Incidentes de Obra", "endpoint": "/mantenimiento/incidente_obra", "grupo": "Bitácora"},
  {"id": "incidente_evidencia", "nombre": "Evidencias de Incidente", "endpoint": "/mantenimiento/incidente_evidencia", "grupo": "Bitácora"},
  {"id": "evidencia_fotografica", "nombre": "Evidencias Fotográficas", "endpoint": "/mantenimiento/evidencia_fotografica", "grupo": "Bitácora"},
  {"id": "estado_usuario", "nombre": "Estados de Usuario", "endpoint": "/mantenimiento/estado_usuario", "grupo": "Auditoría", "esAuditoria": true},
  {"id": "backup_sistema", "nombre": "Backups del Sistema", "endpoint": "/mantenimiento/backup_sistema", "grupo": "Auditoría", "esAuditoria": true},
  {"id": "restauracion_sistema", "nombre": "Restauraciones del Sistema", "endpoint": "/mantenimiento/restauracion_sistema", "grupo": "Auditoría", "esAuditoria": true},
  {"id": "reporte", "nombre": "Reportes Generados", "endpoint": "/mantenimiento/reporte", "grupo": "Auditoría", "esAuditoria": true},
  {"id": "auditoria_operativa", "nombre": "Auditorías Operativas", "endpoint": "/mantenimiento/auditoria_operativa", "grupo": "Auditoría", "esAuditoria": true},
  {"id": "seguridad_log", "nombre": "Logs de Seguridad", "endpoint": "/mantenimiento/seguridad_log", "grupo": "Auditoría", "esAuditoria": true}
];


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
  const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc'|'desc'} | null>(null)
  const [foreignKeyOptions, setForeignKeyOptions] = useState<Record<string, any[]>>({})
  const [filtroMenuActivo, setFiltroMenuActivo] = useState<any[]>([])

  // Debounce globalFilter -> debouncedGlobalFilter (400ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedGlobalFilter(globalFilter)
    }, 400)
    return () => clearTimeout(handler)
  }, [globalFilter])
  
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
    }
  }

  // Filtrar id y dependenciasCount de las columnas visibles
  const [columnasVisibles, setColumnasVisibles] = useState<string[]>([]);
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
      const msg = error.response?.data?.message || 'Error al eliminar el registro'
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 px-6 pt-4 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">Mantenimiento de Datos</h1>
          <p className="text-sm text-gray-500">
            Administra los catálogos y tablas maestras del sistema
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72 flex flex-col gap-1">
            <Combobox
                options={TABLAS_MANTENIMIENTO.map(t => ({ value: t.id, label: t.nombre + (t.esAuditoria ? ' (Solo lectura)' : '') }))}
                value={selectedTable.id}
                onChange={(val) => handleTableChange({ target: { value: val } } as any)}
                placeholder="Buscar tabla..."
              />
            <div className="text-[9px] text-gray-500 flex gap-1 items-center mt-0.5">
              {selectedTable.esAuditoria && (
                <span className="font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-sm border border-orange-100 flex items-center gap-1">
                  🔒 Solo lectura
                </span>
              )}
              {selectedTable.relaciones && selectedTable.relaciones.length > 0 && (
                <span className="font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-sm border border-blue-100 border-orange-100">
                  Relacionado con: {selectedTable.relaciones.join(', ')}
                </span>
              )}
            </div>
          </div>
          
          {!selectedTable.esAuditoria && (
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
            {!selectedTable.esAuditoria && filtroMenuActivo && filtroMenuActivo.length > 0 && (
              filtroMenuActivo.map((filtro: any) => {
                if (filtro.tipo === 'foreign_key') {
                  if (filtro.renderizado === 'combobox') {
                    return (
                      <div key={filtro.columna} className="w-44">
                        <ComboboxFiltro 
                          options={(foreignKeyOptions[filtro.columna] || []).map((row: any) => ({ value: row.id, label: row[filtro.columnaLabel || 'nombre'] }))}
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
                        <option key={row.id} value={row.id}>{row[filtro.columnaLabel || 'nombre']}</option>
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
                <span>Limpiar</span>
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