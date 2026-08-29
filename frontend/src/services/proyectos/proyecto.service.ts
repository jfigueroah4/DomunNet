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

export const USE_MOCK = true

export const proyectoService = {
  getProyectoBySlug: async (slug: string): Promise<ProyectoType | undefined> => {
    if (USE_MOCK) {
      // Simulate network latency
      await new Promise((resolve) => setTimeout(resolve, 300))
      return getProyectoMockDetalle(slug)
    }
    const { data } = await api.get(`/proyectos/${slug}`)
    return data
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
