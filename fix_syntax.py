import re
path = r"C:\DomunNet\frontend\src\components\pages\MantenimientoTablas.tsx"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("}) \n                        }}", "}) \n                        )}")
# Just a safer regex replacement
content = re.sub(r'\}\)\n\s*\}\}\n\s*<\/div>', '})\n                        }\n                      </div>', content)
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed syntax")
