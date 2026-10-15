'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'

export default function LoadingScreen() {
  const [show, setShow] = useState(true)
  const [fade, setFade] = useState(false)

  const handleFinish = useCallback(() => {
    setShow(false)
  }, [])

  useEffect(() => {
    // Permitir apreciar la animación de carga antes de iniciar la transición
    const fadeTimer = setTimeout(() => {
      setFade(true)
    }, 850)

    // Margen de seguridad para desmontar completamente tras finalizar la transición de 500ms
    const unmountTimer = setTimeout(() => {
      setShow(false)
    }, 1450)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(unmountTimer)
    }
  }, [])

  if (!show) return null

  return (
    <div
      id="global-loading-screen"
      onTransitionEnd={(e) => {
        // Al culminar la transición de opacidad del contenedor, desmontar limpiamente
        if (e.target === e.currentTarget && fade) {
          handleFinish()
        }
      }}
      className={`loading-screen fixed inset-0 bg-[#F3F4F7] z-[9999] flex flex-col items-center justify-center transition-opacity duration-500 ease-out ${
        fade ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="loading-content flex flex-col items-center gap-4">
        <div className="relative w-16 h-16 animate-pulse">
          <Image
            src="/logo.png"
            alt="DOMUN Logo"
            fill
            sizes="64px"
            className="object-contain"
            priority
          />
        </div>

        <div className="flex flex-col items-center gap-1.5 mt-2">
          <span className="text-[10px] font-bold text-gray-500 tracking-[0.2em] uppercase font-poppins">
            Cargando
          </span>
          <div className="flex gap-1 items-center justify-center mt-1">
            <span className="w-1.5 h-1.5 bg-[#9B0F06] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-1.5 h-1.5 bg-[#9B0F06] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-1.5 h-1.5 bg-[#9B0F06] rounded-full animate-bounce"></span>
          </div>
        </div>
      </div>
    </div>
  )
}
