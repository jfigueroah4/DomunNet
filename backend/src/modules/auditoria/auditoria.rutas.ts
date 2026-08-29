import { Router } from 'express'
import { listar } from './auditoria.controlador'
const router = Router();
router.get('/:tabla', listar);
export const auditoriaRutas: Router = router;
