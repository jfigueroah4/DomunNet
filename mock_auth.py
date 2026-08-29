import re

path = r"C:\DomunNet\backend\src\modules\mantenimiento\mantenimiento.controller.ts"

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_validar = """function validarAccesoTabla(tabla: string, req: SolicitudAutenticada) {
    const config = tablasPermitidas[tabla]"""

new_validar = """function validarAccesoTabla(tabla: string, req: SolicitudAutenticada) {
    // MOCK PARA PRUEBAS LOCALS:
    if (!req.usuario) {
        req.usuario = { id: 'admin', rol: 'Administrador', permisos: [], email: 'admin@test.com' } as any;
    }
    const config = tablasPermitidas[tabla]"""

content = content.replace(old_validar, new_validar)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Mocked req.usuario")
