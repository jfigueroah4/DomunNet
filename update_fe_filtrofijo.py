import re

fe_path = r"C:\DomunNet\frontend\src\components\pages\MantenimientoTablas.tsx"
with open(fe_path, "r", encoding="utf-8") as f:
    content = f.read()

# === 1. Remove bitacora_avance FK entry from TABLAS_MANTENIMIENTO ===
old_ba = '{"id": "bitacora_avance", "nombre": "Avances de Bit\u00e1cora", "endpoint": "/mantenimiento/bitacora_avance", "grupo": "Bit\u00e1cora", "columnasFiltroMenu": [{"columna": "fase_id", "tipo": "foreign_key", "tablaReferencia": "fase_proyecto", "columnaLabel": "nombre", "renderizado": "select"}]},'
new_ba = '{"id": "bitacora_avance", "nombre": "Avances de Bit\u00e1cora", "endpoint": "/mantenimiento/bitacora_avance", "grupo": "Bit\u00e1cora"},'
content = content.replace(old_ba, new_ba)
print("Step 1:", "OK - bitacora_avance cleaned" if old_ba not in content else "WARNING - not found")

# === 2. Update proyecto entry to include filtroFijo ===
old_proy = '{"id": "proyecto", "nombre": "Proyectos", "endpoint": "/mantenimiento/proyecto", "grupo": "Proyectos", "relaciones": ["Fases", "Detalles", "Usuarios"], "columnasFiltroMenu": [{"columna": "estado_id", "tipo": "foreign_key", "tablaReferencia": "catalogo_item", "columnaLabel": "etiqueta", "renderizado": "select"}]},'
new_proy = '{"id": "proyecto", "nombre": "Proyectos", "endpoint": "/mantenimiento/proyecto", "grupo": "Proyectos", "relaciones": ["Fases", "Detalles", "Usuarios"], "columnasFiltroMenu": [{"columna": "estado_id", "tipo": "foreign_key", "tablaReferencia": "catalogo_item", "columnaLabel": "nombre", "renderizado": "select", "filtroFijo": {"catalogo_id": "aa548cb3-8382-4a62-8b90-1185b2418326"}}]},'
content = content.replace(old_proy, new_proy)
print("Step 2:", "OK - proyecto updated with filtroFijo" if "filtroFijo" in content else "WARNING - filtroFijo not injected")

# === 3. Update useEffect to include filtroFijo in the fetch URL ===
old_fetch = "          const res = await api.get(`/mantenimiento/${f.tablaReferencia}?pagina=1&limite=500`)"
new_fetch = """          const extraParams = f.filtroFijo ? '&' + new URLSearchParams(f.filtroFijo).toString() : ''
          const res = await api.get(`/mantenimiento/${f.tablaReferencia}?pagina=1&limite=500${extraParams}`)"""
content = content.replace(old_fetch, new_fetch)
print("Step 3:", "OK - filtroFijo included in fetch" if "extraParams" in content else "WARNING - fetch not updated")

with open(fe_path, "w", encoding="utf-8") as f:
    f.write(content)

print("\nAll steps done.")
