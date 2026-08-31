const fs = require('fs');
let file = fs.readFileSync('C:/DomunNet/frontend/src/components/pages/MantenimientoTablas.tsx', 'utf8');

file = file.replace(/text-blue-600 bg-blue-50(.*?border-blue-100)/g, "text-orange-600 bg-orange-50$1 border-orange-100");

fs.writeFileSync('C:/DomunNet/frontend/src/components/pages/MantenimientoTablas.tsx', file, 'utf8');
