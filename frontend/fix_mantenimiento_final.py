import json
import sys
import re

path = r"C:\DomunNet\frontend\src\components\pages\MantenimientoTablas.tsx"

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix Mojibake
new_tablas = """const TABLAS_MANTENIMIENTO = [
  // 1. Catálogos Operacionales
  { id: 'catalogo', nombre: 'Catálogos', endpoint: '/mantenimiento/catalogo', grupo: 'Operacionales', relaciones: ['Ítems de Catálogo'] },
  { id: 'catalogo_item', nombre: 'Ítems de Catálogo', endpoint: '/mantenimiento/catalogo_item', grupo: 'Operacionales' },
  
  // 2. Proyectos
  { id: 'proyecto', nombre: 'Proyectos (Config)', endpoint: '/mantenimiento/proyecto', grupo: 'Proyectos', relaciones: ['Fases de Proyecto'] },
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
  { id: 'suspension_plazo', label: 'Suspensiones de Plazo', endpoint: '/mantenimiento/suspension_plazo', grupo: 'Configuración' },
  { id: 'control_plazo', nombre: 'Controles de Plazo', endpoint: '/mantenimiento/control_plazo', grupo: 'Configuración' },
  { id: 'control_anticipo', nombre: 'Controles de Anticipo', endpoint: '/mantenimiento/control_anticipo', grupo: 'Configuración' },
  { id: 'cronograma_planificado', nombre: 'Cronogramas Planificados', endpoint: '/mantenimiento/cronograma_planificado', grupo: 'Configuración' },

  // 7. Seguridad/Auditoría
  { id: 'rol', nombre: 'Roles', endpoint: '/mantenimiento/rol', grupo: 'Seguridad/Auditoría', relaciones: ['Usuarios'] },
  { id: 'estado_usuario', nombre: 'Estados Usuario', endpoint: '/mantenimiento/estado_usuario', grupo: 'Seguridad/Auditoría' },
]"""

content = re.sub(r"const TABLAS_MANTENIMIENTO = \[[^\]]*\]", new_tablas, content, flags=re.MULTILINE|re.DOTALL)
content = content.replace("Administra los catǭlogos y tablas maestras del sistema", "Administra los catálogos y tablas maestras del sistema")
content = content.replace("const columns = data.length > 0 ? Object.keys(data[0]).filter(k => k !== 'id') : []", "const columns = data.length > 0 ? Object.keys(data[0]).filter(k => k !== 'id' && k !== 'dependenciasCount') : []")

# Select mapping
old_select = """              <select
                value={selectedTable.id}
                onChange={handleTableChange}
                className="w-full pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#9B0F06] focus:border-[#9B0F06] appearance-none text-[11px] font-semibold text-gray-700 cursor-pointer"
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
            </div>"""

new_select = """              <select
                value={selectedTable.id}
                onChange={handleTableChange}
                className="w-full pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#9B0F06] focus:border-[#9B0F06] appearance-none text-[11px] font-semibold text-gray-700 cursor-pointer"
              >
                {TABLAS_MANTENIMIENTO.map(t => (
                  <option key={t.id} value={t.id}>{t.nombre || t.label}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDown size={16} className="text-gray-400" />
              </div>
            </div>
            {selectedTable.relaciones && selectedTable.relaciones.length > 0 && (
              <div className="text-[9px] text-gray-500 flex gap-1 items-center mt-1">
                <span className="font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-sm border border-blue-100">
                  Relacionado con: {selectedTable.relaciones.join(', ')}
                </span>
              </div>
            )}"""

content = content.replace(old_select, new_select)

# Search Bar Dropdown filters
old_search_container = """        <div className="mx-6 mb-6 flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex-1 relative">
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
          </div>"""

new_search_container = """        <div className="mx-6 mb-6 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden flex-1 relative">
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
                      className={`px-3 py-1 text-[9px] transition-all rounded-md ${(filters.activo === (estado === 'Activo' ? 'true' : 'false') || (estado === 'Todos' && !filters.activo)) ? 'bg-white text-gray-800 shadow-2xs font-bold' : 'text-gray-400 hover:text-gray-600 font-medium'}`}
                    >
                      {estado}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>"""

content = content.replace(old_search_container, new_search_container)

# Styling replace
content = content.replace('w-full text-left text-[10px] text-gray-700 border-collapse min-w-[800px]', 'w-full text-left border-collapse min-w-[900px]')
content = content.replace('text-[9px] text-gray-500 uppercase bg-gray-100 border-b border-gray-200 sticky top-0 z-20', 'bg-gray-50 border-b border-gray-100 sticky top-0 z-20')
content = content.replace('px-3 py-2 font-bold whitespace-nowrap border-r border-gray-200 tracking-wider group cursor-pointer hover:bg-gray-200 transition-colors', 'px-4 py-3 text-[9px] text-gray-400 uppercase tracking-wide font-semibold cursor-pointer group hover:bg-gray-100 transition-colors whitespace-nowrap')
content = content.replace('px-3 py-2 font-bold text-center sticky right-0 bg-gray-100 z-30 border-l border-gray-200 shadow-[-4px_0_10px_rgba(0,0,0,0.03)] whitespace-nowrap w-24', 'px-4 py-3 text-[9px] text-gray-400 uppercase tracking-wide font-semibold text-right sticky right-0 bg-gray-50 z-30 shadow-[-4px_0_10px_rgba(0,0,0,0.02)] whitespace-nowrap w-28 border-l border-gray-100')
content = content.replace('border-b border-gray-100 hover:bg-yellow-50/50 transition-colors group h-8', 'hover:bg-gray-50 border-t border-gray-50 transition-colors group')

# Actions replace
old_actions = """                      <td className="px-3 py-1.5 whitespace-nowrap text-center space-x-1 sticky right-0 bg-white z-10 border-l border-gray-100 shadow-[-4px_0_10px_rgba(0,0,0,0.03)] group-hover:bg-yellow-50/50 transition-colors">
                        <button onClick={() => handleView(row)} className="text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition-colors">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => handleEdit(row)} className="text-gray-400 hover:text-green-600 p-1 rounded hover:bg-green-50 transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(row)} className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </td>"""

new_actions = """                      <td className="px-4 py-3 whitespace-nowrap text-right sticky right-0 bg-white z-10 shadow-[-4px_0_10px_rgba(0,0,0,0.02)] group-hover:bg-gray-50 transition-colors border-l border-gray-50">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleView(row)} className="p-1.5 text-gray-400 transition-colors hover:text-[#9B0F06]" title="Ver detalle">
                            <Eye size={12} />
                          </button>
                          <button onClick={() => handleEdit(row)} className="p-1.5 text-gray-400 transition-colors hover:text-green-600" title="Editar">
                            <Edit2 size={12} />
                          </button>
                          {row.dependenciasCount > 0 ? (
                            <button disabled className="p-1.5 text-gray-300 opacity-50 cursor-not-allowed" title={`No se puede eliminar: tiene ${row.dependenciasCount} dependencia(s) asignada(s).`}>
                              <Trash2 size={12} />
                            </button>
                          ) : (
                            <button onClick={() => handleDelete(row)} className="p-1.5 text-gray-400 transition-colors hover:text-red-600" title="Eliminar">
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </td>"""

content = content.replace(old_actions, new_actions)

# TD replace
old_td = """                        <td key={col} className="px-3 py-1.5 whitespace-nowrap border-r border-gray-50">
                          {typeof row[col] === 'boolean' 
                            ? (row[col] ? <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-sm font-semibold text-[9px]">SÍ</span> : <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-sm font-semibold text-[9px]">NO</span>)
                            : row[col] === null || row[col] === undefined
                              ? <span className="text-gray-300">-</span> 
                              : <span className="truncate block max-w-[280px]" title={String(row[col])}>{String(row[col])}</span>}
                        </td>"""

new_td = """                        <td key={col} className="px-4 py-3 text-[10px] text-gray-600 font-medium whitespace-nowrap">
                          {typeof row[col] === 'boolean' || row[col] === 'true' || row[col] === 'false'
                            ? (String(row[col]) === 'true' || row[col] === true ? <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold text-[8px] uppercase tracking-wider border border-emerald-100">SÍ</span> : <span className="bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full font-bold text-[8px] uppercase tracking-wider border border-gray-200">NO</span>)
                            : row[col] === null || row[col] === undefined
                              ? <span className="text-gray-300">-</span> 
                              : <span className="truncate block max-w-[280px]" title={String(row[col])}>{String(row[col])}</span>}
                        </td>"""
content = content.replace(old_td, new_td)


with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
