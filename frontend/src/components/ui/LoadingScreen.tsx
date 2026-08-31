'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function LoadingScreen() {
  const [show, setShow] = useState(false)
  const [fade, setFade] = useState(false)

  useEffect(() => {
    setShow(true)

    const fadeTimer = setTimeout(() => {
      setFade(true)
    }, 1000)

    const unmountTimer = setTimeout(() => {
      setShow(false)
    }, 1300)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(unmountTimer)
    }
  }, [])

  if (!show) return null

  return (
    <div
      id="global-loading-screen"
      className={`fixed inset-0 bg-[#F3F4F7] z-[9999] flex flex-col items-center justify-center transition-opacity duration-500 ${
        fade ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <script
        dangerouslySetInnerHTML={{
          __html: `
            setTimeout(function() {
              var screen = document.getElementById('global-loading-screen');
              if (screen) {
                screen.style.transition = 'opacity 0.5s ease';
                screen.style.opacity = '0';
                screen.style.pointerEvents = 'none';
                setTimeout(function() {
                  screen.style.display = 'none';
                }, 500);
              }
            }, 1200);
          `
        }}
      />
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16 animate-pulse">
          <Image
            src="/logo.png"
            alt="DOMUN Logo"
            fill
            className="object-contain"
            priority
          />
        </div>

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
