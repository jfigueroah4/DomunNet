import { Router } from 'express'
import { autenticarSolicitud } from '@/middlewares/autenticacion.middleware'
import {
  listar,
  obtener,
  crear,
  actualizar,
  eliminar,
} from './mantenimiento.controller'

const router = Router()

router.use(autenticarSolicitud) // Proteger todas las rutas de mantenimiento

router.get('/:tabla', listar)
router.get('/:tabla/:id', obtener)
router.post('/:tabla', crear)
router.put('/:tabla/:id', actualizar)
router.delete('/:tabla/:id', eliminar)

export const mantenimientoRutas: Router = router
