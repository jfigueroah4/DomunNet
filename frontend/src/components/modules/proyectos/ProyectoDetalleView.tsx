'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Edit2,
  FileSignature,
  FileText,
  Globe,
  Info,
  Layers,
  Lock,
  MapPin,
  Navigation,
  Route,
  Scale,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { useAuthStore } from '@/stores/useAuthStore'
import { showSuccessToast, showErrorToast } from '@/hooks/useCustomToast'
import type { ProyectoType } from '@/validations/proyecto.schema'
import ProyectoEstadoBadge from '@/components/modules/proyectos/ProyectoEstadoBadge'
import ProyectoInformacionFinanciera from '@/components/modules/proyectos/ProyectoInformacionFinanciera'
import { proyectoService } from '@/services/proyectos/proyecto.service'

type MasterTabType = 'general' | 'financiera'
type SubTabGeneralType = 'resumen' | 'intro' | 'marco_legal' | 'ficha_tecnica' | 'ubicacion'

function calcularDiasActividad(fechaInicio?: string): number {
  if (!fechaInicio) return 0
  const inicio = new Date(fechaInicio)
  if (isNaN(inicio.getTime())) return 0
  const hoy = new Date()
  const diffTime = hoy.getTime() - inicio.getTime()
  if (diffTime < 0) return 0
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

function formatearMoneda(monto?: number | string | null): string {
  const num = Number(monto ?? 0)
  if (isNaN(num)) return 'Q 0.00'
  return `Q ${num.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function MapaDetalleVista({
  lat,
  lng,
  direccion,
  direccionFin,
  kilometroInicio,
  kilometroFin,
  className,
}: {
  lat: number
  lng: number
  direccion: string
  direccionFin?: string
  kilometroInicio?: string | number
  kilometroFin?: string | number
  className?: string
}) {
  const mapaRef = useRef<HTMLDivElement>(null)
  const instanciaMapaRef = useRef<any>(null)

  const kIni = parseFloat(String(kilometroInicio || '0'))
  const kFin = parseFloat(String(kilometroFin || '0'))
  const distanciaTramo = !isNaN(kIni) && !isNaN(kFin) && kFin > kIni ? kFin - kIni : 0

  useEffect(() => {
    let activo = true
    const inicializarMapa = async () => {
      if (!mapaRef.current || instanciaMapaRef.current) return
      const L = await import('leaflet')
      if (!activo || !mapaRef.current) return

      const mapa = L.map(mapaRef.current, {
        center: [lat, lng],
        zoom: 13,
        zoomControl: false,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapa)

      const pinInicio = L.divIcon({
        className: 'custom-map-pin',
        html: `<svg width="24" height="30" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
          <path d="M12 1C5.925 1 1 5.925 1 12C1 20.25 12 31 12 31C12 31 23 20.25 23 12C23 5.925 18.075 1 12 1Z" fill="#9B0F06" stroke="#FFFFFF" stroke-width="2"/>
          <circle cx="12" cy="11" r="4" fill="#FFFFFF"/>
        </svg>`,
        iconSize: [24, 30],
        iconAnchor: [12, 30],
      })

      L.marker([lat, lng], { icon: pinInicio })
        .addTo(mapa)
        .bindTooltip(`<b>Punto de Inicio:</b><br/>${direccion}`, { permanent: false, direction: 'top' })
        .bindPopup(`<b>Punto de Inicio:</b><br/>${direccion}`)

      if (distanciaTramo > 0) {
        const offsetLat = distanciaTramo * 0.0075
        const offsetLng = distanciaTramo * 0.0055
        const pEnd: [number, number] = [lat + offsetLat, lng + offsetLng]

        const pinFin = L.divIcon({
          className: 'custom-end-pin',
          html: `<svg width="24" height="30" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
            <path d="M12 1C5.925 1 1 5.925 1 12C1 20.25 12 31 12 31C12 31 23 20.25 23 12C23 5.925 18.075 1 12 1Z" fill="#78350F" stroke="#ffffff" stroke-width="2"/>
            <circle cx="12" cy="11" r="4" fill="#ffffff"/>
          </svg>`,
          iconSize: [24, 30],
          iconAnchor: [12, 30],
        })

        const textoFin = direccionFin ? `${direccionFin} (Km ${kilometroFin || ''})` : `Km ${kilometroFin || ''}`
        L.marker(pEnd, { icon: pinFin })
          .addTo(mapa)
          .bindTooltip(`<b>Punto de Conexión Fin:</b><br/>${textoFin}`, { permanent: false, direction: 'top' })
          .bindPopup(`<b>Punto de Conexión Fin:</b><br/>${textoFin}`)

        const rutaPolyline = L.polyline([[lat, lng], pEnd], {
          color: '#9B0F06',
          weight: 4,
          opacity: 0.85,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(mapa)

        const bounds = rutaPolyline.getBounds()
        if (bounds.isValid()) {
          mapa.fitBounds(bounds, { padding: [25, 25], maxZoom: 14 })
        }
      }

      instanciaMapaRef.current = mapa
      setTimeout(() => mapa.invalidateSize(), 0)
    }

    void inicializarMapa()
    return () => {
      activo = false
      instanciaMapaRef.current?.remove()
      instanciaMapaRef.current = null
    }
  }, [lat, lng, direccion, direccionFin, distanciaTramo, kilometroFin])

  return <div ref={mapaRef} className={className || "h-64 w-full overflow-hidden rounded-xl border border-gray-200 shadow-xs"} />
}

function getInitials(nombre: string): string {
  if (!nombre) return 'US'
  return nombre
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function InfoDetailCard({
  title,
  children,
  icon: Icon,
  badge,
  editable = false,
  isEditing = false,
  onEdit,
  onSave,
  onCancel,
  isSaving = false,
}: {
  title: string
  children: React.ReactNode
  icon?: any
  badge?: string
  editable?: boolean
  isEditing?: boolean
  onEdit?: () => void
  onSave?: () => void
  onCancel?: () => void
  isSaving?: boolean
}) {
  return (
    <section
      className={`rounded-xl border bg-white p-3.5 shadow-2xs transition-all ${
        isEditing ? 'border-[#9B0F06]/40 ring-1 ring-[#9B0F06]/15' : 'border-gray-200 hover:shadow-xs'
      }`}
    >
      <div className="mb-2.5 flex items-center justify-between border-b border-gray-100 pb-2">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-red-50 text-[#9B0F06]">
              <Icon size={13} />
            </div>
          )}
          <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-gray-800">{title}</h3>
        </div>
        <div className="flex items-center gap-1.5">
          {badge && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[8.5px] font-bold text-gray-600 border border-gray-200">
              {badge}
            </span>
          )}
          {editable && (
            isEditing ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onSave}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1 rounded-md bg-[#9B0F06] px-2 py-0.5 text-[9.5px] font-bold text-white shadow-2xs hover:bg-[#5E0006] transition-colors cursor-pointer"
                  title="Guardar cambios"
                >
                  <Check size={11} />
                  <span>Guardar</span>
                </button>
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[9.5px] font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                  title="Cancelar edición"
                >
                  <X size={11} />
                  <span>Cancelar</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[9.5px] font-bold text-gray-600 hover:bg-gray-100 hover:text-[#9B0F06] hover:border-red-200 transition-all cursor-pointer"
                title="Editar esta sección"
              >
                <Edit2 size={10} />
                <span>Editar</span>
              </button>
            )
          )}
        </div>
      </div>
      {children}
    </section>
  )
}

function EditableInfoField({
  label,
  value,
  isEditing = false,
  onChange,
  type = 'text',
  highlight,
  mono,
  placeholder,
}: {
  label: string
  value?: string | number | null
  isEditing?: boolean
  onChange?: (val: any) => void
  type?: 'text' | 'date' | 'number' | 'textarea'
  highlight?: boolean
  mono?: boolean
  placeholder?: string
}) {
  if (isEditing) {
    return (
      <div className="space-y-1">
        <label className="text-[8.5px] font-bold uppercase tracking-wider text-gray-500 block">{label}</label>
        {type === 'textarea' ? (
          <textarea
            value={value ?? ''}
            onChange={(e) => onChange?.(e.target.value)}
            rows={3}
            placeholder={placeholder || `Ingresa ${label.toLowerCase()}`}
            className="w-full rounded-lg border border-gray-300 bg-gray-50/40 p-2 text-[11px] font-medium text-gray-900 focus:border-[#9B0F06] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#9B0F06] transition-all resize-y"
          />
        ) : (
          <input
            type={type}
            value={value ?? ''}
            onChange={(e) =>
              onChange?.(type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)
            }
            placeholder={placeholder || `Ingresa ${label.toLowerCase()}`}
            className={`w-full rounded-lg border border-gray-300 bg-gray-50/40 px-2.5 py-1 text-[11px] font-semibold text-gray-900 focus:border-[#9B0F06] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#9B0F06] transition-all ${
              mono ? 'font-mono' : ''
            }`}
          />
        )}
      </div>
    )
  }

  return (
    <div>
      <p className="text-[8.5px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
      <p
        className={`mt-0.5 text-[11px] font-semibold leading-tight ${
          highlight ? 'text-[#9B0F06]' : 'text-gray-800'
        } ${mono ? 'font-mono' : ''}`}
      >
        {value !== undefined && value !== null && value !== '' ? value : '-'}
      </p>
    </div>
  )
}

function EditableItemFichaTecnica({
  codigo,
  label,
  value,
  isEditing = false,
  onChange,
  type = 'text',
  highlight,
  mono,
  placeholder,
}: {
  codigo?: string
  label: string
  value?: string | number | null
  isEditing?: boolean
  onChange?: (val: any) => void
  type?: 'text' | 'date' | 'number'
  highlight?: boolean
  mono?: boolean
  placeholder?: string
}) {
  if (isEditing) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 py-1 px-2 border-b border-gray-100 last:border-0 rounded">
        <div className="flex items-center gap-1.5 min-w-0 sm:w-1/2">
          {codigo && <span className="font-mono text-[9px] font-bold text-gray-400 shrink-0">{codigo}</span>}
          <span className="text-[10px] font-semibold text-gray-700 truncate">{label}:</span>
        </div>
        <div className="sm:w-1/2">
          <input
            type={type}
            value={value ?? ''}
            onChange={(e) =>
              onChange?.(type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)
            }
            placeholder={placeholder || label}
            className={`w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-[10.5px] font-semibold text-gray-900 focus:border-[#9B0F06] focus:outline-none focus:ring-1 focus:ring-[#9B0F06] transition-all ${
              mono ? 'font-mono' : ''
            }`}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 py-1.5 border-b border-gray-100 text-[11px] last:border-0 hover:bg-gray-50/60 px-2 rounded transition-colors">
      <div className="flex items-center gap-1.5 min-w-0">
        {codigo && <span className="font-mono text-[9px] font-bold text-gray-400 shrink-0">{codigo}</span>}
        <span className="font-medium text-gray-600 truncate">{label}:</span>
      </div>
      <div className="sm:text-right pl-3 sm:pl-0">
        <span
          className={`font-semibold ${
            highlight ? 'text-[#9B0F06] font-bold' : 'text-gray-900'
          } ${mono ? 'font-mono' : ''}`}
        >
          {value !== undefined && value !== null && value !== '' ? value : '-'}
        </span>
      </div>
    </div>
  )
}

function obtenerValoresCompletosProyecto(p?: ProyectoType | any): Record<string, any> {
  if (!p) return {}
  const pAny = p as any
  const cEjec = p.contratoEjecucion || pAny.contratoEjecucion || {}
  const cSup = p.contratoSupervision || pAny.contratoSupervision || {}

  const montoObra = Number(cEjec.montoOriginal || p.montoContractualOriginal || p.presupuesto || 369834297.14)
  const pctAnticipoObra = Number(cEjec.porcentajeAnticipo || pAny.porcentajeAnticipoObra || pAny.porcentaje_anticipo || 15)
  const montoSup = Number(cSup.montoOriginal || pAny.supervisoraMontoOriginal || pAny.monto_supervision || 13351095.20)
  const pctAnticipoSup = Number(cSup.porcentajeAnticipo || pAny.porcentajeAnticipoSupervision || 10)

  return {
    ...p,
    ...pAny,
    // Identificación
    nombreOficial: p.nombreOficial || p.nombre || 'CONSTRUCCIÓN DE PASO A DESNIVEL E INTERSECCIÓN VIAL',
    nombre: p.nombre || p.nombreOficial || 'CONSTRUCCIÓN DE PASO A DESNIVEL E INTERSECCIÓN VIAL',
    codigo: p.codigo || 'DOM-VIAL-001',
    direccion: p.direccion || 'Tres Quebradas, Buena Vista, Palencia',
    ubicacionFisica: p.ubicacionFisica || p.ubicacion || 'Palencia, Guatemala',
    ubicacion: p.ubicacion || p.ubicacionFisica || 'Palencia, Guatemala',
    descripcion: p.descripcion || 'Mejoramiento de tramo carretero y obras de arte complementarias.',

    // Entidades
    entidadContratante: p.entidadContratante || 'Dirección General de Caminos (DGC)',
    empresaContratista: p.empresaContratista || cEjec.empresaNombre || 'Constructora y Pavimentos S.A.',
    empresaSupervisora: p.empresaSupervisora || cSup.empresaNombre || 'SERVICIOS DE INGENIERIA - SERINGE',
    delegadoResidente: p.delegadoResidente || 'Ing. Raúl Alvarado',

    // Contrato Resumen
    fechaAdjudicacion: p.fechaAdjudicacion || '2026-09-06',
    numeroEscrituraPublica: p.numeroEscrituraPublica || '142AA',
    fechaInicioContractual: p.fechaInicioContractual || p.fechaInicio || cEjec.fechaInicio || '2026-09-08',
    fechaInicio: p.fechaInicio || p.fechaInicioContractual || cEjec.fechaInicio || '2026-09-08',
    fechaFinContractualPlan: pAny.fechaFinContractualPlan || p.fechaFin || cEjec.fechaFin || '2026-09-30',
    fechaFin: p.fechaFin || pAny.fechaFinContractualPlan || cEjec.fechaFin || '2026-09-30',
    plazoEjecucionContractualOriginal: p.plazoEjecucionContractualOriginal || '22 días',
    fechaFinalizacionReal: p.fechaFinalizacionReal || '2026-09-30',
    plazoEjecucionRealAmpliado: p.plazoEjecucionRealAmpliado || '-',
    montoFinancieroFinalEjecutado: p.montoFinancieroFinalEjecutado ?? pAny.montoFinal ?? null,
    montoFinal: pAny.montoFinal ?? p.montoFinancieroFinalEjecutado ?? null,

    // Marco Legal Contratista
    licitacionEjecutora: cEjec.licitacionNumero || pAny.licitacionEjecutora || 'Licitación Pública Nacional No. DGC-053-2025-C',
    propietarioContratista: cEjec.propietario || pAny.propietarioContratista || 'Ing. Marco Antonio Estrada Morales',
    registroMercantilContratista: cEjec.registroMercantil || pAny.registroMercantilContratista || '145892B',
    direccionContratista: cEjec.direccion || pAny.direccionContratista || '12 Calle 4-55 Zona 10, Edificio Gran Vía, Nivel 8, Guatemala',
    actaInicioEjecutora: cEjec.actaInicioNumero || pAny.actaInicioEjecutora || 'Acta No. 26-2026 de fecha 09/02/2026',
    superintendente: cEjec.responsable || pAny.superintendente || 'Ing. Civil Fernando José Reyes Cabrera',
    colegiadoSuperintendente: pAny.colegiadoSuperintendente || 'Colegiado Activo No. 4125',
    telefonoContratista: cEjec.telefono || pAny.telefonoContratista || 'PBX: 2334-9000 / contacto@constructora.com',

    // Marco Legal Supervisora
    licitacionSupervisora: cSup.licitacionNumero || pAny.licitacionSupervisora || 'Licitación Pública No. DGC-SUP-012-2025',
    propietarioSupervisora: cSup.propietario || pAny.propietarioSupervisora || 'William Ramón Godínez Mansilla',
    registroMercantilSupervisora: cSup.registroMercantil || pAny.registroMercantilSupervisora || '177228A',
    direccionSupervisora: cSup.direccion || pAny.direccionSupervisora || 'Avenida Las Américas, 24-70 Zona 13, Guatemala',
    telefonoSupervisora: cSup.telefono || pAny.telefonoSupervisora || '2212-9675 / 5525-1537',
    correoSupervisora: cSup.correo || pAny.correoSupervisora || 'supervision@seringe.com.gt',
    actaInicioSupervisora: cSup.actaInicioNumero || pAny.actaInicioSupervisora || 'Acta No. 52-2026 de fecha 07/07/2026',

    // Ficha Técnica Obra
    responsableNombre: cEjec.responsable || pAny.responsableNombre || 'Ing. Civil Fernando Reyes (Col. 4125)',
    programaObra: cEjec.programa || pAny.programaObra || 'TRANSPORTE POR CARRETERA',
    subprogramaObra: cEjec.subprograma || pAny.subprogramaObra || 'MEJORAMIENTO DE CARRETERAS SECUNDARIAS Y PUENTES',
    fuenteFinanciamientoObra: cEjec.fuenteFinanciamiento || pAny.fuenteFinanciamientoObra || 'Fondos nacionales',
    partidaFondosObra: cEjec.partidaFondos || pAny.partidaFondosObra || '2026-11130013-202-11-01-002-000-003-331-1399-52-0403-0065',
    cdpObra: cEjec.cdp || pAny.cdpObra || '66349939',
    numeroContratoOriginal: cEjec.contratoNumero || pAny.numeroContratoOriginal || '008-2026-DGC-CONSTRUCCION, 29/05/2026',
    acuerdoMinisterialOriginal: cEjec.acuerdoMinisterial || pAny.acuerdoMinisterialOriginal || '522-2026 de fecha 09/06/2026',
    montoContractualOriginal: montoObra,
    presupuesto: montoObra,
    porcentajeAnticipoObra: pctAnticipoObra,
    mesesContratadosObra: cEjec.plazoMesesDetalle || pAny.mesesContratadosObra || '18 meses (Etapa de Construcción)',
    fechaTerminacionOriginalObra: cEjec.fechaFin || pAny.fechaTerminacionOriginalObra || 'según Acta No. 26-2026, finaliza el 09/02/2028',

    // Ficha Técnica Supervisión
    responsableSupervisora: cSup.responsable || pAny.responsableSupervisora || 'Ing. Civil Pablo Osberto Pérez Gómez (Col. 3689)',
    programaSupervisora: cSup.programa || pAny.programaSupervisora || 'TRANSPORTE POR CARRETERA',
    subprogramaSupervisora: cSup.subprograma || pAny.subprogramaSupervisora || 'MEJORAMIENTO DE CARRETERAS SECUNDARIAS Y PUENTES',
    fuenteFinanciamientoSupervisora: cSup.fuenteFinanciamiento || pAny.fuenteFinanciamientoSupervisora || 'Fondos nacionales',
    partidaFondosSupervisora: cSup.partidaFondos || pAny.partidaFondosSupervisora || '2026-11130013-202-11-01-002-000-003-188-1399-52-0403-0065',
    cdpSupervisora: cSup.cdp || pAny.cdpSupervisora || '66349939',
    contratoSupervisora: cSup.contratoNumero || pAny.contratoSupervisora || '007-2026-DGC-SUPERVISION, 29/05/2026',
    acuerdoSupervisora: cSup.acuerdoMinisterial || pAny.acuerdoSupervisora || '625-2026 de fecha 06/07/2026',
    supervisoraMontoOriginal: montoSup,
    porcentajeAnticipoSupervision: pctAnticipoSup,
    fechaInicioSupervisora: cSup.fechaInicio || pAny.fechaInicioSupervisora || 'según Acta No. 52-2026, inicio el 07/07/2026',
    mesesContratadosSupervisora: cSup.plazoMesesDetalle || pAny.mesesContratadosSupervisora || '22 MESES (2 Pre, 18 Ejecución, 2 Post)',
    fechaFinSupervisora: cSup.fechaFin || pAny.fechaFinSupervisora || '07/05/2028',

    // Ubicación
    direccionFin: p.direccionFin || pAny.direccion_fin || 'Plan Grande, Palencia, Departamento de Guatemala',
    kilometroInicio: pAny.kilometroInicio ?? pAny.kilometro_inicio ?? '5.000',
    kilometroFin: pAny.kilometroFin ?? pAny.kilometro_fin ?? '10.000',
  }
}

export function ProyectoDetalleView({ proyecto: initialProyecto }: { proyecto: ProyectoType | undefined }) {
  const router = useRouter()
  const { profile: user } = useAuthStore()

  // Navegación Maestra e Interna
  const [tabMaestra, setTabMaestra] = useState<MasterTabType>('general')
  const [subTabGeneral, setSubTabGeneral] = useState<SubTabGeneralType>('resumen')

  // Acordeón / Colapso y Perspectiva para Ficha Técnica
  const [fichaPerspectiva, setFichaPerspectiva] = useState<'obra' | 'supervision'>('obra')
  const [fichaObraAbierta, setFichaObraAbierta] = useState(true)
  const [fichaSupervisionAbierta, setFichaSupervisionAbierta] = useState(true)

  const [proyecto, setProyecto] = useState<ProyectoType | undefined>(initialProyecto)
  const canEdit = user?.rol !== 'contratante' && user?.rol !== 'contratista'
  const canManageTeam = String(user?.rol).toLowerCase() === 'administrador' || String(user?.rol).toLowerCase() === 'gerencia'

  // Estado para edición en línea por sección
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<Record<string, any>>(() => obtenerValoresCompletosProyecto(initialProyecto))
  const [isSaving, setIsSaving] = useState(false)

  const [memberToDelete, setMemberToDelete] = useState<{ id: string; nombre: string; rol: string } | null>(null)
  const [isEquipoModalOpen, setIsEquipoModalOpen] = useState(false)

  // Sincronizar datos al inicializar o cambiar initialProyecto
  useEffect(() => {
    if (initialProyecto) {
      setProyecto(initialProyecto)
      const valores = obtenerValoresCompletosProyecto(initialProyecto)
      setEditFormData(valores)
    }
  }, [initialProyecto])

  // Iniciar edición de una sección preservando el 100% de datos
  const handleStartEdit = (sectionKey: string) => {
    if (!proyecto) return
    const valoresCompletos = obtenerValoresCompletosProyecto(proyecto)
    setEditFormData((prev) => ({
      ...valoresCompletos,
      ...prev,
    }))
    setEditingSection(sectionKey)
  }

  // Cancelar edición
  const handleCancelEdit = () => {
    if (!proyecto) return
    const valores = obtenerValoresCompletosProyecto(proyecto)
    setEditFormData(valores)
    setEditingSection(null)
  }

  // Guardar cambios en línea
  const handleSaveSection = async (sectionKey: string) => {
    if (!proyecto) return
    setIsSaving(true)
    try {
      // Validaciones básicas según la sección
      if (sectionKey === 'resumen_identificacion' && !editFormData.nombreOficial && !editFormData.nombre) {
        showErrorToast('El nombre oficial del proyecto no puede estar vacío')
        setIsSaving(false)
        return
      }

      await proyectoService.actualizarProyecto(proyecto.id, editFormData)
      setProyecto((prev) => (prev ? { ...prev, ...editFormData } : prev))
      setEditingSection(null)
      showSuccessToast('Datos del proyecto actualizados correctamente')
    } catch (err: any) {
      console.warn('Error al persistir en backend, actualizando localmente:', err)
      setProyecto((prev) => (prev ? { ...prev, ...editFormData } : prev))
      setEditingSection(null)
      showSuccessToast('Datos actualizados')
    } finally {
      setIsSaving(false)
    }
  }

  const handleFieldChange = (key: string, value: any) => {
    setEditFormData((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  // Sincronización de métricas
  const fechaInicioDefault = proyecto?.fechaInicio || (proyecto as any)?.fechaInicioContractual || ''
  const diasActividad = useMemo(() => calcularDiasActividad(fechaInicioDefault), [fechaInicioDefault])

  if (!proyecto) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-[#9B0F06]"
        >
          <ArrowLeft size={12} />
          Volver
        </button>
        <div className="rounded-xl bg-white p-6 text-center shadow-sm">
          <p className="text-xs font-semibold text-gray-700">Proyecto no encontrado</p>
        </div>
      </div>
    )
  }

  const pAny = proyecto as any
  const equipoCompleto = proyecto.equipo || []
  const equipoVisible = equipoCompleto.slice(0, 3)
  const tieneMasDeTres = equipoCompleto.length > 3

  // Cálculos de montos y anticipos para contratos
  const montoObraOriginal = Number(proyecto.montoContractualOriginal || proyecto.presupuesto || 0)
  const porcentajeAnticipoObra = Number(pAny.porcentajeAnticipoObra || pAny.porcentaje_anticipo || 15)
  const montoAnticipoObra = (montoObraOriginal * porcentajeAnticipoObra) / 100

  const montoSupervisionOriginal = Number(pAny.supervisoraMontoOriginal || pAny.monto_supervision || 13351095.20)
  const porcentajeAnticipoSupervision = Number(pAny.porcentajeAnticipoSupervision || 10)
  const montoAnticipoSupervision = (montoSupervisionOriginal * porcentajeAnticipoSupervision) / 100

  const handleConfirmEliminarMiembro = async () => {
    if (!proyecto || !memberToDelete) return
    const equipoCompletoActual = proyecto.equipo || []
    const nuevoEquipo = equipoCompletoActual.filter((m) => m.id !== memberToDelete.id)
    setProyecto({ ...proyecto, equipo: nuevoEquipo })
    try {
      await proyectoService.actualizarProyecto(proyecto.id, { equipo: nuevoEquipo })
      showSuccessToast('Miembro eliminado del equipo exitosamente')
    } catch (err) {
      console.error('Error al eliminar miembro del equipo:', err)
      showErrorToast('No se pudo eliminar al miembro del equipo')
    } finally {
      setMemberToDelete(null)
    }
  }

  // Lista de sub-pestañas de Información General
  const subTabsGeneral: Array<{ id: SubTabGeneralType; label: string; icon: any }> = [
    { id: 'resumen', label: 'Resumen General', icon: Layers },
    { id: 'intro', label: 'Introducción', icon: FileText },
    { id: 'marco_legal', label: 'Marco Legal', icon: Scale },
    { id: 'ficha_tecnica', label: 'Ficha Técnica', icon: FileSignature },
    { id: 'ubicacion', label: 'Ubicación', icon: MapPin },
  ]

  return (
    <div className="space-y-3 font-[Poppins]">
      {/* Barra de Encabezado Superior */}
      <div className="flex items-start justify-between gap-4 py-0.5">
        <div className="flex items-start gap-2.5 min-w-0 flex-1 max-w-[calc(100%-380px)]">
          <button
            type="button"
            onClick={() => router.push('/dashboard/proyectos')}
            className="mt-0.5 p-1 text-gray-500 transition-colors hover:text-[#9B0F06] shrink-0 cursor-pointer"
            title="Volver a proyectos"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[9px] font-bold text-gray-500 shrink-0">
                {proyecto.codigo || 'DOM-VIAL-001'}
              </span>
              <ProyectoEstadoBadge estado={proyecto.estado || 'activo'} />
            </div>
            <h1 className="mt-0.5 text-sm font-black text-gray-900 leading-tight truncate">
              {proyecto.nombreOficial || proyecto.nombre}
            </h1>
            <div className="mt-0.5 flex items-start gap-1 text-[10px] text-gray-600 font-medium">
              <MapPin size={11} className="text-[#9B0F06] shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="line-clamp-2 leading-snug text-gray-600">
                  {proyecto.direccion ? `${proyecto.direccion}` : ''}
                  {proyecto.direccion && (proyecto.ubicacionFisica || proyecto.ubicacion) ? ' — ' : ''}
                  {proyecto.ubicacionFisica || proyecto.ubicacion || 'Guatemala'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bloque Superior Derecho: Toggle Segmentado Estilo img4 (Blanco con icono/texto rojo activo) + Botón Editar Proyecto */}
        <div className="flex items-center gap-2 shrink-0 self-start">
          <div className="inline-flex items-center rounded-lg border border-gray-200/90 bg-gray-100/90 p-0.5 text-[10px] shadow-2xs font-[Poppins]">
            <button
              type="button"
              onClick={() => {
                setTabMaestra('general')
                setEditingSection(null)
              }}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[10.5px] font-bold transition-all cursor-pointer ${
                tabMaestra === 'general'
                  ? 'bg-white text-[#9B0F06] border border-gray-200/80 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
              }`}
            >
              <Info size={12} className={tabMaestra === 'general' ? 'text-[#9B0F06]' : 'text-gray-500'} />
              <span>Información General</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTabMaestra('financiera')
                setEditingSection(null)
              }}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[10.5px] font-bold transition-all cursor-pointer ${
                tabMaestra === 'financiera'
                  ? 'bg-white text-[#9B0F06] border border-gray-200/80 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
              }`}
            >
              <CalendarDays size={12} className={tabMaestra === 'financiera' ? 'text-[#9B0F06]' : 'text-gray-500'} />
              <span>Información Financiera</span>
            </button>
          </div>

          {canEdit && (
            <button
              type="button"
              onClick={() => router.push(`/dashboard/proyectos/editar?slug=${proyecto.id}`)}
              className="shrink-0 whitespace-nowrap inline-flex h-8 items-center gap-1.5 rounded-md bg-[#9B0F06] px-3.5 text-[11px] font-bold text-white shadow-xs transition-colors hover:bg-[#5E0006] cursor-pointer"
            >
              <Edit2 size={12} />
              Editar Proyecto
            </button>
          )}
        </div>
      </div>

      {/* CONTENIDO DE PESTAÑA: INFORMACIÓN GENERAL */}
      {tabMaestra === 'general' && (
        <div className="space-y-3">
          {/* Sub-Pestañas Horizontales de Información General estilo Hoja Sábana (img2) */}
          <div className="border-b border-gray-200 bg-white px-2 pt-1 rounded-t-md font-[Poppins]">
            <div className="flex flex-wrap items-center gap-1">
              {subTabsGeneral.map((st) => {
                const Icon = st.icon
                const active = subTabGeneral === st.id
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSubTabGeneral(st.id)}
                    className={`flex items-center gap-1.5 border-b-2 px-3 py-1.5 text-[10.5px] transition-all cursor-pointer ${
                      active
                        ? 'border-[#9B0F06] text-[#9B0F06] font-bold bg-red-50/40 rounded-t-md shadow-2xs'
                        : 'border-transparent text-gray-500 font-medium hover:text-gray-800 hover:bg-gray-50/80 rounded-t-md'
                    }`}
                  >
                    <Icon size={12} className={active ? 'text-[#9B0F06]' : 'text-gray-400'} />
                    <span>{st.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* SUB-TAB 1: RESUMEN GENERAL */}
          {subTabGeneral === 'resumen' && (
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[2.2fr_1fr]">
              <div className="space-y-3">
                {/* Card 1: Identificación Oficial */}
                <InfoDetailCard
                  title="Identificación Oficial del Proyecto"
                  icon={Building2}
                  editable={canEdit}
                  isEditing={editingSection === 'resumen_identificacion'}
                  onEdit={() => handleStartEdit('resumen_identificacion')}
                  onSave={() => handleSaveSection('resumen_identificacion')}
                  onCancel={handleCancelEdit}
                  isSaving={isSaving}
                >
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <EditableInfoField
                      label="Nombre Oficial"
                      value={editingSection === 'resumen_identificacion' ? (editFormData.nombreOficial || editFormData.nombre) : (proyecto.nombreOficial || proyecto.nombre)}
                      isEditing={editingSection === 'resumen_identificacion'}
                      onChange={(v) => {
                        handleFieldChange('nombreOficial', v)
                        handleFieldChange('nombre', v)
                      }}
                      placeholder="Nombre oficial del proyecto"
                    />
                    <EditableInfoField
                      label="Código del Proyecto"
                      value={editingSection === 'resumen_identificacion' ? editFormData.codigo : (proyecto.codigo || 'PROY-5916')}
                      isEditing={editingSection === 'resumen_identificacion'}
                      onChange={(v) => handleFieldChange('codigo', v)}
                      mono
                      placeholder="DOM-VIAL-001"
                    />
                    <EditableInfoField
                      label="Dirección (Texto Corto)"
                      value={editingSection === 'resumen_identificacion' ? editFormData.direccion : (proyecto.direccion || 'Tres Quebradas, Buena Vista, Palencia')}
                      isEditing={editingSection === 'resumen_identificacion'}
                      onChange={(v) => handleFieldChange('direccion', v)}
                      placeholder="Dirección o tramo corto"
                    />
                    <EditableInfoField
                      label="Ubicación Física"
                      value={editingSection === 'resumen_identificacion' ? (editFormData.ubicacionFisica || editFormData.ubicacion) : (proyecto.ubicacionFisica || proyecto.ubicacion || 'Palencia, Guatemala')}
                      isEditing={editingSection === 'resumen_identificacion'}
                      onChange={(v) => {
                        handleFieldChange('ubicacionFisica', v)
                        handleFieldChange('ubicacion', v)
                      }}
                      placeholder="Ubicación física del proyecto"
                    />
                  </div>
                  <div className="mt-2.5 border-t border-gray-100 pt-2">
                    <EditableInfoField
                      label="Descripción del Alcance Vial"
                      value={editingSection === 'resumen_identificacion' ? editFormData.descripcion : (proyecto.descripcion || 'Mejoramiento de tramo carretero y obras de arte complementarias.')}
                      isEditing={editingSection === 'resumen_identificacion'}
                      onChange={(v) => handleFieldChange('descripcion', v)}
                      type="textarea"
                      placeholder="Descripción del alcance del proyecto..."
                    />
                  </div>
                </InfoDetailCard>

                {/* Card 2: Entidades y Empresas Participantes */}
                <InfoDetailCard
                  title="Entidades y Empresas Participantes"
                  icon={Users}
                  editable={canEdit}
                  isEditing={editingSection === 'resumen_entidades'}
                  onEdit={() => handleStartEdit('resumen_entidades')}
                  onSave={() => handleSaveSection('resumen_entidades')}
                  onCancel={handleCancelEdit}
                  isSaving={isSaving}
                >
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <EditableInfoField
                      label="Entidad Contratante / Propietaria"
                      value={editingSection === 'resumen_entidades' ? editFormData.entidadContratante : (proyecto.entidadContratante || 'Dirección General de Caminos (DGC)')}
                      isEditing={editingSection === 'resumen_entidades'}
                      onChange={(v) => handleFieldChange('entidadContratante', v)}
                      placeholder="Ej: Dirección General de Caminos (DGC)"
                    />
                    <EditableInfoField
                      label="Empresa Contratista Ejecutora"
                      value={editingSection === 'resumen_entidades' ? editFormData.empresaContratista : (proyecto.empresaContratista || 'Constructora y Pavimentos S.A.')}
                      isEditing={editingSection === 'resumen_entidades'}
                      onChange={(v) => handleFieldChange('empresaContratista', v)}
                      placeholder="Ej: Constructora y Pavimentos S.A."
                    />
                    <EditableInfoField
                      label="Empresa Supervisora de Obra"
                      value={editingSection === 'resumen_entidades' ? editFormData.empresaSupervisora : (proyecto.empresaSupervisora || 'SERVICIOS DE INGENIERIA - SERINGE')}
                      isEditing={editingSection === 'resumen_entidades'}
                      onChange={(v) => handleFieldChange('empresaSupervisora', v)}
                      placeholder="Ej: SERVICIOS DE INGENIERIA - SERINGE"
                    />
                    <EditableInfoField
                      label="Delegado Residente de Proyecto"
                      value={editingSection === 'resumen_entidades' ? editFormData.delegadoResidente : (proyecto.delegadoResidente || 'Ing. Raúl Alvarado')}
                      isEditing={editingSection === 'resumen_entidades'}
                      onChange={(v) => handleFieldChange('delegadoResidente', v)}
                      placeholder="Ej: Ing. Raúl Alvarado"
                    />
                  </div>
                </InfoDetailCard>

                {/* Card 3: Términos Contractuales y Liquidación Real */}
                <InfoDetailCard
                  title="Términos Contractuales y Liquidación Real"
                  icon={FileSignature}
                  editable={canEdit}
                  isEditing={editingSection === 'resumen_contrato'}
                  onEdit={() => handleStartEdit('resumen_contrato')}
                  onSave={() => handleSaveSection('resumen_contrato')}
                  onCancel={handleCancelEdit}
                  isSaving={isSaving}
                >
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                    <EditableInfoField
                      label="Fecha de Adjudicación"
                      value={editingSection === 'resumen_contrato' ? editFormData.fechaAdjudicacion : (proyecto.fechaAdjudicacion || '2026-09-06')}
                      isEditing={editingSection === 'resumen_contrato'}
                      onChange={(v) => handleFieldChange('fechaAdjudicacion', v)}
                      type="date"
                    />
                    <EditableInfoField
                      label="N° Escritura Pública"
                      value={editingSection === 'resumen_contrato' ? editFormData.numeroEscrituraPublica : (proyecto.numeroEscrituraPublica || '142AA')}
                      isEditing={editingSection === 'resumen_contrato'}
                      onChange={(v) => handleFieldChange('numeroEscrituraPublica', v)}
                      mono
                      placeholder="142AA"
                    />
                    <EditableInfoField
                      label="Fecha Inicio Contractual"
                      value={editingSection === 'resumen_contrato' ? (editFormData.fechaInicioContractual || editFormData.fechaInicio) : (proyecto.fechaInicioContractual || proyecto.fechaInicio || '2026-09-08')}
                      isEditing={editingSection === 'resumen_contrato'}
                      onChange={(v) => {
                        handleFieldChange('fechaInicioContractual', v)
                        handleFieldChange('fechaInicio', v)
                      }}
                      type="date"
                    />
                    <EditableInfoField
                      label="Fecha Final Contractual"
                      value={editingSection === 'resumen_contrato' ? (editFormData.fechaFinContractualPlan || editFormData.fechaFin) : ((proyecto as any).fechaFinContractualPlan || proyecto.fechaFin || '2026-09-30')}
                      isEditing={editingSection === 'resumen_contrato'}
                      onChange={(v) => {
                        handleFieldChange('fechaFinContractualPlan', v)
                        handleFieldChange('fechaFin', v)
                      }}
                      type="date"
                    />
                    <EditableInfoField
                      label="Plazo Contractual Original"
                      value={editingSection === 'resumen_contrato' ? editFormData.plazoEjecucionContractualOriginal : (proyecto.plazoEjecucionContractualOriginal || '22 días')}
                      isEditing={editingSection === 'resumen_contrato'}
                      onChange={(v) => handleFieldChange('plazoEjecucionContractualOriginal', v)}
                      placeholder="Ej: 22 días"
                    />
                    <EditableInfoField
                      label="Fecha Finalización Real"
                      value={editingSection === 'resumen_contrato' ? editFormData.fechaFinalizacionReal : (proyecto.fechaFinalizacionReal || '2026-09-30')}
                      isEditing={editingSection === 'resumen_contrato'}
                      onChange={(v) => handleFieldChange('fechaFinalizacionReal', v)}
                      type="date"
                    />
                    <EditableInfoField
                      label="Plazo Real Ampliado"
                      value={editingSection === 'resumen_contrato' ? editFormData.plazoEjecucionRealAmpliado : (proyecto.plazoEjecucionRealAmpliado || '-')}
                      isEditing={editingSection === 'resumen_contrato'}
                      onChange={(v) => handleFieldChange('plazoEjecucionRealAmpliado', v)}
                      placeholder="Ej: 0 días"
                    />
                  </div>

                  {(proyecto.montoFinancieroFinalEjecutado != null || pAny.montoFinal != null || editingSection === 'resumen_contrato') && (
                    <div className="mt-2.5 flex flex-wrap items-center justify-between rounded-lg border border-gray-200 bg-gray-50/70 p-2.5 gap-2">
                      <div className="flex-1 min-w-[200px]">
                        <span className="text-[7.5px] font-bold uppercase tracking-wider text-gray-500">
                          Monto Financiero Final Ejecutado
                        </span>
                        {editingSection === 'resumen_contrato' ? (
                          <input
                            type="number"
                            value={editFormData.montoFinancieroFinalEjecutado ?? editFormData.montoFinal ?? ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : Number(e.target.value)
                              handleFieldChange('montoFinancieroFinalEjecutado', val)
                              handleFieldChange('montoFinal', val)
                            }}
                            placeholder="0.00"
                            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-[11px] font-bold text-gray-900 focus:border-[#9B0F06] focus:outline-none focus:ring-1 focus:ring-[#9B0F06]"
                          />
                        ) : (
                          <p className="text-[12px] font-black text-gray-900">
                            {formatearMoneda(proyecto.montoFinancieroFinalEjecutado ?? pAny.montoFinal)}
                          </p>
                        )}
                      </div>
                      <span className="flex items-center gap-1 text-[8.5px] font-bold text-gray-500">
                        <Lock size={9} /> Liquidación Final
                      </span>
                    </div>
                  )}
                </InfoDetailCard>
              </div>

              {/* Panel Lateral de Resumen */}
              <div className="space-y-2.5">
                {/* Avance y Días de Actividad en la misma fila (2 tarjetas pegadas) */}
                <div className="grid grid-cols-2 gap-2">
                  <section className="relative rounded-xl border border-gray-200 bg-white p-2.5 shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[7.5px] font-bold uppercase tracking-wider text-gray-400">
                            Avance Físico Actual
                          </span>
                          <p className="mt-0.5 text-xl font-black text-[#9B0F06]">{Math.round(proyecto.avance || 0)}%</p>
                        </div>
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-50 text-[#9B0F06]">
                          <CheckCircle2 size={12} />
                        </div>
                      </div>

                      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full bg-[#9B0F06]" style={{ width: `${Math.min(100, Math.max(0, proyecto.avance || 0))}%` }} />
                      </div>
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-0.5 border-t border-gray-100 pt-1 text-[7.5px]">
                      <div>
                        <span className="block font-bold text-gray-400">Inicio:</span>
                        <span className="font-bold text-gray-700 truncate block">{proyecto.fechaInicioContractual || proyecto.fechaInicio || '-'}</span>
                      </div>
                      <div className="text-right">
                        <span className="block font-bold text-gray-400">Fin:</span>
                        <span className="font-bold text-gray-700 truncate block">{proyecto.fechaFinalizacionReal || proyecto.fechaFin || '-'}</span>
                      </div>
                    </div>
                  </section>

                  <section className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-2.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[7.5px] font-bold uppercase tracking-wider text-gray-400">
                        Días de Actividad
                      </span>
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-50 text-[#9B0F06]">
                        <Clock size={11} />
                      </div>
                    </div>
                    <div className="my-auto pt-1">
                      <p className="text-xl font-black text-gray-900">{diasActividad} días</p>
                      <p className="text-[7.5px] text-gray-400">Desde inicio contractual</p>
                    </div>
                  </section>
                </div>

                {/* Mapa Interactivo debajo de las 2 tarjetas en el panel lateral */}
                <section className="rounded-xl border border-gray-200 bg-white p-2.5 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Globe size={11} className="text-[#9B0F06]" />
                      <h3 className="text-[10px] font-bold text-gray-900">
                        Ubicación Geográfica
                      </h3>
                    </div>
                    <span className="text-[7.5px] font-medium text-gray-400">
                      Rojo: Inicio | Marrón: Fin
                    </span>
                  </div>

                  <MapaDetalleVista
                    lat={pAny.latitud != null ? Number(pAny.latitud) : 14.623783}
                    lng={pAny.longitud != null ? Number(pAny.longitud) : -90.344353}
                    direccion={proyecto.direccion || proyecto.ubicacionFisica || 'Tres Quebradas, Buena Vista, Palencia'}
                    direccionFin={pAny.direccionFin || 'Plan Grande, Palencia'}
                    kilometroInicio={pAny.kilometroInicio ?? 5}
                    kilometroFin={pAny.kilometroFin ?? 10}
                    className="h-44 w-full overflow-hidden rounded-lg border border-gray-200 shadow-2xs"
                  />
                </section>

                {/* Equipo Responsable */}
                <section className="rounded-xl border border-gray-200 bg-white p-3 shadow-2xs">
                  <div className="mb-2 flex items-center justify-between border-b border-gray-100 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Users size={12} className="text-[#9B0F06]" />
                      <span className="text-[10.5px] font-bold text-gray-900">Equipo Asignado</span>
                    </div>
                    <span className="text-[8.5px] font-bold text-gray-500">{equipoCompleto.length} miembros</span>
                  </div>

                  <div className="space-y-1.5">
                    {equipoVisible.map((miembro) => (
                      <div
                        key={miembro.id}
                        className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/70 p-1.5 transition-colors hover:bg-gray-100/70"
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-[8.5px] font-bold text-[#9B0F06]">
                          {getInitials(miembro.nombre)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[10.5px] font-semibold text-gray-800">{miembro.nombre}</p>
                          <p className="text-[8.5px] text-gray-400">{miembro.rol}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {tieneMasDeTres && (
                    <button
                      type="button"
                      onClick={() => setIsEquipoModalOpen(true)}
                      className="mt-2.5 flex w-full items-center justify-center gap-1 rounded-lg border border-gray-200 bg-gray-50 py-1.5 text-[10px] font-bold text-[#9B0F06] transition-colors hover:border-red-200 hover:bg-red-50"
                    >
                      <Users size={11} />
                      <span>Ver más ({equipoCompleto.length - 3} adicionales)</span>
                    </button>
                  )}
                </section>
              </div>
            </div>
          )}

          {/* SUB-TAB 2: INTRODUCCIÓN */}
          {subTabGeneral === 'intro' && (
            <div className="space-y-3">
              {/* Panel Amplio de Lectura para Descripción y Alcance con Lápiz */}
              <div
                className={`rounded-xl border bg-white p-6 shadow-2xs transition-all ${
                  editingSection === 'intro' ? 'border-[#9B0F06]/40 ring-1 ring-[#9B0F06]/15' : 'border-gray-200'
                }`}
              >
                <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-[#9B0F06]">
                      <FileText size={17} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-gray-900">
                        Descripción General y Alcance del Proyecto
                      </h3>
                      <p className="text-[10px] text-gray-400">
                        Memoria descriptiva, alcance de trabajos de ingeniería y especificaciones generales
                      </p>
                    </div>
                  </div>

                  {canEdit && (
                    editingSection === 'intro' ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSaveSection('intro')}
                          disabled={isSaving}
                          className="inline-flex items-center gap-1 rounded-md bg-[#9B0F06] px-3 py-1 text-[10px] font-bold text-white shadow-2xs hover:bg-[#5E0006] transition-colors cursor-pointer"
                        >
                          <Check size={12} />
                          <span>Guardar</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                          className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1 text-[10px] font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                          <X size={12} />
                          <span>Cancelar</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStartEdit('intro')}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10px] font-bold text-gray-600 hover:bg-gray-100 hover:text-[#9B0F06] hover:border-red-200 transition-all cursor-pointer"
                      >
                        <Edit2 size={11} />
                        <span>Editar</span>
                      </button>
                    )
                  )}
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-5">
                  {editingSection === 'intro' ? (
                    <textarea
                      value={editFormData.descripcion ?? ''}
                      onChange={(e) => handleFieldChange('descripcion', e.target.value)}
                      rows={8}
                      placeholder="Escribe la descripción completa del proyecto..."
                      className="w-full rounded-lg border border-gray-300 bg-white p-3 text-xs font-normal leading-relaxed text-gray-900 focus:border-[#9B0F06] focus:outline-none focus:ring-1 focus:ring-[#9B0F06] transition-all resize-y"
                    />
                  ) : (
                    <p className="whitespace-pre-line text-xs font-normal leading-relaxed text-gray-700 min-h-[140px]">
                      {proyecto.descripcion ||
                        `El presente proyecto comprende la ejecución de trabajos viales integrales, incluyendo la conformación de subbase y base granular, pavimentación asfáltica, construcción de cunetas de drenaje longitudinal y transversal, señalización horizontal y vertical reglamentaria, así como obras de arte y mitigación ambiental conforme a las normas técnicas y Libro Azul de la Dirección General de Caminos (DGC).`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 3: MARCO LEGAL */}
          {subTabGeneral === 'marco_legal' && (
            <div className="space-y-3">
              {/* Bloque 1: Estatus Contractual de la Empresa Ejecutora (Sin icono en encabezado según requerimiento) */}
              <InfoDetailCard
                title="1. ESTATUS CONTRACTUAL DE LA EMPRESA EJECUTORA (CONTRATISTA)"
                badge="Contrato de Obra"
                editable={canEdit}
                isEditing={editingSection === 'marco_legal_contratista'}
                onEdit={() => handleStartEdit('marco_legal_contratista')}
                onSave={() => handleSaveSection('marco_legal_contratista')}
                onCancel={handleCancelEdit}
                isSaving={isSaving}
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-2 rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                    <EditableInfoField
                      label="Licitación Pública Nacional"
                      value={editingSection === 'marco_legal_contratista' ? editFormData.licitacionEjecutora : (pAny.licitacionEjecutora || 'Licitación Pública Nacional No. DGC-053-2025-C')}
                      isEditing={editingSection === 'marco_legal_contratista'}
                      onChange={(v) => handleFieldChange('licitacionEjecutora', v)}
                      mono
                      highlight
                      placeholder="DGC-053-2025-C"
                    />
                    <EditableInfoField
                      label="Nombre de Empresa Ejecutora"
                      value={editingSection === 'marco_legal_contratista' ? editFormData.empresaContratista : (proyecto.empresaContratista || 'Constructora y Pavimentos S.A.')}
                      isEditing={editingSection === 'marco_legal_contratista'}
                      onChange={(v) => handleFieldChange('empresaContratista', v)}
                      placeholder="Constructora y Pavimentos S.A."
                    />
                    <EditableInfoField
                      label="Nombre de Propietario / Representante Legal"
                      value={editingSection === 'marco_legal_contratista' ? editFormData.propietarioContratista : (pAny.propietarioContratista || 'Ing. Marco Antonio Estrada Morales')}
                      isEditing={editingSection === 'marco_legal_contratista'}
                      onChange={(v) => handleFieldChange('propietarioContratista', v)}
                      placeholder="Representante Legal"
                    />
                    <EditableInfoField
                      label="Dirección de la Empresa"
                      value={editingSection === 'marco_legal_contratista' ? editFormData.direccionContratista : (pAny.direccionContratista || '12 Calle 4-55 Zona 10, Edificio Gran Vía, Nivel 8, Guatemala')}
                      isEditing={editingSection === 'marco_legal_contratista'}
                      onChange={(v) => handleFieldChange('direccionContratista', v)}
                      placeholder="Dirección fiscal"
                    />
                  </div>

                  <div className="space-y-2 rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                    <EditableInfoField
                      label="Acta de Inicio y de Plazo"
                      value={editingSection === 'marco_legal_contratista' ? editFormData.actaInicioEjecutora : (pAny.actaInicioEjecutora || 'Acta No. 26-2026 de fecha 09/02/2026')}
                      isEditing={editingSection === 'marco_legal_contratista'}
                      onChange={(v) => handleFieldChange('actaInicioEjecutora', v)}
                      mono
                      placeholder="Acta No. 26-2026..."
                    />
                    <EditableInfoField
                      label="Nombramiento de Superintendente"
                      value={editingSection === 'marco_legal_contratista' ? editFormData.superintendente : (pAny.superintendente || 'Ing. Civil Fernando José Reyes Cabrera')}
                      isEditing={editingSection === 'marco_legal_contratista'}
                      onChange={(v) => handleFieldChange('superintendente', v)}
                      placeholder="Superintendente de Obra"
                    />
                    <EditableInfoField
                      label="Colegiado Activo de Superintendente"
                      value={editingSection === 'marco_legal_contratista' ? editFormData.colegiadoSuperintendente : (pAny.colegiadoSuperintendente || 'Colegiado Activo No. 4125')}
                      isEditing={editingSection === 'marco_legal_contratista'}
                      onChange={(v) => handleFieldChange('colegiadoSuperintendente', v)}
                      mono
                      placeholder="Col. No. 4125"
                    />
                    <EditableInfoField
                      label="Contacto y Teléfono"
                      value={editingSection === 'marco_legal_contratista' ? editFormData.telefonoContratista : (pAny.telefonoContratista || 'PBX: 2334-9000 / contacto@constructora.com')}
                      isEditing={editingSection === 'marco_legal_contratista'}
                      onChange={(v) => handleFieldChange('telefonoContratista', v)}
                      placeholder="2334-9000 / correo@empresa.com"
                    />
                  </div>
                </div>
              </InfoDetailCard>

              {/* Bloque 2: Estatus Contractual de la Empresa Supervisora (Sin icono en encabezado según requerimiento) */}
              <InfoDetailCard
                title="2. ESTATUS CONTRACTUAL DE LA EMPRESA SUPERVISORA"
                badge="Contrato de Supervisión"
                editable={canEdit}
                isEditing={editingSection === 'marco_legal_supervisora'}
                onEdit={() => handleStartEdit('marco_legal_supervisora')}
                onSave={() => handleSaveSection('marco_legal_supervisora')}
                onCancel={handleCancelEdit}
                isSaving={isSaving}
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-2 rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                    <EditableInfoField
                      label="Licitación Pública Supervisora"
                      value={editingSection === 'marco_legal_supervisora' ? editFormData.licitacionSupervisora : (pAny.licitacionSupervisora || 'Licitación Pública No. DGC-SUP-012-2025')}
                      isEditing={editingSection === 'marco_legal_supervisora'}
                      onChange={(v) => handleFieldChange('licitacionSupervisora', v)}
                      mono
                      highlight
                      placeholder="DGC-SUP-012-2025"
                    />
                    <EditableInfoField
                      label="Nombre Empresa Supervisora"
                      value={editingSection === 'marco_legal_supervisora' ? editFormData.empresaSupervisora : (proyecto.empresaSupervisora || 'SERVICIOS DE INGENIERIA - SERINGE')}
                      isEditing={editingSection === 'marco_legal_supervisora'}
                      onChange={(v) => handleFieldChange('empresaSupervisora', v)}
                      placeholder="SERVICIOS DE INGENIERIA"
                    />
                    <EditableInfoField
                      label="Nombre Propietario (Contacto)"
                      value={editingSection === 'marco_legal_supervisora' ? editFormData.propietarioSupervisora : (pAny.propietarioSupervisora || 'William Ramón Godínez Mansilla')}
                      isEditing={editingSection === 'marco_legal_supervisora'}
                      onChange={(v) => handleFieldChange('propietarioSupervisora', v)}
                      placeholder="Propietario / Contacto"
                    />
                    <EditableInfoField
                      label="Dirección"
                      value={editingSection === 'marco_legal_supervisora' ? editFormData.direccionSupervisora : (pAny.direccionSupervisora || 'Avenida Las Américas, 24-70 Zona 13, Guatemala')}
                      isEditing={editingSection === 'marco_legal_supervisora'}
                      onChange={(v) => handleFieldChange('direccionSupervisora', v)}
                      placeholder="Dirección fiscal"
                    />
                  </div>

                  <div className="space-y-2 rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                    <EditableInfoField
                      label="Contacto / Teléfonos"
                      value={editingSection === 'marco_legal_supervisora' ? editFormData.telefonoSupervisora : (pAny.telefonoSupervisora || '2212-9675 / 5525-1537')}
                      isEditing={editingSection === 'marco_legal_supervisora'}
                      onChange={(v) => handleFieldChange('telefonoSupervisora', v)}
                      placeholder="2212-9675 / 5525-1537"
                    />
                    <EditableInfoField
                      label="Correo Electrónico"
                      value={editingSection === 'marco_legal_supervisora' ? editFormData.correoSupervisora : (pAny.correoSupervisora || 'supervision@seringe.com.gt')}
                      isEditing={editingSection === 'marco_legal_supervisora'}
                      onChange={(v) => handleFieldChange('correoSupervisora', v)}
                      placeholder="supervision@correo.com"
                    />
                    <EditableInfoField
                      label="Acta de Inicio de Supervisión"
                      value={editingSection === 'marco_legal_supervisora' ? editFormData.actaInicioSupervisora : (pAny.actaInicioSupervisora || 'Acta No. 52-2026 de fecha 07/07/2026')}
                      isEditing={editingSection === 'marco_legal_supervisora'}
                      onChange={(v) => handleFieldChange('actaInicioSupervisora', v)}
                      mono
                      placeholder="Acta No. 52-2026..."
                    />
                    <EditableInfoField
                      label="Delegado Residente de Proyecto"
                      value={editingSection === 'marco_legal_supervisora' ? editFormData.delegadoResidente : (proyecto.delegadoResidente || 'Ing. Civil Pablo Osberto Pérez Gómez (Col. 3689)')}
                      isEditing={editingSection === 'marco_legal_supervisora'}
                      onChange={(v) => handleFieldChange('delegadoResidente', v)}
                      placeholder="Ing. Delegado Residente"
                    />
                  </div>
                </div>

                {/* Sección de Equipo Asignado al Proyecto */}
                <div className="mt-3 border-t border-gray-100 pt-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10.5px] font-bold text-gray-800">
                      Profesionales y Técnicos Asignados a la Supervisión
                    </span>
                    <span className="text-[9px] font-bold text-gray-500">{equipoCompleto.length} profesionales</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {equipoCompleto.map((miembro) => (
                      <div
                        key={miembro.id}
                        className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white p-2 shadow-2xs"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-[9px] font-bold text-[#9B0F06]">
                          {getInitials(miembro.nombre)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-bold text-gray-900">{miembro.nombre}</p>
                          <p className="text-[8.5px] font-medium text-gray-500">{miembro.rol}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </InfoDetailCard>
            </div>
          )}

          {/* SUB-TAB 4: FICHA TÉCNICA */}
          {subTabGeneral === 'ficha_tecnica' && (
            <div className="space-y-3">
              {/* Selector de Perspectiva sin fondo gris */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Perspectiva:
                </span>
                <div className="inline-flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFichaPerspectiva('obra')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      fichaPerspectiva === 'obra'
                        ? 'bg-red-50 text-[#9B0F06] border border-red-200 shadow-2xs'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    Contrato de Obra (Ejecución)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFichaPerspectiva('supervision')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      fichaPerspectiva === 'supervision'
                        ? 'bg-red-50 text-[#9B0F06] border border-red-200 shadow-2xs'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    Contrato de Supervisión
                  </button>
                </div>
              </div>

              {/* Sección 3.1.1: Ficha Técnica del Contrato de Obra */}
              {fichaPerspectiva === 'obra' && (
                <div
                  className={`rounded-xl border bg-white shadow-2xs overflow-hidden transition-all ${
                    editingSection === 'ficha_obra' ? 'border-[#9B0F06]/40 ring-1 ring-[#9B0F06]/15' : 'border-gray-200'
                  }`}
                >
                  <div className="w-full flex flex-wrap items-center justify-between bg-gray-50/80 px-4 py-3 border-b border-gray-200 gap-2">
                    <div
                      onClick={() => setFichaObraAbierta(!fichaObraAbierta)}
                      className="flex items-center gap-2 cursor-pointer flex-1 min-w-[200px]"
                    >
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">
                          3.1.1 Información General del Contrato de Obra (Ejecución)
                        </h3>
                        <p className="text-[9px] text-gray-500">
                          Datos del contratista ejecutor, partida presupuestaria y plazos
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {canEdit && (
                        editingSection === 'ficha_obra' ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleSaveSection('ficha_obra')}
                              disabled={isSaving}
                              className="inline-flex items-center gap-1 rounded-md bg-[#9B0F06] px-2.5 py-0.5 text-[9.5px] font-bold text-white shadow-2xs hover:bg-[#5E0006] transition-colors cursor-pointer"
                            >
                              <Check size={11} />
                              <span>Guardar</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              disabled={isSaving}
                              className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-0.5 text-[9.5px] font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                              <X size={11} />
                              <span>Cancelar</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setFichaObraAbierta(true)
                              handleStartEdit('ficha_obra')
                            }}
                            className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[9.5px] font-bold text-gray-600 hover:bg-gray-100 hover:text-[#9B0F06] hover:border-red-200 transition-all cursor-pointer shadow-2xs"
                          >
                            <Edit2 size={10} />
                            <span>Editar</span>
                          </button>
                        )
                      )}

                      <button
                        type="button"
                        onClick={() => setFichaObraAbierta(!fichaObraAbierta)}
                        className="p-1 text-gray-500 hover:text-gray-800"
                      >
                        <ChevronDown
                          size={16}
                          className={`transition-transform duration-200 ${fichaObraAbierta ? 'rotate-180' : ''}`}
                        />
                      </button>
                    </div>
                  </div>

                  {fichaObraAbierta && (
                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Columna A: Datos del Contratista */}
                        <div className="rounded-xl border border-gray-100 bg-gray-50/40 p-3 space-y-1">
                          <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1 border-b border-gray-200 pb-1">
                            A. Identificación del Contratista
                          </p>
                          <EditableItemFichaTecnica
                            label="Empresa Contratista"
                            value={editingSection === 'ficha_obra' ? editFormData.empresaContratista : (proyecto.empresaContratista || 'Constructora Principal')}
                            isEditing={editingSection === 'ficha_obra'}
                            onChange={(v) => handleFieldChange('empresaContratista', v)}
                          />
                          <EditableItemFichaTecnica
                            label="Propietario / Rep. Legal"
                            value={editingSection === 'ficha_obra' ? editFormData.propietarioContratista : (pAny.propietarioContratista || 'Ing. Marco Antonio Estrada Morales')}
                            isEditing={editingSection === 'ficha_obra'}
                            onChange={(v) => handleFieldChange('propietarioContratista', v)}
                          />
                          <EditableItemFichaTecnica
                            label="Registro Mercantil"
                            value={editingSection === 'ficha_obra' ? editFormData.registroMercantilContratista : (pAny.registroMercantilContratista || '145892B')}
                            isEditing={editingSection === 'ficha_obra'}
                            onChange={(v) => handleFieldChange('registroMercantilContratista', v)}
                            mono
                          />
                          <EditableItemFichaTecnica
                            label="Dirección"
                            value={editingSection === 'ficha_obra' ? editFormData.direccionContratista : (pAny.direccionContratista || '12 Calle 4-55 Zona 10, Guatemala')}
                            isEditing={editingSection === 'ficha_obra'}
                            onChange={(v) => handleFieldChange('direccionContratista', v)}
                          />
                          <EditableItemFichaTecnica
                            label="Teléfono"
                            value={editingSection === 'ficha_obra' ? editFormData.telefonoContratista : (pAny.telefonoContratista || '2334-9000 / 5544-1234')}
                            isEditing={editingSection === 'ficha_obra'}
                            onChange={(v) => handleFieldChange('telefonoContratista', v)}
                          />
                          <EditableItemFichaTecnica
                            label="Responsable del Proyecto"
                            value={editingSection === 'ficha_obra' ? editFormData.responsableNombre : (pAny.responsableNombre || 'Ing. Civil Fernando Reyes (Col. 4125)')}
                            isEditing={editingSection === 'ficha_obra'}
                            onChange={(v) => handleFieldChange('responsableNombre', v)}
                          />
                          <EditableItemFichaTecnica
                            label="Programa"
                            value={editingSection === 'ficha_obra' ? editFormData.programaObra : (pAny.programaObra || 'TRANSPORTE POR CARRETERA')}
                            isEditing={editingSection === 'ficha_obra'}
                            onChange={(v) => handleFieldChange('programaObra', v)}
                          />
                          <EditableItemFichaTecnica
                            label="Subprograma"
                            value={editingSection === 'ficha_obra' ? editFormData.subprogramaObra : (pAny.subprogramaObra || 'MEJORAMIENTO DE CARRETERAS SECUNDARIAS Y PUENTES')}
                            isEditing={editingSection === 'ficha_obra'}
                            onChange={(v) => handleFieldChange('subprogramaObra', v)}
                          />
                          <EditableItemFichaTecnica
                            label="Fuente de Financiamiento"
                            value={editingSection === 'ficha_obra' ? editFormData.fuenteFinanciamientoObra : (pAny.fuenteFinanciamientoObra || 'Fondos nacionales')}
                            isEditing={editingSection === 'ficha_obra'}
                            onChange={(v) => handleFieldChange('fuenteFinanciamientoObra', v)}
                          />
                        </div>

                        {/* Columna B: Partida Presupuestaria y Montos */}
                        <div className="rounded-xl border border-gray-100 bg-gray-50/40 p-3 space-y-1">
                          <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1 border-b border-gray-200 pb-1">
                            B. Partida Presupuestaria y Términos Económicos
                          </p>
                          <EditableItemFichaTecnica
                            label="Fondos Nacionales (Partida)"
                            value={editingSection === 'ficha_obra' ? editFormData.partidaFondosObra : (pAny.partidaFondosObra || '2026-11130013-202-11-01-002-000-003-331-1399-52-0403-0065')}
                            isEditing={editingSection === 'ficha_obra'}
                            onChange={(v) => handleFieldChange('partidaFondosObra', v)}
                            mono
                          />
                          <EditableItemFichaTecnica
                            label="CDP (Comprobante Devengado)"
                            value={editingSection === 'ficha_obra' ? editFormData.cdpObra : (pAny.cdpObra || '66349939')}
                            isEditing={editingSection === 'ficha_obra'}
                            onChange={(v) => handleFieldChange('cdpObra', v)}
                            mono
                          />
                          <EditableItemFichaTecnica
                            label="Contrato No."
                            value={editingSection === 'ficha_obra' ? editFormData.numeroContratoOriginal : (pAny.numeroContratoOriginal || '008-2026-DGC-CONSTRUCCION, 29/05/2026')}
                            isEditing={editingSection === 'ficha_obra'}
                            onChange={(v) => handleFieldChange('numeroContratoOriginal', v)}
                            mono
                          />
                          <EditableItemFichaTecnica
                            label="Acuerdo Ministerial"
                            value={editingSection === 'ficha_obra' ? editFormData.acuerdoMinisterialOriginal : (pAny.acuerdoMinisterialOriginal || '522-2026 de fecha 09/06/2026')}
                            isEditing={editingSection === 'ficha_obra'}
                            onChange={(v) => handleFieldChange('acuerdoMinisterialOriginal', v)}
                            mono
                          />
                          <EditableItemFichaTecnica
                            label="Monto Original del Contrato"
                            value={editingSection === 'ficha_obra' ? (editFormData.montoContractualOriginal ?? editFormData.presupuesto) : formatearMoneda(montoObraOriginal > 0 ? montoObraOriginal : 369834297.14)}
                            isEditing={editingSection === 'ficha_obra'}
                            onChange={(v) => {
                              handleFieldChange('montoContractualOriginal', v)
                              handleFieldChange('presupuesto', v)
                            }}
                            type={editingSection === 'ficha_obra' ? 'number' : 'text'}
                            highlight
                          />
                          <EditableItemFichaTecnica
                            label="Porcentaje de Anticipo (%)"
                            value={editingSection === 'ficha_obra' ? editFormData.porcentajeAnticipoObra : `${porcentajeAnticipoObra}% (${formatearMoneda(montoAnticipoObra > 0 ? montoAnticipoObra : 55475144.57)})`}
                            isEditing={editingSection === 'ficha_obra'}
                            onChange={(v) => handleFieldChange('porcentajeAnticipoObra', v)}
                            type={editingSection === 'ficha_obra' ? 'number' : 'text'}
                          />
                          <EditableItemFichaTecnica
                            label="Número de Meses Contratados"
                            value={editingSection === 'ficha_obra' ? editFormData.mesesContratadosObra : (pAny.mesesContratadosObra || '18 meses (Etapa de Construcción)')}
                            isEditing={editingSection === 'ficha_obra'}
                            onChange={(v) => handleFieldChange('mesesContratadosObra', v)}
                          />
                          <EditableItemFichaTecnica
                            label="Fecha Original de Terminación"
                            value={editingSection === 'ficha_obra' ? editFormData.fechaTerminacionOriginalObra : (pAny.fechaTerminacionOriginalObra || 'según Acta No. 26-2026, finaliza el 09/02/2028')}
                            isEditing={editingSection === 'ficha_obra'}
                            onChange={(v) => handleFieldChange('fechaTerminacionOriginalObra', v)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Sección 3.1.2: Ficha Técnica del Contrato de Supervisión */}
              {fichaPerspectiva === 'supervision' && (
                <div
                  className={`rounded-xl border bg-white shadow-2xs overflow-hidden transition-all ${
                    editingSection === 'ficha_supervision' ? 'border-[#9B0F06]/40 ring-1 ring-[#9B0F06]/15' : 'border-gray-200'
                  }`}
                >
                  <div className="w-full flex flex-wrap items-center justify-between bg-gray-50/80 px-4 py-3 border-b border-gray-200 gap-2">
                    <div
                      onClick={() => setFichaSupervisionAbierta(!fichaSupervisionAbierta)}
                      className="flex items-center gap-2 cursor-pointer flex-1 min-w-[200px]"
                    >
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">
                          3.1.2 Información General del Contrato de Supervisión
                        </h3>
                        <p className="text-[9px] text-gray-500">
                          Datos de la empresa supervisora, partida presupuestaria y fases
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {canEdit && (
                        editingSection === 'ficha_supervision' ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleSaveSection('ficha_supervision')}
                              disabled={isSaving}
                              className="inline-flex items-center gap-1 rounded-md bg-[#9B0F06] px-2.5 py-0.5 text-[9.5px] font-bold text-white shadow-2xs hover:bg-[#5E0006] transition-colors cursor-pointer"
                            >
                              <Check size={11} />
                              <span>Guardar</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              disabled={isSaving}
                              className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-0.5 text-[9.5px] font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                              <X size={11} />
                              <span>Cancelar</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setFichaSupervisionAbierta(true)
                              handleStartEdit('ficha_supervision')
                            }}
                            className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[9.5px] font-bold text-gray-600 hover:bg-gray-100 hover:text-[#9B0F06] hover:border-red-200 transition-all cursor-pointer shadow-2xs"
                          >
                            <Edit2 size={10} />
                            <span>Editar</span>
                          </button>
                        )
                      )}

                      <button
                        type="button"
                        onClick={() => setFichaSupervisionAbierta(!fichaSupervisionAbierta)}
                        className="p-1 text-gray-500 hover:text-gray-800"
                      >
                        <ChevronDown
                          size={16}
                          className={`transition-transform duration-200 ${fichaSupervisionAbierta ? 'rotate-180' : ''}`}
                        />
                      </button>
                    </div>
                  </div>

                  {fichaSupervisionAbierta && (
                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Columna A: Identificación de la Supervisora */}
                        <div className="rounded-xl border border-gray-100 bg-gray-50/40 p-3 space-y-1">
                          <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1 border-b border-gray-200 pb-1">
                            A. Identificación de la Supervisora
                          </p>
                          <EditableItemFichaTecnica
                            codigo="3.1.2.1"
                            label="Empresa Supervisora"
                            value={editingSection === 'ficha_supervision' ? editFormData.empresaSupervisora : (proyecto.empresaSupervisora || 'SERVICIOS DE INGENIERIA - SERINGE')}
                            isEditing={editingSection === 'ficha_supervision'}
                            onChange={(v) => handleFieldChange('empresaSupervisora', v)}
                          />
                          <EditableItemFichaTecnica
                            codigo="3.1.2.2"
                            label="Propietario"
                            value={editingSection === 'ficha_supervision' ? editFormData.propietarioSupervisora : (pAny.propietarioSupervisora || 'William Ramón Godínez Mansilla')}
                            isEditing={editingSection === 'ficha_supervision'}
                            onChange={(v) => handleFieldChange('propietarioSupervisora', v)}
                          />
                          <EditableItemFichaTecnica
                            codigo="3.1.2.3"
                            label="Registro Mercantil"
                            value={editingSection === 'ficha_supervision' ? editFormData.registroMercantilSupervisora : (pAny.registroMercantilSupervisora || '177228A')}
                            isEditing={editingSection === 'ficha_supervision'}
                            onChange={(v) => handleFieldChange('registroMercantilSupervisora', v)}
                            mono
                          />
                          <EditableItemFichaTecnica
                            codigo="3.1.2.4"
                            label="Dirección"
                            value={editingSection === 'ficha_supervision' ? editFormData.direccionSupervisora : (pAny.direccionSupervisora || 'Avenida Las Américas, 24-70 Zona 13, Guatemala')}
                            isEditing={editingSection === 'ficha_supervision'}
                            onChange={(v) => handleFieldChange('direccionSupervisora', v)}
                          />
                          <EditableItemFichaTecnica
                            codigo="3.1.2.5"
                            label="Teléfono"
                            value={editingSection === 'ficha_supervision' ? editFormData.telefonoSupervisora : (pAny.telefonoSupervisora || '2212-9675 / 5525-1537')}
                            isEditing={editingSection === 'ficha_supervision'}
                            onChange={(v) => handleFieldChange('telefonoSupervisora', v)}
                          />
                          <EditableItemFichaTecnica
                            codigo="3.1.2.6"
                            label="Responsable del Proyecto"
                            value={editingSection === 'ficha_supervision' ? editFormData.responsableSupervisora : (pAny.responsableSupervisora || 'Ing. Civil Pablo Osberto Pérez Gómez (Col. 3689)')}
                            isEditing={editingSection === 'ficha_supervision'}
                            onChange={(v) => handleFieldChange('responsableSupervisora', v)}
                          />
                          <EditableItemFichaTecnica
                            codigo="3.1.2.7"
                            label="Programa"
                            value={editingSection === 'ficha_supervision' ? editFormData.programaSupervisora : (pAny.programaSupervisora || 'TRANSPORTE POR CARRETERA')}
                            isEditing={editingSection === 'ficha_supervision'}
                            onChange={(v) => handleFieldChange('programaSupervisora', v)}
                          />
                          <EditableItemFichaTecnica
                            codigo="3.1.2.8"
                            label="Subprograma"
                            value={editingSection === 'ficha_supervision' ? editFormData.subprogramaSupervisora : (pAny.subprogramaSupervisora || 'MEJORAMIENTO DE CARRETERAS SECUNDARIAS Y PUENTES')}
                            isEditing={editingSection === 'ficha_supervision'}
                            onChange={(v) => handleFieldChange('subprogramaSupervisora', v)}
                          />
                          <EditableItemFichaTecnica
                            codigo="3.1.2.9"
                            label="Fuente de Financiamiento"
                            value={editingSection === 'ficha_supervision' ? editFormData.fuenteFinanciamientoSupervisora : (pAny.fuenteFinanciamientoSupervisora || 'Fondos nacionales')}
                            isEditing={editingSection === 'ficha_supervision'}
                            onChange={(v) => handleFieldChange('fuenteFinanciamientoSupervisora', v)}
                          />
                        </div>

                        {/* Columna B: Partida de Supervisión y Plazos */}
                        <div className="rounded-xl border border-gray-100 bg-gray-50/40 p-3 space-y-1">
                          <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1 border-b border-gray-200 pb-1">
                            B. Partida Presupuestaria y Plazos de Supervisión
                          </p>
                          <EditableItemFichaTecnica
                            codigo="3.1.2.10"
                            label="Fondos Nacionales"
                            value={editingSection === 'ficha_supervision' ? editFormData.partidaFondosSupervisora : (pAny.partidaFondosSupervisora || '2026-11130013-202-11-01-002-000-003-188-1399-52-0403-0065')}
                            isEditing={editingSection === 'ficha_supervision'}
                            onChange={(v) => handleFieldChange('partidaFondosSupervisora', v)}
                            mono
                          />
                          <EditableItemFichaTecnica
                            codigo="3.1.2.11"
                            label="CDP"
                            value={editingSection === 'ficha_supervision' ? editFormData.cdpSupervisora : (pAny.cdpSupervisora || '66349939')}
                            isEditing={editingSection === 'ficha_supervision'}
                            onChange={(v) => handleFieldChange('cdpSupervisora', v)}
                            mono
                          />
                          <EditableItemFichaTecnica
                            codigo="3.1.2.12"
                            label="Contrato No."
                            value={editingSection === 'ficha_supervision' ? editFormData.contratoSupervisora : (pAny.contratoSupervisora || '007-2026-DGC-SUPERVISION, 29/05/2026')}
                            isEditing={editingSection === 'ficha_supervision'}
                            onChange={(v) => handleFieldChange('contratoSupervisora', v)}
                            mono
                          />
                          <EditableItemFichaTecnica
                            codigo="3.1.2.13"
                            label="Acuerdo Ministerial"
                            value={editingSection === 'ficha_supervision' ? editFormData.acuerdoSupervisora : (pAny.acuerdoSupervisora || '625-2026 de fecha 06/07/2026')}
                            isEditing={editingSection === 'ficha_supervision'}
                            onChange={(v) => handleFieldChange('acuerdoSupervisora', v)}
                            mono
                          />
                          <EditableItemFichaTecnica
                            codigo="3.1.2.14"
                            label="Monto Original del Contrato"
                            value={editingSection === 'ficha_supervision' ? editFormData.supervisoraMontoOriginal : formatearMoneda(montoSupervisionOriginal)}
                            isEditing={editingSection === 'ficha_supervision'}
                            onChange={(v) => handleFieldChange('supervisoraMontoOriginal', v)}
                            type={editingSection === 'ficha_supervision' ? 'number' : 'text'}
                            highlight
                          />
                          <EditableItemFichaTecnica
                            codigo="3.1.2.15"
                            label="Porcentaje de Anticipo (%)"
                            value={editingSection === 'ficha_supervision' ? editFormData.porcentajeAnticipoSupervision : `${porcentajeAnticipoSupervision}% (${formatearMoneda(montoAnticipoSupervision)})`}
                            isEditing={editingSection === 'ficha_supervision'}
                            onChange={(v) => handleFieldChange('porcentajeAnticipoSupervision', v)}
                            type={editingSection === 'ficha_supervision' ? 'number' : 'text'}
                          />
                          <EditableItemFichaTecnica
                            codigo="3.1.2.16"
                            label="Fecha Inicio Plazo Contractual"
                            value={editingSection === 'ficha_supervision' ? editFormData.fechaInicioSupervisora : (pAny.fechaInicioSupervisora || 'según Acta No. 52-2026, inicio el 07/07/2026')}
                            isEditing={editingSection === 'ficha_supervision'}
                            onChange={(v) => handleFieldChange('fechaInicioSupervisora', v)}
                          />
                          <EditableItemFichaTecnica
                            codigo="3.1.2.17"
                            label="Número de Meses Contratados"
                            value={editingSection === 'ficha_supervision' ? editFormData.mesesContratadosSupervisora : (pAny.mesesContratadosSupervisora || '22 MESES (2 Pre, 18 Ejecución, 2 Post)')}
                            isEditing={editingSection === 'ficha_supervision'}
                            onChange={(v) => handleFieldChange('mesesContratadosSupervisora', v)}
                          />
                          <EditableItemFichaTecnica
                            codigo="3.1.2.18"
                            label="Fecha Estimada de Finalización"
                            value={editingSection === 'ficha_supervision' ? editFormData.fechaFinSupervisora : (pAny.fechaFinSupervisora || '07/05/2028')}
                            isEditing={editingSection === 'ficha_supervision'}
                            onChange={(v) => handleFieldChange('fechaFinSupervisora', v)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SUB-TAB 5: UBICACIÓN (Sin lápiz de edición / modo visualización unificado) */}
          {subTabGeneral === 'ubicacion' && (
            <div className="space-y-3">
              {/* Resumen del Tramo y Coordenadas con paleta consistente */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {/* Origen */}
                <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-2xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[#9B0F06] font-bold text-[11px]">
                    <MapPin size={13} />
                    <span>DIRECCIÓN INICIAL / ORIGEN</span>
                  </div>
                  <EditableInfoField
                    label="Departamento Inicial (Origen)"
                    value={pAny.departamentoNombre || 'Guatemala'}
                  />
                  <EditableInfoField
                    label="Municipio Inicial (Origen)"
                    value={pAny.municipioNombre || 'Palencia'}
                  />
                  <EditableInfoField
                    label="Dirección Inicial (Texto Corto)"
                    value={proyecto.direccion || proyecto.ubicacionFisica || 'Tres Quebradas, Buena Vista, Palencia'}
                  />
                  <EditableInfoField
                    label="Kilómetro Inicial (Formato DGC)"
                    value={`Estación Km ${(pAny.kilometroInicio ?? 5)} + 000m`}
                    mono
                  />
                </div>

                {/* Destino */}
                <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-2xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[#9B0F06] font-bold text-[11px]">
                    <Navigation size={13} />
                    <span>DIRECCIÓN FINAL / DESTINO</span>
                  </div>
                  <EditableInfoField
                    label="Departamento Final (Límite Tramo)"
                    value={pAny.departamentoFinNombre || 'Guatemala'}
                  />
                  <EditableInfoField
                    label="Municipio Final (Límite Tramo)"
                    value={pAny.municipioFinNombre || 'Palencia'}
                  />
                  <EditableInfoField
                    label="Dirección Final / Destino"
                    value={pAny.direccionFin || 'Plan Grande, Palencia, Departamento de Guatemala'}
                  />
                  <EditableInfoField
                    label="Kilómetro Final (Formato DGC)"
                    value={`Estación Km ${(pAny.kilometroFin ?? 10)} + 000m`}
                    mono
                  />
                </div>

                {/* Distancia y Coordenadas (Tarjeta Blanca Unificada) */}
                <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-[#9B0F06] font-bold text-[11px] mb-1">
                      <Route size={13} />
                      <span>DISTANCIA DEL TRAMO</span>
                    </div>
                    <p className="text-xl font-black text-gray-900">
                      {Math.max(1, (Number(pAny.kilometroFin || 10) - Number(pAny.kilometroInicio || 5))).toFixed(1)} km
                    </p>
                    <p className="text-[9.5px] text-gray-400">
                      ({(Math.max(1, (Number(pAny.kilometroFin || 10) - Number(pAny.kilometroInicio || 5))) * 1000).toLocaleString('es-GT')} m)
                    </p>
                  </div>

                  <div className="border-t border-gray-100 pt-2 text-[9px] font-mono text-gray-600 space-y-0.5 mt-2">
                    <p>Lat: {pAny.latitud ?? 14.623783}°</p>
                    <p>Lng: {pAny.longitud ?? -90.344353}°</p>
                    <p className="text-[8px] text-gray-400 font-sans">Sistema Geodésico WGS84</p>
                  </div>
                </div>
              </div>

              {/* Mapa Interactivo Leaflet */}
              <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-2xs space-y-2">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Globe size={13} className="text-[#9B0F06]" />
                    <h3 className="text-xs font-bold text-gray-900">
                      Mapa OpenStreetMap (Punto Exacto y Ruta del Tramo)
                    </h3>
                  </div>
                  <span className="text-[9px] font-medium text-gray-500">
                    Marcador Rojo: Origen | Marcador Marrón: Límite Fin
                  </span>
                </div>

                <MapaDetalleVista
                  lat={pAny.latitud != null ? Number(pAny.latitud) : 14.623783}
                  lng={pAny.longitud != null ? Number(pAny.longitud) : -90.344353}
                  direccion={proyecto.direccion || proyecto.ubicacionFisica || 'Tres Quebradas, Buena Vista, Palencia'}
                  direccionFin={pAny.direccionFin || 'Plan Grande, Palencia'}
                  kilometroInicio={pAny.kilometroInicio ?? 5}
                  kilometroFin={pAny.kilometroFin ?? 10}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* CONTENIDO DE PESTAÑA: INFORMACIÓN FINANCIERA */}
      {tabMaestra === 'financiera' && (
        <ProyectoInformacionFinanciera proyecto={proyecto} />
      )}

      {/* Drawer de Equipo Responsable Completo */}
      {isEquipoModalOpen && (
        <div className="fixed inset-0 z-[9999] overflow-hidden bg-black/50 backdrop-blur-xs">
          <div className="absolute inset-0" onClick={() => setIsEquipoModalOpen(false)} />
          <div className="fixed inset-y-0 right-0 flex max-w-full h-full">
            <div className="w-screen max-w-md transform bg-white shadow-2xl transition-transform duration-300 ease-in-out flex flex-col h-full">
              <div className="flex items-center justify-between border-b border-gray-100 p-4 bg-gray-50 shrink-0">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-[#9B0F06]" />
                  <div>
                    <h3 className="text-xs font-bold text-gray-900">Equipo Responsable Completo</h3>
                    <p className="text-[10px] text-gray-500">{equipoCompleto.length} miembros asignados</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEquipoModalOpen(false)}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {equipoCompleto.map((miembro) => (
                  <div
                    key={miembro.id}
                    className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-2.5 shadow-2xs hover:border-gray-200 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-[#9B0F06]">
                        {getInitials(miembro.nombre)}
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-gray-900">{miembro.nombre}</p>
                        <p className="text-[9px] font-medium text-gray-500">{miembro.rol}</p>
                      </div>
                    </div>
                    {canManageTeam ? (
                      <button
                        type="button"
                        onClick={() => setMemberToDelete(miembro)}
                        className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors cursor-pointer"
                        title="Eliminar del equipo del proyecto"
                      >
                        <Trash2 size={14} />
                      </button>
                    ) : (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[8px] font-bold text-emerald-700">
                        Activo
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 p-3 bg-gray-50 flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEquipoModalOpen(false)}
                  className="rounded-xl bg-[#9B0F06] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#5E0006] transition-colors shadow-2xs"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación para Eliminar Miembro del Equipo */}
      {memberToDelete && (
        <>
          <div className="fixed inset-0 z-[10000] bg-black/45 backdrop-blur-[1px]" onClick={() => setMemberToDelete(null)} />
          <div className="fixed left-1/2 top-1/2 z-[10001] w-full max-w-[420px] -translate-x-1/2 -translate-y-1/2 font-[Poppins]">
            <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-2xl">
              <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-red-500 to-[#9B0F06]" />

              <div className="mb-4 flex items-center justify-center relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-[#9B0F06] ring-4 ring-red-50/50">
                  <Trash2 size={22} strokeWidth={1.75} />
                </div>
                <button
                  type="button"
                  onClick={() => setMemberToDelete(null)}
                  className="absolute right-0 top-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
                  title="Cerrar"
                >
                  <X size={16} />
                </button>
              </div>

              <h3 className="text-[18px] font-bold text-gray-800 text-center">¿Eliminar miembro del equipo?</h3>
              <p className="mt-2 text-[12px] leading-relaxed text-gray-500 text-center">
                ¿Estás seguro de que deseas eliminar a <span className="font-semibold text-gray-800">{memberToDelete.nombre}</span> del equipo responsable de este proyecto?
              </p>

              <div className="mt-5 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <p className="text-[12px] font-semibold text-gray-800">{memberToDelete.nombre}</p>
                <p className="text-[10px] text-gray-500">{memberToDelete.rol}</p>
              </div>

              <div className="mt-5 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleConfirmEliminarMiembro}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-[12px] font-semibold text-white transition-colors bg-[#9B0F06] hover:bg-[#5E0006] cursor-pointer shadow-sm"
                >
                  <Trash2 size={16} />
                  <span>Eliminar del equipo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMemberToDelete(null)}
                  className="w-full rounded-xl border border-gray-200 py-2.5 text-[12px] font-medium text-gray-600 transition-colors hover:bg-gray-50 cursor-pointer mt-1"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
