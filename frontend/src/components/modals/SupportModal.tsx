'use client';

import Image from 'next/image';
import { X, Mail, Phone } from 'lucide-react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SupportModal({ isOpen, onClose }: SupportModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xs bg-black rounded-2xl border border-white/10 p-6 shadow-2xl animate-slideUp">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        {/* UMG Logo */}
        <div className="mb-4 flex justify-center">
          <Image
            src="/logoumg.png"
            alt="Universidad Mariano Gálvez"
            width={60}
            height={60}
            className="h-[60px] w-auto"
          />
        </div>

        {/* Title */}
        <h2 className="font-poppins text-lg font-bold text-white text-center mb-1">
          Soporte Técnico
        </h2>

        {/* Subtitle */}
        <p className="font-poppins text-xs text-white/60 text-center mb-3">
          Universidad Mariano Gálvez de Guatemala
        </p>

        {/* Description */}
        <p className="font-poppins text-xs text-white/70 text-center mb-4">
          Para asistencia con tu cuenta o contraseña, comunicate con el equipo
          de soporte:
        </p>

        {/* Support Contacts */}
        <div className="space-y-2">
          {/* Email */}
          <a
            href="mailto:soporte@umg.edu.gt"
            className="flex items-center gap-3 w-full h-[40px] px-3 bg-transparent border-2 border-white/30 rounded-lg text-white hover:border-white/60 hover:bg-white/5 transition-all duration-300 group"
          >
            <Mail size={18} className="text-white/70 group-hover:text-white transition-colors" />
            <span className="font-poppins text-xs group-hover:text-white">
              soporte@umg.edu.gt
            </span>
          </a>

          {/* Phone */}
          <a
            href="tel:+5022411800"
            className="flex items-center gap-3 w-full h-[40px] px-3 bg-transparent border-2 border-white/30 rounded-lg text-white hover:border-white/60 hover:bg-white/5 transition-all duration-300 group"
          >
            <Phone size={18} className="text-white/70 group-hover:text-white transition-colors" />
            <span className="font-poppins text-xs group-hover:text-white">
              +502 2411-1800
            </span>
          </a>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full mt-4 h-[40px] bg-transparent border-2 border-white text-white font-poppins font-semibold text-sm rounded-full transition-all duration-300 hover:bg-white hover:text-gray-900 active:scale-95"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
