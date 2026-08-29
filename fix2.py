import json
path = r"C:\DomunNet\frontend\src\components\pages\MantenimientoTablas.tsx"

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

header = content.split("export default function MantenimientoTablas() {")[0]

new_component = """export default function MantenimientoTablas() {
  const [selectedTable, setSelectedTable] = useState(TABLAS_MANTENIMIENTO[0])
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
      // Usar query params
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

      const res = await api.get( + "" + ${selectedTable.endpoint}? + "" + )
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

  // Refetch when params change
  useEffect(() => {
    fetchData()
  }, [selectedTable, currentPage, itemsPerPage, globalFilter, sortConfig, filters])

  // Reset page when filters change
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

  const columns = data.length > 0 ? Object.keys(data[0]).filter(k => k !== 'id') : []

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
      await api.delete( + "" + ${selectedTable.endpoint}/ + "" + )
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
    <div className="flex flex-col h-full bg-gray-50/50 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 px-6 pt-4 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">Mantenimiento de Datos</h1>
          <p className="text-sm text-gray-500">
            Administra los catálogos y tablas maestras del sistema
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <select
              value={selectedTable.id}
              onChange={handleTableChange}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#9B0F06] focus:border-[#9B0F06] appearance-none text-sm font-medium text-gray-700 cursor-pointer"
            >
              {TABLAS_MANTENIMIENTO.map(t => (
                <option key={t.id} value={t.id}>{t.nombre || t.label}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDown size={16} className="text-gray-400" />
            </div>
          </div>
          
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 bg-[#9B0F06] hover:bg-[#7a0c05] text-white px-4 py-2 rounded-md transition-colors shadow-sm whitespace-nowrap text-sm font-medium h-[38px]"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Nuevo Registro</span>
          </button>
        </div>
      </div>

      <div className="mx-6 mb-6 flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex-1 relative">
        <div className="p-3 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gray-50/50 flex-shrink-0">
          <div className="relative w-full sm:w-64 group">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <Search size={14} className="text-gray-400 group-focus-within:text-[#9B0F06] transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Buscar registros..."
              className="w-full pl-8 pr-3 py-1.5 text-[11px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#9B0F06] focus:border-[#9B0F06] transition-all bg-white"
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
            />
          </div>
        </div>

        {data.length === 0 && !loading ? (
          <div className="flex-1 overflow-auto">
             <div className="p-10 flex justify-center">
                <EstadoVacio onCrear={handleCreate} />
             </div>
          </div>
        ) : (
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
                ) : (
                  data.map((row, idx) => (
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
                        <button onClick={() => handleDelete(row)} className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors">
                          <Trash2 size={14} />
                        </button>
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
              Mostrando {totalRecords === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, totalRecords)} de {totalRecords} registros
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
    f.write(header + new_component)
