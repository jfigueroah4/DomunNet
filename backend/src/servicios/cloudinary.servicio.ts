import { v2 as cloudinary } from 'cloudinary'
import { entorno } from '@/configuracion/entorno'

// Configurar Cloudinary con las variables de entorno
cloudinary.config({
  cloud_name: entorno.cloudinary.cloudName,
  api_key: entorno.cloudinary.apiKey,
  api_secret: entorno.cloudinary.apiSecret,
})

export async function obtenerEstadoCloudinary() {
  const configurado = Boolean(entorno.cloudinary.cloudName && entorno.cloudinary.apiKey && entorno.cloudinary.apiSecret)
  
  if (!configurado) {
    return {
      configurado: false,
      mensaje: 'Faltan credenciales de Cloudinary (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)',
    }
  }
  
  return {
    configurado: true,
    cloudName: entorno.cloudinary.cloudName,
    mensaje: 'Cloudinary está configurado correctamente',
  }
}

export async function subirArchivoCloudinary(
  bufferBase64: string,
  carpeta: string = 'bitacora'
): Promise<{ urlStorage: string; publicId: string; proveedor: string; mensaje?: string }> {
  
  // Si no está configurado, devolvemos un URL de prueba/fallback
  if (!entorno.cloudinary.cloudName || !entorno.cloudinary.apiKey || !entorno.cloudinary.apiSecret) {
    console.warn('⚠️ Subida en modo simulación por falta de credenciales de Cloudinary')
    return {
      urlStorage: `https://dummyimage.com/600x400/000/fff&text=Simulacion+Cloudinary`,
      publicId: `simulacion/${Date.now()}`,
      proveedor: 'mock-local',
      mensaje: 'Advertencia: Faltan credenciales, se usó simulador',
    }
  }

  return new Promise((resolve, reject) => {
    let base64String = bufferBase64
    if (!base64String.startsWith('data:')) {
      base64String = `data:image/jpeg;base64,${base64String}`
    }

    cloudinary.uploader.upload(
      base64String,
      {
        folder: carpeta,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          console.error('Error al subir a Cloudinary:', error)
          reject(error)
        } else if (result) {
          resolve({
            urlStorage: result.secure_url,
            publicId: result.public_id,
            proveedor: 'cloudinary'
          })
        } else {
          reject(new Error('Respuesta vacía de Cloudinary'))
        }
      }
    )
  })
}
