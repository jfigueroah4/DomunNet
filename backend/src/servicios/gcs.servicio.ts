import { Storage } from '@google-cloud/storage'
import { entorno } from '@/configuracion/entorno'
import fs from 'fs'

let storageClient: Storage | null = null

function obtenerClienteGCS(): Storage | null {
  if (storageClient) return storageClient

  const projectId = entorno.gcsProjectId
  const keyFilePath = entorno.gcsKeyFile

  if (!projectId) {
    return null
  }

  try {
    if (keyFilePath && fs.existsSync(keyFilePath)) {
      storageClient = new Storage({
        projectId,
        keyFilename: keyFilePath,
      })
    } else {
      // Intenta usar las credenciales predeterminadas de la aplicación en GCP
      storageClient = new Storage({
        projectId,
      })
    }
    return storageClient
  } catch (err) {
    console.warn('⚠️ No se pudo inicializar el cliente oficial de Google Cloud Storage (GCS):', err)
    return null
  }
}

export interface ResultadoSubidaGCS {
  exito: boolean
  urlStorage: string
  bucket: string
  rutaDestino: string
  proveedor: 'gcs' | 'fallback'
  mensaje?: string
}

/**
 * Sube un buffer de archivo hacia el bucket configurado en Google Cloud Storage (GCS).
 */
export async function subirArchivoGCS(
  buffer: Buffer,
  rutaDestino: string,
  contentType: string = 'image/jpeg'
): Promise<ResultadoSubidaGCS> {
  const bucketName = entorno.gcsBucketName
  const client = obtenerClienteGCS()

  if (!client) {
    // Modo Fallback simulado para desarrollo / ambiente local sin llave credencial GCS
    const urlSimulada = `https://storage.googleapis.com/${bucketName}/${rutaDestino}`
    return {
      exito: true,
      urlStorage: urlSimulada,
      bucket: bucketName,
      rutaDestino,
      proveedor: 'fallback',
      mensaje: 'GCS en modo simulación (configura GCS_KEY_FILE con un Service Account de GCP para producción).',
    }
  }

  try {
    const bucket = client.bucket(bucketName)
    const file = bucket.file(rutaDestino)

    await file.save(buffer, {
      metadata: {
        contentType,
        cacheControl: 'public, max-age=31536000',
      },
      resumable: false,
    })

    const publicUrl = `https://storage.googleapis.com/${bucketName}/${rutaDestino}`

    return {
      exito: true,
      urlStorage: publicUrl,
      bucket: bucketName,
      rutaDestino,
      proveedor: 'gcs',
    }
  } catch (err: any) {
    console.error('❌ Error al subir archivo a Google Cloud Storage:', err)
    const urlFallback = `https://storage.googleapis.com/${bucketName}/${rutaDestino}`
    return {
      exito: false,
      urlStorage: urlFallback,
      bucket: bucketName,
      rutaDestino,
      proveedor: 'fallback',
      mensaje: err?.message || 'Fallo de transmisión con GCS',
    }
  }
}

/**
 * Genera una URL firmada de lectura temporal con caducidad para archivos privados de GCS.
 */
export async function generarUrlFirmadaGCS(
  rutaDestino: string,
  minutosExpiracion: number = 60
): Promise<string> {
  const bucketName = entorno.gcsBucketName
  const client = obtenerClienteGCS()

  if (!client) {
    return `https://storage.googleapis.com/${bucketName}/${rutaDestino}`
  }

  try {
    const bucket = client.bucket(bucketName)
    const file = bucket.file(rutaDestino)

    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + minutosExpiracion * 60 * 1000,
    })

    return url
  } catch (err) {
    console.error('Error al generar URL firmada en GCS:', err)
    return `https://storage.googleapis.com/${bucketName}/${rutaDestino}`
  }
}

/**
 * Elimina un archivo del bucket de Google Cloud Storage.
 */
export async function eliminarArchivoGCS(rutaDestino: string): Promise<boolean> {
  const bucketName = entorno.gcsBucketName
  const client = obtenerClienteGCS()

  if (!client) return true

  try {
    const bucket = client.bucket(bucketName)
    const file = bucket.file(rutaDestino)
    await file.delete()
    return true
  } catch (err) {
    console.error('Error al eliminar archivo de GCS:', err)
    return false
  }
}

/**
 * Verifica el estado y conectividad del servicio GCS en el backend.
 */
export async function obtenerEstadoGCS(): Promise<{
  configurado: boolean
  projectId: string
  bucketName: string
  keyFilePresente: boolean
  modo: 'gcs_activo' | 'fallback_simulado'
}> {
  const keyFilePath = entorno.gcsKeyFile
  const keyPresent = Boolean(keyFilePath && fs.existsSync(keyFilePath))
  const client = obtenerClienteGCS()

  return {
    configurado: Boolean(entorno.gcsProjectId && entorno.gcsBucketName),
    projectId: entorno.gcsProjectId || 'Sin configurar',
    bucketName: entorno.gcsBucketName,
    keyFilePresente: keyPresent,
    modo: client && keyPresent ? 'gcs_activo' : 'fallback_simulado',
  }
}
