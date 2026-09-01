import codecs

with codecs.open('C:/DomunNet/frontend/src/components/modules/proyectos/ProyectoFormulario.tsx', 'r', 'utf-8') as f:
    content = f.read()

# Fix 1: handleAgregar id
old_miembro = '''const nuevoMiembro: MiembroEquipo = {
      id: Date.now().toString(),
      nombre: userObj.nombre,
      rol: rolFormateado,
    }'''
new_miembro = '''const nuevoMiembro: MiembroEquipo = {
      id: userObj.id,
      nombre: userObj.nombre,
      rol: rolFormateado,
    }'''
content = content.replace(old_miembro, new_miembro)

# Fix 2: Ingeniero Responsable Combobox value
old_responsable = '''<label className={labelClass}>Ingeniero Responsable / Director</label>
                    <Combobox
                      options={usuariosDisponibles.map((u: any) => ({ value: u.nombre, label: u.nombre + ' @' + (u.username || (u.correo ? u.correo.split('@')[0] : '')) + ' (' + u.rol + ')' }))}'''
new_responsable = '''<label className={labelClass}>Ingeniero Responsable / Director</label>
                    <Combobox
                      options={usuariosDisponibles.map((u: any) => ({ value: u.id, label: u.nombre + ' @' + (u.username || (u.correo ? u.correo.split('@')[0] : '')) + ' (' + u.rol + ')' }))}'''
if old_responsable in content:
    content = content.replace(old_responsable, new_responsable)
else:
    # Try with single line format that was in Select-String
    old_responsable_2 = "options={usuariosDisponibles.map((u: any) => ({ value: u.nombre, label: u.nombre + ' @' + (u.username || (u.correo ? u.correo.split('@')[0] : '')) + ' (' + u.rol + ')' }))}"
    new_responsable_2 = "options={usuariosDisponibles.map((u: any) => ({ value: u.id, label: u.nombre + ' @' + (u.username || (u.correo ? u.correo.split('@')[0] : '')) + ' (' + u.rol + ')' }))}"
    content = content.replace(old_responsable_2, new_responsable_2)

# Fix 3: Estado Inicial disabled
old_estado = '''<label className={labelClass}>Estado Inicial del Proyecto</label>
                    <select
                      value={estado}
                      onChange={(e) => setEstado(e.target.value as EstadoProyecto)}
                      className={inputClass}
                    >'''
new_estado = '''<label className={labelClass}>Estado Inicial del Proyecto <span className="text-[8px] font-normal text-gray-400">(AUTOMÁTICO)</span></label>
                    <select
                      value={estado}
                      onChange={(e) => setEstado(e.target.value as EstadoProyecto)}
                      className={${inputClass} bg-gray-100 cursor-not-allowed opacity-80}
                      disabled={true}
                    >'''
if old_estado in content:
    content = content.replace(old_estado, new_estado)
else:
    # Fallback to loose replace
    import re
    content = re.sub(
        r'<label className=\{labelClass\}>Estado Inicial del Proyecto</label>\s*<select\s*value=\{estado\}\s*onChange=\{\(e\) => setEstado\(e\.target\.value as EstadoProyecto\)\}\s*className=\{inputClass\}\s*>',
        r'<label className={labelClass}>Estado Inicial del Proyecto <span className="text-[8px] font-normal text-gray-400">(AUTOMÁTICO)</span></label>\n                    <select\n                      value={estado}\n                      onChange={(e) => setEstado(e.target.value as EstadoProyecto)}\n                      className={${inputClass} bg-gray-100 cursor-not-allowed opacity-80}\n                      disabled={true}\n                    >',
        content
    )

with codecs.open('C:/DomunNet/frontend/src/components/modules/proyectos/ProyectoFormulario.tsx', 'w', 'utf-8') as f:
    f.write(content)
