import json
import sys

path = r"C:\DomunNet\frontend\src\components\pages\MantenimientoTablas.tsx"

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# I will write a custom python script to rewrite the whole file because of the extent of changes needed.
new_content = """'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, ChevronDown, ChevronLeft, ChevronRight, Edit2, Trash2, Eye, ChevronUp } from 'lucide-react'
import { api } from '@/lib/api/cliente'
import { useCustomToast } from '@/hooks/useCustomToast'
import MantenimientoDrawer from '@/components/modules/mantenimiento/MantenimientoDrawer'
import MantenimientoDeleteModal from '@/components/modules/mantenimiento/MantenimientoDeleteModal'
import EstadoVacio from '@/components/ui/EstadoVacio'

const TABLAS_MANTENIMIENTO = [
  // 1. Catálogos Operacionales
  { id: 'catalogo', nombre: 'Catálogos', endpoint: '/mantenimiento/catalogo', grupo: 'Operacionales', relaciones: ['Ítems de Catálogo'] },
  { id: 'catalogo_item', nombre: 'Ítems de Catálogo', endpoint: '/mantenimiento/catalogo_item', grupo: 'Operacionales' },
  
  // 2. Proyectos
  { id: 'proyecto', nombre: 'Proyectos (Config)', endpoint: '/mantenimiento/proyecto', grupo: 'Proyectos', relaciones: ['Fases de Proyecto', 'Detalles', 'Roles', 'Anticipos'] },
  { id: 'fase_proyecto', nombre: 'Fases de Proyecto', endpoint: '/mantenimiento/fase_proyecto', grupo: 'Proyectos' },
  { id: 'categoria_actividad', nombre: 'Categorías de Actividad', endpoint: '/mantenimiento/categoria_actividad', grupo: 'Proyectos' },
  { id: 'renglon_trabajo', nombre: 'Renglones de Trabajo', endpoint: '/mantenimiento/renglon_trabajo', grupo: 'Proyectos' },
  { id: 'modificativo_renglon', nombre: 'Modificativos Renglón', endpoint: '/mantenimiento/modificativo_renglon', grupo: 'Proyectos' },
  { id: 'catalogo_descuento_tecnico', nombre: 'Descuentos Técnicos', endpoint: '/mantenimiento/catalogo_descuento_tecnico', grupo: 'Proyectos' },

  // 3. Estructura Geográfica
  { id: 'departamento', nombre: 'Departamentos', endpoint: '/mantenimiento/departamento', grupo: 'Estructura Geográfica', relaciones: ['Municipios'] },
  { id: 'municipio', nombre: 'Municipios', endpoint: '/mantenimiento/municipio', grupo: 'Estructura Geográfica' },

  // 4. Entidades
  { id: 'empresa', nombre: 'Empresas (Contratistas)', endpoint: '/mantenimiento/empresa', grupo: 'Entidades' },
  { id: 'empresa_contratante', nombre: 'Empresas Contratantes', endpoint: '/mantenimiento/empresa_contratante', grupo: 'Entidades' },

  // 5. Laboratorio
  { id: 'tipo_ensayo', nombre: 'Tipos Ensayo', endpoint: '/mantenimiento/tipo_ensayo', grupo: 'Laboratorio' },
  { id: 'ensayo_laboratorio', nombre: 'Ensayos Laboratorio', endpoint: '/mantenimiento/ensayo_laboratorio', grupo: 'Laboratorio' },
  { id: 'especificacion_tecnica', nombre: 'Especificaciones Técnicas', endpoint: '/mantenimiento/especificacion_tecnica', grupo: 'Laboratorio' },

  // 6. Configuración
  { id: 'unidad_medida', nombre: 'Unidades de Medida', endpoint: '/mantenimiento/unidad_medida', grupo: 'Configuración' },
  { id: 'parametro_proyecto', nombre: 'Parámetros Proyecto', endpoint: '/mantenimiento/parametro_proyecto', grupo: 'Configuración' },
  { id: 'suspension_plazo', nombre: 'Suspensiones de Plazo', endpoint: '/mantenimiento/suspension_plazo', grupo: 'Configuración' },
  { id: 'control_plazo', nombre: 'Controles de Plazo', endpoint: '/mantenimiento/control_plazo', grupo: 'Configuración' },
  { id: 'control_anticipo', nombre: 'Controles de Anticipo', endpoint: '/mantenimiento/control_anticipo', grupo: 'Configuración' },
  { id: 'cronograma_planificado', nombre: 'Cronogramas Planificados', endpoint: '/mantenimiento/cronograma_planificado', grupo: 'Configuración' },

  // 7. Seguridad/Auditoría
  { id: 'rol', nombre: 'Roles', endpoint: '/mantenimiento/rol', grupo: 'Seguridad/Auditoría', relaciones: ['Usuarios'] },
  { id: 'estado_usuario', nombre: 'Estados Usuario', endpoint: '/mantenimiento/estado_usuario', grupo: 'Seguridad/Auditoría' },
]

export default function MantenimientoTablas() {
  const [selectedTable, setSelectedTable] = useState<any>(TABLAS_MANTENIMIENTO[0])
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [totalRecords, setTotalRecords] = useState(0)

  // Estados UI
  const [globalFilter, setGlobalFilter] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc'|'desc'} | null>(null)
  
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

      const res = await api.get( + '' + ${selectedTable.endpoint}? + '' + )
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
      await api.delete( + '' + ${selectedTable.endpoint}/ + '' + )
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
                className="w-full pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#9B0F06] focus:border-[#9B0F06] appearance-none text-[11px] font-semibold text-gray-700 cursor-pointer"
              >
                {TABLAS_MANTENIMIENTO.map(t => (
                  <option key={t.id} value={t.id}>{t.nombre || t.id}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDown size={14} className="text-gray-400" />
              </div>
            </div>
            {selectedTable.relaciones && selectedTable.relaciones.length > 0 && (
              <div className="text-[9px] text-gray-500 flex gap-1 items-center mt-0.5">
                <span className="font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-sm border border-blue-100">
                  Relacionado con: {selectedTable.relaciones.join(', ')}
                </span>
              </div>
            )}
          </div>
          
          <button
            onClick={handleCreate}
            className="flex items-center gap-1.5 bg-[#9B0F06] hover:bg-[#7a0c05] text-white px-3 py-1.5 rounded-lg transition-colors shadow-sm whitespace-nowrap text-[11px] font-bold h-[34px] self-start"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Nuevo Registro</span>
          </button>
        </div>
      </div>

      <div className="mx-6 mb-6 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden flex-1 relative">
        <div className="p-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-white flex-shrink-0">
          <div className="relative w-full sm:w-64 group">
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

          <div className="flex flex-wrap gap-2 items-center">
            {/* Generic filter for 'activo' or 'estado' if they exist in the schema conceptually */}
            {columns.includes('activo') && (
              <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-100">
                <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide px-2">Estado</span>
                {['Todos', 'Activo', 'Inactivo'].map((estado) => (
                  <button
                    key={estado}
                    onClick={() => {
                       if (estado === 'Todos') {
                         const newFilters = {...filters}; delete newFilters.activo; setFilters(newFilters);
                       } else {
                         setFilters({...filters, activo: estado === 'Activo' ? 'true' : 'false'})
                       }
                    }}
                    className={px-3 py-1 text-[9px] transition-all rounded-md }
                  >
                    {estado}
                  </button>
                ))}
              </div>
            )}
            
            <div className="text-[9px] text-gray-400 font-medium ml-2">
              {totalRecords} registro{totalRecords !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {data.length === 0 && !loading ? (
          <div className="flex-1 overflow-auto bg-gray-50/30">
             <div className="p-10 flex justify-center">
                <EstadoVacio onCrear={handleCreate} />
             </div>
          </div>
        ) : (
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
                          <button onClick={() => handleEdit(row)} className="p-1.5 text-gray-400 transition-colors hover:text-green-600" title="Editar">
                            <Edit2 size={12} />
                          </button>
                          {row.dependenciasCount > 0 ? (
                            <button disabled className="p-1.5 text-gray-300 opacity-50 cursor-not-allowed" title={No se puede eliminar: tiene  dependencia(s) asignada(s).}>
                              <Trash2 size={12} />
                            </button>
                          ) : (
                            <button onClick={() => handleDelete(row)} className="p-1.5 text-gray-400 transition-colors hover:text-red-600" title="Eliminar">
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

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
"""

with open(path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Listo")
