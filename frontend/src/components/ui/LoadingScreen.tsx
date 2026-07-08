'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function LoadingScreen() {
  const [mounted, setMounted] = useState(true)
  const [fade, setFade] = useState(false)

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFade(true)
    }, 1000)

    const unmountTimer = setTimeout(() => {
      setMounted(false)
    }, 1300)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(unmountTimer)
    }
  }, [])

  if (!mounted) return null

  return (
    <div
      className={`fixed inset-0 bg-[#F3F4F7] z-[9999] flex flex-col items-center justify-center transition-opacity duration-300 ${
        fade ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Animated Logo */}
        <div className="relative w-16 h-16 animate-pulse">
          <Image
            src="/logo.png"
            alt="DOMUN Logo"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Loading Text and Indicator */}
        <div className="flex flex-col items-center gap-1.5 mt-2">
          <span className="text-[10px] font-bold text-gray-500 tracking-[0.2em] uppercase">
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
