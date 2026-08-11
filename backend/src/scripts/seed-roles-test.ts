import { clienteSupabase } from '../configuracion/cliente-supabase'
import { crearUsuario, eliminarUsuario } from '../modules/usuarios/usuarios.servicio'

const usuariosParaCrear = [
  {
    primer_nombre: 'Daniel',
    segundo_nombre: '',
    primer_apellido: 'Figueroa',
    segundo_apellido: '',
    correo: 'daniel.figueroa@domunnet.test',
    telefono: '12345678',
    rol: 'Administrador',
    estado: 'Activo' as const,
    contrasena: 'mariobros25',
  },
  {
    primer_nombre: 'Jorge',
    primer_apellido: 'Figueroa',
    correo: 'jorge.figueroa@domunnet.test',
    telefono: '12345678',
    rol: 'Gerencia',
    estado: 'Activo' as const,
    contrasena: 'mariobros25',
  },
  {
    primer_nombre: 'Raul',
    primer_apellido: 'Alvarado',
    correo: 'raul.alvarado@domunnet.test',
    telefono: '12345678',
    rol: 'IngenieroResidente',
    estado: 'Activo' as const,
    contrasena: 'mariobros25',
  },
  {
    primer_nombre: 'Camila',
    primer_apellido: 'Figueroa',
    correo: 'camila.figueroa@domunnet.test',
    telefono: '12345678',
    rol: 'Laboratorista',
    estado: 'Activo' as const,
    contrasena: 'mariobros25',
  },
  {
    primer_nombre: 'Mario',
    primer_apellido: 'Tzul',
    correo: 'mario.tzul@domunnet.test',
    telefono: '12345678',
    rol: 'AuxiliarDeCampo',
    estado: 'Activo' as const,
    contrasena: 'mariobros25',
  },
  {
    primer_nombre: 'Paola',
    primer_apellido: 'Recinos',
    correo: 'paola.recinos@domunnet.test',
    telefono: '12345678',
    rol: 'Contratante',
    estado: 'Activo' as const,
    contrasena: 'mariobros25',
  },
]

async function main() {
  const { entorno } = require('../configuracion/entorno')
  console.log('DIAGNÓSTICO SUPABASE:')
  console.log('URL:', entorno.supabaseUrl)
  console.log('Key length:', entorno.supabaseServiceRoleKey ? entorno.supabaseServiceRoleKey.length : 0)
  console.log('Key prefix:', entorno.supabaseServiceRoleKey ? entorno.supabaseServiceRoleKey.substring(0, 15) : 'N/A')

  console.log('Iniciando seed de usuarios de prueba...')
  const resultados = []

  for (const datos of usuariosParaCrear) {
    try {
      // 1. Limpieza si ya existe
      const { data: usuarioExistente } = await clienteSupabase
        .from('usuario')
        .select('id')
        .eq('correo', datos.correo)
        .maybeSingle()

      if (usuarioExistente) {
        console.log(`Usuario existente encontrado para ${datos.correo}, eliminando...`)
        await eliminarUsuario(usuarioExistente.id)
      }

      // 2. Crear usuario usando el flujo real
      console.log(`Creando usuario ${datos.primer_nombre} ${datos.primer_apellido} (${datos.rol})...`)
      const usuarioCreado = await crearUsuario(datos)
      
      if (usuarioCreado) {
        resultados.push({
          rol: datos.rol,
          nombreCompleto: usuarioCreado.nombre,
          correo: usuarioCreado.correo,
          username: usuarioCreado.username,
          estado: 'Creado Exitosamente',
        })
      }
    } catch (error: any) {
      console.error(`Error procesando usuario ${datos.correo}:`, error.message)
      resultados.push({
        rol: datos.rol,
        nombreCompleto: `${datos.primer_nombre} ${datos.primer_apellido}`,
        correo: datos.correo,
        username: 'ERROR',
        estado: `Fallido: ${error.message}`,
      })
    }
  }

  console.log('\n--- RESULTADOS DE CREACIÓN DE USUARIOS ---')
  console.log(JSON.stringify(resultados, null, 2))
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error fatal en el seed:', err)
    process.exit(1)
  })
