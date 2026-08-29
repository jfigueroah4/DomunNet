import re

path = r"C:\DomunNet\frontend\src\components\pages\MantenimientoTablas.tsx"

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_fetch = """      const res = await api.get(`${selectedTable.endpoint}?${params.toString()}`)"""
new_fetch = """      const baseUrl = selectedTable.esAuditoria ? '/auditoria' : '/mantenimiento'
      const endpoint = selectedTable.endpoint.replace('/mantenimiento', baseUrl)
      const res = await api.get(`${endpoint}?${params.toString()}`)"""

content = content.replace(old_fetch, new_fetch)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated frontend")
