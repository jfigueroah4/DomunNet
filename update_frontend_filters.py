import json
import re

with open(r"C:\DomunNet\filters_analysis.json", "r", encoding="utf-16") as f:
    tables_filters = json.load(f)

path = r"C:\DomunNet\frontend\src\components\pages\MantenimientoTablas.tsx"

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Lucide Imports
if "Filter" not in content:
    content = content.replace("Search, ChevronDown", "Search, ChevronDown, Filter")

# 2. Update TABLAS_MANTENIMIENTO
for table_name, filters in tables_filters.items():
    if not filters: continue
    
    filters_json_str = json.dumps(filters, ensure_ascii=False)
    filters_json_str = re.sub(r'"(columna|tipo|opciones)":', r'\1:', filters_json_str)
    
    # find the object in the array
    # e.g. { id: 'rol', nombre: 'Roles', endpoint: '/mantenimiento/rol', grupo: 'Seguridad', relaciones: ['Usuarios'] }
    pattern = r"(\{\s*id:\s*'" + table_name + r"'(?:(?!\}\s*,).)*?)\s*\}(?=\s*\,|\n\])"
    
    def replacer(match):
        obj_content = match.group(1)
        if "columnasFiltroMenu" in obj_content:
            return match.group(0) # already there
        return f"{obj_content}, columnasFiltroMenu: {filters_json_str} }}"
        
    content = re.sub(pattern, replacer, content, flags=re.DOTALL)


# 3. Replace fixed toggle with dynamic menu
old_ui = """            {columns.includes('activo') && (
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
                    className={`px-3 py-1 text-[9px] transition-all rounded-md ${
                      (filters.activo === (estado === 'Activo' ? 'true' : 'false') || (estado === 'Todos' && !filters.activo))
                        ? 'bg-white text-gray-800 shadow-2xs font-bold'
                        : 'text-gray-400 hover:text-gray-600 font-medium'
                    }`}
                  >
                    {estado}
                  </button>
                ))}
              </div>
            )}"""

new_ui = """            {!selectedTable.esAuditoria && selectedTable.columnasFiltroMenu && selectedTable.columnasFiltroMenu.length > 0 && (
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
                  {selectedTable.columnasFiltroMenu.map((filtro: any) => (
                    <div key={filtro.columna} className="mb-3 last:mb-0">
                      <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1.5">{filtro.columna.replace('_', ' ')}</label>
                      <div className="flex flex-wrap gap-1">
                        <button
                          onClick={() => { const newFilters = {...filters}; delete newFilters[filtro.columna]; setFilters(newFilters); }}
                          className={`px-2 py-1 text-[9px] transition-all rounded-md ${!filters[filtro.columna] ? 'bg-gray-100 text-gray-800 font-bold shadow-2xs' : 'text-gray-400 hover:bg-gray-50'}`}
                        >
                          Todos
                        </button>
                        {filtro.opciones?.map((opt: string) => {
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
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}"""

content = content.replace(old_ui, new_ui)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated frontend!")
