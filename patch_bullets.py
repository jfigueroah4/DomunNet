import re

with open('C:/DomunNet/frontend/src/components/modules/proyectos/ProyectoFormulario.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('â€¢', '•')
content = content.replace('â€”', '—')

with open('C:/DomunNet/frontend/src/components/modules/proyectos/ProyectoFormulario.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
