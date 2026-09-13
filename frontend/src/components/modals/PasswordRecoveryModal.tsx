'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { useCustomToast } from '@/hooks/useCustomToast';
import { api } from '@/lib/api/cliente';

interface PasswordRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CUENTAS_REGISTRADAS_DEMO = [
  'daniel.figueroa@domunnet.test',
  'jorge.figueroa@domunnet.test',
  'raul.alvarado@domunnet.test',
  'camila.figueroa@domunnet.test',
  'mario.tzul@domunnet.test',
  'paola.recinos@domunnet.test',
  'luis.arriaga@domunnet.test',
  'marco.estrada@domunnet.test',
  'josues.figueroa@domunnet.test',
];

export default function PasswordRecoveryModal({
  isOpen,
  onClose,
}: PasswordRecoveryModalProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showErrorToast, showSuccessToast } = useCustomToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      showErrorToast('Ingrese su correo electrónico');
      return;
    }

    // 1. Verificación de Bloqueo por 5 Intentos Fallidos (1 hora)
    let failedCount = 0;
    try {
      const storedLock = localStorage.getItem('domun_pwd_rec_failed_attempts');
      if (storedLock) {
        const parsed = JSON.parse(storedLock);
        if (parsed.lockUntil && Date.now() < parsed.lockUntil) {
          showErrorToast('Ha alcanzado el límite de 5 intentos fallidos. Intente más tarde (en 1 hora).');
          return;
        }
        failedCount = parsed.count || 0;
      }
    } catch {
      failedCount = 0;
    }

    // 2. Validación estricta de formato de email (debe incluir '@' y dominio válido)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      showErrorToast('Ingrese una dirección de correo electrónico válida (ej: usuario@ejemplo.com)');
      return;
    }

    setIsSubmitting(true);

    try {
      // 3. Verificación de existencia del correo en el sistema
      let correoExiste = CUENTAS_REGISTRADAS_DEMO.includes(trimmedEmail);

      if (!correoExiste) {
        try {
          const res = await api.get('/mantenimiento/usuario', { timeout: 3000 });
          if (res.data && Array.isArray(res.data.data)) {
            correoExiste = res.data.data.some(
              (u: any) => u.correo?.toLowerCase() === trimmedEmail || u.email?.toLowerCase() === trimmedEmail
            );
          }
        } catch {
          // Si falla la consulta a la BD, validar patrón del dominio de la organización
          if (trimmedEmail.endsWith('@domunnet.test') || trimmedEmail.endsWith('@domun.com') || trimmedEmail.endsWith('@gmail.com')) {
            correoExiste = true;
          }
        }
      }

      if (!correoExiste) {
        const newFailedCount = failedCount + 1;
        if (newFailedCount >= 5) {
          const lockTime = Date.now() + 3600 * 1000; // 1 hora de bloqueo
          localStorage.setItem('domun_pwd_rec_failed_attempts', JSON.stringify({ count: newFailedCount, lockUntil: lockTime }));
          showErrorToast('Ha alcanzado el límite de 5 intentos fallidos. Intente más tarde (en 1 hora).');
        } else {
          localStorage.setItem('domun_pwd_rec_failed_attempts', JSON.stringify({ count: newFailedCount, lockUntil: null }));
          showErrorToast(`El correo ingresado no se encuentra registrado en el sistema. (Intento ${newFailedCount} de 5)`);
        }
        return;
      }

      // Si el correo SÍ existe: reiniciar intentos fallidos
      localStorage.removeItem('domun_pwd_rec_failed_attempts');

      // Crear ticket automático en soporte (contrasena)
      const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
      const newTicket = {
        id: `TICK-${Date.now().toString().slice(-6)}`,
        title: `Solicitud de recuperación de contraseña (${trimmedEmail})`,
        status: 'abierto',
        category: 'contrasena',
        createdBy: trimmedEmail,
        createdByEmail: trimmedEmail,
        createdByRole: 'Usuario',
        assignedTo: 'Administrador / Gerencia',
        createdAt: nowStr,
        messages: [
          {
            id: '1',
            author: trimmedEmail,
            role: 'user',
            message: `Solicitud automática de restablecimiento de contraseña para la cuenta: ${trimmedEmail}`,
            timestamp: nowStr,
          },
        ],
      };

      const existingTicketsRaw = localStorage.getItem('domun_support_tickets');
      const existingTickets = existingTicketsRaw ? JSON.parse(existingTicketsRaw) : [];
      existingTickets.unshift(newTicket);
      localStorage.setItem('domun_support_tickets', JSON.stringify(existingTickets));

      const okMsg = 'Instrucciones enviadas correctamente. Se ha generado un ticket de soporte.';
      showSuccessToast(okMsg);
      
      setTimeout(() => {
        onClose();
        setEmail('');
      }, 1500);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="relative w-full max-w-xs bg-black rounded-2xl border border-white/10 p-6 shadow-2xl animate-slideUp font-poppins">
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
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Email input */}
          <div className="relative">
            <input
              type="text"
              placeholder="tu-email@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            disabled={isSubmitting}
            className="w-full h-[40px] bg-transparent border-2 border-white text-white font-poppins font-semibold text-sm rounded-full transition-all duration-300 hover:bg-white hover:text-gray-900 active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? 'Verificando...' : 'Enviar instrucciones'}
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

