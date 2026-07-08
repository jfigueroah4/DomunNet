import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - DOMUN',
  description: 'Gestión inteligente de transporte',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
