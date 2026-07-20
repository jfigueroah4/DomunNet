import { Router } from 'express'
import { autenticarSolicitud } from '@/middlewares/autenticacion.middleware'
import { requierePermisos } from '@/middlewares/permisos.middleware'
import {
  actualizarConfiguracionGeneralControlador,
  actualizarNotificacionesControlador,
  obtenerConfiguracionGeneralControlador,
  obtenerNotificacionesControlador,
} from '@/modules/configuracion/configuracion.controlador'

const router = Router()

router.get('/general', autenticarSolicitud, requierePermisos('configuracion.read'), obtenerConfiguracionGeneralControlador)
router.put('/general', autenticarSolicitud, requierePermisos('configuracion.write'), actualizarConfiguracionGeneralControlador)
router.get('/notificaciones', autenticarSolicitud, requierePermisos('configuracion.read'), obtenerNotificacionesControlador)
router.put('/notificaciones', autenticarSolicitud, requierePermisos('configuracion.write'), actualizarNotificacionesControlador)

export const configuracionRutas: Router = router
