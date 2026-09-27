'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useCustomToast } from '@/hooks/useCustomToast';
import { Eye, EyeOff, User, Lock, Info, X, ChevronDown, Trash2 } from 'lucide-react';
import LoginInput from '@/components/ui/LoginInput';
import LoginButton from '@/components/ui/LoginButton';
import PasswordRecoveryModal from '@/components/modals/PasswordRecoveryModal';
import SupportModal from '@/components/modals/SupportModal';
import { api } from '@/lib/api/cliente';

import { useRef } from 'react';

type AccesoRapido = {
  id: string
  name: string
  email: string
  password: string
  role: string
  roleLabel?: string
}

type SavedAccount = {
  username: string
  password?: string
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
    name: 'Mario Tzul',
    email: 'mario.tzul@domunnet.test',
    password: 'mariobros25',
    role: 'Laboratorista',
  },
  {
    id: 'auxiliar-campo',
    name: 'Camila Figueroa',
    email: 'camila.figueroa@domunnet.test',
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
  const passwordInputRef = useRef<HTMLInputElement>(null);
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
  const [rememberedAccounts, setRememberedAccounts] = useState<SavedAccount[]>([]);
  const [showRememberedDropdown, setShowRememberedDropdown] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('domun_remembered_accounts');
      let accounts: SavedAccount[] = [];
      if (raw) {
        const parsed = JSON.parse(raw);
        accounts = parsed.map((item: any) =>
          typeof item === 'string'
            ? { username: item, password: '' }
            : { username: item.username, password: item.password || '' }
        );
      }
      const legacyUser = localStorage.getItem('domun_remembered_username');
      if (legacyUser && !accounts.some(a => a.username.toLowerCase() === legacyUser.toLowerCase())) {
        accounts.unshift({ username: legacyUser, password: '' });
      }
      if (accounts.length > 0) {
        setRememberedAccounts(accounts);
        setUsername(accounts[0].username);
        if (accounts[0].password) {
          setPassword(accounts[0].password);
        }
        setRememberMe(true);
      }
    } catch (err) {
      console.error('Error cargando usuarios recordados:', err);
    }
  }, []);

  const { showErrorToast, showSuccessToast } = useCustomToast();

  const removeRememberedAccount = (usernameToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = rememberedAccounts.filter(a => a.username.toLowerCase() !== usernameToRemove.toLowerCase());
    setRememberedAccounts(updated);
    localStorage.setItem('domun_remembered_accounts', JSON.stringify(updated));
    if (username.toLowerCase() === usernameToRemove.toLowerCase()) {
      if (updated.length > 0) {
        setUsername(updated[0].username);
        setPassword(updated[0].password || '');
      } else {
        setUsername('');
        setPassword('');
        setRememberMe(false);
        setShowRememberedDropdown(false);
      }
    }
  };

  const selectRememberedAccount = (acc: SavedAccount) => {
    setUsername(acc.username);
    setPassword(acc.password || '');
    setRememberMe(true);
    setShowRememberedDropdown(false);
    setEmailError(false);
    setPasswordError(false);
    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 50);
  };

  const iniciarSesion = async (identificador: string, contrasena: string, formElement?: HTMLFormElement) => {
    await api.post('/auth/iniciar-sesion', {
      correo: identificador,
      contrasena,
    });

    showSuccessToast("¡Sesión iniciada correctamente!");
    localStorage.removeItem('domun_failed_login_attempts');

    // Solicitar al navegador que guarde/actualice las credenciales (Credential Management API)
    try {
      if (typeof window !== 'undefined' && 'credentials' in navigator && (window as any).PasswordCredential) {
        let cred: any = null;
        if (formElement) {
          try {
            cred = new (window as any).PasswordCredential(formElement);
          } catch (_) {}
        }
        if (!cred) {
          cred = new (window as any).PasswordCredential({
            id: identificador,
            password: contrasena,
            name: identificador,
          });
        }
        if (cred) {
          await navigator.credentials.store(cred);
        }
      }
    } catch (e) {
      console.warn('Browser password saving skipped:', e);
    }

    if (rememberMe) {
      try {
        const raw = localStorage.getItem('domun_remembered_accounts');
        let accounts: SavedAccount[] = [];
        if (raw) {
          const parsed = JSON.parse(raw);
          accounts = parsed.map((item: any) =>
            typeof item === 'string'
              ? { username: item, password: '' }
              : { username: item.username, password: item.password || '' }
          );
        }
        accounts = accounts.filter(a => a.username.toLowerCase() !== identificador.toLowerCase());
        accounts.unshift({ username: identificador, password: contrasena });
        localStorage.setItem('domun_remembered_accounts', JSON.stringify(accounts));
        localStorage.setItem('domun_remembered_username', identificador);
      } catch {}
    } else {
      try {
        const raw = localStorage.getItem('domun_remembered_accounts');
        let accounts: SavedAccount[] = [];
        if (raw) {
          const parsed = JSON.parse(raw);
          accounts = parsed.map((item: any) =>
            typeof item === 'string'
              ? { username: item, password: '' }
              : { username: item.username, password: item.password || '' }
          );
        }
        accounts = accounts.filter(a => a.username.toLowerCase() !== identificador.toLowerCase());
        localStorage.setItem('domun_remembered_accounts', JSON.stringify(accounts));
        if (localStorage.getItem('domun_remembered_username')?.toLowerCase() === identificador.toLowerCase()) {
          localStorage.removeItem('domun_remembered_username');
        }
      } catch {}
    }

    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;

    if (isSubmitting) {
      return;
    }

    // Verificar si la cuenta está bloqueada por excesivos intentos fallidos (1 hora)
    try {
      const storedLock = localStorage.getItem('domun_failed_login_attempts');
      if (storedLock) {
        const { lockUntil } = JSON.parse(storedLock);
        if (lockUntil && Date.now() < lockUntil) {
          showErrorToast(`Demasiados intentos fallidos. Su cuenta está bloqueada temporalmente durante 1 hora.`);
          return;
        }
      }
    } catch {}

    if (!username.trim() || !password.trim()) {
      if (!username.trim()) setEmailError(true);
      if (!password.trim()) setPasswordError(true);

      showErrorToast("Ingresa tu correo/usuario y contraseña para continuar.");
      return;
    }

    setIsSubmitting(true);

    try {
      await iniciarSesion(username, password, formEl);
    } catch (error: any) {
      setEmailError(true);
      setPasswordError(true);

      const status = error?.response?.status;
      const serverMsg = error?.response?.data?.mensaje || error?.response?.data?.message;

      if (status === 403 || (serverMsg && serverMsg.toLowerCase().includes('desactivad'))) {
        showErrorToast(serverMsg || 'Su cuenta se encuentra desactivada. Contacte al administrador.');
        return;
      }

      let attempts = 1;
      let lockUntil: number | null = null;
      try {
        const stored = localStorage.getItem('domun_failed_login_attempts');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.lockUntil && Date.now() >= parsed.lockUntil) {
            attempts = 1;
          } else {
            attempts = (parsed.attempts || 0) + 1;
          }
        }
      } catch {
        attempts = 1;
      }

      if (attempts >= 5) {
        lockUntil = Date.now() + 3600 * 1000; // 1 hora de bloqueo
        localStorage.setItem('domun_failed_login_attempts', JSON.stringify({ attempts, lockUntil }));
        showErrorToast("Demasiados intentos fallidos. Su cuenta está bloqueada temporalmente durante 1 hora.");
      } else {
        localStorage.setItem('domun_failed_login_attempts', JSON.stringify({ attempts, lockUntil: null }));
        showErrorToast(`Credenciales incorrectas. Intento ${attempts} de 5.`);
      }
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
          action="#"
          onSubmit={handleLogin}
          method="POST"
          className="w-full animate-fadeIn"
          style={{ animationDelay: '0.06s' }}
        >
          {/* Input Usuario */}
          <div className="mb-[14px] relative">
            <LoginInput
              id="username"
              name="username"
              autoComplete="username"
              icon={<User size={16} strokeWidth={1.5} />}
              placeholder="Correo o Usuario"
              value={username}
              error={emailError}
              onChange={(e) => {
                setUsername(e.target.value);
                if (emailError) setEmailError(false);
              }}
              rightIcon={
                rememberedAccounts.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setShowRememberedDropdown(!showRememberedDropdown)}
                    className="text-white/60 hover:text-white transition-all p-1 focus:outline-none flex items-center justify-center"
                    title="Seleccionar usuario guardado"
                  >
                    <ChevronDown
                      size={16}
                      strokeWidth={1.5}
                      className={`transition-transform duration-200 ${showRememberedDropdown ? 'rotate-180 text-white' : ''}`}
                    />
                  </button>
                ) : undefined
              }
            />

            {/* Dropdown de usuarios recordados (desplegado desde el campo, sin extender altura del login) */}
            {showRememberedDropdown && rememberedAccounts.length > 0 && (
              <div 
                className="absolute left-0 right-0 top-[42px] z-50 rounded-lg border border-white/20 bg-[#240303]/95 shadow-2xl backdrop-blur-md overflow-hidden max-h-[150px] overflow-y-auto animate-fadeIn"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                <div className="px-3 py-1.5 border-b border-white/10 text-[10px] uppercase font-semibold text-white/50 tracking-wider flex justify-between items-center bg-black/20">
                  <span>Usuarios Guardados</span>
                  <span className="text-[9px] text-white/40">{rememberedAccounts.length}</span>
                </div>
                {rememberedAccounts.map((acc, idx) => (
                  <div
                    key={idx}
                    onClick={() => selectRememberedAccount(acc)}
                    className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-colors hover:bg-white/15 ${
                      username.toLowerCase() === acc.username.toLowerCase() ? 'bg-white/20' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden pr-2">
                      <User size={13} className="text-red-400 shrink-0" />
                      <span className="text-[12px] text-white/90 truncate font-medium">{acc.username}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => removeRememberedAccount(acc.username, e)}
                      className="text-white/40 hover:text-red-400 p-1 transition-colors shrink-0"
                      title="Eliminar de recordados"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Input Contraseña (el dropdown se despliega por encima sin desplazar ni ocultar la contraseña) */}
          <div className="mb-[10px]">
            <LoginInput
              id="password"
              name="password"
              autoComplete="current-password"
              inputRef={passwordInputRef}
              icon={<Lock size={16} strokeWidth={1.5} />}
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
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  setRememberMe(isChecked);
                  if (!isChecked) {
                    localStorage.removeItem('domun_remembered_username');
                  }
                }}
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
