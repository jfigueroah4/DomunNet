import { create } from 'zustand'

export type ClimaId = 'soleado' | 'parcialmente_nublado' | 'nublado' | 'lluvia_ligera' | 'lluvia_fuerte'

export type Renglon = {
  id: string
  renglon: string
  lado: string
  estInicio: string
  estFin: string
  observaciones: string
}

export interface BitacoraFormState {
  pasoActual: number
  proyectoId: string
  categoriaTrabajo: string
  fechaRegistro: string
  turno: string
  responsable: string
  ubicacion: string
  clima: ClimaId
  observacionClimatica: string
  suspendieronActividades: boolean
  renglones: Renglon[]
  laboratorioHabilitado: boolean
  tipoEnsayo: string
  resultadoEnsayo: string
  laboratorioResponsable: string
  observacionesCierre: string
  firmaSupervisor: string
  
  // Actions
  setField: <K extends keyof BitacoraFormState>(field: K, value: BitacoraFormState[K]) => void
  resetForm: () => void
}

const renglonesIniciales: Renglon[] = [
  { id: '1', renglon: '', lado: 'Ambos', estInicio: '0+000', estFin: '0+000', observaciones: '' },
]

export const useBitacoraFormStore = create<BitacoraFormState>((set) => ({
  pasoActual: 1,
  proyectoId: '',
  categoriaTrabajo: '',
  fechaRegistro: new Date().toISOString().slice(0, 10),
  turno: 'Diurno',
  responsable: 'Natalia Aguilar',
  ubicacion: '',
  clima: 'soleado',
  observacionClimatica: '',
  suspendieronActividades: false,
  renglones: renglonesIniciales,
  laboratorioHabilitado: false,
  tipoEnsayo: 'Concreto fresco',
  resultadoEnsayo: '',
  laboratorioResponsable: '',
  observacionesCierre: '',
  firmaSupervisor: '',

  setField: (field, value) => set((state) => ({ ...state, [field]: value })),
  resetForm: () =>
    set({
      pasoActual: 1,
      proyectoId: '',
      categoriaTrabajo: '',
      fechaRegistro: new Date().toISOString().slice(0, 10),
      turno: 'Diurno',
      responsable: 'Natalia Aguilar',
      ubicacion: '',
      clima: 'soleado',
      observacionClimatica: '',
      suspendieronActividades: false,
      renglones: [
        { id: '1', renglon: '', lado: 'Ambos', estInicio: '0+000', estFin: '0+000', observaciones: '' },
      ],
      laboratorioHabilitado: false,
      tipoEnsayo: 'Concreto fresco',
      resultadoEnsayo: '',
      laboratorioResponsable: '',
      observacionesCierre: '',
      firmaSupervisor: '',
    }),
}))
