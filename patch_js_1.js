const fs = require('fs');

let content = fs.readFileSync('C:/DomunNet/frontend/src/components/modules/proyectos/ProyectoFormulario.tsx', 'utf8');

// 1. Imports
content = content.replace("import {", "import { Map, Satellite, Route, MapPin, Loader2,", 1);

// 2. Add Departamentos/Municipios dropdowns
const ubicacionHtml = \<div className="space-y-2">
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    <div>
                      <label className={labelClass}>Departamento <span className="text-[#9B0F06]">*</span></label>
                      <Combobox
                        options={departamentos.map((d: any) => ({ value: d.id, label: d.nombre }))}
                        value={departamentoId}
                        onChange={(val) => {
                          setDepartamentoId(val);
                          setMunicipioId(''); // reset municipio
                          setErrors(prev => ({...prev, departamentoId: false}));
                        }}
                        placeholder="Seleccionar departamento..."
                        className={errors.departamentoId ? "border-red-500 rounded-xl" : ""}
                      />
                      {errors.departamentoId && <p className="text-red-500 text-[10px] mt-1">Este campo es obligatorio</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Municipio <span className="text-[#9B0F06]">*</span></label>
                      <Combobox
                        options={municipios.filter((m: any) => m.departamento_id === departamentoId).map((m: any) => ({ value: m.id, label: m.nombre }))}
                        value={municipioId}
                        onChange={(val) => {
                          setMunicipioId(val);
                          setErrors(prev => ({...prev, municipioId: false}));
                        }}
                        placeholder="Seleccionar municipio..."
                        className={errors.municipioId ? "border-red-500 rounded-xl" : ""}
                        disabled={!departamentoId}
                      />
                      {errors.municipioId && <p className="text-red-500 text-[10px] mt-1">Este campo es obligatorio</p>}
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Ubicación Física\;

content = content.replace('<div className="space-y-2">\\n                  <div>\\n                    <label className={labelClass}>Ubicación Física', ubicacionHtml);
content = content.replace('<div className="space-y-2">\\n                  <div>\\n                    <label className={labelClass}>Ubicaci\u00f3n F\u00edsica', ubicacionHtml);

// 3. Validation
const valHtml = \if (!ubicacionFisica.trim()) { newErrors.ubicacionFisica = true; isValid = false }
        if (!departamentoId) { newErrors.departamentoId = true; isValid = false }
        if (!municipioId) { newErrors.municipioId = true; isValid = false }\;
content = content.replace('if (!ubicacionFisica.trim()) { newErrors.ubicacionFisica = true; isValid = false }', valHtml);

// 4. SelectorMapaInteractivo Sig
const sig_old = \<SelectorMapaInteractivo
                    direccion={direccion}
                    setDireccion={setDireccion}
                    errors={errors}
                    setErrors={setErrors}
                    coordenadas={coordenadasMapa}
                    setCoordenadas={setCoordenadasMapa}
                  />\;
const sig_new = \<SelectorMapaInteractivo
                    direccion={direccion}
                    setDireccion={setDireccion}
                    errors={errors}
                    setErrors={setErrors}
                    coordenadas={coordenadasMapa}
                    setCoordenadas={setCoordenadasMapa}
                    departamentoId={departamentoId}
                    municipioId={municipioId}
                    departamentos={departamentos}
                    municipios={municipios}
                  />\;
content = content.replace(sig_old, sig_new);

fs.writeFileSync('C:/DomunNet/frontend/src/components/modules/proyectos/ProyectoFormulario.tsx', content, 'utf8');
