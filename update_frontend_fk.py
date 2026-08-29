import json
import re

fe_path = r"C:\DomunNet\frontend\src\components\pages\MantenimientoTablas.tsx"
with open(fe_path, "r", encoding="utf-8") as f:
    content = f.read()

# ===== 1. TABLAS_MANTENIMIENTO: inject FK filters for 4 tables =====
# Replace bitacora_avance entry (no FK currently)
content = content.replace(
    '{"id": "bitacora_avance", "nombre": "Avances de Bitácora", "endpoint": "/mantenimiento/bitacora_avance", "grupo": "Bitácora"},',
    '{"id": "bitacora_avance", "nombre": "Avances de Bitácora", "endpoint": "/mantenimiento/bitacora_avance", "grupo": "Bitácora", "columnasFiltroMenu": [{"columna": "fase_id", "tipo": "foreign_key", "tablaReferencia": "fase_proyecto", "columnaLabel": "nombre", "renderizado": "select"}]},'
)

# Replace municipio entry
content = content.replace(
    '{"id": "municipio", "nombre": "Municipios", "endpoint": "/mantenimiento/municipio", "grupo": "Geografía"},',
    '{"id": "municipio", "nombre": "Municipios", "endpoint": "/mantenimiento/municipio", "grupo": "Geografía", "columnasFiltroMenu": [{"columna": "departamento_id", "tipo": "foreign_key", "tablaReferencia": "departamento", "columnaLabel": "nombre", "renderizado": "select"}]},'
)

# Replace proyecto entry (has no columnasFiltroMenu now)
content = content.replace(
    '{"id": "proyecto", "nombre": "Proyectos", "endpoint": "/mantenimiento/proyecto", "grupo": "Proyectos", "relaciones": ["Fases", "Detalles", "Usuarios"]},',
    '{"id": "proyecto", "nombre": "Proyectos", "endpoint": "/mantenimiento/proyecto", "grupo": "Proyectos", "relaciones": ["Fases", "Detalles", "Usuarios"], "columnasFiltroMenu": [{"columna": "estado_id", "tipo": "foreign_key", "tablaReferencia": "catalogo_item", "columnaLabel": "etiqueta", "renderizado": "select"}]},'
)

# Replace proyecto_detalle entry
content = content.replace(
    '{"id": "proyecto_detalle", "nombre": "Detalles de Proyecto", "endpoint": "/mantenimiento/proyecto_detalle", "grupo": "Proyectos"},',
    '{"id": "proyecto_detalle", "nombre": "Detalles de Proyecto", "endpoint": "/mantenimiento/proyecto_detalle", "grupo": "Proyectos", "columnasFiltroMenu": [{"columna": "municipio_id", "tipo": "foreign_key", "tablaReferencia": "municipio", "columnaLabel": "nombre", "renderizado": "combobox"}]},'
)

# ===== 2. Remove turno from bitacora_entrada (empty opciones) =====
# Its entry currently has turno with opciones:[], publicada and bloqueada. Remove turno entry.
content = content.replace(
    '"columnasFiltroMenu": [{"columna": "turno", "tipo": "enum", "opciones": []}, {"columna": "publicada", "tipo": "boolean", "opciones": ["true", "false"]}, {"columna": "bloqueada", "tipo": "boolean", "opciones": ["true", "false"]}]',
    '"columnasFiltroMenu": [{"columna": "publicada", "tipo": "boolean", "opciones": ["true", "false"]}, {"columna": "bloqueada", "tipo": "boolean", "opciones": ["true", "false"]}]'
)

# Also remove fase_proyecto empty enum entry
content = content.replace(
    '"columnasFiltroMenu": [{"columna": "estado", "tipo": "enum", "opciones": []}]',
    ''
)

with open(fe_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Step 1 OK - TABLAS updated")

# ===== 3. Add foreignKeyOptions state + useEffect to the component =====
# Insert after the filters state line
old_state = '''  const [filters, setFilters] = useState<Record<string, string>>({})
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc'|'desc'} | null>(null)'''

new_state = '''  const [filters, setFilters] = useState<Record<string, string>>({})
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc'|'desc'} | null>(null)
  const [foreignKeyOptions, setForeignKeyOptions] = useState<Record<string, any[]>>({})'''

content = content.replace(old_state, new_state)
if "foreignKeyOptions" not in content:
    print("WARNING: foreignKeyOptions state not injected!")
else:
    print("Step 2 OK - State added")

# ===== 4. Add useEffect for FK fetch after handleTableChange effect =====
old_effect = '''  const handleTableChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const table = TABLAS_MANTENIMIENTO.find(t => t.id === e.target.value)
    if (table) {
      setSelectedTable(table)
      setGlobalFilter('')
      setFilters({})
      setSortConfig(null)
      setCurrentPage(1)
    }
  }'''

new_effect = '''  // Fetch options for foreign_key filters whenever the selected table changes
  useEffect(() => {
    const fkFiltros = selectedTable.columnasFiltroMenu?.filter((f: any) => f.tipo === 'foreign_key') || []
    if (fkFiltros.length === 0) {
      setForeignKeyOptions({})
      return
    }
    const fetchAll = async () => {
      const results: Record<string, any[]> = {}
      await Promise.all(fkFiltros.map(async (f: any) => {
        try {
          const res = await api.get(`/mantenimiento/${f.tablaReferencia}?pagina=1&limite=500`)
          if (res.data?.success) results[f.columna] = res.data.data
        } catch {
          results[f.columna] = []
        }
      }))
      setForeignKeyOptions(results)
    }
    fetchAll()
  }, [selectedTable])

  const handleTableChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const table = TABLAS_MANTENIMIENTO.find(t => t.id === e.target.value)
    if (table) {
      setSelectedTable(table)
      setGlobalFilter('')
      setFilters({})
      setSortConfig(null)
      setCurrentPage(1)
    }
  }'''

content = content.replace(old_effect, new_effect)
if "fetchAll" not in content:
    print("WARNING: FK useEffect not injected!")
else:
    print("Step 3 OK - useEffect added")

# ===== 5. Fix filter render: skip enum/fk entries with no options =====
old_map = '''                  {selectedTable.columnasFiltroMenu.map((filtro: any) => (
                    <div key={filtro.columna} className="mb-3 last:mb-0">'''
new_map = '''                  {selectedTable.columnasFiltroMenu.filter((filtro: any) =>
                    filtro.tipo === 'boolean' ||
                    filtro.tipo === 'foreign_key' ||
                    (filtro.tipo === 'enum' && filtro.opciones && filtro.opciones.length > 0)
                  ).map((filtro: any) => (
                    <div key={filtro.columna} className="mb-3 last:mb-0">'''
content = content.replace(old_map, new_map)
if "filtro.tipo === 'foreign_key'" not in content:
    print("WARNING: filter skipping not injected!")
else:
    print("Step 4 OK - empty filter skipping added")

# ===== 6. Clean up unused imports =====
content = content.replace(
    'import { useState, useEffect, useMemo } from \'react\'',
    'import { useState, useEffect } from \'react\''
)
content = content.replace(
    ', X, Check, XCircle }',
    ' }'
)

with open(fe_path, "w", encoding="utf-8") as f:
    f.write(content)
print("All done!")
