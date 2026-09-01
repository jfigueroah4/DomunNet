const fs = require('fs');

let content = fs.readFileSync('C:/DomunNet/frontend/src/components/modules/proyectos/ProyectoFormulario.tsx', 'utf8');

// Fix 1: handleAgregar id
content = content.replace(
  'id: Date.now().toString(),',
  'id: userObj.id,'
);

// Fix 2: Ingeniero Responsable Combobox value
content = content.replace(
  /options=\{usuariosDisponibles\.map\(\(u: any\) => \(\{ value: u\.nombre, label:/g,
  "options={usuariosDisponibles.map((u: any) => ({ value: u.id, label:"
);

// Fix 3: Estado Inicial disabled
content = content.replace(
  '<label className={labelClass}>Estado Inicial del Proyecto</label>',
  '<label className={labelClass}>Estado Inicial del Proyecto <span className="text-[8px] font-normal text-gray-400">(AUTOMÁTICO)</span></label>'
);
content = content.replace(
  'onChange={(e) => setEstado(e.target.value as EstadoProyecto)}\n                        className={inputClass}',
  'onChange={(e) => setEstado(e.target.value as EstadoProyecto)}\n                        className={${inputClass} bg-gray-100 cursor-not-allowed opacity-80}\n                        disabled={true}'
);

fs.writeFileSync('C:/DomunNet/frontend/src/components/modules/proyectos/ProyectoFormulario.tsx', content, 'utf8');
