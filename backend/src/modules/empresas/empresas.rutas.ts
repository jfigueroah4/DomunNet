import { Router } from 'express';
import { autenticarSolicitud } from '@/middlewares/autenticacion.middleware';
import { requierePermisos } from '@/middlewares/permisos.middleware';
import {
  getEmpresasControlador,
  getEmpresaControlador,
  createEmpresaControlador,
    deleteEmpresaControlador,
    updateEmpresaControlador
} from './empresas.controlador';

const router: Router = Router();

router.use(autenticarSolicitud, requierePermisos('proyectos', 'read'));

router.get('/', getEmpresasControlador);
router.get('/:id', getEmpresaControlador);
router.post('/', createEmpresaControlador);
router.delete('/:id', deleteEmpresaControlador);
router.put('/:id', updateEmpresaControlador);

export default router;
