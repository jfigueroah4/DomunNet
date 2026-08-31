import { useState } from 'react';
import {
  ArrowLeft, Plus, Trash2, Check, Sun, Cloud, CloudRain,
  CloudLightning, CloudSun, ChevronLeft, ChevronRight,
  ClipboardList, Search, Save, Camera, FlaskConical
} from 'lucide-react';
import { RegistroBitacora } from '@/types/bitacora';
import { PROYECTOS_MOCK } from '@/data/proyectos.mock';
import { useAuthStore } from '@/stores/useAuthStore';
import { toast } from 'sonner';




/* -- Tokens --------------------------------------------------------- */
const C = {
  brand:      '#9B0F06', brandLight: 'rgba(155,15,6,0.07)', brandMid: 'rgba(155,15,6,0.14)',
  orange:     '#E85D04',
  gray900:    '#111827', gray700: '#374151', gray600: '#4B5563',
  gray500:    '#6B7280', gray400: '#9C�AF', gray300: '#D1D5DB',
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

// Nomenclatura DomunNet: Step-N-[Nombre]
const STEPS = [
  { num: 1, label: 'Info General', code: 'Step-1-InformacionGeneral' },
  { num: 2, label: 'Condiciones', code: 'Step-2-CondicionesClimaticas' },
  { num: 3, label: 'Detalle', code: 'Step-3-DetalleTrabajos' },
];

const RENGLONES_PRED: { id: string; desc: string; unidad: string }[] = [
  { id:'301.1', desc:'Excavación y corte de material',    unidad:'mÂ³' },
  { id:'301.2', desc:'Relleno y compactación',             unidad:'mÂ³' },
  { id:'302.1', desc:'Sub-base granular tipo B',           unidad:'mÂ³' },
  { id:'302.2', desc:'Mejoramiento de sub-rasante',        unidad:'mÂ³' },
  { id:'304.1', desc:'Base granular tipo B',               unidad:'mÂ³' },
  { id:'304.2', desc:'Base estabilizada con cemento',      unidad:'mÂ³' },
  { id:'401.1', desc:'Carpeta asfáltica en caliente',      unidad:'ton' },
  { id:'406.1', desc:'Cuneta de concreto triangular',      unidad:'ml' },
  { id:'407.1', desc:'Alcantarilla tubular 36"',           unidad:'ml' },
  { id:'501.1', desc:'Señalización horizontal',            unidad:'ml' },
  { id:'502.1', desc:'Señalización vertical',              unidad:'und' },
];

const ENSAYOS_LIST = ['Compactación relativa','Deflexión Benkelman','Granulometría','Límites de Atterberg','CBR','Proctor modificado'];
const RENGLONES_OBRA: { id: string; desc: string; unidad: string }[] = [
  { id:'152', desc:'Replanteo y levantamiento topografico', unidad:'' },
  { id:'153', desc:'Sistema de control de calidad de la empresa ejecutora', unidad:'' },
  { id:'201', desc:'Retiro de estructuras, servicios existentes y obstaculos', unidad:'' },
  { id:'202', desc:'Limpia chapeo y destronque', unidad:'' },
  { id:'203.03(a)', desc:'Excavacion no clasificada', unidad:'' },
  { id:'203.03(b)', desc:'Excavacion no clasificada de desperdicio', unidad:'' },
  { id:'203.03(c)', desc:'Excavacion no clasificada para prestamo', unidad:'' },
  { id:'203.03(e)', desc:'Subexcavacion', unidad:'' },
  { id:'301', desc:'Reacondicionamiento de subrasante', unidad:'' },
  { id:'302', desc:'Estabilizacion de la subrasante', unidad:'' },
  { id:'303', desc:'Sub base comun', unidad:'' },
  { id:'304', desc:'Sub base y Base granular', unidad:'' },
  { id:'401', desc:'Pavimento de concreto asfaltico en caliente', unidad:'' },
  { id:'601', desc:'Alcantarillas de tubos de concreto reforzado', unidad:'' },
  { id:'608', desc:'Cunetas revestidas', unidad:'' },
  { id:'706', desc:'Lineas, marcas y marcadores de trafico', unidad:'' },
];

const RENGLONES_CATALOGO = RENGLONES_OBRA.length > 0 ? RENGLONES_OBRA : RENGLONES_PRED;

type FormRenglonCampo = {
  id: string
  renglon: string
  estInicio: string
  estFin: string
  fotoUrl?: string
  fotoNombre?: string
  fotoGeo?: string
  obs: string
}
type FormEnsayoLab    = {
  id: string
  tipo: string
  estacion: string
  resultado: string
  minReq: string
  fotoUrl?: string
  fotoNombre?: string
  fotoGeo?: string
  obs: string
}

interface FormData {
  tipoIngreso: 'Campo' | 'Laboratorio';
  proyectoId: string;
  fecha: string;
  turno: string;
  ingeniero: string;
  ubicacion: string;
  clima: string;
  obsClima: string;
  suspensionClima: boolean;
  justSuspension: string;
  horasSuspension: string;
  renglones: FormRenglonCampo[];
  ensayos: FormEnsayoLab[];
  observacionesGenerales: string;
}

const uid = () => Math.random().toString(36).slice(2, 9);

function newRenglon(): FormRenglonCampo { return { id: uid(), renglon: '', estInicio: '', estFin: '', fotoUrl: '', fotoNombre: '', fotoGeo: '', obs: '' }; }
function newEnsayo(): FormEnsayoLab { return { id: uid(), tipo: '', estacion: '', resultado: '', minReq: '', fotoNombre: '', fotoGeo: '', obs: '' }; }

export function BitacoraForm({ onBack, onSubmit }: {
  onBack: () => void;
  onSubmit: (data: Partial<RegistroBitacora>) => void;
}) {
  const { profile: user } = useAuthStore();
  const today = new Date().toISOString().split('T')[0];
  const responsableActual = user?.nombre ?? 'Ing. Carlos Mendoza';
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [renglonSearch, setRenglonSearch] = useState('');

  const [fd, setFd] = useState<FormData>({
    tipoIngreso: 'Campo',
    proyectoId: PROYECTOS_MOCK[0]?.id ?? '',
    fecha: today,
    turno: 'Diurno',
    ingeniero: responsableActual,
    ubicacion: '',
    clima: 'Soleado',
    obsClima: '',
    suspensionClima: false,
    justSuspension: '',
    horasSuspension: '',
    renglones: [newRenglon()],
    ensayos: [newEnsayo()],
    observacionesGenerales: '',
  });

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

  /* Validate current step */
  const validateStep = (s: number): boolean => {
    const errs: Record<string, string> = {};
    if (s === 1) {
      if (!fd.proyectoId) errs.proyectoId = 'Selecciona un proyecto';
      if (!fd.ubicacion.trim()) errs.ubicacion = 'Ingresa la ubicación o estación del día';
    }
    if (s === 2) {
      if (fd.suspensionClima) {
        if (!fd.justSuspension.trim()) errs.justSuspension = 'Ingresa la justificación de la suspensión';
        if (!fd.horasSuspension || Number(fd.horasSuspension) <= 0) errs.horasSuspension = 'Ingresa un número de horas válido';
      }
    }
    if (s === 3) {
      if (fd.tipoIngreso === 'Campo') {
        const algunRenglon = fd.renglones.some(r => r.renglon !== '');
        if (!algunRenglon) errs.renglones = 'Debe seleccionar al menos un renglón de trabajo';
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
  const updateRenglon = (id: string, key: keyof FormRenglonCampo, val: string) =>
    set('renglones', fd.renglones.map(r => r.id === id ? { ...r, [key]: val } : r));
  const addRenglon    = () => set('renglones', [...fd.renglones, newRenglon()]);
  const removeRenglon = (id: string) => set('renglones', fd.renglones.filter(r => r.id !== id));

  /* Ensayos helpers */
  const updateEnsayo = (id: string, key: keyof FormEnsayoLab, val: string) =>
    set('ensayos', fd.ensayos.map(e => e.id === id ? { ...e, [key]: val } : e));
  const addEnsayo    = () => set('ensayos', [...fd.ensayos, newEnsayo()]);
  const removeEnsayo = (id: string) => set('ensayos', fd.ensayos.filter(e => e.id !== id));

  /* Manejo de Fotografía Renglón: Tomar Foto (con GPS) vs Subir Foto (sin GPS) */
  const handleTomarFotoRenglon = (id: string) => {
    updateRenglon(id, 'fotoUrl', 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=400&q=80');
    updateRenglon(id, 'fotoNombre', 'evidencia_camara_01.jpg');
    updateRenglon(id, 'fotoGeo', '14.6349Â° N, 90.5069Â° W Â· Carretera a El Salvador KM 18.5');
    toast.success('Cámara activada y foto con GPS capturada', {
      description: 'Dirección GPS: 14.6349Â° N, 90.5069Â° W',
    });
  };

  const handleSubirFotoRenglon = (id: string) => {
    updateRenglon(id, 'fotoUrl', 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=400&q=80');
    updateRenglon(id, 'fotoNombre', 'evidencia_adjunta_01.jpg');
    updateRenglon(id, 'fotoGeo', '');
    toast.success('Archivo adjuntado correctamente');
  };

  /* Manejo de Fotografía Ensayo */


  const handleGuardarRegistro = () => {
    if (!validateStep(3)) return;


    // Disparar Toast success
    toast.success('Â¡Registro de Bitácora guardado exitosamente!', {
      description: `El registro de ${fd.tipoIngreso === 'Campo' ? 'Campo' : 'Laboratorio'} ha sido almacenado en el expediente digital.`,
      duration: 4000,
    });

    onSubmit(fd as any);
  };

  const inpErr = (key: string): React.CSSProperties =>
    errors[key] ? { ...inputBase, border: `1px solid ${C.red}` } : inputBase;

  const renglonesFiltrados = RENGLONES_CATALOGO.filter((rp) => {
    const term = renglonSearch.trim().toLowerCase();
    if (!term) return true;
    return `${rp.id} ${rp.desc}`.toLowerCase().includes(term);
  });
  
  const getRenglonesOptions = (selectedId: string) => {
    if (!selectedId || renglonesFiltrados.some((rp) => rp.id === selectedId)) return renglonesFiltrados;
    const selected = RENGLONES_CATALOGO.find((rp) => rp.id === selectedId);
    return selected ? [selected, ...renglonesFiltrados] : renglonesFiltrados;
  };

  /* -- Toggle component -- */
  const Toggle = ({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) => (
    <button type="button" onClick={() => onChange(!on)} style={{
      width: 44, height: 24, borderRadius: 12, background: on ? C.brand : C.gray300,
      border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
    }}>
      <div style={{ width: 18, height: 18, borderRadius: '50%', background: C.white, position: 'absolute', top: 3, left: on ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
    </button>
  );

  const addRowBtn = (onClick: () => void, label: string) => (
    <button type="button" onClick={onClick} style={{ display:'flex', alignItems:'center', gap:6, background:C.brandLight, border:`1px dashed ${C.brandMid}`, borderRadius:8, padding:'8px 14px', fontSize:12, fontWeight:600, color:C.brand, cursor:'pointer', fontFamily:POPPINS, width:'100%', justifyContent:'center', marginTop:12 }}>
      <Plus size={13}/> {label}
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

  // Cantidad de registros en la tabla actual del Paso 3
  const countRegistrosPaso3 = fd.tipoIngreso === 'Campo' ? fd.renglones.length : fd.ensayos.length;

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
        <h2 style={{ fontSize:22, fontWeight:700, color:C.gray900, margin:'0 0 4px', fontFamily:POPPINS }}>Nuevo Registro de Bitácora</h2>
        <p style={{ fontSize:13, color:C.gray500, margin:0, fontFamily:POPPINS }}>Gestión de ingresos diarios de campo y pruebas de laboratorio</p>
      </div>

      {/* -- STEPPER (1. Info General, 2. Condiciones, 3. Detalle) -- */}
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
                    // Permitir navegación a pasos ya validados o anteriores
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

            {/* Segmented Control horizontal obligatorio: TIPO DE INGRESO ("Campo" vs "Laboratorio") */}
            <div>
              <label style={{ ...sLabel, marginBottom:8 }}>TIPO DE INGRESO *</label>
              <div style={{ display:'flex', background:C.gray100, padding:4, borderRadius:10, gap:4, border:`1px solid ${C.gray200}` }}>
                <button
                  type="button"
                  onClick={() => set('tipoIngreso', 'Campo')}
                  style={{
                    flex: 1, padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                    border: 'none', cursor: 'pointer', fontFamily: POPPINS, transition: 'all 0.2s',
                    background: fd.tipoIngreso === 'Campo' ? C.white : 'transparent',
                    color: fd.tipoIngreso === 'Campo' ? C.brand : C.gray600,
                    boxShadow: fd.tipoIngreso === 'Campo' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                  }}
                >
                  <ClipboardList size={15} /> Campo
                </button>
                <button
                  type="button"
                  onClick={() => set('tipoIngreso', 'Laboratorio')}
                  style={{
                    flex: 1, padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                    border: 'none', cursor: 'pointer', fontFamily: POPPINS, transition: 'all 0.2s',
                    background: fd.tipoIngreso === 'Laboratorio' ? C.white : 'transparent',
                    color: fd.tipoIngreso === 'Laboratorio' ? C.brand : C.gray600,
                    boxShadow: fd.tipoIngreso === 'Laboratorio' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                  }}
                >
                  <FlaskConical size={15} /> Laboratorio
                </button>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:18 }}>
              {/* Proyecto (Dropdown) */}
              <div style={{ gridColumn:'span 2' }}>
                <label style={sLabel}>PROYECTO *</label>
                <select
                  className="form-input"
                  value={fd.proyectoId}
                  onChange={e => { set('proyectoId', e.target.value); setErrors(p => ({ ...p, proyectoId: '' })); }}
                  style={inpErr('proyectoId')}
                >
                  <option value="">-- Seleccionar proyecto --</option>
                  {PROYECTOS_MOCK.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.codigo} Â· {p.nombre}
                    </option>
                  ))}
                </select>
                {errors.proyectoId && <span style={errStyle}>{errors.proyectoId}</span>}
              </div>

              {/* Fecha del Registro (Input deshabilitado / Hoy) */}
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

              {/* Turno (Dropdown) */}
              <div>
                <label style={sLabel}>TURNO *</label>
                <select className="form-input" value={fd.turno} onChange={e => set('turno', e.target.value)} style={inputBase}>
                  <option value="Diurno">Diurno</option>
                  <option value="Nocturno">Nocturno</option>
                  <option value="Múltiple">Múltiple / Continuo</option>
                </select>
              </div>

              {/* Responsable (Input de solo lectura) */}
              <div>
                <label style={sLabel}>RESPONSABLE</label>
                <input
                  className="form-input"
                  type="text"
                  value={fd.ingeniero}
                  readOnly
                  style={{ ...inputBase, background: C.gray100, color: C.gray700, fontWeight: 600, cursor: 'default' }}
                />
              </div>

              {/* Ubicación / Estación del Día (Input) */}
              <div>
                <label style={sLabel}>UBICACIÓN / ESTACIÓN DEL DÍA *</label>
                <input
                  className="form-input"
                  placeholder="Ej. KM 22+300 al KM 24+100"
                  value={fd.ubicacion}
                  onChange={e => { set('ubicacion', e.target.value); setErrors(p => ({ ...p, ubicacion: '' })); }}
                  style={inpErr('ubicacion')}
                />
                {errors.ubicacion && <span style={errStyle}>{errors.ubicacion}</span>}
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
                  <button key={key} type="button" onClick={() => set('clima', key)} style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, minHeight:100, padding:'16px 12px', borderRadius:12, border: sel ? `2px solid ${color}` : `1.5px solid ${C.gray200}`, background: sel ? `rgba(${color === '#D97706' ? '217,119,6' : color === '#0369A1' ? '3,105,161' : color === '#7C3AED' ? '124,58,237' : '107,114,128'},0.08)` : C.white, cursor:'pointer', transition:'all 0.15s' }}>
                    <Icon size={28} color={sel ? color : C.gray400}/>
                    <span style={{ fontSize:12, lineHeight:1.25, textAlign:'center', fontWeight: sel ? 700 : 500, color: sel ? color : C.gray600, fontFamily:POPPINS }}>{key}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ marginBottom:20 }}>
              <label style={sLabel}>OBSERVACIÓN CLIMÃTICA</label>
              <textarea className="form-input" rows={3} placeholder="Describe particularidades del clima durante la jornada..." value={fd.obsClima} onChange={e => set('obsClima', e.target.value)} style={{ ...inputBase, resize:'vertical' }}/>
            </div>

            {/* Switch de Suspensión por Clima */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:C.gray50, border:`1px solid ${C.gray200}`, borderRadius:10, padding:'14px 16px', marginBottom: fd.suspensionClima ? 16 : 0 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:C.gray900, fontFamily:POPPINS }}>Â¿Se suspendieron actividades por clima?</div>
                <div style={{ fontSize:11, color:C.gray500, fontFamily:POPPINS }}>Activar si hubo interrupción de labores en obra</div>
              </div>
              <Toggle on={fd.suspensionClima} onChange={v => set('suspensionClima', v)}/>
            </div>

            {/* Campos desplegados si se suspendió */}
            {fd.suspensionClima && (
              <div style={{ background:'rgba(217,119,6,0.06)', border:'1px solid rgba(217,119,6,0.2)', borderRadius:10, padding:'16px', display:'flex', flexDirection:'column', gap:14, marginTop:12 }}>
                <div>
                  <label style={sLabel}>JUSTIFICACIÓN DE SUSPENSIÓN *</label>
                  <textarea className="form-input" rows={3} placeholder="Explica detalladamente la causa de la suspensión y sectores afectados..." value={fd.justSuspension} onChange={e => { set('justSuspension', e.target.value); setErrors(p => ({ ...p, justSuspension:'' })); }} style={{ ...inpErr('justSuspension'), resize:'vertical' }}/>
                  {errors.justSuspension && <span style={errStyle}>{errors.justSuspension}</span>}
                </div>
                <div>
                  <label style={sLabel}>HORAS DE SUSPENSIÓN *</label>
                  <input className="form-input" type="number" placeholder="Ej. 3.5" value={fd.horasSuspension} onChange={e => { set('horasSuspension', e.target.value); setErrors(p => ({ ...p, horasSuspension:'' })); }} style={{ ...inpErr('horasSuspension'), maxWidth:180 }}/>
                  {errors.horasSuspension && <span style={errStyle}>{errors.horasSuspension}</span>}
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
                
                <div style={{ position:'relative', marginBottom:14 }}>
                  <Search size={14} color={C.gray400} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }} />
                  <input className="form-input" value={renglonSearch} onChange={e => setRenglonSearch(e.target.value)} placeholder="Filtrar catálogo de renglones por código o descripción..." style={{ ...inputBase, paddingLeft:34, fontSize:12 }} />
                </div>

                {errors.renglones && <div style={{ ...errStyle, marginBottom: 10 }}>{errors.renglones}</div>}

                <div className="tbl-overflow">
                  <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
                    <thead>
                      <tr style={{ background:C.gray50 }}>
                        {['Renglón','Estación Inicio','Estación Fin','Fotografía','Observaciones',''].map(h => <th key={h} style={thS}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {renglonesPaginados.map((r) => (
                        <tr key={r.id} style={{ borderBottom:`1px solid ${C.gray100}` }}>
                          <td style={{ ...tdS, minWidth:220 }}>
                            <select className="form-input" value={r.renglon} onChange={e => updateRenglon(r.id,'renglon',e.target.value)} style={{ ...inputBase, fontSize:12, padding:'6px 8px', fontWeight: 600 }}>
                              <option value="">-- Seleccionar Renglón --</option>
                              {getRenglonesOptions(r.renglon).map(rp => <option key={rp.id} value={rp.id}>{rp.id} - {rp.desc}</option>)}
                            </select>
                          </td>
                          <td style={{ ...tdS, minWidth:110 }}>
                            <input className="form-input" value={r.estInicio} onChange={e => updateRenglon(r.id,'estInicio',e.target.value)} placeholder="0+000" style={{ ...inputBase, fontSize:12, padding:'6px 8px' }}/>
                          </td>
                          <td style={{ ...tdS, minWidth:110 }}>
                            <input className="form-input" value={r.estFin} onChange={e => updateRenglon(r.id,'estFin',e.target.value)} placeholder="0+500" style={{ ...inputBase, fontSize:12, padding:'6px 8px' }}/>
                          </td>
                          <td style={{ ...tdS, minWidth:180 }}>
                            {r.fotoUrl ? (
                              <div style={{ display:'flex', flexDirection:'column', gap:2, background:C.gray50, padding:'6px 8px', borderRadius:6, border:`1px solid ${C.gray200}` }}>
                                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                  <img src={r.fotoUrl} alt="Foto" style={{ width:28, height:28, borderRadius:4, objectFit:'cover' }} />
                                  <div style={{ fontSize:10, color:C.gray700, lineHeight:1.1 }}>
                                    <span style={{ fontWeight:700, color:C.gray900, display:'block' }}>{r.fotoNombre || 'evidencia_01.jpg'}</span>
                                    <span style={{ fontSize:9, color:C.gray500 }}>Formato: JPG / HEIC</span>
                                  </div>
                                </div>
                                {r.fotoGeo && (
                                  <input
                                    type="text"
                                    readOnly
                                    value={r.fotoGeo}
                                    style={{ fontSize:9, color:C.gray600, background:C.gray100, border:`1px solid ${C.gray200}`, borderRadius:4, padding:'2px 4px', width:'100%', boxSizing:'border-box', marginTop:2 }}
                                  />
                                )}
                              </div>
                            ) : (
                              <div style={{ display:'flex', gap:4 }}>
                                <button
                                  type="button"
                                  onClick={() => handleTomarFotoRenglon(r.id)}
                                  style={{ display:'inline-flex', alignItems:'center', gap:4, background:C.gray100, border:`1px solid ${C.gray300}`, borderRadius:6, padding:'4px 8px', fontSize:11, fontWeight:600, color:C.gray700, cursor:'pointer', fontFamily:POPPINS }}
                                >
                                  <Camera size={12} color={C.gray600} /> Tomar Foto
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSubirFotoRenglon(r.id)}
                                  style={{ display:'inline-flex', alignItems:'center', gap:4, background:C.white, border:`1px solid ${C.gray300}`, borderRadius:6, padding:'4px 8px', fontSize:11, fontWeight:600, color:C.gray600, cursor:'pointer', fontFamily:POPPINS }}
                                >
                                  Subir
                                </button>
                              </div>
                            )}
                          </td>
                          <td style={{ ...tdS, minWidth:160 }}>
                            <input className="form-input" value={r.obs} onChange={e => updateRenglon(r.id,'obs',e.target.value)} placeholder="Notas..." style={{ ...inputBase, fontSize:12, padding:'6px 8px' }}/>
                          </td>
                          <td style={tdS}>{rmBtn(() => removeRenglon(r.id))}</td>
                        </tr>
                      ))}
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
                {addRowBtn(addRenglon, '+ Agregar renglón')}
              </div>
            ) : (
              /* Condición B: Laboratorio (Tabla "Ensayos") */
              <div>
                {sectionHeader('Ensayos de Laboratorio', <FlaskConical size={16} color={C.brand}/>)}

                {errors.ensayos && <div style={{ ...errStyle, marginBottom: 10 }}>{errors.ensayos}</div>}

                <div className="tbl-overflow">
                  <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
                    <thead>
                      <tr style={{ background:C.gray50 }}>
                        {['Tipo de Ensayo','Estación','Resultado','Valor Mín. Req.','Fotografía / Muestra','Observaciones',''].map(h => <th key={h} style={thS}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {fd.ensayos.map((e) => (
                        <tr key={e.id} style={{ borderBottom:`1px solid ${C.gray100}` }}>
                          <td style={{ ...tdS, minWidth:180 }}>
                            <select className="form-input" value={e.tipo} onChange={v => updateEnsayo(e.id,'tipo',v.target.value)} style={{ ...inputBase, fontSize:12, padding:'6px 8px', fontWeight:600 }}>
                              <option value="">-- Seleccionar Ensayo --</option>
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
                          <td style={{ ...tdS, minWidth:160 }}>
                            {e.fotoUrl ? (
                              <div style={{ display:'flex', alignItems:'center', gap:6, background:C.gray50, padding:'4px 8px', borderRadius:6, border:`1px solid ${C.gray200}` }}>
                                <img src={e.fotoUrl} alt="Foto Ensayo" style={{ width:28, height:28, borderRadius:4, objectFit:'cover' }} />
                                <div style={{ fontSize:10, color:C.gray600, lineHeight:1.1 }}>
                                  <span style={{ fontWeight:700, color:C.green, display:'block' }}>Adjuntada</span>
                                  <span style={{ fontSize:9, color:C.gray400 }}>{e.fotoGeo}</span>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {}}
                                style={{ display:'inline-flex', alignItems:'center', gap:5, background:C.white, border:`1px solid ${C.brand}`, borderRadius:6, padding:'5px 10px', fontSize:11, fontWeight:600, color:C.brand, cursor:'pointer', fontFamily:POPPINS }}
                              >
                                <Camera size={13} /> Foto GPS
                              </button>
                            )}
                          </td>
                          <td style={{ ...tdS, minWidth:140 }}>
                            <input className="form-input" value={e.obs} onChange={v => updateEnsayo(e.id,'obs',v.target.value)} placeholder="Observaciones..." style={{ ...inputBase, fontSize:12, padding:'6px 8px' }}/>
                          </td>
                          <td style={tdS}>{rmBtn(() => removeEnsayo(e.id))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {addRowBtn(addEnsayo, '+ Agregar ensayo')}
              </div>
            )}

            {/* REQUERIMIENTO 4: Mostrar textarea unificado de "Observaciones Generales" únicamente si se ingresan 2 o más registros */}
            {countRegistrosPaso3 >= 2 && (
              <div style={{ marginTop: 24, paddingTop: 18, borderTop: `1px solid ${C.gray200}` }}>
                <label style={sLabel}>OBSERVACIONES GENERALES DEL REGISTRO</label>
                <textarea
                  className="form-input"
                  rows={4}
                  placeholder="Observaciones integradas para los múltiples registros ingresados..."
                  value={fd.observacionesGenerales}
                  onChange={e => set('observacionesGenerales', e.target.value)}
                  style={{ ...inputBase, resize:'vertical' }}
                />
              </div>
            )}
          </div>
        )}
      </div>

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
              onClick={handleGuardarRegistro}
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


















