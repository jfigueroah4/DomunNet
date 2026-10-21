import { Router } from 'express';
import { autenticarSolicitud } from '@/middlewares/autenticacion.middleware';
import { requierePermisos } from '@/middlewares/permisos.middleware';
import {
  getEmpresasControlador,
  getEmpresaControlador,
  createEmpresaControlador,
  deleteEmpresaControlador,
  updateEmpresaControlador,
  listarContactosEmpresaControlador,
  crearContactoEmpresaControlador,
  actualizarContactoEmpresaControlador,
  eliminarContactoEmpresaControlador,
  listarProyectosEmpresaControlador,
} from './empresas.controlador';

const router: Router = Router();

router.use(autenticarSolicitud, requierePermisos('proyectos', 'read'));

router.get('/', getEmpresasControlador);
router.get('/:id/proyectos', listarProyectosEmpresaControlador);
router.get('/:id', getEmpresaControlador);
router.post('/', createEmpresaControlador);
router.delete('/:id', deleteEmpresaControlador);
router.put('/:id', updateEmpresaControlador);

// Rutas de contactos
router.get('/:id/contactos', listarContactosEmpresaControlador);
router.post('/:id/contactos', crearContactoEmpresaControlador);
router.put('/:id/contactos/:contactoId', actualizarContactoEmpresaControlador);
router.delete('/:id/contactos/:contactoId', eliminarContactoEmpresaControlador);

export default router;
