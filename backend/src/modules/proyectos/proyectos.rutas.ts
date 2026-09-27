import { Router } from 'express'
import {
  activarReplanificacionControlador,
  actualizarProyectoControlador,
  cambiarEstadoControlador,
  crearProyectoControlador,
  eliminarProyectoControlador,
  iniciarReplanificacionControlador,
  obtenerPendientesControlador,
  obtenerProyectoControlador,
  obtenerProyectosControlador,
  procesarPendienteControlador
} from './proyectos.controlador'
import { autenticarSolicitud } from '@/middlewares/autenticacion.middleware'
import { requierePermisos } from '@/middlewares/permisos.middleware'

const router: Router = Router()

router.use(autenticarSolicitud)

router.get('/', requierePermisos('proyectos.read'), obtenerProyectosControlador)
router.post('/', requierePermisos('proyectos.write'), crearProyectoControlador)
router.patch('/:id/estado', requierePermisos('proyectos.write'), cambiarEstadoControlador)
router.post('/:id/iniciar-replanificacion', requierePermisos('proyectos.write'), iniciarReplanificacionControlador)
router.post('/:id/activar-replanificacion', requierePermisos('proyectos.write'), activarReplanificacionControlador)
router.put('/:id', requierePermisos('proyectos.write'), actualizarProyectoControlador)
router.delete('/:id', requierePermisos('proyectos.write'), eliminarProyectoControlador)
router.get('/:id/pendientes', requierePermisos('proyectos.read'), obtenerPendientesControlador)
router.post('/:proyectoId/pendientes/:id/procesar', requierePermisos('pendientes.procesar', 'proyectos.write'), procesarPendienteControlador)
router.post('/pendientes/:id/procesar', requierePermisos('pendientes.procesar', 'proyectos.write'), procesarPendienteControlador)
router.get('/:id', requierePermisos('proyectos.read'), obtenerProyectoControlador)

export default router

