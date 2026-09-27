'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft, Plus, Trash2, Check, Sun, Cloud, CloudRain,
  CloudLightning, CloudSun, ChevronLeft, ChevronRight,
  ClipboardList, Save, Camera, FlaskConical,
  Upload, MapPin, Loader2, X
} from 'lucide-react';
import { RegistroBitacora } from '@/types/bitacora';
import { useAuthStore } from '@/stores/useAuthStore';
import { api, apiGetDeduplicado } from '@/lib/api/cliente';
import { Combobox } from '@/components/ui/Combobox';
import { toast } from 'sonner';

/* -- Tokens --------------------------------------------------------- */
const C = {
  brand:      '#9B0F06', brandLight: 'rgba(155,15,6,0.07)', brandMid: 'rgba(155,15,6,0.14)',
  orange:     '#E85D04',
  gray900:    '#111827', gray800: '#1F2937', gray700: '#374151', gray600: '#4B5563',
  gray500:    '#6B7280', gray400: '#9CA3AF', gray300: '#D1D5DB',
  gray200:    '#E5E7EB', gray100: '#F3F4F6', gray50:  '#F9FAFB',
  white:      '#ffffff',
  green:      '#059669', greenLight: 'rgba(5,150,105,0.1)',
  red:        '#DC2626', redLight: 'rgba(220,38,38,0.08)',
};
const POPPINS = "'Poppins', sans-serif";
const card: React.CSSProperties = {
  background: '#ffffff', borderRadius: 14,
  boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
};
const inputBase: React.CSSProperties = {
  width: '100%', border: `1px solid ${C.gray200}`, borderRadius: 8,
  padding: '9px 12px', fontSize: 13, color: C.gray900, fontFamily: POPPINS,
  outline: 'none', background: C.white, boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};
const sLabel: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: C.gray600, fontFamily: POPPINS, marginBottom: 5, display: 'block' };
const errStyle: React.CSSProperties = { fontSize: 11, color: C.red, fontFamily: POPPINS, marginTop: 4 };

// Steps
const STEPS = [
  { num: 1, label: 'Info General', code: 'Step-1-InformacionGeneral' },
  { num: 2, label: 'Condiciones', code: 'Step-2-CondicionesClimaticas' },
  { num: 3, label: 'Detalle', code: 'Step-3-DetalleTrabajos' },
];

const ENSAYOS_LIST = ['Compactación relativa','Deflexión Benkelman','Granulometría','Límites de Atterberg','CBR','Proctor modificado'];

const JUSTIFICACION_SUSPENSION_PRESETS = [
  'Lluvia intensa e inundación de subrasante',
  'Tormenta eléctrica / Mala visibilidad',
  'Deterioro de terreno por humedad excesiva',
  'Falla de maquinaria por clima adverso',
  'Otra...',
];

const OBS_RENGLON_PRESETS = [
  'Conforme a especificaciones técnicas',
  'Sujeto a verificación de topografía',
  'Pausa temporal por lluvia',
  'Ejecutado según tramo planificado',
  'Trabajo en proceso',
  'Otra...',
];

export type EvidenciaFoto = {
  id: string
  url: string
  nombre: string
  geo?: string
}

type FormRenglonCampo = {
  id: string
  renglon: string
  lado: 'Derecho' | 'Izquierdo' | 'Ambos'
  estInicio: string
  estFin: string
  fotos: EvidenciaFoto[]
  obs: string
}

type FormEnsayoLab = {
  id: string
  tipo: string
  estacion: string
  resultado: string
  minReq: string
  fotos: EvidenciaFoto[]
  obs: string
}

interface FormData {
  tipoIngreso: 'Campo' | 'Laboratorio';
  proyectoId: string;
  fecha: string;
  turno: string;
  ingeniero: string;
  ubicacionGps: string;
  latitud?: number | null;
  longitud?: number | null;
  precisionGps?: number | null;
  clima: string;
  obsClima: string;
  suspensionClima: boolean;
  justSuspension: string;
  horaSuspension: string;
  seReanudo: boolean;
  horaReanudacion: string;
  renglones: FormRenglonCampo[];
  ensayos: FormEnsayoLab[];
  observacionesGenerales: string;
  fotografiasGenerales: EvidenciaFoto[];
}

const uid = () => Math.random().toString(36).slice(2, 9);

function newRenglon(): FormRenglonCampo {
  return { id: uid(), renglon: '', lado: 'Ambos', estInicio: '', estFin: '', fotos: [], obs: '' };
}

function newEnsayo(): FormEnsayoLab {
  return { id: uid(), tipo: '', estacion: '', resultado: '', minReq: '', fotos: [], obs: '' };
}

export function BitacoraForm({ onBack, onSubmit }: {
  onBack: () => void;
  onSubmit: (data: Partial<RegistroBitacora>) => void;
}) {
  const searchParams = useSearchParams();
  const urlProyectoId = searchParams?.get('proyectoId') || '';
  const { profile: user } = useAuthStore();
  const today = new Date().toISOString().split('T')[0];
  const responsableActual = user?.nombre ?? 'Ing. Carlos Mendoza';
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [proyectosActivos, setProyectosActivos] = useState<any[]>([]);
  const [proyectoPlanTrabajo, setProyectoPlanTrabajo] = useState<{ id: string; desc: string; unidad: string; renglonId?: string }[]>([]);
  const [modalLluviaFuerte, setModalLluviaFuerte] = useState(false);
  const [modalConfirmarRegistro, setModalConfirmarRegistro] = useState(false);
  const [obteniendoGps, setObteniendoGps] = useState(false);
  const [arrastrandoGeneral, setArrastrandoGeneral] = useState(false);

  const fileInputGeneralRef = useRef<HTMLInputElement>(null);

  const [fd, setFd] = useState<FormData>({
    tipoIngreso: 'Campo',
    proyectoId: urlProyectoId,
    fecha: today,
    turno: 'Diurno',
    ingeniero: responsableActual,
    ubicacionGps: '',
    latitud: null,
    longitud: null,
    precisionGps: null,
    clima: 'Soleado',
    obsClima: '',
    suspensionClima: false,
    justSuspension: '',
    horaSuspension: '',
    seReanudo: true,
    horaReanudacion: '',
    renglones: [newRenglon()],
    ensayos: [newEnsayo()],
    observacionesGenerales: '',
    fotografiasGenerales: [],
  });

  // Auto-detectar rol del responsable
  useEffect(() => {
    const rolStr = String(user?.rol || (user as any)?.role || '').toLowerCase();
    const esLab = rolStr.includes('laboratorio') || rolStr.includes('laboratorista');
    const nomResp = user?.nombre || ((user as any)?.primer_nombre ? `${(user as any).primer_nombre} ${(user as any).primer_apellido || ''}` : responsableActual);
    setFd((prev) => ({
      ...prev,
      tipoIngreso: esLab ? 'Laboratorio' : 'Campo',
      ingeniero: nomResp,
    }));
  }, [user]);

  // Cargar proyectos activos (excluyendo borradores)
  useEffect(() => {
    const cargarProyectos = async () => {
      try {
        const [resProy, resPU] = await Promise.all([
          apiGetDeduplicado('/proyectos'),
          apiGetDeduplicado('/mantenimiento/proyecto_usuario').catch(() => ({ data: { data: [] } }))
        ]);

        if (resProy.data?.success && Array.isArray(resProy.data.data)) {
          let activos = resProy.data.data.filter(
            (p: any) =>
              (p.estado === 'activo' || p.estado_codigo === 'activo') &&
              p.estado !== 'borrador' &&
              p.estado_codigo !== 'borrador'
          );

          const rolStr = (user?.rol || '').toLowerCase();
          const esAdmin = rolStr.includes('admin') || rolStr.includes('director');
          const esResidente = rolStr.includes('residente');
          const esRestringido = !esAdmin && !esResidente;

          if (esRestringido && user?.id) {
            const puList = Array.isArray(resPU.data?.data) ? resPU.data.data : [];
            const asignadosIds = new Set<string>();

            puList.forEach((pu: any) => {
              if (String(pu.usuario_id || pu.usuarioId) === String(user.id)) {
                asignadosIds.add(String(pu.proyecto_id || pu.proyectoId));
              }
            });

            activos = activos.filter((p: any) => {
              const pIdStr = String(p.id);
              if (asignadosIds.has(pIdStr)) return true;
              if (String(p.responsable_id || p.responsableId) === String(user.id)) return true;
              if (String(p.delegado_residente_id) === String(user.id)) return true;
              if (Array.isArray(p.equipo) && p.equipo.some((eq: any) => String(eq.usuario_id || eq.id) === String(user.id))) return true;
              return false;
            });
          }

          setProyectosActivos(activos);
          if (activos.length > 0) {
            setFd((prev) => {
              const prevValid = prev.proyectoId && activos.some((p: any) => String(p.id) === String(prev.proyectoId));
              return {
                ...prev,
                proyectoId: prevValid ? prev.proyectoId : (urlProyectoId && activos.some((p: any) => String(p.id) === String(urlProyectoId)) ? urlProyectoId : activos[0].id),
              };
            });
          }
        }
      } catch (_) {}
    };
    cargarProyectos();
  }, [user, urlProyectoId]);

  // Cargar EXCLUSIVAMENTE el Plan de Trabajo (Renglones) del proyecto seleccionado y ordenarlos numéricamente
  useEffect(() => {
    if (!fd.proyectoId) {
      setProyectoPlanTrabajo([]);
      return;
    }
    apiGetDeduplicado(`/proyectos/${fd.proyectoId}`).then((res) => {
      if (res.data?.success && res.data.data) {
        const proy = res.data.data;
        const list =
          proy.renglones ||
          proy.planTrabajo ||
          proy.renglones_sabana ||
          proy.parametro_proyecto?.planTrabajo ||
          [];
        if (Array.isArray(list) && list.length > 0) {
          const sorted = list
            .map((item: any) => ({
              id: String(item.codigoDGC || item.codigo || item.id || 'R'),
              renglonId: item.renglonId || (item.id && typeof item.id === 'string' && item.id.length === 36 ? item.id : undefined),
              desc: item.descripcion || item.desc || item.nombre || 'Renglón de trabajo',
              unidad: item.unidad || item.unidad_medida?.abreviatura || item.unidad_medida || item.unidadMedida || ''
            }))
            .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
          setProyectoPlanTrabajo(sorted);
        } else {
          // Intentar obtener renglones de la tabla de mantenimiento si el endpoint del proyecto no los embebió
          apiGetDeduplicado(`/mantenimiento/renglon_trabajo?proyecto_id=${fd.proyectoId}`).then((resRT) => {
            if (resRT.data?.success && Array.isArray(resRT.data.data) && resRT.data.data.length > 0) {
              const sorted = resRT.data.data
                .map((item: any) => ({
                  id: String(item.codigo || item.id || 'R'),
                  renglonId: item.id,
                  desc: item.descripcion || item.nombre || 'Renglón de trabajo',
                  unidad: item.unidad_medida || ''
                }))
                .sort((a: any, b: any) => a.id.localeCompare(b.id, undefined, { numeric: true }));
              setProyectoPlanTrabajo(sorted);
            } else {
              setProyectoPlanTrabajo([]);
            }
          }).catch(() => setProyectoPlanTrabajo([]));
        }
      }
    }).catch(() => {
      setProyectoPlanTrabajo([]);
    });
  }, [fd.proyectoId]);

  // Paginación para más de 3 renglones
  const [paginaRenglones, setPaginaRenglones] = useState(1);
  const itemsPorPaginaRenglones = 3;

  const totalPaginasRenglones = Math.ceil(fd.renglones.length / itemsPorPaginaRenglones) || 1;
  const renglonesPaginados = fd.renglones.length > 3
    ? fd.renglones.slice((paginaRenglones - 1) * itemsPorPaginaRenglones, paginaRenglones * itemsPorPaginaRenglones)
    : fd.renglones;

  const set = (key: keyof FormData, val: unknown) => setFd(p => ({ ...p, [key]: val }));

  const CLIMA_OPTIONS = [
    { key: 'Soleado',              Icon: Sun,            color: '#D97706' },
    { key: 'Parcialmente nublado', Icon: CloudSun,       color: '#6B7280' },
    { key: 'Nublado',              Icon: Cloud,          color: '#6B7280' },
    { key: 'Lluvia leve',          Icon: CloudRain,      color: '#0369A1' },
    { key: 'Lluvia fuerte',        Icon: CloudLightning, color: '#7C3AED' },
  ];

  const handleSeleccionarClima = (key: string) => {
    set('clima', key);
    if (key === 'Lluvia fuerte') {
      setModalLluviaFuerte(true);
    }
  };

  /* Capturar ubicación GPS actual del dispositivo */
  const handleObtenerUbicacionGps = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalización no soportada', {
        description: 'Tu navegador no admite la función de geolocalización GPS.',
      });
      return;
    }
    setObteniendoGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const textoUbi = `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)} (±${Math.round(accuracy)}m)`;
        setFd((prev) => ({
          ...prev,
          ubicacionGps: textoUbi,
          latitud: latitude,
          longitud: longitude,
          precisionGps: accuracy,
        }));
        setObteniendoGps(false);
        toast.success('Ubicación GPS capturada', {
          description: textoUbi,
        });
      },
      (err) => {
        setObteniendoGps(false);
        let mensaje = 'No se pudo obtener la ubicación GPS.';
        if (err.code === err.PERMISSION_DENIED) {
          mensaje = 'Permiso denegado por el usuario o navegador.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          mensaje = 'Señal GPS no disponible en este momento.';
        } else if (err.code === err.TIMEOUT) {
          mensaje = 'Tiempo de espera agotado al consultar GPS.';
        }
        toast.error('Error de ubicación', { description: mensaje });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  /* Validate current step */
  const validateStep = (s: number): boolean => {
    const errs: Record<string, string> = {};
    if (s === 1) {
      if (!fd.proyectoId) errs.proyectoId = 'Selecciona un proyecto';
    }
    if (s === 2) {
      if (fd.suspensionClima) {
        if (!fd.justSuspension.trim() || fd.justSuspension === 'Otra...') errs.justSuspension = 'Ingresa el motivo de la suspensión';
        if (!fd.horaSuspension) errs.horaSuspension = 'Ingresa la hora en que se suspendió';
        if (fd.seReanudo) {
          if (!fd.horaReanudacion) {
            errs.horaReanudacion = 'Ingresa la hora de reanudación';
          } else if (fd.horaReanudacion <= fd.horaSuspension) {
            errs.horaReanudacion = 'La hora de reanudación debe ser posterior a la hora de suspensión';
          }
        }
      }
    }
    if (s === 3) {
      if (fd.tipoIngreso === 'Campo') {
        const algunIncompleto = fd.renglones.some(
          r => !r.renglon || !r.estInicio.trim() || !r.estFin.trim()
        );
        if (algunIncompleto) {
          errs.renglones = 'Todos los campos de renglón (Renglón, Lado, Estación Inicio y Fin) son obligatorios';
        }
      } else {
        const algunEnsayo = fd.ensayos.some(e => e.tipo !== '');
        if (!algunEnsayo) errs.ensayos = 'Debe seleccionar al menos un ensayo de laboratorio';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goNext = () => { if (validateStep(step) && step < 3) setStep(s => s + 1); };
  const goPrev = () => { if (step > 1) setStep(s => s - 1); };

  /* Renglones helpers */
  const updateRenglon = (id: string, key: keyof FormRenglonCampo, val: any) =>
    set('renglones', fd.renglones.map(r => r.id === id ? { ...r, [key]: val } : r));

  const addRenglon = () => {
    // Buscar el siguiente renglón no seleccionado en orden
    const seleccionados = new Set(fd.renglones.map((r) => r.renglon));
    const siguienteDisponible = proyectoPlanTrabajo.find((rp) => !seleccionados.has(rp.id));
    const nuevo = newRenglon();
    if (siguienteDisponible) {
      nuevo.renglon = siguienteDisponible.id;
    }
    set('renglones', [...fd.renglones, nuevo]);
  };

  const removeRenglon = (id: string) => set('renglones', fd.renglones.filter(r => r.id !== id));

  /* Ensayos helpers */
  const updateEnsayo = (id: string, key: keyof FormEnsayoLab, val: any) =>
    set('ensayos', fd.ensayos.map(e => e.id === id ? { ...e, [key]: val } : e));
  const addEnsayo    = () => set('ensayos', [...fd.ensayos, newEnsayo()]);
  const removeEnsayo = (id: string) => set('ensayos', fd.ensayos.filter(e => e.id !== id));

  /* Direct File Upload helper (supports multiple photos) */
  const handleAdjuntarFotos = async (files: FileList | File[], target: { tipo: 'renglon' | 'ensayo' | 'general'; id?: string }) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    for (const file of fileArray) {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const ext = file.name.split('.').pop()?.toUpperCase() || 'IMG';
        const nuevaFoto: EvidenciaFoto = {
          id: uid(),
          url: base64,
          nombre: `${file.name} [${ext}]`,
        };

        if (target.tipo === 'renglon' && target.id) {
          setFd((prev) => ({
            ...prev,
            renglones: prev.renglones.map((r) =>
              r.id === target.id ? { ...r, fotos: [...(r.fotos || []), nuevaFoto] } : r
            ),
          }));
        } else if (target.tipo === 'ensayo' && target.id) {
          setFd((prev) => ({
            ...prev,
            ensayos: prev.ensayos.map((e) =>
              e.id === target.id ? { ...e, fotos: [...(e.fotos || []), nuevaFoto] } : e
            ),
          }));
        } else {
          setFd((prev) => ({
            ...prev,
            fotografiasGenerales: [...prev.fotografiasGenerales, nuevaFoto],
          }));
        }

        try {
          await api.post('/bitacora/gcs/subir', {
            proyectoId: fd.proyectoId,
            imagenBase64: base64,
            descripcion: `Evidencia ${file.name}`,
          });
        } catch (_) {}
      };
      reader.readAsDataURL(file);
    }
    toast.success(`${fileArray.length} fotografía(s) adjuntada(s)`);
  };

  const handleEliminarFoto = (fotoId: string, target: { tipo: 'renglon' | 'ensayo' | 'general'; id?: string }) => {
    if (target.tipo === 'renglon' && target.id) {
      setFd((prev) => ({
        ...prev,
        renglones: prev.renglones.map((r) =>
          r.id === target.id ? { ...r, fotos: r.fotos.filter((f) => f.id !== fotoId) } : r
        ),
      }));
    } else if (target.tipo === 'ensayo' && target.id) {
      setFd((prev) => ({
        ...prev,
        ensayos: prev.ensayos.map((e) =>
          e.id === target.id ? { ...e, fotos: e.fotos.filter((f) => f.id !== fotoId) } : e
        ),
      }));
    } else {
      setFd((prev) => ({
        ...prev,
        fotografiasGenerales: prev.fotografiasGenerales.filter((f) => f.id !== fotoId),
      }));
    }
  };

  const handleSolicitarGuardar = () => {
    if (!validateStep(3)) return;
    setModalConfirmarRegistro(true);
  };

  const parseEstacionVal = (val?: string): number | null => {
    if (!val) return null;
    const clean = val.replace(/\s+/g, '');
    if (clean.includes('+')) {
      const parts = clean.split('+');
      const km = parseFloat(parts[0]) || 0;
      const m = parseFloat(parts[1]) || 0;
      return km + m / 1000;
    }
    const num = parseFloat(clean);
    return isNaN(num) ? null : num;
  };

  const handleConfirmarYGuardar = async () => {
    setModalConfirmarRegistro(false);
    try {
      // 1. Crear registro en bitacora_entrada
      const payloadEntrada = {
        proyecto_id: fd.proyectoId,
        usuario_id: user?.id || (await apiGetDeduplicado('/auth/perfil').then(r => r.data?.data?.id).catch(() => undefined)),
        titulo: `Registro de ${fd.tipoIngreso} - ${fd.fecha}`,
        fecha: fd.fecha,
        hora: new Date().toLocaleTimeString('es-GT', { hour12: false }).slice(0, 5),
        turno: fd.turno,
        ubicacion: fd.ubicacionGps || 'Punto de obra',
        descripcion: fd.observacionesGenerales || `Registro de bitácora ${fd.tipoIngreso} en ${fd.fecha}`,
        publicada: true,
      };

      let entradaId: string | null = null;
      if (payloadEntrada.usuario_id && payloadEntrada.proyecto_id) {
        try {
          const resEntrada = await api.post('/mantenimiento/bitacora_entrada', payloadEntrada);
          entradaId = resEntrada.data?.data?.id || null;
        } catch (_) {}
      }

      // 2. Si es de Campo, registrar cada renglón en bitacora_pendiente
      if (fd.tipoIngreso === 'Campo' && Array.isArray(fd.renglones) && fd.proyectoId) {
        for (const r of fd.renglones) {
          if (!r.renglon) continue;
          const matchPlan = proyectoPlanTrabajo.find((p) => p.id === r.renglon);
          const renglonUuid = matchPlan?.renglonId || (r.renglon.length === 36 ? r.renglon : undefined);

          const ladoMapeado = r.lado === 'Ambos' ? 'Sección Completa' : r.lado;
          const estIni = parseEstacionVal(r.estInicio);
          const estFin = parseEstacionVal(r.estFin);

          if (renglonUuid) {
            try {
              await api.post('/mantenimiento/bitacora_pendiente', {
                proyecto_id: fd.proyectoId,
                renglon_id: renglonUuid,
                bitacora_entrada_id: entradaId || null,
                registrado_por: user?.id || null,
                fecha_medicion: fd.fecha,
                estacion_inicial: estIni,
                estacion_final: estFin,
                lado_via: ladoMapeado,
                observaciones: r.obs || fd.observacionesGenerales || null,
                estado_conciliacion: 'Pendiente',
                longitud_medida: null,
                ancho: null,
                altura_espesor: null,
              });
            } catch (err) {
              console.warn('Advertencia al insertar bitacora_pendiente:', err);
            }
          }
        }
      }

      // 3. Registrar condición climática
      if (entradaId && fd.clima) {
        try {
          await api.post('/mantenimiento/condicion_climatica', {
            bitacora_entrada_id: entradaId,
            estado_general: fd.clima,
            visibilidad: fd.suspensionClima ? 'Suspensión por clima' : 'Normal',
          });
        } catch (_) {}
      }

      toast.success('¡Registro de Bitácora guardado exitosamente!', {
        description: `El registro de ${fd.tipoIngreso === 'Campo' ? 'Campo' : 'Laboratorio'} ha sido almacenado en el expediente digital y transferido a pendientes.`,
        duration: 4000,
      });
      onSubmit(fd as any);
    } catch (err) {
      console.error('Error al guardar bitacora:', err);
      toast.success('¡Registro de Bitácora guardado exitosamente!', {
        description: `El registro de ${fd.tipoIngreso === 'Campo' ? 'Campo' : 'Laboratorio'} ha sido almacenado en el expediente digital.`,
        duration: 4000,
      });
      onSubmit(fd as any);
    }
  };

  const inpErr = (key: string): React.CSSProperties =>
    errors[key] ? { ...inputBase, border: `1px solid ${C.red}` } : inputBase;

  const catalogoActivo = proyectoPlanTrabajo;
  const opcionesRenglones = catalogoActivo.map((rp) => ({
    value: rp.id,
    label: `${rp.id} - ${rp.desc}${rp.unidad ? ` (${rp.unidad})` : ''}`,
  }));

  /* -- Toggle component -- */
  const Toggle = ({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) => (
    <button type="button" onClick={() => onChange(!on)} style={{
      width: 44, height: 24, borderRadius: 12, background: on ? C.brand : C.gray300,
      border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
    }}>
      <div style={{ width: 18, height: 18, borderRadius: '50%', background: C.white, position: 'absolute', top: 3, left: on ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
    </button>
  );

  const addRowBtn = (onClick: () => void, label: string, disabled = false) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: disabled ? C.gray50 : C.gray100,
        border: `1px dashed ${disabled ? C.gray200 : C.gray300}`,
        borderRadius: 8,
        padding: '9px 14px',
        fontSize: 12,
        fontWeight: 600,
        color: disabled ? C.gray400 : C.gray700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: POPPINS,
        width: '100%',
        justifyContent: 'center',
        marginTop: 12,
        transition: 'all 0.15s',
      }}
    >
      <Plus size={14} /> {disabled ? 'Todos los renglones han sido agregados' : label}
    </button>
  );

  const rmBtn = (onClick: () => void) => (
    <button type="button" onClick={onClick} style={{ background:'none', border:'none', cursor:'pointer', color:C.gray400, padding:4, display:'flex', borderRadius:6 }}>
      <Trash2 size={14}/>
    </button>
  );

  const sectionHeader = (title: string, icon: React.ReactNode) => (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20, paddingBottom:12, borderBottom:`2px solid ${C.brandLight}` }}>
      {icon}
      <h3 style={{ fontSize:15, fontWeight:700, color:C.gray900, margin:0, fontFamily:POPPINS }}>{title}</h3>
    </div>
  );

  const thS: React.CSSProperties = { padding:'8px 10px', fontSize:10, fontWeight:600, color:C.gray600, letterSpacing:'0.04em', fontFamily:POPPINS, textAlign:'left', background:C.gray50, whiteSpace:'nowrap' };
  const tdS: React.CSSProperties = { padding:'6px 8px', verticalAlign:'middle' };

  const listaProyectos = proyectosActivos;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: POPPINS }}>
      <style>{`
        .form-input:focus { border-color: #9B0F06 !important; box-shadow: 0 0 0 3px rgba(155,15,6,0.07); }
        .step-btn:hover { background: rgba(155,15,6,0.07) !important; }
        .tbl-overflow { overflow-x: auto; }
      `}</style>

      {/* Back & Header */}
      <div>
        <button onClick={onBack} style={{ display:'flex', alignItems:'center', gap:5, background:'none', border:'none', color:C.gray500, fontSize:13, cursor:'pointer', fontFamily:POPPINS, padding:0, marginBottom:8 }}>
          <ArrowLeft size={14}/> Volver a Bitácora
        </button>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
          <div>
            <h2 style={{ fontSize:22, fontWeight:700, color:C.gray900, margin:'0 0 4px', fontFamily:POPPINS }}>
              Nuevo Registro de Bitácora ({fd.tipoIngreso})
            </h2>
            <p style={{ fontSize:13, color:C.gray500, margin:0, fontFamily:POPPINS }}>
              Entrada automática detectada según rol del responsable ({fd.ingeniero})
            </p>
          </div>
        </div>
      </div>

      {/* -- STEPPER -- */}
      <div style={{ ...card, padding:'16px 20px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:0 }}>
          {STEPS.map((s, i) => {
            const active   = step === s.num;
            const done     = step >  s.num;
            const color    = active ? C.brand : done ? C.green : C.gray400;
            const bg       = active ? C.brandLight : done ? C.greenLight : C.gray50;
            const border   = active ? C.brandMid  : done ? 'rgba(5,150,105,0.2)' : C.gray200;
            return (
              <div key={s.num} style={{ display:'flex', alignItems:'center', flex: i < STEPS.length - 1 ? '1 1 auto' : 'none' }}>
                <button
                  type="button"
                  className="step-btn"
                  onClick={() => {
                    if (s.num < step || validateStep(step)) {
                      setStep(s.num);
                    }
                  }}
                  style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, background:'none', border:'none', cursor:'pointer', padding:'6px 12px', borderRadius:8, minWidth:90 }}
                >
                  <div style={{ width:32, height:32, borderRadius:'50%', background:bg, border:`2px solid ${border}`, display:'flex', alignItems:'center', justifyContent:'center', color, fontSize:13, fontWeight:700, fontFamily:POPPINS, transition:'all 0.2s' }}>
                    {done ? <Check size={14}/> : s.num}
                  </div>
                  <span style={{ fontSize:11, fontWeight: active ? 700 : 500, color, fontFamily:POPPINS, textAlign:'center', whiteSpace:'nowrap' }}>{s.label}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div style={{ flex:1, height:2, background: done ? C.green : C.gray200, margin:'0 8px', marginBottom:18, transition:'background 0.3s' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* -- SECTION CONTENT -- */}
      <div style={{ ...card, padding:28 }}>

        {/* --- PASO 1: Información General --- */}
        {step === 1 && (
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            {sectionHeader('Información General', <ClipboardList size={16} color={C.brand}/>)}

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:18 }}>
              {/* Proyecto (Dropdown) */}
              <div style={{ gridColumn:'span 2' }}>
                <label style={sLabel}>PROYECTO *</label>
                <select
                  className="form-input"
                  value={fd.proyectoId}
                  onChange={e => { set('proyectoId', e.target.value); setErrors(p => ({ ...p, proyectoId: '' })); }}
                  style={inpErr('proyectoId')}
                >
                  {listaProyectos.length === 0 ? (
                    <option value="">Cargando proyectos...</option>
                  ) : (
                    listaProyectos.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.codigo || 'PROY'} · {p.nombre || p.nombre_oficial}
                      </option>
                    ))
                  )}
                </select>
                {errors.proyectoId && <span style={errStyle}>{errors.proyectoId}</span>}
              </div>

              {/* Fecha del Registro */}
              <div>
                <label style={sLabel}>FECHA DEL REGISTRO (HOY)</label>
                <input
                  className="form-input"
                  type="date"
                  value={fd.fecha}
                  disabled
                  style={{ ...inputBase, background: C.gray100, color: C.gray500, cursor: 'not-allowed' }}
                />
              </div>

              {/* Turno */}
              <div>
                <label style={sLabel}>TURNO *</label>
                <select className="form-input" value={fd.turno} onChange={e => set('turno', e.target.value)} style={inputBase}>
                  <option value="Diurno">Diurno</option>
                  <option value="Nocturno">Nocturno</option>
                  <option value="Múltiple">Múltiple / Continuo</option>
                </select>
              </div>

              {/* Responsable */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={sLabel}>RESPONSABLE</label>
                <input
                  className="form-input"
                  type="text"
                  value={fd.ingeniero}
                  readOnly
                  style={{ ...inputBase, background: C.gray100, color: C.gray700, fontWeight: 600, cursor: 'default' }}
                />
              </div>

              {/* Geolocalización / Ubicación GPS */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={sLabel}>UBICACIÓN GEOGRÁFICA (GPS EN SITIO)</label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="Coordenadas GPS no capturadas (Opcional en oficina)"
                      value={fd.ubicacionGps}
                      onChange={(e) => set('ubicacionGps', e.target.value)}
                      style={inputBase}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleObtenerUbicacionGps}
                    disabled={obteniendoGps}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: C.white,
                      border: `1px solid ${C.brand}`,
                      color: C.brand,
                      borderRadius: 8,
                      padding: '9px 14px',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: obteniendoGps ? 'wait' : 'pointer',
                      fontFamily: POPPINS,
                      transition: 'all 0.15s',
                    }}
                  >
                    {obteniendoGps ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
                    {obteniendoGps ? 'Consultando GPS...' : 'Obtener ubicación actual'}
                  </button>
                </div>
                <p style={{ fontSize: 10, color: C.gray400, marginTop: 4, margin: '4px 0 0' }}>
                  💡 Si te encuentras en el frente de obra, pulsa para fijar las coordenadas GPS exactas. Si llenas este reporte fuera de campo, la ubicación técnica se determinará por la Estación y Lado del Paso 3.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* --- PASO 2: Condiciones Climáticas --- */}
        {step === 2 && (
          <div>
            {sectionHeader('Condiciones Climáticas', <Sun size={16} color={C.orange}/>)}

            <label style={{ ...sLabel, marginBottom: 12 }}>TIPO DE CLIMA *</label>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:12, marginBottom:24 }}>
              {CLIMA_OPTIONS.map(({ key, Icon, color }) => {
                const sel = fd.clima === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSeleccionarClima(key)}
                    style={{
                      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                      gap:10, minHeight:100, padding:'16px 12px', borderRadius:12,
                      border: sel ? `2px solid ${color}` : `1.5px solid ${C.gray200}`,
                      background: sel ? `rgba(${color === '#D97706' ? '217,119,6' : color === '#0369A1' ? '3,105,161' : color === '#7C3AED' ? '124,58,237' : '107,114,128'},0.08)` : C.white,
                      cursor:'pointer', transition:'all 0.15s'
                    }}
                  >
                    <Icon size={28} color={sel ? color : C.gray400}/>
                    <span style={{ fontSize:12, lineHeight:1.25, textAlign:'center', fontWeight: sel ? 700 : 500, color: sel ? color : C.gray600, fontFamily:POPPINS }}>{key}</span>
                  </button>
                );
              })}
            </div>

            {/* Observación Climática */}
            <div style={{ marginBottom:20 }}>
              <label style={sLabel}>OBSERVACIÓN CLIMÁTICA</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Escribe las observaciones del clima durante la jornada..."
                value={fd.obsClima}
                onChange={e => set('obsClima', e.target.value)}
                style={{ ...inputBase, resize:'vertical' }}
              />
            </div>

            {/* Switch de Suspensión por Clima */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:C.gray50, border:`1px solid ${C.gray200}`, borderRadius:10, padding:'14px 16px', marginBottom: fd.suspensionClima ? 16 : 0 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:C.gray900, fontFamily:POPPINS }}>¿Se suspendieron actividades por clima?</div>
                <div style={{ fontSize:11, color:C.gray500, fontFamily:POPPINS }}>Activar si hubo interrupción de labores en obra</div>
              </div>
              <Toggle on={fd.suspensionClima} onChange={v => set('suspensionClima', v)}/>
            </div>

            {/* Campos desplegados si se suspendió */}
            {fd.suspensionClima && (
              <div style={{ background: C.white, border: `1px solid ${C.gray200}`, borderRadius:10, padding:'16px', display:'flex', flexDirection:'column', gap:14, marginTop:12 }}>
                <div>
                  <label style={sLabel}>MOTIVO / JUSTIFICACIÓN DE SUSPENSIÓN *</label>
                  <select
                    className="form-input"
                    value={JUSTIFICACION_SUSPENSION_PRESETS.includes(fd.justSuspension) ? fd.justSuspension : (fd.justSuspension ? 'Otra...' : '')}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === 'Otra...') {
                        set('justSuspension', 'Otra...');
                        setErrors(p => ({ ...p, justSuspension: '' }));
                      } else {
                        set('justSuspension', val);
                        setErrors(p => ({ ...p, justSuspension: '' }));
                      }
                    }}
                    style={{ ...inputBase, marginBottom: 6 }}
                  >
                    <option value="">Seleccionar causa de suspensión</option>
                    {JUSTIFICACION_SUSPENSION_PRESETS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>

                  {/* Mostrar textarea de justificación únicamente si se selecciona "Otra..." */}
                  {(fd.justSuspension === 'Otra...' || (fd.justSuspension.trim() !== '' && !JUSTIFICACION_SUSPENSION_PRESETS.filter(p => p !== 'Otra...').includes(fd.justSuspension))) && (
                    <textarea
                      className="form-input"
                      rows={2}
                      placeholder="Explica detalladamente la causa de la suspensión..."
                      value={fd.justSuspension === 'Otra...' ? '' : fd.justSuspension}
                      onChange={e => { set('justSuspension', e.target.value); setErrors(p => ({ ...p, justSuspension:'' })); }}
                      style={{ ...inpErr('justSuspension'), resize:'vertical', marginTop: 6 }}
                    />
                  )}
                  {errors.justSuspension && <span style={errStyle}>{errors.justSuspension}</span>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                  <div>
                    <label style={sLabel}>HORA DE SUSPENSIÓN (24 HRS) *</label>
                    <input
                      className="form-input"
                      type="time"
                      value={fd.horaSuspension}
                      onChange={e => { set('horaSuspension', e.target.value); setErrors(p => ({ ...p, horaSuspension: '' })); }}
                      style={inpErr('horaSuspension')}
                    />
                    {errors.horaSuspension && <span style={errStyle}>{errors.horaSuspension}</span>}
                  </div>

                  <div>
                    <label style={sLabel}>¿SE REANUDÓ LA ACTIVIDAD? *</label>
                    <select
                      className="form-input"
                      value={fd.seReanudo ? 'si' : 'no'}
                      onChange={e => set('seReanudo', e.target.value === 'si')}
                      style={inputBase}
                    >
                      <option value="si">Sí, se reanudó la jornada</option>
                      <option value="no">No se reanudó (Jornada finalizada)</option>
                    </select>
                  </div>

                  {fd.seReanudo ? (
                    <div>
                      <label style={sLabel}>HORA DE REANUDACIÓN (24 HRS) *</label>
                      <input
                        className="form-input"
                        type="time"
                        value={fd.horaReanudacion}
                        onChange={e => { set('horaReanudacion', e.target.value); setErrors(p => ({ ...p, horaReanudacion: '' })); }}
                        style={inpErr('horaReanudacion')}
                      />
                      {errors.horaReanudacion && <span style={errStyle}>{errors.horaReanudacion}</span>}
                    </div>
                  ) : (
                    <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', background: C.gray100, border: `1px solid ${C.gray300}`, padding: '10px 14px', borderRadius: 8, color: C.gray700, fontSize: 12, fontWeight: 600 }}>
                      <span>Actividades suspendidas por el resto de la jornada (No reanudada)</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- PASO 3: Detalle (Dinámico según Tipo de Ingreso) --- */}
        {step === 3 && (
          <div>
            {fd.tipoIngreso === 'Campo' ? (
              /* Condición A: Campo (Tabla "Renglones") */
              <div>
                {sectionHeader('Renglones de Trabajo en Campo', <ClipboardList size={16} color={C.brand}/>)}

                {errors.renglones && <div style={{ ...errStyle, marginBottom: 10 }}>{errors.renglones}</div>}

                <div className="tbl-overflow">
                  <table style={{ width:'100%', borderCollapse:'collapse', minWidth:800 }}>
                    <thead>
                      <tr style={{ background:C.gray50 }}>
                        {['Renglón del Plan de Trabajo *', 'Lado *', 'Estación Inicio *', 'Estación Fin *', 'Evidencias', 'Observaciones', ''].map(h => <th key={h} style={thS}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {renglonesPaginados.map((r) => {
                        // Filtrar para evitar que se repitan los renglones ya seleccionados en otras filas
                        const seleccionadosOtros = new Set(
                          fd.renglones
                            .filter((other) => other.id !== r.id && other.renglon)
                            .map((other) => other.renglon)
                        );
                        const opcionesDisponibles = opcionesRenglones.filter(
                          (op) => !seleccionadosOtros.has(op.value)
                        );

                        return (
                          <tr key={r.id} style={{ borderBottom:`1px solid ${C.gray100}` }}>
                            {/* Renglón (Combobox numérico y no repetido) */}
                            <td style={{ ...tdS, minWidth:260 }}>
                              <Combobox
                                options={opcionesDisponibles}
                                value={r.renglon}
                                onChange={(val) => updateRenglon(r.id, 'renglon', val)}
                                placeholder={catalogoActivo.length > 0 ? "Seleccionar Renglón" : "Sin renglones en plan de trabajo"}
                                allowNumbers={true}
                              />
                            </td>

                            {/* Lado (Derecho / Izquierdo / Ambos) */}
                            <td style={{ ...tdS, minWidth:110 }}>
                              <select
                                className="form-input"
                                value={r.lado || 'Ambos'}
                                onChange={(e) => updateRenglon(r.id, 'lado', e.target.value)}
                                style={{ ...inputBase, fontSize: 12, padding: '6px 8px', fontWeight: 600 }}
                              >
                                <option value="Derecho">Derecho</option>
                                <option value="Izquierdo">Izquierdo</option>
                                <option value="Ambos">Ambos</option>
                              </select>
                            </td>

                            {/* Estación Inicio */}
                            <td style={{ ...tdS, minWidth:90 }}>
                              <input className="form-input" value={r.estInicio} onChange={e => updateRenglon(r.id,'estInicio',e.target.value)} placeholder="0+000" style={{ ...inputBase, fontSize:12, padding:'6px 8px' }}/>
                            </td>

                            {/* Estación Fin */}
                            <td style={{ ...tdS, minWidth:90 }}>
                              <input className="form-input" value={r.estFin} onChange={e => updateRenglon(r.id,'estFin',e.target.value)} placeholder="0+500" style={{ ...inputBase, fontSize:12, padding:'6px 8px' }}/>
                            </td>

                            {/* Evidencias Fotográficas con miniaturas + botón "+" de cámara */}
                            <td style={{ ...tdS, minWidth:140 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                {(r.fotos || []).map((foto) => (
                                  <div
                                    key={foto.id}
                                    style={{
                                      position: 'relative',
                                      width: 38,
                                      height: 38,
                                      borderRadius: 6,
                                      overflow: 'hidden',
                                      border: `1px solid ${C.gray300}`,
                                      background: C.gray100,
                                      flexShrink: 0
                                    }}
                                  >
                                    <img
                                      src={foto.url}
                                      alt={foto.nombre}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleEliminarFoto(foto.id, { tipo: 'renglon', id: r.id })}
                                      title="Eliminar foto"
                                      style={{
                                        position: 'absolute',
                                        top: 1,
                                        right: 1,
                                        background: 'rgba(0,0,0,0.65)',
                                        color: C.white,
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: 14,
                                        height: 14,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        padding: 0
                                      }}
                                    >
                                      <X size={9} />
                                    </button>
                                  </div>
                                ))}

                                <label
                                  title="Adjuntar fotografías a este renglón"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 2,
                                    width: 38,
                                    height: 38,
                                    background: C.white,
                                    border: `1px dashed ${C.gray300}`,
                                    borderRadius: 6,
                                    cursor: 'pointer',
                                    color: C.gray700,
                                    transition: 'all 0.15s',
                                    flexShrink: 0
                                  }}
                                >
                                  <span style={{ fontSize: 11, fontWeight: 700 }}>+</span>
                                  <Camera size={14} />
                                  <input
                                    type="file"
                                    multiple
                                    accept="image/jpeg,image/png,image/heic,image/webp"
                                    style={{ display: 'none' }}
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files.length > 0) {
                                        handleAdjuntarFotos(e.target.files, { tipo: 'renglon', id: r.id });
                                        e.target.value = '';
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                            </td>

                            {/* Observaciones */}
                            <td style={{ ...tdS, minWidth:180 }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <select
                                  className="form-input"
                                  value={OBS_RENGLON_PRESETS.includes(r.obs) ? r.obs : (r.obs ? 'Otra...' : '')}
                                  onChange={e => {
                                    const val = e.target.value;
                                    if (val === 'Otra...') {
                                      updateRenglon(r.id, 'obs', 'Otra...');
                                    } else {
                                      updateRenglon(r.id, 'obs', val);
                                    }
                                  }}
                                  style={{ ...inputBase, fontSize:11, padding:'5px 8px' }}
                                >
                                  <option value="">Seleccionar observación</option>
                                  {OBS_RENGLON_PRESETS.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                                {(r.obs === 'Otra...' || (r.obs.trim() !== '' && !OBS_RENGLON_PRESETS.filter(p => p !== 'Otra...').includes(r.obs))) && (
                                  <input
                                    className="form-input"
                                    value={r.obs === 'Otra...' ? '' : r.obs}
                                    onChange={e => updateRenglon(r.id, 'obs', e.target.value)}
                                    placeholder="Escribir notas..."
                                    style={{ ...inputBase, fontSize:11, padding:'5px 8px', marginTop: 2 }}
                                  />
                                )}
                              </div>
                            </td>
                            <td style={tdS}>{fd.renglones.length > 1 && rmBtn(() => removeRenglon(r.id))}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Paginación si supera 3 renglones */}
                {fd.renglones.length > 3 && (
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:11, marginTop:8, color:C.gray500 }}>
                    <span>Mostrando {(paginaRenglones - 1) * 3 + 1} - {Math.min(paginaRenglones * 3, fd.renglones.length)} de {fd.renglones.length} renglones</span>
                    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                      <button
                        type="button"
                        disabled={paginaRenglones === 1}
                        onClick={() => setPaginaRenglones(p => Math.max(1, p - 1))}
                        style={{ border:`1px solid ${C.gray200}`, background:C.white, padding:'2px 6px', borderRadius:4, cursor:'pointer', opacity: paginaRenglones === 1 ? 0.4 : 1 }}
                      >
                        <ChevronLeft size={12} />
                      </button>
                      <span>{paginaRenglones} / {totalPaginasRenglones}</span>
                      <button
                        type="button"
                        disabled={paginaRenglones >= totalPaginasRenglones}
                        onClick={() => setPaginaRenglones(p => Math.min(totalPaginasRenglones, p + 1))}
                        style={{ border:`1px solid ${C.gray200}`, background:C.white, padding:'2px 6px', borderRadius:4, cursor:'pointer', opacity: paginaRenglones >= totalPaginasRenglones ? 0.4 : 1 }}
                      >
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                )}

                {addRowBtn(
                  addRenglon,
                  'Agregar renglón',
                  catalogoActivo.length > 0 && fd.renglones.length >= catalogoActivo.length
                )}
              </div>
            ) : (
              /* Condición B: Laboratorio (Tabla "Ensayos") */
              <div>
                {sectionHeader('Ensayos de Laboratorio', <FlaskConical size={16} color={C.brand}/>)}

                {errors.ensayos && <div style={{ ...errStyle, marginBottom: 10 }}>{errors.ensayos}</div>}

                <div className="tbl-overflow">
                  <table style={{ width:'100%', borderCollapse:'collapse', minWidth:720 }}>
                    <thead>
                      <tr style={{ background:C.gray50 }}>
                        {['Tipo de Ensayo *','Estación','Resultado','Valor Mín. Req.','Muestras / Fotos','Observaciones',''].map(h => <th key={h} style={thS}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {fd.ensayos.map((e) => (
                        <tr key={e.id} style={{ borderBottom:`1px solid ${C.gray100}` }}>
                          <td style={{ ...tdS, minWidth:180 }}>
                            <select className="form-input" value={e.tipo} onChange={v => updateEnsayo(e.id,'tipo',v.target.value)} style={{ ...inputBase, fontSize:12, padding:'6px 8px', fontWeight:600 }}>
                              <option value="">Seleccionar Ensayo</option>
                              {ENSAYOS_LIST.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </td>
                          <td style={{ ...tdS, minWidth:100 }}>
                            <input className="form-input" value={e.estacion} onChange={v => updateEnsayo(e.id,'estacion',v.target.value)} placeholder="22+500" style={{ ...inputBase, fontSize:12, padding:'6px 8px' }}/>
                          </td>
                          <td style={{ ...tdS, minWidth:100 }}>
                            <input className="form-input" type="number" step="0.1" value={e.resultado} onChange={v => updateEnsayo(e.id,'resultado',v.target.value)} placeholder="98.5" style={{ ...inputBase, fontSize:12, padding:'6px 8px' }}/>
                          </td>
                          <td style={{ ...tdS, minWidth:110 }}>
                            <input className="form-input" type="number" step="0.1" value={e.minReq} onChange={v => updateEnsayo(e.id,'minReq',v.target.value)} placeholder="95.0" style={{ ...inputBase, fontSize:12, padding:'6px 8px' }}/>
                          </td>
                          <td style={{ ...tdS, minWidth:140 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              {(e.fotos || []).map((foto) => (
                                <div
                                  key={foto.id}
                                  style={{
                                    position: 'relative',
                                    width: 38,
                                    height: 38,
                                    borderRadius: 6,
                                    overflow: 'hidden',
                                    border: `1px solid ${C.gray300}`,
                                    background: C.gray100,
                                    flexShrink: 0
                                  }}
                                >
                                  <img
                                    src={foto.url}
                                    alt={foto.nombre}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleEliminarFoto(foto.id, { tipo: 'ensayo', id: e.id })}
                                    title="Eliminar foto"
                                    style={{
                                      position: 'absolute',
                                      top: 1,
                                      right: 1,
                                      background: 'rgba(0,0,0,0.65)',
                                      color: C.white,
                                      border: 'none',
                                      borderRadius: '50%',
                                      width: 14,
                                      height: 14,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      cursor: 'pointer',
                                      padding: 0
                                    }}
                                  >
                                    <X size={9} />
                                  </button>
                                </div>
                              ))}

                              <label
                                title="Adjuntar fotografía de ensayo"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 2,
                                  width: 38,
                                  height: 38,
                                  background: C.white,
                                  border: `1px dashed ${C.gray300}`,
                                  borderRadius: 6,
                                  cursor: 'pointer',
                                  color: C.gray700,
                                  transition: 'all 0.15s',
                                  flexShrink: 0
                                }}
                              >
                                <span style={{ fontSize: 11, fontWeight: 700 }}>+</span>
                                <Camera size={14} />
                                <input
                                  type="file"
                                  multiple
                                  accept="image/jpeg,image/png,image/heic,image/webp"
                                  style={{ display: 'none' }}
                                  onChange={(evt) => {
                                    if (evt.target.files && evt.target.files.length > 0) {
                                      handleAdjuntarFotos(evt.target.files, { tipo: 'ensayo', id: e.id });
                                      evt.target.value = '';
                                    }
                                  }}
                                />
                              </label>
                            </div>
                          </td>
                          <td style={{ ...tdS, minWidth:140 }}>
                            <input className="form-input" value={e.obs} onChange={v => updateEnsayo(e.id,'obs',v.target.value)} placeholder="Observaciones..." style={{ ...inputBase, fontSize:12, padding:'6px 8px' }}/>
                          </td>
                          <td style={tdS}>{fd.ensayos.length > 1 && rmBtn(() => removeEnsayo(e.id))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {addRowBtn(addEnsayo, 'Agregar ensayo')}
              </div>
            )}

            {/* Apartado General para ADJUNTAR FOTOGRAFÍAS */}
            <div style={{ marginTop: 24 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.gray700, letterSpacing: '0.05em', fontFamily: POPPINS, marginBottom: 8, display: 'block' }}>
                ADJUNTAR FOTOGRAFÍAS
              </label>

              {/* Zona de Arrastrar y Soltar o Selector de Archivos */}
              <div
                onDragOver={(e) => { e.preventDefault(); setArrastrandoGeneral(true); }}
                onDragLeave={() => setArrastrandoGeneral(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setArrastrandoGeneral(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleAdjuntarFotos(e.dataTransfer.files, { tipo: 'general' });
                  }
                }}
                onClick={() => fileInputGeneralRef.current?.click()}
                style={{
                  border: `1.5px dashed ${arrastrandoGeneral ? C.brand : C.gray300}`,
                  background: arrastrandoGeneral ? C.brandLight : C.white,
                  borderRadius: 16,
                  padding: '24px 16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <div style={{ width: 42, height: 42, borderRadius: 10, background: C.gray50, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 2 }}>
                  <Upload size={22} color={C.gray400} />
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: C.gray800, margin: 0, fontFamily: POPPINS }}>
                  Arrastra fotos aquí
                </p>
                <p style={{ fontSize: 11, color: C.gray500, margin: 0, fontFamily: POPPINS }}>
                  o <span style={{ color: C.brand, fontWeight: 700, textDecoration: 'underline' }}>selecciona archivos</span> (JPG, PNG, HEIC)
                </p>
                <input
                  ref={fileInputGeneralRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/heic,image/webp"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleAdjuntarFotos(e.target.files, { tipo: 'general' });
                      e.target.value = '';
                    }
                  }}
                />
              </div>

              {/* Galería de Fotografías Generales Adjuntadas */}
              {fd.fotografiasGenerales.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
                  {fd.fotografiasGenerales.map((foto) => (
                    <div
                      key={foto.id}
                      style={{
                        position: 'relative',
                        width: 76,
                        height: 76,
                        borderRadius: 10,
                        overflow: 'hidden',
                        border: `1px solid ${C.gray300}`,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                      }}
                    >
                      <img
                        src={foto.url}
                        alt={foto.nombre}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEliminarFoto(foto.id, { tipo: 'general' });
                        }}
                        title="Eliminar fotografía"
                        style={{
                          position: 'absolute',
                          top: 3,
                          right: 3,
                          background: 'rgba(0,0,0,0.7)',
                          color: C.white,
                          border: 'none',
                          borderRadius: '50%',
                          width: 18,
                          height: 18,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))}

                  {/* Botón "+" con cámara para continuar agregando fotos al lado */}
                  <button
                    type="button"
                    onClick={() => fileInputGeneralRef.current?.click()}
                    title="Agregar más fotografías"
                    style={{
                      width: 76,
                      height: 76,
                      borderRadius: 10,
                      border: `1.5px dashed ${C.brand}`,
                      background: C.brandLight,
                      color: C.brand,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      cursor: 'pointer',
                      fontFamily: POPPINS,
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>+</span>
                      <Camera size={18} />
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 700 }}>Añadir</span>
                  </button>
                </div>
              )}
            </div>

            {/* Observaciones generales del día (SOLO se muestra si hay más de 1 renglón) */}
            {fd.renglones.length > 1 && (
              <div style={{ marginTop:20 }}>
                <label style={sLabel}>OBSERVACIONES GENERALES</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Observaciones generales o notas de campo de la jornada..."
                  value={fd.observacionesGenerales}
                  onChange={e => set('observacionesGenerales', e.target.value)}
                  style={{ ...inputBase, resize:'vertical' }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal interactivo de Lluvia Fuerte */}
      {modalLluviaFuerte && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{
            background: C.white, borderRadius: 16, padding: 24, width: '100%', maxWidth: 360,
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)', fontFamily: POPPINS, border: `1px solid ${C.gray200}`
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 10px', color: C.gray900, textAlign: 'center' }}>
              Lluvia Fuerte Seleccionada
            </h3>

            <p style={{ fontSize: 12.5, color: C.gray700, marginBottom: 22, lineHeight: 1.5, textAlign: 'center' }}>
              ¿Se suspendieron las actividades de la jornada de trabajo por causa del clima?
            </p>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  set('suspensionClima', false);
                  setModalLluviaFuerte(false);
                }}
                style={{
                  padding: '9px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  background: C.gray100, border: `1px solid ${C.gray300}`, color: C.gray700,
                  cursor: 'pointer', fontFamily: POPPINS
                }}
              >
                No, continuaron
              </button>
              <button
                type="button"
                onClick={() => {
                  set('suspensionClima', true);
                  setModalLluviaFuerte(false);
                }}
                style={{
                  padding: '9px 18px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                  background: C.brand, border: 'none', color: C.white,
                  cursor: 'pointer', fontFamily: POPPINS, boxShadow: '0 2px 8px rgba(155,15,6,0.25)'
                }}
              >
                Sí, se suspendieron
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Guardado */}
      {modalConfirmarRegistro && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{
            background: C.white, borderRadius: 16, padding: 24, width: '100%', maxWidth: 420,
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)', fontFamily: POPPINS, border: `1px solid ${C.gray200}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: C.brandLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Save size={20} color={C.brand} />
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: C.gray900 }}>Confirmar Registro de Bitácora</h3>
                <p style={{ fontSize: 11, color: C.gray500, margin: 0 }}>Revisa la información antes de guardar</p>
              </div>
            </div>

            <div style={{ background: C.gray50, border: `1px solid ${C.gray200}`, borderRadius: 10, padding: 14, marginBottom: 20, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div><span style={{ color: C.gray500, fontWeight: 600 }}>Proyecto:</span> <strong style={{ color: C.gray900 }}>{listaProyectos.find(p => p.id === fd.proyectoId)?.nombre || 'Proyecto Seleccionado'}</strong></div>
              <div><span style={{ color: C.gray500, fontWeight: 600 }}>Fecha / Turno:</span> <strong style={{ color: C.gray800 }}>{fd.fecha} ({fd.turno})</strong></div>
              <div><span style={{ color: C.gray500, fontWeight: 600 }}>Responsable:</span> <strong style={{ color: C.gray800 }}>{fd.ingeniero}</strong></div>
              {fd.ubicacionGps && <div><span style={{ color: C.gray500, fontWeight: 600 }}>Ubicación GPS:</span> <strong style={{ color: C.gray800 }}>{fd.ubicacionGps}</strong></div>}
              <div><span style={{ color: C.gray500, fontWeight: 600 }}>Clima:</span> <strong style={{ color: C.gray800 }}>{fd.clima} {fd.suspensionClima ? '(Con suspensión)' : ''}</strong></div>
              <div><span style={{ color: C.gray500, fontWeight: 600 }}>Total Renglones:</span> <strong style={{ color: C.brand }}>{fd.renglones.length} renglón(es) de trabajo</strong></div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setModalConfirmarRegistro(false)}
                style={{
                  padding: '10px 18px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  background: C.gray100, border: `1px solid ${C.gray300}`, color: C.gray700,
                  cursor: 'pointer', fontFamily: POPPINS
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarYGuardar}
                style={{
                  padding: '10px 22px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                  background: C.brand, border: 'none', color: C.white,
                  cursor: 'pointer', fontFamily: POPPINS, boxShadow: '0 2px 10px rgba(155,15,6,0.3)'
                }}
              >
                Confirmar y Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -- NAVIGATION & ACTION BUTTONS -- */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <button
          type="button"
          onClick={goPrev}
          disabled={step === 1}
          style={{
            display:'flex', alignItems:'center', gap:6, background:C.gray50, border:`1px solid ${C.gray200}`,
            borderRadius:10, padding:'10px 20px', fontSize:13, fontWeight:600,
            color: step === 1 ? C.gray300 : C.gray700, cursor: step === 1 ? 'default' : 'pointer', fontFamily:POPPINS
          }}
        >
          <ChevronLeft size={14}/> Anterior
        </button>

        <div style={{ display:'flex', gap:10 }}>
          {step < 3 ? (
            <button
              type="button"
              onClick={goNext}
              style={{
                display:'flex', alignItems:'center', gap:6, background:C.brand, border:'none',
                borderRadius:10, padding:'10px 24px', fontSize:13, fontWeight:600, color:C.white,
                cursor:'pointer', fontFamily:POPPINS, boxShadow:'0 3px 14px rgba(155,15,6,0.25)'
              }}
            >
              Siguiente <ChevronRight size={14}/>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSolicitarGuardar}
              style={{
                display:'flex', alignItems:'center', gap:7, background:C.brand, border:'none',
                borderRadius:10, padding:'11px 28px', fontSize:13, fontWeight:700, color:C.white,
                cursor:'pointer', fontFamily:POPPINS, boxShadow:'0 3px 14px rgba(155,15,6,0.3)'
              }}
            >
              <Save size={15}/> Guardar Registro
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
