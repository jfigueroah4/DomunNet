import { Request, Response } from 'express'
import { empresaContratistaSchema } from './empresa-contratista.schemas'
import { actualizarEmpresaContratista, crearEmpresaContratista, eliminarEmpresaContratista, listarEmpresasContratistas, obtenerEmpresaContratista } from './empresa-contratista.servicio'

export async function listar(req: Request, res: Response) { try { return res.json({ data: await listarEmpresasContratistas() }) } catch (e: any) { return res.status(400).json({ error: e.message }) } }
export async function obtener(req: Request, res: Response) { try { return res.json({ data: await obtenerEmpresaContratista(req.params.id) }) } catch (e: any) { return res.status(400).json({ error: e.message }) } }
export async function crear(req: Request, res: Response) { const r = empresaContratistaSchema.safeParse(req.body); if (!r.success) return res.status(400).json({ error: 'Datos inválidos', details: r.error.issues }); try { return res.status(201).json({ data: await crearEmpresaContratista(r.data) }) } catch (e: any) { return res.status(400).json({ error: e.message }) } }
export async function actualizar(req: Request, res: Response) { const r = empresaContratistaSchema.safeParse(req.body); if (!r.success) return res.status(400).json({ error: 'Datos inválidos', details: r.error.issues }); try { return res.json({ data: await actualizarEmpresaContratista(req.params.id, r.data) }) } catch (e: any) { return res.status(400).json({ error: e.message }) } }
export async function eliminar(req: Request, res: Response) { try { await eliminarEmpresaContratista(req.params.id); return res.json({ success: true }) } catch (e: any) { return res.status(400).json({ error: e.message }) } }
