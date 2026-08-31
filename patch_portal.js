const fs = require('fs');
let file = fs.readFileSync('C:/DomunNet/frontend/src/components/modules/usuarios/UsuarioFormularioDrawer.tsx', 'utf8');
if (!file.includes('import { Portal }')) {
  file = file.replace(/import \{.*?\} from 'react'/, "$&\nimport { Portal } from '@/components/ui/Portal'");
}
file = file.replace(/return \(\s*<>\s*\{\/\* Overlay \*\/\}/, "return (\n    <Portal>\n      <>\n        {/* Overlay */}");
file = file.replace(/<\/div>\s*<\/>\s*\)\s*\}\s*$/, "</div>\n      </>\n    </Portal>\n  )\n}\n");
fs.writeFileSync('C:/DomunNet/frontend/src/components/modules/usuarios/UsuarioFormularioDrawer.tsx', file, 'utf8');

let file2 = fs.readFileSync('C:/DomunNet/frontend/src/components/modules/empresas/EmpresaDrawer.tsx', 'utf8');
if (!file2.includes('import { Portal }')) {
  file2 = file2.replace(/import \{.*?\} from 'react'/, "$&\nimport { Portal } from '@/components/ui/Portal'");
}
file2 = file2.replace(/return \(\s*<>\s*<div className="fixed top-0 left-0/, "return (\n    <Portal>\n      <>\n   <div className=\"fixed top-0 left-0");
file2 = file2.replace(/<\/aside>\s*<\/div>\s*<\/>\s*\)\s*\}\s*$/, "</aside>\n   </div>\n      </>\n    </Portal>\n  )\n}\n");
fs.writeFileSync('C:/DomunNet/frontend/src/components/modules/empresas/EmpresaDrawer.tsx', file2, 'utf8');
