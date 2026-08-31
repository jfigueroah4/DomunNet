import { Router } from 'express'
import { autenticarSolicitud } from '@/middlewares/autenticacion.middleware'
import { requierePermisos } from '@/middlewares/permisos.middleware'
import {
  actualizarUsuarioControlador,
  crearUsuarioControlador,
  eliminarUsuarioControlador,
  listarUsuariosControlador,
  obtenerUsuarioControlador,
  validarUsernameControlador,
  validarCorreoControlador,
} from '@/modules/usuarios/usuarios.controlador'

const router = Router()

router.get('/', autenticarSolicitud, requierePermisos('usuarios.read'), listarUsuariosControlador)
router.get('/validar-correo', autenticarSolicitud, requierePermisos('usuarios.read'), validarCorreoControlador)
router.get('/validar-username', autenticarSolicitud, requierePermisos('usuarios.read'), validarUsernameControlador)
router.get('/:id', autenticarSolicitud, requierePermisos('usuarios.read'), obtenerUsuarioControlador)
router.post('/', autenticarSolicitud, requierePermisos('usuarios.write'), crearUsuarioControlador)
router.put('/:id', autenticarSolicitud, requierePermisos('usuarios.write'), actualizarUsuarioControlador)
router.delete('/:id', autenticarSolicitud, requierePermisos('usuarios.write'), eliminarUsuarioControlador)

export const usuariosRutas: Router = router
