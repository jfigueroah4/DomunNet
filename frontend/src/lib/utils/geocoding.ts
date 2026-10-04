/**
 * Utility for bi-directional Geocoding in Guatemala (OSM / Nominatim)
 * Converts Coordinates -> Address + Department + Municipality
 * Converts Address -> Coordinates + Department + Municipality
 */

export interface GeocodingResult {
  lat: number
  lng: number
  direccion: string
  departamento: string
  municipio: string
}

export async function geocodeReverse(lat: number, lng: number): Promise<GeocodingResult | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: { 'Accept-Language': 'es' },
        signal: controller.signal,
      }
    )
    clearTimeout(timeoutId)

    if (!res.ok) return null
    const data = await res.json()
    const addr = data.address || {}

    const departamento = addr.state || addr.province || addr.region || 'Guatemala'
    const municipio =
      addr.municipality || addr.city || addr.town || addr.village || addr.county || addr.suburb || 'Guatemala'
    const road = addr.road || addr.pedestrian || addr.highway || addr.suburb || ''

    const partesUbicacion = [road, municipio, departamento].filter(Boolean)
    const direccionFormateada =
      partesUbicacion.length > 0 ? partesUbicacion.join(', ') : data.display_name?.split(',').slice(0, 3).join(', ')

    return {
      lat,
      lng,
      direccion: direccionFormateada || `Ubicación (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
      departamento: departamento.replace(/Department|Departamento de /gi, '').trim(),
      municipio: municipio.trim(),
    }
  } catch {
    return null
  }
}

export async function geocodeForward(query: string): Promise<GeocodingResult | null> {
  if (!query || query.trim().length < 3) return null

  try {
    const qWithCountry = query.toLowerCase().includes('guatemala') ? query : `${query}, Guatemala`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4500)

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        qWithCountry
      )}&countrycodes=gt&addressdetails=1&limit=1`,
      {
        headers: { 'Accept-Language': 'es' },
        signal: controller.signal,
      }
    )
    clearTimeout(timeoutId)

    if (!res.ok) return null
    const list = await res.json()
    if (!Array.isArray(list) || list.length === 0) return null

    const item = list[0]
    const lat = parseFloat(item.lat)
    const lng = parseFloat(item.lon)
    if (isNaN(lat) || isNaN(lng)) return null

    const addr = item.address || {}
    const departamento = addr.state || addr.province || addr.region || 'Guatemala'
    const municipio =
      addr.municipality || addr.city || addr.town || addr.village || addr.county || addr.suburb || 'Guatemala'

    return {
      lat,
      lng,
      direccion: item.display_name?.split(',').slice(0, 3).join(', ') || query,
      departamento: departamento.replace(/Department|Departamento de /gi, '').trim(),
      municipio: municipio.trim(),
    }
  } catch {
    return null
  }
}
