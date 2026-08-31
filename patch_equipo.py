import re

with open('C:/DomunNet/frontend/src/components/modules/proyectos/ProyectoFormulario.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

regex_equipo = re.compile(r'<select[\s\S]*?</select>', re.MULTILINE)

# We need to find the specific select for EquipoAsignadoSelector.
# It should be around <option value="">-- Seleccionar profesional
match_equipo = re.search(r'<select[^>]*value=\{selectedUsuarioId\}[^>]*>.*?-- Seleccionar profesional.*?</select>', content, re.DOTALL)
if match_equipo:
    rep = '''<Combobox
  options={usuariosDisponibles.filter((u: any) => u.rol?.toLowerCase() !== 'contratante').map((u: any) => ({ value: u.id, label: u.nombre + ' - ' + (u.cargo || u.rol.toUpperCase()) }))}
  value={selectedUsuarioId}
  onChange={(val) => setSelectedUsuarioId(val)}
  placeholder="Buscar profesional del Módulo de Usuarios..."
  className="flex-1"
/>'''
    content = content[:match_equipo.start()] + rep + content[match_equipo.end():]

# Let's fix Ingeniero Responsable too, just in case.
match_resp = re.search(r'<select[^>]*value=\{responsable\}[^>]*>.*?Selecciona el responsable de obra.*?</select>', content, re.DOTALL)
if match_resp:
    rep_resp = '''<Combobox
  options={usuariosDisponibles.map((u: any) => ({ value: u.nombre, label: u.nombre + ' @' + (u.username || (u.correo ? u.correo.split('@')[0] : '')) + ' (' + u.rol + ')' }))}
  value={responsable}
  onChange={(val) => setResponsable(val)}
  placeholder="Buscar responsable de obra..."
/>'''
    content = content[:match_resp.start()] + rep_resp + content[match_resp.end():]

with open('C:/DomunNet/frontend/src/components/modules/proyectos/ProyectoFormulario.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
