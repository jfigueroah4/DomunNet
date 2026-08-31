const fs = require('fs');
let file = fs.readFileSync('C:/DomunNet/frontend/src/app/dashboard/proyectos/empresas/page.tsx', 'utf8');

const replacement = `onConfirm={async (accion) => {
          if (empresaEliminar) {
            try {
              if (accion === 'suspender') {
                await api.put(\`/empresas/\${empresaEliminar.id}\`, { ...empresaEliminar, activo: false, nombre_empresa: empresaEliminar.nombre })
                showSuccessToast('Empresa inactivada temporalmente')
              } else if (accion === 'activar') {
                await api.put(\`/empresas/\${empresaEliminar.id}\`, { ...empresaEliminar, activo: true, nombre_empresa: empresaEliminar.nombre })
                showSuccessToast('Empresa activada exitosamente')
              } else if (accion === 'eliminar') {
                await api.delete(\`/empresas/\${empresaEliminar.id}\`)
                showSuccessToast('Empresa y usuario vinculados eliminados definitivamente')
              }
              await fetchEmpresas()
            } catch (e: any) {
              showErrorToast(e.response?.data?.error || e.message || 'Error al procesar la acción')
            }
          }
          setDeleteOpen(false)
          setEmpresaEliminar(undefined)
        }}`;

file = file.replace(/onConfirm=\{async \(\) => \{[\s\S]*?setEmpresaEliminar\(undefined\)\s*\}\}/, replacement);

fs.writeFileSync('C:/DomunNet/frontend/src/app/dashboard/proyectos/empresas/page.tsx', file, 'utf8');
