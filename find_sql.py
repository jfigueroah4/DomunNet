import os

backend_dir = 'C:/DomunNet/backend'
found = False
for root, dirs, files in os.walk(backend_dir):
    if 'node_modules' in root or '.git' in root:
        continue
    for f_name in files:
        if f_name.endswith('.sql'):
            with open(os.path.join(root, f_name), 'r', encoding='utf-8') as f:
                content = f.read()
                if 'proyecto_detalle' in content.lower():
                    print(f"Found in {os.path.join(root, f_name)}")
                    found = True
if not found:
    print("Not found in any SQL file in backend.")
