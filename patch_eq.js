const fs = require('fs');
let content = fs.readFileSync('C:/DomunNet/backend/src/modules/proyectos/proyectos.servicio.ts', 'utf8');

content = content.replace(
  "await clienteSupabase.from('proyecto_usuario').insert(usuariosAInsertar);",
  "const { error: errorEq } = await clienteSupabase.from('proyecto_usuario').insert(usuariosAInsertar);\n    if (errorEq) console.error('EQUIPO ERROR:', errorEq);"
);

fs.writeFileSync('C:/DomunNet/backend/src/modules/proyectos/proyectos.servicio.ts', content, 'utf8');
