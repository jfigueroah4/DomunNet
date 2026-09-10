// @ts-nocheck
import { api } from '@/lib/api/cliente'
import {
  ProyectoType,
  RenglonDetalladoSabanaType,
  MedicionAnaliticaCampoType,
  TrabajoPendienteBolsaType,
} from '@/validations/proyecto.schema'
import {
  getProyectoMockDetalle,
  CATALOGO_COMPLETO_88,
  MEDICIONES_ANALITICAS_MOCK,
  TRABAJOS_PENDIENTES_MOCK,
  CAPITULOS_LIBRO_AZUL,
} from '@/mocks/proyectoMock'

export const USE_MOCK = false

export const proyectoService = {
  getProyectoReal: async (slug: string) => {
    const { data } = await api.get(`/proyectos/${slug}`)
    return data?.data
  },

  getProyectoBySlug: async (slug: string): Promise<ProyectoType | undefined> => {
    try {
      const { data } = await api.get(`/proyectos/${slug}`)
      if (data && data.success && data.data) {
        const raw = data.data
        return {
          ...raw,
          id: raw.id,
          codigo: raw.codigo || 'PROY',
          nombre: raw.nombreOficial || raw.nombre || 'Proyecto',
          nombreOficial: raw.nombreOficial || raw.nombre || 'Proyecto',
          descripcion: raw.descripcion || '',
          ubicacion: raw.ubicacionFisica || raw.direccion || raw.ubicacion || 'Ubicación General',
          ubicacionFisica: raw.ubicacionFisica || raw.direccion || raw.ubicacion || 'Ubicación General',
          direccion: raw.direccion || '',
          presupuesto: Number(raw.montoContractualOriginal || raw.monto_original || raw.presupuesto || 0),
          avance: Number(raw.avance || 0),
          estado: (raw.estado || 'activo').toLowerCase() as any,
          fechaInicio: raw.fechaInicioContractual || raw.fecha_inicio || '',
          fechaFin: raw.fechaFinContractualPlan || raw.fecha_fin || '',
          fechaAdjudicacion: raw.fechaAdjudicacion || raw.fecha_adjudicacion || '',
          numeroEscrituraPublica: raw.numeroEscrituraPublica || raw.numero_escritura_publica || '',
          entidadContratante: raw.entidadContratante || raw.entidad_contratante || '',
          empresaContratista: raw.empresaContratista || raw.empresa_contratista || '',
          empresaSupervisora: raw.empresaSupervisora || raw.empresa_supervisora || '',
          delegadoResidente: raw.delegadoResidente || raw.delegado_residente || '',
          fechaInicioContractual: raw.fechaInicioContractual || raw.fecha_inicio_contractual || raw.fechaInicio || '',
          fechaFinContractualPlan: raw.fechaFinContractualPlan || raw.fecha_fin_contractual_plan || raw.fechaFin || '',
          plazoEjecucionContractualOriginal: raw.plazoEjecucionContractualOriginal || (raw.plazoEjecucionOriginal ? `${raw.plazoEjecucionOriginal} días` : ''),
          plazoEjecucionOriginal: raw.plazoEjecucionOriginal || raw.plazo_ejecucion_original || '',
          fechaFinalizacionReal: raw.fechaFinalizacionReal || raw.fecha_finalizacion_real || '',
          plazoEjecucionRealAmpliado: raw.plazoEjecucionRealAmpliado || raw.plazo_ejecucion_ampliado || '',
          montoFinancieroFinalEjecutado: raw.montoFinancieroFinalEjecutado ?? raw.montoFinal ?? raw.monto_final ?? null,
          empresaContratanteId: raw.empresaContratanteId || raw.empresa_contratante_id || '',
          empresaContratistaId: raw.empresaContratistaId || raw.empresa_contratista_id || '',
          delegadoResidenteId: raw.delegadoResidenteId || raw.delegado_residente_id || '',
          documentos: raw.documentos || [],
          equipo: raw.equipo || [],
        } as ProyectoType
      }
    } catch (err) {
      console.warn('Real proyecto not found or error, checking mock:', err)
    }
    return getProyectoMockDetalle(slug)
  },

  getProyectosLista: async (): Promise<ProyectoType[]> => {
    if (USE_MOCK) {
      return [] // We'll implement if needed
    }
    const { data } = await api.get('/proyectos')
    return data
  },

  crearProyecto: async (payload: Partial<ProyectoType>): Promise<ProyectoType> => {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500))
      return { ...payload, id: 'nuevo-id', codigo: 'PROY-000' } as ProyectoType
    }
    const { data } = await api.post('/proyectos', payload)
    return data
  },

  actualizarProyecto: async (slug: string, payload: Partial<ProyectoType>): Promise<ProyectoType> => {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500))
      return { ...payload, id: slug } as ProyectoType
    }
    const { data } = await api.put(`/proyectos/${slug}`, payload)
    return data
  },

  eliminarProyecto: async (slug: string): Promise<void> => {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500))
      return
    }
    await api.delete(`/proyectos/${slug}`)
  },

  getHojaSabanaData: async (slug: string) => {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 300))
      return {
        renglones: CATALOGO_COMPLETO_88,
        mediciones: MEDICIONES_ANALITICAS_MOCK,
        trabajosPendientes: TRABAJOS_PENDIENTES_MOCK,
        capitulos: CAPITULOS_LIBRO_AZUL,
      }
    }
    const { data } = await api.get(`/proyectos/${slug}/sabana`)
    return data
  },
}
