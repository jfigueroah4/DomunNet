const fs = require('fs');
const path = require('path');

const items = JSON.parse(fs.readFileSync(path.join(__dirname, 'catalogo_oficial_49.json'), 'utf8'));
const lines = [];

for (const it of items) {
  lines.push('  {');
  lines.push(`    id: ${JSON.stringify(it.id)},`);
  lines.push(`    capituloId: ${it.capituloId},`);
  lines.push(`    capituloNombre: ${JSON.stringify(it.capituloNombre)},`);
  lines.push(`    codigoDGC: ${JSON.stringify(it.codigoDGC)},`);
  lines.push(`    descripcion: ${JSON.stringify(it.descripcion)},`);
  lines.push(`    unidad: ${JSON.stringify(it.unidad)},`);
  lines.push('    cantidadContratada: 0,');
  lines.push('    cantidadAjustada: 0,');
  lines.push('    costoUnitarioDirecto: 0,');
  lines.push('    cantidadEstePeriodo: 0,');
  lines.push('    cantidadAcumuladaAnterior: 0,');
  lines.push('    tipoRenglon: \'Original\',');
  lines.push('    estadoEjecucion: \'No iniciado\',');
  lines.push('    avancesMensuales: {},');
  lines.push('  },');
}

fs.writeFileSync(path.join(__dirname, 'catalogo_ts_snippet.ts'), lines.join('\n'), 'utf8');
console.log('Done! Generated', items.length, 'items');
