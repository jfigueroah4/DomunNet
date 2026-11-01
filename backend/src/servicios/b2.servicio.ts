import { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'
import { entorno } from '@/configuracion/entorno'

let s3Client: S3Client | null = null
let optimizacionExistentesIniciada = false

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

/**
 * Comprime agresivamente pero con alta fidelidad visual cualquier imagen a ~35KB - 65KB
 * usando MozJPEG progresivo y redimensionamiento adaptativo.
 */
async function comprimirBufferImagenOptimo(inputBuffer: Buffer): Promise<Buffer> {
  let Comprimido = await sharp(inputBuffer)
    .rotate() // Respeta orientación EXIF de cámara
    .resize({ width: 1080, height: 1080, fit: 'inside', withoutEnlargement: true })
    .jpeg({
      quality: 58,
      mozjpeg: true,
      progressive: true,
      chromaSubsampling: '4:2:0',
      optimizeScans: true,
    })
    .toBuffer()

  // Si aún supera 68 KB, aplicar segunda pasada a 920px y calidad 48
  if (Comprimido.length > 68 * 1024) {
    const paso2 = await sharp(inputBuffer)
      .rotate()
      .resize({ width: 920, height: 920, fit: 'inside', withoutEnlargement: true })
      .jpeg({
        quality: 48,
        mozjpeg: true,
        progressive: true,
        chromaSubsampling: '4:2:0',
        optimizeScans: true,
      })
      .toBuffer()
    if (paso2.length < Comprimido.length) {
      Comprimido = paso2
    }
  }

  // Si aún supera 80 KB, aplicar tercera pasada a 800px y calidad 42
  if (Comprimido.length > 80 * 1024) {
    const paso3 = await sharp(inputBuffer)
      .rotate()
      .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
      .jpeg({
        quality: 42,
        mozjpeg: true,
        progressive: true,
        chromaSubsampling: '4:2:0',
      })
      .toBuffer()
    if (paso3.length < Comprimido.length) {
      Comprimido = paso3
    }
  }

  return Comprimido.length < inputBuffer.length ? Comprimido : inputBuffer
}

/**
 * Re-optimiza en segundo plano las imágenes ya existentes en el bucket Backblaze B2
 * que pesen más de 75 KB, manteniendo exactamente la misma Key/URL.
 */
export async function optimizarImagenesExistentesB2(): Promise<{
  optimizadas: number
  ahorroKB: number
}> {
  if (!entorno.b2.endpoint || !entorno.b2.bucketName || !entorno.b2.keyId || !entorno.b2.applicationKey) {
    return { optimizadas: 0, ahorroKB: 0 }
  }

  const client = getS3Client()
  let optimizadas = 0
  let bytesAhorrados = 0

  try {
    const listRes = await client.send(
      new ListObjectsV2Command({
        Bucket: entorno.b2.bucketName,
        Prefix: 'bitacora/',
      })
    )

    const objetos = listRes.Contents || []
    for (const obj of objetos) {
      if (!obj.Key || !obj.Size || obj.Size <= 72 * 1024) continue
      const esImg = /\.(jpg|jpeg|png|webp)$/i.test(obj.Key)
      if (!esImg) continue

      try {
        const getRes = await client.send(
          new GetObjectCommand({
            Bucket: entorno.b2.bucketName,
            Key: obj.Key,
          })
        )
        if (!getRes.Body) continue
        const bytes = await getRes.Body.transformToByteArray()
        const originalBuf = Buffer.from(bytes)
        const nuevoBuf = await comprimirBufferImagenOptimo(originalBuf)

        if (nuevoBuf.length < originalBuf.length - 5 * 1024) {
          await client.send(
            new PutObjectCommand({
              Bucket: entorno.b2.bucketName,
              Key: obj.Key,
              Body: nuevoBuf,
              ContentLength: nuevoBuf.length,
              ContentType: 'image/jpeg',
            })
          )
          optimizadas++
          bytesAhorrados += originalBuf.length - nuevoBuf.length
        }
      } catch (_) {}
    }
  } catch (err) {
    console.warn('⚠️ No se pudo ejecutar la optimización de imágenes previas en B2:', err)
  }

  return {
    optimizadas,
    ahorroKB: Math.round(bytesAhorrados / 1024),
  }
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

  if (!optimizacionExistentesIniciada) {
    optimizacionExistentesIniciada = true
    void optimizarImagenesExistentesB2()
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
): Promise<{ urlStorage: string; key: string; proveedor: string; tamanioKB?: number; mensaje?: string }> {
  if (!entorno.b2.endpoint || !entorno.b2.bucketName || !entorno.b2.keyId || !entorno.b2.applicationKey) {
    console.warn('⚠️ Subida en modo simulación por falta de credenciales de Backblaze B2')
    return {
      urlStorage: `https://dummyimage.com/600x400/000/fff&text=Simulacion+B2`,
      key: `simulacion/${Date.now()}_${nombreArchivo}`,
      proveedor: 'mock-local',
      tamanioKB: 52,
      mensaje: 'Advertencia: Faltan credenciales B2, se usó simulador',
    }
  }

  if (!optimizacionExistentesIniciada) {
    optimizacionExistentesIniciada = true
    void optimizarImagenesExistentesB2()
  }

  let bodyBuffer: Buffer
  if (typeof bufferOrBase64 === 'string') {
    const base64Data = bufferOrBase64.replace(/^data:image\/\w+;base64,/, '')
    bodyBuffer = Buffer.from(base64Data, 'base64')
  } else {
    bodyBuffer = bufferOrBase64
  }

  // Optimización y compresión con Sharp en el Backend antes de guardar en Backblaze B2 (~35KB - 65KB por foto)
  if (contentType.startsWith('image/')) {
    try {
      bodyBuffer = await comprimirBufferImagenOptimo(bodyBuffer)
      contentType = 'image/jpeg'
    } catch (sharpError) {
      console.warn('⚠️ No se pudo procesar con Sharp, subiendo buffer original:', sharpError)
    }
  }

  const key = `${carpeta}/${Date.now()}_${nombreArchivo.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const tamanioKB = Math.max(1, Math.round(bodyBuffer.length / 1024))

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
  const endpointHost = entorno.b2.endpoint.replace(/^https?:\/\//, '')
  const urlStorage = `https://${entorno.b2.bucketName}.${endpointHost}/${key}`

  return {
    urlStorage,
    key,
    proveedor: 'backblaze-b2',
    tamanioKB,
  }
}

// Ejecutar optimización de imágenes previas (> 72 KB) al iniciar el servicio
setTimeout(() => {
  if (!optimizacionExistentesIniciada) {
    optimizacionExistentesIniciada = true
    void optimizarImagenesExistentesB2()
  }
}, 2000)

