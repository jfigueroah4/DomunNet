import { Request, Response } from 'express'
import { sendResponse, sendError } from '@/shared/response'
import { obtenerEstadoCloudinary, subirArchivoCloudinary } from '@/servicios/cloudinary.servicio'
import { obtenerEstadoB2, subirArchivoB2 } from '@/servicios/b2.servicio'
import { clienteSupabase } from '@/configuracion/cliente-supabase'

export async function obtenerEstadoGCSControlador(_req: Request, res: Response) {
  try {
    const estadoB2 = await obtenerEstadoB2()
    if (estadoB2.configurado) {
      sendResponse(res, 200, estadoB2, 'Estado de configuración de Backblaze B2')
      return
    }
    const estadoCloudinary = await obtenerEstadoCloudinary()
    sendResponse(res, 200, estadoCloudinary, 'Estado de configuración de Cloudinary')
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
        nombreProyectoFolder = proyectoDB.nombre.replace(/[^a-zA-Z0-9]/g, '_')
      }
    }

    const carpeta = `bitacora/${nombreProyectoFolder}`

    // Intentar subida con Backblaze B2 primero, fallback a Cloudinary
    let resultado: { urlStorage: string; publicId?: string; key?: string; proveedor: string; mensaje?: string }
    
    const estadoB2 = await obtenerEstadoB2()
    if (estadoB2.configurado) {
      const b2Res = await subirArchivoB2(base64String, `evidencia_${Date.now()}.jpg`, 'image/jpeg', carpeta)
      resultado = {
        urlStorage: b2Res.urlStorage,
        key: b2Res.key,
        proveedor: b2Res.proveedor,
        mensaje: b2Res.mensaje,
      }
    } else {
      const cloudRes = await subirArchivoCloudinary(base64String, carpeta)
      resultado = {
        urlStorage: cloudRes.urlStorage,
        publicId: cloudRes.publicId,
        proveedor: cloudRes.proveedor,
        mensaje: cloudRes.mensaje,
      }
    }

    // Si se especificó una entrada de bitácora, registrar la evidencia fotográfica en la BD Supabase
    if (bitacoraEntradaId) {
      await clienteSupabase.from('evidencia_fotografica').insert({
        bitacora_entrada_id: bitacoraEntradaId,
        gps_lat: gpsLat || null,
        gps_lng: gpsLng || null,
        fecha_hora: new Date().toISOString(),
        descripcion: descripcion || 'Evidencia de bitácora subida',
        categoria: categoria || 'General',
        url_storage: resultado.urlStorage,
      })
    }

    sendResponse(
      res,
      200,
      {
        urlStorage: resultado.urlStorage,
        publicId: resultado.publicId || resultado.key,
        proveedor: resultado.proveedor,
        mensaje: resultado.mensaje,
      },
      'Evidencia fotográfica subida exitosamente'
    )
  } catch (error: any) {
    console.error('Error en subirEvidenciaBitacoraGCSControlador:', error)
    sendError(res, 500, 'Error al subir archivo de evidencia', error.message)
  }
}
