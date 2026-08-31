const fs = require('fs');
let file = fs.readFileSync('C:/DomunNet/frontend/src/components/modules/empresas/EmpresaDrawer.tsx', 'utf8');

file = file.replace(/<h2 className="text-\[16px\] font-extrabold text-gray-900">Nueva Empresa<\/h2>/, "<h2 className=\"text-[16px] font-extrabold text-gray-900\">\n   {mode === 'view' ? 'Vista Empresa' : mode === 'edit' ? 'Editar Empresa' : 'Nueva Empresa'}\n   </h2>");

fs.writeFileSync('C:/DomunNet/frontend/src/components/modules/empresas/EmpresaDrawer.tsx', file, 'utf8');
