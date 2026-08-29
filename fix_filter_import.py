import re
path = r"C:\DomunNet\frontend\src\components\pages\MantenimientoTablas.tsx"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Just inject Filter directly if not present
if "import { Search," in content and "Filter" not in content.split("import { Search,")[1].split("}")[0]:
    content = content.replace("import { Search,", "import { Search, Filter,")
elif "import { Plus," in content and "Filter" not in content.split("import { Plus,")[1].split("}")[0]:
    content = content.replace("import { Plus,", "import { Plus, Filter,")
elif "Filter" not in content:
    content = content.replace("import {", "import { Filter,", 1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed Filter import")
