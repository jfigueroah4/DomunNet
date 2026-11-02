import { clienteSupabase } from '../configuracion/cliente-supabase'
import { crearUsuario, eliminarUsuario } from '../modules/usuarios/usuarios.servicio'

async function main() {
  console.log('--- Configurando Rol y Usuario Presentador ---')

  // 1. Verificar / Crear Rol Presentador en BD
  const permisosLecturaCompleta = {
    dashboard: ['read'],
    proyectos: ['read'],
    bitacora: ['read'],
    evidencia_fotografica: ['read'],
    reportes: ['read'],
    finanzas: ['read'],
    usuarios: ['read'],
    roles: ['read'],
    configuracion: ['read'],
    mantenimiento: ['read'],
    alertas: ['read'],
  }

  const { data: rolExistente, error: errRolBusqueda } = await clienteSupabase
    .from('rol')
    .select('id, nombre_rol, permisos')
    .ilike('nombre_rol', 'Presentador')
    .maybeSingle()

  if (errRolBusqueda) {
    console.error('Error buscando rol Presentador:', errRolBusqueda.message)
  }

  let rolId = rolExistente?.id

  if (!rolExistente) {
    console.log('Rol Presentador no existe. Creándolo...')
    const { data: nuevoRol, error: errCrearRol } = await clienteSupabase
      .from('rol')
      .insert({
        nombre_rol: 'Presentador',
        descripcion: 'Acceso de solo lectura completo para presentaciones, demostraciones y auditorías. Sin permisos de modificación.',
        nivel_permisos: 30,
        permisos: permisosLecturaCompleta,
        activo: true,
      })
      .select('id, nombre_rol')
      .single()

    if (errCrearRol) {
      throw new Error(`Error creando rol Presentador: ${errCrearRol.message}`)
    }
    rolId = nuevoRol.id
    console.log('Rol Presentador creado exitosamente con ID:', rolId)
  } else {
    console.log('Rol Presentador ya existe con ID:', rolId, '. Actualizando permisos a solo lectura completa...')
    await clienteSupabase
      .from('rol')
      .update({
        descripcion: 'Acceso de solo lectura completo para presentaciones, demostraciones y auditorías. Sin permisos de modificación.',
        nivel_permisos: 30,
        permisos: permisosLecturaCompleta,
        activo: true,
      })
      .eq('id', rolId)
  }

  // 2. Definir Usuarios Presentador
  const usuariosPresentador = [
    {
      primer_nombre: 'Usuario',
      segundo_nombre: '',
      primer_apellido: 'Presentador',
      segundo_apellido: '',
      correo: 'presentador@domun.com',
      username: 'presentador',
      telefono: '50200000000',
      cargo: 'Presentador / Demo',
      rol: 'Presentador',
      estado: 'Activo' as const,
      contrasena: 'Presentador2026*',
    },
    {
      primer_nombre: 'Usuario',
      segundo_nombre: 'Demo',
      primer_apellido: 'Presentador',
      segundo_apellido: '',
      correo: 'presentador@domunnet.test',
      username: 'presentador_demo',
      telefono: '50200000001',
      cargo: 'Presentador / Demo',
      rol: 'Presentador',
      estado: 'Activo' as const,
      contrasena: 'Presentador2026*',
    },
  ]

  for (const datos of usuariosPresentador) {
    console.log(`\nProcesando usuario: ${datos.correo}...`)

    const { data: usuarioExistente } = await clienteSupabase
      .from('usuario')
      .select('id')
      .eq('correo', datos.correo)
      .maybeSingle()

    if (usuarioExistente) {
      console.log(`Usuario existente con correo ${datos.correo}. Limpiando cuenta anterior...`)
      try {
        await eliminarUsuario(usuarioExistente.id)
      } catch (errElim: any) {
        console.warn('Aviso eliminando usuario anterior:', errElim.message)
      }
    }

    // Crear usuario usando la función oficial
    try {
      const creado = await crearUsuario(datos)
      console.log(`Usuario ${datos.correo} creado exitosamente:`, {
        id: creado?.id,
        nombre: creado?.nombre,
        rol: creado?.rol,
        username: creado?.username,
      })
    } catch (errCrear: any) {
      console.error(`Error al crear usuario ${datos.correo}:`, errCrear.message)
    }
  }

  console.log('\n--- Proceso finalizado con éxito ---')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error fatal:', err)
    process.exit(1)
  })
