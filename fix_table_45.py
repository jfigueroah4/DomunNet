import re

path = r"C:\DomunNet\frontend\src\components\pages\MantenimientoTablas.tsx"

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace TABLAS_MANTENIMIENTO
new_tablas = """const TABLAS_MANTENIMIENTO = [
  // 1. Catálogos Operacionales
  { id: 'catalogo', nombre: 'Catálogos', endpoint: '/mantenimiento/catalogo', grupo: 'Operacionales', relaciones: ['Ítems de Catálogo'] },
  { id: 'catalogo_item', nombre: 'Ítems de Catálogo', endpoint: '/mantenimiento/catalogo_item', grupo: 'Operacionales' },
  { id: 'unidad_medida', nombre: 'Unidades de Medida', endpoint: '/mantenimiento/unidad_medida', grupo: 'Operacionales' },
  
  // 2. Entidades y Usuarios
  { id: 'empresa', nombre: 'Empresas (Contratistas)', endpoint: '/mantenimiento/empresa', grupo: 'Entidades' },
  { id: 'empresa_contratante', nombre: 'Empresas Contratantes', endpoint: '/mantenimiento/empresa_contratante', grupo: 'Entidades' },
  { id: 'contacto_contratante', nombre: 'Contactos de Contratante', endpoint: '/mantenimiento/contacto_contratante', grupo: 'Entidades' },
  { id: 'usuario', nombre: 'Usuarios', endpoint: '/mantenimiento/usuario', grupo: 'Seguridad' },
  { id: 'dato_usuario', nombre: 'Datos de Usuario', endpoint: '/mantenimiento/dato_usuario', grupo: 'Seguridad' },
  { id: 'rol', nombre: 'Roles', endpoint: '/mantenimiento/rol', grupo: 'Seguridad', relaciones: ['Usuarios'] },

  // 3. Proyectos
  { id: 'proyecto', nombre: 'Proyectos', endpoint: '/mantenimiento/proyecto', grupo: 'Proyectos', relaciones: ['Fases', 'Detalles', 'Usuarios'] },
  { id: 'proyecto_usuario', nombre: 'Usuarios por Proyecto', endpoint: '/mantenimiento/proyecto_usuario', grupo: 'Proyectos' },
  { id: 'proyecto_detalle', nombre: 'Detalles de Proyecto', endpoint: '/mantenimiento/proyecto_detalle', grupo: 'Proyectos' },
  { id: 'fase_proyecto', nombre: 'Fases de Proyecto', endpoint: '/mantenimiento/fase_proyecto', grupo: 'Proyectos' },
  { id: 'documento_proyecto', nombre: 'Documentos de Proyecto', endpoint: '/mantenimiento/documento_proyecto', grupo: 'Proyectos' },
  { id: 'categoria_actividad', nombre: 'Categorías de Actividad', endpoint: '/mantenimiento/categoria_actividad', grupo: 'Proyectos' },
  { id: 'capitulo_sabana', nombre: 'Capítulos (Sábana)', endpoint: '/mantenimiento/capitulo_sabana', grupo: 'Proyectos' },
  { id: 'renglon_trabajo', nombre: 'Renglones de Trabajo', endpoint: '/mantenimiento/renglon_trabajo', grupo: 'Proyectos' },
  { id: 'modificativo_renglon', nombre: 'Modificativos de Renglón', endpoint: '/mantenimiento/modificativo_renglon', grupo: 'Proyectos' },
  { id: 'catalogo_descuento_tecnico', nombre: 'Descuentos Técnicos', endpoint: '/mantenimiento/catalogo_descuento_tecnico', grupo: 'Proyectos' },

  // 4. Geografía
  { id: 'departamento', nombre: 'Departamentos', endpoint: '/mantenimiento/departamento', grupo: 'Geografía', relaciones: ['Municipios'] },
  { id: 'municipio', nombre: 'Municipios', endpoint: '/mantenimiento/municipio', grupo: 'Geografía' },

  // 5. Laboratorio
  { id: 'especificacion_tecnica', nombre: 'Especificaciones Técnicas', endpoint: '/mantenimiento/especificacion_tecnica', grupo: 'Laboratorio' },
  { id: 'tipo_ensayo', nombre: 'Tipos de Ensayo', endpoint: '/mantenimiento/tipo_ensayo', grupo: 'Laboratorio' },
  { id: 'ensayo_laboratorio', nombre: 'Ensayos de Laboratorio', endpoint: '/mantenimiento/ensayo_laboratorio', grupo: 'Laboratorio' },

  // 6. Configuración / Parámetros
  { id: 'configuracion_general', nombre: 'Configuración General', endpoint: '/mantenimiento/configuracion_general', grupo: 'Configuración' },
  { id: 'parametro_proyecto', nombre: 'Parámetros de Proyecto', endpoint: '/mantenimiento/parametro_proyecto', grupo: 'Configuración' },
  { id: 'cronograma_planificado', nombre: 'Cronogramas Planificados', endpoint: '/mantenimiento/cronograma_planificado', grupo: 'Configuración' },
  { id: 'control_anticipo', nombre: 'Controles de Anticipo', endpoint: '/mantenimiento/control_anticipo', grupo: 'Configuración' },
  { id: 'control_plazo', nombre: 'Controles de Plazo', endpoint: '/mantenimiento/control_plazo', grupo: 'Configuración' },
  { id: 'suspension_plazo', nombre: 'Suspensiones de Plazo', endpoint: '/mantenimiento/suspension_plazo', grupo: 'Configuración' },

  // 7. Bitácora / Transaccional
  { id: 'condicion_climatica', nombre: 'Condiciones Climáticas', endpoint: '/mantenimiento/condicion_climatica', grupo: 'Bitácora' },
  { id: 'estacion_kilometrica', nombre: 'Estaciones Kilométricas', endpoint: '/mantenimiento/estacion_kilometrica', grupo: 'Bitácora' },
  { id: 'bitacora_entrada', nombre: 'Entradas de Bitácora', endpoint: '/mantenimiento/bitacora_entrada', grupo: 'Bitácora' },
  { id: 'bitacora_avance', nombre: 'Avances de Bitácora', endpoint: '/mantenimiento/bitacora_avance', grupo: 'Bitácora' },
  { id: 'bitacora_pendiente', nombre: 'Pendientes de Bitácora', endpoint: '/mantenimiento/bitacora_pendiente', grupo: 'Bitácora' },
  { id: 'bitacora_pendiente_ajuste', nombre: 'Ajustes de Pendientes', endpoint: '/mantenimiento/bitacora_pendiente_ajuste', grupo: 'Bitácora' },
  { id: 'incidente_obra', nombre: 'Incidentes de Obra', endpoint: '/mantenimiento/incidente_obra', grupo: 'Bitácora' },
  { id: 'incidente_evidencia', nombre: 'Evidencias de Incidente', endpoint: '/mantenimiento/incidente_evidencia', grupo: 'Bitácora' },
  { id: 'evidencia_fotografica', nombre: 'Evidencias Fotográficas', endpoint: '/mantenimiento/evidencia_fotografica', grupo: 'Bitácora' },

  // 8. Auditoría y Logs (Solo Lectura)
  { id: 'estado_usuario', nombre: 'Estados de Usuario', endpoint: '/mantenimiento/estado_usuario', grupo: 'Auditoría', esAuditoria: true },
  { id: 'backup_sistema', nombre: 'Backups del Sistema', endpoint: '/mantenimiento/backup_sistema', grupo: 'Auditoría', esAuditoria: true },
  { id: 'restauracion_sistema', nombre: 'Restauraciones del Sistema', endpoint: '/mantenimiento/restauracion_sistema', grupo: 'Auditoría', esAuditoria: true },
  { id: 'reporte', nombre: 'Reportes Generados', endpoint: '/mantenimiento/reporte', grupo: 'Auditoría', esAuditoria: true },
  { id: 'auditoria_operativa', nombre: 'Auditorías Operativas', endpoint: '/mantenimiento/auditoria_operativa', grupo: 'Auditoría', esAuditoria: true },
  { id: 'seguridad_log', nombre: 'Logs de Seguridad', endpoint: '/mantenimiento/seguridad_log', grupo: 'Auditoría', esAuditoria: true },
]"""

content = re.sub(r"const TABLAS_MANTENIMIENTO = \[[^\]]*\]", new_tablas, content, flags=re.MULTILINE|re.DOTALL)

# Add lock icon to select mapping
old_select = """                {TABLAS_MANTENIMIENTO.map(t => (
                  <option key={t.id} value={t.id}>{t.nombre || t.label || t.id}</option>
                ))}"""

new_select = """                {TABLAS_MANTENIMIENTO.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.nombre || t.label || t.id} {t.esAuditoria ? '(Solo lectura)' : ''}
                  </option>
                ))}"""

content = content.replace(old_select, new_select)

# Add 'Solo lectura' badge
old_badge = """            {selectedTable.relaciones && selectedTable.relaciones.length > 0 && (
              <div className="text-[9px] text-gray-500 flex gap-1 items-center mt-0.5">
                <span className="font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-sm border border-blue-100">
                  Relacionado con: {selectedTable.relaciones.join(', ')}
                </span>
              </div>
            )}"""

new_badge = """            <div className="text-[9px] text-gray-500 flex gap-1 items-center mt-0.5">
              {selectedTable.esAuditoria && (
                <span className="font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-sm border border-orange-100 flex items-center gap-1">
                  🔒 Solo lectura
                </span>
              )}
              {selectedTable.relaciones && selectedTable.relaciones.length > 0 && (
                <span className="font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-sm border border-blue-100">
                  Relacionado con: {selectedTable.relaciones.join(', ')}
                </span>
              )}
            </div>"""

content = content.replace(old_badge, new_badge)

# Hide Nuevo Registro button for audit tables
old_button = """          <button
            onClick={handleCreate}
            className="flex items-center gap-1.5 bg-[#9B0F06] hover:bg-[#7a0c05] text-white px-3 py-1.5 rounded-lg transition-colors shadow-sm whitespace-nowrap text-[11px] font-bold h-[34px] self-start"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Nuevo Registro</span>
          </button>"""

new_button = """          {!selectedTable.esAuditoria && (
            <button
              onClick={handleCreate}
              className="flex items-center gap-1.5 bg-[#9B0F06] hover:bg-[#7a0c05] text-white px-3 py-1.5 rounded-lg transition-colors shadow-sm whitespace-nowrap text-[11px] font-bold h-[34px] self-start"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">Nuevo Registro</span>
            </button>
          )}"""
          
content = content.replace(old_button, new_button)

# Add custom date/user filters for audit tables inside the search container
old_filters = """            <div className="relative w-full sm:w-64 group">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                <Search size={14} className="text-gray-400 group-focus-within:text-[#9B0F06] transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Buscar registros..."
                className="w-full pl-8 pr-3 py-1.5 text-[10px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#9B0F06] transition-colors text-gray-700"
                value={globalFilter}
                onChange={e => setGlobalFilter(e.target.value)}
              />
            </div>"""

new_filters = """            <div className="relative w-full sm:w-64 group">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                <Search size={14} className="text-gray-400 group-focus-within:text-[#9B0F06] transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Buscar registros..."
                className="w-full pl-8 pr-3 py-1.5 text-[10px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#9B0F06] transition-colors text-gray-700"
                value={globalFilter}
                onChange={e => setGlobalFilter(e.target.value)}
              />
            </div>
            
            {selectedTable.esAuditoria && (
              <div className="flex gap-2 items-center flex-wrap">
                <input 
                  type="date" 
                  className="px-2 py-1.5 text-[10px] border border-gray-200 rounded-lg text-gray-600 focus:outline-none focus:border-[#9B0F06]"
                  title="Fecha de Inicio"
                  onChange={e => setFilters({...filters, fecha_inicio: e.target.value})}
                />
                <input 
                  type="date" 
                  className="px-2 py-1.5 text-[10px] border border-gray-200 rounded-lg text-gray-600 focus:outline-none focus:border-[#9B0F06]"
                  title="Fecha de Fin"
                  onChange={e => setFilters({...filters, fecha_fin: e.target.value})}
                />
                <input 
                  type="text" 
                  placeholder="ID Usuario"
                  className="px-2 py-1.5 text-[10px] w-24 border border-gray-200 rounded-lg text-gray-600 focus:outline-none focus:border-[#9B0F06]"
                  onChange={e => setFilters({...filters, usuario_id: e.target.value})}
                />
              </div>
            )}"""

content = content.replace(old_filters, new_filters)

# Hide Edit/Delete actions in rows if read only
old_actions = """                      <td className="px-4 py-3 whitespace-nowrap text-right sticky right-0 bg-white z-10 shadow-[-4px_0_10px_rgba(0,0,0,0.02)] group-hover:bg-gray-50 transition-colors border-l border-gray-50">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleView(row)} className="p-1.5 text-gray-400 transition-colors hover:text-[#9B0F06]" title="Ver detalle">
                            <Eye size={12} />
                          </button>
                          <button onClick={() => handleEdit(row)} className="p-1.5 text-gray-400 transition-colors hover:text-green-600" title="Editar">
                            <Edit2 size={12} />
                          </button>
                          {row.dependenciasCount && row.dependenciasCount > 0 ? (
                            <button disabled className="p-1.5 text-gray-300 opacity-50 cursor-not-allowed" title={`No se puede eliminar: tiene ${row.dependenciasCount} dependencia(s) asignada(s).`}>
                              <Trash2 size={12} />
                            </button>
                          ) : (
                            <button onClick={() => handleDelete(row)} className="p-1.5 text-gray-400 transition-colors hover:text-red-600" title="Eliminar">
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </td>"""

new_actions = """                      <td className="px-4 py-3 whitespace-nowrap text-right sticky right-0 bg-white z-10 shadow-[-4px_0_10px_rgba(0,0,0,0.02)] group-hover:bg-gray-50 transition-colors border-l border-gray-50">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleView(row)} className="p-1.5 text-gray-400 transition-colors hover:text-[#9B0F06]" title="Ver detalle">
                            <Eye size={12} />
                          </button>
                          {!selectedTable.esAuditoria && (
                            <>
                              <button onClick={() => handleEdit(row)} className="p-1.5 text-gray-400 transition-colors hover:text-green-600" title="Editar">
                                <Edit2 size={12} />
                              </button>
                              {row.dependenciasCount && row.dependenciasCount > 0 ? (
                                <button disabled className="p-1.5 text-gray-300 opacity-50 cursor-not-allowed" title={`No se puede eliminar: tiene ${row.dependenciasCount} dependencia(s) asignada(s).`}>
                                  <Trash2 size={12} />
                                </button>
                              ) : (
                                <button onClick={() => handleDelete(row)} className="p-1.5 text-gray-400 transition-colors hover:text-red-600" title="Eliminar">
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>"""

content = content.replace(old_actions, new_actions)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
