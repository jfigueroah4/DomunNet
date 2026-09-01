import re

with open('C:/DomunNet/frontend/src/components/modules/proyectos/ProyectoFormulario.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. ADD ICONS TO LUCIDE-REACT IMPORT
# Just ensure Map, Satellite, Route are imported
content = re.sub(r'import \{\s*Combobox', 'import { Map, Satellite, Route } from \'lucide-react\'\nimport { Combobox', content)

# 2. MODIFY SelectorMapaInteractivo to accept searchContext and add Nominatim Logic
# We'll replace the whole function SelectorMapaInteractivo.
regex_mapa = re.compile(r'// Selector de mapa interactivo estilo Google Maps\nfunction SelectorMapaInteractivo.*?(?=\n    <div className="space-y-3">\n)', re.DOTALL)

# But wait, it's safer to just replace the whole file from start to finish via a robust script or small chunks.
