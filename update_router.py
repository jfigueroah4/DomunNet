import re

path = r"C:\DomunNet\backend\src\index.ts"

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "import { mantenimientoRutas } from '@/modules/mantenimiento/mantenimiento.routes'",
    "import { mantenimientoRutas } from '@/modules/mantenimiento/mantenimiento.rutas'\nimport { auditoriaRutas } from '@/modules/auditoria/auditoria.rutas'"
)

content = content.replace(
    "app.use('/api/v1/mantenimiento', mantenimientoRutas)",
    "app.use('/api/v1/mantenimiento', mantenimientoRutas)\napp.use('/api/v1/auditoria', auditoriaRutas)"
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated index.ts")
