'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCustomToast } from '@/hooks/useCustomToast';
import { Eye, EyeOff, User, Lock, X, ChevronDown, Trash2, Laptop, Smartphone } from 'lucide-react';
import LoginInput from '@/components/ui/LoginInput';
import LoginButton from '@/components/ui/LoginButton';
import PasswordRecoveryModal from '@/components/modals/PasswordRecoveryModal';
import SupportModal from '@/components/modals/SupportModal';
import { api } from '@/lib/api/cliente';

import { useRef } from 'react';

function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'dev_ssr';
  let id = localStorage.getItem('domun_device_id');
  if (!id) {
    id = 'dev_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    localStorage.setItem('domun_device_id', id);
  }
  return id;
}

function detectarDispositivoCliente(): string {
  if (typeof window === 'undefined') return 'Navegador Web';
  const ua = navigator.userAgent.toLowerCase();
  let so = 'Dispositivo';
  if (ua.includes('iphone')) so = 'iPhone';
  else if (ua.includes('ipad')) so = 'iPad';
  else if (ua.includes('android')) so = 'Android';
  else if (ua.includes('windows nt 10.0') || ua.includes('windows')) so = 'Windows PC';
  else if (ua.includes('macintosh') || ua.includes('mac os')) so = 'Mac';
  else if (ua.includes('linux')) so = 'Linux';

  let nav = 'Navegador';
  if (ua.includes('edg/')) nav = 'Edge';
  else if (ua.includes('chrome/')) nav = 'Chrome';
  else if (ua.includes('firefox/')) nav = 'Firefox';
  else if (ua.includes('safari/')) nav = 'Safari';

  return `${so} (${nav})`;
}

type SavedAccount = {
  username: string
  password?: string
}

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginStatusText, setLoginStatusText] = useState('Ingresando...');
  const [modalLimiteDispositivosOpen, setModalLimiteDispositivosOpen] = useState(false);
  const [dispositivosActivos, setDispositivosActivos] = useState<Array<{
    id: string;
    dispositivo: string;
    ip: string;
    fechaHora: string;
  }>>([]);
  const [rememberedAccounts, setRememberedAccounts] = useState<SavedAccount[]>([]);
  const [showRememberedDropdown, setShowRememberedDropdown] = useState(false);

  useEffect(() => {
    // Despertar el backend inmediatamente en segundo plano al cargar el login para eliminar cold starts
    try {
      api.get('/health', { timeout: 3500 }).catch(() => {});
    } catch (_) {}

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

    // Liberar en segundo plano cualquier sesión que haya quedado en este equipo si está en pantalla login
    try {
      const devId = getOrCreateDeviceId();
      if (devId) {
        api.post('/auth/liberar-dispositivo', { deviceId: devId }).catch(() => {});
      }
    } catch (_) {}
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

  const iniciarSesion = async (
    identificador: string,
    contrasena: string,
    formElement?: HTMLFormElement,
    cerrarOtrasSesiones?: boolean
  ) => {
    const deviceId = getOrCreateDeviceId();
    const dispositivo = detectarDispositivoCliente();

    const res = await api.post(
      '/auth/iniciar-sesion',
      {
        correo: identificador,
        contrasena,
        deviceId,
        dispositivo,
        cerrarOtrasSesiones: Boolean(cerrarOtrasSesiones),
      },
      { timeout: 12000 }
    );

    const token = res.data?.data?.token;
    if (token && typeof document !== 'undefined') {
      const isHttps = window.location.protocol === 'https:';
      document.cookie = `token=${token}; path=/; max-age=${8 * 60 * 60}; SameSite=Lax; ${isHttps ? 'Secure;' : ''}`;
    }

    showSuccessToast("¡Sesión iniciada correctamente!");
    localStorage.removeItem('domun_failed_login_attempts');
    localStorage.removeItem('domun_notificaciones_borradas');
    sessionStorage.removeItem('domun_notificaciones_borradas');

    // Guardar perfil de usuario retornado por el login para acceso instantáneo
    const usuarioLogueado = res.data?.data?.usuario;
    if (usuarioLogueado) {
      localStorage.setItem('domun_user_profile', JSON.stringify(usuarioLogueado));
    }

    // Solicitar al navegador que guarde las credenciales de forma asíncrona (sin bloquear redirección)
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
          navigator.credentials.store(cred).catch(() => {});
        }
      }
    } catch (_) {}

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

    // Redirección inmediata al dashboard sin esperas
    window.location.replace('/dashboard');
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
          if (process.env.NODE_ENV !== 'production') {
            localStorage.removeItem('domun_failed_login_attempts');
          } else {
            showErrorToast(`Demasiados intentos fallidos. Su cuenta está bloqueada temporalmente durante 1 hora.`);
            return;
          }
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
    setLoginStatusText('Ingresando...');
    const t1 = setTimeout(() => setLoginStatusText('Validando credenciales...'), 1800);
    const t2 = setTimeout(() => setLoginStatusText('Conectando con el servidor...'), 4500);

    try {
      await iniciarSesion(username, password, formEl);
    } catch (error: any) {
      clearTimeout(t1);
      clearTimeout(t2);
      setEmailError(true);
      setPasswordError(true);

      const status = error?.response?.status;
      const serverMsg = error?.response?.data?.mensaje || error?.response?.data?.message;

      // Timeout explícito de axios o conexión tardía
      if (error?.code === 'ECONNABORTED' || (!error.response && error.message?.toLowerCase().includes('timeout'))) {
        showErrorToast('El servidor está iniciando o tardó en responder. Por favor intenta de nuevo en unos segundos.');
        return;
      }

      // Si es un fallo de conexión / backend iniciando (ECONNREFUSED / 502 / 503 / 504 / red caída)
      if (!error.response || status >= 500) {
        showErrorToast('El servidor backend se está conectando. Por favor espera unos segundos e intenta nuevamente.');
        return;
      }

      if (status === 409 || error?.response?.data?.codigo === 'LIMITE_DISPOSITIVOS_ALCANZADO') {
        const activos = error?.response?.data?.data?.dispositivosActivos || [];
        setDispositivosActivos(activos);
        setModalLimiteDispositivosOpen(true);
        return;
      }

      if (status === 403 || (serverMsg && serverMsg.toLowerCase().includes('desactivad'))) {
        showErrorToast(serverMsg || 'Su cuenta se encuentra desactivada. Contacte al administrador.');
        return;
      }

      // Solo contar como credenciales incorrectas si el servidor respondió con 401 o 400
      if (status === 401 || status === 400) {
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
      } else {
        showErrorToast(serverMsg || 'Error al iniciar sesión. Intenta de nuevo.');
      }
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      setIsSubmitting(false);
      setLoginStatusText('Ingresando...');
    }
  };

  return (
    <div 
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden overscroll-none flex flex-col items-center justify-center bg-[#140B07]"
      style={{
        fontFamily: "'Poppins', sans-serif",
        touchAction: 'manipulation',
      }}
    >
      {/* Fondo de alta resolución precargado con máxima prioridad y fijado al viewport */}
      <div
        aria-hidden="true"
        className="fixed inset-0 overflow-hidden pointer-events-none select-none z-0"
      >
        <Image
          src="/fondo.png"
          alt="Fondo Carretera"
          fill
          priority
          sizes="100vw"
          quality={85}
          className="object-cover object-center pointer-events-none"
        />
        {/* Capa de contraste oscuro para máxima nitidez y legibilidad */}
        <div className="absolute inset-0 bg-black/45 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/60 pointer-events-none" />
      </div>



      {/* Contenedor principal centrado */}
      <div 
        className="login-container relative z-10 flex flex-col items-center w-[90%] max-w-[300px]"
        style={{ transform: 'translateY(2%)' }}
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
            Sistema para la gestión de proyectos
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
                className="absolute left-0 right-0 top-[42px] z-50 rounded-lg border border-white/20 bg-black/95 shadow-2xl backdrop-blur-md overflow-hidden max-h-[150px] overflow-y-auto animate-fadeIn"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                <div className="px-3 py-1.5 border-b border-white/10 text-[10px] uppercase font-semibold text-white/50 tracking-wider flex justify-between items-center bg-black/40">
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
            {isSubmitting ? loginStatusText : 'Iniciar sesión'}
          </LoginButton>

          {/* Legal / Policy Links */}
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-center gap-4 text-[10.5px] text-white/60">
            <Link href="/aviso-legal" className="hover:text-white hover:underline transition-colors">
              Aviso legal
            </Link>
            <span>&bull;</span>
            <Link href="/privacidad" className="hover:text-white hover:underline transition-colors">
              Privacidad
            </Link>
            <span>&bull;</span>
            <Link href="/cookies" className="hover:text-white hover:underline transition-colors">
              Cookies
            </Link>
          </div>
        </form>
      </div>



      {/* Modales */}
      <PasswordRecoveryModal
        isOpen={isPasswordRecoveryOpen}
        onClose={() => setIsPasswordRecoveryOpen(false)}
      />
      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
      />

      {/* MODAL DE LÍMITE DE DISPOSITIVOS ALCANZADO (MÁXIMO 2) */}
      {modalLimiteDispositivosOpen && (
        <div
          className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs font-[Poppins] animate-in fade-in duration-200"
          onClick={() => setModalLimiteDispositivosOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-extrabold text-gray-900 leading-tight">
                  Límite de Dispositivos Alcanzado
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Máximo <strong>2 dispositivos simultáneos</strong> permitidos por cuenta.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalLimiteDispositivosOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Tu cuenta ya tiene <strong>2 sesiones activas</strong> en otros dispositivos. Por políticas de seguridad, no es posible iniciar sesión en un tercer equipo sin cerrar una sesión previa:
            </p>

            {/* Listado de Dispositivos Activos */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3 space-y-2">
              <p className="text-[9.5px] font-bold uppercase tracking-wider text-gray-500">
                Sesiones actualmente abiertas ({dispositivosActivos.length || 2} de 2):
              </p>
              {dispositivosActivos.length > 0 ? (
                dispositivosActivos.map((d, idx) => (
                  <div key={d.id || idx} className="flex items-center gap-2.5 bg-white p-2.5 rounded-lg border border-gray-200/80 shadow-2xs text-xs">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-[#9B0F06] shrink-0">
                      {d.dispositivo?.toLowerCase().includes('iphone') || d.dispositivo?.toLowerCase().includes('android') ? (
                        <Smartphone size={14} />
                      ) : (
                        <Laptop size={14} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-800 text-[11px] truncate">
                        {d.dispositivo || `Dispositivo ${idx + 1}`}
                      </p>
                      <p className="text-[9.5px] text-gray-400">
                        IP: {d.ip || 'Red'} {d.fechaHora ? `· Conectado: ${new Date(d.fechaHora).toLocaleDateString([], { day: '2-digit', month: '2-digit' })} ${new Date(d.fechaHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-gray-200/80 text-xs text-gray-600">
                  <Laptop size={14} className="text-[#9B0F06]" />
                  <span>2 dispositivos remotos conectados</span>
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="flex items-center justify-end pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setModalLimiteDispositivosOpen(false)}
                className="w-full sm:w-auto px-5 py-2 text-xs font-bold text-white bg-[#9B0F06] hover:bg-[#7a0c05] rounded-xl transition-colors cursor-pointer text-center"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
