'use client';

import React, { useEffect, useState, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Portal } from '@/components/ui/Portal';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { api } from '@/lib/api/cliente';

export function SessionTerminationModal() {
  const profile = useAuthStore((s) => s.profile);
  const [activo, setActivo] = useState(false);
  const [segundos, setSegundos] = useState(3);
  const [motivo, setMotivo] = useState('Tu sesión ha sido finalizada por un administrador.');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const iniciarCierre = (mensaje?: string) => {
    if (activo) return;
    if (mensaje) setMotivo(mensaje);
    setActivo(true);
    setSegundos(3);

    let cuenta = 3;
    timerRef.current = setInterval(() => {
      cuenta -= 1;
      setSegundos(cuenta);
      if (cuenta <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        try {
          localStorage.removeItem('domun_user_profile');
          sessionStorage.clear();
        } catch (_) {}
        api.post('/auth/cerrar-sesion').finally(() => {
          window.location.href = '/login?motivo=cierre_admin';
        });
      }
    }, 1000);
  };

  useEffect(() => {
    if (!profile?.id || !supabase) return;

    const myDeviceId = typeof window !== 'undefined' ? localStorage.getItem('domun_device_id') : null;

    const channel = supabase.channel('domun_sesiones_control')
      .on('broadcast', { event: 'cierre_sesion' }, (payload: any) => {
        const data = payload?.payload;
        if (!data) return;

        // Notificar a otras vistas abiertas (ej. lista de usuarios)
        try {
          window.dispatchEvent(new CustomEvent('domun:sesion_cerrada_broadcast', { detail: data }));
        } catch (_) {}

        // Verificar si este cierre afecta a este usuario
        if (data.usuarioId === profile.id) {
          const afectaMiDispositivo = data.cerrarTodas || !data.deviceId || data.deviceId === myDeviceId;
          if (afectaMiDispositivo) {
            iniciarCierre(data.mensaje);
          }
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          try {
            channel.send({
              type: 'broadcast',
              event: 'sesion_iniciada',
              payload: {
                usuarioId: profile.id,
                correo: profile.correo,
                timestamp: Date.now(),
              },
            }).catch(() => {});
          } catch (_) {}
        }
      });

    const handleCustomEvent = (e: any) => {
      iniciarCierre(e.detail?.mensaje);
    };
    window.addEventListener('domun:forzar_cierre_sesion', handleCustomEvent);

    return () => {
      try {
        if (supabase) supabase.removeChannel(channel);
        else channel.unsubscribe();
      } catch (_) {
        channel.unsubscribe();
      }
      window.removeEventListener('domun:forzar_cierre_sesion', handleCustomEvent);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [profile?.id, profile?.correo]);

  if (!activo) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm font-[Poppins] animate-in fade-in duration-150 select-none">
        <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl border border-red-100 space-y-4 animate-in zoom-in-95 duration-200">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
            <AlertTriangle size={28} className="animate-pulse" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-gray-900 leading-tight">
              Sesión Finalizada
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              {motivo}
            </p>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50/70 p-3 text-center">
            <span className="text-xs font-bold text-red-700">
              Se cerrará la sesión en {segundos} {segundos === 1 ? 'segundo' : 'segundos'}...
            </span>
            {/* Barra de progreso regresiva */}
            <div className="mt-2.5 h-1.5 w-full bg-red-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-600 transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${(segundos / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
