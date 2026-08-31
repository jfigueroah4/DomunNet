const fs = require('fs');
let file = fs.readFileSync('C:/DomunNet/frontend/src/components/modules/empresas/EmpresaDrawer.tsx', 'utf8');

file = file.replace(/<button onClick=\{\(\) => setPaso\(1\)\}[\s\S]*?Guardar Empresa'\)}[\s\S]*?<\/button>/,
`<button onClick={() => setPaso(1)} disabled={isSubmitting} className="flex-1 rounded-xl bg-white border border-gray-200 px-4 py-3 text-[13px] font-bold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50">
   Atrás
   </button>
   {mode === 'view' ? (
     <button onClick={onClose} className="flex-1 rounded-xl bg-[#9B0F06] px-4 py-3 text-[13px] font-bold text-white shadow-md hover:bg-[#7A0C05] transition-all">
       Cerrar
     </button>
   ) : (
     <button onClick={handleGuardar} disabled={isSubmitting} className="flex-1 rounded-xl bg-[#9B0F06] px-4 py-3 text-[13px] font-bold text-white shadow-md hover:bg-[#7A0C05] transition-all disabled:opacity-50">
       {isSubmitting ? 'Guardando...' : (orphanUserId ? 'Reintentar guardar empresa' : 'Guardar Empresa')}
     </button>
   )}`);

fs.writeFileSync('C:/DomunNet/frontend/src/components/modules/empresas/EmpresaDrawer.tsx', file, 'utf8');
