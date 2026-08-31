const fs = require('fs');
let file = fs.readFileSync('C:/DomunNet/frontend/src/components/modules/proyectos/ProyectoFormulario.tsx', 'utf8');

if (!file.includes('import { Combobox }')) {
  file = file.replace(/import \{.*?\} from 'react'/, "$&\nimport { Combobox } from '@/components/ui/Combobox'");
}

file = file.replace(/<select\s+value=\{departamentoId\}\s+onChange=\{.*?\}[^>]*>[\s\S]*?<\/select>/,
`<Combobox
                    options={departamentos.map(d => ({ value: d.id, label: d.nombre }))}
                    value={departamentoId}
                    onChange={(val) => {
                      setDepartamentoId(val);
                      setMunicipioId('');
                      setErrors(prev => ({...prev, departamentoId: false}));
                    }}
                    placeholder="Seleccione departamento..."
                    className={errors.departamentoId ? '[&>button]:border-red-400' : ''}
                  />`);

file = file.replace(/<select\s+value=\{municipioId\}\s+onChange=\{.*?\}[^>]*>[\s\S]*?<\/select>/,
`<Combobox
                    options={municipios.filter((m) => m.departamento_id === departamentoId).map((m) => ({ value: m.id, label: m.nombre }))}
                    value={municipioId}
                    onChange={(val) => {
                      setMunicipioId(val);
                      setErrors(prev => ({...prev, municipioId: false}));
                    }}
                    placeholder={departamentoId ? 'Seleccione municipio...' : 'Seleccione depto primero'}
                    disabled={!departamentoId}
                    className={errors.municipioId ? '[&>button]:border-red-400' : ''}
                  />`);

fs.writeFileSync('C:/DomunNet/frontend/src/components/modules/proyectos/ProyectoFormulario.tsx', file, 'utf8');
