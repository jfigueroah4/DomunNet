'use client'

import { create } from 'zustand'

interface UIStore {
  ocultarBottomNav: boolean
  setOcultarBottomNav: (ocultar: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  ocultarBottomNav: false,
  setOcultarBottomNav: (ocultar) => set({ ocultarBottomNav: ocultar }),
}))
