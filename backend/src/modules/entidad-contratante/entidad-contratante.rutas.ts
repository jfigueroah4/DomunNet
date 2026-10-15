import { Router } from 'express'
import { autenticarSolicitud } from '@/middlewares/autenticacion.middleware'
import { requierePermisos } from '@/middlewares/permisos.middleware'
import {
  actualizar,
  actualizarContactoCtrl,
  crear,
  crearContacto,
  eliminar,
  eliminarContactoCtrl,
  listar,
  listarContactos,
  listarProyectos,
  obtener
} from './entidad-contratante.controlador'

const router: Router = Router()
router.use(autenticarSolicitud, requierePermisos('proyectos', 'read'))
router.get('/', listar)
router.get('/:id/proyectos', listarProyectos)
router.get('/:id', obtener)
router.post('/', crear)
router.put('/:id', actualizar)
router.delete('/:id', eliminar)

// Contactos específicos
router.get('/:id/contactos', listarContactos)
router.post('/:id/contactos', crearContacto)
router.put('/:id/contactos/:contactoId', actualizarContactoCtrl)
router.delete('/:id/contactos/:contactoId', eliminarContactoCtrl)

export default router
