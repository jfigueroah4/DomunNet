import os

directory = r'C:\DomunNet\frontend\src'

replacements = {
    'Direccin': 'Dirección',
    'Telfono': 'Teléfono',
    'informacin': 'información',
    'Catlogo': 'Catálogo',
    'Configuracin': 'Configuración',
    'Categora': 'Categoría',
    'Rengln': 'Renglón',
    'Tcnico': 'Técnico',
    'Geogrfica': 'Geográfica',
    'Auditora': 'Auditoría',
    'Ã¡': 'á',
    'Ã©': 'é',
    'Ã­': 'í',
    'Ã³': 'ó',
    'Ãº': 'ú',
    'Ã±': 'ñ',
    'Ã ': 'Á',
    'Ã‰': 'É',
    'Ã\x8d': 'Í',
    'Ã“': 'Ó',
    'Ãš': 'Ú',
    'Ã‘': 'Ñ',
    'ǟ': 'á',
    'ǭ': 'ó'
}

for root, _, files in os.walk(directory):
    for file in files:
        if not file.endswith(('.ts', '.tsx')):
            continue
            
        path = os.path.join(root, file)
        try:
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            modified = False
            for old, new in replacements.items():
                if old in content:
                    content = content.replace(old, new)
                    modified = True
            
            if modified:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Fixed mojibake in {path}")
        except Exception as e:
            pass
            
print("Done")
