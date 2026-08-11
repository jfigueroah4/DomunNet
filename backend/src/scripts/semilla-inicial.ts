import { clienteSupabase } from '../configuracion/cliente-supabase'

type RolSemilla = {
  nombre_rol: string
  descripcion: string
  nivel: number
}

type UsuarioSemilla = {
  nombre: string
  apellido: string
  correo: string
  telefono: string
  cargo: string
  direccion: string
  rol: string
  password: string
}

const rolesIniciales: RolSemilla[] = [
  {
    nombre_rol: 'Administrador',
    descripcion: 'Acceso total al sistema',
    nivel: 100,
  },
  {
    nombre_rol: 'Supervisor',
    descripcion: 'Supervisión operativa y seguimiento',
    nivel: 80,
  },
  {
    nombre_rol: 'Inspector',
    descripcion: 'Inspección técnica y evidencias',
    nivel: 70,
  },
  {
    nombre_rol: 'Campo',
    descripcion: 'Registro operativo en campo',
    nivel: 60,
  },
  {
    nombre_rol: 'Contratista',
    descripcion: 'Ejecución y soporte de obra',
    nivel: 60,
  },
  {
    nombre_rol: 'Gerencia',
    descripcion: 'Visión ejecutiva y seguimiento',
    nivel: 90,
  },
  {
    nombre_rol: 'Contratante',
    descripcion: 'Consulta de avances y aprobaciones',
    nivel: 50,
  },
  {
    nombre_rol: 'Proveedor',
    descripcion: 'Consulta de suministros y entregas',
    nivel: 40,
  },
]

const usuariosIniciales: UsuarioSemilla[] = [
  {
    nombre: 'Natalia',
    apellido: 'Aguilar',
    correo: 'natalia.aguilar@gmail.com',
    telefono: '2310-1401',
    cargo: 'Administración',
    direccion: 'Ciudad de Guatemala',
    rol: 'Administrador',
    password: 'Admin123*',
  },
  {
    nombre: 'Marco',
    apellido: 'Estrada',
    correo: 'marco.estrada@outlook.com',
    telefono: '2310-1402',
    cargo: 'Proyectos',
    direccion: 'Mixco',
    rol: 'Supervisor',
    password: 'Supervisor123*',
  },
  {
    nombre: 'Valeria',
    apellido: 'Cifuentes',
    correo: 'valeria.cifuentes@gmail.com',
    telefono: '2310-1403',
    cargo: 'Inspección',
    direccion: 'Villa Nueva',
    rol: 'Inspector',
    password: 'Inspector123*',
  },
  {
    nombre: 'Luis',
    apellido: 'Arriaga',
    correo: 'luis.arriaga@outlook.com',
    telefono: '2310-1404',
    cargo: 'Campo',
    direccion: 'Amatitlán',
    rol: 'Campo',
    password: 'Campo123*',
  },
  {
    nombre: 'Andrés',
    apellido: 'Lemus',
    correo: 'andres.lemus@gmail.com',
    telefono: '2310-1405',
    cargo: 'Contratista',
    direccion: 'Guatemala',
    rol: 'Contratista',
    password: 'Contratista123*',
  },
  {
    nombre: 'Paola',
    apellido: 'Barrios',
    correo: 'paola.barrios@gmail.com',
    telefono: '2310-1406',
    cargo: 'Gerencia',
    direccion: 'Antigua Guatemala',
    rol: 'Gerencia',
    password: 'Gerencia123*',
  },
  {
    nombre: 'Sofía',
    apellido: 'Montenegro',
    correo: 'sofia.montenegro@gmail.com',
    telefono: '2310-1407',
    cargo: 'Contratante',
    direccion: 'San José Pinula',
    rol: 'Contratante',
    password: 'Contratante123*',
  },
  {
    nombre: 'Claudia',
    apellido: 'Rosales',
    correo: 'claudia.rosales@gmail.com',
    telefono: '2310-1408',
    cargo: 'Proveedor',
    direccion: 'Santa Catarina Pinula',
    rol: 'Proveedor',
    password: 'Proveedor123*',
  },
]

async function obtenerOCrearAuthUser(email: string, password: string, metadata: Record<string, string>) {
  const { data: listadoUsuarios, error: errorListado } = await clienteSupabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })

  if (errorListado) {
    throw new Error(`Error listando usuarios Auth: ${errorListado.message}`)
  }

  const existente = listadoUsuarios.users.find((usuario) => (usuario.email || '').toLowerCase() === email.toLowerCase())

  if (existente) {
    const { data, error } = await clienteSupabase.auth.admin.updateUserById(existente.id, {
      email,
      password,
      email_confirm: true,
      user_metadata: metadata,
    })

    if (error) {
      throw new Error(`Error actualizando usuario Auth ${email}: ${error.message}`)
    }

    return data.user
  }

  const { data, error } = await clienteSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  })

  if (error || !data.user) {
    throw new Error(`Error creando usuario Auth ${email}: ${error?.message || 'respuesta vacía'}`)
  }

  return data.user
}

async function obtenerRolId(nombreRol: string) {
  const { data, error } = await clienteSupabase
    .from('rol')
    .upsert(
      {
        nombre_rol: nombreRol,
        nivel_permisos: rolesIniciales.find((rol) => rol.nombre_rol === nombreRol)?.nivel || 0,
        permisos: {},
        activo: true,
      },
      { onConflict: 'nombre_rol' }
    )
    .select('id, nombre_rol')
    .single()

  if (error || !data) {
    throw new Error(`Error guardando rol ${nombreRol}: ${error?.message || 'respuesta vacía'}`)
  }

  return data.id as string
}

async function sincronizarUsuario(usuario: UsuarioSemilla, rolId: string, authUserId: string) {
  const { data: usuarioGuardado, error: errorUsuario } = await clienteSupabase
    .from('usuario')
    .upsert(
      {
        auth_user_id: authUserId,
        correo: usuario.correo,
        rol_id: rolId,
        activo: true,
      },
      { onConflict: 'correo' }
    )
    .select('id')
    .single()

  if (errorUsuario || !usuarioGuardado) {
    throw new Error(`Error guardando usuario ${usuario.correo}: ${errorUsuario?.message || 'respuesta vacía'}`)
  }

  const partesNombre = `${usuario.nombre} ${usuario.apellido}`.trim().split(/\s+/)
  const nombre = partesNombre[0] || usuario.nombre
  const apellido = partesNombre.slice(1).join(' ') || usuario.apellido

  const { error: errorDato } = await clienteSupabase
    .from('dato_usuario')
    .upsert(
      {
        usuario_id: usuarioGuardado.id,
        primer_nombre: nombre,
        segundo_nombre: partesNombre.length > 2 ? partesNombre.slice(1, -1).join(' ') : null,
        primer_apellido: apellido,
        segundo_apellido: null,
        telefono: usuario.telefono,
        direccion: usuario.direccion,
      },
      { onConflict: 'usuario_id' }
    )

  if (errorDato) {
    throw new Error(`Error guardando dato_usuario ${usuario.correo}: ${errorDato.message}`)
  }
}

async function main() {
  for (const rol of rolesIniciales) {
    await obtenerRolId(rol.nombre_rol)
  }

  for (const usuario of usuariosIniciales) {
    const rolId = await obtenerRolId(usuario.rol)
    const authUser = await obtenerOCrearAuthUser(usuario.correo, usuario.password, {
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      telefono: usuario.telefono,
      cargo: usuario.cargo,
      rol: usuario.rol,
    })

    await sincronizarUsuario(usuario, rolId, authUser.id)
  }

  console.log('Semilla inicial aplicada correctamente con usuarios por rol')
}

main().catch((error) => {
  console.error('Error aplicando la semilla inicial')
  console.error(error)
  process.exit(1)
})
