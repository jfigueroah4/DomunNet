import re

with open('C:/DomunNet/frontend/src/components/pages/MantenimientoTablas.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

regex = re.compile(r'<div className="relative group/filters">[\s\S]*?</div>\n                </div>', re.MULTILINE)

rep = '''<div className="flex flex-wrap items-center gap-2">
                  {selectedTable.columnasFiltroMenu.filter((filtro: any) =>
                    filtro.tipo === 'boolean' ||
                    filtro.tipo === 'foreign_key' ||
                    (filtro.tipo === 'enum' && filtro.opciones && filtro.opciones.length > 0)
                  ).map((filtro: any) => (
                    <div key={filtro.columna} className="flex items-center gap-2 bg-white px-2 py-1.5 rounded-lg border border-gray-200">
                      <span className="text-[9px] font-bold text-gray-500 uppercase">{filtro.columna.replace('_id', '').replace('_', ' ')}</span>
                      
                      {filtro.tipo === 'foreign_key' ? (
                        <div className="w-48">
                          {filtro.renderizado === 'combobox' ? (
                            <ComboboxFiltro 
                              options={(foreignKeyOptions[filtro.columna] || []).map((row: any) => ({ value: row.id, label: row[filtro.columnaLabel || 'nombre'] }))}
                              value={filters[filtro.columna]}
                              onChange={(val) => {
                                const newFilters = {...filters};
                                if (val === null || val === '') delete newFilters[filtro.columna];
                                else newFilters[filtro.columna] = val;
                                setFilters(newFilters);
                              }}
                            />
                          ) : (
                            <select 
                              className="w-full text-[10px] px-2 py-1 border border-gray-200 rounded-md outline-none bg-gray-50"
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
                        <select
                          className="text-[10px] px-2 py-1 border border-gray-200 rounded-md outline-none bg-gray-50"
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
                          {filtro.opciones?.map((opt: string) => (
                            <option key={opt} value={opt}>{opt === 'true' ? 'Sí' : opt === 'false' ? 'No' : opt}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>'''

content = regex.sub(rep, content)
with open('C:/DomunNet/frontend/src/components/pages/MantenimientoTablas.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
