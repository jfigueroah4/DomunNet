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
      <Toaster 
        position="top-center" 
        visibleToasts={1} 
        duration={4500} 
        toastOptions={{
          style: {
            top: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'max-content',
            margin: 0,
            transition: 'all 0.4s ease-in-out'
          }
        }}
      />
      {children}
    </QueryClientProvider>
  )
}
