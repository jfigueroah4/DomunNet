import { Request, Response } from 'express'
import { contactoPayloadSchema, empresaContratistaSchema } from './empresa-contratista.schemas'
import {
  actualizarContactoDeContratista,
  actualizarEmpresaContratista,
  crearContactoDeContratista,
  crearEmpresaContratista,
  eliminarContactoDeContratista,
  eliminarEmpresaContratista,
  listarContactosDeContratista,
  listarEmpresasContratistas,
  obtenerEmpresaContratista,
  obtenerProyectosDeContratista
} from './empresa-contratista.servicio'

export async function listar(req: Request, res: Response) {
  try { return res.json({ data: await listarEmpresasContratistas() }) } catch (e: any) { return res.status(400).json({ error: e.message }) }
}
export async function listarProyectos(req: Request, res: Response) {
  try { return res.json({ data: await obtenerProyectosDeContratista(req.params.id) }) } catch (e: any) { return res.status(400).json({ error: e.message }) }
}
export async function obtener(req: Request, res: Response) {
  try { return res.json({ data: await obtenerEmpresaContratista(req.params.id) }) } catch (e: any) { return res.status(400).json({ error: e.message }) }
}
export async function crear(req: Request, res: Response) {
  const r = empresaContratistaSchema.safeParse(req.body)
  if (!r.success) {
    console.error('Validation error en crear empresa contratista:', JSON.stringify(r.error.issues, null, 2))
    return res.status(400).json({ error: 'Datos inválidos', details: r.error.issues })
  }
  try { return res.status(201).json({ data: await crearEmpresaContratista(r.data) }) } catch (e: any) { return res.status(400).json({ error: e.message }) }
}
export async function actualizar(req: Request, res: Response) {
  const r = empresaContratistaSchema.safeParse(req.body)
  if (!r.success) {
    console.error('Validation error en actualizar empresa contratista:', JSON.stringify(r.error.issues, null, 2))
    return res.status(400).json({ error: 'Datos inválidos', details: r.error.issues })
  }
  try { return res.json({ data: await actualizarEmpresaContratista(req.params.id, r.data) }) } catch (e: any) { return res.status(400).json({ error: e.message }) }
}
export async function eliminar(req: Request, res: Response) {
  try { await eliminarEmpresaContratista(req.params.id); return res.json({ success: true }) } catch (e: any) { return res.status(400).json({ error: e.message }) }
}

export async function listarContactos(req: Request, res: Response) {
  try { return res.json({ data: await listarContactosDeContratista(req.params.id) }) } catch (error: any) { return res.status(400).json({ error: error.message }) }
}

export async function crearContacto(req: Request, res: Response) {
  const result = contactoPayloadSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ error: 'Datos de contacto inválidos', details: result.error.issues })
  }
  try {
    const contacto = await crearContactoDeContratista(req.params.id, result.data)
    return res.status(201).json({ data: contacto })
  } catch (error: any) {
    return res.status(400).json({ error: error.message })
  }
}

export async function actualizarContactoCtrl(req: Request, res: Response) {
  const result = contactoPayloadSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ error: 'Datos de contacto inválidos', details: result.error.issues })
  }
  try {
    const contacto = await actualizarContactoDeContratista(req.params.id, req.params.contactoId, result.data)
    return res.json({ data: contacto })
  } catch (error: any) {
    return res.status(400).json({ error: error.message })
  }
}

export async function eliminarContactoCtrl(req: Request, res: Response) {
  try {
    await eliminarContactoDeContratista(req.params.id, req.params.contactoId)
    return res.json({ success: true })
  } catch (error: any) {
    return res.status(400).json({ error: error.message })
  }
}
