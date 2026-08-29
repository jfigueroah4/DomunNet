import { Router } from 'express'
import { listar, obtener, crear, actualizar, eliminar } from './mantenimiento.controlador'
const router = Router();
router.get('/:tabla', listar);
router.get('/:tabla/:id', obtener);
router.post('/:tabla', crear);
router.put('/:tabla/:id', actualizar);
router.delete('/:tabla/:id', eliminar);
export const mantenimientoRutas: Router = router;
