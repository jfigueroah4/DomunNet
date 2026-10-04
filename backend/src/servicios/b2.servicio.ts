import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { entorno } from '@/configuracion/entorno'

let s3Client: S3Client | null = null

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      endpoint: entorno.b2.endpoint,
      region: entorno.b2.region,
      credentials: {
        accessKeyId: entorno.b2.keyId,
        secretAccessKey: entorno.b2.applicationKey,
      },
    })
  }
  return s3Client
}

export async function obtenerEstadoB2() {
  const configurado = Boolean(
    entorno.b2.endpoint && entorno.b2.bucketName && entorno.b2.keyId && entorno.b2.applicationKey
  )

  if (!configurado) {
    return {
      configurado: false,
      mensaje: 'Faltan credenciales de Backblaze B2 (B2_ENDPOINT, B2_BUCKET_NAME, B2_KEY_ID, B2_APPLICATION_KEY)',
    }
  }

  return {
    configurado: true,
    bucketName: entorno.b2.bucketName,
    mensaje: 'Backblaze B2 está configurado correctamente',
  }
}

export async function subirArchivoB2(
  bufferOrBase64: Buffer | string,
  nombreArchivo: string,
  contentType: string = 'image/jpeg',
  carpeta: string = 'bitacora'
): Promise<{ urlStorage: string; key: string; proveedor: string; mensaje?: string }> {
  if (!entorno.b2.endpoint || !entorno.b2.bucketName || !entorno.b2.keyId || !entorno.b2.applicationKey) {
    console.warn('⚠️ Subida en modo simulación por falta de credenciales de Backblaze B2')
    return {
      urlStorage: `https://dummyimage.com/600x400/000/fff&text=Simulacion+B2`,
      key: `simulacion/${Date.now()}_${nombreArchivo}`,
      proveedor: 'mock-local',
      mensaje: 'Advertencia: Faltan credenciales B2, se usó simulador',
    }
  }

  let bodyBuffer: Buffer
  if (typeof bufferOrBase64 === 'string') {
    const base64Data = bufferOrBase64.replace(/^data:image\/\w+;base64,/, '')
    bodyBuffer = Buffer.from(base64Data, 'base64')
  } else {
    bodyBuffer = bufferOrBase64
  }

  const key = `${carpeta}/${Date.now()}_${nombreArchivo.replace(/[^a-zA-Z0-9._-]/g, '_')}`

  const client = getS3Client()
  const command = new PutObjectCommand({
    Bucket: entorno.b2.bucketName,
    Key: key,
    Body: bodyBuffer,
    ContentLength: bodyBuffer.length,
    ContentType: contentType,
  })

  await client.send(command)

  // URL pública directa de Backblaze B2
  // Formato: https://<bucketName>.<endpoint_host>/<key>
  const endpointHost = entorno.b2.endpoint.replace(/^https?:\/\//, '')
  const urlStorage = `https://${entorno.b2.bucketName}.${endpointHost}/${key}`

  return {
    urlStorage,
    key,
    proveedor: 'backblaze-b2',
  }
}
