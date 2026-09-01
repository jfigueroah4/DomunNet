const fs = require('fs');

let content = fs.readFileSync('C:/DomunNet/backend/src/modules/proyectos/proyectos.servicio.ts', 'utf8');

content = content.replace(
  'if (errorDetalle) {',
  'if (errorDetalle) { console.error("SUPABASE ERROR:", errorDetalle);'
);

fs.writeFileSync('C:/DomunNet/backend/src/modules/proyectos/proyectos.servicio.ts', content, 'utf8');
