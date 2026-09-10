import { Router } from 'express'
import { actualizarProyectoControlador, cambiarEstadoControlador, crearProyectoControlador, eliminarProyectoControlador, obtenerProyectoControlador, obtenerProyectosControlador } from './proyectos.controlador'
import { autenticarSolicitud } from '@/middlewares/autenticacion.middleware'
import { requierePermisos } from '@/middlewares/permisos.middleware'

const router: Router = Router()

router.use(autenticarSolicitud)

router.get('/', requierePermisos('proyectos.read'), obtenerProyectosControlador)
router.post('/', requierePermisos('proyectos.write'), crearProyectoControlador)
router.patch('/:id/estado', requierePermisos('proyectos.write'), cambiarEstadoControlador)
router.put('/:id', requierePermisos('proyectos.write'), actualizarProyectoControlador)
router.delete('/:id', requierePermisos('proyectos.write'), eliminarProyectoControlador)
router.get('/:id', requierePermisos('proyectos.read'), obtenerProyectoControlador)

export default router

