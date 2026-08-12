'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import { Eye, EyeOff, User, Lock, Info, X, Check } from 'lucide-react';
import LoginInput from '@/components/ui/LoginInput';
import LoginButton from '@/components/ui/LoginButton';
import PasswordRecoveryModal from '@/components/modals/PasswordRecoveryModal';
import SupportModal from '@/components/modals/SupportModal';
import { api } from '@/lib/api/cliente';

const esDesarrollo = process.env.NODE_ENV !== 'production'

type AccesoRapido = {
  id: string
  name: string
  email: string
  password: string
  role: string
  roleLabel?: string
}

const ACCESOS_RAPIDOS: AccesoRapido[] = [
  {
    id: 'admin',
    name: 'Daniel Figueroa',
    email: 'daniel.figueroa@domunnet.test',
    password: 'mariobros25',
    role: 'Administrador',
  },
  {
    id: 'gerencia',
    name: 'Jorge Figueroa',
    email: 'jorge.figueroa@domunnet.test',
    password: 'mariobros25',
    role: 'Gerencia',
  },
  {
    id: 'ingeniero-residente',
    name: 'Raul Alvarado',
    email: 'raul.alvarado@domunnet.test',
    password: 'mariobros25',
    role: 'IngenieroResidente',
    roleLabel: 'Ingeniero Residente',
  },
  {
    id: 'laboratorista',
    name: 'Camila Figueroa',
    email: 'camila.figueroa@domunnet.test',
    password: 'mariobros25',
    role: 'Laboratorista',
  },
  {
    id: 'auxiliar-campo',
    name: 'Mario Tzul',
    email: 'mario.tzul@domunnet.test',
    password: 'mariobros25',
    role: 'AuxiliarDeCampo',
    roleLabel: 'Auxiliar de Campo',
  },
  {
    id: 'contratante',
    name: 'Paola Recinos',
    email: 'paola.recinos@domunnet.test',
    password: 'mariobros25',
    role: 'Contratante',
  },
]

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isPasswordRecoveryOpen, setIsPasswordRecoveryOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isQuickAccessOpen, setIsQuickAccessOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showErrorToast = (message: string) => {
    toast.dismiss();
    toast.custom(
      (t) => (
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #F0F0F0',
          borderRadius: '8px',
          padding: '8px 12px',
          fontFamily: "'Poppins', sans-serif",
          fontSize: '12px',
          color: '#1F1F1F',
          width: 'max-content',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
        }}>
          <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#FF4D4F', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <X size={11} color="#FFFFFF" strokeWidth={3} />
          </div>
          <span>{message}</span>
          <button type="button" onClick={() => toast.dismiss(t as unknown as number)} style={{ marginLeft: '4px', display: 'flex', alignItems: 'center', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
            <X size={14} color="#999" />
          </button>
        </div>
      ),
      { duration: 3500, position: 'top-center' }
    );
  };

  const showSuccessToast = (message: string) => {
    toast.dismiss();
    toast.custom(
      (t) => (
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #F0F0F0',
          borderRadius: '8px',
          padding: '8px 12px',
          fontFamily: "'Poppins', sans-serif",
          fontSize: '12px',
          color: '#1F1F1F',
          width: 'max-content',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
        }}>
          <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#52C41A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Check size={11} color="#FFFFFF" strokeWidth={3} />
          </div>
          <span>{message}</span>
          <button type="button" onClick={() => toast.dismiss(t as unknown as number)} style={{ marginLeft: '4px', display: 'flex', alignItems: 'center', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
            <X size={14} color="#999" />
          </button>
        </div>
      ),
      { duration: 3500, position: 'top-center' }
    );
  };

  const iniciarSesion = async (identificador: string, contrasena: string) => {
    await api.post('/auth/iniciar-sesion', {
      correo: identificador, // El backend recibe 'correo' pero el servicio de autenticacion del backend lo procesa como identificador (correo o username)
      contrasena,
    });

    showSuccessToast("¡Sesión iniciada correctamente!");

    setTimeout(() => {
      router.replace('/');
    }, 300);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!username.trim() || !password.trim()) {
      if (!username.trim()) setEmailError(true);
      if (!password.trim()) setPasswordError(true);

      showErrorToast("Ingresa tu correo/usuario y contraseña para continuar.");
      return;
    }

    setIsSubmitting(true);

    try {
      await iniciarSesion(username, password);
    } catch (error) {
      setEmailError(true);
      setPasswordError(true);
      showErrorToast("Credenciales incorrectas. Verifica tu usuario y contraseña.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gray-900">
      <style>{`
        [data-sonner-toast] {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
          width: auto !important;
        }
      `}</style>
      {/* Fondo con ilustración de camiones */}
      <div
        className="absolute inset-x-0 bottom-[-80px] w-full h-[120vh] overflow-hidden pointer-events-none"
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
        <div className="mb-1 text-center animate-fadeIn" style={{ animationDelay: '0.02s' }}>
          <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Bienvenido a DOMUN
          </h1>
        </div>

        {/* Subtítulo */}
        <div className="mb-4 text-center animate-fadeIn" style={{ animationDelay: '0.04s' }}>
          <p className="text-xs font-light text-white/80" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Gestión inteligente de transporte
          </p>
        </div>

        {/* Formulario de Login */}
        <form
          onSubmit={handleLogin}
          className="w-full max-w-xs animate-fadeIn"
          style={{ animationDelay: '0.06s' }}
        >
          {/* Input Usuario */}
          <div className="mb-4">
            <LoginInput
              icon={<User size={20} />}
              type="text"
              placeholder="Correo o usuario"
              value={username}
              error={emailError}
              onChange={(e) => {
                setUsername(e.target.value);
                if (emailError) setEmailError(false);
              }}
            />
          </div>

          {/* Input Contraseña */}
          <div className="mb-4">
            <LoginInput
              icon={<Lock size={20} />}
              type={showPassword ? 'text' : 'password'}
              placeholder="Contraseña"
              value={password}
              error={passwordError}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError(false);
              }}
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
        <div className="mt-6 text-center animate-fadeIn" style={{ animationDelay: '0.08s' }}>
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

        {/* Quick Access Link — solo en desarrollo */}
        {esDesarrollo && (
          <div className="mt-2 text-center animate-fadeIn" style={{ animationDelay: '0.1s' }}>
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
        )}
      </div>

      {/* Quick Access Modal — solo en desarrollo */}
      {esDesarrollo && isQuickAccessOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[9999] px-4">
          <div className="bg-gray-900/95 border border-gray-700 rounded-2xl p-5 w-full max-w-sm shadow-2xl animate-in">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#9B0F06]/20 border border-[#9B0F06]/40 flex items-center justify-center flex-shrink-0">
                  <Info size={14} className="text-[#cc1111]" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-base leading-tight">Acceso Rápido - Demo</h2>
                  <p className="text-gray-400 text-[11px] mt-0.5">Selecciona una cuenta para acceder</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickAccessOpen(false)}
                className="text-gray-400 hover:text-white transition-colors p-0.5"
                aria-label="Cerrar acceso rápido"
              >
                <X size={16} />
              </button>
            </div>

            {/* Roles Grid */}
            <div className="grid grid-cols-2 gap-2.5 mb-3">
              {ACCESOS_RAPIDOS.map((cuenta) => (
                <button
                  key={cuenta.id}
                  type="button"
                  onClick={() => {
                    setUsername(cuenta.email);
                    setPassword(cuenta.password);
                    setIsQuickAccessOpen(false);
                  }}
                  className="px-2.5 py-2.5 rounded-xl border border-gray-700 hover:border-[#9B0F06] hover:bg-[#9B0F06]/10 transition-all cursor-pointer text-center"
                >
                  <div className="text-white font-semibold text-xs leading-tight">
                    {cuenta.roleLabel ?? cuenta.role}
                  </div>
                  <div className="text-gray-400 text-[10px] mt-1 truncate">{cuenta.email}</div>
                </button>
              ))}
            </div>

            {/* Nota */}
            <div className="text-xs p-2.5 bg-[#9B0F06]/15 rounded-lg border border-[#9B0F06]/30 text-gray-300">
              <p>
                <span className="font-semibold text-white">Nota:</span>{' '}
                Estas son cuentas de prueba sembradas en el sistema para validar cada rol.
              </p>
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
