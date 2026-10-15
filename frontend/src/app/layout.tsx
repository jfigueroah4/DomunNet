import type { Metadata, Viewport } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'
import LoadingScreen from '@/components/ui/LoadingScreen'
import Providers from '@/app/providers'
import CookieBanner from '@/components/ui/CookieBanner'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-poppins',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#9B0F06',
}

export const metadata: Metadata = {
  title: {
    default: 'DOMUN | Sistema para la Gestión de Proyectos',
    template: '%s - DOMUN',
  },
  description: 'Plataforma integral para la gestión de proyectos, estimaciones presupuestarias, bitácora de campo Libro Azul DGC y supervisión técnica de infraestructura.',
  keywords: [
    'DOMUN',
    'control de obras',
    'gestión de proyectos',
    'supervisión de infraestructura',
    'hoja sábana DGC',
    'Libro Azul',
    'estimaciones financieras',
    'bitácora digital',
  ],
  authors: [{ name: 'DOMUN' }],
  creator: 'DOMUN',
  publisher: 'DOMUN',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://domun.net'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'DOMUN | Sistema para la Gestión de Proyectos',
    description: 'Plataforma integral para la gestión de proyectos, estimaciones presupuestarias y supervisión técnica de infraestructura.',
    url: 'https://domun.net',
    siteName: 'DOMUN',
    locale: 'es_GT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DOMUN',
    description: 'Sistema para la gestión y supervisión de proyectos',
  },
  icons: {
    icon: [
      { url: '/logo.png?v=3', type: 'image/png' },
      { url: '/favicon.ico?v=3', type: 'image/x-icon' },
    ],
    shortcut: '/logo.png?v=3',
    apple: '/logo.png?v=3',
  },
  robots: {
    index: true,
    follow: true,
  },
}

const jsonLdStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'DOMUN-Sistema',
  operatingSystem: 'Web, Windows, Android, iOS',
  applicationCategory: 'BusinessApplication',
  description: 'Sistema integral de control de obras, bitácora digital, estimaciones presupuestarias y supervisión analítica de proyectos.',
  url: 'https://domun.net',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'GTQ',
  },
  publisher: {
    '@type': 'Organization',
    name: 'DOMUN',
    url: 'https://domun.net',
    logo: 'https://domun.net/logo.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${poppins.variable} scroll-smooth`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdStructuredData) }}
        />
      </head>
      <body className={`${poppins.className} min-h-screen bg-[#F3F4F7] text-[#07152B] antialiased`}>
        <Providers>
          <LoadingScreen />
          {children}
          <CookieBanner />
        </Providers>
      </body>
    </html>
  )
}
