import { Router } from 'express'
import { autenticarSolicitud } from '@/middlewares/autenticacion.middleware'
import { requierePermisos } from '@/middlewares/permisos.middleware'
import {
  generarRespaldoControlador,
  obtenerResumenRespaldoControlador,
  restaurarRespaldoControlador,
} from '@/modules/respaldo/respaldo.controlador'

const router = Router()

router.get('/resumen', autenticarSolicitud, requierePermisos('backup.read'), obtenerResumenRespaldoControlador)
router.post('/generar', autenticarSolicitud, requierePermisos('backup.write'), generarRespaldoControlador)
router.post('/restaurar', autenticarSolicitud, requierePermisos('backup.write'), restaurarRespaldoControlador)

export const respaldoRutas: Router = router
