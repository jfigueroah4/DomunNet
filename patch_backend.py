import codecs

with codecs.open('C:/DomunNet/backend/src/modules/proyectos/proyectos.servicio.ts', 'r', 'utf-8') as f:
    content = f.read()

# Fix 1: Map empresa_contratista_id and missing fields
old_insert_detalle = '''      .insert({
      proyecto_id: proyecto.id,
      nombre_oficial: datosFormulario.nombreOficial,
      descripcion_proyecto: datosFormulario.descripcion,
      tramo: datosFormulario.ubicacionFisica,
      municipio_id: datosFormulario.municipioId || null,
      empresa_contratante_id: datosFormulario.empresaContratanteId || null,
      empresa_contratista_ejecutora: datosFormulario.empresaContratista || null,
      empresa_supervisora: datosFormulario.empresaSupervisora || null,
      fecha_adjudicacion: datosFormulario.fechaAdjudicacion || null,
      fecha_inicio_contractual: datosFormulario.fechaInicioContractual || null,
      numero_escritura_publica: datosFormulario.numeroEscrituraPublica || null,
      monto_original: datosFormulario.montoContractualOriginal || null
    })'''
# Normalize spaces since my old_insert might not match exactly
import re
pattern_detalle = r'\.insert\(\{\s*proyecto_id: proyecto\.id,[\s\S]*?monto_original: datosFormulario\.montoContractualOriginal \|\| null\s*\}\)'

new_insert_detalle = '''.insert({
      proyecto_id: proyecto.id,
      nombre_oficial: datosFormulario.nombreOficial,
      descripcion_proyecto: datosFormulario.descripcion,
      tramo: datosFormulario.ubicacionFisica,
      municipio_id: datosFormulario.municipioId || null,
      empresa_contratante_id: datosFormulario.empresaContratanteId || null,
      empresa_contratista_id: datosFormulario.empresaContratista || null,
      empresa_supervisora: datosFormulario.empresaSupervisora || null,
      fecha_adjudicacion: datosFormulario.fechaAdjudicacion || null,
      fecha_inicio_contractual: datosFormulario.fechaInicioContractual || null,
      numero_escritura_publica: datosFormulario.numeroEscrituraPublica || null,
      monto_original: datosFormulario.montoContractualOriginal || null,
      plazo_ejecucion_original: datosFormulario.plazoEjecucionOriginal ? parseInt(datosFormulario.plazoEjecucionOriginal, 10) : null,
      plazo_ejecucion_ampliado: datosFormulario.plazoEjecucionRealAmpliado ? parseInt(datosFormulario.plazoEjecucionRealAmpliado, 10) : null,
      fecha_finalizacion_real: datosFormulario.fechaFinalizacionReal || null
    })'''
content = re.sub(pattern_detalle, new_insert_detalle, content)

# Fix 2: Team insertion logic
old_team = r'// 4\. Si hay delegado residente, insertar en proyecto_usuario\s*if \(datosFormulario\.delegadoResidenteId\) \{\s*await clienteSupabase\.from\(\'proyecto_usuario\'\)\.insert\(\{\s*proyecto_id: proyecto\.id,\s*usuario_id: datosFormulario\.delegadoResidenteId,\s*rol_proyecto: \'Delegado Residente\',\s*permisos_especificos: \[\]\s*\}\)\s*\}'

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

content = re.sub(old_team, new_team, content)

with codecs.open('C:/DomunNet/backend/src/modules/proyectos/proyectos.servicio.ts', 'w', 'utf-8') as f:
    f.write(content)
