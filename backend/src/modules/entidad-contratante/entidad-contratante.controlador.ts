import { Request, Response } from 'express'
import { entidadContratanteSchema } from './entidad-contratante.schemas'
import { actualizarEntidadContratante, crearEntidadContratante, eliminarEntidadContratante, listarEntidadesContratantes, obtenerEntidadContratante } from './entidad-contratante.servicio'

export async function listar(req: Request, res: Response) {
  try { return res.json({ data: await listarEntidadesContratantes() }) } catch (error: any) { return res.status(400).json({ error: error.message }) }
}
export async function obtener(req: Request, res: Response) {
  try { return res.json({ data: await obtenerEntidadContratante(req.params.id) }) } catch (error: any) { return res.status(400).json({ error: error.message }) }
}
export async function crear(req: Request, res: Response) {
  const result = entidadContratanteSchema.safeParse(req.body)
  if (!result.success) return res.status(400).json({ error: 'Datos inválidos', details: result.error.issues })
  try { return res.status(201).json({ data: await crearEntidadContratante(result.data) }) } catch (error: any) { return res.status(400).json({ error: error.message }) }
}
export async function actualizar(req: Request, res: Response) {
  const result = entidadContratanteSchema.safeParse(req.body)
  if (!result.success) return res.status(400).json({ error: 'Datos inválidos', details: result.error.issues })
  try { return res.json({ data: await actualizarEntidadContratante(req.params.id, result.data) }) } catch (error: any) { return res.status(400).json({ error: error.message }) }
}
export async function eliminar(req: Request, res: Response) {
  try { await eliminarEntidadContratante(req.params.id); return res.json({ success: true }) } catch (error: any) { return res.status(400).json({ error: error.message }) }
}
