import { Router } from 'express'
import {
  obtenerEstadoGCSControlador,
  subirEvidenciaBitacoraGCSControlador,
} from '@/modules/bitacora/bitacora-gcs.controlador'

export const bitacoraGcsRutas: Router = Router()

bitacoraGcsRutas.get('/estado', obtenerEstadoGCSControlador)
bitacoraGcsRutas.post('/subir', subirEvidenciaBitacoraGCSControlador)

export default bitacoraGcsRutas
