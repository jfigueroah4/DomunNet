const fs = require('fs');
let file = fs.readFileSync('C:/DomunNet/frontend/src/components/modules/empresas/EmpresaDrawer.tsx', 'utf8');

file = file.replace(/const parts = String\(du\.fecha_nacimiento\)\.split\('-'\);/, "const parts = String(du.fecha_nacimiento).split('T')[0].split('-');");

fs.writeFileSync('C:/DomunNet/frontend/src/components/modules/empresas/EmpresaDrawer.tsx', file, 'utf8');
