'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import ValidationMessage from '@/components/ui/ValidationMessage';

interface PasswordRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PasswordRecoveryModal({
  isOpen,
  onClose,
}: PasswordRecoveryModalProps) {
  const [email, setEmail] = useState('');
  const [validationMessage, setValidationMessage] = useState('');
  const [validationStatus, setValidationStatus] = useState<'idle' | 'success' | 'warning' | 'error'>('idle');
  const [showValidation, setShowValidation] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setValidationMessage('Ingrese su correo electrónico');
      setValidationStatus('warning');
      setShowValidation(true);
      return;
    }

    // Validación de formato de email
    if (!email.includes('@')) {
      setValidationMessage('Ingrese un correo válido');
      setValidationStatus('error');
      setShowValidation(true);
      return;
    }

    setValidationMessage('Instrucciones enviadas correctamente');
    setValidationStatus('success');
    setShowValidation(true);
    
    setTimeout(() => {
      onClose();
      setEmail('');
      setShowValidation(false);
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="relative w-full max-w-xs bg-black rounded-2xl border border-white/10 p-6 shadow-2xl animate-slideUp">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        {/* Logo DOMUN */}
        <div className="mb-4 flex justify-center">
          <Image
            src="/white_logo.png"
            alt="DOMUN"
            width={40}
            height={40}
            className="h-[40px] w-auto"
          />
        </div>

        {/* Validación */}
        <div className="mb-3">
          <ValidationMessage
            status={validationStatus}
            message={validationMessage}
            show={showValidation}
            onClose={() => setShowValidation(false)}
          />
        </div>

        {/* Title */}
        <h2 className="font-poppins text-lg font-bold text-white text-center mb-2">
          Recuperar contraseña
        </h2>

        {/* Description */}
        <p className="font-poppins text-xs text-white/70 text-center mb-4">
          Ingresa tu correo electrónico y te enviaremos instrucciones para
          restablecer tu contraseña.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email input */}
          <div className="relative">
            <input
              type="email"
              placeholder="tu-email@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-[40px] bg-transparent border-b-2 border-white/30 text-white placeholder-white/40 font-poppins text-xs outline-none transition-all focus:border-red-400 focus:shadow-lg focus:shadow-red-500/20 pl-12 pr-4"
            />
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
            >
              <rect x="1" y="3" width="18" height="14" rx="2" />
              <path d="m1 3 9 7 9-7" />
            </svg>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="w-full h-[40px] bg-transparent border-2 border-white text-white font-poppins font-semibold text-sm rounded-full transition-all duration-300 hover:bg-white hover:text-gray-900 active:scale-95"
          >
            Enviar instrucciones
          </button>
        </form>

        {/* Cancel link */}
        <button
          type="button"
          onClick={onClose}
          className="w-full mt-3 font-poppins text-xs text-white/70 hover:text-white transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
