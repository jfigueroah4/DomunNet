'use client';

import React, { useState, useEffect } from 'react';
import { X, Laptop, Smartphone, CheckCircle2, LogOut, Shield, Loader2 } from 'lucide-react';
import { Portal } from '@/components/ui/Portal';
import { api } from '@/lib/api/cliente';
import { supabase } from '@/lib/supabase/client';
import { showSuccessToast, showErrorToast } from '@/hooks/useCustomToast';
import { useAuthStore } from '@/stores/useAuthStore';

interface SesionDispositivo {
  id: string;
  deviceId?: string;
  sessionId?: string;
  dispositivo: string;
  ip: string;
  fechaHora: string;
  esDispositivoActual?: boolean;
}

interface DispositivosConectadosModalProps {
  isOpen: boolean;
  onClose: () => void;
  usuario: {
    id: string;
    nombre: string;
    primer_nombre?: string;
    primer_apellido?: string;
    correo?: string;
    sesionesActivasCount?: number;
    dispositivosActivos?: any[];
  };
  onSesionCerrada?: () => void;
}

export function DispositivosConectadosModal({
  isOpen,
  onClose,
  usuario,
  onSesionCerrada,
}: DispositivosConectadosModalProps) {
  const profile = useAuthStore((s) => s.profile);
  const [sesiones, setSesiones] = useState<SesionDispositivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [cerrandoId, setCerrandoId] = useState<string | null>(null);
  const [cerrandoTodas, setCerrandoTodas] = useState(false);

  const isSelf = profile?.id === usuario.id || (profile?.correo && usuario.correo && profile.correo.toLowerCase() === usuario.correo.toLowerCase());
  const currentDeviceId = typeof window !== 'undefined' ? localStorage.getItem('domun_device_id') : null;

  const cargarSesiones = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/usuarios/${usuario.id}/sesiones`);
      if (res.data?.success && Array.isArray(res.data.data)) {
        const rawSesiones: SesionDispositivo[] = res.data.data;
        // Identificar si alguna es este dispositivo
        const procesadas = rawSesiones.map((s) => ({
          ...s,
          esDispositivoActual: Boolean(isSelf && (s.deviceId === currentDeviceId || s.esDispositivoActual)),
        }));
        setSesiones(procesadas);
      } else {
        // Fallback si la API devolvió la lista precargada
        const precargadas = (usuario.dispositivosActivos || []).map((s: any) => ({
          id: s.id || s.deviceId,
          deviceId: s.deviceId,
          sessionId: s.sessionId,
          dispositivo: s.dispositivo || 'Dispositivo',
          ip: s.ip || 'Red Local / Internet',
          fechaHora: s.fechaHora || new Date().toISOString(),
          esDispositivoActual: Boolean(isSelf && s.deviceId === currentDeviceId),
        }));
        setSesiones(precargadas);
      }
    } catch (err) {
      console.warn('Aviso al cargar sesiones de usuario:', err);
      // Fallback local
      if (usuario.dispositivosActivos && usuario.dispositivosActivos.length > 0) {
        setSesiones(
          usuario.dispositivosActivos.map((s: any) => ({
            id: s.id || s.deviceId,
            deviceId: s.deviceId,
            sessionId: s.sessionId,
            dispositivo: s.dispositivo || 'Dispositivo',
            ip: s.ip || 'Red Local / Internet',
            fechaHora: s.fechaHora || new Date().toISOString(),
            esDispositivoActual: Boolean(isSelf && s.deviceId === currentDeviceId),
          }))
        );
      } else {
        setSesiones([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      cargarSesiones();
    }
  }, [isOpen, usuario.id]);

  if (!isOpen) return null;

  const handleCerrarSesion = async (sesion: SesionDispositivo) => {
    if (sesion.esDispositivoActual) {
      showErrorToast('No puedes cerrar tu propia sesión activa actual desde aquí. Puedes cerrar las de otros dispositivos.');
      return;
    }

    try {
      setCerrandoId(sesion.id || sesion.deviceId || 'curr');
      await api.post(`/usuarios/${usuario.id}/cerrar-sesion`, {
        deviceId: sesion.deviceId,
        sessionId: sesion.sessionId,
      });

      // Notificar realtime broadcast
      if (supabase) {
        try {
          const ch = supabase.channel('domun_sesiones_control');
          await ch.send({
            type: 'broadcast',
            event: 'cierre_sesion',
            payload: {
              usuarioId: usuario.id,
              deviceId: sesion.deviceId,
              sessionId: sesion.sessionId,
              cerrarTodas: false,
              mensaje: 'Tu sesión ha sido finalizada por un administrador. Se cerrará la sesión en 3 segundos...',
              timestamp: Date.now(),
            },
          });
        } catch (_) {}
      }

      showSuccessToast(`Sesión cerrada para ${sesion.dispositivo}`);
      setSesiones((prev) => prev.filter((s) => s.id !== sesion.id && s.deviceId !== sesion.deviceId));
      onSesionCerrada?.();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'No se pudo cerrar la sesión';
      showErrorToast(msg);
    } finally {
      setCerrandoId(null);
    }
  };

  const handleCerrarTodas = async () => {
    try {
      setCerrandoTodas(true);
      await api.post(`/usuarios/${usuario.id}/cerrar-sesion`, {
        cerrarTodas: true,
      });

      // Notificar realtime broadcast
      if (supabase) {
        try {
          const ch = supabase.channel('domun_sesiones_control');
          await ch.send({
            type: 'broadcast',
            event: 'cierre_sesion',
            payload: {
              usuarioId: usuario.id,
              cerrarTodas: true,
              mensaje: 'Tu sesión ha sido finalizada por un administrador. Se cerrará la sesión en 3 segundos...',
              timestamp: Date.now(),
            },
          });
        } catch (_) {}
      }

      showSuccessToast('Todas las sesiones remotas han sido cerradas.');
      if (isSelf) {
        // Mantener solo este dispositivo
        setSesiones((prev) => prev.filter((s) => s.esDispositivoActual));
      } else {
        setSesiones([]);
      }
      onSesionCerrada?.();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'No se pudieron cerrar las sesiones';
      showErrorToast(msg);
    } finally {
      setCerrandoTodas(false);
    }
  };

  const nombreMostrar = usuario.nombre || `${usuario.primer_nombre || ''} ${usuario.primer_apellido || ''}`.trim() || 'Usuario';

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs font-[Poppins] animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-extrabold text-[#111827] tracking-tight">
                Dispositivos Conectados
              </h2>
              <p className="text-xs text-[#6B7280] mt-0.5 font-medium">
                <span className="font-semibold text-gray-800">{nombreMostrar}</span> • Máximo <strong className="text-gray-800 font-bold">2 dispositivos simultáneos</strong> permitidos
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
              title="Cerrar ventana"
            >
              <X size={18} />
            </button>
          </div>

          <div className="border-t border-gray-100" />

          {/* Subheader: Sesiones Activas & Botón Cerrar Todas */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-[#4B5563] uppercase tracking-wider">
              SESIONES ACTIVAS ({sesiones.length} DE 2):
            </span>
            {sesiones.length > 0 && (!isSelf || sesiones.some((s) => !s.esDispositivoActual)) && (
              <button
                type="button"
                onClick={handleCerrarTodas}
                disabled={cerrandoTodas}
                className="px-3.5 py-1.5 text-xs font-bold text-[#DC2626] border border-[#FCA5A5] rounded-full hover:bg-red-50 active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-2xs"
              >
                {cerrandoTodas && <Loader2 size={12} className="animate-spin text-red-600" />}
                <span>{isSelf ? 'Cerrar otras sesiones' : 'Cerrar todas las sesiones'}</span>
              </button>
            )}
          </div>

          {/* Lista de Dispositivos */}
          <div className="space-y-3 min-h-[140px] max-h-[340px] overflow-y-auto pr-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
                <Loader2 size={24} className="animate-spin text-[#9B0F06]" />
                <span className="text-xs font-medium">Consultando sesiones activas...</span>
              </div>
            ) : sesiones.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center text-xs text-gray-500">
                No hay sesiones abiertas activas registradas para este usuario.
              </div>
            ) : (
              sesiones.map((sesion, idx) => {
                const esMovil = sesion.dispositivo?.toLowerCase().includes('iphone') || sesion.dispositivo?.toLowerCase().includes('android');
                const esCerrando = cerrandoId === (sesion.id || sesion.deviceId);
                const fechaTexto = sesion.fechaHora
                  ? new Date(sesion.fechaHora).toLocaleDateString([], { day: '2-digit', month: '2-digit' }) +
                    ' ' +
                    new Date(sesion.fechaHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Reciente';

                return (
                  <div
                    key={sesion.id || sesion.deviceId || idx}
                    className="rounded-2xl border border-gray-200 bg-white p-4 transition-all flex items-center justify-between gap-3 shadow-2xs hover:border-gray-300"
                  >
                    {/* Icono */}
                    <div className="h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 bg-gray-100 text-gray-700">
                      {esMovil ? <Smartphone size={22} /> : <Laptop size={22} />}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-gray-900 text-xs sm:text-sm truncate">
                          {sesion.dispositivo || `Dispositivo ${idx + 1}`}
                        </span>
                        {sesion.esDispositivoActual && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-700">
                            <CheckCircle2 size={11} className="text-gray-500" />
                            Este dispositivo
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 flex flex-wrap items-center gap-1.5 font-medium">
                        <span>Reciente</span>
                        <span>•</span>
                        <span>IP: {sesion.ip || 'Red Local / Internet'}</span>
                        <span>•</span>
                        <span>{fechaTexto}</span>
                      </p>
                    </div>

                    {/* Botón Cerrar Sesión */}
                    <div className="shrink-0">
                      {sesion.esDispositivoActual ? (
                        <button
                          type="button"
                          disabled
                          className="px-3.5 py-1.5 text-xs font-semibold text-gray-400 border border-gray-200 rounded-xl bg-gray-50 cursor-not-allowed select-none opacity-70"
                          title="No puedes cerrar tu propia sesión activa desde aquí. Puedes cerrar las sesiones de tus otros dispositivos."
                        >
                          Sesión actual
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleCerrarSesion(sesion)}
                          disabled={esCerrando || cerrandoTodas}
                          className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 border border-gray-200 rounded-xl bg-white hover:bg-gray-100 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                        >
                          {esCerrando ? (
                            <Loader2 size={13} className="animate-spin text-gray-600" />
                          ) : (
                            <LogOut size={13} className="text-gray-500 rotate-180" />
                          )}
                          <span>Cerrar sesión</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              <Shield size={14} className="text-gray-400" />
              <span>Protección de acceso por cuenta</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold text-gray-800 bg-[#E5E7EB] hover:bg-gray-300 rounded-xl transition-all cursor-pointer active:scale-95"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
