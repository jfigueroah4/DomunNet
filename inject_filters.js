const fs = require('fs');
const path = require('path');

const modelsDir = 'C:/DomunNet/backend/src/modules/mantenimiento/models';
const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.ts') && f !== 'index.ts');

files.forEach(file => {
  const filePath = path.join(modelsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('columnasFiltroMenu')) return; // Already has filters

  let visibleMatch = content.match(/columnasVisibles:\s*'([^']+)'/);
  if (!visibleMatch) return;
  
  const cols = visibleMatch[1].split(',').map(c => c.trim());
  let filtros = [];
  
  cols.forEach(c => {
    if (c === 'activo' || c === 'aprobado' || c === 'exitoso' || c.startsWith('es_') || c.startsWith('aplica_') || c.includes('incluido')) {
      filtros.push(`{ columna: '${c}', tipo: 'boolean', opciones: ['true', 'false'] }`);
    } else if (c.endsWith('_id') && c !== 'usuario_id') {
      const tablaRef = c.replace('_id', '');
      filtros.push(`{ columna: '${c}', tipo: 'foreign_key', tablaReferencia: '${tablaRef}', columnaLabel: 'nombre', renderizado: 'select' }`);
    } else if (c === 'estado') {
      filtros.push(`{ columna: '${c}', tipo: 'enum', opciones: ['Activo', 'Inactivo'] }`); // Generic fallback
    }
  });

  if (filtros.length > 0) {
    const filtersStr = `\n  columnasFiltroMenu: [\n    ${filtros.join(',\n    ')}\n  ],`;
    content = content.replace(/(columnasFiltroOrden: \[.*?\]),?/, `$1,${filtersStr}`);
    fs.writeFileSync(filePath, content, 'utf8');
  }
});
console.log('Filtros inyectados');
