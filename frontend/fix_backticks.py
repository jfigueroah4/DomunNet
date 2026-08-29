import json
import sys

path = r"C:\DomunNet\frontend\src\components\pages\MantenimientoTablas.tsx"

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("className={px-3 py-1 text-[9px] transition-all rounded-md }", "className={px-3 py-1 text-[9px] transition-all rounded-md }")
content = content.replace("className={w-full text-left border-collapse min-w-[900px]}", "className={w-full text-left border-collapse min-w-[900px]}")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Listo")
