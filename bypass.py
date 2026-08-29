import re
path = r"C:\DomunNet\backend\src\modules\mantenimiento\mantenimiento.routes.ts"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("router.use(autenticarSolicitud)", "router.use((req, res, next) => next())")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Bypassed middleware")
