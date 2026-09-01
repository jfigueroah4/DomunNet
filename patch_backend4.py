import codecs
with codecs.open('C:/DomunNet/backend/src/modules/proyectos/proyectos.servicio.ts', 'r', 'utf-8') as f:
    content = f.read()

start = content.find('// 4. Si hay delegado residente')
end = content.find('return proyecto.id')

if start != -1 and end != -1:
    new_team = '''// 4. Insertar equipo en proyecto_usuario
  const usuariosAInsertar: any[] = []
  
  if (datosFormulario.delegadoResidenteId) {
    usuariosAInsertar.push({
      proyecto_id: proyecto.id,
      usuario_id: datosFormulario.delegadoResidenteId,
      rol_proyecto: 'Delegado Residente',
      permisos_especificos: []
    })
  }
  
  if (Array.isArray(datosFormulario.equipo)) {
    for (const miembro of datosFormulario.equipo) {
      if (miembro.id && miembro.id !== datosFormulario.delegadoResidenteId) {
        usuariosAInsertar.push({
          proyecto_id: proyecto.id,
          usuario_id: miembro.id,
          rol_proyecto: miembro.rol || 'Miembro',
          permisos_especificos: []
        })
      }
    }
  }
  
  if (usuariosAInsertar.length > 0) {
    await clienteSupabase.from('proyecto_usuario').insert(usuariosAInsertar)
  }
  
  '''
    content = content[:start] + new_team + content[end:]
else:
    print("Not found index!")

with codecs.open('C:/DomunNet/backend/src/modules/proyectos/proyectos.servicio.ts', 'w', 'utf-8') as f:
    f.write(content)
