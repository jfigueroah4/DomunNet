import codecs
with codecs.open('C:/DomunNet/frontend/src/app/dashboard/proyectos/empresas/page.tsx', 'r', 'utf-8') as f:
    content = f.read()
content = content.replace('useEffect, useCallback', 'useEffect')
with codecs.open('C:/DomunNet/frontend/src/app/dashboard/proyectos/empresas/page.tsx', 'w', 'utf-8') as f:
    f.write(content)
