import { Router } from 'express'
import { autenticarSolicitud } from '@/middlewares/autenticacion.middleware'
import { requierePermisos } from '@/middlewares/permisos.middleware'
import {
  actualizarGrupoCatalogoControlador,
  actualizarItemCatalogoControlador,
  crearGrupoCatalogoControlador,
  crearItemCatalogoControlador,
  eliminarGrupoCatalogoControlador,
  eliminarItemCatalogoControlador,
  listarCatalogosControlador,
  obtenerCatalogoControlador,
} from '@/modules/catalogos/catalogos.controlador'

const router = Router()

router.get('/', autenticarSolicitud, requierePermisos('catalogos.read'), listarCatalogosControlador)
router.post('/', autenticarSolicitud, requierePermisos('catalogos.write'), crearGrupoCatalogoControlador)
router.get('/:grupoId', autenticarSolicitud, requierePermisos('catalogos.read'), obtenerCatalogoControlador)
router.put('/:grupoId', autenticarSolicitud, requierePermisos('catalogos.write'), actualizarGrupoCatalogoControlador)
router.delete('/:grupoId', autenticarSolicitud, requierePermisos('catalogos.write'), eliminarGrupoCatalogoControlador)
router.post('/:grupoId/items', autenticarSolicitud, requierePermisos('catalogos.write'), crearItemCatalogoControlador)
router.put('/:grupoId/items/:itemId', autenticarSolicitud, requierePermisos('catalogos.write'), actualizarItemCatalogoControlador)
router.delete('/:grupoId/items/:itemId', autenticarSolicitud, requierePermisos('catalogos.write'), eliminarItemCatalogoControlador)

export const catalogosRutas: Router = router
