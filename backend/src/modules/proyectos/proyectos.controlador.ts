import { Request, Response } from 'express'
import { z } from 'zod'
import { sendError, sendResponse } from '@/shared/response'
import { actualizarEstadoProyecto, actualizarProyecto, obtenerProyectoPorId, obtenerProyectos, ValidationError } from './proyectos.servicio'

const cambiarEstadoSchema = z.object({
  estado_codigo: z.string().min(1)
})

const uuidOpcional = z.preprocess(
  (val) => {
    if (!val || val === '') return null
    if (typeof val === 'string') {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val.trim())
      return isUuid ? val.trim() : null
    }
    return val
  },
  z.string().uuid().optional().nullable()
)

const actualizarProyectoSchema = z.object({
  // Paso 1: Identificación y Ubicación.
  nombreOficial: z.string().min(1).optional(),
  descripcion: z.string().optional().nullable(),
  ubicacionFisica: z.string().optional().nullable(),
  municipioId: uuidOpcional,
  departamentoId: uuidOpcional,
  latitud: z.number().optional().nullable(),
  longitud: z.number().optional().nullable(),
  direccion: z.string().optional().nullable(),
  kilometroInicio: z.number().optional().nullable(),
  kilometroFin: z.number().optional().nullable(),

  // Paso 2 & 3: Entidades y Seguimiento
  empresaContratanteId: uuidOpcional,
  empresaContratistaId: uuidOpcional,
  empresaContratista: z.string().optional().nullable(),
  empresaSupervisora: z.string().optional().nullable(),
  delegadoResidenteId: uuidOpcional,
  fechaAdjudicacion: z.string().optional().nullable(),
  fechaInicioContractual: z.string().optional().nullable(),
  numeroEscrituraPublica: z.string().optional().nullable(),
  montoContractualOriginal: z.number().optional().nullable(),
  responsable: uuidOpcional,
  estado: z.string().optional().nullable(),
  equipo: z.array(z.object({ id: uuidOpcional, rol: z.string().optional() })).optional().nullable(),

  paso2: z.record(z.unknown()).optional(),
  paso3: z.record(z.unknown()).optional(),
}).passthrough()

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

export async function actualizarProyectoControlador(req: Request, res: Response) {
  try {
    const body = actualizarProyectoSchema.parse(req.body)
    const proyecto = await actualizarProyecto(req.params.id, body)
    return sendResponse(res, 200, proyecto, 'Proyecto actualizado correctamente')
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return sendError(res, 400, 'Error de formato en solicitud', error.errors)
    }
    console.error('Error en actualizarProyectoControlador:', error)
    return sendError(res, 500, error.message || 'Error interno del servidor')
  }
}

export async function obtenerProyectoControlador(req: Request, res: Response) {
  try {
    const proyecto = await obtenerProyectoPorId(req.params.id)
    return sendResponse(res, 200, proyecto, 'Proyecto obtenido correctamente')
  } catch (error: any) {
    console.error('Error en obtenerProyectoControlador:', error)
    return sendError(res, 404, error.message || 'Proyecto no encontrado')
  }
}

export async function obtenerProyectosControlador(req: Request, res: Response) {
  try {
    const proyectos = await obtenerProyectos()
    return sendResponse(res, 200, proyectos, 'Proyectos obtenidos correctamente')
  } catch (error: any) {
    console.error('Error en obtenerProyectosControlador:', error)
    return sendError(res, 500, error.message || 'Error interno del servidor')
  }
}

import { crearProyecto } from './proyectos.servicio'

const crearProyectoSchema = z.object({
  nombreOficial: z.string().min(1, "Nombre es requerido"),
  nombre: z.string().optional().nullable(),
  descripcion: z.string().optional().nullable(),
  ubicacionFisica: z.string().optional().nullable(),
  ubicacion: z.string().optional().nullable(),
  responsable: uuidOpcional,
  estado: z.string().optional().nullable(),
  
  municipioId: uuidOpcional,
  departamentoId: uuidOpcional,
  latitud: z.number().optional().nullable(),
  longitud: z.number().optional().nullable(),
  direccion: z.string().optional().nullable(),
  kilometroInicio: z.number().optional().nullable(),
  kilometroFin: z.number().optional().nullable(),
  montoFinal: z.number().optional().nullable(),

  empresaContratanteId: uuidOpcional,
  entidadContratante: z.string().optional().nullable(),
  empresaContratistaId: uuidOpcional,
  empresaContratista: z.string().optional().nullable(),
  empresaSupervisora: z.string().optional().nullable(),
  delegadoResidenteId: uuidOpcional,
  fechaAdjudicacion: z.string().optional().nullable(),
  fechaInicioContractual: z.string().optional().nullable(),
  fechaInicio: z.string().optional().nullable(),
  fechaFinContractualPlan: z.string().optional().nullable(),
  fechaFin: z.string().optional().nullable(),
  numeroEscrituraPublica: z.string().optional().nullable(),
  montoContractualOriginal: z.number().optional().nullable(),
  presupuesto: z.number().optional().nullable(),
  plazoEjecucionOriginal: z.union([z.string(), z.number()]).optional().nullable(),
  plazoEjecucionContractualOriginal: z.string().optional().nullable(),
  plazoEjecucionRealAmpliado: z.union([z.string(), z.number()]).optional().nullable(),
  fechaFinalizacionReal: z.string().optional().nullable(),
  montoFinancieroFinalEjecutado: z.number().optional().nullable(),
  equipo: z.array(z.object({ id: uuidOpcional, rol: z.string().optional() })).optional().nullable(),
  coordenadasMapa: z.any().optional().nullable()
}).passthrough()

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

import { eliminarProyecto } from './proyectos.servicio'

export async function eliminarProyectoControlador(req: Request, res: Response) {
  try {
    await eliminarProyecto(req.params.id)
    return sendResponse(res, 200, { success: true }, 'Proyecto eliminado exitosamente')
  } catch (error: any) {
    console.error('Error en eliminarProyectoControlador:', error)
    return sendError(res, 500, error.message || 'Error al eliminar el proyecto')
  }
}
