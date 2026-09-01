import codecs
import re

with codecs.open('C:/DomunNet/backend/src/modules/proyectos/proyectos.servicio.ts', 'r', 'utf-8') as f:
    content = f.read()

# Standardize line endings for easier regex
content = content.replace('\r\n', '\n')

# 1. Fix detalle
old_detalle = '''      proyecto_id: proyecto.id,
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
      monto_original: datosFormulario.montoContractualOriginal || null'';

new_detalle = '''      proyecto_id: proyecto.id,
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
      fecha_finalizacion_real: datosFormulario.fechaFinalizacionReal || null'''

content = content.replace(old_detalle, new_detalle)

# 2. Fix team
old_team = '''  // 4. Si hay delegado residente, insertar en `proyecto_usuario`
  if (datosFormulario.delegadoResidenteId) {
    await clienteSupabase.from('proyecto_usuario').insert({
      proyecto_id: proyecto.id,
      usuario_id: datosFormulario.delegadoResidenteId,
      rol_proyecto: 'Delegado Residente',
      permisos_especificos: []
    })
  }'''

new_team = '''  // 4. Insertar equipo en `proyecto_usuario`
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
    for (const miembro of datosFormulario.equpo) {
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
  }''

content = content.replace(old_team, new_team)

with codecs.open('C:/DomunNet/backend/src/modules/proyectos/proyectos.servicio.ts', 'w', 'utf-8') as f:
    f.write(content)

