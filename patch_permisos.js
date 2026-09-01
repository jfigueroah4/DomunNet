const fs = require('fs');
let content = fs.readFileSync('C:/DomunNet/backend/src/modules/proyectos/proyectos.servicio.ts', 'utf8');

// replace permisos_especificos: [] inside the team insert
content = content.replace(/,\s*permisos_especificos:\s*\[\]/g, "");

fs.writeFileSync('C:/DomunNet/backend/src/modules/proyectos/proyectos.servicio.ts', content, 'utf8');
