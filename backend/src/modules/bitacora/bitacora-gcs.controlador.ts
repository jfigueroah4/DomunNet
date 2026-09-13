import { Request, Response } from 'express'
import { sendResponse, sendError } from '@/shared/response'
import { obtenerEstadoCloudinary, subirArchivoCloudinary } from '@/servicios/cloudinary.servicio'
import { clienteSupabase } from '@/configuracion/cliente-supabase'

export async function obtenerEstadoGCSControlador(_req: Request, res: Response) {
  try {
    const estado = await obtenerEstadoCloudinary()
    sendResponse(res, 200, estado, 'Estado de configuración de Cloudinary')
  } catch (error: any) {
    sendError(res, 500, 'Error al consultar estado', error.message)
  }
}

export async function subirEvidenciaBitacoraGCSControlador(req: Request, res: Response) {
  try {
    const { bitacoraEntradaId, proyectoId, descripcion, categoria, gpsLat, gpsLng, imagenBase64 } = req.body

    const fileUpload = (req as any).file

    if (!imagenBase64 && !fileUpload) {
      sendError(res, 400, 'Debe adjuntar una imagen o buffer en base64')
      return
    }

    let base64String = ''
    if (imagenBase64) {
      base64String = imagenBase64
    } else if (fileUpload) {
      base64String = `data:${fileUpload.mimetype};base64,${fileUpload.buffer.toString('base64')}`
    } else {
      sendError(res, 400, 'Formato de imagen inválido')
      return
    }

    let nombreProyectoFolder = proyectoId || 'general'
    
    // Buscar el nombre real del proyecto para crear una carpeta ordenada
    if (proyectoId && proyectoId !== 'general') {
      const { data: proyectoDB } = await clienteSupabase
        .from('proyectos')
        .select('nombre')
        .eq('id', proyectoId)
        .single()
        
      if (proyectoDB?.nombre) {
        // Limpiamos espacios y caracteres especiales para que sea una carpeta válida (ej: "Mi Proyecto" -> "Mi_Proyecto")
        nombreProyectoFolder = proyectoDB.nombre.replace(/[^a-zA-Z0-9]/g, '_')
      }
    }

    const carpeta = `bitacora/${nombreProyectoFolder}`
    const resultadoCloudinary = await subirArchivoCloudinary(base64String, carpeta)

    // Si se especificó una entrada de bitácora, registrar la evidencia fotográfica en la BD Supabase
    if (bitacoraEntradaId) {
      await clienteSupabase.from('evidencia_fotografica').insert({
        bitacora_entrada_id: bitacoraEntradaId,
        gps_lat: gpsLat || null,
        gps_lng: gpsLng || null,
        fecha_hora: new Date().toISOString(),
        descripcion: descripcion || 'Evidencia de bitácora subida',
        categoria: categoria || 'General',
        url_storage: resultadoCloudinary.urlStorage,
      })
    }

    sendResponse(
      res,
      200,
      {
        urlStorage: resultadoCloudinary.urlStorage,
        publicId: resultadoCloudinary.publicId,
        proveedor: resultadoCloudinary.proveedor,
        mensaje: resultadoCloudinary.mensaje,
      },
      'Evidencia fotográfica subida exitosamente'
    )
  } catch (error: any) {
    console.error('Error en subirEvidenciaBitacoraGCSControlador:', error)
    sendError(res, 500, 'Error al subir archivo a Cloudinary', error.message)
  }
}
