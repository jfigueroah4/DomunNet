import codecs
with codecs.open('C:/DomunNet/frontend/src/components/modules/empresas/EmpresaProyectosModal.tsx', 'r', 'utf-8') as f:
    content = f.read()
content = content.replace('Search, FileSpreadsheet', 'FileSpreadsheet')
with codecs.open('C:/DomunNet/frontend/src/components/modules/empresas/EmpresaProyectosModal.tsx', 'w', 'utf-8') as f:
    f.write(content)
