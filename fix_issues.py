import os
import re

# 1. Update mantenimiento.servicio.ts
svc_path = r"C:\DomunNet\backend\src\modules\mantenimiento\mantenimiento.servicio.ts"
with open(svc_path, "r", encoding="utf-8") as f:
    svc = f.read()

old_val = """  // Validar filtros contra whitelist
  for (const [key, value] of Object.entries(filtros)) {
    if (config.columnasFiltroOrden.includes(key) && value !== undefined && value !== null && value !== '') {
      query = query.eq(key, value);
    }
  }"""

new_val = """  // Validar filtros contra whitelist de menú
  for (const [key, value] of Object.entries(filtros)) {
    const isFilterAllowed = config.columnasFiltroMenu?.some(f => f.columna === key);
    if (isFilterAllowed && value !== undefined && value !== null && value !== '') {
      query = query.eq(key, value);
    }
  }"""

svc = svc.replace(old_val, new_val)
with open(svc_path, "w", encoding="utf-8") as f:
    f.write(svc)


# 2. Update faked enums in backend models
models_dir = r"C:\DomunNet\backend\src\modules\mantenimiento\models"
# We know dato_usuario has 'Activo', others are empty.
for file in os.listdir(models_dir):
    if not file.endswith(".model.ts"): continue
    path = os.path.join(models_dir, file)
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    
    if file == "dato_usuario.model.ts":
        content = re.sub(r'opciones: \[[^\]]+\]', r"opciones: ['Activo']", content)
    else:
        # For phase_proyecto, bitacora_entrada etc., replacing any fake enum options with []
        content = re.sub(r'tipo: \'enum\',\s*opciones: \[[^\]]+\]', r"tipo: 'enum',\n      opciones: []", content)
    
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

# 3. Update Frontend constants (just replacing the hardcoded enum lists)
fe_path = r"C:\DomunNet\frontend\src\components\pages\MantenimientoTablas.tsx"
with open(fe_path, "r", encoding="utf-8") as f:
    fe = f.read()

# Instead of complex parsing, just replace the fake arrays in the string
fe = fe.replace("'Activo', 'Inactivo', 'Suspendido', 'Borrador', 'Finalizado', 'Aprobado', 'Rechazado'", "'Activo'")
fe = fe.replace("'SQL', 'ZIP', 'PDF', 'CSV'", "")
fe = fe.replace("'Mañana', 'Tarde', 'Noche'", "")

with open(fe_path, "w", encoding="utf-8") as f:
    f.write(fe)

print("Fixed service whitelist and enums.")
