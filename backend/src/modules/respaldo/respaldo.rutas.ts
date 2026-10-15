import { Router } from 'express'
import { autenticarSolicitud } from '@/middlewares/autenticacion.middleware'
import { requierePermisos } from '@/middlewares/permisos.middleware'
import {
  generarRespaldoControlador,
  generarRespaldoSqlControlador,
  listarRespaldosSqlControlador,
  descargarRespaldoSqlControlador,
  restaurarRespaldoSqlControlador,
  obtenerResumenRespaldoControlador,
  restaurarRespaldoControlador,
  eliminarRespaldoSqlControlador,
  reiniciarDatosSistemaControlador,
} from '@/modules/respaldo/respaldo.controlador'

const router = Router()

router.get('/resumen', autenticarSolicitud, requierePermisos('backup.read'), obtenerResumenRespaldoControlador)
router.post('/generar', autenticarSolicitud, requierePermisos('backup.write'), generarRespaldoControlador)
router.post('/generar-sql', autenticarSolicitud, requierePermisos('backup.write'), generarRespaldoSqlControlador)
router.get('/historial-sql', autenticarSolicitud, requierePermisos('backup.read'), listarRespaldosSqlControlador)
router.get('/historial-sql/:id/descargar', autenticarSolicitud, requierePermisos('backup.read'), descargarRespaldoSqlControlador)
router.delete('/historial-sql/:id', autenticarSolicitud, requierePermisos('backup.write'), eliminarRespaldoSqlControlador)
router.post('/restaurar-sql', autenticarSolicitud, requierePermisos('backup.write'), restaurarRespaldoSqlControlador)
router.post('/restaurar', autenticarSolicitud, requierePermisos('backup.write'), restaurarRespaldoControlador)
router.post('/reinicio', autenticarSolicitud, requierePermisos('backup.write'), reiniciarDatosSistemaControlador)

export const respaldoRutas: Router = router
