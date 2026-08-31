import type { Metadata, Viewport } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'
import LoadingScreen from '@/components/ui/LoadingScreen'
import Providers from '@/app/providers'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-poppins',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: 'DOMUN - Gestión inteligente de transporte',
  description: 'Sistema de control de obras',
  icons: {
    icon: '/logo.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${poppins.variable} scroll-smooth`}>
      <body className={`${poppins.className} min-h-screen bg-[#F3F4F7] text-[#07152B] antialiased`}>
        <Providers>
          <LoadingScreen />
          {children}
        </Providers>
      </body>
    </html>
  )
}
