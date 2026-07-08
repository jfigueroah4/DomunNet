'use client';

import { Mail, Phone, User, CreditCard, Building2, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function SoportePage() {
  const supportInfo = {
    name: 'Marco Estrada',
    phone: '+34 650 123 456',
    personalEmail: 'marco.estrada@outlook.com',
    universityEmail: 'marco.estrada@universidad.edu.es',
    university: 'Universidad Autonoma de Madrid',
    carneId: 'UAM-2024-87654',
  };

  const contactItems = [
    { label: 'Nombre', value: supportInfo.name, icon: User, color: 'red' },
    { label: 'Telefono', value: supportInfo.phone, href: `tel:${supportInfo.phone}`, icon: Phone, color: 'blue' },
    { label: 'Correo Personal', value: supportInfo.personalEmail, href: `mailto:${supportInfo.personalEmail}`, icon: Mail, color: 'purple' },
    { label: 'Correo Universitario', value: supportInfo.universityEmail, href: `mailto:${supportInfo.universityEmail}`, icon: Mail, color: 'green' },
    { label: 'Universidad', value: supportInfo.university, icon: Building2, color: 'yellow' },
    { label: 'Carne', value: supportInfo.carneId, icon: CreditCard, color: 'indigo' },
  ];

  const colorClasses: Record<string, string> = {
    red: 'bg-red-50 text-red-700',
    blue: 'bg-blue-50 text-blue-700',
    purple: 'bg-purple-50 text-purple-700',
    green: 'bg-green-50 text-green-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    indigo: 'bg-indigo-50 text-indigo-700',
  };

  return (
    <div className="h-full overflow-hidden bg-gray-50 px-6 py-6">
      <div className="max-w-6xl">
        <div className="mb-5">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-red-700 transition-colors hover:text-red-800"
          >
            <ChevronLeft size={16} />
            Volver al inicio
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Soporte</h1>
          <p className="mt-2 text-xs text-gray-500">Informacion de contacto y datos de perfil</p>
        </div>

        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[1fr_360px]">
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {contactItems.map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.label} className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50/60 p-3">
                    <div className={`rounded-lg p-2.5 ${colorClasses[item.color]}`}>
                      <Icon size={17} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{item.label}</p>
                      {item.href ? (
                        <a
                          href={item.href}
                          className="mt-0.5 block truncate text-sm font-semibold text-gray-900 transition-colors hover:text-red-700"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="mt-0.5 text-sm font-semibold text-gray-900">{item.value}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-bold text-gray-900">Canales de Soporte</h2>
            <div className="space-y-3">
              <a
                href={`mailto:${supportInfo.personalEmail}`}
                className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all hover:border-red-600 hover:bg-red-50"
              >
                <Mail size={18} className="text-gray-400 group-hover:text-red-700" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-700 group-hover:text-red-700">Enviar correo</p>
                  <p className="truncate text-xs text-gray-500">{supportInfo.personalEmail}</p>
                </div>
              </a>
              <a
                href={`tel:${supportInfo.phone}`}
                className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all hover:border-blue-600 hover:bg-blue-50"
              >
                <Phone size={18} className="text-gray-400 group-hover:text-blue-700" />
                <div>
                  <p className="text-xs font-semibold text-gray-700 group-hover:text-blue-700">Llamar</p>
                  <p className="text-xs text-gray-500">{supportInfo.phone}</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
