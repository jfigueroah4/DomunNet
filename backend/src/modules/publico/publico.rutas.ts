import { Router } from 'express'
import { obtenerEstadoPublico } from '@/modules/publico/publico.controlador'

const router = Router()

router.get('/estado', obtenerEstadoPublico)

export const publicoRutas: Router = router
