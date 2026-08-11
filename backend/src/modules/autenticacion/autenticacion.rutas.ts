import { Router } from 'express'
import { autenticarSolicitud } from '@/middlewares/autenticacion.middleware'
import {
  obtenerPerfilControlador,
  iniciarSesionControlador,
  cerrarSesionControlador,
} from '@/modules/autenticacion/autenticacion.controlador'

const router = Router()

router.post('/iniciar-sesion', iniciarSesionControlador)
router.post('/cerrar-sesion', cerrarSesionControlador)
router.post('/logout', cerrarSesionControlador)
router.get('/perfil', autenticarSolicitud, obtenerPerfilControlador)

export const autenticacionRutas: Router = router
