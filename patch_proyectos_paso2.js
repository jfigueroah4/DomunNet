const fs = require('fs');
let file = fs.readFileSync('C:/DomunNet/frontend/src/components/modules/proyectos/ProyectoFormulario.tsx', 'utf8');

const regexEntidadContratante = /<input\s+type="text"\s+value=\{entidadContratante\}[\s\S]*?\/>/;
const replacementEntidadContratante = <Combobox
  options={empresas.map((e: any) => ({ value: e.id || e.nombre, label: e.nombre }))}
  value={entidadContratante}
  onChange={(val) => setEntidadContratante(val)}
  placeholder="Buscar Empresa Contratante..."
  className="mt-1"
/>;
file = file.replace(regexEntidadContratante, replacementEntidadContratante);

const regexEmpresaContratista = /<input\s+type="text"\s+value=\{empresaContratista\}[\s\S]*?\/>/;
const replacementEmpresaContratista = <Combobox
  options={empresas.map((e: any) => ({ value: e.id || e.nombre, label: e.nombre }))}
  value={empresaContratista}
  onChange={(val) => setEmpresaContratista(val)}
  placeholder="Buscar Empresa Contratista..."
  className="mt-1"
/>;
file = file.replace(regexEmpresaContratista, replacementEmpresaContratista);

const regexDelegado = /<input\s+type="text"\s+value=\{delegadoResidente\}[\s\S]*?\/>/;
const replacementDelegado = <Combobox
  options={usuariosDisponibles.filter((u: any) => u.rol?.toLowerCase() === 'administrador' || u.rol?.toLowerCase() === 'ingenieroresidente').map((u: any) => ({ value: u.id || u.nombre, label: u.nombre + ' ' + (u.apellido || '') }))}
  value={delegadoResidente}
  onChange={(val) => setDelegadoResidente(val)}
  placeholder="Buscar Delegado Residente..."
  className="mt-1"
/>;
file = file.replace(regexDelegado, replacementDelegado);

const regexPaso2Header = /(<SectionHeader\s+title="Secci.n 3: Entidades y Empresas Intervinientes"\s+subtitle="Propietario, Contratista Ejecutor, Empresa Supervisora y Delegado Residente"\s+icon=\{Users\}\s+\/>)/;
const replacementPaso2Header = "\\n                <p className=\"text-[10px] italic text-gray-500 mb-2\">Todos los campos con (*) son obligatorios</p>";
file = file.replace(regexPaso2Header, replacementPaso2Header);

fs.writeFileSync('C:/DomunNet/frontend/src/components/modules/proyectos/ProyectoFormulario.tsx', file, 'utf8');
