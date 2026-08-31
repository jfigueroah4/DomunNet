import { Request, Response } from 'express'
import { z } from 'zod'
import { sendError, sendResponse } from '@/shared/response'
import { actualizarEstadoProyecto, ValidationError } from './proyectos.servicio'

const cambiarEstadoSchema = z.object({
  estado_codigo: z.string().min(1)
})

export async function cambiarEstadoControlador(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { estado_codigo } = cambiarEstadoSchema.parse(req.body)

    await actualizarEstadoProyecto(id, estado_codigo)

    return sendResponse(res, 200, { estado: estado_codigo }, 'Estado actualizado correctamente')
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return sendError(res, 400, 'Error de validación', error.errors)
    }
    if (error instanceof ValidationError) {
      // Devolvemos el campo exacto que falla usando el formato de errores estándar
      return sendError(res, 400, error.message, { campo: error.field })
    }
    
    console.error('Error en cambiarEstadoControlador:', error)
    return sendError(res, 500, error.message || 'Error interno del servidor')
  }
}

import { crearProyecto } from './proyectos.servicio'

const crearProyectoSchema = z.object({
  nombreOficial: z.string().min(1, "Nombre es requerido"),
  descripcion: z.string().optional().nullable(),
  ubicacionFisica: z.string().optional().nullable(),
  responsable: z.string().uuid().optional().nullable(),
  municipioId: z.string().uuid().optional().nullable(),
  empresaContratanteId: z.string().uuid().optional().nullable(),
  empresaContratista: z.string().optional().nullable(),
  empresaSupervisora: z.string().optional().nullable(),
  delegadoResidenteId: z.string().uuid().optional().nullable(),
  fechaAdjudicacion: z.string().optional().nullable(),
  fechaInicioContractual: z.string().optional().nullable(),
  numeroEscrituraPublica: z.string().optional().nullable(),
  montoContractualOriginal: z.number().optional().nullable()
})

export async function crearProyectoControlador(req: Request, res: Response) {
  try {
    const body = crearProyectoSchema.parse(req.body)
    const nuevoId = await crearProyecto(body)
    return sendResponse(res, 201, { id: nuevoId }, 'Proyecto creado exitosamente en Borrador')
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return sendError(res, 400, 'Error de formato en solicitud', error.errors)
    }
    console.error('Error en crearProyectoControlador:', error)
    return sendError(res, 500, error.message || 'Error interno del servidor')
  }
}
