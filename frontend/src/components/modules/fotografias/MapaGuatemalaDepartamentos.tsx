'use client'

import React, { useMemo, useState } from 'react'
import { MapPin } from 'lucide-react'

export interface DeptoData {
  id: string
  nombre: string
  cabecera: string
  path: string
  centro: [number, number]
}

// 22 Departamentos de Guatemala con geometría exacta
export const DEPARTAMENTOS_OFICIALES: DeptoData[] = [
  // 1. PETÉN
  {
    id: 'peten',
    nombre: 'Petén',
    cabecera: 'Flores',
    path: 'M 132 46 L 285 46 L 285 180 L 225 180 L 210 205 L 180 205 L 185 220 L 180 238 L 165 240 L 165 220 L 150 200 L 150 178 L 135 155 L 140 145 L 130 135 L 135 110 L 125 105 L 135 90 L 90 90 L 95 80 L 132 80 Z',
    centro: [208, 120],
  },
  // 2. HUEHUETENANGO
  {
    id: 'huehuetenango',
    nombre: 'Huehuetenango',
    cabecera: 'Huehuetenango',
    path: 'M 65 195 L 165 195 L 150 220 L 120 250 L 105 285 L 85 280 L 60 270 L 40 250 L 45 220 Z',
    centro: [100, 235],
  },
  // 3. QUICHÉ
  {
    id: 'quiche',
    nombre: 'Quiché',
    cabecera: 'Santa Cruz del Quiché',
    path: 'M 165 195 L 185 200 L 160 230 L 165 255 L 210 260 L 210 280 L 185 285 L 165 285 L 145 305 L 120 305 L 105 285 L 120 250 L 150 220 Z',
    centro: [155, 255],
  },
  // 4. ALTA VERAPAZ
  {
    id: 'alta_verapaz',
    nombre: 'Alta Verapaz',
    cabecera: 'Cobán',
    path: 'M 185 200 L 210 205 L 225 180 L 285 180 L 265 230 L 240 225 L 225 250 L 210 250 L 195 270 L 175 270 L 160 255 L 160 230 Z',
    centro: [215, 225],
  },
  // 5. IZABAL
  {
    id: 'izabal',
    nombre: 'Izabal',
    cabecera: 'Puerto Barrios',
    path: 'M 285 180 L 335 188 L 340 170 L 355 178 L 380 230 L 320 270 L 290 270 L 285 260 L 265 260 L 250 240 L 265 230 Z',
    centro: [315, 230],
  },
  // 6. SAN MARCOS
  {
    id: 'san_marcos',
    nombre: 'San Marcos',
    cabecera: 'San Marcos',
    path: 'M 35 265 L 60 270 L 80 280 L 70 310 L 45 325 L 25 285 Z',
    centro: [50, 290],
  },
  // 7. QUETZALTENANGO
  {
    id: 'quetzaltenango',
    nombre: 'Quetzaltenango',
    cabecera: 'Quetzaltenango',
    path: 'M 70 310 L 85 305 L 90 325 L 75 345 L 45 345 L 45 325 Z',
    centro: [68, 328],
  },
  // 8. TOTONICAPÁN
  {
    id: 'totonicapan',
    nombre: 'Totonicapán',
    cabecera: 'Totonicapán',
    path: 'M 85 280 L 105 285 L 115 305 L 95 325 L 85 305 Z',
    centro: [98, 300],
  },
  // 9. SOLOLÁ
  {
    id: 'solola',
    nombre: 'Sololá',
    cabecera: 'Sololá',
    path: 'M 90 325 L 125 325 L 120 345 L 85 345 Z',
    centro: [105, 335],
  },
  // 10. RETALHULEU
  {
    id: 'retalhuleu',
    nombre: 'Retalhuleu',
    cabecera: 'Retalhuleu',
    path: 'M 40 335 L 75 345 L 65 375 L 45 375 L 30 350 Z',
    centro: [52, 355],
  },
  // 11. SUCHITEPÉQUEZ
  {
    id: 'suchitepequez',
    nombre: 'Suchitepéquez',
    cabecera: 'Mazatenango',
    path: 'M 75 345 L 120 345 L 115 370 L 95 370 L 85 390 L 65 375 Z',
    centro: [92, 365],
  },
  // 12. BAJA VERAPAZ
  {
    id: 'baja_verapaz',
    nombre: 'Baja Verapaz',
    cabecera: 'Salamá',
    path: 'M 145 285 L 195 270 L 215 290 L 185 315 L 155 310 Z',
    centro: [178, 295],
  },
  // 13. CHIMALTENANGO
  {
    id: 'chimaltenango',
    nombre: 'Chimaltenango',
    cabecera: 'Chimaltenango',
    path: 'M 120 305 L 155 310 L 155 350 L 120 350 L 125 325 Z',
    centro: [138, 330],
  },
  // 14. SACATEPÉQUEZ
  {
    id: 'sacatepequez',
    nombre: 'Sacatepéquez',
    cabecera: 'Antigua Guatemala',
    path: 'M 145 330 L 165 330 L 165 355 L 145 355 Z',
    centro: [155, 342],
  },
  // 15. GUATEMALA
  {
    id: 'guatemala',
    nombre: 'Guatemala',
    cabecera: 'Ciudad de Guatemala',
    path: 'M 155 310 L 185 315 L 195 340 L 175 365 L 155 350 Z',
    centro: [172, 335],
  },
  // 16. EL PROGRESO
  {
    id: 'el_progreso',
    nombre: 'El Progreso',
    cabecera: 'Guastatoya',
    path: 'M 185 300 L 235 290 L 240 325 L 195 330 Z',
    centro: [210, 312],
  },
  // 17. ZACAPA
  {
    id: 'zacapa',
    nombre: 'Zacapa',
    cabecera: 'Zacapa',
    path: 'M 235 285 L 295 270 L 290 310 L 240 320 Z',
    centro: [265, 295],
  },
  // 18. CHIQUIMULA
  {
    id: 'chiquimula',
    nombre: 'Chiquimula',
    cabecera: 'Chiquimula',
    path: 'M 245 320 L 295 310 L 290 350 L 245 345 Z',
    centro: [270, 330],
  },
  // 19. JALAPA
  {
    id: 'jalapa',
    nombre: 'Jalapa',
    cabecera: 'Jalapa',
    path: 'M 195 330 L 245 320 L 250 355 L 195 355 Z',
    centro: [220, 340],
  },
  // 20. ESCUINTLA
  {
    id: 'escuintla',
    nombre: 'Escuintla',
    cabecera: 'Escuintla',
    path: 'M 85 385 L 165 365 L 165 400 L 90 395 Z',
    centro: [130, 385],
  },
  // 21. SANTA ROSA
  {
    id: 'santa_rosa',
    nombre: 'Santa Rosa',
    cabecera: 'Cuilapa',
    path: 'M 165 365 L 210 360 L 200 405 L 165 395 Z',
    centro: [185, 380],
  },
  // 22. JUTIAPA
  {
    id: 'jutiapa',
    nombre: 'Jutiapa',
    cabecera: 'Jutiapa',
    path: 'M 210 355 L 285 345 L 265 390 L 205 390 Z',
    centro: [245, 370],
  },
]

// Detección automática de departamento
export function inferirDepartamento(texto: string = ''): DeptoData {
  const norm = texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  for (const dep of DEPARTAMENTOS_OFICIALES) {
    const n = dep.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const c = dep.cabecera.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (norm.includes(n) || norm.includes(c)) return dep
  }

  // Alias comunes
  if (norm.includes('palencia') || norm.includes('zona') || norm.includes('villa nueva') || norm.includes('mixco') || norm.includes('capital') || norm.includes('atlantico')) {
    return DEPARTAMENTOS_OFICIALES.find((d) => d.id === 'guatemala')!
  }
  if (norm.includes('antigua') || norm.includes('sacatepequez')) {
    return DEPARTAMENTOS_OFICIALES.find((d) => d.id === 'sacatepequez')!
  }
  if (norm.includes('palin') || norm.includes('puerto quetzal') || norm.includes('costa sur')) {
    return DEPARTAMENTOS_OFICIALES.find((d) => d.id === 'escuintla')!
  }
  if (norm.includes('coban') || norm.includes('carcha') || norm.includes('verapaz')) {
    return DEPARTAMENTOS_OFICIALES.find((d) => d.id === 'alta_verapaz')!
  }
  if (norm.includes('xela') || norm.includes('quetzaltenango')) {
    return DEPARTAMENTOS_OFICIALES.find((d) => d.id === 'quetzaltenango')!
  }
  if (norm.includes('puerto barrios') || norm.includes('izabal') || norm.includes('morales')) {
    return DEPARTAMENTOS_OFICIALES.find((d) => d.id === 'izabal')!
  }

  return DEPARTAMENTOS_OFICIALES.find((d) => d.id === 'guatemala')!
}

interface MapaGuatemalaDepartamentosProps {
  ubicacion?: string
  departamentoSeleccionado?: string
  className?: string
  compacto?: boolean
  soloMapa?: boolean
  fondoTransparente?: boolean
}

export function MapaGuatemalaDepartamentos({
  ubicacion = '',
  departamentoSeleccionado,
  className = '',
  compacto = true,
  soloMapa = false,
  fondoTransparente = false,
}: MapaGuatemalaDepartamentosProps) {
  const [hovered, setHovered] = useState<DeptoData | null>(null)

  const deptoActivo = useMemo(() => {
    if (departamentoSeleccionado) {
      const match = DEPARTAMENTOS_OFICIALES.find(
        (d) =>
          d.id === departamentoSeleccionado.toLowerCase() ||
          d.nombre.toLowerCase() === departamentoSeleccionado.toLowerCase()
      )
      if (match) return match
    }
    return inferirDepartamento(ubicacion)
  }, [ubicacion, departamentoSeleccionado])

  if (soloMapa) {
    return (
      <div className={`relative flex items-center justify-center select-none ${className}`}>
        <svg
          viewBox="0 0 400 440"
          className={`${compacto ? 'h-52 sm:h-64' : 'h-72 sm:h-80'} w-auto max-w-full drop-shadow-xl transition-all`}
        >
          <defs>
            <filter id="neonGlowSolo" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="5" result="blur1" />
              <feGaussianBlur stdDeviation="10" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g>
            {DEPARTAMENTOS_OFICIALES.map((dep) => {
              const esActivo = dep.id === deptoActivo.id
              const esHover = hovered?.id === dep.id

              return (
                <g
                  key={dep.id}
                  onMouseEnter={() => setHovered(dep)}
                  onMouseLeave={() => setHovered(null)}
                  className="cursor-pointer transition-all duration-200"
                >
                  <path
                    d={dep.path}
                    fill={esActivo ? '#DC2626' : esHover ? '#3F3F46' : '#1E293B'}
                    stroke={esActivo ? '#FFFFFF' : '#475569'}
                    strokeWidth={esActivo ? '2.5' : '1.2'}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    filter={esActivo ? 'url(#neonGlowSolo)' : undefined}
                    className="transition-colors duration-300"
                  />

                  {dep.id === 'izabal' && (
                    <path
                      d="M 285 220 C 300 210, 320 220, 330 200 C 320 205, 300 215, 285 220 Z"
                      fill="#0F172A"
                      stroke="#64748B"
                      strokeWidth="1"
                    />
                  )}

                  {esActivo && (
                    <g transform={`translate(${dep.centro[0]}, ${dep.centro[1]})`}>
                      <circle r="8" fill="#EF4444" opacity="0.4" />
                      <circle r="6" fill="#FFFFFF" />
                      <circle r="3.5" fill="#9B0F06" />
                    </g>
                  )}
                </g>
              )
            })}
          </g>
        </svg>

        {hovered && (
          <div className="absolute bottom-2 bg-gray-900/95 px-2.5 py-1 rounded-md text-[10px] font-bold text-white border border-gray-700 pointer-events-none shadow-lg backdrop-blur-xs">
            {hovered.nombre} ({hovered.cabecera})
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`relative flex flex-col items-center ${fondoTransparente ? 'bg-transparent text-gray-800' : 'bg-black/85 backdrop-blur-md text-white border border-white/15 p-2.5 shadow-2xl'} rounded-xl select-none ${className}`}>
      {/* Header Compacto con el Departamento Alumbrado */}
      <div className={`w-full flex items-center justify-between gap-1.5 border-b ${fondoTransparente ? 'border-gray-200' : 'border-white/10'} pb-1.5 mb-1.5`}>
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-red-600/30 text-red-400 shrink-0">
            <MapPin size={11} />
          </div>
          <div className="min-w-0">
            <span className="text-[7.5px] font-bold uppercase tracking-wider text-gray-400 block leading-tight">
              Departamento
            </span>
            <p className={`text-[11px] font-black ${fondoTransparente ? 'text-gray-900' : 'text-white'} truncate leading-tight`}>
              {deptoActivo.nombre}
            </p>
          </div>
        </div>

        <span className="rounded bg-red-600 px-1.5 py-0.5 text-[8.5px] font-black text-white shrink-0 shadow-xs">
          DEPARTAMENTO
        </span>
      </div>

      {/* SVG del Mapa de Guatemala en Negro Completo con el Departamento Alumbrado */}
      <div className="relative flex items-center justify-center w-full py-1">
        <svg
          viewBox="0 0 400 440"
          className={`${compacto ? 'h-36 sm:h-40' : 'h-52'} w-auto max-w-full drop-shadow-md transition-all`}
        >
          {/* Filtro de resplandor neón para el departamento alumbrado */}
          <defs>
            <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="5" result="blur1" />
              <feGaussianBlur stdDeviation="10" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grupo de Departamentos: Todo en Negro (#18181B / #09090B), el detectado Alumbra con resplandor */}
          <g>
            {DEPARTAMENTOS_OFICIALES.map((dep) => {
              const esActivo = dep.id === deptoActivo.id
              const esHover = hovered?.id === dep.id

              return (
                <g
                  key={dep.id}
                  onMouseEnter={() => setHovered(dep)}
                  onMouseLeave={() => setHovered(null)}
                  className="cursor-pointer transition-all duration-200"
                >
                  {/* Polígono del Departamento */}
                  <path
                    d={dep.path}
                    fill={esActivo ? '#DC2626' : esHover ? '#27272A' : '#0F172A'}
                    stroke={esActivo ? '#FFFFFF' : '#334155'}
                    strokeWidth={esActivo ? '2.5' : '1.2'}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    filter={esActivo ? 'url(#neonGlow)' : undefined}
                    className="transition-colors duration-300"
                  />

                  {/* Lago de Izabal */}
                  {dep.id === 'izabal' && (
                    <path
                      d="M 285 220 C 300 210, 320 220, 330 200 C 320 205, 300 215, 285 220 Z"
                      fill="#020617"
                      stroke="#475569"
                      strokeWidth="1"
                    />
                  )}

                  {/* Pin de ubicación brillante en el centro del departamento activo */}
                  {esActivo && (
                    <g transform={`translate(${dep.centro[0]}, ${dep.centro[1]})`}>
                      <circle r="8" fill="#EF4444" opacity="0.4" />
                      <circle r="6" fill="#FFFFFF" />
                      <circle r="3.5" fill="#9B0F06" />
                    </g>
                  )}
                </g>
              )
            })}
          </g>
        </svg>

        {/* Tooltip flotante */}
        {hovered && (
          <div className="absolute bottom-1 bg-black/90 px-2 py-0.5 rounded text-[8.5px] font-bold text-white border border-white/20 pointer-events-none shadow-md">
            {hovered.nombre} ({hovered.cabecera})
          </div>
        )}
      </div>

      {/* Pie de mini-mapa */}
      <div className="w-full flex items-center justify-between text-[8px] text-gray-400 pt-1 border-t border-white/10 font-mono">
        <span className="truncate max-w-[100px]">📍 {deptoActivo.cabecera}</span>
        <span className="text-red-400 font-bold">Guatemala</span>
      </div>
    </div>
  )
}

export default MapaGuatemalaDepartamentos
