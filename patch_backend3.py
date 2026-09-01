import codecs
import re

with codecs.open('C:/DomunNet/backend/src/modules/proyectos/proyectos.servicio.ts', 'r', 'utf-8') as f:
    content = f.read()

# 1. Fix insert for proyecto_detalle
# We want to replace the .insert({...}) inside proyecto_detalle
detalle_start = content.find(".from('proyecto_detalle')")
if detalle_start != -1:
    insert_start = content.find('.insert({', detalle_start)
    insert_end = content.find('})', insert_start) + 2
    
    old_insert = content[insert_start:insert_end]
    
    # modify the insert block
    new_insert = old_insert.replace('empresa_contratista_ejecutora:', 'empresa_contratista_id:')
    
    # add the missing fields before the closing brace
    addition = ''',
      plazo_ejecucion_original: datosFormulario.plazoEjecucionOriginal ? parseInt(datosFormulario.plazoEjecucionOriginal, 10) : null,
      plazo_ejecucion_ampliado: datosFormulario.plazoEjecucionRealAmpliado ? parseInt(datosFormulario.plazoEjecucionRealAmpliado, 10) : null,
      fecha_finalizacion_real: datosFormulario.fechaFinalizacionReal || null
    }'''
    new_insert = new_insert.replace('\n    })', addition)
    new_insert = new_insert.replace('\r\n    })', addition)
    if '})' in new_insert and 'plazo' not in new_insert:
        new_insert = new_insert[:-2] + addition
    
    content = content[:insert_start] + new_insert + content[insert_end:]

# 2. Fix Team Logic
team_regex = re.compile(r'// 4\. Si hay delegado residente, insertar en proyecto_usuario[\s\S]*?\}\s*\}')
match = team_regex.search(content)
if match:
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
  }'''
    content = content[:match.start()] + new_team + content[match.end():]
else:
    print("Could not find team regex!")

with codecs.open('C:/DomunNet/backend/src/modules/proyectos/proyectos.servicio.ts', 'w', 'utf-8') as f:
    f.write(content)
