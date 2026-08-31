import { Router } from 'express'
import { cambiarEstadoControlador, crearProyectoControlador } from './proyectos.controlador'
import { autenticarSolicitud } from '@/middlewares/autenticacion.middleware'
import { requierePermisos } from '@/middlewares/permisos.middleware'

const router: Router = Router()

router.use(autenticarSolicitud)


// Requiere explícitamente 
router.patch('/:id/estado', requierePermisos('proyectos.write'), cambiarEstadoControlador)

export default router


router.post('/', requierePermisos('proyectos.write'), crearProyectoControlador)

