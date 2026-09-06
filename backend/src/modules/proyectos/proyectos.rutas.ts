import { Router } from 'express'
import { actualizarProyectoControlador, cambiarEstadoControlador, crearProyectoControlador, obtenerProyectoControlador } from './proyectos.controlador'
import { autenticarSolicitud } from '@/middlewares/autenticacion.middleware'
import { requierePermisos } from '@/middlewares/permisos.middleware'

const router: Router = Router()

router.use(autenticarSolicitud)


// Requiere explícitamente 
router.patch('/:id/estado', requierePermisos('proyectos.write'), cambiarEstadoControlador)
router.put('/:id', requierePermisos('proyectos.write'), actualizarProyectoControlador)
router.get('/:id', requierePermisos('proyectos.read'), obtenerProyectoControlador)

export default router


router.post('/', requierePermisos('proyectos.write'), crearProyectoControlador)

