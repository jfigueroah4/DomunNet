import { Router } from 'express'
import { autenticarSolicitud } from '@/middlewares/autenticacion.middleware'
import { requierePermisos } from '@/middlewares/permisos.middleware'
import { actualizar, crear, eliminar, listar, obtener } from './entidad-contratante.controlador'

const router: Router = Router()
router.use(autenticarSolicitud, requierePermisos('proyectos', 'read'))
router.get('/', listar)
router.get('/:id', obtener)
router.post('/', crear)
router.put('/:id', actualizar)
router.delete('/:id', eliminar)
export default router
