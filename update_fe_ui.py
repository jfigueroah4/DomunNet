import re

path = r"C:\DomunNet\frontend\src\components\pages\MantenimientoTablas.tsx"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add state and useEffect for foreign key options
# We will insert it right after `const [filters, setFilters] = useState<Record<string, any>>({});`
state_pattern = r"(const \[filters, setFilters\] = useState<Record<string, any>>\(\{\}\);)"
new_state = r"""\1
  const [foreignKeyOptions, setForeignKeyOptions] = useState<Record<string, any[]>>({});
  
  useEffect(() => {
    if (!selectedTable || selectedTable.esAuditoria || !selectedTable.columnasFiltroMenu) return;
    
    selectedTable.columnasFiltroMenu.forEach((filtro: any) => {
      if (filtro.tipo === 'foreign_key' && filtro.tablaReferencia) {
        api.get(`/mantenimiento/${filtro.tablaReferencia}?limite=2000`)
           .then(res => setForeignKeyOptions(prev => ({...prev, [filtro.columna]: res.data.data || []})))
           .catch(err => console.error(err));
      }
    });
  }, [selectedTable]);"""
content = re.sub(state_pattern, new_state, content)

# 2. Define the Combobox component at the end of the file (or outside the main component)
# It's better to put it right before `export default function MantenimientoTablas() {`
combobox_code = """
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

"""
if "ComboboxFiltro" not in content:
    content = content.replace("export default function MantenimientoTablas() {", combobox_code + "export default function MantenimientoTablas() {")

# 3. Modify the UI rendering inside `selectedTable.columnasFiltroMenu.map`
old_render = """                        {filtro.opciones?.map((opt: string) => {
                          const isSelected = filters[filtro.columna] === opt;
                          return (
                            <button
                              key={opt}
                              onClick={() => setFilters({...filters, [filtro.columna]: opt})}
                              className={`px-2 py-1 text-[9px] transition-all rounded-md ${isSelected ? 'bg-white text-[#9B0F06] border border-[#9B0F06] font-bold shadow-2xs' : 'text-gray-500 border border-transparent hover:bg-gray-50'}`}
                            >
                              {opt === 'true' ? 'S\ufffd' : opt === 'false' ? 'No' : opt}
                            </button>
                          )
                        })}"""

new_render = """                        {filtro.tipo === 'foreign_key' ? (
                          <div className="w-full mt-1">
                            {filtro.renderizado === 'combobox' ? (
                              <ComboboxFiltro 
                                options={(foreignKeyOptions[filtro.columna] || []).map(row => ({ value: row.id, label: row[filtro.columnaLabel || 'nombre'] }))}
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
                                {(foreignKeyOptions[filtro.columna] || []).map(row => (
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
                        
content = content.replace(old_render, new_render)
content = content.replace("S\ufffd", "Sí") # Fix encoding glitch from previous replace

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated MantenimientoTablas UI")
