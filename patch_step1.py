import re

with open('C:/DomunNet/frontend/src/components/modules/proyectos/ProyectoFormulario.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update lucide-react imports
if 'Map, Satellite, Route' not in content:
    content = content.replace("import {", "import { Map, Satellite, Route, MapPin, Loader2,", 1)

# 2. Add Departamento and Municipio to Paso 1 before UbicacionFisica
# Find:
#                 <div className="space-y-2">
#                   <div>
#                     <label className={labelClass}>Ubicacin Fsica
regex_ubicacion = re.compile(r'(<div className="space-y-2">\s*<div>\s*<label className=\{labelClass\}>Ubicación Física)')
dropdowns_html = '''<div className="space-y-2">
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
                    <label className={labelClass}>Ubicación Física'''
content = regex_ubicacion.sub(dropdowns_html, content)

# 3. Update Validation logic in handleAvanzarPaso
regex_validar = re.compile(r'(if \(!ubicacionFisica\.trim\(\)\) \{ newErrors\.ubicacionFisica = true; isValid = false \})')
val_html = '''\\1
        if (!departamentoId) { newErrors.departamentoId = true; isValid = false }
        if (!municipioId) { newErrors.municipioId = true; isValid = false }'''
content = regex_validar.sub(val_html, content)

# 4. Modify SelectorMapaInteractivo Signature inside ProyectoFormulario
regex_mapa_sig = re.compile(r'(<SelectorMapaInteractivo\s+direccion=\{direccion\}\s+setDireccion=\{setDireccion\}\s+errors=\{errors\}\s+setErrors=\{setErrors\}\s+coordenadas=\{coordenadasMapa\}\s+setCoordenadas=\{setCoordenadasMapa\}\s+/>)')
mapa_sig_html = '''<SelectorMapaInteractivo
                    direccion={direccion}
                    setDireccion={setDireccion}
                    errors={errors}
                    setErrors={setErrors}
                    coordenadas={coordenadasMapa}
                    setCoordenadas={setCoordenadasMapa}
                    contextoBusqueda={${municipios.find(m => m.id === municipioId)?.nombre || ''}, }
                  />'''
content = regex_mapa_sig.sub(mapa_sig_html, content)

# Write back to check before modifying the map component itself
with open('C:/DomunNet/frontend/src/components/modules/proyectos/ProyectoFormulario.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
