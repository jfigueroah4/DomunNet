const fs = require('fs');
let file = fs.readFileSync('C:/DomunNet/frontend/src/components/pages/MantenimientoTablas.tsx', 'utf8');

const regex = /<div className="relative w-full">\s*<select[\s\S]*?<\/select>\s*<div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">\s*<ChevronDown size=\{14\} className="text-gray-400" \/>\s*<\/div>\s*<\/div>/g;

const newHtml = `<Combobox
                options={TABLAS_MANTENIMIENTO.map(t => ({ value: t.id, label: t.nombre + (t.esAuditoria ? ' (Solo lectura)' : '') }))}
                value={selectedTable.id}
                onChange={(val) => handleTableChange({ target: { value: val } } as any)}
                placeholder="Buscar tabla..."
              />`;

file = file.replace(regex, newHtml);
fs.writeFileSync('C:/DomunNet/frontend/src/components/pages/MantenimientoTablas.tsx', file, 'utf8');
