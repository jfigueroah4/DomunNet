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
        /* Estilos de animación fade suave para Sonner toast */
        [data-sonner-toaster] {
          top: 24px !important;
        }

        [data-sonner-toast] {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
          width: auto !important;
          max-width: none !important;
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
      `}} />
      <Toaster
        position="top-center"
        maxToasts={3}
        toastOptions={{
          duration: 3500,
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
