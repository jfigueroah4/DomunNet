'use client';

import { ArrowLeft, Mail, GraduationCap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function SoportePage() {
  const router = useRouter();

  const supportInfo = {
    name: 'Josue Daniel Figueroa Herrera',
    phone: '+502 56252922',
    personalEmail: 'josuedanielf2002@gmail.com',
    universityEmail: 'jfigueroah4@miumg.edu.gt',
    university: 'Universidad Mariano Gálvez de Guatemala, Sede Villa Nueva',
    carneId: '5090-22-36',
  };

  return (
    <div className="min-h-[calc(100vh-170px)] sm:min-h-[calc(100vh-140px)] flex flex-col justify-center py-4 sm:py-6 px-1.5 sm:px-3 max-w-[1200px] mx-auto font-[Poppins]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600 cursor-pointer"
            title="Volver"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">Soporte</h1>
            <p className="text-xs text-gray-500 font-medium">Información institucional y contacto del desarrollador</p>
          </div>
        </div>
      </div>

      {/* Grid: 2 cuadros apilados uno sobre el otro + Tarjeta con el Logo UMG en Grande al lado */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
        {/* Columna Izquierda: Los 2 cuadros de info uno encima del otro */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4 sm:gap-5 justify-between">
          {/* Cuadro 1 - Información de Contacto */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-gray-100">
                <div className="p-1.5 rounded-lg bg-red-50 text-[#9B0F06]">
                  <Mail size={18} />
                </div>
                <h3 className="text-base sm:text-[17px] font-bold text-gray-900">Información de Contacto</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                    Teléfono
                  </label>
                  <a
                    href={`tel:${supportInfo.phone}`}
                    className="text-sm sm:text-base font-semibold text-gray-800 break-words mt-1 block hover:text-[#9B0F06] transition-colors"
                  >
                    {supportInfo.phone}
                  </a>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                    Correo Personal
                  </label>
                  <a
                    href={`mailto:${supportInfo.personalEmail}`}
                    className="text-sm sm:text-base font-semibold text-gray-800 break-words mt-1 block hover:text-[#9B0F06] transition-colors"
                  >
                    {supportInfo.personalEmail}
                  </a>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                    Correo Universitario
                  </label>
                  <a
                    href={`mailto:${supportInfo.universityEmail}`}
                    className="text-sm sm:text-base font-semibold text-gray-800 break-words mt-1 block hover:text-[#9B0F06] transition-colors"
                  >
                    {supportInfo.universityEmail}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Cuadro 2 - Información Institucional */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-gray-100">
                <div className="p-1.5 rounded-lg bg-red-50 text-[#9B0F06]">
                  <GraduationCap size={18} />
                </div>
                <h3 className="text-base sm:text-[17px] font-bold text-gray-900">Información Institucional</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                    Universidad
                  </label>
                  <p className="text-sm sm:text-base font-semibold text-gray-800 break-words mt-1">
                    {supportInfo.university}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                    Carné
                  </label>
                  <p className="text-sm sm:text-base font-semibold text-gray-800 break-words mt-1">
                    {supportInfo.carneId}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                    Responsable
                  </label>
                  <p className="text-sm sm:text-base font-semibold text-gray-800 break-words mt-1">
                    {supportInfo.name}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Tarjeta con el Logo UMG en Grande */}
        <div className="lg:col-span-5 xl:col-span-4 flex">
          <div className="w-full bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="relative w-44 h-44 sm:w-52 sm:h-52 md:w-56 md:h-56">
              <Image
                src="/logoumg.png"
                alt="Logo UMG"
                fill
                sizes="(max-width: 768px) 220px, 260px"
                style={{ objectFit: 'contain' }}
                priority
              />
            </div>
            <div className="mt-4 text-center">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">{supportInfo.name}</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-xs">
                Universidad Mariano Gálvez de Guatemala
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
