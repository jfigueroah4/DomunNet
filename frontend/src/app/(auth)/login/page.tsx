'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCustomToast } from '@/hooks/useCustomToast';
import { Eye, EyeOff, User, Lock, Info, X } from 'lucide-react';
import LoginInput from '@/components/ui/LoginInput';
import LoginButton from '@/components/ui/LoginButton';
import PasswordRecoveryModal from '@/components/modals/PasswordRecoveryModal';
import SupportModal from '@/components/modals/SupportModal';
import { api } from '@/lib/api/cliente';

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

  const { showErrorToast, showSuccessToast } = useCustomToast();

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
    <div 
      className="relative min-h-screen w-full overflow-hidden bg-[#1a0000]"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      {/* Fondo con ilustración de camiones */}
      <div
        className="absolute inset-x-0 bottom-[-80px] w-full h-[120vh] overflow-hidden pointer-events-none"
        style={{
          backgroundImage: 'url(/fondo_carretas.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
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

      {/* TOP NAVBAR */}
      <div className="absolute top-0 left-0 right-0 h-[64px] z-20 flex items-center justify-end pr-6 pointer-events-auto">
        <button
          type="button"
          onClick={() => setIsQuickAccessOpen(true)}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "8px",
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            color: "rgba(255, 255, 255, 0.7)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
            fontSize: "18px",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
            e.currentTarget.style.color = "rgba(255, 255, 255, 0.9)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
            e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
          }}
          title="Ayuda y acceso rápido"
        >
          ?
        </button>
      </div>

      {/* Contenedor principal centrado */}
      <div 
        className="relative z-10 flex flex-col items-center w-[90%] max-w-[300px]"
        style={{ transform: 'translateY(-12%)' }}
      >

        {/* Logo DOMUN */}
        <div className="mb-3 animate-fadeIn">
          <Image
            src="/white_logo.png"
            alt="DOMUN Logo"
            width={50}
            height={48}
            priority
            style={{ width: 'auto', height: '48px' }}
            className="drop-shadow-lg"
          />
        </div>

        {/* Título */}
        <div className="mb-1 text-center animate-fadeIn" style={{ animationDelay: '0.02s' }}>
          <h1 className="text-[22px] font-bold text-white leading-tight" style={{ fontFamily: 'Poppins, sans-serif', textShadow: "0 2px 12px rgba(0,0,0,0.4)" }}>
            Bienvenido a DOMUN
          </h1>
        </div>

        {/* Subtítulo */}
        <div className="mb-6 text-center animate-fadeIn" style={{ animationDelay: '0.04s' }}>
          <p className="text-[12px] font-light text-white/70" style={{ fontFamily: 'Poppins, sans-serif', letterSpacing: "0.02em" }}>
            Gestión inteligente de transporte
          </p>
        </div>

        {/* Formulario de Login */}
        <form
          onSubmit={handleLogin}
          className="w-full animate-fadeIn"
          style={{ animationDelay: '0.06s' }}
        >
          {/* Input Usuario */}
          <div className="mb-[14px]">
            <LoginInput
              icon={<User size={16} strokeWidth={1.5} />}
              placeholder="Correo o Usuario"
              value={username}
              error={emailError}
              onChange={(e) => {
                setUsername(e.target.value);
                if (emailError) setEmailError(false);
              }}
              required
            />
          </div>

          {/* Input Contraseña */}
          <div className="mb-[10px]">
            <LoginInput
              icon={<Lock size={16} strokeWidth={1.5} />}
              type={showPassword ? 'text' : 'password'}
              placeholder="Contraseña"
              value={password}
              error={passwordError}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError(false);
              }}
              required
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-white/60 hover:text-white transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                </button>
              }
            />
          </div>

          {/* Opciones extra: Recordarme y Olvidaste tu contraseña */}
          <div className="mt-[8px] mb-[22px] flex items-center justify-between">
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
      </div>

      {/* Quick Access Modal */}
      {isQuickAccessOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsQuickAccessOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 9998,
              backdropFilter: 'blur(4px)',
            }}
          />

          {/* Modal */}
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 9999,
              width: '90%',
              maxWidth: '420px',
            }}
          >
            <div
              style={{
                background: 'rgba(26, 0, 0, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '24px',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <div
                    style={{
                      padding: '8px',
                      background: 'rgba(155, 15, 6, 0.15)',
                      border: '1px solid rgba(155, 15, 6, 0.3)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Info size={16} color="#ef4444" />
                  </div>
                  <div>
                    <h2
                      style={{
                        margin: '0',
                        fontSize: '15px',
                        fontWeight: 700,
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontFamily: "'Poppins', sans-serif",
                      }}
                    >
                      Acceso Rápido - Demo
                    </h2>
                    <p
                      style={{
                        margin: '2px 0 0',
                        fontSize: '12px',
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontFamily: "'Poppins', sans-serif",
                      }}
                    >
                      Selecciona una cuenta para acceder
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsQuickAccessOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'rgba(255, 255, 255, 0.6)',
                    padding: '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.2s',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.color = 'white'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Accounts Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  marginBottom: '16px',
                }}
              >
                {ACCESOS_RAPIDOS.map((cuenta) => (
                  <button
                    key={cuenta.id}
                    type="button"
                    onClick={() => {
                      setUsername(cuenta.email);
                      setPassword(cuenta.password);
                      setIsQuickAccessOpen(false);
                    }}
                    style={{
                      padding: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      background: 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontFamily: "'Poppins', sans-serif",
                      minWidth: '0',
                      textAlign: 'center',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                      e.currentTarget.style.borderColor = 'rgba(155, 15, 6, 0.3)'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'rgba(255, 255, 255, 0.9)',
                        marginBottom: '4px',
                      }}
                    >
                      {cuenta.roleLabel ?? cuenta.role}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'rgba(255, 255, 255, 0.6)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {cuenta.email}
                    </div>
                  </button>
                ))}
              </div>

              {/* Info Box */}
              <div
                style={{
                  padding: '12px',
                  background: 'rgba(155, 15, 6, 0.15)',
                  border: '1px solid rgba(155, 15, 6, 0.3)',
                  borderRadius: '8px',
                }}
              >
                <p
                  style={{
                    margin: '0',
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontFamily: "'Poppins', sans-serif",
                    lineHeight: '1.4',
                  }}
                >
                  <strong className="text-white font-semibold">Nota:</strong> Estas son cuentas de prueba sembradas en el sistema para validar cada rol.
                </p>
              </div>
            </div>
          </div>
        </>
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
