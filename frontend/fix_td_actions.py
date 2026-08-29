import sys
import re

path = r"C:\DomunNet\frontend\src\components\pages\MantenimientoTablas.tsx"

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix TD
content = re.sub(
    r'<td key=\{col\} className="px-3 py-1\.5 whitespace-nowrap border-r border-gray-50">.*?</td>',
    r'''<td key={col} className="px-4 py-3 text-[10px] text-gray-600 font-medium whitespace-nowrap">
                        {typeof row[col] === 'boolean' || row[col] === 'true' || row[col] === 'false'
                          ? (String(row[col]) === 'true' ? <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold text-[8px] uppercase tracking-wider border border-emerald-100">SÍ</span> : <span className="bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full font-bold text-[8px] uppercase tracking-wider border border-gray-200">NO</span>)
                          : row[col] === null || row[col] === undefined
                            ? <span className="text-gray-300">-</span> 
                            : <span className="truncate block max-w-[280px]" title={String(row[col])}>{String(row[col])}</span>}
                      </td>''',
    content,
    flags=re.DOTALL
)

# Fix Actions
content = re.sub(
    r'<td className="px-3 py-1\.5 whitespace-nowrap text-center space-x-1 sticky right-0 bg-white z-10 border-l border-gray-100 shadow-\[-4px_0_10px_rgba\(0,0,0,0\.03\)\] group-hover:bg-yellow-50/50 transition-colors">.*?</td>',
    r'''<td className="px-4 py-3 whitespace-nowrap text-right sticky right-0 bg-white z-10 shadow-[-4px_0_10px_rgba(0,0,0,0.02)] group-hover:bg-gray-50 transition-colors border-l border-gray-50">
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
                    </td>''',
    content,
    flags=re.DOTALL
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
