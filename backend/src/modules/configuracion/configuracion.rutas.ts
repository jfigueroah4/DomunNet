import { Router } from 'express';
import { autenticarSolicitud } from '@/middlewares/autenticacion.middleware';
import { requierePermisos } from '@/middlewares/permisos.middleware';
import {
  actualizarConfiguracionGeneralControlador,
  obtenerConfiguracionGeneralControlador,
} from '@/modules/configuracion/configuracion.controlador';

const router = Router();

router.get(
  '/general',
  autenticarSolicitud,
  requierePermisos('configuracion.read'),
  obtenerConfiguracionGeneralControlador
);
router.put(
  '/general',
  autenticarSolicitud,
  requierePermisos('configuracion.write'),
  actualizarConfiguracionGeneralControlador
);

export const configuracionRutas: Router = router;
