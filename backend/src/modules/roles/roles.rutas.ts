import { Router } from 'express'
import { autenticarSolicitud } from '@/middlewares/autenticacion.middleware'
import { requierePermisos } from '@/middlewares/permisos.middleware'
import {
  actualizarRolControlador,
  asignarUsuariosRolControlador,
  crearRolControlador,
  eliminarRolControlador,
  listarRolesControlador,
  obtenerRolControlador,
} from '@/modules/roles/roles.controlador'

const router = Router()

router.get('/', autenticarSolicitud, requierePermisos('roles.read'), listarRolesControlador)
router.get('/:id', autenticarSolicitud, requierePermisos('roles.read'), obtenerRolControlador)
router.post('/', autenticarSolicitud, requierePermisos('roles.write'), crearRolControlador)
router.put('/:id', autenticarSolicitud, requierePermisos('roles.write'), actualizarRolControlador)
router.patch('/:id/usuarios', autenticarSolicitud, requierePermisos('roles.write'), asignarUsuariosRolControlador)
router.delete('/:id', autenticarSolicitud, requierePermisos('roles.write'), eliminarRolControlador)

export const rolesRutas: Router = router
