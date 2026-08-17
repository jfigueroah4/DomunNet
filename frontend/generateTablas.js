const fs = require('fs');

const fileContent = `
'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Eye, Edit2, Trash2 } from 'lucide-react'
import { api } from '@/lib/api/cliente'
import { useCustomToast } from '@/hooks/useCustomToast'
import MantenimientoDrawer from '@/components/modules/mantenimiento/MantenimientoDrawer'

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
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'view'>('create')
  const [selectedRecord, setSelectedRecord] = useState<any>(null)

  const { showSuccessToast, showErrorToast } = useCustomToast()

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
      await api.delete(\`\${selectedTable.endpoint}/\${id}\`)
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
        await api.put(\`\${selectedTable.endpoint}/\${selectedRecord.id}\`, payload)
        showSuccessToast('Registro actualizado correctamente')
      }
      setIsDrawerOpen(false)
      fetchData()
    } catch (error) {
      showErrorToast('Error al guardar el registro')
    }
  }

  const filteredData = data.filter((item) => {
    return Object.values(item).some(
      (val) => String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  // Obtener columnas dinámicamente de la data
  const columns = data.length > 0 ? Object.keys(data[0]).filter(k => k !== 'id' && !k.endsWith('_id')) : []

  // Agrupar tablas
  const grupos = [...new Set(TABLAS_MANTENIMIENTO.map(t => t.grupo))]

  return (
    <div className="space-y-4 max-w-7xl mx-auto py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mantenimiento de Tablas</h1>
          <p className="text-sm text-gray-500">Gestión estructurada de base de datos</p>
        </div>
        
        <div className="flex items-center gap-3">
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
            className="flex items-center gap-2 px-4 py-2 bg-[#9B0F06] hover:bg-[#7a0c05] text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={16} />
            Crear {(selectedTable.nombre || selectedTable.id).split(' ')[0]}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#9B0F06]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                {columns.slice(0, 5).map(col => (
                  <th key={col} className="px-6 py-3 font-semibold">{col.replace(/_/g, ' ')}</th>
                ))}
                <th className="px-6 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    <div className="animate-pulse flex flex-col items-center">
                      <div className="h-6 w-6 border-2 border-[#9B0F06] border-t-transparent rounded-full animate-spin mb-2"></div>
                      Cargando datos...
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No hay registros en esta tabla.
                  </td>
                </tr>
              ) : (
                filteredData.map((row, idx) => (
                  <tr key={row.id || idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    {columns.slice(0, 5).map(col => (
                      <td key={col} className="px-6 py-4 whitespace-nowrap">
                        {typeof row[col] === 'boolean' 
                          ? (row[col] ? 'Sí' : 'No')
                          : row[col] === null 
                            ? '-' 
                            : String(row[col]).substring(0, 50)}
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                      <button onClick={() => handleView(row)} className="text-gray-400 hover:text-blue-600 p-1">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => handleEdit(row)} className="text-gray-400 hover:text-green-600 p-1">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(row.id)} className="text-gray-400 hover:text-red-600 p-1">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <MantenimientoDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        mode={drawerMode}
        table={selectedTable.id}
        record={selectedRecord}
        onSave={handleSave}
      />
    </div>
  )
}
`
fs.writeFileSync('C:/DomunNet/frontend/src/components/pages/MantenimientoTablas.tsx', fileContent);
