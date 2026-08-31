const fs = require('fs');
let file = fs.readFileSync('C:/DomunNet/frontend/src/components/modules/usuarios/UsuarioFormularioDrawer.tsx', 'utf8');

file = file.replace(/r\.nombre !== 'Contratante'/g, "r.nombre.toLowerCase() !== 'contratante'");

fs.writeFileSync('C:/DomunNet/frontend/src/components/modules/usuarios/UsuarioFormularioDrawer.tsx', file, 'utf8');
