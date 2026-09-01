import re

with open('C:/DomunNet/frontend/src/components/modules/proyectos/ProyectoFormulario.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('import {', 'import { Map, Satellite, MapPin, Route, ', 1)

with open('C:/DomunNet/frontend/src/components/modules/proyectos/ProyectoFormulario.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
