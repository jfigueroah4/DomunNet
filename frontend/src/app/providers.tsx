'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { Toaster } from 'sonner'

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // Datos frescos por 1 minuto
            refetchOnWindowFocus: false, // Desactivar refetch en foco por defecto
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <style dangerouslySetInnerHTML={{ __html: `
        /* Centrado exacto horizontal y superior para todos los Toasts */
        [data-sonner-toaster] {
          position: fixed !important;
          top: 24px !important;
          left: 50% !important;
          right: auto !important;
          bottom: auto !important;
          transform: translateX(-50%) !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          width: max-content !important;
          max-width: 94vw !important;
          margin: 0 auto !important;
          z-index: 999999 !important;
          pointer-events: none !important;
        }

        [data-sonner-toaster] ol {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          width: 100% !important;
          margin: 0 auto !important;
          padding: 0 !important;
          list-style: none !important;
        }

        [data-sonner-toaster] li {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          margin: 0 auto !important;
          width: max-content !important;
        }

        [data-sonner-toast] {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
          width: max-content !important;
          max-width: 94vw !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          margin: 0 auto !important;
          pointer-events: auto !important;
          transition: transform 280ms cubic-bezier(0.16, 1, 0.3, 1), opacity 280ms cubic-bezier(0.16, 1, 0.3, 1) !important;
        }

        [data-sonner-toast][data-mounted='true'] {
          opacity: 1 !important;
          transform: translateY(0) scale(1) !important;
        }

        [data-sonner-toast][data-mounted='false'] {
          opacity: 0 !important;
          transform: translateY(-8px) scale(0.96) !important;
        }

        [data-sonner-toast][data-removed='true'] {
          opacity: 0 !important;
          transform: translateY(-8px) scale(0.96) !important;
        }

        @media (max-width: 768px) {
          [data-sonner-toaster] {
            left: 0 !important;
            right: 0 !important;
            top: max(12px, env(safe-area-inset-top, 0px)) !important;
            transform: none !important;
            width: 100vw !important;
            max-width: 100vw !important;
            padding: 0 12px !important;
            box-sizing: border-box !important;
          }

          [data-sonner-toaster] ol,
          [data-sonner-toaster] li,
          [data-sonner-toast] {
            width: 100% !important;
            max-width: 100% !important;
          }

          .custom-toast {
            width: fit-content !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            white-space: normal !important;
          }

          .custom-toast > span {
            white-space: normal !important;
            overflow-wrap: anywhere !important;
          }
        }
      `}} />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 5000,
          style: {
            background: "transparent",
            boxShadow: "none",
            border: "none",
            padding: 0,
          },
        }}
      />
      {children}
    </QueryClientProvider>
  )
}
