import re

with open('C:/DomunNet/frontend/src/components/modules/proyectos/ProyectoFormulario.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Entidad
regex_entidad = re.compile(r'<input\s+type="text"\s+value=\{entidadContratante\}[\s\S]*?/>')
rep_entidad = '''<Combobox
  options={empresas.map((e: any) => ({ value: e.nombre, label: e.nombre }))}
  value={entidadContratante}
  onChange={(val) => setEntidadContratante(val)}
  placeholder="Buscar Empresa Contratante..."
  className="mt-1"
/>'''
content = regex_entidad.sub(rep_entidad, content)

# Contratista
regex_contra = re.compile(r'<input\s+type="text"\s+value=\{empresaContratista\}[\s\S]*?/>')
rep_contra = '''<Combobox
  options={empresas.map((e: any) => ({ value: e.nombre, label: e.nombre }))}
  value={empresaContratista}
  onChange={(val) => setEmpresaContratista(val)}
  placeholder="Buscar Empresa Contratista..."
  className="mt-1"
/>'''
content = regex_contra.sub(rep_contra, content)

# Delegado
regex_del = re.compile(r'<input\s+type="text"\s+value=\{delegadoResidente\}[\s\S]*?/>')
rep_del = '''<Combobox
  options={usuariosDisponibles.filter((u: any) => u.rol?.toLowerCase() === 'administrador' || u.rol?.toLowerCase() === 'ingenieroresidente').map((u: any) => ({ value: u.nombre, label: u.nombre + ' ' + (u.apellido || '') }))}
  value={delegadoResidente}
  onChange={(val) => setDelegadoResidente(val)}
  placeholder="Buscar Delegado Residente..."
  className="mt-1"
/>'''
content = regex_del.sub(rep_del, content)

# Obligatorio note
regex_header = re.compile(r'(<SectionHeader\s+title="Secci.n 3: Entidades y Empresas Intervinientes"\s+subtitle="Propietario, Contratista Ejecutor, Empresa Supervisora y Delegado Residente"\s+icon=\{Users\}\s+/>)')
rep_header = '\\1\\n                <p className="text-[10px] italic text-gray-500 mb-2">Todos los campos con (*) son obligatorios</p>'
content = regex_header.sub(rep_header, content)

# Encoding fixes
content = content.replace('IDENTIFICACIÃ“N Y UBICACIÃ“N', 'IDENTIFICACIÓN Y UBICACIÓN')
content = content.replace('TÃ‰RMINOS Y SEGUIMIENTO', 'TÉRMINOS Y SEGUIMIENTO')
content = content.replace('SECCIÃ“N', 'SECCIÓN')
content = content.replace('MÃ³dulo', 'Módulo')
content = content.replace('automÃ¡ticamente', 'automáticamente')
content = content.replace('â†', '←')

with open('C:/DomunNet/frontend/src/components/modules/proyectos/ProyectoFormulario.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

with open('C:/DomunNet/frontend/src/app/dashboard/roles/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()
    content = content.replace('â†', '←')
with open('C:/DomunNet/frontend/src/app/dashboard/roles/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
