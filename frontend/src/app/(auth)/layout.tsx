import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Sistema para la gestión de proyectos',
  icons: {
    icon: [
      { url: '/logo.png?v=3', type: 'image/png' },
      { url: '/favicon.ico?v=3', type: 'image/x-icon' },
    ],
    shortcut: '/logo.png?v=3',
    apple: '/logo.png?v=3',
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
