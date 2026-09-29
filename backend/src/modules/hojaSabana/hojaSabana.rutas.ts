import { Router } from 'express'
import { autenticarSolicitud } from '@/middlewares/autenticacion.middleware'
import { requierePermisos } from '@/middlewares/permisos.middleware'
import {
  listarMedicionesControlador,
  crearMedicionControlador,
  actualizarMedicionControlador,
  eliminarMedicionControlador,
  finalizarEstimacionControlador,
} from './hojaSabana.controlador'

export const hojaSabanaRutas: Router = Router()

hojaSabanaRutas.use(autenticarSolicitud)

hojaSabanaRutas.get(
  '/:proyectoId/mediciones',
  requierePermisos('hoja_sabana.leer', 'proyectos.leer'),
  listarMedicionesControlador
)

hojaSabanaRutas.post(
  '/:proyectoId/mediciones',
  requierePermisos('hoja_sabana.crear', 'proyectos.actualizar'),
  crearMedicionControlador
)

hojaSabanaRutas.patch(
  '/:proyectoId/mediciones/:medicionId',
  requierePermisos('hoja_sabana.crear', 'proyectos.actualizar'),
  actualizarMedicionControlador
)

hojaSabanaRutas.delete(
  '/:proyectoId/mediciones/:medicionId',
  requierePermisos('hoja_sabana.eliminar', 'proyectos.actualizar'),
  eliminarMedicionControlador
)

hojaSabanaRutas.post(
  '/:proyectoId/finalizar-estimacion',
  requierePermisos('hoja_sabana.aprobar', 'proyectos.actualizar'),
  finalizarEstimacionControlador
)

export default hojaSabanaRutas
