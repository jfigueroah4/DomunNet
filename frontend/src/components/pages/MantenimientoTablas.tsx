'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Plus, Search, Eye, Edit2, Trash2, ArrowLeft, FilterX, X, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api/cliente'
import { useCustomToast } from '@/hooks/useCustomToast'
import MantenimientoDrawer, { TABLES_SCHEMA } from '@/components/modules/mantenimiento/MantenimientoDrawer'

const TABLAS_MANTENIMIENTO = [
  // 1. Críticas
  { id: 'rol', nombre: 'Roles', endpoint: '/roles', grupo: 'Críticas' },
  { id: 'usuario', nombre: 'Usuarios', endpoint: '/usuarios', grupo: 'Críticas' },
  { id: 'dato_usuario', nombre: 'Datos Usuario', endpoint: '/mantenimiento/dato_usuario', grupo: 'Críticas' },
  { id: 'empresa', nombre: 'Empresas', endpoint: '/mantenimiento/empresa', grupo: 'Críticas' },

  // 2. Operacionales
  { id: 'catalogo', nombre: 'Catálogos', endpoint: '/mantenimiento/catalogo', grupo: 'Operacionales' },
  { id: 'catalogo_item', nombre: 'Items de Catálogo', endpoint: '/mantenimiento/catalogo_item', grupo: 'Operacionales' },
  { id: 'departamento', nombre: 'Departamentos', endpoint: '/mantenimiento/departamento', grupo: 'Operacionales' },
  { id: 'municipio', nombre: 'Municipios', endpoint: '/mantenimiento/municipio', grupo: 'Operacionales' },
  { id: 'empresa_contratante', nombre: 'Empresas Contratantes', endpoint: '/mantenimiento/empresa_contratante', grupo: 'Operacionales' },
  { id: 'contacto_contratante', nombre: 'Contactos Contratante', endpoint: '/mantenimiento/contacto_contratante', grupo: 'Operacionales' },
  { id: 'configuracion_general', nombre: 'Configuración General', endpoint: '/mantenimiento/configuracion_general', grupo: 'Operacionales' },
  { id: 'backup_sistema', nombre: 'Backups del Sistema', endpoint: '/mantenimiento/backup_sistema', grupo: 'Operacionales' },

  // 3. Proyectos
  { id: 'proyecto', nombre: 'Proyectos', endpoint: '/mantenimiento/proyecto', grupo: 'Proyectos' },
  { id: 'proyecto_detalle', nombre: 'Detalles de Proyecto', endpoint: '/mantenimiento/proyecto_detalle', grupo: 'Proyectos' },
  { id: 'fase_proyecto', nombre: 'Fases de Proyecto', endpoint: '/mantenimiento/fase_proyecto', grupo: 'Proyectos' },
  { id: 'renglon_trabajo', nombre: 'Renglones de Trabajo', endpoint: '/mantenimiento/renglon_trabajo', grupo: 'Proyectos' },
  { id: 'documento_proyecto', nombre: 'Documentos Proyecto', endpoint: '/mantenimiento/documento_proyecto', grupo: 'Proyectos' },
  { id: 'modificativo_renglon', nombre: 'Modificativos Renglón', endpoint: '/mantenimiento/modificativo_renglon', grupo: 'Proyectos' },
  { id: 'capitulo_sabana', nombre: 'Capítulos Sábana', endpoint: '/mantenimiento/capitulo_sabana', grupo: 'Proyectos' },

  // 4. Bitácora
  { id: 'bitacora_entrada', nombre: 'Bitácoras (Entradas)', endpoint: '/mantenimiento/bitacora_entrada', grupo: 'Bitácora' },
  { id: 'bitacora_avance', nombre: 'Avances de Bitácora', endpoint: '/mantenimiento/bitacora_avance', grupo: 'Bitácora' },
  { id: 'bitacora_pendiente', nombre: 'Bitácoras Pendientes', endpoint: '/mantenimiento/bitacora_pendiente', grupo: 'Bitácora' },
  { id: 'bitacora_pendiente_ajuste', nombre: 'Ajustes Pendientes', endpoint: '/mantenimiento/bitacora_pendiente_ajuste', grupo: 'Bitácora' },
  { id: 'incidente_obra', nombre: 'Incidentes Obra', endpoint: '/mantenimiento/incidente_obra', grupo: 'Bitácora' },
  { id: 'incidente_evidencia', nombre: 'Evidencias de Incidente', endpoint: '/mantenimiento/incidente_evidencia', grupo: 'Bitácora' },
  { id: 'evidencia_fotografica', nombre: 'Evidencias Fotográficas', endpoint: '/mantenimiento/evidencia_fotografica', grupo: 'Bitácora' },

  // 5. Laboratorio
  { id: 'tipo_ensayo', nombre: 'Tipos Ensayo', endpoint: '/mantenimiento/tipo_ensayo', grupo: 'Laboratorio' },
  { id: 'ensayo_laboratorio', nombre: 'Ensayos Laboratorio', endpoint: '/mantenimiento/ensayo_laboratorio', grupo: 'Laboratorio' },
  { id: 'especificacion_tecnica', nombre: 'Especificaciones Técnicas', endpoint: '/mantenimiento/especificacion_tecnica', grupo: 'Laboratorio' },
  { id: 'categoria_actividad', nombre: 'Categorías de Actividad', endpoint: '/mantenimiento/categoria_actividad', grupo: 'Laboratorio' },

  // 6. Configuración
  { id: 'unidad_medida', nombre: 'Unidades de Medida', endpoint: '/mantenimiento/unidad_medida', grupo: 'Configuración' },
  { id: 'parametro_proyecto', nombre: 'Parámetros Proyecto', endpoint: '/mantenimiento/parametro_proyecto', grupo: 'Configuración' },
  { id: 'suspension_plazo', label: 'Suspensiones de Plazo', endpoint: '/mantenimiento/suspension_plazo', grupo: 'Configuración' },
  { id: 'control_plazo', nombre: 'Controles de Plazo', endpoint: '/mantenimiento/control_plazo', grupo: 'Configuración' },
  { id: 'control_anticipo', nombre: 'Controles de Anticipo', endpoint: '/mantenimiento/control_anticipo', grupo: 'Configuración' },
  { id: 'cronograma_planificado', nombre: 'Cronogramas Planificados', endpoint: '/mantenimiento/cronograma_planificado', grupo: 'Configuración' },

  // 7. Seguridad/Auditoría
  { id: 'estado_usuario', nombre: 'Estados Usuario', endpoint: '/mantenimiento/estado_usuario', grupo: 'Seguridad/Auditoría' },
  { id: 'auditoria_operativa', nombre: 'Auditorías Operativas', endpoint: '/mantenimiento/auditoria_operativa', grupo: 'Seguridad/Auditoría' },
  { id: 'seguridad_log', nombre: 'Logs de Seguridad', endpoint: '/mantenimiento/seguridad_log', grupo: 'Seguridad/Auditoría' },
  { id: 'reporte', nombre: 'Reportes', endpoint: '/mantenimiento/reporte', grupo: 'Seguridad/Auditoría' },

  // 8. Adicionales
  { id: 'estacion_kilometrica', nombre: 'Estaciones Kilométricas', endpoint: '/mantenimiento/estacion_kilometrica', grupo: 'Adicionales' },
  { id: 'condicion_climatica', nombre: 'Condiciones Climáticas', endpoint: '/mantenimiento/condicion_climatica', grupo: 'Adicionales' },
  { id: 'proyecto_usuario', nombre: 'Proyectos Usuarios', endpoint: '/mantenimiento/proyecto_usuario', grupo: 'Adicionales' },
  { id: 'restauracion_sistema', nombre: 'Restauraciones', endpoint: '/mantenimiento/restauracion_sistema', grupo: 'Adicionales' },
  { id: 'catalogo_descuento_tecnico', nombre: 'Descuentos Técnicos', endpoint: '/mantenimiento/catalogo_descuento_tecnico', grupo: 'Adicionales' }
]

export default function MantenimientoTablas() {
  const [selectedTable, setSelectedTable] = useState(TABLAS_MANTENIMIENTO[0])
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [optionsMap, setOptionsMap] = useState<Record<string, any[]>>({})
  
  // Paginación y Ordenamiento
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc'|'desc'} | null>(null)

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'view'>('create')
  const [selectedRecord, setSelectedRecord] = useState<any>(null)

  const { showSuccessToast, showErrorToast } = useCustomToast()

  const dataKeys = data.length > 0 ? Object.keys(data[0]).filter(k => k !== 'id' && k !== 'created_at' && k !== 'updated_at') : []
  const schema = TABLES_SCHEMA[selectedTable.id] || []
  const filterableFields = schema.filter(f => f.type === 'boolean' || f.type === 'select')

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get(selectedTable.endpoint)
      if (res.data?.success) {
        setData(res.data.data || [])
      } else {
        setData(res.data || []) // fallback
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      showErrorToast('Error al cargar los registros')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    setFilters({})
    setSearchTerm('')
    setCurrentPage(1)
    setSortConfig(null)
  }, [selectedTable])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filters, itemsPerPage])

  useEffect(() => {
    const loadOptions = async () => {
      const newOptionsMap: Record<string, any[]> = {}
      for (const field of filterableFields) {
        if (field.type === 'select' && field.endpoint) {
          try {
            const res = await api.get(field.endpoint)
            if (res.success) {
              newOptionsMap[field.name] = res.data
            }
          } catch (error) {
            console.error(`Error loading options for ${field.name}:`, error)
            newOptionsMap[field.name] = []
          }
        }
      }
      setOptionsMap(newOptionsMap)
    }
    if (filterableFields.length > 0) {
      loadOptions()
    }
  }, [selectedTable])

  const handleCreate = () => {
    setSelectedRecord(null)
    setDrawerMode('create')
    setIsDrawerOpen(true)
  }

  const handleEdit = (record: any) => {
    setSelectedRecord(record)
    setDrawerMode('edit')
    setIsDrawerOpen(true)
  }

  const handleView = (record: any) => {
    setSelectedRecord(record)
    setDrawerMode('view')
    setIsDrawerOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Está seguro de eliminar este registro?')) return

    try {
      await api.delete(`${selectedTable.endpoint}/${id}`)
      showSuccessToast('Registro eliminado correctamente')
      fetchData()
    } catch (error) {
      showErrorToast('Error al eliminar el registro')
    }
  }

  const handleSave = async (payload: any) => {
    try {
      if (drawerMode === 'create') {
        await api.post(selectedTable.endpoint, payload)
        showSuccessToast('Registro creado correctamente')
      } else {
        await api.put(`${selectedTable.endpoint}/${selectedRecord.id}`, payload)
        showSuccessToast('Registro actualizado correctamente')
      }
      setIsDrawerOpen(false)
      fetchData()
    } catch (error) {
      showErrorToast('Error al guardar el registro')
    }
  }

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
      setSortConfig(null);
      return;
    }
    setSortConfig({ key, direction });
  }

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Search filter
      const matchesSearch = Object.values(item).some(
        (val) => String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
      if (!matchesSearch) return false

      // Dynamic filters
      for (const key in filters) {
        if (filters[key] !== '' && filters[key] !== undefined) {
          const fieldSchema = schema.find(f => f.name === key)
          if (fieldSchema?.type === 'boolean' || typeof item[key] === 'boolean') {
            const expectedBool = filters[key] === 'true'
            if (Boolean(item[key]) !== expectedBool) return false
          } else {
            // Comparación exacta para select dropdowns
            if (String(item[key]) !== String(filters[key])) return false
          }
        }
      }

      return true
    })
  }, [data, searchTerm, filters, schema])

  const sortedData = useMemo(() => {
    let sortableItems = [...filteredData];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        
        if (valA === null || valA === undefined) valA = '';
        if (valB === null || valB === undefined) valB = '';

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig])

  const totalPages = Math.ceil(sortedData.length / itemsPerPage)
  const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Obtener columnas dinámicamente de la data (máximo 8 visibles)
  const columns = dataKeys.slice(0, 8)

  // Agrupar tablas
  const grupos = [...new Set(TABLAS_MANTENIMIENTO.map(t => t.grupo))]

  return (
    <div className="space-y-4 w-full px-4 md:px-8 py-6 max-w-full mx-auto overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard/configuracion" 
            className="p-2 -ml-2 text-gray-400 hover:text-[#9B0F06] transition-colors rounded-full hover:bg-red-50 flex-shrink-0"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mantenimiento de Tablas</h1>
            <p className="text-sm text-gray-500">Gestión estructurada de base de datos</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={selectedTable.id}
            onChange={(e) => {
              const table = TABLAS_MANTENIMIENTO.find(t => t.id === e.target.value)
              if (table) setSelectedTable(table)
            }}
            className="h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#9B0F06]"
          >
            {grupos.map(grupo => (
              <optgroup key={grupo} label={grupo}>
                {TABLAS_MANTENIMIENTO.filter(t => t.grupo === grupo).map(t => (
                  <option key={t.id} value={t.id}>{t.nombre || t.id}</option>
                ))}
              </optgroup>
            ))}
          </select>

          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[#9B0F06] hover:bg-[#7a0c05] text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus size={16} />
            Crear {(selectedTable.nombre || selectedTable.id).split(' ')[0]}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full relative flex flex-col h-[calc(100vh-200px)]">
        <div className="p-3 border-b border-gray-100 bg-gray-50 flex items-center gap-4 flex-shrink-0">
          <div className="relative w-64 flex-shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Búsqueda global..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 h-8 border border-gray-300 rounded-md text-[11px] focus:outline-none focus:ring-1 focus:ring-[#9B0F06]"
            />
          </div>
          
          <div className="w-px h-6 bg-gray-200"></div>
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Filtros de Columna:</span>
          
          <div className="flex-1 flex overflow-x-auto items-center gap-2 pb-1 no-scrollbar">
            {columns.map(col => {
              const fieldSchema = schema.find(f => f.name === col)
              const type = fieldSchema?.type
              
              // Extract unique values from raw data if not boolean or schema-driven select
              let uniqueValues: any[] = [];
              if (type !== 'boolean' && type !== 'select') {
                uniqueValues = Array.from(new Set(data.map(item => item[col])))
                  .filter(val => val !== null && val !== undefined && val !== '')
                  .sort();
              }

              return (
                <div key={`filter-${col}`} className="flex items-center flex-shrink-0 relative">
                  {type === 'boolean' ? (
                    <select
                      value={filters[col] || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, [col]: e.target.value }))}
                      className="h-7 px-2 pr-6 border border-gray-300 rounded-md text-[10px] bg-white text-gray-700 min-w-[90px] focus:outline-none focus:ring-1 focus:ring-[#9B0F06]"
                    >
                      <option value="">{col.replace(/_/g, ' ')}</option>
                      <option value="true">Sí</option>
                      <option value="false">No</option>
                    </select>
                  ) : type === 'select' ? (
                    <select
                      value={filters[col] || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, [col]: e.target.value }))}
                      className="h-7 px-2 pr-6 border border-gray-300 rounded-md text-[10px] bg-white text-gray-700 max-w-[140px] truncate focus:outline-none focus:ring-1 focus:ring-[#9B0F06]"
                    >
                      <option value="">{fieldSchema?.label || col.replace(/_/g, ' ')}</option>
                      {optionsMap[col]?.map((opt: any) => (
                        <option key={opt[fieldSchema?.valueKey || 'id']} value={opt[fieldSchema?.valueKey || 'id']}>
                          {opt[fieldSchema?.labelKey || 'nombre']}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={filters[col] || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, [col]: e.target.value }))}
                      className="h-7 px-2 pr-6 border border-gray-300 rounded-md text-[10px] bg-white text-gray-700 max-w-[140px] truncate focus:outline-none focus:ring-1 focus:ring-[#9B0F06]"
                    >
                      <option value="">{col.replace(/_/g, ' ')}</option>
                      {uniqueValues.map((val, i) => (
                        <option key={i} value={val}>{String(val)}</option>
                      ))}
                    </select>
                  )}
                  {filters[col] && (
                    <button 
                      onClick={() => setFilters(prev => { const newF = {...prev}; delete newF[col]; return newF; })} 
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500" 
                      title="Limpiar filtro"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              )
            })}
            
            {Object.keys(filters).length > 0 && (
              <button 
                onClick={() => setFilters({})} 
                className="ml-1 h-7 px-2 text-[10px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors whitespace-nowrap"
              >
                Limpiar Todos
              </button>
            )}
          </div>
        </div>

        <div className="w-full overflow-x-auto relative flex-1">
          <table className="w-full text-left text-[10px] text-gray-700 border-collapse min-w-[800px]">
            <thead className="text-[9px] text-gray-500 uppercase bg-gray-100 border-b border-gray-200 sticky top-0 z-20">
              <tr>
                {columns.map(col => (
                  <th 
                    key={col} 
                    className="px-3 py-2 font-bold whitespace-nowrap border-r border-gray-200 tracking-wider group cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => handleSort(col)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span>{col.replace(/_/g, ' ')}</span>
                      {sortConfig?.key === col ? (
                        sortConfig.direction === 'asc' ? <ChevronUp size={12} className="text-[#9B0F06]" /> : <ChevronDown size={12} className="text-[#9B0F06]" />
                      ) : (
                        <ChevronUp size={12} className="opacity-0 group-hover:opacity-40 transition-opacity" />
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-3 py-2 font-bold text-center sticky right-0 bg-gray-100 z-30 border-l border-gray-200 shadow-[-4px_0_10px_rgba(0,0,0,0.03)] whitespace-nowrap w-24">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <div className="h-5 w-5 border-2 border-[#9B0F06] border-t-transparent rounded-full animate-spin mb-2"></div>
                      <span className="text-xs">Cargando datos...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-6 py-8 text-center text-gray-500 text-xs">
                    No hay registros encontrados.
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, idx) => (
                  <tr key={row.id || idx} className="border-b border-gray-100 hover:bg-yellow-50/50 transition-colors group h-8">
                    {columns.map(col => (
                      <td key={col} className="px-3 py-1.5 whitespace-nowrap border-r border-gray-50">
                        {typeof row[col] === 'boolean' 
                          ? (row[col] ? <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-sm font-semibold text-[9px]">SÍ</span> : <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-sm font-semibold text-[9px]">NO</span>)
                          : row[col] === null || row[col] === undefined
                            ? <span className="text-gray-300">-</span> 
                            : <span className="truncate block max-w-[280px]" title={String(row[col])}>{String(row[col])}</span>}
                      </td>
                    ))}
                    <td className="px-3 py-1.5 whitespace-nowrap text-center space-x-1 sticky right-0 bg-white z-10 border-l border-gray-100 shadow-[-4px_0_10px_rgba(0,0,0,0.03)] group-hover:bg-yellow-50/50 transition-colors">
                      <button onClick={() => handleView(row)} className="text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition-colors">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => handleEdit(row)} className="text-gray-400 hover:text-green-600 p-1 rounded hover:bg-green-50 transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(row.id)} className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación Footer */}
        <div className="p-3 border-t border-gray-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0 z-20">
          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            <span>Mostrar</span>
            <select 
              value={itemsPerPage} 
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="border border-gray-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#9B0F06] bg-white text-gray-700"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>registros por página</span>
          </div>

          <div className="text-[11px] text-gray-500">
            Mostrando {sortedData.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, sortedData.length)} de {sortedData.length} registros
          </div>

          <div className="flex items-center gap-1">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-[11px] text-gray-600 font-medium px-2">
              Página {currentPage} de {totalPages || 1}
            </span>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

      </div>

      <MantenimientoDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        mode={drawerMode}
        table={selectedTable.id}
        record={selectedRecord}
        onSave={handleSave}
        dataKeys={dataKeys}
      />
    </div>
  )
}
