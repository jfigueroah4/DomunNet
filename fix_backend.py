import sys

path = r"C:\DomunNet\backend\src\modules\mantenimiento\mantenimiento.service.ts"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace listarRegistros
old_listar = """    const { data, error, count } = await query
  
    if (error) throw new Error(Error al listar : )
    return { data, total: count || 0 }
  }"""

new_listar = """    const { data, error, count } = await query
  
    if (error) throw new Error(Error al listar : )

    // Agrega dependenciasCount de forma eficiente
    if (data && data.length > 0) {
      const depMap: Record<string, { tablaDep: string, fk: string }> = {
        catalogo: { tablaDep: 'catalogo_item', fk: 'catalogo_id' },
        proyecto: { tablaDep: 'fase_proyecto', fk: 'proyecto_id' },
        departamento: { tablaDep: 'municipio', fk: 'departamento_id' },
        rol: { tablaDep: 'usuarios', fk: 'rol_id' },
        roles: { tablaDep: 'usuarios', fk: 'rol_id' }
      }

      const dep = depMap[tabla]
      if (dep) {
        const ids = data.map((r: any) => r.id).filter(Boolean)
        const { data: depsData, error: depsError } = await clienteSupabase
          .from(dep.tablaDep)
          .select(dep.fk)
          .in(dep.fk, ids)
          
        if (!depsError && depsData) {
          const counts: Record<string, number> = {}
          depsData.forEach((d: any) => {
            const fkVal = d[dep.fk]
            counts[fkVal] = (counts[fkVal] || 0) + 1
          })
          data.forEach((r: any) => {
            r.dependenciasCount = counts[r.id] || 0
          })
        } else {
          data.forEach((r: any) => { r.dependenciasCount = 0 })
        }
      } else {
        data.forEach((r: any) => { r.dependenciasCount = 0 })
      }
    }

    return { data, total: count || 0 }
  }"""

content = content.replace(old_listar, new_listar)

# Replace chequearDependenciasFK
old_check = """    if (tabla === 'departamento') {
      const { count } = await clienteSupabase.from('municipio').select('id', { count: 'exact' }).eq('departamento_id', id)
      if (count && count > 0) throw new PostgresError(Existen  municipios asociados a este departamento, 409, 'FK_VIOLATION')
    }
  }"""

new_check = """    if (tabla === 'departamento') {
      const { count } = await clienteSupabase.from('municipio').select('id', { count: 'exact' }).eq('departamento_id', id)
      if (count && count > 0) throw new PostgresError(Existen  municipios asociados a este departamento, 409, 'FK_VIOLATION')
    }
    if (tabla === 'rol' || tabla === 'roles') {
      const { count } = await clienteSupabase.from('usuarios').select('id', { count: 'exact' }).eq('rol_id', id)
      if (count && count > 0) throw new PostgresError(Existen  usuarios asociados a este rol. No se puede eliminar., 409, 'FK_VIOLATION')
    }
  }"""

content = content.replace(old_check, new_check)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
