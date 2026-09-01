import re

with open('C:/DomunNet/frontend/src/components/modules/proyectos/ProyectoFormulario.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the react import
content = content.replace("import { Map, Satellite, Route, MapPin, Loader2, Map, Satellite, MapPin, Route,  useState, useMemo } from 'react'", "import { useState, useMemo, useEffect } from 'react'")

# Add the lucide-react imports properly to the main block
# Find: import {
#   ArrowLeft, ...
regex_lucide = re.compile(r'import \{\n  ArrowLeft,')
content = regex_lucide.sub('import {\\n  Map, Satellite, Route, MapPin, Loader2,\\n  ArrowLeft,', content)

with open('C:/DomunNet/frontend/src/components/modules/proyectos/ProyectoFormulario.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
