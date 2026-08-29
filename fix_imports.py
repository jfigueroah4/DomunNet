import re

path = r"C:\DomunNet\frontend\src\components\modules\proyectos\ProyectosView.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()
content = re.sub(r'Search,\s*', '', content)
with open(path, "w", encoding="utf-8") as f:
    f.write(content)

path2 = r"C:\DomunNet\frontend\src\components\modules\proyectos\ProyectoTimeline.tsx"
with open(path2, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("import { Fragment, useState, useMemo } from 'react'", "import { useState, useMemo } from 'react'")
with open(path2, "w", encoding="utf-8") as f:
    f.write(content)

print("Imports cleaned")
