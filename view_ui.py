path = r"C:\DomunNet\frontend\src\components\pages\MantenimientoTablas.tsx"
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if "columnasFiltroMenu.map" in line:
        for j in range(max(0, i-10), min(len(lines), i+30)):
            print(f"{j+1}: {lines[j].strip('\n')}")
        break
