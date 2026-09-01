import re

with open('C:/DomunNet/frontend/src/app/dashboard/proyectos/empresas/page.tsx', 'r', encoding='utf-8') as f:
    c1 = f.read()
c1 = re.sub(r',\s*useCallback', '', c1)
c1 = re.sub(r'useCallback,\s*', '', c1)
with open('C:/DomunNet/frontend/src/app/dashboard/proyectos/empresas/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c1)

with open('C:/DomunNet/frontend/src/components/modules/empresas/EmpresaProyectosModal.tsx', 'r', encoding='utf-8') as f:
    c2 = f.read()
c2 = re.sub(r',\s*Search', '', c2)
c2 = re.sub(r'Search,\s*', '', c2)
with open('C:/DomunNet/frontend/src/components/modules/empresas/EmpresaProyectosModal.tsx', 'w', encoding='utf-8') as f:
    f.write(c2)
