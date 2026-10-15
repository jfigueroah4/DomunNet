import { Request, Response } from 'express'
import { contactoPayloadSchema, entidadContratanteSchema } from './entidad-contratante.schemas'
import {
  actualizarContactoDeEntidad,
  actualizarEntidadContratante,
  crearContactoDeEntidad,
  crearEntidadContratante,
  eliminarContactoDeEntidad,
  eliminarEntidadContratante,
  listarContactosDeEntidad,
  listarEntidadesContratantes,
  obtenerEntidadContratante,
  obtenerProyectosDeEntidad
} from './entidad-contratante.servicio'

export async function listar(req: Request, res: Response) {
  try { return res.json({ data: await listarEntidadesContratantes() }) } catch (error: any) { return res.status(400).json({ error: error.message }) }
}
export async function listarProyectos(req: Request, res: Response) {
  try { return res.json({ data: await obtenerProyectosDeEntidad(req.params.id) }) } catch (error: any) { return res.status(400).json({ error: error.message }) }
}
export async function obtener(req: Request, res: Response) {
  try { return res.json({ data: await obtenerEntidadContratante(req.params.id) }) } catch (error: any) { return res.status(400).json({ error: error.message }) }
}
export async function crear(req: Request, res: Response) {
  const result = entidadContratanteSchema.safeParse(req.body)
  if (!result.success) {
    console.error('Validation error en crear entidad contratante:', JSON.stringify(result.error.issues, null, 2))
    return res.status(400).json({ error: 'Datos inválidos', details: result.error.issues })
  }
  try { return res.status(201).json({ data: await crearEntidadContratante(result.data) }) } catch (error: any) { return res.status(400).json({ error: error.message }) }
}
export async function actualizar(req: Request, res: Response) {
  const result = entidadContratanteSchema.safeParse(req.body)
  if (!result.success) {
    console.error('Validation error en actualizar entidad contratante:', JSON.stringify(result.error.issues, null, 2))
    return res.status(400).json({ error: 'Datos inválidos', details: result.error.issues })
  }
  try { return res.json({ data: await actualizarEntidadContratante(req.params.id, result.data) }) } catch (error: any) { return res.status(400).json({ error: error.message }) }
}
export async function eliminar(req: Request, res: Response) {
  try { await eliminarEntidadContratante(req.params.id); return res.json({ success: true }) } catch (error: any) { return res.status(400).json({ error: error.message }) }
}

export async function listarContactos(req: Request, res: Response) {
  try { return res.json({ data: await listarContactosDeEntidad(req.params.id) }) } catch (error: any) { return res.status(400).json({ error: error.message }) }
}

export async function crearContacto(req: Request, res: Response) {
  const result = contactoPayloadSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ error: 'Datos de contacto inválidos', details: result.error.issues })
  }
  try {
    const contacto = await crearContactoDeEntidad(req.params.id, result.data)
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
    const contacto = await actualizarContactoDeEntidad(req.params.id, req.params.contactoId, result.data)
    return res.json({ data: contacto })
  } catch (error: any) {
    return res.status(400).json({ error: error.message })
  }
}

export async function eliminarContactoCtrl(req: Request, res: Response) {
  try {
    await eliminarContactoDeEntidad(req.params.id, req.params.contactoId)
    return res.json({ success: true })
  } catch (error: any) {
    return res.status(400).json({ error: error.message })
  }
}
