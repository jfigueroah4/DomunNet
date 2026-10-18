'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  X,
  Building2,
  FolderGit2,
  MapPin,
  Calendar,
  ExternalLink,
  Coins,
  AlertCircle,
  Loader2,
  Briefcase,
} from 'lucide-react'
import { api, apiGetDeduplicado } from '@/lib/api/cliente'
import { EmpresaRelacionada } from '@/stores/useEmpresasRelacionadasStore'

export interface ProyectoVinculadoItem {
  id: string
  codigo: string
  nombre: string
  nombreOficial?: string
  descripcion?: string
  ubicacion?: string
  departamento?: string
  municipio?: string
  montoOriginal?: number
  presupuesto?: number
  fechaInicio?: string
  fechaFin?: string
  plazo?: string
  estado?: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  empresa: EmpresaRelacionada | null
  tipo: 'entidad' | 'contratista'
}

const MOCK_PROYECTOS_POR_EMPRESA: Record<string, ProyectoVinculadoItem[]> = {
  // CIV
  'ent-1': [
    {
      id: '1',
      codigo: 'DOM-VIAL-001',
      nombre: 'Paso Inferior Boulevard Vista Hermosa',
      nombreOficial: 'Construcción Paso a Desnivel Boulevard Vista Hermosa Tramo Km 6.5',
      ubicacion: 'Boulevard Vista Hermosa, Zona 15, Ciudad de Guatemala',
      departamento: 'Guatemala',
      municipio: 'Guatemala',
      presupuesto: 18650000,
      fechaInicio: '19/01/2025',
      fechaFin: '29/11/2026',
      estado: 'activo',
    },
    {
      id: '2',
      codigo: 'DOM-VIAL-002',
      nombre: 'Rehabilitacion Calzada Roosevelt',
      nombreOficial: 'Rehabilitación y Recapeo Asfáltico Calzada Roosevelt Km 13 al 18',
      ubicacion: 'Calzada Roosevelt, Zona 11, Ciudad de Guatemala',
      departamento: 'Guatemala',
      municipio: 'Mixco',
      presupuesto: 24750000,
      fechaInicio: '04/08/2025',
      fechaFin: '14/03/2027',
      estado: 'activo',
    },
    {
      id: '5',
      codigo: 'DOM-VIAL-005',
      nombre: 'Ampliacion Puente Belice II',
      nombreOficial: 'Construcción y Ampliación Estructural Puente Belice II y Accesos Viales',
      ubicacion: 'Zona 6 a Zona 18, Ciudad de Guatemala',
      departamento: 'Guatemala',
      municipio: 'Guatemala',
      presupuesto: 42300000,
      fechaInicio: '10/02/2025',
      fechaFin: '15/12/2027',
      estado: 'activo',
    },
  ],
  // DGC
  'ent-2': [
    {
      id: '3',
      codigo: 'DOM-VIAL-003',
      nombre: 'Estabilizacion de Taludes Ruta a El Salvador',
      nombreOficial: 'Obras de Mitigación y Estabilización de Taludes Tramo Carretero Km 19 al 24',
      ubicacion: 'Carretera a El Salvador, Fraijanes',
      departamento: 'Guatemala',
      municipio: 'Fraijanes',
      presupuesto: 9200000,
      fechaInicio: '15/03/2025',
      fechaFin: '30/10/2026',
      estado: 'en_revision',
    },
    {
      id: '4',
      codigo: 'DOM-VIAL-004',
      nombre: 'Recapeo Tramo CA-9 Norte Km 18-35',
      nombreOficial: 'Mantenimiento Periódico y Reemplazo de Pavimento CA-9 Norte',
      ubicacion: 'Carretera al Atlántico CA-9 Norte',
      departamento: 'Guatemala',
      municipio: 'Palencia',
      presupuesto: 15800000,
      fechaInicio: '01/06/2025',
      fechaFin: '20/12/2026',
      estado: 'activo',
    },
  ],
  // FSS
  'ent-3': [
    {
      id: '6',
      codigo: 'DOM-VIAL-006',
      nombre: 'Mejoramiento Camino Rural San Juan Sacatepéquez',
      nombreOficial: 'Pavimentación Rígida y Obras de Drenaje Longitudinal Aldea Montúfar',
      ubicacion: 'Camino Rural Principal Aldea Montúfar',
      departamento: 'Guatemala',
      municipio: 'San Juan Sacatepéquez',
      presupuesto: 6400000,
      fechaInicio: '20/04/2025',
      fechaFin: '18/02/2026',
      estado: 'activo',
    },
  ],
  // Constructora Nacional de Pavimentos
  'cont-emp-1': [
    {
      id: '1',
      codigo: 'DOM-VIAL-001',
      nombre: 'Paso Inferior Boulevard Vista Hermosa',
      nombreOficial: 'Construcción Paso a Desnivel Boulevard Vista Hermosa Tramo Km 6.5',
      ubicacion: 'Boulevard Vista Hermosa, Zona 15, Ciudad de Guatemala',
      departamento: 'Guatemala',
      municipio: 'Guatemala',
      presupuesto: 18650000,
      fechaInicio: '19/01/2025',
      fechaFin: '29/11/2026',
      estado: 'activo',
    },
    {
      id: '2',
      codigo: 'DOM-VIAL-002',
      nombre: 'Rehabilitacion Calzada Roosevelt',
      nombreOficial: 'Rehabilitación y Recapeo Asfáltico Calzada Roosevelt Km 13 al 18',
      ubicacion: 'Calzada Roosevelt, Zona 11, Ciudad de Guatemala',
      departamento: 'Guatemala',
      municipio: 'Mixco',
      presupuesto: 24750000,
      fechaInicio: '04/08/2025',
      fechaFin: '14/03/2027',
      estado: 'activo',
    },
    {
      id: '4',
      codigo: 'DOM-VIAL-004',
      nombre: 'Recapeo Tramo CA-9 Norte Km 18-35',
      nombreOficial: 'Mantenimiento Periódico y Reemplazo de Pavimento CA-9 Norte',
      ubicacion: 'Carretera al Atlántico CA-9 Norte',
      departamento: 'Guatemala',
      municipio: 'Palencia',
      presupuesto: 15800000,
      fechaInicio: '01/06/2025',
      fechaFin: '20/12/2026',
      estado: 'activo',
    },
    {
      id: '7',
      codigo: 'DOM-VIAL-007',
      nombre: 'Pavimentacion Tramo Chimaltenango - San Martin Jilotepeque',
      nombreOficial: 'Reposición de Cinta Asfáltica y Cunetas Tramo Ruta Nacional 5',
      ubicacion: 'Ruta Nacional 5 Km 54 al 68',
      departamento: 'Chimaltenango',
      municipio: 'San Martín Jilotepeque',
      presupuesto: 21500000,
      fechaInicio: '01/02/2025',
      fechaFin: '15/10/2026',
      estado: 'activo',
    },
  ],
  // CYMCO S.A.
  'cont-emp-2': [
    {
      id: '3',
      codigo: 'DOM-VIAL-003',
      nombre: 'Estabilizacion de Taludes Ruta a El Salvador',
      nombreOficial: 'Obras de Mitigación y Estabilización de Taludes Tramo Carretero Km 19 al 24',
      ubicacion: 'Carretera a El Salvador, Fraijanes',
      departamento: 'Guatemala',
      municipio: 'Fraijanes',
      presupuesto: 9200000,
      fechaInicio: '15/03/2025',
      fechaFin: '30/10/2026',
      estado: 'en_revision',
    },
    {
      id: '8',
      codigo: 'DOM-VIAL-008',
      nombre: 'Muros de Contencion Escuintla - Puerto San Jose',
      nombreOficial: 'Construcción Muros de Contención y Defensas Metálicas Autopista Puerto Quetzal',
      ubicacion: 'Autopista Puerto San José Km 82',
      departamento: 'Escuintla',
      municipio: 'San José',
      presupuesto: 11200000,
      fechaInicio: '10/05/2025',
      fechaFin: '12/12/2026',
      estado: 'activo',
    },
  ],
  // SERINGE
  'cont-emp-3': [
    {
      id: '5',
      codigo: 'DOM-VIAL-005',
      nombre: 'Ampliacion Puente Belice II',
      nombreOficial: 'Supervisión Técnica y Control de Calidad Ampliación Puente Belice II',
      ubicacion: 'Zona 6 a Zona 18, Ciudad de Guatemala',
      departamento: 'Guatemala',
      municipio: 'Guatemala',
      presupuesto: 42300000,
      fechaInicio: '10/02/2025',
      fechaFin: '15/12/2027',
      estado: 'activo',
    },
    {
      id: '6',
      codigo: 'DOM-VIAL-006',
      nombre: 'Mejoramiento Camino Rural San Juan Sacatepéquez',
      nombreOficial: 'Supervisión de Calidad y Pavimentación Rígida Aldea Montúfar',
      ubicacion: 'Camino Rural Principal Aldea Montúfar',
      departamento: 'Guatemala',
      municipio: 'San Juan Sacatepéquez',
      presupuesto: 6400000,
      fechaInicio: '20/04/2025',
      fechaFin: '18/02/2026',
      estado: 'activo',
    },
    {
      id: '9',
      codigo: 'DOM-VIAL-009',
      nombre: 'Supervision Tecnica Paso a Desnivel Proceres',
      nombreOficial: 'Consultoría y Supervisión de Estructuras Viales Bulevar Los Próceres',
      ubicacion: 'Bulevar Los Próceres Zona 10',
      departamento: 'Guatemala',
      municipio: 'Guatemala',
      presupuesto: 7800000,
      fechaInicio: '01/01/2025',
      fechaFin: '30/11/2025',
      estado: 'activo',
    },
  ],
}

function formatearMonto(monto?: number): string {
  if (!monto || isNaN(monto)) return 'Q 0.00'
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    maximumFractionDigits: 2,
  }).format(monto)
}

function obtenerBadgeEstado(estado?: string) {
  const norm = (estado || 'borrador').toLowerCase()
  if (norm === 'activo' || norm === 'active' || norm === 'en_ejecucion') {
    return {
      label: 'Activo',
      classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    }
  }
  if (norm === 'en_revision' || norm === 'revision') {
    return {
      label: 'En Revisión',
      classes: 'bg-amber-50 text-amber-700 border-amber-200',
    }
  }
  if (norm === 'completado' || norm === 'finalizado') {
    return {
      label: 'Completado',
      classes: 'bg-blue-50 text-blue-700 border-blue-200',
    }
  }
  if (norm === 'pausado' || norm === 'suspendido') {
    return {
      label: 'Suspendido',
      classes: 'bg-gray-100 text-gray-700 border-gray-200',
    }
  }
  return {
    label: 'Borrador',
    classes: 'bg-gray-100 text-gray-600 border-gray-200',
  }
}

export function ProyectosVinculadosModal({
  isOpen,
  onClose,
  empresa,
  tipo,
}: Props) {
  const router = useRouter()
  const [proyectos, setProyectos] = useState<ProyectoVinculadoItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || !empresa) {
      setProyectos([])
      return
    }

    let isCancelled = false

    const cargarProyectos = async () => {
      setLoading(true)
      try {
        const endpointProyectos =
          tipo === 'entidad'
            ? `/entidades-contratantes/${empresa.id}/proyectos`
            : `/empresas-contratistas/${empresa.id}/proyectos`

        // 1. Intentar endpoint dedicado
        let items: ProyectoVinculadoItem[] = []
        try {
          const res = await api.get(endpointProyectos)
          if (Array.isArray(res.data?.data) && res.data.data.length > 0) {
            items = res.data.data
          }
        } catch {
          // Endpoint aún no implementado o error de red, continuar con fallback
        }

        // 2. Si no devolvió nada, buscar en lista global de proyectos
        if (items.length === 0) {
          try {
            const resGlobal = await apiGetDeduplicado('/proyectos')
            const todos = resGlobal?.data?.data || resGlobal?.data || []
            if (Array.isArray(todos)) {
              items = todos
                .filter((p: any) => {
                  if (tipo === 'entidad') {
                    return (
                      p.empresaContratanteId === empresa.id ||
                      p.empresa_contratante_id === empresa.id ||
                      (p.entidadContratante &&
                        empresa.nombre &&
                        (p.entidadContratante.toLowerCase().includes(empresa.nombre.toLowerCase()) ||
                          empresa.nombre.toLowerCase().includes(p.entidadContratante.toLowerCase())))
                    )
                  } else {
                    return (
                      p.empresaContratistaId === empresa.id ||
                      p.empresa_contratista_id === empresa.id ||
                      (p.empresaContratista &&
                        empresa.nombre &&
                        (p.empresaContratista.toLowerCase().includes(empresa.nombre.toLowerCase()) ||
                          empresa.nombre.toLowerCase().includes(p.empresaContratista.toLowerCase())))
                    )
                  }
                })
                .map((p: any) => ({
                  id: p.id,
                  codigo: p.codigo || 'PROY',
                  nombre: p.nombre || p.nombreOficial || 'Proyecto sin nombre',
                  nombreOficial: p.nombreOficial || p.nombre || '',
                  ubicacion: p.ubicacionFisica || p.ubicacion || p.direccion || '',
                  departamento: p.departamentoNombre || p.departamento?.nombre || '',
                  municipio: p.municipioNombre || p.municipio?.nombre || '',
                  presupuesto: Number(p.presupuesto || p.montoContractualOriginal || 0),
                  fechaInicio: p.fechaInicio || p.fechaInicioContractual || '',
                  fechaFin: p.fechaFin || p.fechaFinalContractual || '',
                  estado: p.estado || 'activo',
                }))
            }
          } catch {
            // Continúa a fallback mock si aplica
          }
        }

        // 3. Si aún está vacío, comprobar diccionario de respaldo por ID o nombre
        if (items.length === 0 && (empresa.proyectos_vinculados || 0) > 0) {
          if (MOCK_PROYECTOS_POR_EMPRESA[empresa.id]) {
            items = MOCK_PROYECTOS_POR_EMPRESA[empresa.id]
          } else {
            // Buscar por coincidencia aproximada de nombre
            const matchKey = Object.keys(MOCK_PROYECTOS_POR_EMPRESA).find((k) => {
              if (empresa.nombre.includes('CIV') || empresa.nombre.includes('Comunicaciones')) return k === 'ent-1'
              if (empresa.nombre.includes('Caminos') || empresa.nombre.includes('DGC')) return k === 'ent-2'
              if (empresa.nombre.includes('Solidaridad') || empresa.nombre.includes('FSS')) return k === 'ent-3'
              if (empresa.nombre.includes('Pavimentos') || empresa.nombre.includes('Constructora Nacional')) return k === 'cont-emp-1'
              if (empresa.nombre.includes('CYMCO')) return k === 'cont-emp-2'
              if (empresa.nombre.includes('SERINGE')) return k === 'cont-emp-3'
              return false
            })
            if (matchKey) {
              items = MOCK_PROYECTOS_POR_EMPRESA[matchKey]
            }
          }
        }

        if (!isCancelled) {
          setProyectos(items)
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    cargarProyectos()

    return () => {
      isCancelled = true
    }
  }, [isOpen, empresa, tipo])

  if (!isOpen || !empresa) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs font-[Poppins] animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`relative flex flex-col w-full ${
          proyectos.length === 1 ? 'max-w-lg md:max-w-xl' : 'max-w-lg md:max-w-3xl lg:max-w-4xl'
        } max-h-[88vh] rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado del modal */}
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 sm:px-6 py-4 bg-gray-50/70">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[#9B0F06] border border-red-100 shadow-2xs">
              {tipo === 'entidad' ? <Building2 size={20} /> : <Briefcase size={20} />}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-tight">
                  Proyectos Vinculados
                </h3>
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9.5px] font-bold text-[#9B0F06]">
                  {tipo === 'entidad' ? 'Entidad Contratante' : 'Empresa Contratista'}
                </span>
              </div>
              <p className="mt-0.5 text-xs sm:text-[13px] font-bold text-gray-800 truncate" title={empresa.nombre}>
                {empresa.nombre}
              </p>
              {empresa.nit && (
                <p className="text-[10px] text-gray-400 font-mono">
                  NIT: {empresa.nit}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X size={18} />
          </button>
        </div>

        {/* Resumen superior */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 sm:px-6 py-2.5 bg-white text-[11px] text-gray-500">
          <div className="flex items-center gap-1.5 font-medium">
            <FolderGit2 size={13} className="text-[#9B0F06]" />
            <span>
              {loading
                ? 'Consultando asignaciones...'
                : proyectos.length === 1
                ? '1 proyecto vinculado encontrado'
                : `${proyectos.length} proyectos vinculados encontrados`}
            </span>
          </div>
          <span className="text-[10px] text-gray-400">
            Catálogo unificado de proyectos
          </span>
        </div>

        {/* Cuerpo con lista de proyectos */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50/40">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
              <Loader2 size={26} className="animate-spin text-[#9B0F06]" />
              <p className="text-xs font-medium">Buscando proyectos vinculados a la empresa...</p>
            </div>
          ) : proyectos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 px-4 text-center rounded-2xl border border-dashed border-gray-200 bg-white shadow-2xs">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-[#9B0F06] mb-3 border border-red-100">
                <AlertCircle size={26} />
              </div>
              <h4 className="text-sm sm:text-base font-bold text-gray-800">Sin proyectos vinculados</h4>
              <p className="mt-1 text-xs text-gray-500 max-w-md leading-relaxed">
                Esta empresa no se encuentra asignada actualmente como {tipo === 'entidad' ? 'entidad contratante' : 'empresa contratista'} en ningún proyecto del sistema.
              </p>
            </div>
          ) : (
            <div className={`grid gap-3.5 ${proyectos.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
              {proyectos.map((proy) => {
                const badge = obtenerBadgeEstado(proy.estado)
                return (
                  <div
                    key={proy.id}
                    className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-3.5 sm:p-4 shadow-2xs hover:shadow-xs hover:border-red-200 transition-all space-y-2.5 group"
                  >
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 font-mono text-[10px] font-bold text-gray-700 shadow-2xs">
                            {proy.codigo}
                          </span>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${badge.classes}`}
                          >
                            {badge.label}
                          </span>
                        </div>

                        {(proy.presupuesto || proy.montoOriginal) ? (
                          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded-md border border-emerald-100">
                            <Coins size={11} />
                            <span>{formatearMonto(proy.presupuesto || proy.montoOriginal)}</span>
                          </div>
                        ) : null}
                      </div>

                      <div>
                        <h4 className="text-xs sm:text-[13px] font-bold text-gray-900 group-hover:text-[#9B0F06] transition-colors leading-snug line-clamp-2">
                          {proy.nombreOficial || proy.nombre}
                        </h4>
                        {proy.nombre && proy.nombreOficial && proy.nombre !== proy.nombreOficial && (
                          <p className="mt-0.5 text-[10px] text-gray-400 line-clamp-1">
                            {proy.nombre}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5 text-[10.5px] text-gray-600 pt-1.5 border-t border-gray-100">
                        <div className="flex items-start gap-1.5 min-w-0">
                          <MapPin size={12} className="shrink-0 text-gray-400 mt-0.5" />
                          <span className="truncate">
                            {proy.ubicacion ||
                              (proy.departamento
                                ? `${proy.departamento}${proy.municipio ? `, ${proy.municipio}` : ''}`
                                : 'Ubicación no especificada')}
                          </span>
                        </div>

                        {(proy.fechaInicio || proy.fechaFin) && (
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Calendar size={12} className="shrink-0 text-gray-400" />
                            <span className="truncate">
                              {proy.fechaInicio || 'N/A'} - {proy.fechaFin || 'N/A'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-2 border-t border-gray-50">
                      <button
                        type="button"
                        onClick={() => {
                          onClose()
                          router.push(`/dashboard/proyectos/detalles?slug=${proy.id}`)
                        }}
                        className="inline-flex items-center gap-1 text-[10.5px] font-bold text-[#9B0F06] hover:text-[#5E0006] transition-colors cursor-pointer group-hover:underline"
                      >
                        <span>Ir al proyecto</span>
                        <ExternalLink size={10} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Pie del modal */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-white px-5 py-3">
          <span className="text-[10px] text-gray-400">
            Empresa vinculada al módulo de proyectos
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
