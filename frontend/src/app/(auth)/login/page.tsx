'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { isAxiosError } from 'axios';
import { Eye, EyeOff, User, Lock, Info, X } from 'lucide-react';
import LoginInput from '@/components/ui/LoginInput';
import LoginButton from '@/components/ui/LoginButton';
import ValidationMessage from '@/components/ui/ValidationMessage';
import PasswordRecoveryModal from '@/components/modals/PasswordRecoveryModal';
import SupportModal from '@/components/modals/SupportModal';
import { api } from '@/lib/api/cliente';

const ACCESOS_RAPIDOS = [
  {
    id: 'admin',
    name: 'Natalia Aguilar',
    email: 'natalia.aguilar@gmail.com',
    password: 'Admin123*',
    role: 'Administrador',
  },
  {
    id: 'supervisor',
    name: 'Marco Estrada',
    email: 'marco.estrada@outlook.com',
    password: 'Supervisor123*',
    role: 'Supervisor',
  },
  {
    id: 'inspector',
    name: 'Valeria Cifuentes',
    email: 'valeria.cifuentes@gmail.com',
    password: 'Inspector123*',
    role: 'Inspector',
  },
  {
    id: 'campo',
    name: 'Luis Arriaga',
    email: 'luis.arriaga@outlook.com',
    password: 'Campo123*',
    role: 'Campo',
  },
  {
    id: 'contratista',
    name: 'Andrés Lemus',
    email: 'andres.lemus@gmail.com',
    password: 'Contratista123*',
    role: 'Contratista',
  },
  {
    id: 'gerencia',
    name: 'Paola Barrios',
    email: 'paola.barrios@gmail.com',
    password: 'Gerencia123*',
    role: 'Gerencia',
  },
  {
    id: 'contratante',
    name: 'Sofía Montenegro',
    email: 'sofia.montenegro@gmail.com',
    password: 'Contratante123*',
    role: 'Contratante',
  },
  {
    id: 'proveedor',
    name: 'Claudia Rosales',
    email: 'claudia.rosales@gmail.com',
    password: 'Proveedor123*',
    role: 'Proveedor',
  },
]

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isPasswordRecoveryOpen, setIsPasswordRecoveryOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isQuickAccessOpen, setIsQuickAccessOpen] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [validationStatus, setValidationStatus] = useState<'idle' | 'success' | 'warning' | 'error'>('idle');
  const [showValidation, setShowValidation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const iniciarSesion = async (correo: string, contrasena: string) => {
    await api.post('/auth/iniciar-sesion', {
      correo,
      contrasena,
    });

    setValidationMessage('¡Bienvenido!');
    setValidationStatus('success');
    setShowValidation(true);

    setTimeout(() => {
      router.replace('/');
    }, 300);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }
    
    // Validaciones básicas
    if (!username) {
      setValidationMessage('Ingrese su usuario');
      setValidationStatus('warning');
      setShowValidation(true);
      return;
    }

    if (!password) {
      setValidationMessage('Ingrese su contraseña');
      setValidationStatus('warning');
      setShowValidation(true);
      return;
    }

    setIsSubmitting(true);

    try {
      await iniciarSesion(username, password);
    } catch (error) {
      const mensaje = isAxiosError(error)
        ? (error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo iniciar sesión'
        : 'No se pudo iniciar sesión';

      setValidationMessage(mensaje);
      setValidationStatus('error');
      setShowValidation(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gray-900">
      {/* Fondo con ilustración de camiones */}
      <div
        className="absolute inset-x-0 bottom-[-80px] w-full h-[120vh] overflow-hidden"
        style={{
          backgroundImage: 'url(/fondo_carretas.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom',
          backgroundAttachment: 'fixed',
        }}
      >
        {/* Gradient overlay suave y animado */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#cc1111] via-[#9B0F06] to-[#e63b00] opacity-20" />

        {/* Animated radial gradient pulse */}
        <div className="absolute inset-0 animate-pulse-gradient bg-gradient-radial from-[rgba(200,0,0,0.1)] to-[rgba(80,0,0,0.15)]" />

        {/* Overlay oscuro adicional para mejor legibilidad */}
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* Contenedor principal centrado */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-6">
        {/* Notificación de validación - Posición fija sin afectar layout */}
        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-full max-w-xs">
          <ValidationMessage
            status={validationStatus}
            message={validationMessage}
            show={showValidation}
            onClose={() => setShowValidation(false)}
          />
        </div>

        {/* Logo DOMUN */}
        <div className="mb-3 animate-fadeIn">
          <Image
            src="/white_logo.png"
            alt="DOMUN Logo"
            width={50}
            height={50}
            priority
            style={{ width: 'auto', height: '50px' }}
            className="drop-shadow-lg"
          />
        </div>

        {/* Título */}
        <div className="mb-1 text-center animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Bienvenido a DOMUN
          </h1>
        </div>

        {/* Subtítulo */}
        <div className="mb-4 text-center animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          <p className="text-xs font-light text-white/80" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Gestión inteligente de transporte
          </p>
        </div>

        {/* Formulario de Login */}
        <form
          onSubmit={handleLogin}
          className="w-full max-w-xs animate-fadeIn"
          style={{ animationDelay: '0.3s' }}
        >
          {/* Input Usuario */}
          <div className="mb-4">
            <LoginInput
              icon={<User size={20} />}
              type="text"
              placeholder="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          {/* Input Contraseña */}
          <div className="mb-4">
            <LoginInput
              icon={<Lock size={20} />}
              type={showPassword ? 'text' : 'password'}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-white/70 hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              }
            />
          </div>

          {/* Checkbox y Forgot Password */}
          <div className="mb-4 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border border-white/50 bg-transparent cursor-pointer accent-red-600"
              />
              <span className="text-xs text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>Recuérdame</span>
            </label>

            <button
              type="button"
              onClick={() => setIsPasswordRecoveryOpen(true)}
              className="text-xs text-white hover:text-white/80 transition-colors"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {/* Login Button */}
          <LoginButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Ingresando...' : 'Iniciar sesión'}
          </LoginButton>
        </form>

        {/* Support Link */}
        <div className="mt-6 text-center animate-fadeIn" style={{ animationDelay: '0.4s' }}>
          <button
            type="button"
            onClick={() => setIsSupportOpen(true)}
            className="text-xs text-white hover:text-white/80 transition-colors flex items-center justify-center gap-2 mx-auto group"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            ¿Necesitas ayuda?{' '}
            <span className="text-red-400 group-hover:text-red-300 transition-colors">
              Contactar soporte
            </span>
          </button>
        </div>

        {/* Quick Access Link */}
        <div className="mt-2 text-center animate-fadeIn" style={{ animationDelay: '0.5s' }}>
          <button
            type="button"
            onClick={() => setIsQuickAccessOpen(true)}
            className="text-xs text-white hover:text-white/80 transition-colors flex items-center justify-center gap-2 mx-auto group"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            <Info size={13} />
            <span>Acceso Rápido</span>
          </button>
        </div>
      </div>

      {/* Quick Access Modal */}
      {isQuickAccessOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-red-500 flex items-center justify-center flex-shrink-0">
                  <Info size={14} className="text-red-500" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">Acceso Rápido</h2>
                  <p className="text-gray-400 text-xs mt-1">Selecciona una cuenta válida para entrar al sistema</p>
                </div>
              </div>
              <button
                onClick={() => setIsQuickAccessOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Roles Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {ACCESOS_RAPIDOS.map((role) => (
                <button
                  key={role.id}
                  onClick={async () => {
                    setIsQuickAccessOpen(false);
                    setIsSubmitting(true);

                    try {
                      setUsername(role.email);
                      setPassword(role.password);
                      await iniciarSesion(role.email, role.password);
                    } catch (error) {
                      const mensaje = isAxiosError(error)
                        ? (error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo iniciar sesión'
                        : 'No se pudo iniciar sesión';

                      setValidationMessage(mensaje);
                      setValidationStatus('error');
                      setShowValidation(true);
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  className="p-3 rounded-xl border border-gray-700 hover:border-red-500 hover:bg-red-500/10 transition-all cursor-pointer text-center"
                >
                  <div className="text-white font-semibold text-sm">{role.name}</div>
                  <div className="text-gray-400 text-xs mt-1 truncate">{role.email}</div>
                  <div className="text-gray-500 text-[10px] mt-1 truncate">{role.role}</div>
                </button>
              ))}
            </div>

            {/* Nota */}
            <div className="text-gray-400 text-xs p-3 bg-gray-800 rounded-lg border border-gray-700">
              <p className="font-medium text-gray-300 mb-1">Nota:</p>
              <p>Estas son las credenciales reales de acceso inicial sembradas en el sistema.</p>
            </div>
          </div>
        </div>
      )}

      {/* Modales */}
      <PasswordRecoveryModal
        isOpen={isPasswordRecoveryOpen}
        onClose={() => setIsPasswordRecoveryOpen(false)}
      />
      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
      />
    </div>
  );
}
