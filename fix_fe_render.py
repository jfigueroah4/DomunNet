import re

path = r"C:\DomunNet\frontend\src\components\pages\MantenimientoTablas.tsx"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# We need to find the old map for filtro.opciones and replace it.
# The map looks like this:
old_target = """                        {filtro.opciones?.map((opt: string) => {
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
                        })}"""

# First try to find exact match
if old_target in content:
    print("Found exact match")
else:
    print("Exact match not found. Trying regex.")
    
# Let's just use regex to replace the whole block
pattern = re.compile(r"\{\s*filtro\.opciones\?\.map\(\(opt:\s*string\)\s*=>\s*\{.*?(?=\}\s*<\/div>\s*<\/div>)", re.DOTALL)
match = pattern.search(content)
if match:
    print("Found via regex")
    
new_target = """                        {filtro.tipo === 'foreign_key' ? (
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
                        )}"""

if match:
    content = content[:match.start()] + new_target + content[match.end():]
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Replaced successfully")
else:
    print("Could not find target to replace")
