import { supabase, isSupabaseConfigured } from './client'
import { DocumentoProyecto } from '@/types/proyecto'

export const BUCKET_DOCUMENTOS = 'documentos-proyectos'
export const BUCKET_REPORTES = 'reportes-domun'
export const BUCKET_RESPALDOS = 'respaldos-sistema'

export function formatearBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function detectarTipoDocumento(
  nombreArchivo: string,
  mimeType?: string
): 'pdf' | 'excel' | 'word' | 'imagen' | 'otro' {
  const ext = nombreArchivo.split('.').pop()?.toLowerCase() || ''

  if (ext === 'pdf' || mimeType?.includes('pdf')) return 'pdf'
  if (['xlsx', 'xls', 'csv'].includes(ext) || mimeType?.includes('sheet') || mimeType?.includes('excel')) {
    return 'excel'
  }
  if (['docx', 'doc'].includes(ext) || mimeType?.includes('word')) return 'word'
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext) || mimeType?.startsWith('image/')) {
    return 'imagen'
  }
  return 'otro'
}

/**
 * Comprime imágenes en el navegador usando un Canvas antes de subirlas al bucket.
 * Reduce el peso en un 70%-90% sin pérdida perceptible de calidad.
 */
export async function comprimirImagenClientSide(
  file: File,
  maxDimension = 1920,
  calidad = 0.82
): Promise<{ blob: Blob; tamanioFormateado: string; urlData: string }> {
  return new Promise((resolve) => {
    // Si no es imagen soportada para canvas, retornar el archivo original
    if (!file.type.startsWith('image/') || file.type.includes('svg')) {
      const formatted = formatearBytes(file.size)
      const url = URL.createObjectURL(file)
      resolve({ blob: file, tamanioFormateado: formatted, urlData: url })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          } else {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          const url = URL.createObjectURL(file)
          resolve({ blob: file, tamanioFormateado: formatearBytes(file.size), urlData: url })
          return
        }

        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              const url = URL.createObjectURL(file)
              resolve({ blob: file, tamanioFormateado: formatearBytes(file.size), urlData: url })
              return
            }

            const formatted = formatearBytes(blob.size)
            const urlData = canvas.toDataURL('image/jpeg', calidad)
            resolve({ blob, tamanioFormateado: formatted, urlData })
          },
          'image/jpeg',
          calidad
        )
      }
      img.onerror = () => {
        const url = URL.createObjectURL(file)
        resolve({ blob: file, tamanioFormateado: formatearBytes(file.size), urlData: url })
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}

export interface SubirDocumentoParams {
  file: File
  categoria: string
  proyectoId?: string
  nombreCustom?: string
  subidoPor?: string
}

/**
 * Sube un documento al bucket de Supabase con compresión automática y fallback seguro
 */
export async function subirDocumentoProyecto({
  file,
  categoria,
  proyectoId = 'general',
  nombreCustom,
  subidoPor = 'Usuario Actual',
}: SubirDocumentoParams): Promise<DocumentoProyecto> {
  const tipo = detectarTipoDocumento(file.name, file.type)
  const fechaHoy = new Date().toISOString().split('T')[0]
  const docId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
  const nombreFinal = nombreCustom || file.name

  let blobParaSubir: Blob = file
  let tamanioFormateado = formatearBytes(file.size)
  let urlFinal = ''

  // Si es imagen, comprimir antes de almacenar
  if (tipo === 'imagen') {
    try {
      const resultadoCompresion = await comprimirImagenClientSide(file)
      blobParaSubir = resultadoCompresion.blob
      tamanioFormateado = resultadoCompresion.tamanioFormateado
      urlFinal = resultadoCompresion.urlData
    } catch (err) {
      console.warn('No se pudo comprimir la imagen:', err)
    }
  }

  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Supabase Storage no está configurado; el documento no puede persistirse.')
  }

  try {
    const sanitizedName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const sanitizedCategoria = categoria.toLowerCase().replace(/[^a-z0-9_-]/g, '_')
    const storagePath = `${proyectoId}/${sanitizedCategoria}/${sanitizedName}`

    const { data, error } = await supabase.storage
      .from(BUCKET_DOCUMENTOS)
      .upload(storagePath, blobParaSubir, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || 'application/octet-stream',
      })

    if (error) {
      throw new Error(`[Supabase Storage] Error subiendo al bucket ${BUCKET_DOCUMENTOS}: ${error.message}`)
    }

    const publicUrl = data?.path
      ? supabase.storage.from(BUCKET_DOCUMENTOS).getPublicUrl(data.path).data.publicUrl
      : ''
    if (!publicUrl) {
      throw new Error('[Supabase Storage] La subida no devolvió una URL pública.')
    }
    urlFinal = publicUrl
  } catch (storageErr) {
    console.error('[Supabase Storage] Excepción durante la subida:', storageErr)
    throw storageErr
  }

  return {
    id: docId,
    nombre: nombreFinal,
    tipo,
    tamanio: tamanioFormateado,
    fechaSubida: fechaHoy,
    subidoPor,
    categoria,
    url: urlFinal,
  }
}

/**
 * Sube un reporte oficial generado (en formato PDF o HTML) al bucket 'reportes-domun' de Supabase Storage.
 * Retorna la URL pública y el path dentro del bucket.
 */
export async function subirReporteSupabase(
  archivoBlob: Blob | File,
  nombreArchivo: string,
  proyectoId = 'general'
): Promise<{ url: string; path: string }> {
  const sanitizedName = `${Date.now()}_${nombreArchivo.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const storagePath = `${proyectoId}/${sanitizedName}`

  if (!isSupabaseConfigured() || !supabase) {
    const urlLocal = URL.createObjectURL(archivoBlob)
    return { url: urlLocal, path: storagePath }
  }

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_REPORTES)
      .upload(storagePath, archivoBlob, {
        cacheControl: '3600',
        upsert: true,
        contentType: archivoBlob.type || 'text/html;charset=utf-8',
      })

    if (error) {
      console.warn(`[Supabase Storage] Aviso subiendo a ${BUCKET_REPORTES}:`, error.message)
      const urlLocal = URL.createObjectURL(archivoBlob)
      return { url: urlLocal, path: storagePath }
    }

    const publicUrl = data?.path
      ? supabase.storage.from(BUCKET_REPORTES).getPublicUrl(data.path).data.publicUrl
      : ''

    return {
      url: publicUrl || URL.createObjectURL(archivoBlob),
      path: data?.path || storagePath,
    }
  } catch (storageErr) {
    console.warn('[Supabase Storage] Excepción al subir reporte:', storageErr)
    return { url: URL.createObjectURL(archivoBlob), path: storagePath }
  }
}

/**
 * Sube una copia de seguridad SQL directamente al bucket 'respaldos-sistema'
 */
export async function subirRespaldoSupabase(
  contenidoSql: string | Blob,
  nombreArchivo: string
): Promise<{ url: string; path: string }> {
  const blob = typeof contenidoSql === 'string'
    ? new Blob([contenidoSql], { type: 'application/sql;charset=utf-8' })
    : contenidoSql

  const storagePath = `backups/${nombreArchivo}`

  if (!isSupabaseConfigured() || !supabase) {
    const urlLocal = URL.createObjectURL(blob)
    return { url: urlLocal, path: storagePath }
  }

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_RESPALDOS)
      .upload(storagePath, blob, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'application/sql',
      })

    if (error) {
      console.warn(`[Supabase Storage] Aviso subiendo a ${BUCKET_RESPALDOS}:`, error.message)
      const urlLocal = URL.createObjectURL(blob)
      return { url: urlLocal, path: storagePath }
    }

    const publicUrl = data?.path
      ? supabase.storage.from(BUCKET_RESPALDOS).getPublicUrl(data.path).data.publicUrl
      : ''

    return {
      url: publicUrl || URL.createObjectURL(blob),
      path: data?.path || storagePath,
    }
  } catch (err) {
    console.warn('[Supabase Storage] Excepción al subir respaldo:', err)
    return { url: URL.createObjectURL(blob), path: storagePath }
  }
}
