import re
import codecs

with codecs.open('new_mapa.txt', 'r', 'utf-8') as f:
    new_mapa = f.read()

with codecs.open('C:/DomunNet/frontend/src/components/modules/proyectos/ProyectoFormulario.tsx', 'r', 'utf-8') as f:
    content = f.read()

# Replace the component using regex
# Look for unction SelectorMapaInteractivo({ ... }) { ... return (...) }
pattern = re.compile(r'function SelectorMapaInteractivo\(\{[\s\S]*?return \([\s\S]*?\n  \)\n\}', re.MULTILINE)
content = pattern.sub(new_mapa, content)

# Remove the broken p-two-point-five which I messed up with base64 decoding if any... 
# wait, the base64 string had p-two-point-five? 
# Ah, I replaced p-2.5 with p-two-point-five manually or accidentally? No, wait, let me check the base64. 
# It says p-two-point-five in my previous string?! No, let me replace it in python to be safe.
content = content.replace('p-two-point-five ', 'p-2.5 ')

with codecs.open('C:/DomunNet/frontend/src/components/modules/proyectos/ProyectoFormulario.tsx', 'w', 'utf-8') as f:
    f.write(content)
